1. Stack Tecnológica
A escolha das ferramentas foca em produtividade, segurança e forte tipagem:

Core: Node.js com NestJS e TypeScript.

Banco de Dados: PostgreSQL (excelente para dados relacionais e buscas complexas) gerenciado via Prisma ORM (oferece uma tipagem estrita fantástica junto com o TypeScript).

Armazenamento: Sistema de arquivos local (usando as APIs nativas do Node.js, como fs e stream) integrado com o Multer para o recebimento dos arquivos.

Segurança: @nestjs/jwt, @nestjs/passport e bcrypt para autenticação e hash de senhas.

Qualidade e Documentação: Jest para testes unitários e @nestjs/swagger para documentação da API.

2. Estrutura de Pastas (Arquitetura Modular)
O NestJS incentiva a separação por domínios (Feature Modules). Além disso, teremos uma pasta common para código compartilhado.

Plaintext
src/
├── common/                  # Recursos globais e reaproveitáveis
│   ├── decorators/          # Decorators customizados (ex: @CurrentUser)
│   ├── filters/             # Tratamento global de exceções (HttpExceptionFilter)
│   ├── guards/              # Guards de autenticação e autorização
│   ├── interceptors/        # Interceptors (ex: formatação padronizada de respostas)
│   └── utils/               # Funções utilitárias (ex: gerador de hash de nomes de arquivo)
│
├── config/                  # Configurações do sistema (variáveis de ambiente, setup do Prisma)
│   ├── env.config.ts
│   └── prisma.service.ts    # Serviço global do ORM
│
├── modules/                 # Os módulos de negócio da aplicação
│   ├── auth/                # Lógica de login, tokens e validação de sessão
│   ├── users/               # CRUD de usuários
│   ├── documents/           # Lógica central: metadados, filtros e paginação
│   │   ├── dto/             # Data Transfer Objects (CreateDocumentDto, etc.)
│   │   ├── entities/        # Representação da entidade (se necessário além do Prisma)
│   │   ├── documents.controller.ts
│   │   ├── documents.service.ts
│   │   └── documents.module.ts
│   └── storage/             # Isolamento da lógica de infraestrutura (disco)
│       ├── storage.service.ts # Lida com fs.createWriteStream, fs.createReadStream
│       └── storage.module.ts
│
├── app.module.ts            # Módulo raiz que importa os demais
└── main.ts                  # Entrypoint da aplicação (setup do Swagger, pipes globais)
3. Boas Práticas Adotadas
Para garantir que o código seja limpo e profissional, o desenvolvimento deve seguir estas diretrizes:

Injeção de Dependência: O controlador do módulo de documentos nunca deve instanciar o serviço de storage diretamente. Tudo deve ser injetado via construtor para facilitar a testabilidade.

Isolamento de Infraestrutura: O DocumentsService não deve saber como o arquivo é salvo no disco. Ele apenas chama o StorageService. Se no futuro você quiser migrar do disco local para um bucket AWS S3, você altera apenas o StorageModule.

Validação Estrita na Entrada (DTOs): O uso de class-validator e class-transformer nos DTOs garante que requisições malformadas sejam barradas antes mesmo de chegarem ao controlador.

Tratamento Centralizado de Erros: Um Exception Filter global para capturar erros do Prisma (como violação de chave única) e transformá-los em respostas HTTP amigáveis (ex: 409 Conflict ou 400 Bad Request).

Documentação Contínua: Além do Swagger documentando os endpoints, registrar as decisões de arquitetura e as dificuldades superadas (como a implementação de streams de leitura) diretamente no seu Digital Garden criará um excelente material de consulta e portfólio.

4. Etapas de Desenvolvimento (Roadmap)
Dividir o projeto em pequenos épicos facilita a visualização do progresso:

Etapa 1: Fundação
Inicializar o projeto NestJS.

Configurar Docker com um container do PostgreSQL.

Configurar o Prisma ORM, criar o schema inicial (Usuários, Documentos e Tags) e rodar a primeira migração.

Configurar o ValidationPipe global.

Etapa 2: Infraestrutura e Armazenamento
Criar o StorageModule.

Implementar a lógica de upload de arquivos PDF usando o FileInterceptor do Multer.

Garantir a validação do tipo MIME (apenas application/pdf) e limite de tamanho.

Implementar a deleção física do arquivo no disco.

Etapa 3: Lógica de Negócio
Criar o DocumentsModule.

Desenvolver o CRUD de metadados integrado ao Prisma.

Vincular o upload do arquivo (Etapa 2) à criação do registro no banco de dados.

Implementar a rota de listagem com paginação e filtro por título/autor.

Etapa 4: Consumo e Streaming
Implementar a rota de leitura do PDF.

Configurar o retorno via StreamableFile no controlador, permitindo o carregamento progressivo do documento.

Etapa 5: Segurança e Fechamento
Implementar o AuthModule (Login com JWT).

Proteger as rotas de criação, deleção e leitura utilizando os Guards do Nest.

Configurar o Swagger para gerar a documentação interativa da API.

Testes manuais finais e escrita do README.