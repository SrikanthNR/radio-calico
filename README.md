# Radio Calico

A live internet radio player web app for Radio Calico, built with Node.js and Express.

## Features

- Live HLS audio stream via [HLS.js](https://github.com/video-dev/hls.js/)
- Now-playing display: artist, title, album art (via iTunes Search API), release year
- Animated audio visualizer and elapsed time counter
- Per-user thumbs-up / thumbs-down song ratings
- Recent tracks strip with album art thumbnails
- Responsive layout for desktop and mobile

## Tech Stack

| Layer      | Dev                            | Production                     |
|------------|--------------------------------|--------------------------------|
| Runtime    | Node.js v24                    | Node.js v24                    |
| Framework  | Express v5                     | Express v5                     |
| Database   | SQLite via `better-sqlite3`    | PostgreSQL 17 via `pg`         |
| Web server | Express (port 3000)            | nginx (port 80) → Express      |
| Fonts      | Montserrat + Open Sans (Google Fonts) | —                       |

## Getting Started

### Option A — Docker (recommended)

Requires [Docker](https://docs.docker.com/get-docker/) with the Compose plugin.

```bash
# Development — live source reload, SQLite database
docker compose up dev

# Production — nginx + Express + PostgreSQL, restarts automatically
docker compose up prod

# Rebuild after dependency changes
docker compose build --no-cache dev
docker compose build --no-cache app
```

- Development: **http://localhost:3000**
- Production: **http://localhost** (port 80 via nginx)

SQLite data (dev) is persisted in the named Docker volume `db_dev`. PostgreSQL data (prod) is persisted in `db_prod`. Both survive container restarts.

### Option B — Local Node.js

```bash
cd express-app
npm install

# Development (auto-restart on file changes, SQLite)
npm run dev

# Production (requires DATABASE_URL env var for PostgreSQL)
DATABASE_URL=postgres://user:pass@host:5432/dbname npm start
```

### Production service topology

```
internet → nginx :80  →  Express :3000  →  PostgreSQL :5432
           (prod)           (app)               (db)
```

`docker compose up prod` starts all three. The `db` service is health-checked before `app` starts; nginx starts only after `app` is up.

## Routes

| Method | Path              | Description                              |
|--------|-------------------|------------------------------------------|
| GET    | `/radio`          | Main radio player UI                     |
| GET    | `/logo.png`       | Radio Calico logo                        |
| GET    | `/api/ratings`    | Fetch thumbs-up/down counts for a song   |
| POST   | `/api/ratings`    | Submit or toggle a rating                |
| GET    | `/`               | Dev scaffold page (items table)          |
| GET    | `/items`          | List all items (JSON)                    |
| POST   | `/items`          | Add an item                              |

## API

**GET** `/api/ratings?song=<song_key>&user=<user_id>`

```json
{ "thumbs_up": 3, "thumbs_down": 1, "user_rating": 1 }
```

**POST** `/api/ratings`

```json
{ "song_key": "Artist - Title", "user_id": "<uuid>", "rating": 1 }
```

Posting the same rating a second time toggles it off (deletes the row).

## Environment Variables

| Variable       | Description                                              | Default             |
|----------------|----------------------------------------------------------|---------------------|
| `DATABASE_URL` | PostgreSQL connection string; selects `app-pg.js`        | —                   |
| `DB_PATH`      | SQLite file path (dev/test); selects `app.js`            | `express-app/data.db` |
| `PORT`         | HTTP listen port                                         | `3000`              |

## Testing & Security

```bash
# Run all tests
make test

# Run npm audit (fails if any vulnerability is found)
make audit

# Run audit + tests together
make security
```

Or directly from `express-app/`:

```bash
npm test
npm audit
```

63 tests across 6 suites (backend + frontend), all run with [Jest](https://jestjs.io/). Tests use an in-memory SQLite database — no PostgreSQL or Docker required.

### Backend tests

**File:** `express-app/tests/backend/api.test.js`
**Tool:** [supertest](https://github.com/ladjs/supertest)

Each test gets a fresh in-memory SQLite instance via `createApp(':memory:')`.

| Suite | What's covered |
|---|---|
| `GET /api/ratings` | Missing `song` → 400; zero counts; correct aggregation; per-user `user_rating` |
| `POST /api/ratings` | Missing fields → 400; invalid rating → 400; add thumbs-up/down; toggle-off; switch rating; multi-user accumulation |
| `GET /radio` | Returns 200 HTML with expected player markup |
| `GET /items` / `POST /items` | Empty list; insert and retrieve items |

### Frontend tests

**Files:** `express-app/tests/frontend/`
**Environment:** jsdom (simulated browser DOM)

| File | Functions tested |
|---|---|
| `shared.test.js` | `escHtml`, `songKey`, localStorage UUID persistence |
| `ratings.test.js` | `applyRatingUI`, `fetchRatings` |
| `nowPlaying.test.js` | `updateNowPlaying` — all fields and fallbacks |
| `recentTracks.test.js` | `renderRecentTracks` — count limit, skips, escaping |
| `player.test.js` | `formatTime`, `setStatus`, `setPlaying` |

## Project Structure

```
radiocalico/
├── Dockerfile              # Multi-stage build (deps-prod, deps-dev, prod, dev)
├── docker-compose.yml      # Services: dev (SQLite), db + app + prod (nginx)
├── .dockerignore
├── nginx/
│   └── nginx.conf          # Reverse proxy config for production
├── express-app/
│   ├── app.js              # Express app factory — SQLite (dev/test)
│   ├── app-pg.js           # Express app factory — PostgreSQL (production)
│   ├── index.js            # Entry point; selects DB adapter from env
│   ├── jest.config.js      # Jest config (backend: node, frontend: jsdom)
│   ├── package.json
│   ├── public/
│   │   ├── player.js       # HLS setup, play/pause, volume
│   │   ├── radio.js        # Main init and metadata polling
│   │   ├── shared.js       # Shared utilities (escHtml, songKey, iTunesArt)
│   │   ├── radio.css       # Styles
│   │   └── components/
│   │       ├── nowPlaying.js
│   │       ├── recentTracks.js
│   │       └── ratings.js
│   └── tests/
│       ├── backend/
│       │   └── api.test.js
│       └── frontend/
│           ├── shared.test.js
│           ├── ratings.test.js
│           ├── nowPlaying.test.js
│           ├── recentTracks.test.js
│           └── player.test.js
├── RadioCalicoLogoTM.png
└── RadioCalico_Style_Guide.txt
```

## External Services

| Service    | URL                                                          |
|------------|--------------------------------------------------------------|
| HLS Stream | `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`       |
| Metadata   | `https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json`     |
| Cover art  | `https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg`           |
| Album art  | iTunes Search API                                            |

## Brand Colors

| Token        | Hex       | Usage                         |
|--------------|-----------|-------------------------------|
| `--mint`     | `#D8F2D5` | Backgrounds, accents          |
| `--forest`   | `#1F4E23` | Buttons, headings             |
| `--teal`     | `#38A29D` | Nav bar, slider, active state |
| `--orange`   | `#EFA63C` | Artist banner, thumbs-down    |
| `--charcoal` | `#231F20` | Body text                     |
| `--cream`    | `#F5EADA` | Secondary backgrounds         |
