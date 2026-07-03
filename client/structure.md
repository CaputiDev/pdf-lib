# 📐 Estrutura & Arquitetura — Frontend

O frontend do **PDF Library** segue os princípios da **Arquitetura Limpa (Clean Architecture)**. Esta abordagem visa desacoplar a lógica de negócio central de tecnologias e detalhes externos, como a biblioteca de renderização (React) ou o mecanismo de comunicação com o servidor (Fetch API).

---

## 🏛️ Fluxo de Dependência

A regra principal da Clean Architecture é: **as camadas mais internas nunca conhecem ou dependem das camadas mais externas**. O fluxo de dependência é direcionado estritamente para dentro:

```
[ UI ] ──> [ Application ] ──> [ Domain (Ports) ] <── [ Infrastructure ]
```

* **UI** e **Infrastructure** são detalhes periféricos.
* **Application** orquestra o fluxo de dados.
* **Domain** é o núcleo imutável da aplicação (regras de negócio puras).

Para garantir que essa regra nunca seja violada, há uma configuração rigorosa de lint no ESLint (`import/no-restricted-paths`) impedindo que uma pasta interna importe arquivos de uma pasta externa.

---

## 📂 Mapeamento de Diretórios (`src/`)

### 1. `core/` (Camada de Domínio e Ports)
Esta camada é 100% agnóstica de framework e de bibliotecas externas. Ela define o vocabulário comum do negócio.
* **`domain/`**:
  * `entities/`: Modelos de negócio ricos e validados (ex: `Document.ts`, `User.ts`).
  * `value-objects/`: Tipos complexos que não possuem identidade própria (ex: `PaginationMeta.ts`).
* **`ports/`**:
  * Interfaces/contratos TypeScript que descrevem o que a infraestrutura deve implementar (ex: `IAuthRepository.ts`, `IDocumentRepository.ts`, `ITokenStorage.ts`).

### 2. `application/` (Camada de Casos de Uso e Controle)
Contém a lógica de aplicação e faz a ponte entre a UI e o Domínio/Infraestrutura.
* **`use-cases/`**:
  * Classes puras em TypeScript que representam uma ação de negócio específica (ex: `LoginUseCase.ts`, `UploadDocumentUseCase.ts`). Elas utilizam exclusivamente os contratos (ports) definidos no domínio.
* **`hooks/`**:
  * React Hooks customizados que simplificam o estado e o ciclo de vida dos casos de uso para consumo na UI (ex: `useAuth.ts`, `useDocuments.ts`, `useDocumentStream.ts`).

### 3. `infrastructure/` (Camada de Detalhes Técnicos)
Aqui ficam as implementações concretas dos ports definidos no domínio.
* **`http/`**:
  * `HttpClient.ts`: Wrapper em torno da `Fetch API` para injetar tokens JWT, tratar erros de requisição (`ApiError`) e tratar redirecionamentos de `401`.
  * `AuthHttpRepository.ts` & `DocumentHttpRepository.ts`: Implementam `IAuthRepository` e `IDocumentRepository`. Para upload de arquivos, o repositório HTTP utiliza `XMLHttpRequest` nativo a fim de acompanhar o progresso em tempo real (`onprogress`).
* **`storage/`**:
  * `LocalTokenStorage.ts`: Implementa `ITokenStorage` utilizando o `localStorage` do navegador com validação de expiração.
* **`di/` (Injeção de Dependências)**:
  * `DepsContext.tsx` & `useDeps.ts`: Provedor React Context que realiza a injeção manual das implementações de infraestrutura nos hooks da aplicação, mantendo o acoplamento baixo e facilitando mocks em testes.

### 4. `ui/` (Camada de Apresentação)
Onde o React e o estilo visual vivem. A UI apenas consome os Hooks da aplicação.
* **`components/`**: Componentes reutilizáveis puros com estados locais encapsulados:
  * `Button/`, `Input/` (com float labels e validação de acessibilidade), `Card/` (efeito glassmorphism), `DropZone/` (drag and drop de PDFs), `TagInput/` (chips para filtros).
* **`layout/`**: Componentes estruturais e guardas de rota (ex: `Header/`, `ProtectedRoute/` que protege páginas restritas a usuários logados).
* **`pages/`**: Páginas do sistema (ex: `Home/`, `Login/`, `Register/`, `Upload/`, `Reader/` - que lê os PDFs).

---

## 🎨 Sistema de Design e Estilização

Os estilos globais e as variáveis de design estão concentrados em `src/styles/`:
* **`global.css`**: Define os **Design Tokens** do projeto sob variáveis CSS nativas (ex: `--color-primary`, `--color-bg`, `--font-family`, `--radius-md`).
* **`animations.css`**: Keyframes globais para micro-interações do sistema.

Todos os componentes em `src/ui/components/` utilizam **CSS Modules** (`NomeComponente.module.css`) para garantir escopo local e evitar colisões de estilo.
