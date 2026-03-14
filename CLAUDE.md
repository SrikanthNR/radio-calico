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

This is a single-file Express.js app (`express-app/index.js`) that serves a live internet radio player for Radio Calico.

**Routes:**
- `GET /radio` — the main radio player UI (served as inline HTML)
- `GET /` — a minimal dev/test page for the `items` table
- `GET /logo.png` — serves `RadioCalicoLogoTM.png` from the repo root
- `GET /api/ratings?song=&user=` — fetch thumbs-up/down counts + user's own rating
- `POST /api/ratings` — upsert or toggle-off a rating (`rating`: `1` or `-1`)
- `GET/POST /items` — CRUD for the `items` table (dev scaffolding)

**Environment variables:**
- `DB_PATH` — override SQLite file location (default: `express-app/data.db`); Docker sets this to `/data/data.db`
- `PORT` — override listen port (default: `3000`)

**Database (`express-app/data.db` locally, `/data/data.db` in Docker, SQLite via `better-sqlite3`):**
- `items(id, name, created_at)` — dev scaffolding table
- `ratings(song_key, user_id, rating)` — per-user song ratings; PK is `(song_key, user_id)`; rating is `1` or `-1`; toggling the same value deletes the row

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
- `docker-compose.yml` — `dev` and `prod` services; named volumes `db_dev`/`db_prod` persist SQLite
- `.dockerignore` — excludes `node_modules`, `data.db`, tests, `flask-app/`, and zip files

**Build stages:**
- `deps-prod` / `deps-dev` — Alpine + build tools (`python3 make g++`) to compile `better-sqlite3`; `deps-dev` adds devDependencies
- `prod` — slim Alpine runtime; no build tools; copies compiled `node_modules` from `deps-prod`
- `dev` — copies compiled `node_modules` from `deps-dev`; source tree is mounted at runtime via a bind mount; a named volume overlays `node_modules` to prevent the host from clobbering compiled binaries
