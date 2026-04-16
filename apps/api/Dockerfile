# syntax=docker/dockerfile:1
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

# Copy workspace manifests first — layer is cached until any manifest changes
COPY package.json package-lock.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json         ./apps/api/

# Install all workspace deps (hoisted to /app/node_modules)
RUN npm ci

# Copy source for the shared types package and the API
COPY packages/types/ ./packages/types/
COPY apps/api/       ./apps/api/

# Generate Prisma client and compile TypeScript
RUN cd apps/api && npx prisma generate && npm run build

EXPOSE 4000

# Run any pending migrations then start the server
CMD ["sh", "-c", "cd /app/apps/api && npx prisma migrate deploy && node dist/index.js"]
