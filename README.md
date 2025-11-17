# Billing Platform - Distributed Microservices Architecture

A production-ready distributed billing platform built with **NestJS**, **gRPC**, **Consul**, and **PostgreSQL**. This
project demonstrates enterprise-grade microservices patterns including service discovery, dynamic load balancing,
inter-service orchestration, and JWT authentication.

**Tech Stack:**

- Framework: NestJS (TypeScript)
- RPC Protocol: gRPC with Protocol Buffers
- Service Discovery: HashiCorp Consul
- Databases: PostgreSQL (2x instances)
- Package Manager: pnpm (monorepo)
- Containerization: Docker & Docker Compose

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Configuration](#configuration)
6. [API Documentation](#api-documentation)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Development Workflow](#development-workflow)
10. [Production Deployment](#production-deployment)

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     HTTP Clients / Frontend                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────────┐
            │   HTTP Gateway (Port 3000) │
            │  - JWT Authentication      │
            │  - Request Validation      │
            │  - Service Routing         │
            └────────┬─────────┬─────────┘
                     │         │
         ┌───────────▼──┐  ┌──▼──────────────┐
         │   gRPC Call  │  │  Service        │
         │ to Services  │  │  Discovery      │
         │   (Buffered) │  │  (Dynamic)      │
         └───────┬──────┘  └────────┬────────┘
                 │                  │
         ┌───────▼──────────────────▼──────────┐
         │    HashiCorp Consul (Port 8500)     │
         │  - Service Registry                │
         │  - Health Check Management         │
         │  - DNS-based Discovery             │
         └────┬────────────────┬──────────────┘
              │                │
      ┌───────▼────────┐ ┌─────▼──────────┐
      │  user-service  │ │invoice-service │
      │   (Port 50051) │ │  (Port 50052)  │
      │ - gRPC Server  │ │ - gRPC Server  │
      │ - User Logic   │ │ - Invoice Mgmt │
      └───────┬────────┘ └─────┬──────────┘
              │                │
      ┌───────▼────────┐ ┌─────▼──────────┐
      │  postgres-user │ │postgres-invoice│
      │   (Port 5432)  │ │ (Port 5433)    │
      └────────────────┘ └────────────────┘
```

### Key Architectural Components

#### 1. **Monorepo Structure (pnpm Workspaces)**

- **Unified dependency management** across all applications
- **Shared libraries** for protobuf definitions and common utilities
- **Consistent tooling** via root `package.json` configuration
- **Dependency hoisting** to reduce node_modules size

#### 2. **HTTP Gateway**

- Single entry point for all client requests
- **Passport.js** authentication with JWT tokens
- **Request validation** using class validators
- **Service routing** to appropriate microservices via gRPC
- **No hard-coded service URLs** — all discovery is dynamic via Consul

#### 3. **gRPC Microservices**

Two independent services with their own databases:

| Service           | Port  | Responsibility                                 | Database           |
|-------------------|-------|------------------------------------------------|--------------------|
| `user-service`    | 50051 | User profile management, credential validation | `postgres-user`    |
| `invoice-service` | 50052 | Invoice CRUD operations, financial records     | `postgres-invoice` |

**Why gRPC?**

- ~7x faster than REST (binary serialization via Protocol Buffers)
- Strong typing with auto-generated code from `.proto` files
- Built-in support for streaming (future-proofing)
- HTTP/2 multiplexing enables efficient concurrent requests

#### 4. **Service Discovery via Consul**

Each microservice:

- Registers with Consul on startup with metadata (name, address, port, health check)
- Implements a **TCP health check** that Consul polls every 10 seconds
- Gracefully deregisters on shutdown
- Provides **filtered service discovery** to the gateway (only healthy instances)

#### 5. **Dynamic Load Balancing (ClientProvider)**

The gateway includes a custom `ClientProvider` that:

1. **Queries Consul's Health API** for healthy service instances
2. **Implements round-robin load balancing** across multiple instances
3. **Caches gRPC clients** per instance to avoid connection overhead
4. **Throws 503 Service Unavailable** if no healthy instances are found
5. **Enables horizontal scaling** without gateway reconfiguration

---

## Project Structure

```
billing-platform/
├── apps/
│   ├── gateway/                          # HTTP API Gateway
│   │   ├── src/
│   │   │   ├── auth/                     # Authentication module (Passport + JWT)
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── local.strategy.ts
│   │   │   │   └── jwt-auth.guard.ts
│   │   │   ├── users/                    # User API routes
│   │   │   │   ├── users.controller.ts
│   │   │   │   └── users.service.ts
│   │   │   ├── invoices/                 # Invoice API routes
│   │   │   │   ├── invoices.controller.ts
│   │   │   │   └── invoices.service.ts
│   │   │   ├── reports/                  # Cross-service orchestration
│   │   │   │   ├── reports.controller.ts
│   │   │   │   └── reports.service.ts
│   │   │   ├── common/                   # Shared utilities
│   │   │   │   ├── client.provider.ts    # gRPC client factory with Consul discovery
│   │   │   │   └── filters/              # Global exception filters
│   │   │   └── main.ts
│   │   ├── test/                         # Test files
│   │   │   ├── auth.e2e-spec.ts
│   │   │   └── app.e2e-spec.ts
│   │   ├── Dockerfile
│   │   ├── nest-cli.json
│   │   └── package.json
│   │
│   ├── user-service/                     # User Microservice (gRPC)
│   │   ├── src/
│   │   │   ├── users/                    # User domain logic
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── user.entity.ts
│   │   │   │   └── user.repository.ts
│   │   │   ├── database/
│   │   │   │   └── migrations/           # Database versioning (optional: TypeORM)
│   │   │   ├── main.ts                   # Microservice entry point
│   │   │   └── consul.service.ts         # Consul registration/deregistration
│   │   ├── seed.ts                       # Database seeding script
│   │   ├── Dockerfile
│   │   ├── nest-cli.json
│   │   └── package.json
│   │
│   └── invoice-service/                  # Invoice Microservice (gRPC)
│       ├── src/
│       │   ├── invoices/
│       │   │   ├── invoices.controller.ts
│       │   │   ├── invoices.service.ts
│       │   │   ├── invoice.entity.ts
│       │   │   └── invoice.repository.ts
│       │   ├── database/
│       │   │   └── migrations/
│       │   ├── main.ts
│       │   └── consul.service.ts
│       ├── seed.ts
│       ├── Dockerfile
│       ├── nest-cli.json
│       └── package.json
│
├── packages/
│   ├── @app/proto/                       # Protocol Buffer Definitions
│   │   ├── src/
│   │   │   ├── user.proto
│   │   │   ├── invoice.proto
│   │   │   └── common.proto
│   │   └── package.json
│   │
│   └── @app/common/                      # Shared Utilities
│       ├── src/
│       │   ├── constants/                # Shared constants
│       │   ├── dto/                      # Data transfer objects
│       │   ├── decorators/               # Custom decorators
│       │   ├── exceptions/               # Custom exceptions
│       │   └── utils/                    # Helper functions
│       └── package.json
│
├── docker-compose.yml                    # Orchestration for all services
├── pnpm-workspace.yaml                   # Monorepo configuration
├── package.json                          # Root package.json
├── tsconfig.json                         # Root TypeScript config
├── jest.config.js                        # Jest configuration
├── .gitignore
└── README.md
```

---

## Prerequisites

### System Requirements

- **Node.js**: v18.x or higher (verify with `node --version`)
- **pnpm**: v8.x or higher (install with `npm install -g pnpm`)
- **Docker**: v24.x or higher
- **Docker Compose**: v2.20.x or higher
- **Git**: For version control

## Quick Start

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/AryanKumarOfficial/Billing-Platform-Monorepo
cd Billing-Platform-Monorepo

# Install all dependencies across monorepo
pnpm install

# Verify installation
pnpm list --depth=0
```

### Step 2: Build Protocol Buffer Definitions

Protocol Buffers must be compiled before services start:

```bash
# Build proto files (copies compiled definitions to dist/)
pnpm run proto:build

# Verify proto build output
ls -la packages/@app/proto/dist/
```

**What happens:**

- `.proto` files are compiled to TypeScript definitions
- Generated code is placed in `dist/` folders
- Other applications import from these compiled definitions

### Step 3: Start Infrastructure with Docker Compose

```bash
# Build Docker images and start all services
docker-compose up --build

# Expected output:
# - Consul UI: http://localhost:8500
# - Gateway: http://localhost:3000
# - User Service: gRPC on 50051
# - Invoice Service: gRPC on 50052
```

**Services Overview:**

| Service             | URL                   | Purpose                             |
|---------------------|-----------------------|-------------------------------------|
| **Consul**          | http://localhost:8500 | Service registry & health dashboard |
| **Gateway**         | http://localhost:3000 | REST API entry point                |
| **User Service**    | localhost:50051       | gRPC server                         |
| **Invoice Service** | localhost:50052       | gRPC server                         |
| **User DB**         | localhost:5432        | PostgreSQL for user data            |
| **Invoice DB**      | localhost:5433        | PostgreSQL for invoice data         |

**First-time checks:**

```bash
# In another terminal, verify services are running
curl http://localhost:8500/v1/agent/services | jq .

# Check Consul UI
# Open http://localhost:8500 in browser
# Navigate to "Services" tab
# Should see: consul, gateway, user-service, invoice-service
```

### Step 4: Seed the Databases (Optional but Recommended)

```bash
# Seed user data
docker-compose exec user-service pnpm run seed

# Seed invoice data (references user IDs)
docker-compose exec invoice-service pnpm run seed

# Expected output:
# "✓ Seeded X users"
# "✓ Seeded Y invoices"
```

### Step 5: Test the API

```bash
# 1. Login to get JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@billing.com","password":"password123"}'

# Response:
# {
#   "access_token": "eyJhbGc...",
#   "user": { "id": "...", "email": "alice@billing.com", "name": "Alice" }
# }

# 2. Save the token
export TOKEN="<access_token_from_response>"

# 3. Fetch users list
curl http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN"

# 4. Fetch invoices with pagination
curl "http://localhost:3000/invoices?limit=5&offset=0" \
  -H "Authorization: Bearer $TOKEN"

# 5. Get cross-service report
curl http://localhost:3000/reports/user-invoices \
  -H "Authorization: Bearer $TOKEN"
```

---

## Configuration

### Environment Variables

Each service can be configured via `.env` files. Create them from provided templates:

#### Gateway (`.env.local` in `apps/gateway/`)

```env
# Server Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=7d

# Consul Configuration
CONSUL_HOST=consul
CONSUL_PORT=8500
CONSUL_SERVICE_ID=gateway
CONSUL_SERVICE_NAME=gateway
CONSUL_SERVICE_PORT=3000

# Database (for user context/audit logs, optional)
DATABASE_URL=postgresql://user:password@postgres-user:5432/billing
```

#### User Service (`.env.local` in `apps/user-service/`)

```env
NODE_ENV=development
LOG_LEVEL=debug

# gRPC Configuration
GRPC_PORT=50051
GRPC_HOST=0.0.0.0

# Consul Configuration
CONSUL_HOST=consul
CONSUL_PORT=8500
CONSUL_SERVICE_ID=user-service-1
CONSUL_SERVICE_NAME=user-service
CONSUL_SERVICE_PORT=50051
CONSUL_HEALTH_CHECK_INTERVAL=10s

# Database
DATABASE_URL=postgresql://user:password@postgres-user:5432/user_db
DATABASE_POOL_SIZE=10
DATABASE_IDLE_TIMEOUT=30000

# Service Discovery
SERVICE_DISCOVERY_ENABLED=true
```

#### Invoice Service (`.env.local` in `apps/invoice-service/`)

```env
NODE_ENV=development
LOG_LEVEL=debug

GRPC_PORT=50052
GRPC_HOST=0.0.0.0

CONSUL_HOST=consul
CONSUL_PORT=8500
CONSUL_SERVICE_ID=invoice-service-1
CONSUL_SERVICE_NAME=invoice-service
CONSUL_SERVICE_PORT=50052
CONSUL_HEALTH_CHECK_INTERVAL=10s

DATABASE_URL=postgresql://user:password@postgres-invoice:5432/invoice_db
DATABASE_POOL_SIZE=10
DATABASE_IDLE_TIMEOUT=30000

SERVICE_DISCOVERY_ENABLED=true
```

### Consul Health Check Configuration

Health checks run every **10 seconds** by default:

```typescript
// In ConsulService
const registration = {
    ID: `${serviceName}-${port}`,
    Name: serviceName,
    Address: hostname,
    Port: port,
    Check: {
        TCP: `${hostname}:${port}`,
        Interval: '10s',
        Timeout: '5s',
        DeregisterCriticalServiceAfter: '30s', // Remove if unhealthy for 30s
    },
};
```

### Docker Compose Configuration

Edit `docker-compose.yml` to customize:

```yaml
services:
  consul:
    ports:
      - "8500:8500"  # HTTP API
      - "8600:8600/udp"  # DNS (optional)

  user-service:
    environment:
      - CONSUL_HOST=consul
      - DATABASE_URL=postgresql://postgres:password@postgres-user:5432/user_db
    depends_on:
      - consul
      - postgres-user

  invoice-service:
    environment:
      - CONSUL_HOST=consul
      - DATABASE_URL=postgresql://postgres:password@postgres-invoice:5432/invoice_db
    depends_on:
      - consul
      - postgres-invoice
```

---

## API Documentation

### Authentication

#### `POST /auth/login`

**Description:** Authenticate a user and receive a JWT token.

**Request:**

```json
{
  "email": "alice@billing.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@billing.com",
    "name": "Alice Johnson"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid email or password format
- `401 Unauthorized` - Email/password combination not found
- `503 Service Unavailable` - User service unreachable

**Implementation Details:**

1. Gateway uses Passport's `local` strategy
2. Credentials are validated via gRPC call to `user-service.ValidateUser()`
3. On success, JWT is signed with `JWT_SECRET` and set expiration
4. Token includes `sub` (user ID) and `email` claims

---

### Protected Endpoints

**All endpoints below require:**

```
Authorization: Bearer <access_token>
```

In requests, include the header:

```bash
curl http://localhost:3000/users \
  -H "Authorization: Bearer eyJhbGc..."
```

---

### Users Endpoints

#### `GET /users`

**Description:** List all users with pagination.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | 10 | Max records per page |
| `offset` | integer | 0 | Records to skip |

**Examples:**

```bash
# Get first 10 users
curl "http://localhost:3000/users" \
  -H "Authorization: Bearer $TOKEN"

# Get users 11-20
curl "http://localhost:3000/users?limit=10&offset=10" \
  -H "Authorization: Bearer $TOKEN"

# Get first 25 users
curl "http://localhost:3000/users?limit=25" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "alice@billing.com",
      "name": "Alice Johnson",
      "createdAt": "2025-01-15T10:30:00Z"
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "email": "bob@billing.com",
      "name": "Bob Smith",
      "createdAt": "2025-01-14T15:45:00Z"
    }
  ],
  "total": 100,
  "limit": 10,
  "offset": 0
}
```

---

#### `GET /users/:id`

**Description:** Get a specific user by ID.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | User ID |

**Example:**

```bash
curl "http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alice@billing.com",
  "name": "Alice Johnson",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Error Responses:**

