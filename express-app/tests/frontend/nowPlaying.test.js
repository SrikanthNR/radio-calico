const fs = require('fs');
const path = require('path');

const nowPlayingSrc = fs.readFileSync(
  path.join(__dirname, '../../public/components/nowPlaying.js'),
  'utf8'
);

function setupDOM() {
  document.body.innerHTML = `
    <div id="np-artist"></div>
    <div id="np-artist-banner"></div>
    <div id="np-title"></div>
    <div id="np-album"></div>
    <div id="np-year"></div>
    <img id="player-art" src="">
    <span id="q-source"></span>
    <span id="q-stream"></span>
  `;
}

beforeAll(() => {
  global.COVER_URL = 'https://example.com/cover.jpg';
  // DOM must exist before eval so module-level getElementById caching works
  setupDOM();
  // eslint-disable-next-line no-eval
  global.eval(nowPlayingSrc);
});

describe('updateNowPlaying', () => {
  const sampleData = {
    artist: 'Miles Davis',
    title: 'Kind of Blue',
    album: 'Kind of Blue',
    date: '1959',
    sample_rate: 44100,
    bit_depth: 16,
  };

  test('sets artist text', () => {
    updateNowPlaying(sampleData);
    expect(document.getElementById('np-artist').textContent).toBe('Miles Davis');
  });

  test('sets artist banner text', () => {
    updateNowPlaying(sampleData);
    expect(document.getElementById('np-artist-banner').textContent).toBe('Miles Davis');
  });

  test('sets title text', () => {
    updateNowPlaying(sampleData);
    expect(document.getElementById('np-title').textContent).toBe('Kind of Blue');
  });

  test('combines album and date', () => {
    updateNowPlaying(sampleData);
    expect(document.getElementById('np-album').textContent).toBe('Kind of Blue — 1959');
  });

  test('sets year badge', () => {
    updateNowPlaying(sampleData);
    expect(document.getElementById('np-year').textContent).toBe('1959');
  });

  test('sets player-art src to cover URL', () => {
    updateNowPlaying(sampleData);
    expect(document.getElementById('player-art').src).toContain('example.com/cover.jpg');
  });

  test('formats source quality correctly', () => {
    updateNowPlaying(sampleData);
    expect(document.getElementById('q-source').textContent).toBe('16-bit / 44.1 kHz');
  });

  test('formats stream quality correctly', () => {
    updateNowPlaying(sampleData);
    expect(document.getElementById('q-stream').textContent).toBe('16-bit / 44.1 kHz Lossless');
  });

  test('shows dashes when artist is missing', () => {
    updateNowPlaying({});
    expect(document.getElementById('np-artist').textContent).toBe('—');
  });

  test('shows empty string when title is missing', () => {
    updateNowPlaying({});
    expect(document.getElementById('np-title').textContent).toBe('');
  });

  test('shows only album when date is missing', () => {
    updateNowPlaying({ album: 'My Album' });
    expect(document.getElementById('np-album').textContent).toBe('My Album');
  });

  test('shows dash for quality when sample_rate and bit_depth are missing', () => {
    updateNowPlaying({});
    expect(document.getElementById('q-source').textContent).toBe('— / —');
  });
});
