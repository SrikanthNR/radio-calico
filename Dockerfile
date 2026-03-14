# syntax=docker/dockerfile:1

# ── deps-prod: pg only, no native compilation needed ─────────────────────────
FROM node:24-alpine AS deps-prod

WORKDIR /deps
COPY express-app/package*.json ./
RUN npm ci --omit=dev --omit=optional

# ── deps-dev: all dependencies (better-sqlite3 requires build tools) ─────────
FROM node:24-alpine AS deps-dev

WORKDIR /deps
RUN apk add --no-cache python3 make g++
COPY express-app/package*.json ./
RUN npm ci

# ── production image ──────────────────────────────────────────────────────────
FROM node:24-alpine AS prod

# Upgrade OS packages to pick up security patches not yet in the base image
RUN apk upgrade --no-cache

WORKDIR /app
COPY --from=deps-prod /deps/node_modules ./express-app/node_modules
COPY express-app/ ./express-app/
COPY RadioCalicoLogoTM.png ./

WORKDIR /app/express-app

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "index.js"]

# ── development image ─────────────────────────────────────────────────────────
FROM node:24-alpine AS dev

RUN apk upgrade --no-cache

WORKDIR /app
# Pre-install compiled node_modules into the image; the source tree is
# mounted at runtime so live edits reload immediately via --watch.
COPY --from=deps-dev /deps/node_modules ./express-app/node_modules
COPY RadioCalicoLogoTM.png ./

WORKDIR /app/express-app

ENV NODE_ENV=development
EXPOSE 3000

CMD ["node", "--watch", "index.js"]
