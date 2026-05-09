# Sistema de Controle de Reembolsos - Pitang

Aplicação full stack desenvolvida para o desafio de estágio da Pitang. O sistema permite cadastrar usuários, autenticar por perfil, gerenciar categorias e controlar solicitações de reembolso com aprovação, rejeição, pagamento, anexos simulados e histórico de ações.

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

- Cadastro e login de usuários.
- Autenticação com JWT.
- Controle de acesso por perfil.
- CRUD de categorias.
- CRUD de solicitações de reembolso.
- Envio de reembolso para aprovação.
- Aprovação e rejeição por gestor.
- Pagamento por financeiro.
- Cancelamento de rascunho.
- Anexos simulados.
- Histórico/auditoria de ações.
- Tratamento padronizado de erros HTTP.
- Testes automatizados de integração no backend.
- Collection do Postman para testes manuais da API.

## Perfis

| Perfil | Permissões principais |
| --- | --- |
| `ADMIN` | Gerencia categorias, lista usuários e visualiza reembolsos |
| `EMPLOYEE` | Cria, edita, envia, cancela e acompanha seus reembolsos |
| `MANAGER` | Aprova ou rejeita reembolsos enviados |
| `FINANCIAL` | Marca reembolsos aprovados como pagos |

## Fluxo de Reembolso

```txt
DRAFT -> SUBMITTED -> APPROVED -> PAID
  |           |
  |           +-> REJECTED
  |
  +-> CANCELED
```

Regras principais:

- Reembolso nasce como `DRAFT`.
- Apenas o colaborador dono pode editar, cancelar, anexar comprovantes ou enviar um rascunho.
- Apenas gestor pode aprovar ou rejeitar um reembolso `SUBMITTED`.
- Apenas financeiro pode pagar um reembolso `APPROVED`.
- Reembolso pago, rejeitado ou cancelado não pode ser editado.

## Estrutura

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

## Como Rodar

### Pré-requisitos

- Node.js instalado.
- npm instalado.

### Backend

Entre na pasta:

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

URL da API:

```txt
http://localhost:3000
```

### Frontend

Em outro terminal:

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

URL do frontend:

```txt
http://localhost:5173
```

Se a porta `5173` estiver ocupada, o Vite pode usar outra porta, como `5174`.

## Banco de Dados

O projeto usa SQLite com Prisma.

Schema:

[backend/prisma/schema.prisma](backend/prisma/schema.prisma)

Modelos principais:

| Model | Descrição |
| --- | --- |
| `User` | Usuários do sistema |
| `Category` | Categorias de despesa |
| `Reimbursement` | Solicitações de reembolso |
| `Attachment` | Anexos simulados |
| `ReimbursementHistory` | Histórico de ações |

Enums:

```txt
Role: EMPLOYEE, MANAGER, FINANCIAL, ADMIN
ReimbursementStatus: DRAFT, SUBMITTED, APPROVED, REJECTED, PAID, CANCELED
HistoryAction: CREATED, UPDATED, SUBMITTED, APPROVED, REJECTED, PAID, CANCELED, ATTACHMENT_ADDED
```

## Backend

Arquivos principais:

| Caminho | Responsabilidade |
| --- | --- |
| [backend/src/server.ts](backend/src/server.ts) | Inicializa o servidor HTTP |
| [backend/src/app.ts](backend/src/app.ts) | Configura Express, JSON, rotas e error handler |
| [backend/src/lib/prisma.ts](backend/src/lib/prisma.ts) | Configura e exporta Prisma Client com adapter SQLite |
| [backend/src/errors/app-error.ts](backend/src/errors/app-error.ts) | Classe de erro padronizada |
| [backend/src/middlewares/auth.middleware.ts](backend/src/middlewares/auth.middleware.ts) | Valida JWT e popula `req.user` |
| [backend/src/middlewares/require.role.ts](backend/src/middlewares/require.role.ts) | Bloqueia rotas por perfil |
| [backend/src/middlewares/error-handler.ts](backend/src/middlewares/error-handler.ts) | Padroniza respostas de erro |
| [backend/src/types/express.d.ts](backend/src/types/express.d.ts) | Tipagem de `req.user` |

Rotas:

| Caminho | Responsabilidade |
| --- | --- |
| [backend/src/routes/users.routes.ts](backend/src/routes/users.routes.ts) | Cadastro e listagem de usuários |
| [backend/src/routes/auth.routes.ts](backend/src/routes/auth.routes.ts) | Login e geração de token |
| [backend/src/routes/categories.routes.ts](backend/src/routes/categories.routes.ts) | Categorias |
| [backend/src/routes/reimbursements.routes.ts](backend/src/routes/reimbursements.routes.ts) | Fluxo de reembolsos |

Schemas Zod:

| Caminho | Valida |
| --- | --- |
| [backend/src/schemas/user.schema.ts](backend/src/schemas/user.schema.ts) | Cadastro de usuário |
| [backend/src/schemas/auth.schema.ts](backend/src/schemas/auth.schema.ts) | Login |
| [backend/src/schemas/category.schema.ts](backend/src/schemas/category.schema.ts) | Categorias |
| [backend/src/schemas/reimbursement.schema.ts](backend/src/schemas/reimbursement.schema.ts) | Reembolsos |
| [backend/src/schemas/attachment.schema.ts](backend/src/schemas/attachment.schema.ts) | Anexos |

