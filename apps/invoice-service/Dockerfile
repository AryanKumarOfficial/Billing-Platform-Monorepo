# Base node image
FROM node:20-alpine AS development

WORKDIR /usr/src/app

# Copy root package.json and pnpm-workspace.yaml
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy lib package.json files
COPY lib/common/package.json ./lib/common/
COPY apps/proto/package.json ./apps/proto/
# Copy this app's package.json
COPY apps/invoice-service/package.json ./apps/invoice-service/

# Install all dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build all dependencies and the app itself
RUN pnpm --filter "invoice-service" build

# Production image
FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

COPY lib/common/package.json ./lib/common/
COPY apps/proto/package.json ./apps/proto/
COPY apps/invoice-service/package.json ./apps/invoice-service/

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy built artifacts from development stage
COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/lib/common/dist ./lib/common/dist
COPY --from=development /usr/src/app/apps/proto/dist ./apps/proto/dist
COPY --from=development /usr/src/app/apps/invoice-service/dist ./apps/invoice-service/dist

EXPOSE 50052

# Run the app
CMD ["node", "apps/invoice-service/dist/main"]