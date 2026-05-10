# DentalFlow — Dental Clinic Management System

## Project Overview

DentalFlow is a production-ready dental clinic management application built for Indian dental clinics. It automates WhatsApp communications, provides an AI chatbot for patient queries, manages appointments with reminders, handles missed-call follow-ups, automates patient follow-ups, and offers a full CRM/patient management workflow.

**Target:** Indian dental clinics (single-location to start, multi-clinic architecture planned)
**Currency:** INR (₹)
**Languages:** English + Tamil

---

## Tech Stack (Free Tier)

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework |
| **Language** | TypeScript | Strict mode enabled |
| **UI Components** | Shadcn/ui + Radix UI | Copy-paste component library |
| **Styling** | Tailwind CSS 3 | Utility-first CSS (bundled with Shadcn) |
| **State Management** | Zustand | Lightweight client state |
| **Charts** | Recharts | Dashboard analytics |
| **Calendar** | FullCalendar (free tier) | Appointment scheduling |
| **Database** | Supabase PostgreSQL | Free tier: 500 MB, 2 projects |
| **ORM** | Prisma | Type-safe database access |
| **Cache** | Upstash Redis | Free tier: 10K commands/day |
| **Authentication** | NextAuth.js (Auth.js v5) | Credential + OAuth providers |
| **Job Scheduler** | BullMQ + Upstash Redis | Background jobs, cron tasks |
| **WhatsApp** | Meta Cloud API | Free: 1,000 conversations/month |
| **AI/LLM** | Google Gemini 2.0 Flash | Free tier: 15 RPM, 1M tokens/day |
| **Email** | Resend | Free: 100 emails/day |
| **Hosting** | Vercel (Hobby) | Free for personal projects |

**Monthly Cost: $0**

---

## Project Structure

```
clinic-management/
├── claude.md                       # This file — project context
├── app/                            # Next.js App Router
│   ├── (auth)/                     # Public auth routes
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/                # Protected dashboard routes
│   │   ├── layout.tsx              # Dashboard shell (sidebar + header)
│   │   ├── page.tsx                # Dashboard home / overview
│   │   ├── patients/
│   │   │   ├── page.tsx            # Patient list
│   │   │   ├── [id]/page.tsx       # Patient detail
│   │   │   └── new/page.tsx        # Add patient
│   │   ├── appointments/
│   │   │   ├── page.tsx            # Calendar view
│   │   │   └── new/page.tsx        # Book appointment
│   │   ├── treatments/
│   │   │   └── page.tsx            # Treatment records
│   │   ├── billing/
│   │   │   ├── page.tsx            # Invoice list
│   │   │   └── [id]/page.tsx       # Invoice detail
│   │   ├── messages/
│   │   │   └── page.tsx            # WhatsApp inbox
│   │   ├── missed-calls/
│   │   │   └── page.tsx            # Missed call queue
│   │   ├── analytics/
│   │   │   └── page.tsx            # Charts + KPIs
│   │   └── settings/
│   │       ├── page.tsx            # Clinic settings
│   │       ├── templates/page.tsx  # Message templates
│   │       └── knowledge-base/page.tsx  # AI knowledge base
│   └── api/                        # API Route Handlers
│       ├── webhooks/
│       │   ├── whatsapp/route.ts   # Meta webhook receiver
│       │   └── telephony/route.ts  # Missed call webhook
│       ├── chatbot/route.ts        # AI chatbot endpoint
│       ├── patients/route.ts
│       ├── appointments/route.ts
│       ├── reminders/route.ts
│       ├── billing/route.ts
│       └── auth/[...nextauth]/route.ts
├── components/
│   ├── ui/                         # Shadcn base components
│   ├── dashboard/                  # Dashboard-specific components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── stats-cards.tsx
│   │   └── recent-activity.tsx
│   ├── calendar/                   # Appointment calendar
│   │   ├── appointment-calendar.tsx
│   │   └── booking-dialog.tsx
│   ├── chat/                       # WhatsApp chat components
│   │   ├── chat-list.tsx
│   │   ├── chat-window.tsx
│   │   └── message-bubble.tsx
│   ├── patients/                   # Patient components
│   │   ├── patient-form.tsx
│   │   ├── patient-table.tsx
│   │   └── patient-timeline.tsx
│   └── billing/                    # Billing components
│       ├── invoice-form.tsx
│       └── invoice-pdf.tsx
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── auth.ts                     # NextAuth config
│   ├── whatsapp.ts                 # Meta WhatsApp Cloud API wrapper
│   ├── ai.ts                       # Gemini API wrapper
│   ├── sms.ts                      # SMS gateway (placeholder)
│   ├── telephony.ts                # Missed call handler
│   ├── scheduler.ts                # BullMQ job definitions
│   ├── email.ts                    # Resend email wrapper
│   ├── validators.ts               # Zod schemas for validation
│   └── utils.ts                    # General utilities
├── hooks/                          # Custom React hooks
│   ├── use-patients.ts
│   ├── use-appointments.ts
│   └── use-realtime.ts
├── stores/                         # Zustand stores
│   ├── ui-store.ts                 # Sidebar, modals, theme
│   └── notification-store.ts       # Toast notifications
├── types/                          # Shared TypeScript types
│   ├── patient.ts
│   ├── appointment.ts
│   └── index.ts
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── seed.ts                     # Seed data
│   └── migrations/                 # Auto-generated migrations
├── public/
│   ├── logo.svg
│   └── favicon.ico
├── .env.local                      # Environment variables (gitignored)
├── .env.example                    # Template for env vars
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres"

# Auth
NEXTAUTH_SECRET="generate-a-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# WhatsApp (Meta Cloud API)
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
WHATSAPP_BUSINESS_ACCOUNT_ID="your-business-account-id"
WHATSAPP_ACCESS_TOKEN="your-access-token"
WHATSAPP_VERIFY_TOKEN="your-webhook-verify-token"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://xxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Resend (Email)
RESEND_API_KEY="re_xxxx"

# Telephony (configure when ready)
# EXOTEL_API_KEY=""
# EXOTEL_API_TOKEN=""
# EXOTEL_SID=""
```

