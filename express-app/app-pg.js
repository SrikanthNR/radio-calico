'use strict';

const express = require('express');
const helmet = require('helmet');
const { Pool } = require('pg');
const path = require('path');

function createApp(connectionString) {
  const app = express();
  const pool = new Pool({ connectionString });

  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1y',
    etag: true,
  }));

  pool.query(`CREATE INDEX IF NOT EXISTS idx_ratings_song_key ON ratings (song_key)`).catch(() => {});

  pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `).then(() => pool.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      song_key TEXT NOT NULL,
      user_id  TEXT NOT NULL,
      rating   INTEGER NOT NULL CHECK(rating IN (1, -1)),
      PRIMARY KEY (song_key, user_id)
    )
  `)).catch(err => {
    console.error('Failed to initialize database tables:', err);
    process.exit(1);
  });

  app.get('/api/ratings', async (req, res) => {
    const { song, user } = req.query;
    if (!song) return res.status(400).json({ error: 'song required' });
    const countsResult = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN rating =  1 THEN 1 ELSE 0 END), 0)::int AS thumbs_up,
        COALESCE(SUM(CASE WHEN rating = -1 THEN 1 ELSE 0 END), 0)::int AS thumbs_down
       FROM ratings WHERE song_key = $1`,
      [song]
    );
    const counts = countsResult.rows[0];
    let user_rating = 0;
    if (user) {
      const userResult = await pool.query(
        'SELECT rating FROM ratings WHERE song_key = $1 AND user_id = $2',
        [song, user]
      );
      if (userResult.rows.length > 0) user_rating = userResult.rows[0].rating;
    }
    res.json({ thumbs_up: counts.thumbs_up, thumbs_down: counts.thumbs_down, user_rating });
  });

  app.post('/api/ratings', async (req, res) => {
    const { song_key, user_id, rating } = req.body;
    if (!song_key || !user_id || ![1, -1].includes(Number(rating))) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    const ratingNum = Number(rating);
    const existingResult = await pool.query(
      'SELECT rating FROM ratings WHERE song_key = $1 AND user_id = $2',
      [song_key, user_id]
    );
    const existing = existingResult.rows[0];
    const toggled = existing && existing.rating === ratingNum;
    if (toggled) {
      await pool.query('DELETE FROM ratings WHERE song_key = $1 AND user_id = $2', [song_key, user_id]);
    } else {
      await pool.query(
        `INSERT INTO ratings (song_key, user_id, rating) VALUES ($1, $2, $3)
         ON CONFLICT (song_key, user_id) DO UPDATE SET rating = EXCLUDED.rating`,
        [song_key, user_id, ratingNum]
      );
    }
    const countsResult = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN rating =  1 THEN 1 ELSE 0 END), 0)::int AS thumbs_up,
        COALESCE(SUM(CASE WHEN rating = -1 THEN 1 ELSE 0 END), 0)::int AS thumbs_down
       FROM ratings WHERE song_key = $1`,
      [song_key]
    );
    const counts = countsResult.rows[0];
    res.json({
      thumbs_up: counts.thumbs_up,
      thumbs_down: counts.thumbs_down,
      user_rating: toggled ? 0 : ratingNum
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
  <link rel="preconnect" href="https://d3d4yli4hf5bmh.cloudfront.net" crossorigin>
  <link rel="dns-prefetch" href="https://itunes.apple.com">
  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/radio.css">
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
            <svg id="icon-pause" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
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

  <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js"></script>
  <script src="/shared.js" defer></script>
  <script src="/components/ratings.js" defer></script>
  <script src="/components/nowPlaying.js" defer></script>
  <script src="/components/recentTracks.js" defer></script>
  <script src="/player.js" defer></script>
  <script src="/radio.js" defer></script>
</body>
</html>`);
  });

  app.get('/', async (req, res) => {
    const result = await pool.query('SELECT * FROM items ORDER BY id DESC');
    const listItems = result.rows.map(u => `<li>${u.name}</li>`).join('');
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

  app.post('/users', async (req, res) => {
    const { name } = req.body;
    await pool.query('INSERT INTO items (name) VALUES ($1)', [name]);
    res.redirect('/');
  });

  app.get('/items', async (req, res) => {
    const result = await pool.query('SELECT * FROM items');
    res.json(result.rows);
  });

  app.post('/items', async (req, res) => {
    const { name } = req.body;
    const result = await pool.query(
      'INSERT INTO items (name) VALUES ($1) RETURNING id, name',
      [name]
    );
    res.json(result.rows[0]);
  });

  return { app, pool };
}

module.exports = createApp;
