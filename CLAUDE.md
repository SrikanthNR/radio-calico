# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Docker (preferred):**

```bash
docker compose up dev    # development with live reload
docker compose up prod   # production, restarts on failure
docker compose build --no-cache <target>  # rebuild after dep changes
```

**Local Node.js** (run from `express-app/`):

```bash
npm start        # production
npm run dev      # development with auto-restart (node --watch)
```

Server runs at http://localhost:3000.

## Architecture

Express.js app serving a live internet radio player for Radio Calico. Entry point is `express-app/index.js`; app logic lives in `app.js` (SQLite/dev) or `app-pg.js` (PostgreSQL/prod), selected by environment variable.

**Routes:**
- `GET /radio` — the main radio player UI (served as inline HTML)
- `GET /` — a minimal dev/test page for the `items` table
- `GET /logo.png` — serves `RadioCalicoLogoTM.png` from the repo root
- `GET /api/ratings?song=&user=` — fetch thumbs-up/down counts + user's own rating
- `POST /api/ratings` — upsert or toggle-off a rating (`rating`: `1` or `-1`)
- `GET/POST /items` — CRUD for the `items` table (dev scaffolding)

**Environment variables:**
- `DATABASE_URL` — PostgreSQL connection string (production); when set, `app-pg.js` is used
- `DB_PATH` — SQLite file path (development/testing); default: `express-app/data.db`; Docker dev sets this to `/data/data.db`
- `PORT` — override listen port (default: `3000`)

**Database:**
- Production: PostgreSQL via `pg`; `app-pg.js` is selected when `DATABASE_URL` is set
- Development/testing: SQLite via `better-sqlite3`; `app.js` is selected otherwise
- Schema (same in both): `items(id, name, created_at)` and `ratings(song_key, user_id, rating)`
- `ratings` PK is `(song_key, user_id)`; rating is `1` or `-1`; toggling the same value deletes the row

**Frontend (inline in `/radio` route):**
- Streams audio via HLS.js from CloudFront (`live.m3u8`)
- Polls `metadatav2.json` every 30s for now-playing info (artist, title, album, previous tracks)
- Fetches album art from iTunes Search API
- User ID is a UUID stored in `localStorage` (`rc_user_id`), used to track per-user ratings
- Rating buttons toggle: posting the same rating again removes it

**External endpoints (CloudFront):**
- Stream: `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`
- Metadata: `https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json`
- Cover art: `https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg`

## Brand / Style

See `RadioCalico_Style_Guide.txt` for full details. Key tokens used throughout the UI:

| Variable     | Hex       | Role                          |
|--------------|-----------|-------------------------------|
| `--mint`     | `#D8F2D5` | Backgrounds, accents          |
| `--forest`   | `#1F4E23` | Primary buttons, headings     |
| `--teal`     | `#38A29D` | Nav bar, slider, active states|
| `--orange`   | `#EFA63C` | Artist banner, thumbs-down active |
| `--charcoal` | `#231F20` | Body text                     |
| `--cream`    | `#F5EADA` | Secondary backgrounds         |

Fonts: **Montserrat** (headings, labels) and **Open Sans** (body), loaded from Google Fonts.

### Style guide
- A text version of the styling guide for the webpage is at `RadioCalico_Style_Guide.txt`
- The Radio Calico logo is at `RadioCalicoLogoTM.png` (repo root; served at `/logo.png`)

## Docker

**Files:**
- `Dockerfile` — multi-stage build with four targets: `deps-prod`, `deps-dev`, `prod`, `dev`
- `docker-compose.yml` — `dev` service (SQLite) and prod stack (`db` + `app` + `prod`/nginx)
- `nginx/nginx.conf` — nginx reverse proxy config; proxies all requests to the `app` service on port 3000
- `.dockerignore` — excludes `node_modules`, `data.db`, tests, `flask-app/`, `nginx/`, and zip files

**Build stages:**
- `deps-prod` — Alpine only (no build tools); installs prod deps with `--omit=optional` (skips `better-sqlite3`); uses pure-JS `pg`
- `deps-dev` — Alpine + build tools (`python3 make g++`) to compile `better-sqlite3`; installs all deps
- `prod` — slim Alpine runtime; copies `node_modules` from `deps-prod`; runs `app-pg.js` via `DATABASE_URL`
- `dev` — copies compiled `node_modules` from `deps-dev`; source tree is mounted at runtime; runs `app.js` via `DB_PATH`

**Production service topology** (`docker compose up prod`):
- `db` — PostgreSQL 17; data persisted in named volume `db_prod`; health-checked before dependents start
- `app` — Express app (internal, port 3000 not published); depends on `db`
- `prod` (nginx) — public entrypoint on port 80; reverse-proxies to `app`; depends on `app`
