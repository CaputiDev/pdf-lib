# Planejamento do Projeto

## 1. Stack Tecnológica

A escolha das ferramentas foca em produtividade, robustez, forte tipagem e aderência a padrões arquiteturais modernos. O projeto adota a **Clean Architecture Modular** (Vertical Slicing) e os **Princípios SOLID** como diretrizes fundamentais de design de software, com ênfase especial na **Inversão de Dependência (IoC)** para garantir o desacoplamento entre a lógica de negócio e os detalhes de infraestrutura:

- **Core do Sistema**: Node.js com TypeScript, orientado pelos princípios da Clean Architecture e SOLID.
- **Framework Web**: NestJS, utilizado como um adaptador de infraestrutura para prover injeção de dependência (IoC container), gerenciamento de módulos e capacidades de servidor HTTP.
- **Banco de Dados & Mapeamento Relacional**: PostgreSQL como sistema gerenciador de banco de dados relacional, integrado com o Prisma ORM, que atua na camada de infraestrutura fornecendo mapeamento e tipagem estrita para o banco.
- **Armazenamento de Arquivos**: Camada de persistência local abstrata (utilizando APIs nativas do Node.js, como `fs` e `stream`), encapsulada sob interfaces de infraestrutura, com integração com o Multer para tratamento multipart/form-data.
- **Segurança e Autenticação**: `@nestjs/jwt`, `@nestjs/passport` e `bcrypt` para autenticação baseada em tokens JWT e hashing criptográfico de senhas.
- **Qualidade, Testabilidade e Documentação**: Jest para testes unitários e de integração, aproveitando a arquitetura desacoplada para execução de testes velozes sem dependência de banco de dados, e `@nestjs/swagger` para geração automatizada da especificação OpenAPI.

## 2. Estrutura de Pastas (Clean Architecture Modular)

A estrutura de pastas adota uma divisão modular (Vertical Slicing), em que cada módulo de negócio encapsula suas próprias regras e componentes sob a ótica da Clean Architecture. A seguir, apresenta-se a estrutura interna de um módulo representativo do domínio da aplicação:

```plaintext
src/
├── common/                  # Recursos compartilhados transversais (filters, guards, decorators)
├── config/                  # Configurações globais e inicialização de frameworks (env, prisma)
├── modules/
│   ├── auth/                # Módulo de autenticação e sessão de usuários
│   ├── users/               # Módulo de gerenciamento de usuários
│   └── documents/           # Módulo de Documentos (Vertical Slice estruturado em Clean Architecture)
│       ├── core/            # Camada de Domínio e Casos de Uso (Agnóstica)
│       │   ├── entities/    # Modelos e regras de negócio essenciais (ex: document.entity.ts)
│       │   ├── interfaces/  # Contratos, Repositórios e Portas de Saída (ex: storage.interface.ts, repository.interface.ts)
│       │   └── use-cases/   # Casos de Uso da aplicação (ex: create-document.use-case.ts, list-documents.use-case.ts)
│       │
│       ├── infrastructure/  # Detalhes de Implementação e Adaptadores
│       │   ├── database/    # Persistência de dados e repositórios concretos (ex: prisma-document.repository.ts)
│       │   ├── http/        # Controladores HTTP e DTOs (ex: documents.controller.ts, dtos/)
│       │   └── storage/     # Implementações físicas de armazenamento (ex: local-storage.adapter.ts)
│       │
│       └── documents.module.ts # Módulo do NestJS responsável pela fiação (wiring) de dependências
│
├── app.module.ts            # Módulo raiz da aplicação
└── main.ts                  # Entrypoint da aplicação (setup do Swagger, pipes globais)
```

A pasta `core/` representa o coração do módulo de negócio, contendo as entidades de domínio, as interfaces de contrato (ports) e as regras de aplicação (use-cases). Ela é estritamente agnóstica a tecnologias externas, o que significa que o código contido nela não importa ou conhece frameworks (como o NestJS), ORMs (como o Prisma) ou bibliotecas de terceiros para persistência de dados. Essa independência garante que as regras de negócio permaneçam puras, testáveis e imunes a mudanças tecnológicas nas camadas mais externas.

## 3. Boas Práticas Adotadas

Para garantir que o código seja limpo e profissional, o desenvolvimento deve seguir estas diretrizes:

