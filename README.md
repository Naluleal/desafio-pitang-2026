# Sistema de Controle de Reembolsos - Pitang

Aplicação full stack desenvolvida para o desafio de estágio da Pitang. O projeto simula um sistema interno de controle de reembolsos, onde colaboradores podem cadastrar despesas, gestores podem aprovar ou rejeitar solicitações e o setor financeiro pode marcar reembolsos aprovados como pagos.

O objetivo principal do projeto é demonstrar organização de código, criação de API REST, autenticação, autorização por perfil, validação de dados, persistência com banco de dados, interface web e testes da API.

## Visão Geral

O sistema é dividido em duas aplicações:

| Parte | Descrição |
| --- | --- |
| `backend` | API REST responsável pelas regras de negócio, autenticação, banco de dados e testes |
| `frontend` | Interface web usada para login, cadastro, categorias e fluxo de reembolsos |

O backend roda em:

```txt
http://localhost:3000
```

O frontend roda com Vite, normalmente em:

```txt
http://localhost:5173
```

Se a porta `5173` estiver ocupada, o Vite pode iniciar em outra porta, como `5174` ou `5175`.

## Tecnologias

### Backend

- Node.js
- Express
- TypeScript
- Prisma 7
- SQLite
- Zod
- bcryptjs
- jsonwebtoken
- Jest
- Supertest

### Frontend

- React
- Vite
- TypeScript
- React Router
- Context API
- Tailwind CSS
- lucide-react

## Funcionalidades

- Cadastro de usuários.
- Login com geração de token JWT.
- Controle de acesso por perfil.
- CRUD de categorias.
- Criação, edição, listagem e detalhamento de reembolsos.
- Envio de reembolso para aprovação.
- Aprovação e rejeição por gestor.
- Pagamento por usuário financeiro.
- Cancelamento de reembolso em rascunho.
- Anexos simulados para comprovantes.
- Histórico de ações do reembolso.
- Tratamento padronizado de erros.
- Testes automatizados de integração no backend.
- Collection do Postman com testes manuais da API.

## Perfis do Sistema

O sistema possui quatro perfis. Cada perfil tem permissões diferentes dentro do fluxo.

| Perfil | Permissões principais |
| --- | --- |
| `ADMIN` | Gerencia categorias, lista usuários e visualiza reembolsos |
| `EMPLOYEE` | Cria, edita, envia, cancela e acompanha seus próprios reembolsos |
| `MANAGER` | Aprova ou rejeita reembolsos enviados |
| `FINANCIAL` | Marca reembolsos aprovados como pagos |

Essa separação é feita no backend por meio de autenticação JWT e middlewares de autorização.

## Fluxo de Reembolso

Um reembolso passa por estados definidos. Esses estados controlam quais ações são permitidas em cada momento.

```txt
DRAFT -> SUBMITTED -> APPROVED -> PAID
  |           |
  |           +-> REJECTED
  |
  +-> CANCELED
```

Regras principais:

- Todo reembolso nasce com status `DRAFT`.
- Apenas o colaborador dono do reembolso pode editar, cancelar, anexar comprovantes ou enviar um rascunho.
- Apenas um usuário `MANAGER` pode aprovar ou rejeitar um reembolso com status `SUBMITTED`.
- Apenas um usuário `FINANCIAL` pode marcar como pago um reembolso com status `APPROVED`.
- Reembolsos `PAID`, `REJECTED` ou `CANCELED` não podem ser editados.

## Estrutura do Projeto

```txt
desafio-estagio-pitang/
|-- backend/
|   |-- prisma/
|   |   |-- migrations/
|   |   |-- schema.prisma
|   |-- src/
|   |   |-- errors/
|   |   |-- lib/
|   |   |-- middlewares/
|   |   |-- routes/
|   |   |-- schemas/
|   |   |-- tests/
|   |   |-- types/
|   |   |-- app.ts
|   |   |-- server.ts
|   |-- package.json
|   |-- prisma.config.ts
|
|-- frontend/
|   |-- app/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- lib/
|   |   |-- app.page.tsx
|   |   |-- auth.context.tsx
|   |   |-- categories.page.tsx
|   |   |-- dashboard.page.tsx
|   |   |-- login.page.tsx
|   |   |-- register.page.tsx
|   |   |-- reimbursement.detail.page.tsx
|   |   |-- reimbursement.edit.page.tsx
|   |   |-- reimbursement.new.page.tsx
|   |   |-- main.tsx
|   |-- index.html
|   |-- package.json
|   |-- vite.config.ts
|
|-- docs/
|   |-- postman/
|   |   |-- Pitang-estagio-API.postman_collection.json
|
|-- README.md
```

