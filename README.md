# CabSync — Smart Campus PNR & Transit Matcher

## Local run

1. Copy `.env.example` to `.env.local` and fill the values. Keep every secret server-only; no secret variable may begin with `NEXT_PUBLIC_`.
2. Run `npm install` and then `npm run dev`.
3. Open [http://localhost:3000](http://localhost:3000). Choose **Verify as Demo Student**, then **Load Sample IRCTC Ticket** to try the full flow without an upload.

## Production deployment (Vercel)

1. Put this folder in a new private GitHub repository and import it at [Vercel](https://vercel.com/new).
2. Use the default **Next.js** preset. Add `GEMINI_API_KEY`, `SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under Vercel **Settings → Environment Variables**. Add `SUPABASE_SERVICE_ROLE_KEY` only if a future server-only admin route needs it.
3. In Supabase, run [`supabase/schema.sql`](./supabase/schema.sql), then enable Realtime for `pods` if it was not automatically enabled.
4. Deploy. Vercel applies the headers in `next.config.mjs` automatically.

The demo works without a Supabase table. For a real launch, replace the permissive demonstration read policy with authenticated Supabase users and server-validated write routes before accepting student data.

## Security controls

- OCR requests are limited to 10/IP/15 minutes and accept only 4 MB JPEG, PNG, WebP, or PDF payloads.
- Gemini runs exclusively from the server route with a prompt-injection boundary.
- Raw PNR values are transformed server-side into a masked display value plus one-way hash; they are never rendered.
- Payment URIs use a fixed validated payee and `URLSearchParams`; the calculated split cannot exceed the cab fare.
- Campus sessions are signed in an HTTP-only cookie. Female-only pods require a verified Female profile in the UI and matching handler.
- Pod chat strips markup, caps messages to 280 characters, and throttles sends. SOS provides a consent-triggered location dispatch card and a `112` call link.