## Rotas da API

### Usuários

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/users` | Público | Cria usuário |
| `GET` | `/users` | `ADMIN` | Lista usuários |

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
| `GET` | `/reimbursements` | Autenticado | Lista reembolsos conforme perfil |
| `POST` | `/reimbursements` | `EMPLOYEE` | Cria reembolso em rascunho |
| `GET` | `/reimbursements/:id` | Autenticado com permissão | Detalha reembolso |
| `PUT` | `/reimbursements/:id` | Dono `EMPLOYEE` e `DRAFT` | Edita reembolso |
| `DELETE` | `/reimbursements/:id` | Dono `EMPLOYEE` e `DRAFT` | Cancela rascunho |
| `POST` | `/reimbursements/:id/submit` | Dono `EMPLOYEE` e `DRAFT` | Envia para aprovação |
| `POST` | `/reimbursements/:id/approve` | `MANAGER` e `SUBMITTED` | Aprova |
| `POST` | `/reimbursements/:id/reject` | `MANAGER` e `SUBMITTED` | Rejeita com justificativa |
| `POST` | `/reimbursements/:id/pay` | `FINANCIAL` e `APPROVED` | Marca como pago |
| `POST` | `/reimbursements/:id/cancel` | Dono `EMPLOYEE` e `DRAFT` | Cancela rascunho |
| `POST` | `/reimbursements/:id/attachments` | Dono `EMPLOYEE` e `DRAFT` | Adiciona anexo simulado |
| `GET` | `/reimbursements/:id/attachments` | Autenticado com permissão | Lista anexos |
| `GET` | `/reimbursements/:id/history` | Autenticado com permissão | Lista histórico |

## Frontend

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
| [frontend/app/lib/api.ts](frontend/app/lib/api.ts) | Cliente HTTP para API |
| [frontend/app/lib/types.ts](frontend/app/lib/types.ts) | Tipos compartilhados no frontend |
| [frontend/app/components/layout.tsx](frontend/app/components/layout.tsx) | Layout protegido |
| [frontend/app/components/sidebar.tsx](frontend/app/components/sidebar.tsx) | Menu lateral |
| [frontend/app/components/header.tsx](frontend/app/components/header.tsx) | Cabeçalho do usuário |
| [frontend/app/components/pitang.logo.tsx](frontend/app/components/pitang.logo.tsx) | Logo da Pitang |
| [frontend/app/components/status.badge.tsx](frontend/app/components/status.badge.tsx) | Badge de status |

O frontend chama a API por `/api`. O proxy está configurado em:

[frontend/vite.config.ts](frontend/vite.config.ts)

```ts
"/api" -> "http://localhost:3000"
```

## Collection do Postman

A Collection está em:

[docs/postman/Pitang-estagio-API.postman_collection.json](docs/postman/Pitang-estagio-API.postman_collection.json)

Ela contém:

- fluxo principal da API;
- criação e login dos perfis;
- criação de categorias;
- criação, envio, aprovação e pagamento de reembolsos;
- anexos simulados;
- histórico;
- testes negativos de autenticação, permissão, validação, status inválido e recurso inexistente.

## Testes Automatizados

Os testes de integração ficam em:

[backend/src/tests/reimbursements-flow.test.ts](backend/src/tests/reimbursements-flow.test.ts)

Rodar:

```bash
cd backend
npm test
```

Cobertura atual:

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
- delete/cancelamento de rascunho.

## Scripts

### Backend

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia a API |
| `npm test` | Executa testes |
| `npm run prisma:generate` | Gera Prisma Client |
| `npm run prisma:migrate` | Executa migrations |
| `npm run prisma:studio` | Abre Prisma Studio |

### Frontend

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia Vite |
| `npm run build` | Gera build de produção |
| `npm run preview` | Visualiza build |

## Decisões Técnicas

### Código em inglês

Entidades, enums, rotas e campos foram mantidos em inglês para seguir o padrão das bibliotecas e da documentação técnica.

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

O nome `Request` foi evitado para não confundir com `Request` do Express.

### Senhas com hash

Senhas são salvas com `bcrypt.hash` e verificadas com `bcrypt.compare`. A senha nunca é retornada nas respostas da API.

### Delete como soft delete

O projeto evita apagar dados importantes fisicamente:

- `DELETE /categories/:id` atualiza `isActive` para `false`;
- `DELETE /reimbursements/:id` muda o status para `CANCELED`.

Essa abordagem preserva histórico e auditoria.

### Anexos simulados

O sistema não faz upload real de arquivos. Ele salva metadados:

- `fileName`;
- `fileUrl`;
- `fileType`.

## Checklist de Entrega

Antes de entregar, rode:

```bash
cd backend
npm test
```

```bash
cd frontend
npm run build
```

Confira também:

- backend inicia em `http://localhost:3000`;
- frontend inicia em `http://localhost:5173`;
- Collection do Postman está em `docs/postman`;
- README está atualizado;
- fluxo principal funciona no frontend;
- testes negativos principais passam no Postman.

## Melhorias Futuras

- Upload real de comprovantes.
- Tela administrativa de usuários.
- Refresh token.
- Paginação.
- Filtros avançados.
- Confirmação visual antes de cancelar.
- Testes automatizados do frontend.
- Deploy.

