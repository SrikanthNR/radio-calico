# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `express-app/`:

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

**Database (`express-app/data.db`, SQLite via `better-sqlite3`):**
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

### style guide
- A text version of the styling guide for the webpage is at /home/radiocalico/RadioCalico_Style_Guide.txt
- The Radio Calico logo is at /home/radiocalico/RadioCalicoLogoTM.png
