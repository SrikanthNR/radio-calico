# Radio Calico

A live internet radio player web app for Radio Calico, built with Node.js and Express.

## Features

- Live HLS audio stream via [HLS.js](https://github.com/video-dev/hls.js/)
- Now-playing display: artist, title, album art (via iTunes Search API), release year
- Animated audio visualizer and elapsed time counter
- Per-user thumbs-up / thumbs-down song ratings (persisted in SQLite)
- Recent tracks strip with album art thumbnails
- Responsive layout for desktop and mobile

## Tech Stack

| Layer      | Technology                     |
|------------|--------------------------------|
| Runtime    | Node.js v24                    |
| Framework  | Express v5                     |
| Database   | SQLite via `better-sqlite3`    |
| Frontend   | Vanilla JS, HLS.js             |
| Fonts      | Montserrat + Open Sans (Google Fonts) |

## Getting Started

### Prerequisites

- Node.js v18+
- npm

### Install & Run

```bash
cd express-app
npm install

# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

The server starts at **http://localhost:3000**.

### Routes

| Method | Path              | Description                              |
|--------|-------------------|------------------------------------------|
| GET    | `/radio`          | Main radio player UI                     |
| GET    | `/logo.png`       | Radio Calico logo                        |
| GET    | `/api/ratings`    | Fetch thumbs-up/down counts for a song   |
| POST   | `/api/ratings`    | Submit or toggle a rating                |
| GET    | `/`               | Dev scaffold page (items table)          |
| GET    | `/items`          | List all items (JSON)                    |
| POST   | `/items`          | Add an item                              |

### API

**GET** `/api/ratings?song=<song_key>&user=<user_id>`

```json
{ "thumbs_up": 3, "thumbs_down": 1, "user_rating": 1 }
```

**POST** `/api/ratings`

```json
{ "song_key": "Artist - Title", "user_id": "<uuid>", "rating": 1 }
```

Posting the same rating a second time toggles it off (deletes the row).

## Testing

### Run the tests

```bash
cd express-app
npm test
```

63 tests across 6 suites (backend + frontend), all run with [Jest](https://jestjs.io/).

### Backend tests

**File:** `express-app/tests/backend/api.test.js`
**Environment:** Node.js · **Tool:** [supertest](https://github.com/ladjs/supertest)

Each test spins up a fresh in-memory SQLite database (`:memory:`), so tests are fully isolated and leave no files on disk.

| Suite | What's covered |
|---|---|
| `GET /api/ratings` | Missing `song` param → 400; zero counts when empty; correct thumbs-up/down aggregation; per-user `user_rating` |
| `POST /api/ratings` | Missing fields → 400; invalid rating value → 400; add thumbs-up/down; toggle-off same rating; switch rating; multi-user accumulation |
| `GET /radio` | Returns 200 HTML containing expected player markup |
| `GET /items` / `POST /items` | Empty list; insert and retrieve items |

### Frontend tests

**Files:** `express-app/tests/frontend/`
**Environment:** jsdom (simulated browser DOM)

The browser scripts are plain globals-based JS (no ES modules). Tests load each file via `global.eval()` into the jsdom global scope, then call the functions directly.

| File | Functions tested |
|---|---|
| `shared.test.js` | `escHtml` — 5 cases (ampersands, tags, quotes, plain text, combined); `songKey` — 3 cases (formatting, lowercasing, empty strings); localStorage UUID persistence on first load |
| `ratings.test.js` | `applyRatingUI` — count updates, active class on thumbs-up/down/neither; `fetchRatings` — correct API URL construction, fallback on network failure |
| `nowPlaying.test.js` | `updateNowPlaying` — artist, title, album, year badge, cover art src, source/stream quality formatting, missing-field fallbacks |
| `recentTracks.test.js` | `renderRecentTracks` — renders up to 5 tracks, skips entries without a title, HTML-escapes titles, clears stale content on re-render |
| `player.test.js` | `formatTime` — 5 boundary cases (0s, <1m, >1h, padding); `setStatus` — updates DOM text; `setPlaying` — icon swap, visualizer class, status text |

### Test architecture

`index.js` is a thin entry point that just starts the server. All routes and DB setup live in `app.js`, which exports a `createApp(dbPath)` factory. Backend tests call `createApp(':memory:')` to get an isolated app instance per test.

## Project Structure

```
radiocalico/
├── express-app/
│   ├── app.js              # Express app factory (routes, DB setup)
│   ├── index.js            # Server entry point (calls app.js + listen)
│   ├── jest.config.js      # Jest config (backend: node, frontend: jsdom)
│   ├── data.db             # SQLite database (auto-created)
│   ├── package.json
│   ├── public/
│   │   ├── player.js       # HLS setup, play/pause, volume
│   │   ├── radio.js        # Main init and metadata polling
│   │   ├── shared.js       # Shared utilities (escHtml, songKey, iTunesArt)
│   │   ├── radio.css       # Additional styles
│   │   └── components/
│   │       ├── nowPlaying.js    # Now-playing UI updates
│   │       ├── recentTracks.js  # Recent tracks strip
│   │       └── ratings.js       # Rating buttons logic
│   └── tests/
│       ├── backend/
│       │   └── api.test.js      # API route tests (supertest + in-memory SQLite)
│       └── frontend/
│           ├── shared.test.js
│           ├── ratings.test.js
│           ├── nowPlaying.test.js
│           ├── recentTracks.test.js
│           └── player.test.js
├── RadioCalicoLogoTM.png
└── README.md
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
