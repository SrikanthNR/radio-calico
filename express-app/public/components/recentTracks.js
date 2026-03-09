function renderRecentTracks(d) {
  const list = document.getElementById('recent-list');
  list.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const artist = d['prev_artist_' + i] || '';
    const title  = d['prev_title_'  + i];
    if (!title) continue;

    const item = document.createElement('div');
    item.className = 'recent-item';

    const img = document.createElement('img');
    img.className = 'recent-item-art';
    img.alt = '';

    const text = document.createElement('div');
    text.className = 'recent-item-text';
    text.innerHTML =
      '<div class="recent-item-title">'  + escHtml(title)  + '</div>' +
      '<div class="recent-item-artist">' + escHtml(artist) + '</div>';

    item.appendChild(img);
    item.appendChild(text);
    list.appendChild(item);

    iTunesArt(artist, title).then(url => { if (url) img.src = url; });
  }
}
