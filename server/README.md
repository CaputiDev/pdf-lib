# 📚 PDF Library

Uma API RESTful desenvolvida para gerenciar, catalogar e ler arquivos PDF localmente, inspirada na organização de bibliotecas digitais de jogos e pautada na filosofia open-source. Esse projeto foi desenvolvido como parte do curso de **Sistemas para a Internet** no **IFSul - Câmpus Charqueadas**.

---

## ✨ Funcionalidades

- **Gerenciamento de Arquivos:** Upload local de arquivos PDF interceptados e validados via Multer.
- **Streaming de Leitura:** Rota otimizada que devolve o documento em formato de _stream_ de dados, permitindo a leitura de PDFs pesados sem sobrecarregar a memória RAM do servidor.
- **Catálogo de Metadados:** Armazenamento de informações do documento (Título, Autor, Tamanho, Data de Upload) com relacionamentos no banco de dados.
- **Busca e Paginação:** Listagem eficiente de documentos com suporte a filtros e paginação.
- **Segurança:** Autenticação via JSON Web Tokens (JWT) protegendo as rotas de criação e exclusão de arquivos.
- **Documentação Interativa:** API totalmente documentada via Swagger.

---

## 🛠️ Tecnologias Utilizadas

A arquitetura do projeto foi construída utilizando o ecossistema Node.js sob os preceitos de **Clean Architecture Modular** e os **Princípios SOLID**. O projeto prioriza o alto desacoplamento do domínio de negócio em relação a frameworks e detalhes de implementação (como bancos de dados e sistemas de arquivos), viabilizado pela **Inversão de Dependência (IoC)**.

- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Framework Core:** [NestJS](https://nestjs.com/) (utilizado estritamente na camada de infraestrutura)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (via Docker)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Autenticação e Segurança:** Passport.js, JWT, Bcrypt
- **Manipulação de Arquivos:** Multer
- **Testes:** Jest

---

## ⚙️ Pré-requisitos

Antes de começar, você precisará ter as seguintes ferramentas instaladas em sua máquina:

- [Node.js](https://nodejs.org/en/) (versão 18+)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- Um gerenciador de pacotes (NPM ou Yarn)

---

## 🚀 Como Executar o Projeto Localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/caputidev/pdf-lib

cd pdf-lib
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto e configure as variáveis de ambiente baseando-se no arquivo [`.env.example`](./.env.example):

```bash

DATABASE_URL="postgresql://admin:admin@localhost:5433/pdflibrary?schema=public"

JWT_SECRET="sua-chave-secreta-super-segura"

PORT=3000

```

### 4. Subir o Banco de Dados (Docker)

Inicie o container do PostgreSQL mapeado no arquivo [`docker-compose.yml`](./docker-compose.yml):

```bash
docker-compose up -d
```

### 5. Executar as Migrations do Prisma

Aplique as migrations existentes no banco de dados e gere o cliente do Prisma:

```bash
npx prisma migrate dev
```

### 6. Iniciar a Aplicação

Execute a aplicação em modo de desenvolvimento:

```bash
npm run start:dev
```

Ou execute a aplicação compilada em **Produção** (máxima performance e otimização):

1. Compile o código TypeScript para JavaScript nativo (pasta `dist/`):

   ```bash
   npm run build
   ```

2. Inicie o servidor Node.js em modo de produção:

   ```bash
   npm run start:prod
   ```

A API estará rodando em `http://localhost:3000`.

---

## 📖 Documentação da API (Swagger)

Com o servidor rodando, você pode acessar a documentação interativa com todos os endpoints, schemas e simulações de requisições através do link:

👉 [http://localhost:3000/swagger](http://localhost:3000/swagger)

---

## 🧪 Como Executar os Testes

O projeto possui suítes de testes automatizados para garantir a estabilidade e funcionamento correto das regras de negócio e integrações.

### 1. Testes Unitários

Os testes unitários validam o comportamento isolado das regras de negócio, incluindo entidades de domínio, casos de uso e filtros.

```bash
npm run test
```

### 2. Testes de Integração / E2E (Ponta a Ponta)

Os testes E2E validam o fluxo completo das requisições HTTP reais, passando pelos controladores, guards de segurança JWT, pipes de validação e filtros globais.

> **Importante:** Certifique-se de que o banco de dados PostgreSQL (via Docker Compose) está ativo no momento da execução.

```bash
npm run test:e2e
```

### 3. Cobertura de Código

Para analisar o percentual de cobertura de testes de todo o projeto:

```bash
npm run test:cov
```

---

## 🏗️ Estrutura Arquitetural

O projeto adota uma abordagem de **Clean Architecture Modular (Vertical Slicing)**. Cada fatia vertical do sistema (módulo) representa uma funcionalidade de negócios autônoma e é subdividida para isolar o núcleo das regras de negócio de agentes externos.

Abaixo é apresentada a organização interna de um módulo de negócios (utilizando `documents` como exemplo):

```text
src/
├── common/                  # Recursos globais e reaproveitáveis (decorators, guards, filters, etc.)
├── config/                  # Configurações globais (variáveis de ambiente, setup do Prisma)
└── modules/                 # Módulos de negócio da aplicação (Vertical Slices)
    ├── auth/                # Módulo de autenticação
    ├── users/               # Módulo de usuários
    └── documents/           # Exemplo de Clean Architecture Modular
        ├── core/            # Camada de Domínio e Aplicação (Isolada de frameworks)
        │   ├── entities/    # Regras de negócio essenciais e modelos de dados
        │   ├── repositories/# Interfaces/contratos de acesso a dados (Inversão de Dependência)
        │   └── use-cases/   # Casos de uso do domínio (upload, streaming, listagem)
        └── infrastructure/  # Camada de Detalhes de Implementação e Framework
            ├── http/        # Controladores NestJS, interceptores e DTOs de entrada/saída
            ├── database/    # Implementações concretas de repositórios (Prisma/PostgreSQL)
            └── storage/     # Implementações de gravação/leitura de arquivos físicos (Multer/fs)
```

### 🧠 Princípios de Divisão de Responsabilidades

- **Camada `core` (Domain & Application):** Contém as regras de negócio puras e os casos de uso. Esta camada é 100% isolada e "desconhece" a existência do NestJS, do banco de dados (Prisma/PostgreSQL) ou do sistema de arquivos físico. Ela se comunica com o mundo externo exclusivamente através de interfaces e inversão de controle.
- **Camada `infrastructure` (Infrastructure & Adapter):** Lida diretamente com as tecnologias e frameworks externos. Ela implementa os repositórios definidos no `core`, provê os controladores HTTP integrados ao NestJS, realiza consultas no banco de dados e executa manipulações de arquivos reais (leitura por stream ou upload via Multer).

---

## 👨‍💻 Autor

<table>
  <tr>
    <td align="center" valign="top">
      <a href="https://github.com/caputidev">
        <img src="https://github.com/caputidev.png" width="200px;" style="border-radius: 50%;" alt="Caputi Dev"/><br />
        <sub><b>Caputi Dev</b></sub>
      </a>
    </td>
  </tr>
</table>
