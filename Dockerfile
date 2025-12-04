# Multi-stage build to bundle frontend and backend in one container

########################################
# Frontend build
########################################
FROM node:20-bookworm-slim AS frontend
WORKDIR /app

# Set build-time API URL (empty = same-origin)
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

# Install frontend deps
COPY package*.json ./
# Use npm install (not ci) to allow lock refresh and cross-platform packages
RUN npm install --no-audit --no-fund

# Copy source and build
COPY index.html ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY src ./src
# Ensure public dir and copy logo asset into it
RUN mkdir -p public
COPY fusionlogo.png ./public/fusionlogo.png
# Copy favicon (.ico)
COPY favicon.ico ./public/favicon.ico
# Optional public assets (skip if folder doesn't exist)
# If you have a `public/` folder, uncomment the next line
# COPY public ./public

RUN npm run build

########################################
# Backend runtime
########################################
FROM node:20-bookworm-slim AS server
WORKDIR /app/server

ENV NODE_ENV=production
# Keep original internal port used by the app
ENV PORT=4001

# Install backend deps
COPY server/package*.json ./
# Use npm install (not ci) due to lock mismatch across environments
RUN npm install --omit=dev --no-audit --no-fund

# Copy backend source
COPY server ./

# Copy built frontend
COPY --from=frontend /app/dist /app/dist

# Ensure data dir exists
RUN mkdir -p /app/server/data

EXPOSE 4001

# Add curl for container healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

# Healthcheck: API must respond 200 on /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD curl -fsS http://localhost:${PORT}/api/health || exit 1

# Initialize DB schema, then start API
CMD ["sh", "-c", "node db/init.js && node app.js"]