- `404 Not Found` - User not found
- `400 Bad Request` - Invalid UUID format

---

### Invoices Endpoints

#### `GET /invoices`

**Description:** List all invoices with pagination.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | 10 | Max records per page |
| `offset` | integer | 0 | Records to skip |

**Example:**

```bash
curl "http://localhost:3000/invoices?limit=20&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "inv-001",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 150.00,
      "currency": "USD",
      "status": "paid",
      "issuedDate": "2025-01-10T00:00:00Z",
      "dueDate": "2025-02-10T00:00:00Z",
      "createdAt": "2025-01-10T14:20:00Z"
    }
  ],
  "total": 500,
  "limit": 20,
  "offset": 0
}
```

---

### Reports Endpoints

#### `GET /reports/user-invoices`

**Description:** Advanced query combining invoice and user data from multiple services.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | 10 | Max records per page |
| `offset` | integer | 0 | Records to skip |

**Implementation (Cross-Service Orchestration):**

1. Gateway queries `invoice-service.ListInvoices(limit, offset)`
2. Extracts unique `userIds` from response
3. Makes batch call to `user-service.FindByIds(userIds)`
4. Combines invoice and user data into unified response
5. Returns paginated results with nested user objects

**Example:**

```bash
curl "http://localhost:3000/reports/user-invoices?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "inv-001",
      "amount": 150.00,
      "currency": "USD",
      "status": "paid",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "alice@billing.com",
        "name": "Alice Johnson"
      }
    },
    {
      "id": "inv-002",
      "amount": 250.00,
      "currency": "USD",
      "status": "pending",
      "user": {
        "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "email": "bob@billing.com",
        "name": "Bob Smith"
      }
    }
  ],
  "total": 42,
  "limit": 5,
  "offset": 0
}
```

