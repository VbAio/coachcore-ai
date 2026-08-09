# ClutchCore

AI-powered coaching platform for Valve's **Deadlock**. Upload `.dem` replay files and receive detailed, actionable coaching reports — not just statistics.

## Frontend Multi-Game Architecture

Each game is an isolated mini-app under `/[game]/`:

```
apps/web/src/
├── games/
│   ├── registry.ts          # Route resolution & registration
│   ├── types.ts             # GameModuleDefinition, NavItem, etc.
│   ├── index.ts             # registerAllGames() — add new games here
│   ├── deadlock/            # Full module (heroes, replays, AI reports)
│   ├── fortnite/            # Island map, weapons, etc.
│   ├── valorant/            # Agents, VOD review, etc.
│   └── stubs/               # Coming-soon game factories
├── shared/
│   ├── components/layout/   # GameShell, sidebar, breadcrumbs, selector
│   └── context/             # Per-game URL context
└── app/
    ├── page.tsx             # Platform marketing landing
    └── [game]/[[...slug]]/  # Dynamic route loader (lazy pages)
```

### Adding a new game

1. Create `games/my-game/config/navigation.ts` with nav + routes
2. Add pages under `games/my-game/pages/`
3. Register in `games/index.ts`: `registerGame(myGameModule)`

No other files need changes.

## Architecture

```
clutchcore/
├── apps/
│   ├── web/          # Next.js 15 frontend (React, Tailwind, Framer Motion)
│   └── api/          # Express API (Prisma, BullMQ, WebSockets)
├── packages/
│   ├── shared/       # Shared TypeScript types
│   ├── replay-parser/ # Modular .dem parser (pluggable interface)
│   └── ai-coach/     # AI coaching pipeline (pluggable providers)
├── docker-compose.yml
└── .env.example
```

### Modular AI Pipeline

1. **Replay Parser** — Reads `.dem` files via pluggable `ReplayParser` interface
2. **Feature Extraction** — Transforms parsed data into coaching features
3. **Mistake Detector** — Rule-based (swappable with ML models)
4. **Timeline Generator** — Builds interactive mistake timeline
5. **Heatmap Generator** — Movement, deaths, farming heatmaps
6. **Score Engine** — Skill ratings and letter grades
7. **Recommendation Engine** — Improvement plans and drills
8. **Report Generator** — Assembles full coaching report
9. **Coach Provider** — Mock (default) or OpenAI (when `OPENAI_API_KEY` set)

> **Important:** The replay parser uses **deadem** for real `.dem` extraction, with a scaffold fallback if parsing fails. Estimate badges appear when data is incomplete.

## Production deploy (worldwide)

To accept replay uploads from any device on the internet:

1. Host **`apps/api`** on Railway (Docker) with Redis
2. Store `.dem` files in **S3 or Cloudflare R2** (`STORAGE_PROVIDER=s3`)
3. Point Vercel **`NEXT_PUBLIC_API_URL`** at the public Railway API URL

Step-by-step: **[docs/DEPLOY.md](docs/DEPLOY.md)**

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Redis 7

### Setup

```bash
# Clone and install
cd clutchcore
cp .env.example .env

# Start infrastructure
docker compose up postgres redis -d

# Install dependencies
npm install

# Database setup
npm run db:generate
npm run db:push

# Start dev servers
npm run dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000
- **API Docs:** http://localhost:4000/api/docs

### Docker (full stack)

```bash
docker compose up --build
```

## Features

- **Landing Page** — Hero, features, testimonials, pricing, FAQ
- **Dashboard** — Win rate, improvement score, skill radar, weekly progress
- **Replay Upload** — Drag & drop `.dem` with live processing updates
- **Coaching Report** — Grades, lane/macro/micro analysis, team fights, timeline
- **AI Chat Coach** — Ask questions with timestamp references
- **Progress Tracking** — Skill ratings over time
- **Pro Comparison** — Compare against top players

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/replays/upload` | Upload `.dem` replay |
| GET | `/api/replays` | List replays |
| GET | `/api/replays/:id/report` | Get coaching report |
| GET | `/api/replays/:id/status` | Processing status |
| POST | `/api/coach/:replayId/chat` | AI chat coach |
| GET | `/api/coach/dashboard` | Dashboard stats |
| WS | `/ws?replayId=:id` | Live processing updates |

## Environment Variables

See `.env.example` for all configuration options.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL / Neon connection string |
| `REDIS_URL` | Redis connection string (required when `LOCAL_DEV=false`) |
| `LOCAL_DEV` | `true` for inline processing; `false` in production |
| `STORAGE_PROVIDER` | `local` (dev) or `s3` (production) |
| `S3_BUCKET` / `AWS_*` / `S3_ENDPOINT` | Object storage for `.dem` files |
| `NEXT_PUBLIC_API_URL` | Public API origin used by the browser |
| `CORS_ORIGIN` | Comma-separated allowed web origins |
| `AI_COACH_PROVIDER` | `mock` (default) or `openai` |
| `OPENAI_API_KEY` | OpenAI API key for AI coaching |

## Testing

```bash
npm test
```

## Tech Stack

**Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, Framer Motion, shadcn/ui, Recharts, React Query

**Backend:** Node.js, Express, TypeScript, PostgreSQL, Prisma, Redis, BullMQ, WebSockets

**Auth:** Auth.js (Google/Discord/credentials) + Neon

**Storage:** Local filesystem in dev; S3 / Cloudflare R2 in production

## License

Private — All rights reserved.