---

## Coding Conventions

### General
- **Language:** TypeScript with strict mode. No `any` types unless absolutely necessary.
- **Formatting:** Prettier with default config. 2-space indent. Single quotes. Trailing commas.
- **Imports:** Use `@/` path alias for project root. Group: external → internal → types → styles.
- **File naming:** kebab-case for files (`patient-form.tsx`), PascalCase for components (`PatientForm`).
- **Exports:** Named exports only. No default exports except for Next.js pages.

### React / Next.js
- Use **Server Components** by default. Add `'use client'` only when needed (interactivity, hooks, browser APIs).
- Use **Server Actions** for form mutations instead of API routes where possible.
- Data fetching in Server Components using `async` component functions.
- Use `loading.tsx` and `error.tsx` for route-level suspense and error boundaries.
- All forms use **React Hook Form + Zod** for validation.
- Use `next/image` for all images. Use `next/link` for all internal links.

### API Routes
- All API routes return consistent response shape:
  ```ts
  // Success
  { success: true, data: T }
  // Error
  { success: false, error: { message: string, code: string } }
  ```
- Validate all inputs with **Zod** schemas from `lib/validators.ts`.
- Use proper HTTP status codes (200, 201, 400, 401, 403, 404, 500).
- Wrap handlers in try/catch with structured error responses.

### Database
- Always use **Prisma** for database access. Never write raw SQL unless for complex aggregations.
- Use `include` and `select` to avoid over-fetching.
- Transactions for multi-table mutations: `prisma.$transaction()`.
- Soft-delete is NOT used. Hard delete with cascade.

### Styling
- **Tailwind CSS** via Shadcn/ui conventions.
- Use `cn()` utility (from `lib/utils.ts`) for conditional classes.
- Design tokens defined in `tailwind.config.ts` — extend, don't override defaults.
- Dark mode supported via `class` strategy.
- Color palette: Dental/medical aesthetic — clean whites, soft blues, teal accents.

### State Management
- **Server state:** React Query (TanStack Query) — for data fetching, caching, mutations.
- **Client state:** Zustand — for UI state (sidebar, modals, theme).
- Do NOT use React Context for global state. Use Zustand stores.

### Error Handling
- All async operations wrapped in try/catch.
- User-facing errors shown via toast notifications (Sonner).
- Server errors logged with structured logging (console for now, Pino later).
- API routes never leak internal error details to client.

---

## Feature Module Guidelines

### WhatsApp Integration (`lib/whatsapp.ts`)
- Uses **Meta Cloud API v21.0** (Graph API).
- Webhook verification: GET handler returns `hub.challenge`.
- Incoming messages: POST handler processes and routes to chatbot or human.
- Outgoing messages: Use approved **Message Templates** for notifications (reminders, follow-ups).
- Session messages (24h window): Free-form replies within 24h of patient's last message.
- Rate limit: Respect Meta's per-phone-number throughput (80 msgs/sec on free tier).

### AI Chatbot (`lib/ai.ts`)
- Uses **Gemini 2.0 Flash** via `@google/generative-ai` SDK.
- System prompt includes: clinic info, services, pricing, hours, and FAQ from KnowledgeBase table.
- Conversation history maintained per patient (last 20 messages for context).
- Structured output for actions: `{ intent: "book_appointment" | "faq" | "escalate", ... }`.
- Escalation: If confidence < threshold or patient requests human, set conversation status to ESCALATED.
- Temperature: 0.3 (factual, consistent responses).

