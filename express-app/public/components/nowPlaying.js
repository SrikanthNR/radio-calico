function updateNowPlaying(d) {
  document.getElementById('np-artist').textContent        = d.artist || '—';
  document.getElementById('np-artist-banner').textContent = d.artist || '';
  document.getElementById('np-title').textContent         = d.title  || '';
  document.getElementById('np-album').textContent         = [d.album, d.date].filter(Boolean).join(' — ');
  document.getElementById('np-year').textContent          = d.date   || '';
  document.getElementById('player-art').src               = COVER_URL + '?_=' + Date.now();

  const khz   = d.sample_rate ? (d.sample_rate / 1000).toFixed(1) + ' kHz' : '—';
  const depth  = d.bit_depth  ? d.bit_depth + '-bit' : '—';
  document.getElementById('q-source').textContent = depth + ' / ' + khz;
  document.getElementById('q-stream').textContent = depth + ' / ' + khz + ' Lossless';
}
