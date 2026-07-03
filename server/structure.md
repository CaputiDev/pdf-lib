# 📐 Estrutura & Arquitetura — Backend

O backend da **PDF Library** é estruturado seguindo os princípios de **Clean Architecture Modular** combinada com **Fatias Verticais (Vertical Slicing)**. Esta abordagem agrupa o código em torno de domínios funcionais de negócio (como autenticação, usuários e documentos) em vez de agrupá-lo puramente por tipo técnico (controllers, services, etc.).

---

## 🏗️ Fatias Verticais e Modularização

Cada módulo sob `src/modules/` funciona de forma autônoma e é subdividido em duas principais camadas internas: **Core** (regras de negócio abstratas) e **Infrastructure** (detalhes técnicos concretos).

Para ilustrar, veja a estrutura detalhada do módulo `documents`:

```text
documents/
├── core/                        # Núcleo de Domínio e Casos de Uso (Puro/Isolado)
│   ├── entities/                # Regras de dados fundamentais (ex: Document)
│   ├── repositories/            # Interfaces/contratos de acesso a dados (Ports)
│   └── use-cases/               # Casos de uso do negócio (Upload, Streaming, Listagem)
└── infrastructure/              # Detalhes de Implementação e Adaptação
    ├── database/                # Repositórios concretos utilizando Prisma/PostgreSQL
    ├── http/                    # Controladores NestJS, DTOs de entrada e Guards
    └── storage/                 # Implementações físicas de escrita e leitura por stream (fs/Multer)
```

---

## 🏛️ Divisão em Camadas

### 1. Camada `core/` (Domain & Application)
Esta camada encapsula o conhecimento do negócio. É puramente escrita em TypeScript padrão e **totalmente desacoplada do NestJS** ou de qualquer banco de dados específico.
* **Entities:** Representam objetos de dados com identidade e regras de negócio essenciais.
* **Repositories (Interfaces):** Declaram os métodos que a infraestrutura deve disponibilizar para manipular entidades. É onde a **Inversão de Dependência** acontece.
* **Use Cases:** Contêm a lógica operacional da aplicação. Exemplos:
  * `UploadDocumentUseCase`: Lida com regras de validação do arquivo e criação do catálogo.
  * `StreamDocumentUseCase`: Lê o arquivo físico e entrega os pedaços (chunks) de dados para transmissão.

### 2. Camada `infrastructure/` (Adapters & Details)
Aqui as ferramentas externas são integradas à aplicação.
* **HTTP Controllers:** Controladores do NestJS que escutam as requisições HTTP, executam validações de payload através de DTOs e Pipes (ex: `class-validator`), e chamam os casos de uso do Core.
* **Database (Prisma Repositories):** Classes que implementam as interfaces do `core/repositories/` traduzindo as ações para operações do banco de dados PostgreSQL usando o Prisma client.
* **Storage Manager:** Lida com a gravação de arquivos carregados pelo usuário (usando Multer para interceptar multipart/form-data) e leitura sob demanda diretamente do sistema de arquivos local (`fs`).

---

## 🌍 Estruturas Compartilhadas (`src/`)

Além dos módulos de negócio específicos, a API possui duas pastas principais globais:

* **`common/`**: Contém middlewares reutilizáveis, guards de autenticação JWT (`JwtAuthGuard`), decorators para extrair dados da requisição (ex: `@CurrentUser()`), e filtros de exceção globais para padronizar o formato de erro HTTP retornado aos clientes.
* **`config/`**: Responsável por agrupar variáveis de ambiente, configurações de banco e o ciclo de inicialização do cliente Prisma.