## Como Rodar o Projeto

### Pré-requisitos

- Node.js instalado.
- npm instalado.
- Git instalado, caso queira versionar ou enviar o projeto para o GitHub.

### 1. Rodar o Backend

Entre na pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `backend/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-change-me"
```

Gere o Prisma Client:

```bash
npm run prisma:generate
```

Execute as migrations:

```bash
npm run prisma:migrate
```

Inicie a API:

```bash
npm run dev
```

Se tudo estiver correto, a API ficará disponível em:

```txt
http://localhost:3000
```

### 2. Rodar o Frontend

Abra outro terminal e entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Inicie o Vite:

```bash
npm run dev
```

Acesse a URL exibida no terminal, por exemplo:

```txt
http://localhost:5173
```

Importante: o frontend precisa que o backend esteja rodando. Se o backend estiver desligado, ações como login, cadastro e criação de reembolso vão falhar.

## Banco de Dados

O projeto usa SQLite com Prisma. O SQLite foi escolhido por ser simples de configurar em ambiente local e não exigir instalação de um servidor de banco separado.

Schema principal:

[backend/prisma/schema.prisma](backend/prisma/schema.prisma)

Modelos principais:

| Model | Responsabilidade |
| --- | --- |
| `User` | Armazena usuários, senha criptografada e perfil |
| `Category` | Armazena categorias de despesas |
| `Reimbursement` | Armazena solicitações de reembolso |
| `Attachment` | Armazena metadados dos anexos simulados |
| `ReimbursementHistory` | Registra o histórico de ações feitas no reembolso |

Enums:

```txt
Role: EMPLOYEE, MANAGER, FINANCIAL, ADMIN
ReimbursementStatus: DRAFT, SUBMITTED, APPROVED, REJECTED, PAID, CANCELED
HistoryAction: CREATED, UPDATED, SUBMITTED, APPROVED, REJECTED, PAID, CANCELED, ATTACHMENT_ADDED
```

## Backend

O backend concentra as regras de negócio da aplicação. Ele recebe as requisições HTTP, valida os dados, verifica permissões, conversa com o banco de dados e devolve respostas padronizadas.

Arquivos principais:

| Caminho | Responsabilidade |
| --- | --- |
| [backend/src/server.ts](backend/src/server.ts) | Inicializa o servidor HTTP |
| [backend/src/app.ts](backend/src/app.ts) | Configura Express, JSON, rotas e tratamento de erros |
| [backend/src/lib/prisma.ts](backend/src/lib/prisma.ts) | Configura e exporta o Prisma Client com adapter SQLite |
| [backend/src/errors/app-error.ts](backend/src/errors/app-error.ts) | Classe usada para lançar erros HTTP controlados |
| [backend/src/middlewares/auth.middleware.ts](backend/src/middlewares/auth.middleware.ts) | Valida o JWT e adiciona os dados do usuário em `req.user` |
| [backend/src/middlewares/require.role.ts](backend/src/middlewares/require.role.ts) | Restringe rotas de acordo com o perfil do usuário |
| [backend/src/middlewares/error-handler.ts](backend/src/middlewares/error-handler.ts) | Converte erros em respostas HTTP padronizadas |
| [backend/src/types/express.d.ts](backend/src/types/express.d.ts) | Adiciona a tipagem de `req.user` ao Express |

Rotas:

| Caminho | Responsabilidade |
| --- | --- |
| [backend/src/routes/users.routes.ts](backend/src/routes/users.routes.ts) | Cadastro e listagem de usuários |
| [backend/src/routes/auth.routes.ts](backend/src/routes/auth.routes.ts) | Login e geração de token |
| [backend/src/routes/categories.routes.ts](backend/src/routes/categories.routes.ts) | CRUD de categorias |
| [backend/src/routes/reimbursements.routes.ts](backend/src/routes/reimbursements.routes.ts) | Fluxo completo de reembolsos |

