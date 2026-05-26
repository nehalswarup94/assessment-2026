# Copilot instructions for this repository

Purpose
- Provide actionable, repo-specific guidance for Copilot sessions working on this monorepo.

1) Build, test, and lint commands
- Recommended dev environment: VS Code Dev Container (Node 24) as described in README.md.

Top-level (monorepo) commands
- Start development (all services + dashboard): npm run dev  # runs `turbo dev`
- Build all packages: npm run build  # runs `turbo build`
- Run turbo tasks directly: npx turbo run <task>

Per-package commands (examples)
- Run a single service in dev (turbo filter): npm run dev -- --filter=gateway-service
- Alternatively, run a package script directly with npm workspaces: npm --workspace=gateway-service run dev
- Build a single package: npm run build -- --filter=company-service  OR npm --workspace=company-service run build

Database initialization
- Run all DB init tasks (uses workspace `database-init`): npx turbo run init
- Run database-init directly (recommended when debugging): DB_HOST=localhost npm --workspace=database-init run init
- The database-init script requires `psql` CLI and applies sql files from migrations/<db> and seeds/<db>.

Tests & Lint
- There are no test or lint scripts defined at the workspace root or in packages currently.
- If tests are added, run a single package's tests with: npm --workspace=<pkg> run test -- <test-pattern>
- Or run across workspaces with turbo: npx turbo run test --filter=<pkg>

2) High-level architecture
- Monorepo managed by npm workspaces + Turborepo (turbo.json). Workspaces include services/* and apps/*.
- apps/dashboard: React (Vite + TypeScript + MUI) served on port 8550 in dev.
- services/
  - gateway-service: lightweight Express gateway (port 8551)
  - induction-service: Express + routers, provides /induction endpoints (port 8552)
  - company-service: Express + routers, provides /company endpoints (port 8553)
  - database-init: shell-based migration/seeding tool
- Inter-service dependency: many services reference the local workspace package `database-init` so migrations/seeds are centrally managed.
- Dev container is used for a consistent environment; Docker Compose in .devcontainer brings up postgres (Postgres 16) and services with hostnames used in README.
- turbo dev depends on the init task (turbo.json): dev -> ^init. The dev task is persistent.

3) Key conventions and patterns
- TypeScript-first services: packages use TypeScript and run in development with `tsx watch` (see package.json). Production builds use `tsc`.
- Express apps mount routers under a path (e.g., inductionRouter mounted at /induction). Routers export a default Router.
- Ports are fixed in code to defaults: dashboard 8550, gateway 8551, induction 8552, company 8553. Override via PORT env var.
- Database-init: uses init.sh and expects DB_HOST/DB_PORT/DB_USER/DB_PASSWORD environment variables. It uses psql and idempotently creates DBs and applies migrations/seeds from migrations/ and seeds/.
- Workspace scripting: prefer turbo filters for partial runs (dev/build) and npm workspace flags for running single-package scripts directly.
- No central lint/test config exists; if adding, prefer placing scripts in package.json of the package and using turbo to run them consistently across workspaces.

Files and locations worth noting
- /apps/dashboard/ — Vite + React + TypeScript app
- /services/*/src — TypeScript source for each service
- /services/database-init/init.sh — DB creation, migrations and seeds logic
- /turbo.json — task graph (init, dev, build). dev depends on ^init

AI/automation guidance for Copilot sessions
- Make surgical, workspace-scoped changes. Use npm --workspace or turbo --filter when testing locally.
- Verify changes by running npm run build (or the specific package build) and, where applicable, `DB_HOST=localhost npm --workspace=database-init run init` to ensure DB migrations still apply.
- If adding tests/lint, add scripts to the relevant package.json and run via turbo so CI can pick them up.

Other assistant configs
- No CLAUDE.md, AGENTS.md, .cursorrules, .windsurfrules, CONVENTIONS.md, or AIDER_CONVENTIONS.md were found in the repository root. If present, include relevant sections here.

Notes
- This file is generated from README.md, package.jsons and key service files. Keep it updated when adding test/lint infra or new workspace-level scripts.