- **Inversão de Dependência via Interfaces**: Nenhum componente da camada `core/` deve depender diretamente de classes de infraestrutura. Em vez disso, os casos de uso definem interfaces abstratas (Portas de Saída/Repositories) e a infraestrutura implementa essas interfaces (Adaptadores). A injeção das implementações concretas é realizada pelo contêiner de IoC do NestJS, permitindo a substituição transparente das tecnologias de persistência ou armazenamento sem afetar a lógica de negócio.
- **Princípio da Responsabilidade Única (SRP) nos Casos de Uso**: Em substituição ao padrão tradicional de serviços gigantescos que acumulam dezenas de métodos e responsabilidades (`DocumentsService`), cada fluxo ou regra de negócio é modelado como um Caso de Uso isolado (ex: `CreateDocumentUseCase`, `StreamDocumentUseCase`). Isso simplifica a leitura do código, evita o acoplamento indesejado e reduz o escopo de manutenção.
- **Testabilidade Isolada do Core com Mocks**: Graças ao desacoplamento promovido pela Clean Architecture, a lógica contida em `core/` pode ser testada de forma 100% isolada e veloz através de testes unitários. A simulação de bancos de dados ou sistemas de arquivos é realizada instanciando mocks simples das interfaces contratuais, eliminando a necessidade de conectar a bancos reais ou subir servidores HTTP durante os testes de domínio.
- **Validação de Entrada Desacoplada**: A validação sintática das requisições é realizada na camada HTTP de infraestrutura através de DTOs mapeados com `class-validator` e `class-transformer`, assegurando que apenas dados íntegros atinjam a camada de aplicação.
- **Tratamento de Exceções em Camadas**: Os erros de domínio originados no `core/` são propagados por meio de exceções de domínio tipadas. Os Exception Filters globais da camada HTTP capturam e traduzem essas exceções de domínio ou erros de infraestrutura (como falhas no Prisma) em respostas padronizadas e semânticas do protocolo HTTP.

## 4. Etapas de Desenvolvimento (Roadmap)

Dividir o projeto em pequenos épicos facilita a visualização do progresso, respeitando o fluxo de dependências de dentro para fora:

### Etapa 1: Fundação & Setup

- Inicializar o projeto NestJS e configurar o ambiente de desenvolvimento TypeScript.
- Configurar o Docker contendo a instância do PostgreSQL.
- Configurar o Prisma ORM e modelar a estrutura inicial de tabelas (Users, Documents e Tags).
- Configurar os pipes de validação globais no entrypoint da API.

### Etapa 2: Núcleo do Domínio (Domain Core)

- Desenvolver as Entidades de Domínio para representar os modelos de negócio com suas respectivas validações lógicas e invariants.
- Definir as Interfaces e Contratos (Ports) de persistência de dados (`IDocumentRepository`) e de armazenamento de arquivos (`IStorageAdapter`).
- Desenvolver os Casos de Uso (`Use Cases`) contendo as regras de negócio de criação, listagem, remoção e streaming de documentos de forma agnóstica.
- Implementar a cobertura de testes unitários do `core/` usando mocks das interfaces de infraestrutura.

### Etapa 3: Adaptadores de Infraestrutura (Persistence & Storage)

- Implementar a persistência de banco de dados (`PrismaDocumentRepository`) em conformidade com as interfaces definidas no core.
- Desenvolver o adaptador de armazenamento local de arquivos (`LocalStorageAdapter`), tratando a escrita e leitura física através de streams nativas do Node.js.
- Criar e executar as migrations necessárias no banco de dados.

### Etapa 4: Camada de Exposição HTTP (Adapters & Controllers)

- Mapear os DTOs para entrada de dados e serialização de respostas no módulo de documentos.
- Desenvolver os Controladores HTTP do NestJS (`DocumentsController`) mapeando os endpoints da API para dispararem os respectivos Casos de Uso.
- Configurar o fluxo de upload usando o Multer no controlador e integrá-lo ao fluxo do caso de uso de criação de documentos.
- Implementar a leitura e o streaming do arquivo PDF com retorno do tipo `StreamableFile` para carregamento progressivo do arquivo no navegador.

### Etapa 5: Segurança, Integração & Documentação

- Desenvolver o módulo de autenticação (`AuthModule`) com autenticação baseada em JWT.
- Proteger as rotas REST expondo os recursos sensíveis por meio de Guards do NestJS baseados nas credenciais decodificadas.
- Configurar o Swagger (`@nestjs/swagger`) para geração automatizada da documentação interativa OpenAPI da API.
- Executar testes de integração ponta a ponta (E2E) e finalizar a elaboração do README de execução do projeto.