### Scheduler (`lib/scheduler.ts`)
- Uses **BullMQ** with Upstash Redis connection.
- Queues: `reminders`, `follow-ups`, `missed-call-followup`, `re-engagement`.
- Jobs are idempotent — safe to retry on failure.
- Reminder schedule:
  - 24h before appointment → WhatsApp + SMS
  - 2h before appointment → WhatsApp only
- Follow-up schedule (configurable per treatment type):
  - Post-extraction: 24h, 3 days, 7 days
  - Post-cleaning: 7 days
  - Post-RCT: 24h, 3 days, 7 days, 30 days

### Telephony (`lib/telephony.ts`)
- Webhook endpoint receives missed-call events.
- Auto-creates lead (Patient with source=PHONE_CALL) if phone not in DB.
- Sends auto-reply via WhatsApp: "We noticed you called! Book here: {link}".
- Dashboard shows missed-call queue sorted by recency.

---

## API Endpoint Reference

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/[...nextauth]` | Authentication |
| GET/POST | `/api/patients` | List / Create patients |
| GET/PUT/DELETE | `/api/patients/[id]` | Patient CRUD |
| GET/POST | `/api/appointments` | List / Create appointments |
| PUT | `/api/appointments/[id]` | Update appointment |
| POST | `/api/chatbot` | AI chatbot message |
| POST | `/api/webhooks/whatsapp` | WhatsApp incoming webhook |
| GET | `/api/webhooks/whatsapp` | WhatsApp verify webhook |
| POST | `/api/webhooks/telephony` | Missed call webhook |
| GET/POST | `/api/billing` | List / Create invoices |
| POST | `/api/reminders/trigger` | Manually trigger reminders |
| GET | `/api/analytics/overview` | Dashboard stats |

---

## UI Design System

### Color Palette
```
Primary:     hsl(192, 70%, 43%)  — Teal (trust, medical)
Secondary:   hsl(215, 65%, 55%)  — Blue (calm, professional)
Accent:      hsl(160, 60%, 45%)  — Green (health, success)
Background:  hsl(210, 20%, 98%)  — Off-white
Surface:     hsl(0, 0%, 100%)    — White cards
Text:        hsl(215, 25%, 15%)  — Near-black
Muted:       hsl(215, 15%, 55%)  — Gray text
Destructive: hsl(0, 72%, 51%)    — Red (errors, alerts)
Warning:     hsl(38, 92%, 50%)   — Amber (warnings)
```

### Typography
- **Font:** Inter (Google Fonts) — clean, medical-appropriate
- **Headings:** font-semibold, tracking-tight
- **Body:** font-normal, text-sm (14px) for dashboard density

### Layout
- Dashboard: Fixed sidebar (280px) + scrollable main content
- Sidebar: Collapsible on mobile (hamburger menu)
- Content max-width: 1280px with responsive padding
- Cards: rounded-xl, shadow-sm, border border-border

### Component Patterns
- **Data Tables:** Shadcn DataTable with sorting, filtering, pagination
- **Forms:** Dialog/Sheet for create/edit. Full page for complex forms.
- **Loading:** Skeleton components matching content shape
- **Empty States:** Illustration + message + CTA button

---

## Security Checklist

- [ ] All routes behind NextAuth middleware (except auth + webhooks)
- [ ] Webhook endpoints verify signatures (WhatsApp: X-Hub-Signature-256)
- [ ] Environment variables never exposed to client (no NEXT_PUBLIC_ for secrets)
- [ ] SQL injection prevented by Prisma parameterized queries
- [ ] XSS prevented by React's default escaping + sanitizing user HTML
- [ ] CSRF protection via NextAuth built-in CSRF tokens
- [ ] Rate limiting on API routes (upstash/ratelimit)
- [ ] Input validation on every endpoint (Zod)
- [ ] Passwords hashed with bcrypt (12 rounds)
- [ ] RBAC: Admin > Doctor > Receptionist permission levels

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Open Prisma Studio (DB GUI)
npx prisma studio

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

---

## Important Notes

1. **Free tier limits to watch:**
   - Supabase: 500 MB database, 1 GB file storage, 2 GB bandwidth
   - Upstash Redis: 10,000 commands/day
   - Vercel: 100 GB bandwidth, serverless function 10s timeout
   - Meta WhatsApp: 1,000 conversations/month
   - Gemini: 15 requests/minute, 1M tokens/day
   - Resend: 100 emails/day

2. **WhatsApp Business verification** is required for production. Apply via Meta Business Suite. Takes 2–7 business days.

3. **DLT registration** (for SMS in India) is required before sending promotional SMS. Register with your telecom operator.

4. **HIPAA/health data:** While India doesn't have HIPAA, treat patient medical data as sensitive. Encrypt at rest (Supabase handles this), use HTTPS everywhere, and implement audit logging for data access.
