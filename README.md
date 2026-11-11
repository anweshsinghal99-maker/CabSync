# CabSync 🚖 Campus Transit & Cab Share

> **Zero-Trust Smart Campus PNR & Transit Matcher**  
> Coordinate verified, safe, and cost-effective cab pools for students travelling between campus and transit hubs (Railway Stations, Airports, and Inter-State Bus Terminals).

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel&logoColor=white)](https://cabsync-theta.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Realtime-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-AI%20Vision%20OCR-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)

---

## 🌐 Live Production Application

- **Live URL**: [https://cabsync-theta.vercel.app](https://cabsync-theta.vercel.app)
- **GitHub Repository**: [https://github.com/anweshsinghal99-maker/CabSync](https://github.com/anweshsinghal99-maker/CabSync)

---

## 🚀 Key Features

### 1. 🛡️ Zero-Trust AI Ticket Engine
- **Gemini Vision OCR**: Parses train, flight, or bus ticket images and PDFs server-side.
- **Prompt-Injection Boundary**: Enforces strict boundary delimiters around untrusted ticket content to prevent prompt injection and model jailbreaks.
- **PNR Privacy Masking**: IRCTC PNR numbers and airline booking references are immediately masked (e.g. `PNR: •••••••750`) and stored as one-way SHA-256 hashes. Raw PNR numbers are never saved or sent to the client.
- **Sliding-Window IP Rate Limiter**: Maximum 10 ticket scans per IP per 15-minute window with `429 Too Many Requests` defense and `Retry-After` headers.
- **Strict Size & MIME Filters**: Enforces a 4 MB payload limit and accepts only `image/jpeg`, `image/png`, `image/webp`, and `application/pdf`.

### 2. 🎓 Verified Institutional Campus Identity
- **Institutional Domain Gate**: Strictly validates `@thapar.edu`, `.edu`, and `.ac.in` student domains.
- **Cryptographically Signed Session Cookies**: Issues HMAC-SHA256 authenticated `cabsync_session` cookies (`httpOnly`, `sameSite: "strict"`, `maxAge: 8 hours`).
- **Gender Verification**: Profiles are tagged for safe cab matching, enabling verified female-only travel groups.

### 3. 👥 Smart Pod Matching & Female-Only Safety
- **Departure Window Optimizer**: Calculates departure buffers (e.g., 45m for Patiala Station, 90m for Rajpura Junction, 120m for Ambala Cantt, 150m for Chandigarh Airport).
- **Female-Only Pod Enclave**: Strict gender verification rules prevent non-female accounts from viewing or joining female-only pods.
- **Live Pod Room**: Real-time Supabase integration to view joined pod members, luggage allowances, and ride coordinates.

### 4. 🗺️ Multi-Stop Campus Route & Pickup Timeline
- **Interactive Leaflet Map**: Client-side dynamically loaded OpenStreetMap route canvas.
- **OSRM Driving Optimization**: Calculates driving geometry across campus hostels, Campus Main Gate, and the final transit destination.
- **Driver Pickup Schedule**: Computes sequential pickup timestamps per hostel stop so all riders arrive on time.

### 5. 💳 Fair Fare Split & UPI QR Generator
- **Luggage-Aware Split**: Dynamically calculates per-passenger cost based on luggage size (Small / Medium / Large).
- **Proportional Cap**: Verifies that total collected splits cannot exceed the actual cab fare.
- **Zero-Redirect UPI QR**: Generates standard NPCI UPI payment deep-links and scannable QR codes for Google Pay, PhonePe, and Paytm.

### 6. 🚨 Emergency SOS & Secure In-Pod Chat
- **Instant Emergency Hotline**: Direct click-to-call link for National Emergency Response `112`.
- **Geolocation Emergency Dispatch**: One-click consent-triggered GPS coordinate snapshot shareable with campus security.
- **Sanitized Chat**: In-memory message sanitization (HTML stripped, 280-character ceiling, message send rate throttling).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server Actions, API Routes) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict typing) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) with Lucide React Icons |
| **Database & Realtime** | [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security) |
| **AI / OCR** | [Google Generative AI](https://ai.google.dev/) (`gemini-3.8-flash` & `gemini-flash-latest`) |
| **Maps & Routing** | [Leaflet](https://leafletjs.com/) / [React-Leaflet](https://react-leaflet.js.org/) + [OSRM](https://project-osrm.org/) |
| **Hosting** | [Vercel](https://vercel.com/) with Edge Caching & Security Headers |

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory based on `.env.example`:

| Variable | Scope | Description |
|---|---|---|
| `GEMINI_API_KEY` | Server | Google AI Studio API Key for Gemini Vision OCR |
| `SESSION_SECRET` | Server | Secret key (min 32 chars) for HMAC-SHA256 session token signatures |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Server | Supabase project URL (`https://<project-ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Server | Supabase public anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Supabase privileged service role key |

> [!IMPORTANT]
> Never expose `GEMINI_API_KEY`, `SESSION_SECRET`, or `SUPABASE_SERVICE_ROLE_KEY` to the client. Keep them strictly server-side without the `NEXT_PUBLIC_` prefix.

---

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/anweshsinghal99-maker/CabSync.git
cd CabSync
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your API keys and credentials
```

### 4. Database Setup (Supabase)
Run the DDL in the [Supabase SQL Editor](https://app.supabase.com/):
```sql
create table if not exists public.pods (
  id text primary key,
  destination_hub text not null,
  departure_date date not null,
  campus_leave_time time not null,
  female_only boolean not null default false,
  fare integer not null check (fare >= 0),
  members jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.pods enable row level security;
create policy "verified clients can read pod summaries" on public.pods for select using (true);
alter publication supabase_realtime add table public.pods;
```

### 5. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Production Deployment

The project is preconfigured for zero-configuration continuous deployments on Vercel:

1. **Deploy via Vercel CLI**:
   ```bash
   npx vercel deploy --prod
   ```
2. **Environment Variables**:
   Add all five environment variables under **Project Settings → Environment Variables** on Vercel.
3. **Automated Git CI/CD**:
   Pushing changes to the `main` branch automatically triggers production builds and deployments.

---

## 🛡️ Security Architecture & Headers

CabSync applies defense-in-depth HTTP response headers configured in [`next.config.mjs`](./next.config.mjs):

- `X-Frame-Options: DENY` (Anti-clickjacking protection)
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), geolocation=(self), microphone=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS)
- `X-XSS-Protection: 1; mode=block`
