'use strict';

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

function createApp(dbPath) {
  const app = express();
  const db = new Database(dbPath !== undefined ? dbPath : path.join(__dirname, 'data.db'));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));

  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      song_key TEXT NOT NULL,
      user_id  TEXT NOT NULL,
      rating   INTEGER NOT NULL CHECK(rating IN (1, -1)),
      PRIMARY KEY (song_key, user_id)
    )
  `);

  const stmtGetCounts = db.prepare(`
    SELECT
      SUM(CASE WHEN rating =  1 THEN 1 ELSE 0 END) AS thumbs_up,
      SUM(CASE WHEN rating = -1 THEN 1 ELSE 0 END) AS thumbs_down
    FROM ratings WHERE song_key = ?
  `);
  const stmtGetUserRating = db.prepare(
    `SELECT rating FROM ratings WHERE song_key = ? AND user_id = ?`
  );
  const stmtUpsertRating = db.prepare(`
    INSERT INTO ratings (song_key, user_id, rating) VALUES (?, ?, ?)
    ON CONFLICT(song_key, user_id) DO UPDATE SET rating = excluded.rating
  `);
  const stmtDeleteRating = db.prepare(
    `DELETE FROM ratings WHERE song_key = ? AND user_id = ?`
  );

  app.get('/api/ratings', (req, res) => {
    const { song, user } = req.query;
    if (!song) return res.status(400).json({ error: 'song required' });
    const counts = stmtGetCounts.get(song) || { thumbs_up: 0, thumbs_down: 0 };
    const userRow = user ? stmtGetUserRating.get(song, user) : null;
    res.json({
      thumbs_up:   counts.thumbs_up   || 0,
      thumbs_down: counts.thumbs_down || 0,
      user_rating: userRow ? userRow.rating : 0
    });
  });

  app.post('/api/ratings', (req, res) => {
    const { song_key, user_id, rating } = req.body;
    if (!song_key || !user_id || ![1, -1].includes(Number(rating))) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    const existing = stmtGetUserRating.get(song_key, user_id);
    if (existing && existing.rating === Number(rating)) {
      stmtDeleteRating.run(song_key, user_id);
    } else {
      stmtUpsertRating.run(song_key, user_id, Number(rating));
    }
    const counts = stmtGetCounts.get(song_key) || { thumbs_up: 0, thumbs_down: 0 };
    const userRow = stmtGetUserRating.get(song_key, user_id);
    res.json({
      thumbs_up:   counts.thumbs_up   || 0,
      thumbs_down: counts.thumbs_down || 0,
      user_rating: userRow ? userRow.rating : 0
    });
  });

  app.get('/logo.png', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'RadioCalicoLogoTM.png'));
  });

  app.get('/radio', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Radio Calico</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --mint:     #D8F2D5;
      --forest:   #1F4E23;
      --teal:     #38A29D;
      --orange:   #EFA63C;
      --charcoal: #231F20;
      --cream:    #F5EADA;
      --white:    #FFFFFF;
    }

    body {
      min-height: 100vh;
      background: var(--white);
      font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--charcoal);
      display: flex;
      flex-direction: column;
    }

    /* Nav */
    nav {
      background: var(--teal);
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-shrink: 0;
    }
    nav img { height: 38px; width: 38px; object-fit: contain; }
    nav .nav-title {
      font-family: "Montserrat", sans-serif;
      font-weight: 700;
      font-size: 18px;
      letter-spacing: 0.05em;
      color: var(--white);
    }

    /* Page */
    main {
      flex: 1;
      display: flex;
      justify-content: center;
      padding: 32px 16px 48px;
    }

    /* Card */
    .card {
      width: 100%;
      max-width: 700px;
      background: var(--white);
      border: 1px solid #ddd;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
    }

    /* Two-column top */
    .card-top {
      display: flex;
      align-items: stretch;
    }

    /* Left: album art column */
    .art-col {
      flex: 0 0 260px;
      position: relative;
      background: var(--charcoal);
    }

    #player-art {
      width: 260px;
      height: 260px;
      object-fit: cover;
      display: block;
      background: var(--mint);
    }

    .year-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0,0,0,0.55);
      color: var(--white);
      font-family: "Montserrat", sans-serif;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.06em;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .artist-banner {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: var(--orange);
      color: var(--white);
      font-family: "Montserrat", sans-serif;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      text-align: center;
      padding: 8px 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Right: info column */
    .info-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 20px 22px 20px;
      min-width: 0;
    }

    .np-artist {
      font-family: "Montserrat", sans-serif;
      font-weight: 700;
      font-size: 22px;
      line-height: 1.2;
      color: var(--charcoal);
    }

    .np-title {
      font-family: "Montserrat", sans-serif;
      font-weight: 600;
      font-size: 15px;
      color: var(--forest);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .np-album {
      font-size: 13px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .quality-block {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 8px 10px;
      background: #f7f7f7;
      border-radius: 6px;
      border-left: 3px solid var(--teal);
    }

    .quality-block p {
      font-size: 11px;
      color: #555;
    }

    .quality-block span { color: var(--forest); font-weight: 600; }

    /* Rate this track */
    .rate-label {
      font-family: "Open Sans", sans-serif;
      font-size: 12px;
      color: #666;
      margin-right: 4px;
    }

    .rating-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .rating-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: transparent;
      border: 2px solid #ccc;
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 16px;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      color: var(--charcoal);
      font-family: "Open Sans", sans-serif;
    }

    .rating-btn .count {
      font-size: 12px;
      font-weight: 600;
      color: #555;
    }

    .rating-btn:hover               { background: var(--mint); border-color: var(--teal); }
    .rating-btn.up.active           { background: var(--forest); border-color: var(--forest); }
    .rating-btn.up.active .count    { color: var(--white); }
    .rating-btn.down.active         { background: var(--orange); border-color: var(--orange); }
    .rating-btn.down.active .count  { color: var(--white); }

    /* Controls row */
    .controls {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: auto;
    }

    #play-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: var(--forest);
      color: var(--white);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.2s, transform 0.1s;
      box-shadow: 0 2px 8px rgba(31,78,35,0.3);
    }
    #play-btn:hover  { background: var(--teal); }
    #play-btn:active { transform: scale(0.95); }
    #play-btn svg    { width: 22px; height: 22px; fill: var(--white); }

    #volume {
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      height: 4px;
      border-radius: 2px;
      background: var(--mint);
      outline: none;
      cursor: pointer;
    }
    #volume::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px; height: 14px;
      border-radius: 50%;
      background: var(--teal);
      cursor: pointer;
    }
    #volume::-moz-range-thumb {
      width: 14px; height: 14px;
      border-radius: 50%;
      background: var(--teal);
      border: none;
      cursor: pointer;
    }

    /* Visualizer */
    .visualizer {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 24px;
    }
    .bar { width: 3px; background: var(--teal); border-radius: 2px; height: 3px; }
    .playing .bar:nth-child(1) { animation: bounce 0.8s  ease-in-out       infinite alternate; }
    .playing .bar:nth-child(2) { animation: bounce 0.9s  ease-in-out 0.10s infinite alternate; }
    .playing .bar:nth-child(3) { animation: bounce 0.7s  ease-in-out 0.20s infinite alternate; }
    .playing .bar:nth-child(4) { animation: bounce 1.0s  ease-in-out 0.05s infinite alternate; }
    .playing .bar:nth-child(5) { animation: bounce 0.85s ease-in-out 0.15s infinite alternate; }
    .playing .bar:nth-child(6) { animation: bounce 0.75s ease-in-out 0.30s infinite alternate; }
    .playing .bar:nth-child(7) { animation: bounce 0.95s ease-in-out 0.08s infinite alternate; }
    @keyframes bounce { from { height: 3px; } to { height: 20px; } }

    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #status {
      font-size: 11px;
      font-weight: 600;
      color: var(--teal);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    #elapsed {
      font-size: 11px;
      font-variant-numeric: tabular-nums;
      color: #888;
    }

    /* Previous tracks strip */
    .previous-strip {
      background: var(--mint);
      padding: 20px 24px 24px;
      border-top: 2px solid rgba(31,78,35,0.12);
    }

    .previous-strip h3 {
      font-family: "Montserrat", sans-serif;
      font-weight: 600;
      font-size: 13px;
      color: var(--forest);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .recent-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .recent-item-art {
      width: 36px;
      height: 36px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;
      background: rgba(31,78,35,0.15);
    }

    .recent-item-text { min-width: 0; }

    .recent-item-title {
      font-family: "Montserrat", sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: var(--forest);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .recent-item-artist {
      font-size: 11px;
      color: #4a6b4d;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Responsive */
    @media (max-width: 520px) {
      .art-col { flex: 0 0 140px; }
      #player-art { width: 140px; height: 140px; }
      .artist-banner { font-size: 12px; padding: 5px 8px; }
      .np-artist { font-size: 16px; }
    }
  </style>
</head>
<body>
  <nav>
    <img src="/logo.png" alt="Radio Calico logo">
    <span class="nav-title">Radio Calico</span>
  </nav>

  <main>
  <div class="card">

    <!-- Two-column player -->
    <div class="card-top">
      <div class="art-col">
        <img id="player-art" src="" alt="Album art">
        <div class="year-badge" id="np-year"></div>
        <div class="artist-banner" id="np-artist-banner"></div>
      </div>

      <div class="info-col">
        <div class="np-artist" id="np-artist">—</div>
        <div class="np-title"  id="np-title"></div>
        <div class="np-album"  id="np-album"></div>

        <div class="quality-block">
          <p>Source quality: <span id="q-source">—</span></p>
          <p>Stream quality: <span id="q-stream">—</span></p>
        </div>

        <div class="rating-row">
          <span class="rate-label">Rate this track</span>
          <button class="rating-btn up" id="np-up" onclick="rateNp(1)">
            👍 <span class="count" id="np-up-count">0</span>
          </button>
          <button class="rating-btn down" id="np-down" onclick="rateNp(-1)">
            👎 <span class="count" id="np-down-count">0</span>
          </button>
        </div>

        <div class="controls">
          <button id="play-btn" aria-label="Play">
            <svg id="icon-play"  viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <svg id="icon-pause" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </button>
          <input type="range" id="volume" min="0" max="1" step="0.01" value="1">
          <div class="visualizer" id="visualizer">
            <div class="bar"></div><div class="bar"></div><div class="bar"></div>
            <div class="bar"></div><div class="bar"></div><div class="bar"></div>
            <div class="bar"></div>
          </div>
        </div>

        <div class="status-row">
          <span id="status">Ready</span>
          <span id="elapsed">0:00:00</span>
        </div>
      </div>
    </div>

    <!-- Previous tracks strip -->
    <div class="previous-strip">
      <h3>Previous tracks:</h3>
      <div class="recent-list" id="recent-list"></div>
    </div>

  </div>
  </main>

  <audio id="audio" preload="none"></audio>

  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js"></script>
  <script src="/shared.js"></script>
  <script src="/components/ratings.js"></script>
  <script src="/components/nowPlaying.js"></script>
  <script src="/components/recentTracks.js"></script>
  <script src="/player.js"></script>
  <script src="/radio.js"></script>
</body>
</html>`);
  });

  app.get('/', (req, res) => {
    const users = db.prepare('SELECT * FROM items ORDER BY id DESC').all();
    const listItems = users.map(u => `<li>${u.name}</li>`).join('');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Users</title>
  <style>
    body { font-family: sans-serif; max-width: 480px; margin: 60px auto; }
    input { padding: 8px; width: 100%; box-sizing: border-box; margin-bottom: 8px; }
    button { padding: 8px 16px; }
    ul { margin-top: 24px; padding-left: 20px; }
    li { margin: 6px 0; }
  </style>
</head>
<body>
  <h2>Add User</h2>
  <form method="POST" action="/users">
    <input type="text" name="name" placeholder="Enter a name" required>
    <button type="submit">Save</button>
  </form>
  <h3>Saved Names</h3>
  <ul>${listItems || '<li>No users yet.</li>'}</ul>
</body>
</html>`);
  });

  app.post('/users', (req, res) => {
    const { name } = req.body;
    db.prepare('INSERT INTO items (name) VALUES (?)').run(name);
    res.redirect('/');
  });

  app.get('/items', (req, res) => {
    const items = db.prepare('SELECT * FROM items').all();
    res.json(items);
  });

  app.post('/items', (req, res) => {
    const { name } = req.body;
    const result = db.prepare('INSERT INTO items (name) VALUES (?)').run(name);
    res.json({ id: result.lastInsertRowid, name });
  });

  return { app, db };
}

module.exports = createApp;
