# Payload Migration Brief

## Goal

Introduce Payload CMS as the source of truth for the product catalog while keeping the current Next.js site running.

Phase 1 is a fresh catalog setup. Old products from `hpttech.vn` are not imported, mapped, or preserved. New catalog data is entered manually in Payload and stored in PostgreSQL.

## Phase 1 Scope

Phase 1 includes:

- Payload admin
- PostgreSQL-backed Payload runtime
- Products
- Categories
- Brands
- Media
- `/san-pham`
- `/san-pham/[slug]`
- Optional Cloudflare R2 media storage
- Docker-based local runtime

Explicitly out of scope:

- Importing old `hpttech.vn` products
- Mapping legacy product URLs
- Preserving old catalog slugs
- Any old catalog migration
- Posts
- Pages
- Leads
- Full business settings workflows

## Current Status

Phase 1 local runtime is verified. Payload is ready for fresh product entry; the catalog is currently empty until products are created in the admin.

Completed:

- Installed Payload CMS 3 packages.
- Added Payload route group for admin, REST API, GraphQL, and GraphQL Playground.
- Added `payload.config.ts`.
- Added PostgreSQL adapter config.
- Added optional R2/S3 storage plugin config for Media.
- Added `Users` collection for Payload admin auth.
- Added Phase 1 collections:
  - `Products`
  - `Categories`
  - `Brands`
  - `Media`
- Added reusable SEO field group.
- Added `lib/payload.ts` as the Payload client entrypoint.
- Added Docker Compose config for PostgreSQL and web runtime.
- Added helper script for first Payload admin user.
- Switched `/san-pham` and `/san-pham/[slug]` to read from Payload.
- Verified PostgreSQL locally through Docker on host port `5433`.
- Verified Payload created its PostgreSQL tables.
- Verified production build passes.
- Verified local smoke tests return `200 OK`:
  - `/`
  - `/san-pham`
  - `/compare`
  - `/admin`
  - `/api/products`

Pending:

- Create the first Payload admin user.
- Create at least one category, brand, media item, and published product.
- Verify `/san-pham` lists published Payload products.
- Verify `/san-pham/[slug]` renders a new Payload product.
- Configure real R2 credentials for production media.
- Upload product images through Payload Media.
- Run production build and HTTP smoke tests.

## Data Model

### Products

- title
- slug
- brand
- category
- price
- images
- summary
- description
- specs
- featured
- status
- seo

Only products with `status = published` should be visible on the public catalog.

### Categories

- name
- slug
- parent
- description
- image
- sortOrder
- seo

### Brands

- name
- slug
- logo
- description
- website
- seo

### Media

- alt
- caption
- folder
- uploaded file

## Data Access

Pages and components should not call Payload directly. Product reads go through `lib/catalog.ts`.

Current public Payload reads:

- `getProductsFromPayload()`
- `getProductBySlugFromPayload(slug)`

Legacy synchronous product helpers remain only as no-data compatibility shims for older client components. They should not reintroduce old product data.

## R2 Media

Media should be uploaded through Payload and stored in Cloudflare R2 in production.

Requirements:

- Product images use Payload `Media` upload relations.
- Production uploads should not depend on local container disk.
- R2 URLs must remain stable.
- Alt/caption fields remain editable in Payload.

## Deployment Target

Recommended production shape:

- Next.js 15 app with Payload 3.
- PostgreSQL 17 container or managed PostgreSQL.
- Cloudflare R2 for media.
- Docker on VPS.
- Caddy or Nginx reverse proxy.
- TLS enabled.
- Separate staging and production env files.

## Backup And Monitoring

Minimum production requirements:

- Scheduled `pg_dump`.
- Upload database backups to R2 or another off-server store.
- App healthcheck.
- Database healthcheck.
- Log rotation.
- Periodic restore test.

A backup that has not been restored successfully should not be treated as proven.

## Implementation Order

1. Verify Docker/PostgreSQL locally.
2. Verify Payload admin routes.
3. Create the first admin user.
4. Create category and brand records.
5. Upload media through Payload.
6. Create new products manually in Payload.
7. Publish selected products.
8. Verify `/san-pham` and detail pages.
9. Configure R2 credentials.
10. Run production build and route smoke tests.
11. Document backup and restore commands.

## Done Criteria For Phase 1

- Payload admin opens successfully.
- First admin user can sign in.
- Products, Categories, Brands, and Media can be created in Payload.
- `/san-pham` renders published Payload products.
- `/san-pham/[slug]` renders published Payload products.
- Draft products are hidden from public catalog.
- Product images are represented as Media relations.
- R2 upload works when production credentials are configured.
- Production build passes.
- Basic public route smoke tests pass.
