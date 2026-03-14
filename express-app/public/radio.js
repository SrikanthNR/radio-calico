async function fetchMetadata() {
  try {
    // No cache-buster: the server sets Cache-Control: no-cache so the browser
    // still revalidates with If-None-Match/If-Modified-Since, but the CDN can
    // serve cached responses to other clients without a unique query string.
    const res = await fetch(METADATA_URL);
    if (!res.ok) return;
    const d = await res.json();

    updateNowPlaying(d);

    currentSongKey = songKey(d.artist || '', d.title || '');
    fetchRatings(currentSongKey).then(data =>
      applyRatingUI(_npUp, _npDown, _npUpCount, _npDownCount, data)
    );

    renderRecentTracks(d);
  } catch (e) { /* network errors are transient — next poll will retry */ }
}

fetchMetadata();
setInterval(fetchMetadata, 30000);

setStatus('Ready');
