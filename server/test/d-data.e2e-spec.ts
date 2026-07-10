/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/config/prisma/prisma.service';

describe('D - Data (Dados e Validações)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;

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

    const email = `data-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Data User' })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    token = login.body.access_token;
  });

  afterEach(async () => {
    await prisma.document.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  it('deve permitir upload de documento com tags passadas como string vazia', async () => {
    const res = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 ... content ...'), 'sample.pdf')
      .field('title', 'Empty Tags Doc')
      .field('tags', '')
      .expect(201);

    expect(res.body.tags).toEqual([]);
  });

  it('deve permitir upload omitindo completamente o campo de tags', async () => {
    const res = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 ... content ...'), 'sample.pdf')
      .field('title', 'Omitted Tags Doc')
      .expect(201);

    expect(res.body.tags).toEqual([]);
  });

  it('deve descriptografar e retornar o conteúdo original do arquivo privado ao realizar stream', async () => {
    const fileContent = 'ENCRYPTED_PDF_FILE_VAL_TEST';
    
    const uploadRes = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from(fileContent), 'secret.pdf')
        .field('title', 'Decryption Test Doc')
        .field('isPrivate', 'true')
        .expect(201);

    const streamRes = await request(app.getHttpServer())
      .get(`/documents/${uploadRes.body.id}/stream`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(streamRes.body.toString()).toBe(fileContent);
  });
});
