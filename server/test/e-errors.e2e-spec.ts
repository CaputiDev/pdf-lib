/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/config/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

describe('E - Errors (Tratamento de Erros e Status Codes)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  let docId: string;
  const uniqueEmail = `errors-${Date.now()}@example.com`;

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

    // Criar usuário para testar erros autenticados
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'password123', name: 'Errors User' })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'password123' })
      .expect(200);
    token = login.body.access_token;

    const upload = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 ...'), 'file.pdf')
      .field('title', 'Errors Test Title')
      .expect(201);
    docId = upload.body.id;
  });

  afterEach(async () => {
    await prisma.document.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  afterAll(async () => {
    const testUploadsDir = path.resolve(process.cwd(), 'uploads-test');
    if (fs.existsSync(testUploadsDir)) {
      await fs.promises.rm(testUploadsDir, { recursive: true, force: true });
    }
  });

  it('400 Bad Request: deve falhar ao enviar requisição sem arquivo PDF no upload', async () => {
    const res = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'No File Document' })
      .expect(400);

    expect(res.body.message[0]).toContain('PDF file is required.');
  });

  it('400 Bad Request: deve falhar ao tentar editar com título inválido (vazio)', async () => {
    await request(app.getHttpServer())
      .patch(`/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' })
      .expect(400);
  });

  it('401 Unauthorized: deve falhar no login com senha incorreta', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'wrongpassword' })
      .expect(401);

    expect(res.body.message[0]).toContain('Invalid email or password.');
  });

  it('404 Not Found: deve falhar ao buscar stream, editar ou deletar com ID inexistente', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    
    await request(app.getHttpServer())
      .get(`/documents/${fakeId}/stream`)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/documents/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Valid Title' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/documents/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('409 Conflict: deve falhar ao tentar registrar com e-mail duplicado', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'password123', name: 'Duplicate User' })
      .expect(409);

    expect(res.body.message[0]).toContain('Email address is already in use.');
  });
});