**Error Handling:**

- `503 Service Unavailable` - If `invoice-service` or `user-service` unreachable
- `400 Bad Request` - Invalid pagination parameters

---

## Testing

### Unit and Integration Tests

```bash
# Run all tests across monorepo
pnpm test

# Run tests for specific package
pnpm --filter "gateway" test
pnpm --filter "user-service" test
pnpm --filter "invoice-service" test

# Run tests with coverage
pnpm test -- --coverage

# Run tests in watch mode (auto-rerun on file changes)
pnpm test -- --watch
```

### End-to-End (E2E) Tests

```bash
# Run E2E tests for gateway
pnpm --filter "gateway" test:e2e

# Run specific E2E test file
pnpm --filter "gateway" test:e2e -- auth.e2e-spec.ts

# Run E2E tests with coverage
pnpm --filter "gateway" test:e2e -- --coverage
```

### E2E Test Structure

E2E tests run against a live application and verify:

- Authentication flow (login, JWT generation)
- Protected route access
- Service-to-service communication
- Pagination and query parameters
- Error handling (4xx, 5xx responses)

**Example E2E test:**

```typescript
describe('Auth (e2e)', () => {
    it('POST /auth/login - should return access token', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({email: 'alice@billing.com', password: 'password123'})
            .expect(200);

        expect(res.body).toHaveProperty('access_token');
        expect(res.body.user.email).toBe('alice@billing.com');
    });

    it('GET /users - should require JWT', async () => {
        await request(app.getHttpServer())
            .get('/users')
            .expect(401);
    });
});
```

