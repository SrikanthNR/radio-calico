async function fetchMetadata() {
  try {
    const res = await fetch(METADATA_URL + '?_=' + Date.now());
    if (!res.ok) return;
    const d = await res.json();

    updateNowPlaying(d);

    currentSongKey = songKey(d.artist || '', d.title || '');
    fetchRatings(currentSongKey).then(data => applyRatingUI(
      document.getElementById('np-up'), document.getElementById('np-down'),
      document.getElementById('np-up-count'), document.getElementById('np-down-count'),
      data
    ));

    renderRecentTracks(d);
  } catch (e) { /* silently ignore network errors */ }
}

fetchMetadata();
setInterval(fetchMetadata, 30000);

setStatus('Ready');
