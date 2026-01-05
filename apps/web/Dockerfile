FROM node:20-alpine
WORKDIR /app

# Accept build arguments
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy package files first for better caching
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.json ./
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies with retries and better npm config
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm install --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source code
COPY packages ./packages
COPY apps/web/next.config.js ./apps/web/next.config.js
COPY apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY apps/web/eslint.config.js ./apps/web/eslint.config.js
COPY apps/web/tailwind.config.ts ./apps/web/tailwind.config.ts
COPY apps/web/postcss.config.js ./apps/web/postcss.config.js
COPY apps/web/postcss.config.mjs ./apps/web/postcss.config.mjs
COPY apps/web/app ./apps/web/app
COPY apps/web/public ./apps/web/public
COPY apps/web/components ./apps/web/components

# Build packages if needed
RUN npx turbo run build --filter=@pkg/* || true

# Build the Next.js app
WORKDIR /app/apps/web
RUN npm run build

EXPOSE 3000

# Run in production mode
CMD ["npm", "start"]

