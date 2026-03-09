async function fetchRatings(key) {
  const res = await fetch('/api/ratings?song=' + encodeURIComponent(key) + '&user=' + encodeURIComponent(USER_ID));
  return res.ok ? res.json() : { thumbs_up: 0, thumbs_down: 0, user_rating: 0 };
}

function applyRatingUI(upEl, downEl, upCountEl, downCountEl, data) {
  upCountEl.textContent   = data.thumbs_up;
  downCountEl.textContent = data.thumbs_down;
  upEl.classList.toggle('active',   data.user_rating ===  1);
  downEl.classList.toggle('active', data.user_rating === -1);
}

async function rateNp(value) {
  if (!currentSongKey) return;
  const res = await fetch('/api/ratings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ song_key: currentSongKey, user_id: USER_ID, rating: value })
  });
  if (!res.ok) return;
  const data = await res.json();
  applyRatingUI(
    document.getElementById('np-up'), document.getElementById('np-down'),
    document.getElementById('np-up-count'), document.getElementById('np-down-count'),
    data
  );
}

async function rateRecent(key, value, upEl, downEl, upCountEl, downCountEl) {
  const res = await fetch('/api/ratings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ song_key: key, user_id: USER_ID, rating: value })
  });
  if (!res.ok) return;
  applyRatingUI(upEl, downEl, upCountEl, downCountEl, await res.json());
}
