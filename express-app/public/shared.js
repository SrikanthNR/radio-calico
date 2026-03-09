const STREAM_URL   = 'https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8';
const METADATA_URL = 'https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json';
const COVER_URL    = 'https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg';

let USER_ID = localStorage.getItem('rc_user_id');
if (!USER_ID) {
  USER_ID = crypto.randomUUID();
  localStorage.setItem('rc_user_id', USER_ID);
}

let currentSongKey = '';

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function songKey(artist, title) {
  return (artist + '|||' + title).toLowerCase();
}

async function iTunesArt(artist, title) {
  try {
    const q = encodeURIComponent(artist + ' ' + title);
    const res = await fetch('https://itunes.apple.com/search?term=' + q + '&media=music&limit=1');
    if (!res.ok) return '';
    const data = await res.json();
    const result = data.results && data.results[0];
    return result ? result.artworkUrl100.replace('100x100bb', '300x300bb') : '';
  } catch (e) { return ''; }
}
