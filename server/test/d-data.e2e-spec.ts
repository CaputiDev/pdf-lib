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

  afterAll(async () => {
    const testUploadsDir = path.resolve(process.cwd(), 'uploads-test');
    if (fs.existsSync(testUploadsDir)) {
      await fs.promises.rm(testUploadsDir, { recursive: true, force: true });
    }
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

  it('deve realizar busca e filtros por query (search, tag, username) corretivos', async () => {
    // 1. Upload de documento com título, autor e tag específicos
    await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 ...'), 'specific.pdf')
      .field('title', 'Special Alpha Document')
      .field('author', 'Unique Author Name')
      .field('tags', 'alpha,test')
      .expect(201);

    // 2. Filtrar por termo de busca no título (search)
    const searchRes = await request(app.getHttpServer())
      .get('/documents?search=Alpha')
      .expect(200);
    expect(searchRes.body.documents.length).toBe(1);
    expect(searchRes.body.documents[0].title).toBe('Special Alpha Document');

    // 3. Filtrar por tag (tag)
    const tagRes = await request(app.getHttpServer())
      .get('/documents?tag=alpha')
      .expect(200);
    expect(tagRes.body.documents.length).toBe(1);
    expect(tagRes.body.documents[0].tags).toContain('alpha');

    // 4. Filtrar por username (username do uploader: "Data User")
    const usernameRes = await request(app.getHttpServer())
      .get('/documents?username=Data')
      .expect(200);
    expect(usernameRes.body.documents.length).toBe(1);
  });

  it('deve validar limites e paginação corretos', async () => {
    // 1. Enviar 2 documentos
    await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 ...'), 'doc1.pdf')
      .field('title', 'Document One')
      .expect(201);

    await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 ...'), 'doc2.pdf')
      .field('title', 'Document Two')
      .expect(201);

    // 2. Buscar com limite = 1
    const paginatedRes = await request(app.getHttpServer())
      .get('/documents?limit=1&page=1')
      .expect(200);

    expect(paginatedRes.body.documents.length).toBe(1);
    expect(paginatedRes.body.total).toBe(2);
    expect(paginatedRes.body.pages).toBe(2);
    expect(paginatedRes.body.page).toBe(1);
    expect(paginatedRes.body.limit).toBe(1);
  });
});
