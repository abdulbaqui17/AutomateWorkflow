FROM node:20-alpine
WORKDIR /app

# Install dependencies with better caching
COPY package*.json ./
COPY tsconfig.json ./
COPY turbo.json ./

# Copy only package files first for better layer caching
COPY packages/*/package.json ./packages/
COPY apps/apis/package.json ./apps/apis/package.json

# Install dependencies with retries and better npm config
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm install --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source code
COPY packages ./packages
COPY apps/apis/tsconfig.json ./apps/apis/tsconfig.json
COPY apps/apis/src ./apps/apis/src

# Generate Prisma client
RUN npx prisma generate --schema packages/db/prisma/schema.prisma

# Build packages
RUN npx tsc -b packages/validators || true
RUN npm run build --workspace apis || true

EXPOSE 3001

# Run migrations then start dev server with tsx watch for hot-reloading
CMD ["sh", "-c", "npx prisma migrate deploy --schema packages/db/prisma/schema.prisma && npx prisma generate --schema packages/db/prisma/schema.prisma && cd apps/apis && npx tsx watch src/index.ts"]

