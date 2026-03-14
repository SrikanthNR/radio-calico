'use strict';

const request = require('supertest');
const createApp = require('../../app');

describe('Ratings API', () => {
  let app, db;

  beforeEach(() => {
    ({ app, db } = createApp(':memory:'));
  });

  afterEach(() => {
    db.close();
  });

  // GET /api/ratings
  describe('GET /api/ratings', () => {
    test('returns 400 when song param is missing', async () => {
      const res = await request(app).get('/api/ratings');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('song required');
    });

    test('returns zero counts when no ratings exist', async () => {
      const res = await request(app).get('/api/ratings?song=artist|||title');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ thumbs_up: 0, thumbs_down: 0, user_rating: 0 });
    });

    test('returns correct counts after ratings are added', async () => {
      db.prepare("INSERT INTO ratings VALUES ('s1', 'u1', 1)").run();
      db.prepare("INSERT INTO ratings VALUES ('s1', 'u2', 1)").run();
      db.prepare("INSERT INTO ratings VALUES ('s1', 'u3', -1)").run();

      const res = await request(app).get('/api/ratings?song=s1');
      expect(res.status).toBe(200);
      expect(res.body.thumbs_up).toBe(2);
      expect(res.body.thumbs_down).toBe(1);
      expect(res.body.user_rating).toBe(0);
    });

    test('returns user_rating for the requesting user', async () => {
      db.prepare("INSERT INTO ratings VALUES ('s1', 'u1', 1)").run();

      const res = await request(app).get('/api/ratings?song=s1&user=u1');
      expect(res.body.user_rating).toBe(1);
    });

    test('returns user_rating=0 when user has no rating', async () => {
      db.prepare("INSERT INTO ratings VALUES ('s1', 'u1', 1)").run();

      const res = await request(app).get('/api/ratings?song=s1&user=u2');
      expect(res.body.user_rating).toBe(0);
    });
  });

  // POST /api/ratings
  describe('POST /api/ratings', () => {
    test('returns 400 when song_key is missing', async () => {
      const res = await request(app)
        .post('/api/ratings')
        .send({ user_id: 'u1', rating: 1 });
      expect(res.status).toBe(400);
    });

    test('returns 400 when user_id is missing', async () => {
      const res = await request(app)
        .post('/api/ratings')
        .send({ song_key: 's1', rating: 1 });
      expect(res.status).toBe(400);
    });

    test('returns 400 for invalid rating value', async () => {
      const res = await request(app)
        .post('/api/ratings')
        .send({ song_key: 's1', user_id: 'u1', rating: 0 });
      expect(res.status).toBe(400);
    });

    test('adds a thumbs-up and returns updated counts', async () => {
      const res = await request(app)
        .post('/api/ratings')
        .send({ song_key: 's1', user_id: 'u1', rating: 1 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ thumbs_up: 1, thumbs_down: 0, user_rating: 1 });
    });

    test('adds a thumbs-down and returns updated counts', async () => {
      const res = await request(app)
        .post('/api/ratings')
        .send({ song_key: 's1', user_id: 'u1', rating: -1 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ thumbs_up: 0, thumbs_down: 1, user_rating: -1 });
    });

    test('toggling the same rating removes it', async () => {
      await request(app).post('/api/ratings').send({ song_key: 's1', user_id: 'u1', rating: 1 });
      const res = await request(app).post('/api/ratings').send({ song_key: 's1', user_id: 'u1', rating: 1 });
      expect(res.body).toEqual({ thumbs_up: 0, thumbs_down: 0, user_rating: 0 });
    });

    test('changing from thumbs-up to thumbs-down updates correctly', async () => {
      await request(app).post('/api/ratings').send({ song_key: 's1', user_id: 'u1', rating: 1 });
      const res = await request(app).post('/api/ratings').send({ song_key: 's1', user_id: 'u1', rating: -1 });
      expect(res.body).toEqual({ thumbs_up: 0, thumbs_down: 1, user_rating: -1 });
    });

    test('multiple users rating the same song accumulate correctly', async () => {
      await request(app).post('/api/ratings').send({ song_key: 's1', user_id: 'u1', rating: 1 });
      await request(app).post('/api/ratings').send({ song_key: 's1', user_id: 'u2', rating: 1 });
      await request(app).post('/api/ratings').send({ song_key: 's1', user_id: 'u3', rating: -1 });
      const res = await request(app).get('/api/ratings?song=s1');
      expect(res.body.thumbs_up).toBe(2);
      expect(res.body.thumbs_down).toBe(1);
    });
  });

  // GET /radio
  describe('GET /radio', () => {
    test('serves the radio player page', async () => {
      const res = await request(app).get('/radio');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('Radio Calico');
      expect(res.text).toContain('id="np-artist"');
    });
  });

  // GET /items
  describe('GET /items', () => {
    test('returns empty array initially', async () => {
      const res = await request(app).get('/items');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('returns inserted items', async () => {
      await request(app).post('/items').send({ name: 'Test Item' });
      const res = await request(app).get('/items');
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Test Item');
    });
  });

  // POST /items
  describe('POST /items', () => {
    test('creates an item and returns it', async () => {
      const res = await request(app).post('/items').send({ name: 'New Item' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Item');
      expect(res.body.id).toBeDefined();
    });
  });
});
