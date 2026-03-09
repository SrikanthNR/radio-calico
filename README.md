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

## Project Structure

```
radiocalico/
├── express-app/
│   ├── index.js            # Express server + all routes
│   ├── data.db             # SQLite database (auto-created)
│   ├── package.json
│   └── public/
│       ├── player.js       # HLS setup, play/pause, volume
│       ├── radio.js        # Main init and metadata polling
│       ├── shared.js       # Shared utilities
│       ├── radio.css       # Additional styles
│       └── components/
│           ├── nowPlaying.js    # Now-playing UI updates
│           ├── recentTracks.js  # Recent tracks strip
│           └── ratings.js       # Rating buttons logic
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
