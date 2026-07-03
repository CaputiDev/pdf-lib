# 🤝 Guia de Contribuição — Backend

Agradecemos o seu interesse em contribuir com a API RESTful (backend) do **PDF Library**! Este documento orientará você sobre a configuração do ambiente, execução de testes, padrões de código e submissão de pull requests.

---

## 🛠️ Configuração do Ambiente de Desenvolvimento

### 1. Pré-requisitos
Certifique-se de ter instalado em seu computador:
* **Node.js** (versão 18 ou superior)
* **Docker** e **Docker Compose**
* Um terminal Bash ou PowerShell

### 2. Configurando o Projeto
Acesse o diretório `/server`, instale as dependências e gere o Prisma Client:
```bash
npm install
```
*(Nota: A geração automática do Prisma Client é disparada logo após a instalação).*

### 3. Banco de Dados e Variáveis de Ambiente
1. Copie o arquivo de exemplo de ambiente:
   ```bash
   cp .env.example .env
   ```
2. Inicialize o container do PostgreSQL em background:
   ```bash
   docker-compose up -d
   ```
3. Aplique as tabelas no banco de dados através das migrations:
   ```bash
   npx prisma migrate dev
   ```

### 4. Rodando o Servidor NestJS
Rode a aplicação localmente com recarregamento em tempo real:
```bash
npm run start:dev
```
A API estará escutando no endereço `http://localhost:3000`.

---

## 🧪 Testes Automatizados

Escrever testes é essencial para garantir que as alterações não introduzam regressões nas regras de negócio da biblioteca de PDFs.

### 1. Testes Unitários (Core/Use Cases)
Valida a lógica dos casos de uso, filtros e regras internas isolando o banco de dados.
```bash
npm run test
```

### 2. Testes de Integração / E2E (HTTP/Prisma)
Executa chamadas HTTP reais e transações no banco de dados para validar rotas e guards de segurança.
> **Atenção:** Certifique-se de que o container do PostgreSQL esteja de pé ao rodar este teste.
```bash
npm run test:e2e
```

### 3. Cobertura de Código
Para analisar o percentual de cobertura de código do backend:
```bash
npm run test:cov
```

---

## 📖 Swagger (Documentação de Rotas)

Nossa API utiliza o **Swagger** para gerar documentação interativa das rotas.
* Ao criar ou alterar endpoints em controladores, utilize os decoradores adequados da biblioteca `@nestjs/swagger` (ex: `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`, `@ApiBody()`) para manter a documentação atualizada.
* A documentação está disponível no endereço local: `http://localhost:3000/swagger`.

---

## 📐 Padrões e Commits

* **Linter & Formatação:** Execute `npm run lint` para checar regras de sintaxe e `npm run format` para formatar os arquivos via Prettier.
* **Mensagens de Commit:** Siga a convenção de **Conventional Commits** (ex: `feat(documents): add compression filter`, `fix(auth): correct token validation logic`).

---

## 📥 Fluxo de Trabalho (PR)

1. Crie uma nova branch a partir de `main` (ex: `feat/document-metadata`).
2. Implemente seu código e adicione os testes correspondentes (especialmente unitários em `core/use-cases`).
3. Rode `npm run lint` e certifique-se de que todas as suítes de testes (`npm run test` e `npm run test:e2e`) passam sem erros.
4. Faça o commit seguindo os commits convencionais.
5. Abra um Pull Request e descreva de forma sucinta suas alterações.
