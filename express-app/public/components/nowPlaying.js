// Cache DOM references — queried once, reused on every metadata update
const _npArtist       = document.getElementById('np-artist');
const _npArtistBanner = document.getElementById('np-artist-banner');
const _npTitle        = document.getElementById('np-title');
const _npAlbum        = document.getElementById('np-album');
const _npYear         = document.getElementById('np-year');
const _playerArt      = document.getElementById('player-art');
const _qSource        = document.getElementById('q-source');
const _qStream        = document.getElementById('q-stream');

function updateNowPlaying(d) {
  _npArtist.textContent       = d.artist || '—';
  _npArtistBanner.textContent = d.artist || '';
  _npTitle.textContent        = d.title  || '';
  _npAlbum.textContent        = [d.album, d.date].filter(Boolean).join(' — ');
  _npYear.textContent         = d.date   || '';
  // No cache-buster: let CDN/browser cache serve the same cover.jpg until it changes
  _playerArt.src              = COVER_URL;

  const khz  = d.sample_rate ? (d.sample_rate / 1000).toFixed(1) + ' kHz' : '—';
  const depth = d.bit_depth  ? d.bit_depth + '-bit' : '—';
  _qSource.textContent = depth + ' / ' + khz;
  _qStream.textContent = depth + ' / ' + khz + ' Lossless';
}
