/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/config/prisma/prisma.service';

describe('V - Verbs (Métodos HTTP)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

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
    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.document.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  it('GET / -> deve redirecionar para o Swagger', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(302)
      .expect('Location', '/swagger');
  });

  it('POST /auth/register e POST /auth/login -> devem cadastrar e autenticar um usuário com sucesso', async () => {
    const email = `verbs-${Date.now()}@example.com`;
    
    // Cadastro
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Verbs User' })
      .expect(201);
    expect(registerRes.body).toHaveProperty('id');

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    expect(loginRes.body).toHaveProperty('access_token');
  });

  it('POST, GET, PATCH e DELETE /documents -> deve permitir fluxo completo de CRUD do documento', async () => {
    // 1. Setup User
    const email = `verbs-crud-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'CRUD User' })
      .expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    const token = loginRes.body.access_token;

    // 2. POST (Upload)
    const uploadRes = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 ... content ...'), 'verbs-test.pdf')
      .field('title', 'Verbs Document Title')
      .field('author', 'Test Writer')
      .expect(201);
    const docId = uploadRes.body.id;
    expect(docId).toBeDefined();

    // 3. GET (List)
    const listRes = await request(app.getHttpServer())
      .get('/documents')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listRes.body.documents.some((d: any) => d.id === docId)).toBe(true);

    // 4. GET (Stream)
    const streamRes = await request(app.getHttpServer())
      .get(`/documents/${docId}/stream`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(streamRes.headers['content-type']).toContain('application/pdf');

    // 5. PATCH (Update)
    const updateRes = await request(app.getHttpServer())
      .patch(`/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Verbs Title' })
      .expect(200);
    expect(updateRes.body.title).toBe('Updated Verbs Title');

    // 6. DELETE (Remove)
    await request(app.getHttpServer())
      .delete(`/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verificar que foi deletado do list
    const listAfterDelete = await request(app.getHttpServer())
      .get('/documents')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listAfterDelete.body.documents.some((d: any) => d.id === docId)).toBe(false);
  });
});