### Manual Testing with cURL

**Test workflow:**

```bash
# 1. Start the system
docker-compose up --build

# 2. In another terminal, login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@billing.com","password":"password123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"

# 3. Test protected endpoint
curl "http://localhost:3000/users" \
  -H "Authorization: Bearer $TOKEN" \
  | jq .

# 4. Test pagination
curl "http://localhost:3000/invoices?limit=5&offset=0" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data | length'

# 5. Test cross-service endpoint
curl http://localhost:3000/reports/user-invoices \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[0]'
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: `Services not appearing in Consul UI`

**Symptoms:**

- Consul UI shows no services registered
- HTTP 503 errors when calling protected endpoints

**Root Causes:**

1. Service health check is failing
2. Services cannot reach Consul
3. Service registration is misconfigured

**Solutions:**

```bash
# 1. Check Consul service status
curl http://localhost:8500/v1/agent/services | jq .

# 2. Check service health (should show all checks)
curl http://localhost:8500/v1/agent/checks | jq .

# 3. Inspect logs
docker-compose logs user-service
docker-compose logs invoice-service
docker-compose logs gateway

# 4. Verify Consul connectivity from services
docker-compose exec user-service curl http://consul:8500/v1/agent/self

# 5. Check service configuration
docker-compose exec user-service env | grep CONSUL
```

#### Issue: `Connection refused: Cannot reach microservice`

**Symptoms:**

- Gateway returns 503 Service Unavailable
- Logs show "gRPC call failed"

**Root Causes:**

1. gRPC port not exposed in Docker
2. Service not started
3. Incorrect service discovery settings

**Solutions:**

```bash
# 1. Verify services are running
docker-compose ps

