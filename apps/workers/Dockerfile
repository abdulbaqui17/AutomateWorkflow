FROM node:20-alpine
WORKDIR /app

# Copy root package files and workspace configuration
COPY ../../package*.json ./
COPY ../../turbo.json ./
COPY ../../tsconfig.json ./

# Copy ALL packages and apps (needed for workspace to work properly)
COPY ../../packages ./packages
COPY ../../apps ./apps

# Install all dependencies with npm workspaces
# This will install dependencies for ALL packages in the monorepo
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm install --legacy-peer-deps --include-workspace-root && \
    npm list kafkajs || echo "kafkajs not found, installing..." && \
    npm install kafkajs --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate --schema packages/db/prisma/schema.prisma

# Build packages if needed
RUN npx turbo run build --filter=@pkg/* || true

WORKDIR /app/apps/workers
CMD ["npx", "tsx", "watch", "src/index.ts"]

