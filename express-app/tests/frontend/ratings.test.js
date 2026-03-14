const fs = require('fs');
const path = require('path');

const ratingsSrc = fs.readFileSync(
  path.join(__dirname, '../../public/components/ratings.js'),
  'utf8'
);

function setupDOM() {
  document.body.innerHTML = `
    <button class="rating-btn up"   id="np-up"><span class="count" id="np-up-count">0</span></button>
    <button class="rating-btn down" id="np-down"><span class="count" id="np-down-count">0</span></button>
  `;
}

beforeAll(() => {
  // Globals required by ratings.js
  global.USER_ID = 'test-user';
  global.currentSongKey = 'artist|||title';
  // eslint-disable-next-line no-eval
  global.eval(ratingsSrc);
});

beforeEach(() => {
  setupDOM();
});

describe('applyRatingUI', () => {
  function getEls() {
    return {
      upEl:       document.getElementById('np-up'),
      downEl:     document.getElementById('np-down'),
      upCountEl:  document.getElementById('np-up-count'),
      downCountEl: document.getElementById('np-down-count'),
    };
  }

  test('sets thumbs-up count', () => {
    const { upEl, downEl, upCountEl, downCountEl } = getEls();
    applyRatingUI(upEl, downEl, upCountEl, downCountEl, { thumbs_up: 5, thumbs_down: 2, user_rating: 0 });
    expect(upCountEl.textContent).toBe('5');
    expect(downCountEl.textContent).toBe('2');
  });

  test('adds active class to up button when user_rating is 1', () => {
    const { upEl, downEl, upCountEl, downCountEl } = getEls();
    applyRatingUI(upEl, downEl, upCountEl, downCountEl, { thumbs_up: 1, thumbs_down: 0, user_rating: 1 });
    expect(upEl.classList.contains('active')).toBe(true);
    expect(downEl.classList.contains('active')).toBe(false);
  });

  test('adds active class to down button when user_rating is -1', () => {
    const { upEl, downEl, upCountEl, downCountEl } = getEls();
    applyRatingUI(upEl, downEl, upCountEl, downCountEl, { thumbs_up: 0, thumbs_down: 1, user_rating: -1 });
    expect(upEl.classList.contains('active')).toBe(false);
    expect(downEl.classList.contains('active')).toBe(true);
  });

  test('removes active classes when user_rating is 0', () => {
    const { upEl, downEl, upCountEl, downCountEl } = getEls();
    upEl.classList.add('active');
    downEl.classList.add('active');
    applyRatingUI(upEl, downEl, upCountEl, downCountEl, { thumbs_up: 0, thumbs_down: 0, user_rating: 0 });
    expect(upEl.classList.contains('active')).toBe(false);
    expect(downEl.classList.contains('active')).toBe(false);
  });
});

describe('fetchRatings', () => {
  test('calls the ratings API with song key and user id', async () => {
    const mockData = { thumbs_up: 3, thumbs_down: 1, user_rating: 1 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await fetchRatings('artist|||title');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ratings?song=')
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('artist|||title'))
    );
    expect(result).toEqual(mockData);
  });

  test('returns zeroed object on fetch failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    const result = await fetchRatings('some-key');
    expect(result).toEqual({ thumbs_up: 0, thumbs_down: 0, user_rating: 0 });
  });
});
