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
      .expect(200)
      .expect('Hello World!');
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

  afterEach(async () => {
    await app.close();
  });
});
