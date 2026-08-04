FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/replay-parser/package.json ./packages/replay-parser/
COPY packages/ai-coach/package.json ./packages/ai-coach/
RUN npm ci --workspace=@coachcore/api

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @coachcore/shared
RUN npm run build -w @coachcore/replay-parser
RUN npm run build -w @coachcore/ai-coach
RUN npm run db:generate -w @coachcore/api
RUN npm run build -w @coachcore/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
RUN mkdir -p uploads
ENV PORT=4000
EXPOSE 4000
# Railway overrides PORT; app listens on 0.0.0.0:$PORT
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
