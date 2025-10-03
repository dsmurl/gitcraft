# Nx Monorepo Template: Web + API + DB

#### by Dsmurl

A minimal Nx-based monorepo template with:

- Web app (React + Vite) for a basic site and auth
- API app (Express + TypeScript) with hot-reload dev
- DB library (Drizzle ORM) supporting both local SQLite and Turso/libsql
- Optional Infra app (Pulumi) for AWS infrastructure-as-code

## Structure

- apps/
  - web: React + Vite app (Clerk auth ready). Local dev server for the site.
  - api: Express + TypeScript API. Hot reload in dev; builds to dist for prod.
  - infra: Pulumi IaC project for deploying to AWS (optional starter).
  - foundation: Workspace scaffolding and base project setup (placeholder for shared app-level setup).
- libs/
  - drizzle: Database layer
    - Drizzle ORM schema and types
    - getDb() helper that can connect to:
      - Local SQLite via better-sqlite3
      - Turso/libsql via @libsql/client
    - Migration/dev scripts via drizzle-kit

## Key Tech

- Nx for workspace orchestration
- pnpm for package management
- TypeScript end-to-end
- React 19 + Vite for the web
- Express for the API
- Drizzle ORM, better-sqlite3 (SQLite) and/or @libsql/client (Turso)
- Clerk for auth (web and API middleware)
- Pulumi for AWS (infra )

## Development

- Prereqs: Node 22.20.0 and pnpm installed
- Install deps:
  - pnpm install
- Run web (dev):
  - nx run web:dev
- Run API (dev):
  - nx run api:dev
- Database (from the drizzle lib):
  - nx run drizzle:db:init
  - nx run drizzle:db:generate
  - nx run drizzle:db:migrate
  - nx run drizzle:db:studio

Environment:

- Copy .env.example to .env where needed (e.g., apps/web, apps/api).
- DB options:
  - Local SQLite: set SQLITE_FILE to a path (e.g., ./libs/drizzle/local.sqlite)
  - Turso/libsql: set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN

## Build & Run (prod)

- Build:
  - nx run web:build
  - nx run api:build
- Start API:
  - nx run api:start

## Notes

- API dev uses TS sources with hot reload; production uses compiled dist output.
- The DB library works with either local SQLite or Turso/libsql—choose via environment variables.