Schemas Zod:

| Caminho | Validação |
| --- | --- |
| [backend/src/schemas/user.schema.ts](backend/src/schemas/user.schema.ts) | Dados de cadastro de usuário |
| [backend/src/schemas/auth.schema.ts](backend/src/schemas/auth.schema.ts) | Dados de login |
| [backend/src/schemas/category.schema.ts](backend/src/schemas/category.schema.ts) | Dados de categoria |
| [backend/src/schemas/reimbursement.schema.ts](backend/src/schemas/reimbursement.schema.ts) | Dados de reembolso |
| [backend/src/schemas/attachment.schema.ts](backend/src/schemas/attachment.schema.ts) | Dados de anexo simulado |

## Rotas da API

### Usuários

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/users` | Público | Cria um usuário |
| `GET` | `/users` | `ADMIN` | Lista usuários cadastrados |

### Autenticação

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Público | Autentica usuário e retorna JWT |

### Categorias

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/categories` | Autenticado | Lista categorias |
| `POST` | `/categories` | `ADMIN` | Cria categoria |
| `PUT` | `/categories/:id` | `ADMIN` | Atualiza categoria |
| `DELETE` | `/categories/:id` | `ADMIN` | Inativa categoria |

### Reembolsos

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/reimbursements` | Autenticado | Lista reembolsos conforme o perfil |
| `POST` | `/reimbursements` | `EMPLOYEE` | Cria reembolso em rascunho |
| `GET` | `/reimbursements/:id` | Autenticado com permissão | Detalha um reembolso |
| `PUT` | `/reimbursements/:id` | Dono `EMPLOYEE` e `DRAFT` | Edita um rascunho |
| `DELETE` | `/reimbursements/:id` | Dono `EMPLOYEE` e `DRAFT` | Cancela um rascunho |
| `POST` | `/reimbursements/:id/submit` | Dono `EMPLOYEE` e `DRAFT` | Envia para aprovação |
| `POST` | `/reimbursements/:id/approve` | `MANAGER` e `SUBMITTED` | Aprova reembolso |
| `POST` | `/reimbursements/:id/reject` | `MANAGER` e `SUBMITTED` | Rejeita com justificativa |
| `POST` | `/reimbursements/:id/pay` | `FINANCIAL` e `APPROVED` | Marca como pago |
| `POST` | `/reimbursements/:id/cancel` | Dono `EMPLOYEE` e `DRAFT` | Cancela um rascunho |
| `POST` | `/reimbursements/:id/attachments` | Dono `EMPLOYEE` e `DRAFT` | Adiciona anexo simulado |
| `GET` | `/reimbursements/:id/attachments` | Autenticado com permissão | Lista anexos |
| `GET` | `/reimbursements/:id/history` | Autenticado com permissão | Lista histórico |

## Frontend

O frontend é a interface usada pelo usuário para interagir com a API. Ele controla o login, guarda o token JWT no navegador e exibe as telas de acordo com o perfil do usuário.

Rotas React:

| Rota | Tela |
| --- | --- |
| `/` | Redireciona para login ou dashboard |
| `/login` | Login |
| `/register` | Cadastro |
| `/dashboard` | Dashboard e listagem de reembolsos |
| `/categories` | Gestão de categorias |
| `/reimbursements/new` | Novo reembolso |
| `/reimbursements/:id` | Detalhes do reembolso |
| `/reimbursements/:id/edit` | Edição do rascunho |

Arquivos principais:

| Caminho | Responsabilidade |
| --- | --- |
| [frontend/app/main.tsx](frontend/app/main.tsx) | Entrada React e configuração de rotas |
| [frontend/app/auth.context.tsx](frontend/app/auth.context.tsx) | Context API de autenticação |
| [frontend/app/lib/api.ts](frontend/app/lib/api.ts) | Cliente HTTP usado para chamar a API |
| [frontend/app/lib/types.ts](frontend/app/lib/types.ts) | Tipos usados no frontend |
| [frontend/app/components/layout.tsx](frontend/app/components/layout.tsx) | Layout das páginas protegidas |
| [frontend/app/components/sidebar.tsx](frontend/app/components/sidebar.tsx) | Menu lateral |
| [frontend/app/components/header.tsx](frontend/app/components/header.tsx) | Cabeçalho do usuário |
| [frontend/app/components/pitang.logo.tsx](frontend/app/components/pitang.logo.tsx) | Componente da logo da Pitang |
| [frontend/app/components/status.badge.tsx](frontend/app/components/status.badge.tsx) | Badge visual para status de reembolso |

O frontend chama a API usando `/api`. O proxy do Vite redireciona essas chamadas para o backend:

[frontend/vite.config.ts](frontend/vite.config.ts)

```ts
"/api" -> "http://localhost:3000"
```

Isso permite que o frontend faça chamadas como `/api/users`, enquanto o Vite encaminha para `http://localhost:3000/users`.

