# Multi-stage build for DevCollab
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies across all workspaces
RUN npm ci

# Copy source code
COPY . .

# Build both backend (TypeScript) and frontend (Vite React)
RUN npm run build

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy dependency manifests and install only production dependencies
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --omit=dev --workspace=server

# Copy compiled backend
COPY --from=builder /app/server/dist ./server/dist

# Copy compiled frontend
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 4000

CMD ["node", "server/dist/index.js"]
