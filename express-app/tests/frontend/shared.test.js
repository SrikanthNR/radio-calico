const fs = require('fs');
const path = require('path');

// Load shared.js into the jsdom global context.
// We must stub localStorage and crypto before evaluation.
const sharedSrc = fs.readFileSync(
  path.join(__dirname, '../../public/shared.js'),
  'utf8'
);

beforeAll(() => {
  // jsdom provides localStorage; stub crypto.randomUUID
  Object.defineProperty(global, 'crypto', {
    value: { randomUUID: () => 'test-uuid-1234' },
    writable: true,
  });
  // eslint-disable-next-line no-eval
  global.eval(sharedSrc);
});

describe('escHtml', () => {
  test('escapes ampersands', () => {
    expect(escHtml('a&b')).toBe('a&amp;b');
  });

  test('escapes less-than', () => {
    expect(escHtml('<div>')).toBe('&lt;div&gt;');
  });

  test('escapes double quotes', () => {
    expect(escHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  test('leaves plain text unchanged', () => {
    expect(escHtml('hello world')).toBe('hello world');
  });

  test('escapes multiple special chars in one string', () => {
    expect(escHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});

describe('songKey', () => {
  test('combines artist and title with separator, lowercased', () => {
    expect(songKey('The Beatles', 'Hey Jude')).toBe('the beatles|||hey jude');
  });

  test('lowercases mixed case', () => {
    expect(songKey('ARTIST', 'TITLE')).toBe('artist|||title');
  });

  test('handles empty strings', () => {
    expect(songKey('', '')).toBe('|||');
  });
});

describe('USER_ID initialization', () => {
  test('persists a generated UUID in localStorage', () => {
    // shared.js generates a UUID and saves it to localStorage on first load
    expect(localStorage.getItem('rc_user_id')).toBe('test-uuid-1234');
  });
});
