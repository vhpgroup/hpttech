# Vercel + Neon + R2 Deployment

This is the Phase 1 production target for HPTTech:

- Vercel runs the Next.js 15 website and Payload CMS admin.
- Neon PostgreSQL stores Payload data.
- Cloudflare R2 stores Payload Media uploads.
- Payload manages Products, Categories, Brands, Media, and Users.

## 1. Create Neon PostgreSQL

Create a Neon project and copy the pooled or direct PostgreSQL connection string.

Use SSL:

```env
DATABASE_URI=postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require
```

Do not use the local Docker connection string on Vercel.

## 2. Create Cloudflare R2 Bucket

Create an R2 bucket for media uploads.

Required values:

```env
R2_BUCKET=hpttech-media
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
R2_REGION=auto
```

R2 is required on Vercel. Local filesystem uploads are not persistent in a serverless runtime.

## 3. Set Vercel Environment Variables

Set these in Vercel Project Settings:

```env
DATABASE_URI=
PAYLOAD_SECRET=
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
R2_REGION=auto
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

`PAYLOAD_SECRET` must be a strong random value. Do not reuse the local development value.

## 4. Deploy

Deploy normally from GitHub or the Vercel CLI.

After deploy, open:

```text
/admin
/api/products
/san-pham
```

If the first Payload user has not been created yet, open `/admin` and create it from the first-user screen.

## 5. Enter Catalog Data

Create records in this order:

1. Categories
2. Brands
3. Media
4. Products

Only products with `status = published` appear on `/san-pham`.

## 6. Smoke Test

Check these routes:

```text
/
/san-pham
/admin
/api/products
```

Create one test product with an uploaded R2 image, publish it, then verify:

```text
/san-pham/<product-slug>
```

## Production Guardrails

The app intentionally fails during production/Vercel startup if:

- `DATABASE_URI` is missing.
- `PAYLOAD_SECRET` is missing.
- Vercel is missing the R2 env vars.

This prevents a broken deploy that silently points to local PostgreSQL or local media storage.
