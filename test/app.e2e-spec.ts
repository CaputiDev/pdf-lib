import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

    // 2. Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'password123' })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('access_token');
    const token = loginResponse.body.access_token;

    // 3. Access protected route without token (should fail with 401)
    await request(app.getHttpServer())
      .post('/documents')
      .expect(401);

    // 4. Access protected route with token but invalid data (should fail with 400 because title/file is missing, proving auth succeeded!)
    const invalidUploadResponse = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(invalidUploadResponse.body.message).toContain('O arquivo PDF é obrigatório.');
  });

  afterEach(async () => {
    await app.close();
  });
});
