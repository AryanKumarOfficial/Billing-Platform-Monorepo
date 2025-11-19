# Billing Platform: Distributed Microservices Architecture

A production-ready distributed billing platform built with **NestJS**, **gRPC**, **Consul**, **PostgreSQL**, and **Next.js**. This project demonstrates enterprise-grade microservices patterns including service discovery, dynamic load balancing, inter-service orchestration, and JWT authentication.

**Tech Stack:**

- **Frontend**: Next.js (React, Tailwind CSS)
- **Gateway**: NestJS (HTTP REST, Passport.js)
- **Microservices**: NestJS (gRPC with Protocol Buffers)
- **Service Discovery**: HashiCorp Consul
- **Databases**: PostgreSQL (2x instances)
- **Package Manager**: pnpm (monorepo)
- **Containerization**: Docker & Docker Compose

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

---

## Architecture Overview

### System Diagram

```mermaid
graph TD
    Client[Frontend / HTTP Client] -->|HTTP:3000| Frontend[Next.js Dashboard]
    Client -->|HTTP:5000| Gateway[API Gateway]
    Frontend -->|REST API| Gateway
    Gateway -->|Service Discovery| Consul[HashiCorp Consul :8500]

    subgraph Microservices
        Gateway -->|gRPC:50051| User[User Service]
        Gateway -->|gRPC:50052| Invoice[Invoice Service]
    end

    User -->|TCP| DB1[(Postgres User)]
    Invoice -->|TCP| DB2[(Postgres Invoice)]
````

### Key Components

1.  **Frontend (Port 3000)**: Next.js dashboard for users to login and view reports.
2.  **HTTP Gateway (Port 5000)**: Entry point for API requests. Handles auth and orchestrates gRPC calls.
3.  **Consul (Port 8500)**: Service registry and health checking.
4.  **User Service (Port 50051)**: gRPC service for user management.
5.  **Invoice Service (Port 50052)**: gRPC service for invoice management.

-----

## Project Structure

```
billing-platform/
├── apps/
│   ├── frontend/          # Next.js Dashboard
│   ├── gateway/           # HTTP API Gateway (BFF)
│   ├── user-service/      # User gRPC Microservice
│   ├── invoice-service/   # Invoice gRPC Microservice
│   └── proto/             # Shared Protobuf Definitions
├── libs/
│   └── common/            # Shared Utilities (Auth, Config)
├── docker-compose.yml     # Orchestration
├── pnpm-workspace.yaml    # Monorepo Config
└── package.json           # Root Dependencies
```

-----

## Prerequisites

- **Node.js**: v18.x or higher
- **pnpm**: v8.x or higher
- **Docker** & **Docker Compose**

-----

## Quick Start

### Step 1: Clone and Install

```bash
git clone [https://github.com/AryanKumarOfficial/Billing-Platform-Monorepo](https://github.com/AryanKumarOfficial/Billing-Platform-Monorepo)
cd Billing-Platform-Monorepo

# Install dependencies
pnpm install
```

### Step 2: Build Protobufs

Compile the shared `.proto` files before starting the services:

```bash
pnpm run proto:build
```

### Step 3: Start Infrastructure

Start all services (Consul, Databases, Backend Services, Frontend) using Docker Compose:

```bash
docker-compose up --build
```

### Step 4: Seed the Databases

**Crucial Step:** Before using the Frontend Dashboard, you must seed the databases with initial data. Run these commands from the project root:

```bash
# 1. Seed User Service (Creates default users)
pnpm --filter user-service seed:prod

# 2. Seed Invoice Service (Creates invoices linked to users)
pnpm --filter invoice-service seed:prod
```

### Step 5: Access the Application

- **Frontend Dashboard**: [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)
    - Login with: `alice@billing.com` / `password123`
- **Consul UI**: [http://localhost:8500](https://www.google.com/search?q=http://localhost:8500)
- **API Gateway**: [http://localhost:5000](https://www.google.com/search?q=http://localhost:5000)

-----

## API Documentation (Gateway)

**Base URL**: `http://localhost:5000`

### 1\. Authentication

- **POST** `/auth/login`
    - Body: `{ "email": "alice@billing.com", "password": "password123" }`

### 2\. Invoices

- **GET** `/invoices` (Requires Bearer Token)
    - Query: `?limit=10&offset=0`

### 3\. Reports (Cross-Service)

- **GET** `/reports/user-invoices` (Requires Bearer Token)
    - Returns combined data from User and Invoice services.

-----

## Troubleshooting

### "Incorrect arguments passed" Error

If you see this in the Gateway logs, it means the gRPC client wrapper is missing the callback. Ensure you are using the updated `ClientProvider` or wrapper logic that promisifies the gRPC calls.

### Frontend shows "Login Failed"

- Check if the Gateway is running on port **5000**.
- Ensure CORS is enabled in the Gateway for `http://localhost:3000`.
- Verify the database is seeded (`pnpm --filter user-service seed:prod`).

### "sh: next: not found" in Docker

This usually means `node_modules` were not correctly copied or installed in the frontend Dockerfile. Ensure your Dockerfile explicitly copies the workspace dependencies or runs `pnpm install`.
