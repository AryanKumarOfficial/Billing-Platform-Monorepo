FROM node:20-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy the frontend package.json
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies (filtering only for frontend to speed it up)
RUN pnpm install --frozen-lockfile --filter frontend...

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=deps /usr/src/app/package.json ./package.json
COPY --from=deps /usr/src/app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy the app source code
COPY apps/frontend ./apps/frontend

# Build the project
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm --filter frontend build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /usr/src/app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build output
COPY --from=builder /usr/src/app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Run the standalone server
CMD ["node", "apps/frontend/server.js"]