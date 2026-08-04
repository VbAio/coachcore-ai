# Deploy CoachCore for worldwide replay uploads

The Next.js site on Vercel cannot parse `.dem` files or keep uploads on disk. Host the Express API separately and point the frontend at it.

```text
Browser (any device)
  → Vercel (apps/web)
  → Railway API (apps/api) + Redis
  → Neon Postgres
  → S3 / Cloudflare R2 (replay files)
```

## 1. Object storage (S3 or R2)

1. Create a **private** bucket (e.g. `coachcore-replays`).
2. Create API credentials with read/write on that bucket.
3. For **Cloudflare R2**, note the S3 API endpoint:
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

## 2. Railway — API + Redis

1. Create a Railway project from this GitHub repo.
2. Add a **Redis** plugin; copy `REDIS_URL`.
3. Deploy the API service using Docker:
   - Root directory: repository root
   - Dockerfile: `apps/api/Dockerfile` (see [`apps/api/railway.toml`](../apps/api/railway.toml))
4. Set environment variables on the API service:

| Variable | Value |
|----------|--------|
| `LOCAL_DEV` | `false` |
| `DATABASE_URL` | Neon Postgres URL |
| `REDIS_URL` | Railway Redis URL |
| `STORAGE_PROVIDER` | `s3` |
| `AWS_ACCESS_KEY_ID` | Access key |
| `AWS_SECRET_ACCESS_KEY` | Secret key |
| `AWS_REGION` | e.g. `auto` (R2) or `us-east-1` |
| `S3_BUCKET` | Bucket name |
| `S3_ENDPOINT` | R2 endpoint (leave empty for AWS S3) |
| `CORS_ORIGIN` | `https://coachcore-ai-web.vercel.app` (comma-separate more origins if needed) |
| `AI_COACH_PROVIDER` | `openai` or `mock` |
| `OPENAI_API_KEY` | Optional |
| `MAX_REPLAY_SIZE_MB` | `500` (raise carefully; Railway request limits apply) |

5. Confirm `GET https://<railway-host>/health` returns `"status":"ok"`.
6. Copy the public API URL (e.g. `https://coachcore-api-production.up.railway.app`).

**Note:** Large `.dem` uploads go through the API body. If uploads time out on big files, raise Railway/service limits or add presigned direct-to-S3 uploads later.

## 3. Vercel — frontend

In the Vercel project for `apps/web`, set:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://<your-railway-api>.up.railway.app` |
| `NEXT_PUBLIC_WS_URL` | `wss://<your-railway-api>.up.railway.app` |
| `AUTH_URL` | `https://coachcore-ai-web.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://coachcore-ai-web.vercel.app` |
| `DATABASE_URL` | Same Neon URL |
| `AUTH_SECRET` / OAuth vars | As already configured |

Redeploy the web app after changing `NEXT_PUBLIC_*` (they are baked in at build time).

Update Google/Discord redirect URIs to the production domain if you have not already.

## 4. Verify from another device / network

1. Open the Vercel URL on a phone (cellular data preferred).
2. Sign in → Deadlock → Replay Analysis.
3. Upload a `.dem` → status should move parsing → coaching → complete.
4. Open the coaching report.

## Local development (unchanged)

```bash
LOCAL_DEV=true
STORAGE_PROVIDER=local
NEXT_PUBLIC_API_URL=http://localhost:4000
```

```bash
npm.cmd run dev
```

Uploads stay on disk under `apps/api/uploads/` and processing runs inline (no Redis required).
