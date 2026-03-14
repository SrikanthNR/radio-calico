const fs = require('fs');
const path = require('path');

const sharedSrc = fs.readFileSync(
  path.join(__dirname, '../../public/shared.js'),
  'utf8'
);
const recentTracksSrc = fs.readFileSync(
  path.join(__dirname, '../../public/components/recentTracks.js'),
  'utf8'
);

function setupDOM() {
  document.body.innerHTML = `<div id="recent-list"></div>`;
}

beforeAll(() => {
  Object.defineProperty(global, 'crypto', {
    value: { randomUUID: () => 'test-uuid' },
    writable: true,
  });
  // Mock iTunesArt to avoid real network calls
  global.fetch = jest.fn().mockResolvedValue({ ok: false });
  // eslint-disable-next-line no-eval
  global.eval(sharedSrc);
  // eslint-disable-next-line no-eval
  global.eval(recentTracksSrc);
});

beforeEach(() => {
  setupDOM();
  jest.clearAllMocks();
  // iTunesArt is defined globally by shared.js — stub it to resolve immediately
  global.iTunesArt = jest.fn().mockResolvedValue('');
});

describe('renderRecentTracks', () => {
  test('renders up to 5 recent tracks', () => {
    renderRecentTracks({
      prev_artist_1: 'Artist A', prev_title_1: 'Song A',
      prev_artist_2: 'Artist B', prev_title_2: 'Song B',
      prev_artist_3: 'Artist C', prev_title_3: 'Song C',
    });
    const items = document.querySelectorAll('.recent-item');
    expect(items).toHaveLength(3);
  });

  test('skips entries with no title', () => {
    renderRecentTracks({
      prev_artist_1: 'Artist A', prev_title_1: 'Song A',
      prev_artist_2: '',         // no title_2
      prev_artist_3: 'Artist C', prev_title_3: 'Song C',
    });
    const items = document.querySelectorAll('.recent-item');
    expect(items).toHaveLength(2);
  });

  test('renders track title text', () => {
    renderRecentTracks({
      prev_artist_1: 'Miles Davis',
      prev_title_1: 'So What',
    });
    const titleEl = document.querySelector('.recent-item-title');
    expect(titleEl.textContent).toBe('So What');
  });

  test('renders artist text', () => {
    renderRecentTracks({
      prev_artist_1: 'Miles Davis',
      prev_title_1: 'So What',
    });
    const artistEl = document.querySelector('.recent-item-artist');
    expect(artistEl.textContent).toBe('Miles Davis');
  });

  test('escapes HTML in title', () => {
    renderRecentTracks({
      prev_artist_1: 'Artist',
      prev_title_1: '<script>alert(1)</script>',
    });
    const titleEl = document.querySelector('.recent-item-title');
    expect(titleEl.innerHTML).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('clears previous content on re-render', () => {
    renderRecentTracks({ prev_artist_1: 'A', prev_title_1: 'B' });
    renderRecentTracks({ prev_artist_1: 'C', prev_title_1: 'D' });
    const items = document.querySelectorAll('.recent-item');
    expect(items).toHaveLength(1);
    expect(document.querySelector('.recent-item-title').textContent).toBe('D');
  });

  test('renders empty list when no tracks', () => {
    renderRecentTracks({});
    const items = document.querySelectorAll('.recent-item');
    expect(items).toHaveLength(0);
  });
});
