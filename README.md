# HPT Tech Next.js

Next 15 App Router prototype for HPT Tech, using React 19, TypeScript strict, and Tailwind v4. The active app lives in `app/`, `components/`, and `lib/data.ts`.

## Local Development

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

## Data And APIs

- `lib/data.ts` is the current seed data source before WordPress integration.
- `app/api/chat/route.ts` handles chatbot requests server-side.
- `app/api/lead/route.ts` accepts lead form submissions and can notify via Resend.

Create environment variables from `.env.example`. Do not expose API keys in client components.
