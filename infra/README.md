# infra/

Local development infrastructure: PostgreSQL + MinIO (Fabric arrives in M9). Quick start is in the root `README.md`.

## Images

| Service | Image | Pin |
|---|---|---|
| PostgreSQL | `postgres:16.9-alpine` | version tag |
| MinIO | `cgr.dev/chainguard/minio` (Chainguard-built, distroless, non-root uid 65532) | **digest** `sha256:f74600a1…c6fa18` = MinIO `RELEASE.2026-09-22T19-25-18Z` (pulled 2026-10-09) |

Why Chainguard: upstream MinIO no longer publishes community Docker images (Docker Hub/Quay) and archived its
GitHub repo. `chainguard/minio` on Docker Hub resolves to the same digest as `cgr.dev/chainguard/minio`; we use
`cgr.dev` as the canonical source. This is a third-party rebuild of an archived project: treat it as a
**development** object store, and re-evaluate the storage backend before any production use.
The application talks to storage through the S3 API only, so the backend can be swapped later.

The digest is an immutable pin; the `latest` tag is not. Do not replace the digest with a tag.

## Verifying the current pin
```bash
docker compose -f infra/docker-compose.yml images minio            # shows repo + image id
docker inspect --format '{{index .RepoDigests 0}}' $(docker compose -f infra/docker-compose.yml images -q minio)
docker run --rm cgr.dev/chainguard/minio@sha256:<digest> --version   # confirms the MinIO release
```

## Refreshing the pin (deliberate security update)
Do this on purpose, not automatically, and review what changed.
```bash
docker pull cgr.dev/chainguard/minio:latest                         # note the printed Digest: sha256:...
docker run --rm cgr.dev/chainguard/minio:latest --version           # note the new MinIO release
# optional: verify the signature if cosign is installed
cosign verify cgr.dev/chainguard/minio@sha256:<new> \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com \
  --certificate-identity-regexp='https://github.com/chainguard-images/images/.*'
```
Then: update the digest and the "Pinned:" comment in `docker-compose.yml`, run
`docker compose -f infra/docker-compose.yml up -d minio`, wait for `healthy`, run
`E2E_REAL_INFRA=1 npm run test:e2e` in `backend/`, and record the new digest and release in `docs/DEV_STATUS.md`.
Check Chainguard's advisories/changelog first if the jump is large.

## Health checks
- Postgres: `pg_isready`.
- MinIO: the image is distroless (no curl/wget), so the check uses the bundled `bash` to send
  `GET /minio/health/ready` over `/dev/tcp` and requires HTTP 200. This verifies the service is serving,
  not merely that the process exists.

## Secrets
`node infra/scripts/gen-secrets.mjs` writes `infra/secrets/*` (git-ignored). Compose mounts them as Docker
file-based secrets (`*_FILE` variables); no credentials appear in the Compose file. `infra/.env` (git-ignored)
holds non-secret overrides such as `POSTGRES_PORT`. If you change `POSTGRES_PORT`, regenerate with the same
value exported: `POSTGRES_PORT=55432 node infra/scripts/gen-secrets.mjs --force` (this invalidates existing volumes).