# 2. Check gRPC ports are listening
docker-compose exec user-service lsof -i :50051

# 3. Test gRPC connectivity
docker-compose exec gateway \
  grpcurl -plaintext localhost:50051 list

# 4. Check gateway gRPC client configuration
docker-compose logs gateway | grep "gRPC"
```

#### Issue: `Database connection errors`

**Symptoms:**

- "ECONNREFUSED 127.0.0.1:5432"
- "database does not exist"

**Root Causes:**

1. Postgres container not running
2. Incorrect DATABASE_URL environment variable
3. Database not initialized

**Solutions:**

```bash
# 1. Check Postgres containers
docker-compose ps | grep postgres

# 2. Verify DATABASE_URL format
docker-compose exec user-service env | grep DATABASE

# 3. Check Postgres logs
docker-compose logs postgres-user
docker-compose logs postgres-invoice

# 4. Connect to database manually
psql -h localhost -p 5432 -U postgres -d user_db

# 5. Run migrations manually
docker-compose exec user-service npm run migration:run
```

#### Issue: `JWT token rejected (401 Unauthorized)`

**Symptoms:**

- Valid token returns 401
- "jwt malformed" in logs

**Root Causes:**

1. JWT_SECRET mismatch between auth and verification
2. Token expired
3. Token tampered with

**Solutions:**

```bash
# 1. Verify JWT_SECRET is set correctly
docker-compose exec gateway env | grep JWT_SECRET