## Collection do Postman

A collection está em:

[docs/postman/Pitang-estagio-API.postman_collection.json](docs/postman/Pitang-estagio-API.postman_collection.json)

Ela foi criada para testar manualmente os principais cenários da API:

- criação e login dos perfis;
- criação de categorias;
- criação de reembolsos;
- envio para aprovação;
- aprovação por gestor;
- pagamento por financeiro;
- anexos simulados;
- consulta de histórico;
- testes negativos de autenticação, permissão, validação, status inválido e recurso inexistente.

## Testes Automatizados

Os testes de integração ficam em:

[backend/src/tests/reimbursements-flow.test.ts](backend/src/tests/reimbursements-flow.test.ts)

Para rodar:

```bash
cd backend
npm test
```

Os testes cobrem:

- fluxo completo de reembolso;
- criação de usuários;
- login;
- criação de categoria;
- criação de anexo;
- envio, aprovação e pagamento;
- histórico;
- bloqueio de ações sem permissão;
- bloqueio de transições inválidas;
- soft delete de categoria;
- cancelamento de rascunho.

## Scripts

### Backend

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia a API em modo desenvolvimento |
| `npm test` | Executa os testes automatizados |
| `npm run prisma:generate` | Gera o Prisma Client |
| `npm run prisma:migrate` | Executa as migrations |
| `npm run prisma:studio` | Abre o Prisma Studio |

### Frontend

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o Vite em modo desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Visualiza o build localmente |

## Decisões Técnicas

### Código em inglês

Entidades, enums, rotas e campos foram mantidos em inglês para seguir o padrão comum em projetos com TypeScript, Prisma e APIs REST.

Exemplos:

| Conceito | Nome no código |
| --- | --- |
| Usuário | `User` |
| Categoria | `Category` |
| Reembolso | `Reimbursement` |
| Rascunho | `DRAFT` |
| Enviado | `SUBMITTED` |
| Aprovado | `APPROVED` |
| Pago | `PAID` |

### `Reimbursement` em vez de `Request`

O nome `Request` foi evitado para não confundir com o tipo `Request` do Express.

### Validação com Zod

O Zod valida os dados recebidos nas rotas antes que eles sejam usados pela regra de negócio. Isso evita salvar dados inválidos no banco e ajuda a retornar mensagens de erro mais claras.

### Senhas com hash

As senhas são salvas usando `bcrypt.hash` e verificadas com `bcrypt.compare`. A senha original nunca é salva diretamente e também nunca é retornada nas respostas da API.

### Autenticação com JWT

Após o login, a API retorna um token JWT. Esse token é enviado nas próximas requisições autenticadas pelo header:

```txt
Authorization: Bearer TOKEN_AQUI
```

### Delete como soft delete

O projeto evita apagar fisicamente dados importantes:

- `DELETE /categories/:id` atualiza `isActive` para `false`;
- `DELETE /reimbursements/:id` muda o status para `CANCELED`.

Essa abordagem preserva histórico e facilita auditoria.

### Anexos simulados

O sistema não faz upload real de arquivos. Ele salva apenas metadados:

- `fileName`;
- `fileUrl`;
- `fileType`.

Isso permite testar o fluxo de anexos sem depender de armazenamento externo.
