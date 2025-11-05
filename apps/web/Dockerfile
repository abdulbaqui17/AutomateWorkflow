FROM node:20-alpine
WORKDIR /app

# Copy package files first for better caching
COPY ../../package*.json ./
COPY ../../turbo.json ./
COPY ../../tsconfig.json ./
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies with retries and better npm config
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm install --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source code
COPY ../../packages ./packages
COPY apps/web/next.config.js ./apps/web/next.config.js
COPY apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY apps/web/eslint.config.js ./apps/web/eslint.config.js
COPY apps/web/next-env.d.ts ./apps/web/next-env.d.ts
COPY apps/web/app ./apps/web/app
COPY apps/web/public ./apps/web/public

# Build packages if needed
RUN npx turbo run build --filter=@pkg/* || true

EXPOSE 3000

# Run in development mode for hot-reloading
CMD ["npm", "run", "dev", "--workspace", "web"]

