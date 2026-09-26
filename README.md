# CodeMixed

CodeMixed detects languages in code-mixed text and translates segments into a single target language. The app uses Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, and server-side Google Gemini/Translate APIs.

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Add `GEMINI_API_KEY` to `.env.local` for translation. `GOOGLE_TRANSLATE_API_KEY` is an optional fallback. Without either key, the app uses its offline heuristic/demo behavior. Local development can run without Upstash credentials; API rate limiting is bypassed only outside production.

## Deploy to Vercel

1. Push this repository to GitHub, then import it in Vercel. Keep the detected Next.js framework, root directory, and `npm run build` command.
2. Create a REST-enabled Redis database in Upstash and add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the Vercel project's Production and Preview environments.
3. Add `GEMINI_API_KEY` to the same environments. Optionally add `GEMINI_MODEL` or `GOOGLE_TRANSLATE_API_KEY`.
4. Deploy. Verify the site and `GET /api/languages`, then test segregation and translation with a short paragraph.

The `/api/segregate` and `/api/unify` endpoints share a distributed limit of 30 requests per client IP per minute. Production requests fail closed with `503` if Upstash is not configured or unavailable; this avoids silently exposing paid provider calls without abuse protection. Provider requests have a 20-second timeout. API keys are server-only and must never use the `NEXT_PUBLIC_` prefix.

For production traffic, place the Upstash database near the Vercel function region and monitor provider and Redis usage. Request history currently remains in each user's browser; accounts, cross-device history, billing, and user-level quotas are not implemented.
