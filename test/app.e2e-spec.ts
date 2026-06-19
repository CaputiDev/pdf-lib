import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(302)
      .expect('Location', '/swagger');
  });

  it('should register a new user, login, and access protected route', async () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const signupData = {
      email: uniqueEmail,
      password: 'password123',
      name: 'E2E Test User',
    };

    // 1. Register
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(signupData)
      .expect(201);

    expect(registerResponse.body).toHaveProperty('id');
    expect(registerResponse.body.email).toBe(uniqueEmail);

    // 2. Register again with same email (should fail with 409 Conflict via GlobalExceptionFilter)
    const duplicateRegisterResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(signupData)
      .expect(409);

    expect(duplicateRegisterResponse.body).toHaveProperty('statusCode', 409);
    expect(duplicateRegisterResponse.body.message[0]).toContain('já está cadastrado.');

    // 3. Login with wrong credentials (should fail with 401 Unauthorized via GlobalExceptionFilter)
    const invalidLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'wrongpassword' })
      .expect(401);

    expect(invalidLoginResponse.body).toHaveProperty('statusCode', 401);
    expect(invalidLoginResponse.body.message[0]).toContain('E-mail ou senha inválidos.');

    // 4. Login successfully
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'password123' })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('access_token');
    const token = loginResponse.body.access_token;

    // 5. Access protected route without token (should fail with 401)
    await request(app.getHttpServer())
      .post('/documents')
      .expect(401);

    // 6. Access protected route with token but invalid data (should fail with 400 because file is missing, proving auth succeeded!)
    const invalidUploadResponse = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Document' })
      .expect(400);

    expect(invalidUploadResponse.body.message[0]).toContain('O arquivo PDF é obrigatório.');

    // 7. Request a non-existent document ID (should fail with 404 Not Found via GlobalExceptionFilter)
    const notFoundResponse = await request(app.getHttpServer())
      .get('/documents/00000000-0000-0000-0000-000000000000/stream')
      .expect(404);

    expect(notFoundResponse.body).toHaveProperty('statusCode', 404);
  });

  it('should handle document editing (PATCH) with ownership security validation', async () => {
    // 1. Register and login User A (owner)
    const emailA = `usera-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: emailA, password: 'password123', name: 'User A' })
      .expect(201);
    const loginA = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: emailA, password: 'password123' })
      .expect(200);
    const tokenA = loginA.body.access_token;

    // 2. Register and login User B (attacker)
    const emailB = `userb-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: emailB, password: 'password123', name: 'User B' })
      .expect(201);
    const loginB = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: emailB, password: 'password123' })
      .expect(200);
    const tokenB = loginB.body.access_token;

    // 3. User A uploads a document
    const uploadRes = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('file', Buffer.from('%PDF-1.4 ... mock pdf content ...'), 'sample.pdf')
      .field('title', 'Original Document Title')
      .field('author', 'Original Writer')
      .field('tags', 'pdf,first')
      .expect(201);

    const docId = uploadRes.body.id;

    // 4. User B tries to edit User A's document (should fail with 403 Forbidden)
    await request(app.getHttpServer())
      .patch(`/documents/${docId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hacked Title' })
      .expect(403);

    // 5. User A updates their document (should succeed)
    const updateRes = await request(app.getHttpServer())
      .patch(`/documents/${docId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'New Document Title',
        author: 'New Writer',
        tags: ['pdf', 'updated'],
      })
      .expect(200);

    expect(updateRes.body.title).toBe('New Document Title');
    expect(updateRes.body.author).toBe('New Writer');
    expect(updateRes.body.tags).toEqual(['pdf', 'updated']);

    // 6. User A tries to edit with invalid title (should fail with 400 Bad Request)
    await request(app.getHttpServer())
      .patch(`/documents/${docId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '' })
      .expect(400);

    // 7. User A tries to edit non-existent document (should fail with 404 Not Found)
    await request(app.getHttpServer())
      .patch('/documents/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Valid Title' })
      .expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
