# Donut SMP Tracker

A personal investment/balance tracker for two users (`s1xtus` and `6PEKI9`) with session-based logging, real-time analytics, and a dual-line portfolio chart.

## Stack

- **Next.js 14** (App Router), TypeScript (strict)
- **Tailwind CSS** for styling
- **Recharts** for the dual-line portfolio chart
- **Upstash Redis** for shared online state (falls back to in-memory for local dev)
- **Fodax** (local font) for display numbers, **DM Mono** for labels

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Without `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` env vars, data is stored in an in-memory map on the server (resets on restart). Good enough to play with the UI locally; both users can sign in from separate browser windows and see each other's updates via 5-second polling.

## Deploy (Vercel + Upstash)

1. Push this repo to GitHub.
2. Import into Vercel (framework is auto-detected as Next.js).
3. Vercel Project → **Storage** → **Create Database** → **Upstash Redis** → **Connect Project**. This auto-injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
4. Redeploy to pick up the env vars.
5. Share the URL with the other user. Each person signs in as their own username on their own device.

## Notes

- No passwords. Clicking a username button is instant sign-in. Anyone with the URL can sign in as anyone — don't expose it publicly.
- Both users' data lives server-side in Redis, keyed by user. Every device polls every ~5 seconds (paused when the tab is hidden) and on focus/visibility change.
- Mutations are optimistic; server responses reconcile state.
- All currency is rendered as Euro with `de-DE` locale formatting. Input fields accept both `,` and `.` as decimal separator.
