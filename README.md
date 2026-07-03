# 📚 PDF Library

A **PDF Library** é um ecossistema completo para gerenciar, catalogar e ler arquivos PDF localmente, com uma interface inspirada em bibliotecas de jogos digitais e foco em alta performance e qualidade de código. 

O projeto é dividido em duas partes principais:
1. **Frontend (Client):** Aplicação de página única (SPA) rica e moderna desenvolvida em React 19, TypeScript e Vite.
2. **Backend (Server):** API RESTful modular construída em NestJS, utilizando PostgreSQL (via Docker) e Prisma ORM.

---

## 🗺️ Navegação da Documentação

Para entender o funcionamento, a arquitetura e como rodar cada parte do ecossistema, acesse os links das documentações específicas abaixo:

* 🖥️ **[Documentação do Frontend (React)](client/README.md)**
  * Saiba como rodar a interface web, entenda a estrutura de Clean Architecture no client e veja como contribuir.
* ⚙️ **[Documentação do Backend (NestJS)](server/README.md)**
  * Aprenda a subir o banco de dados PostgreSQL com Docker, rodar as migrations do Prisma, explorar a documentação do Swagger e contribuir com a API.

---

## 🛠️ Tecnologias Principais do Ecossistema

* **Frontend:** React 19, Vite, TypeScript, CSS Modules, Vitest, Zustand.
* **Backend:** NestJS, Prisma, PostgreSQL, Docker, Jest, Passport/JWT, Swagger.
* **Ferramentas de Qualidade:** ESLint, Prettier, Husky, Lint-Staged, Conventional Commits.

---

## 🚀 Como Começar

Cada pasta contém seu próprio conjunto de configurações e dependências. Recomenda-se abrir terminais separados para rodar o cliente e o servidor:

1. **Configurando e Iniciando o Backend:**
   Consulte o guia de inicialização em [server/README.md](server/README.md) para configurar o `.env`, subir o banco de dados com `docker-compose up -d` e rodar as migrations.
   
2. **Configurando e Iniciando o Frontend:**
   Consulte o guia em [client/README.md](client/README.md) para iniciar o servidor de desenvolvimento com `npm run dev`.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).