# 2. Decode token to inspect claims
echo "eyJhbGc..." | jq -R 'split(".") | .[1] | @base64d'

# 3. Check token expiration
# Look for "exp" field in decoded JWT

# 4. Generate new token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@billing.com","password":"password123"}'
```

#### Issue: `Seeding script fails`

**Symptoms:**

- "Error: connect ECONNREFUSED"
- "relation does not exist"

**Root Causes:**

1. Database container not ready
2. Database schema not initialized
3. Incorrect connection string

**Solutions:**

```bash
# 1. Wait for database to be ready
docker-compose up postgres-user postgres-invoice
sleep 10

# 2. Check if tables exist
docker-compose exec postgres-user psql -U postgres -d user_db -c "\dt"

# 3. Run migrations first
docker-compose exec user-service npm run migration:run

# 4. Then run seed
docker-compose exec user-service npm run seed

# 5. Verify seeded data
docker-compose exec postgres-user psql -U postgres -d user_db -c "SELECT COUNT(*) FROM users;"
```

#### Issue: `Docker Compose build fails`

**Symptoms:**

- "Error response from daemon: no such file or directory"
- "failed to solve with frontend dockerfile"

**Root Causes:**

1. Missing Dockerfile
2. Incorrect working directory
3. pnpm monorepo dependencies not installed

**Solutions:**

```bash
# 1. Ensure pnpm install ran successfully
pnpm install
pnpm run proto:build

# 2. Verify Dockerfile exists
ls apps/gateway/Dockerfile
ls apps/user-service/Dockerfile
ls apps/invoice-service/Dockerfile

# 3. Check docker-compose.yml syntax
docker-compose config

# 4. Clean and rebuild
docker-compose down -v
docker system prune -a
docker-compose up --build
```

#### Issue: `Out of memory errors in Docker`

**Symptoms:**

- "JavaScript heap out of memory"
- Container exits unexpectedly

**Solutions:**

```bash
# 1. Increase Docker memory limit
# Edit docker-compose.yml:
# user-service:
#   mem_limit: 2g
#   memswap_limit: 2g

# 2. Monitor memory usage
docker stats

# 3. Rebuild with optimizations
docker-compose up --build --scale user-service=2
```

---

## Development Workflow

### Setting Up Development Environment

#### 1. Clone and Install

```bash
git clone https://github.com/AryanKumarOfficial/Billing-Platform-Monorepo
cd Billing-Platform-Monorepo
pnpm install
pnpm run proto:build
```

#### 2. Start Services (Development Mode)

```bash
# Terminal 1: Start infrastructure only
docker-compose up postgres-user postgres-invoice consul

# Terminal 2: Run gateway (watch mode)
pnpm --filter "gateway" start:dev

# Terminal 3: Run user-service (watch mode)
pnpm --filter "user-service" start:dev

# Terminal 4: Run invoice-service (watch mode)
pnpm --filter "invoice-service" start:dev
```

This setup allows hot-reloading on code changes via NestJS's watch mode.

#### 3. Common Development Commands

```bash
# Format code
pnpm run format

# Lint code
pnpm run lint

# Run type checking
pnpm run type-check

# Build all packages
pnpm run build

