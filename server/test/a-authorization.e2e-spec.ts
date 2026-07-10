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

describe('A - Authorization (Autorização e Segurança)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tokenA: string;
  let tokenB: string;
  let docIdA: string;

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

    // Registrar e autenticar Usuário A
    const emailA = `usera-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: emailA, password: 'password123', name: 'User A' })
      .expect(201);
    const loginA = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: emailA, password: 'password123' })
      .expect(200);
    tokenA = loginA.body.access_token;

    // Registrar e autenticar Usuário B
    const emailB = `userb-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: emailB, password: 'password123', name: 'User B' })
      .expect(201);
    const loginB = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: emailB, password: 'password123' })
      .expect(200);
    tokenB = loginB.body.access_token;

    // Usuário A faz upload de um documento privado
    const uploadRes = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('file', Buffer.from('TOP SECRET CONTENT'), 'secret.pdf')
      .field('title', 'Secret Document')
      .field('isPrivate', 'true')
      .expect(201);
    docIdA = uploadRes.body.id;
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

  it('deve retornar 401 Unauthorized ao acessar rotas protegidas sem token', async () => {
    await request(app.getHttpServer()).post('/documents').expect(401);
    await request(app.getHttpServer()).patch(`/documents/${docIdA}`).expect(401);
    await request(app.getHttpServer()).delete(`/documents/${docIdA}`).expect(401);
  });

  it('deve impedir que o Usuário B (não proprietário) edite o documento do Usuário A', async () => {
    await request(app.getHttpServer())
      .patch(`/documents/${docIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hacked Title' })
      .expect(403);
  });

  it('deve impedir que o Usuário B (não proprietário) delete o documento do Usuário A', async () => {
    await request(app.getHttpServer())
      .delete(`/documents/${docIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });

  it('deve impedir que o Usuário B acesse o stream do documento privado do Usuário A', async () => {
    await request(app.getHttpServer())
      .get(`/documents/${docIdA}/stream`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });

  it('deve impedir que usuário anônimo acesse o stream do documento privado', async () => {
    await request(app.getHttpServer())
      .get(`/documents/${docIdA}/stream`)
      .expect(403);
  });

  it('deve rejeitar streaming de documentos privados usando token via Query Parameter (remover suporte)', async () => {
    await request(app.getHttpServer())
      .get(`/documents/${docIdA}/stream?token=${tokenA}`)
      .expect(403);
  });

  it('deve omitir documento privado do Usuário A na listagem para usuários anônimos e para o Usuário B', async () => {
    // Listagem Anônima
    const listAnon = await request(app.getHttpServer())
      .get('/documents')
      .expect(200);
    expect(listAnon.body.documents.some((d: any) => d.id === docIdA)).toBe(false);

    // Listagem do Usuário B
    const listUserB = await request(app.getHttpServer())
      .get('/documents')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    expect(listUserB.body.documents.some((d: any) => d.id === docIdA)).toBe(false);
  });

  it('deve exibir o documento privado do Usuário A na listagem de seu próprio dono (Usuário A)', async () => {
    const listUserA = await request(app.getHttpServer())
      .get('/documents')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const foundDoc = listUserA.body.documents.find((d: any) => d.id === docIdA);
    expect(foundDoc).toBeDefined();
    expect(foundDoc.isPrivate).toBe(true);
  });
});
