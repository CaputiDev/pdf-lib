# ⚙️ PDF Library — Backend

Este é o **backend** da **PDF Library**, uma API RESTful de alta performance projetada para gerenciar, catalogar e ler arquivos PDF localmente. O backend serve de fundação para o frontend do ecossistema, fornecendo endpoints seguros, busca estruturada e streaming de arquivos pesados.

O sistema é construído sobre o ecossistema **NestJS** utilizando **Prisma ORM** e banco de dados **PostgreSQL**, estruturado segundo os preceitos de **Clean Architecture Modular (Vertical Slicing)** e princípios **SOLID**.

---

## 📖 Documentações Detalhadas

Para se aprofundar na engenharia do backend e aprender a rodar o ambiente completo, consulte os arquivos abaixo:

* 📐 **[Estrutura & Arquitetura (structure.md)](structure.md)**
  * Detalhes sobre a arquitetura de fatias verticais (Vertical Slicing), a separação em camadas `core/` (Domain + Application) e `infrastructure/` (NestJS, Banco, Storage), e fluxo de dados.
* 🤝 **[Guia de Contribuição (contributing.md)](contributing.md)**
  * Instruções passo a passo sobre como configurar o PostgreSQL via Docker, rodar migrations do Prisma, executar testes unitários/E2E com Jest, gerar dados e visualizar a cobertura.

---

## ✨ Funcionalidades Principais

* **Armazenamento Seguro:** Upload local de arquivos PDF validados com Multer.
* **Streaming de Alta Performance:** Transmissão de PDFs pesados por stream de bytes, evitando sobrecarga na memória RAM do servidor.
* **Catálogo de Metadados:** Armazenamento relacional de dados dos documentos (Título, Autor, Tags, Proprietário) vinculados ao banco de dados.
* **Segurança Robusta:** Autenticação por JSON Web Tokens (JWT) com estratégias Passport protegendo rotas críticas de escrita e exclusão.
* **Documentação Automatizada:** API totalmente mapeada com Swagger, acessível de forma interativa.

---

## 🚀 Como Iniciar Rápido Localmente

### Pré-requisitos
* **Node.js (v18+)**
* **Docker & Docker Compose**

### 1. Instalar as Dependências
Dentro do diretório `/server`, execute:
```bash
npm install
```

### 2. Configurar o Arquivo `.env`
Duplique o arquivo `.env.example` para `.env` e configure as credenciais:
```bash
cp .env.example .env
```
*(Certifique-se de que a string de conexão DATABASE_URL coincide com as credenciais do seu Docker)*

### 3. Subir o Banco de Dados (Docker)
Inicie o container do PostgreSQL em background:
```bash
docker-compose up -d
```

### 4. Executar as Migrations do Banco
Aplique as tabelas no PostgreSQL:
```bash
npx prisma migrate dev
```

### 5. Iniciar a API em Desenvolvimento
Rode o NestJS em modo de observação (watch):
```bash
npm run start:dev
```
A API estará de pé em `http://localhost:3000`. Acesse a documentação interativa em:
👉 **`http://localhost:3000/swagger`**
