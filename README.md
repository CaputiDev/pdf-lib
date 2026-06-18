# 📚 Local PDF Library API

Uma API RESTful robusta desenvolvida para gerenciar, catalogar e ler arquivos PDF localmente, inspirada na organização de bibliotecas digitais de jogos e pautada na filosofia open-source.

Este projeto foi desenvolvido como requisito de avaliação para a disciplina de **Frameworks de Backend**, parte do curso de **Sistemas para a Internet** no **IFSul - Câmpus Charqueadas**.

---

## ✨ Funcionalidades

- **Gerenciamento de Arquivos:** Upload local de arquivos PDF interceptados e validados via Multer.
- **Streaming de Leitura:** Rota otimizada que devolve o documento em formato de *stream* de dados, permitindo a leitura de PDFs pesados sem sobrecarregar a memória RAM do servidor.
- **Catálogo de Metadados:** Armazenamento de informações do documento (Título, Autor, Tamanho, Data de Upload) com relacionamentos no banco de dados.
- **Busca e Paginação:** Listagem eficiente de documentos com suporte a filtros e paginação.
- **Segurança:** Autenticação via JSON Web Tokens (JWT) protegendo as rotas de criação e exclusão de arquivos.
- **Documentação Interativa:** API totalmente documentada via Swagger.

---

## 🛠️ Tecnologias Utilizadas

A arquitetura do projeto foi construída utilizando o ecossistema Node.js, com forte foco em tipagem e boas práticas (Arquitetura Modular e Injeção de Dependências).

- **Linguagem:** TypeScript
- **Framework Core:** NestJS
- **Banco de Dados:** PostgreSQL (via Docker)
- **ORM:** Prisma
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
git clone [https://github.com/seu-usuario/pdf-library-api.git](https://github.com/seu-usuario/pdf-library-api.git)
cd pdf-library-api