const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const volumeSlider = document.getElementById('volume');
const statusEl = document.getElementById('status');
const visualizer = document.getElementById('visualizer');
const elapsedEl = document.getElementById('elapsed');

let hls = null;
let playing = false;
let elapsedSeconds = 0;
let timerInterval = null;

function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    elapsedEl.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function setStatus(msg) { statusEl.textContent = msg; }

function initHls() {
  if (Hls.isSupported()) {
    if (hls) { hls.destroy(); }
    hls = new Hls({ lowLatencyMode: true });
    hls.loadSource(STREAM_URL);
    hls.attachMedia(audio);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setStatus('Live');
      audio.play();
    });
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        setStatus('Stream error — retrying…');
        setTimeout(initHls, 3000);
      }
    });
  } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS (Safari)
    audio.src = STREAM_URL;
    audio.addEventListener('canplay', () => { setStatus('Live'); audio.play(); }, { once: true });
  } else {
    setStatus('HLS not supported in this browser');
  }
}

function setPlaying(state) {
  playing = state;
  iconPlay.style.display  = state ? 'none'  : 'block';
  iconPause.style.display = state ? 'block' : 'none';
  visualizer.classList.toggle('playing', state);
  if (!state) setStatus('Paused');
}

playBtn.addEventListener('click', () => {
  if (!playing) {
    setStatus('Connecting…');
    if (!hls && !audio.src) {
      initHls();
    } else {
      audio.play();
    }
  } else {
    audio.pause();
    if (hls) { hls.stopLoad(); }
  }
});

audio.addEventListener('playing', () => { setPlaying(true); startTimer(); });
audio.addEventListener('pause',   () => { setPlaying(false); pauseTimer(); });
audio.addEventListener('waiting', () => { setStatus('Buffering…'); pauseTimer(); });

volumeSlider.addEventListener('input', () => { audio.volume = volumeSlider.value; });
