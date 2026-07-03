# 🖥️ PDF Library — Frontend

Este é o **frontend** da aplicação **PDF Library**, uma interface web moderna de biblioteca para catalogação, upload e leitura de documentos PDF.

O projeto é construído com foco em **Clean Architecture** (Arquitetura Limpa), buscando o máximo desacoplamento entre a interface de usuário (React), a lógica de negócio (Use Cases) e os detalhes de infraestrutura (como conexões HTTP e storage local).

---

## 📖 Documentações Detalhadas

Para mais detalhes sobre as entranhas do projeto e como contribuir, consulte os arquivos abaixo:

* 📐 **[Estrutura & Arquitetura (structure.md)](structure.md)**
  * Detalhamento sobre a divisão em camadas (UI, Application, Domain, Infrastructure), regras de dependência enforçadas e design tokens.
* 🤝 **[Guia de Contribuição (contributing.md)](contributing.md)**
  * Instruções passo a passo sobre o fluxo de desenvolvimento, testes com Vitest, padrões de commits convencionais e regras de estilo.

---

## 🛠️ Stack Tecnológica

* **Framework:** React 19
* **Build Tool:** Vite
* **Linguagem:** TypeScript
* **Roteamento:** React Router v7
* **Estilo:** CSS Modules (Vanilla CSS)
* **Gerenciamento de Estado:** Zustand (apenas para persistência de sessão de autenticação)
* **Testes:** Vitest + Testing Library

---

## 🚀 Como Iniciar Localmente

### Pré-requisitos
Certifique-se de que possui o **Node.js (v18+)** instalado.

### 1. Instalar as dependências
No diretório `client/`, execute:
```bash
npm install
```

### 2. Rodar em ambiente de desenvolvimento
Inicie o Vite:
```bash
npm run dev
```
A aplicação estará disponível em `http://localhost:5173` (ou na porta indicada no terminal).

### 3. Gerar a build de produção
Para compilar e otimizar o projeto para produção:
```bash
npm run build
```

### 4. Visualizar a build localmente
Para servir a versão compilada localmente:
```bash
npm run preview
```

---

## 🧪 Como Testar

Os testes do frontend são desenvolvidos utilizando **Vitest** e **React Testing Library** para testar os componentes de UI, hooks e casos de uso de forma isolada.

### Executar os testes
Para rodar toda a suíte de testes unitários:
```bash
npm run test
```

### Modo de desenvolvimento (Watch Mode)
Para rodar os testes e assistir a alterações nos arquivos em tempo real:
```bash
npm run test:watch
```
