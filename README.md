# Assessment 2026

See [ASSESSMENT](./ASSESSMENT.md) for the instructions.

# Induction Dashboard

A microservices-based induction management system with a React dashboard.

## Getting Started

This project is designed to run in a **VS Code Dev Container**, which
provides a consistent development environment with all dependencies
pre-configured.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [VS Code](https://code.visualstudio.com/) with the
  [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Running in a Dev Container (Recommended)

1. Open this folder in VS Code
2. When prompted, click **"Reopen in Container"** — or use the command
   palette (`Cmd/Ctrl+Shift+P`) and select **"Dev Containers: Reopen in
   Container"**
3. Wait for the container to build and dependencies to install
   (`npm ci` runs automatically)
4. Start the development servers:

   ```bash
   npm run dev
   ```

5. Access the services:

   | Service            | URL                                |
   | ------------------ | ---------------------------------- |
   | Dashboard (Vite)   | http://localhost:8550              |
   | Gateway Service    | http://localhost:8551              |
   | Induction Service  | http://localhost:8552/induction    |
   | Company Service    | http://localhost:8553/company      |

### Running Without the Dev Container

If you prefer to run the project directly on your machine:

#### Prerequisites

- **Node.js 24** (matches the dev container image)
- **PostgreSQL 16** running on `localhost:5432`, or use Docker:

  ```bash
  docker run -d --name postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -p 5432:5432 \
    postgres:16
  ```

- **`psql` client** — needed by the database init script
  - macOS: `brew install libpq` (or install the full `postgresql` formula)
  - Ubuntu/Debian: `apt-get install postgresql-client`

#### Setup & Run

```bash
# Install dependencies
npm ci

# Initialise databases (creates DBs, runs migrations & seeds)
DB_HOST=localhost npm run init

# Start all services
DB_HOST=localhost npm run dev
```

> **Note:** `DB_HOST` defaults to `postgres` (the Docker Compose service
> hostname). Set it to `localhost` when running outside the dev container.

### Included VS Code Extensions

The dev container automatically installs these extensions:

- **[PostgreSQL](https://marketplace.visualstudio.com/items?itemName=ckolkman.vscode-postgres)**
  (`ckolkman.vscode-postgres`) — Browse and query the PostgreSQL databases
  directly from VS Code. Connect using:
  - Host: `postgres`
  - Port: `5432`
  - User: `postgres`
  - Password: `postgres`
  - Databases: `company`, `induction`

- **[Bruno](https://marketplace.visualstudio.com/items?itemName=bruno-api-client.bruno)**
  (`bruno-api-client.bruno`) — API client for testing endpoints. A
  pre-configured collection is available in `.devcontainer/Dubug Collection/`
  with example requests for the existing services.

## Project Structure

```
/
├── .devcontainer/           # Dev container configuration
│   ├── devcontainer.json    # VS Code dev container settings
│   ├── docker-compose.yml   # Docker services (app + postgres)
│   ├── Dockerfile           # Node.js 24 + PostgreSQL client
│   └── Dubug Collection/    # Bruno API testing collection
├── apps/
│   └── dashboard/           # React frontend (Vite + MUI)
├── services/
│   ├── database-init/       # Database migrations and seeds
│   ├── gateway-service/     # API Gateway
│   ├── company-service/     # Company microservice
│   └── induction-service/   # Induction microservice
├── package.json             # Workspace root (npm workspaces)
└── turbo.json               # Turborepo task configuration
```

## Useful Commands

```bash
# Run all migrations and start all services in development mode
npm run dev

# Run a specific service
npm run dev --filter=gateway-service
npm run dev --filter=dashboard

# Re-initialize databases (drops and recreates)
npm run init

# Build all services
npm run build
```

## Database Connection

From within the dev container, connect to PostgreSQL using:

```bash
psql -h postgres -U postgres -d company
psql -h postgres -U postgres -d induction
```

Outside the dev container, use `localhost` instead:

```bash
psql -h localhost -U postgres -d company
psql -h localhost -U postgres -d induction
```

Password: `postgres`

## Existing Services

### Company Service (Port 8553)

| Method | Endpoint   | Description           |
| ------ | ---------- | --------------------- |
| GET    | `/health`  | Health check          |
| GET    | `/company` | Returns all companies |

### Induction Service (Port 8552)

| Method | Endpoint                 | Description                              |
| ------ | ------------------------ | ---------------------------------------- |
| GET    | `/health`                | Health check                             |
| GET    | `/induction`             | Returns all inductions                   |
| GET    | `/induction/records/all` | Returns all induction records            |
| GET    | `/induction/:id/records` | Returns records for a specific induction |

## Database Schema

**Company Database** (`company`)

```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Induction Database** (`induction`)

```sql
CREATE TABLE inductions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE induction_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    induction_id UUID NOT NULL REFERENCES inductions(id),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    company_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
