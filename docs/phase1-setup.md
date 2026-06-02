# Phase 1 Local Setup

Phase 1 uses Payload CMS as a fresh product catalog. Do not import, map, or preserve products from the old `hpttech.vn` catalog. New products should be created directly in Payload and stored in PostgreSQL.

## Start Local Services

Use Docker Compose to start PostgreSQL and the Next.js/Payload app:

```powershell
docker compose up --build -d
```

For host-based development, start only PostgreSQL and then run the app locally:

```powershell
docker compose up -d postgres
$env:DATABASE_URI = "postgres://payload:payload@127.0.0.1:5433/hpttech_payload"
npm run dev
```

The Docker PostgreSQL service maps host port `5433` to container port `5432` to avoid conflicts with any PostgreSQL already installed on Windows.

Create `.env` from `.env.example` for local development:

```powershell
copy .env.example .env
```

## Create Admin User

Open the Payload admin:

```text
http://localhost:3000/admin
```

If the first user has not been created yet, run:

```powershell
$env:ADMIN_EMAIL = "admin@local.test"
$env:ADMIN_PASSWORD = "changeme"
npm run payload:create-first-user
```

Inside Docker:

```powershell
docker compose exec web sh -c "export ADMIN_EMAIL=admin@local.test ADMIN_PASSWORD=changeme && npm run payload:create-first-user"
```

## Enter New Catalog Data

Create records in this order:

1. `Categories`
2. `Brands`
3. `Media`
4. `Products`

Product rules:

- Attach product images through the `images` upload relation.
- Set `status` to `published` for products that should appear on `/san-pham`.
- Leave `status` as `draft` while preparing content.
- Do not paste or migrate old external image URLs from `hpttech.vn`.
- Do not run any seed import or old catalog mapping script.

## Verify Phase 1

After creating at least one published product:

```powershell
npm run build
npm run dev
```

Then check:

- `http://localhost:3000/admin`
- `http://localhost:3000/san-pham`
- `http://localhost:3000/san-pham/<new-product-slug>`
- `http://localhost:3000/compare`

## Vercel Production

The Phase 1 production target is:

- Vercel for the Next.js site and Payload admin/API.
- Neon PostgreSQL for Payload data.
- Cloudflare R2 for Media uploads.

Detailed steps are in [`docs/vercel-neon-r2-deploy.md`](./vercel-neon-r2-deploy.md).

Vercel must not use the local Docker database string. Set a Neon connection string instead:

```text
DATABASE_URI=postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require
```

## R2 Media

Local development can use local uploads. Vercel production must use Cloudflare R2 by setting:

```text
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
R2_REGION=auto
```

When R2 credentials are present, Payload stores Media uploads in R2 instead of relying on local container storage.

## Runtime Note

The first request to `/admin` in development can take a few minutes because Next.js compiles the Payload admin bundle and Payload pulls/pushes the database schema. After the schema exists and the server is warm, production startup and route checks are much faster.
