# AegisChain 2.0

Blockchain-backed identity and access control for engineering documents (backend, chaincode, infra).
The frontend is built separately. Design docs live in [`docs/`](docs/); start with `docs/DEV_STATUS.md`.

## Prerequisites
Node.js 22, Docker Desktop (Compose v2), Git. Hyperledger Fabric (milestone M9) additionally needs WSL2.
Keep the repo outside OneDrive-synced folders (`node_modules` and DB volumes sync badly).

## Local setup (M0)
```bash
# 1. Generate local secrets into infra/secrets/ (git-ignored; values are never printed; existing files are kept)
node infra/scripts/gen-secrets.mjs

# 2. Start PostgreSQL + MinIO (bound to 127.0.0.1)
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml ps          # wait for "healthy"

# 3. Backend
cd backend
cp .env.example .env
npm install
npm run start:dev                                       # http://localhost:3000/api/v1/health
```
Optional overrides of ports/names: copy `infra/.env.example` to `infra/.env`. If you change `POSTGRES_PORT`, export it when running `gen-secrets.mjs` so `database_url` matches. Image pins and refresh steps: `infra/README.md`.

## Checks
```bash
cd backend
npm run format:check && npm run lint && npm run typecheck
npm test                                  # unit tests (no Docker needed)
npm run test:e2e                          # HTTP tests (no Docker needed; dependencies stubbed or unreachable)
E2E_REAL_INFRA=1 npm run test:e2e         # additionally checks readiness against the running Compose stack
```

## Database (Prisma 7)
`backend/prisma/schema.prisma` has no models until M1. `prisma.config.ts` takes the connection string from
`DATABASE_URL`, else `DATABASE_URL_FILE`, else `infra/secrets/database_url`.
```bash
cd backend
npm run prisma:generate                   # runs automatically before build/test/start
npx prisma migrate dev                    # from M1 onward, once models exist
```

## Cleanup
```bash
docker compose -f infra/docker-compose.yml down        # stop, keep data
docker compose -f infra/docker-compose.yml down -v     # stop AND delete Postgres/MinIO volumes
rm -rf infra/secrets                                    # delete local secrets (regenerate with gen-secrets.mjs)
```
Regenerating secrets (`--force`) invalidates existing volumes and anything encrypted with the old KEK.
