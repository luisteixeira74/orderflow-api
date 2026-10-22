# OrderFlow API e Frontend

Aplicação full stack para gerenciamento de clientes, produtos e pedidos, desenvolvida com Node.js, TypeScript, Fastify, PostgreSQL e React.

O projeto demonstra práticas de desenvolvimento backend, incluindo validação de dados, organização modular, operações transacionais, controle de estoque, paginação e testes automatizados. O frontend consome a API REST e apresenta os pedidos em uma interface web.

## Tecnologias

### Backend

- Node.js 22 — ambiente de execução
- TypeScript — tipagem estática
- Fastify 5 — framework HTTP
- Prisma ORM 7 — acesso ao banco de dados
- PostgreSQL 17 — banco de dados relacional
- Zod — validação de entradas
- Vitest — testes automatizados
- Docker Compose — ambiente local de desenvolvimento

### Frontend

- React
- Typescript
- Vite
- CSS
- Fetch API

## Funcionalidades

### Clientes e produtos

- Organização dos recursos em módulos independentes.
- Persistência de dados em PostgreSQL.
- Validação de dados de entrada.

### Pedidos

- Criação de pedidos com múltiplos itens.
- Cálculo do valor total a partir dos preços dos produtos cadastrados.
- Validação da existência do cliente e dos produtos.
- Verificação e atualização do estoque.
- Proteção contra venda acima do estoque em requisições concorrentes.
- Listagem de pedidos com dados do cliente, itens e produtos.
- Consulta de pedido por identificador.
- Paginação da listagem de pedidos.
- Cancelamento de pedidos pendentes, com devolução do estoque.
- Operações críticas executadas em transações do banco de dados.

## Endpoints

| Método | Endpoint             | Descrição                |
| ------ | -------------------- | ------------------------ |
| GET    | `/health`            | Verificar a saúde da API |
| POST   | `/orders`            | Criar pedido             |
| GET    | `/orders`            | Listar pedidos           |
| GET    | `/orders/:id`        | Consultar pedido por ID  |
| PATCH  | `/orders/:id/cancel` | Cancelar pedido pendente |

Os módulos de clientes e produtos também fazem parte da aplicação.

### Exemplo: criar pedido

`POST /orders`

```json
{
  "customerId": "ID_DO_CLIENTE",
  "items": [
    {
      "productId": "ID_DO_PRODUTO",
      "quantity": 2
    }
  ]
}
```

A API consulta os preços cadastrados no banco, calcula o total e verifica a disponibilidade do estoque antes de criar o pedido.

### Regras de negócio

- Cliente inexistente: `404 Not Found`.
- Produto inexistente: `404 Not Found`.
- Estoque insuficiente: `409 Conflict`.
- Pedido inexistente: `404 Not Found`.
- Cancelamento duplicado ou não permitido: `409 Conflict`.

O cancelamento está limitado a pedidos com status `PENDING`. A mudança de status e a devolução do estoque são realizadas na mesma transação.

## Arquitetura

O projeto mantém backend e frontend no mesmo repositório, em aplicações separadas.

```text
orderflow-api/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── lib/
│   │   └── prisma.ts
│   └── modules/
│       ├── customers/
│       ├── products/
│       └── orders/
│           ├── order.routes.ts
│           ├── order.controller.ts
│           ├── order.schema.ts
│           └── use-cases/
│               ├── create-order.use-case.ts
│               ├── list-orders.use-case.ts
│               ├── get-order.use-case.ts
│               └── cancel-order.use-case.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── package.json
└── README.md
```

A estrutura mantém a lógica de negócio nos casos de uso, enquanto os controllers tratam as requisições HTTP e suas respostas. O frontend é responsável pela apresentação dos dados e pela interação com a API.

## Como executar localmente

### Pré-requisitos

- Node.js 22 ou compatível.
- npm.
- Docker e Docker Compose.

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://orderflow:orderflow_dev@localhost:5432/orderflow?schema=public"
```

Para os testes, crie `.env.test`:

```env
DATABASE_URL="postgresql://orderflow:orderflow_test_dev@localhost:5433/orderflow_test?schema=public"
```

Esses valores correspondem às credenciais de desenvolvimento definidas no Docker Compose.

### 3. Iniciar os bancos de dados

```bash
docker compose up -d
```

O ambiente possui dois bancos PostgreSQL: um para desenvolvimento e outro para testes.

### 4. Aplicar as migrations

Banco de desenvolvimento:

```bash
npm run db:setup
```

Banco de testes:

```bash
npm run db:setup:test
```

### 5. Executar a aplicação

```bash
npm run dev
```

A API fica disponível em:

`http://localhost:3000`

Verifique a saúde do serviço:

```bash
curl http://localhost:3000/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "orderflow-api"
}
```

### 6. Instalar as dependências do frontend

```bash
cd frontend
npm install
npm run dev
Abra http://localhost:5173 no navegador.
```

## Testes e compilação

Executar todos os testes automatizados:

```bash
npm test
```

Compilar o projeto TypeScript:

```bash
npm run build
```

Os testes utilizam Vitest, Fastify `inject()` e um banco PostgreSQL separado para verificar as respostas HTTP, regras de negócio, persistência e comportamento do estoque.

O conjunto atual possui **24 testes automatizados aprovados**.

## Próximas evoluções

- Documentação interativa com OpenAPI/Swagger.
- Pipeline de CI com testes e compilação.
- Melhorias de observabilidade e tratamento de erros.
