# syntax=docker/dockerfile:1

# ── deps-prod: compile native modules, production only ───────────────────────
FROM node:24-alpine AS deps-prod

WORKDIR /deps
RUN apk add --no-cache python3 make g++
COPY express-app/package*.json ./
RUN npm ci --omit=dev

# ── deps-dev: all dependencies (includes devDependencies) ────────────────────
FROM deps-prod AS deps-dev
RUN npm ci

# ── production image ──────────────────────────────────────────────────────────
FROM node:24-alpine AS prod

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

WORKDIR /app
# Pre-install compiled node_modules into the image; the source tree is
# mounted at runtime so live edits reload immediately via --watch.
COPY --from=deps-dev /deps/node_modules ./express-app/node_modules
COPY RadioCalicoLogoTM.png ./

WORKDIR /app/express-app

ENV NODE_ENV=development
EXPOSE 3000

CMD ["node", "--watch", "index.js"]
