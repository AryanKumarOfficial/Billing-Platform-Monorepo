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
COPY apps/user-service/package.json ./apps/user-service/

# Install all dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --production=false

# Copy all source code
COPY . .

# Build shared libraries first
RUN pnpm --filter "@app/proto" build
RUN pnpm --filter "@app/common" build

# Build all dependencies and the app itself
RUN pnpm --filter "user-service" build

# Production image
FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

COPY lib/common/package.json ./lib/common/
COPY apps/proto/package.json ./apps/proto/
COPY apps/user-service/package.json ./apps/user-service/

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --production=false

# Copy built artifacts from development stage
COPY --from=development /usr/src/app/lib/common/dist ./lib/common/dist
COPY --from=development /usr/src/app/apps/proto/dist ./apps/proto/dist
COPY --from=development /usr/src/app/apps/user-service/dist ./apps/user-service/dist

# Expose port (though not strictly needed for internal Docker comms)
# PORT env var will define the actual gRPC port
EXPOSE 50051

# Run the app
CMD ["node", "apps/user-service/dist/main"]