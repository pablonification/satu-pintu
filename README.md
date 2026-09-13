# SatuPintu

[Live demo](https://satu-pintu.vercel.app)

SatuPintu is an AI-powered smart-city call center prototype for Bandung. Citizens can report a problem through one voice channel, while the system validates the location, creates a ticket, routes it to the relevant city department, and provides status tracking.

Built for the Ekraf Tech Summit 2025 hackathon.

## The problem

City complaints are often spread across different phone numbers and departments. Citizens may not know where to report an issue, and they may have no reliable way to follow up.

SatuPintu provides one intake flow and a shared ticket lifecycle for citizens and city departments.

## Core flow

```text
Citizen voice report
          |
          v
Vapi voice assistant
  Indonesian speech understanding
          |
          +-- extract category, location, urgency, and details
          +-- validate the address with Nominatim and Gemini fallback
          +-- create a ticket through the webhook API
          v
Supabase ticket database
          |
          +-- route to the relevant department
          +-- send WhatsApp or SMS updates
          +-- expose a public tracking page
          v
Department dashboard and citizen follow-up
```

## Features

### Citizen experience

- Report an issue through an Indonesian voice conversation.
- Receive a ticket ID and notifications through WhatsApp or SMS.
- Track ticket status and timeline on the web.
- Rate a resolved ticket with OTP verification.

### Department operations

- View, filter, search, and update assigned tickets.
- Track status, urgency, category, location, and notes.
- View statistics and export operational data.
- Route reports across 13 city departments, including public works, environment, transportation, health, education, social services, fire services, ambulance, and police.

## Voice and AI system

- **Voice orchestration:** Vapi
- **Speech recognition:** Deepgram via Vapi, configured for Indonesian speech
- **Speech synthesis:** ElevenLabs via Vapi
- **Address validation:** Nominatim with Google Gemini fallback
- **Ticket actions:** Vapi function calls invoke address validation and ticket creation
- **Conversation handling:** Context-aware endpointing for addresses, phone numbers, confirmations, and longer complaint descriptions

## Main API routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/vapi/webhook` | Handle Vapi function calls and create tickets |
| POST | `/api/address/validate` | Validate and normalize reported locations |
| POST | `/api/sms/incoming` | Process SMS tracking requests |
| GET | `/api/track/[ticketId]` | Return public ticket status and timeline |
| GET, PATCH | `/api/tickets/[id]` | Read and update a ticket |
| GET | `/api/stats` | Return dashboard statistics |
| GET, POST | `/api/export` | Export operational data |

## Technology

- **Application:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Voice AI:** Vapi, Deepgram, ElevenLabs
- **AI services:** Google Gemini
- **Data:** Supabase PostgreSQL, SQL migrations, Supabase Storage
- **Notifications:** Fonnte WhatsApp and Twilio SMS
- **Maps and address data:** Nominatim and Leaflet
- **Validation and testing:** Zod, Vitest, Testing Library
- **Deployment:** Vercel

## Run locally

Requirements:

- Node.js 20 or newer
- npm
- A Supabase project
- Vapi credentials for voice testing

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Create `.env.local` with the credentials required for the features you use:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_AI_API_KEY=your-google-ai-key
FONNTE_TOKEN=your-fonnte-token
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
NEXT_PUBLIC_APP_URL=http://localhost:3000
INTERNAL_API_KEY=generate-a-local-random-value
```

Run the SQL files in `supabase/migrations` in order before using ticket and dashboard features. Vapi public key and assistant ID are entered on the `/test-call` page for browser-based voice testing.

## Useful commands

```bash
npm run dev
npm run lint
npm run test:run
npm run build
```

## Project structure

```text
src/app/api/       API routes and integrations
src/app/(public)/  public tracking pages
src/app/(dashboard)/ department dashboard
src/components/    dashboard, map, status, and UI components
src/lib/           Supabase, Vapi, Gemini, Twilio, Fonnte, and validation helpers
supabase/          database migrations and storage policies
src/__tests__/     unit and integration tests
docs/              product, flow, API, and handoff documentation
```

## Prototype notes

- Notification integrations require provider credentials and webhook configuration.
- Address validation falls back to Gemini when Nominatim cannot resolve a location.
- Voice and notification providers should be configured with managed secrets in production.
- Citizen contact details, locations, and complaint data require appropriate access control and retention policies.

The repository does not currently declare a license file.
