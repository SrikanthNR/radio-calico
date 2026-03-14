// player.js has DOM-dependent side effects at load time (getElementById, addEventListener).
// We set up the required DOM elements first, then eval the script.

const fs = require('fs');
const path = require('path');

const playerSrc = fs.readFileSync(
  path.join(__dirname, '../../public/player.js'),
  'utf8'
);

function setupDOM() {
  document.body.innerHTML = `
    <audio id="audio"></audio>
    <button id="play-btn">
      <svg id="icon-play"></svg>
      <svg id="icon-pause" style="display:none"></svg>
    </button>
    <input type="range" id="volume" min="0" max="1" step="0.01" value="1">
    <div class="visualizer" id="visualizer"></div>
    <span id="status"></span>
    <span id="elapsed"></span>
  `;
}

beforeAll(() => {
  global.STREAM_URL = 'https://example.com/live.m3u8';
  global.Hls = {
    isSupported: () => false,
    Events: { MANIFEST_PARSED: 'hlsManifestParsed', ERROR: 'hlsError' },
  };
  setupDOM();
  // eslint-disable-next-line no-eval
  global.eval(playerSrc);
});

describe('formatTime', () => {
  test('formats 0 seconds', () => {
    expect(formatTime(0)).toBe('0:00:00');
  });

  test('formats 65 seconds as 0:01:05', () => {
    expect(formatTime(65)).toBe('0:01:05');
  });

  test('formats 3661 seconds as 1:01:01', () => {
    expect(formatTime(3661)).toBe('1:01:01');
  });

  test('pads minutes and seconds with leading zeros', () => {
    expect(formatTime(3600)).toBe('1:00:00');
  });

  test('formats 59 seconds as 0:00:59', () => {
    expect(formatTime(59)).toBe('0:00:59');
  });
});

describe('setStatus', () => {
  test('updates the status element text', () => {
    setStatus('Buffering…');
    expect(document.getElementById('status').textContent).toBe('Buffering…');
  });

  test('can set arbitrary status messages', () => {
    setStatus('Live');
    expect(document.getElementById('status').textContent).toBe('Live');
  });
});

describe('setPlaying', () => {
  test('adds is-playing class to play button when playing=true', () => {
    setPlaying(true);
    expect(document.getElementById('play-btn').classList.contains('is-playing')).toBe(true);
  });

  test('removes is-playing class from play button when playing=false', () => {
    setPlaying(true);
    setPlaying(false);
    expect(document.getElementById('play-btn').classList.contains('is-playing')).toBe(false);
  });

  test('adds playing class to visualizer when playing=true', () => {
    setPlaying(true);
    expect(document.getElementById('visualizer').classList.contains('playing')).toBe(true);
  });

  test('removes playing class from visualizer when playing=false', () => {
    setPlaying(true);
    setPlaying(false);
    expect(document.getElementById('visualizer').classList.contains('playing')).toBe(false);
  });

  test('sets status to Paused when playing=false', () => {
    setPlaying(false);
    expect(document.getElementById('status').textContent).toBe('Paused');
  });
});
