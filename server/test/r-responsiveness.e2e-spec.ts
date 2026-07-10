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

describe('R - Responsiveness (Desempenho e Tempo de Resposta)', () => {
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

  afterAll(async () => {
    const testUploadsDir = path.resolve(process.cwd(), 'uploads-test');
    if (fs.existsSync(testUploadsDir)) {
      await fs.promises.rm(testUploadsDir, { recursive: true, force: true });
    }
  });

  it('deve responder o fluxo de autenticação (Login) em menos de 1000ms', async () => {
    const email = `perf-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Perf User' })
      .expect(201);

    const startTime = Date.now();
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000);
  });

  it('deve responder o stream de documento público em menos de 1000ms', async () => {
    const email = `perfstream-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Perf Stream User' })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    const token = login.body.access_token;

    const upload = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 ... mock pdf content ...'), 'sample.pdf')
      .field('title', 'Performance Test Doc')
      .expect(201);
    const docId = upload.body.id;

    const startTime = Date.now();
    await request(app.getHttpServer())
      .get(`/documents/${docId}/stream`)
      .expect(200);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000);
  });
});