# Build for production
pnpm run build -- --prod
```

### Adding a New Service

1. **Create service directory:**
   ```bash
   mkdir apps/order-service
   cp -r apps/user-service/* apps/order-service/
   ```

2. **Register in pnpm-workspace.yaml** (already configured for `apps/*`)

3. **Update docker-compose.yml:**
   ```yaml
   order-service:
     build:
       context: .
       dockerfile: apps/order-service/Dockerfile
     environment:
       - GRPC_PORT=50053
       - CONSUL_SERVICE_PORT=50053
     depends_on:
       - consul
       - postgres-order
   ```

4. **Define proto contracts** in `packages/@app/proto/order.proto`

5. **Build and start:**
   ```bash
   pnpm run proto:build
   docker-compose up --build
   ```

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-invoice-endpoint

# 2. Make changes, commit
git add apps/invoice-service/src/...
git commit -m "feat: add invoice export endpoint"

# 3. Run tests before pushing
pnpm test
pnpm test:e2e

# 4. Push and create pull request
git push origin feature/new-invoice-endpoint

# 5. After merge, pull latest
git checkout main
git pull origin main
pnpm install  # Update dependencies if package.json changed
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests pass: `pnpm test && pnpm test:e2e`
- [ ] Environment variables configured for production
- [ ] JWT_SECRET is strong and unique
- [ ] Database backups scheduled
- [ ] Logging and monitoring configured
- [ ] Health endpoints tested
- [ ] Load testing completed
- [ ] Security audit passed

### Deployment Strategy

#### Option 1: Kubernetes (Recommended for Scale)

```yaml
# user-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
        - name: user-service
          image: billing-platform/user-service:latest
          ports:
            - containerPort: 50051
          env:
            - name: GRPC_PORT
              value: "50051"
            - name: CONSUL_HOST
              value: consul
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
          livenessProbe:
            tcpSocket:
              port: 50051
            initialDelaySeconds: 30
            periodSeconds: 10
```

#### Option 2: Docker Compose on Single Server

```bash
# On production server:
git clone https://github.com/AryanKumarOfficial/Billing-Platform-Monorepo
cd Billing-Platform-Monorepo

# Set production environment
export NODE_ENV=production
export JWT_SECRET=$(openssl rand -hex 32)

# Pull latest images
docker-compose pull

# Start services with restart policy
docker-compose up -d

# View logs
docker-compose logs -f gateway
```

### Environment Configuration

**Production `.env`:**

```env
# Security
NODE_ENV=production
JWT_SECRET=<generate-with-openssl-rand>
JWT_EXPIRATION=24h

# Server
PORT=3000
LOG_LEVEL=info

# Consul (managed service)
CONSUL_HOST=consul.example.com
CONSUL_PORT=8500
CONSUL_DATACENTER=us-east-1

# Database (encrypted, managed)
DATABASE_URL=postgresql://app:$PASSWORD@rds-instance.amazonaws.com:5432/billing_db
DATABASE_POOL_SIZE=20
DATABASE_SSL=true

# Monitoring
DATADOG_ENABLED=true
SENTRY_DSN=https://key@sentry.io/project

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Monitoring and Logging

**Recommended Stack:**

- **Logs:** ELK Stack (Elasticsearch, Logstash, Kibana) or Datadog
- **Metrics:** Prometheus + Grafana
- **Tracing:** Jaeger or Datadog APM
- **Alerts:** PagerDuty or Opsgenie

**Health Check Endpoints:**

```bash
# Gateway health
curl http://localhost:3000/health

# Service health via Consul
curl http://localhost:8500/v1/health/service/user-service
```

### Scaling Considerations

**Horizontal Scaling:**

```bash
# Run multiple instances of invoice-service
docker-compose up -d --scale invoice-service=3

# Consul automatically discovers all instances
# Gateway uses round-robin to distribute load
```

**Database Scaling:**

- Use read replicas for reporting queries
- Implement connection pooling (pgBouncer)
- Consider sharding for large data volumes

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [gRPC-Node Documentation](https://grpc.io/docs/languages/node/)
- [Consul Documentation](https://www.consul.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pnpm Monorepo Guide](https://pnpm.io/workspaces)
- [Protocol Buffers Guide](https://developers.google.com/protocol-buffers)

---

## Support and Contributing

For issues, questions, or contributions:

1. Check existing GitHub issues
2. Run troubleshooting steps from [Troubleshooting](#troubleshooting) section
3. Provide logs and error messages
4. Submit detailed bug reports
5. Follow contribution guidelines in CONTRIBUTING.md

---

## License

[LICENSE](LICENSE)
