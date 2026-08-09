FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/replay-parser/package.json ./packages/replay-parser/
COPY packages/ai-coach/package.json ./packages/ai-coach/
RUN npm ci --workspace=@clutchcore/api

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @clutchcore/shared
RUN npm run build -w @clutchcore/replay-parser
RUN npm run build -w @clutchcore/ai-coach
RUN npm run db:generate -w @clutchcore/api
RUN npm run build -w @clutchcore/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Workspace packages (node_modules symlinks point here)
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/replay-parser/package.json ./packages/replay-parser/package.json
COPY --from=builder /app/packages/replay-parser/dist ./packages/replay-parser/dist
COPY --from=builder /app/packages/ai-coach/package.json ./packages/ai-coach/package.json
COPY --from=builder /app/packages/ai-coach/dist ./packages/ai-coach/dist

COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

RUN mkdir -p /app/apps/api/uploads
WORKDIR /app/apps/api
EXPOSE 4000

# Prefer migrate deploy if available; fall back to db push for first boot
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
