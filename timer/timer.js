// bio-tools Timer Logic
document.addEventListener('DOMContentLoaded', () => {
  let mode = 'countdown'; // 'countdown' or 'stopwatch'
  let totalSeconds = 300; // default 5 minutes
  let remainingSeconds = 300;
  let stopwatchSeconds = 0;
  let timerInterval = null;
  let isRunning = false;

  const timerDigits = document.getElementById('timerDigits');
  const timerStatus = document.getElementById('timerStatus');
  const progressBar = document.getElementById('progressBar');
  const btnStartPause = document.getElementById('btnStartPause');
  const btnReset = document.getElementById('btnReset');
  const tabCountdown = document.getElementById('tabCountdown');
  const tabStopwatch = document.getElementById('tabStopwatch');
  const adjustButtons = document.getElementById('adjustButtons');
  const quickPresets = document.getElementById('quickPresets');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const checkSound = document.getElementById('checkSound');
  const checkTickSound = document.getElementById('checkTickSound');

  // Web Audio API for synthesized alerts
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playBeep(freq = 880, duration = 0.15) {
    if (!checkSound.checked) return;
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playFinishAlarm() {
    if (!checkSound.checked) return;
    initAudio();
    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.4);
    });
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function updateDisplay() {
    if (mode === 'countdown') {
      timerDigits.textContent = formatTime(remainingSeconds);
      const ratio = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;
      progressBar.style.width = `${ratio}%`;

      if (remainingSeconds <= 10 && remainingSeconds > 0) {
        timerDigits.classList.add('time-warning');
      } else {
        timerDigits.classList.remove('time-warning');
      }
    } else {
      timerDigits.textContent = formatTime(stopwatchSeconds);
      progressBar.style.width = '100%';
      timerDigits.classList.remove('time-warning');
    }
  }

  function tick() {
    if (mode === 'countdown') {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        if (checkTickSound.checked && remainingSeconds > 0) {
          playBeep(440, 0.05);
        }
        if (remainingSeconds === 0) {
          pauseTimer();
          timerStatus.textContent = '🎉 時間到！測驗/活動結束';
          playFinishAlarm();
        }
      }
    } else {
      stopwatchSeconds++;
      if (checkTickSound.checked) {
        playBeep(440, 0.05);
      }
    }
    updateDisplay();
  }

  function startTimer() {
    initAudio();
    if (!isRunning) {
      isRunning = true;
      timerInterval = setInterval(tick, 1000);
      btnStartPause.textContent = '⏸️ 暫停';
      btnStartPause.className = 'btn-action btn-pause';
      timerStatus.textContent = mode === 'countdown' ? '⏱️ 計時進行中...' : '⏱️ 正計時進行中...';
    }
  }

  function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    btnStartPause.textContent = '▶️ 開始計時';
    btnStartPause.className = 'btn-action btn-start';
    if (remainingSeconds > 0 || mode === 'stopwatch') {
      timerStatus.textContent = '⏸️ 已暫停';
    }
  }

  function resetTimer() {
    pauseTimer();
    if (mode === 'countdown') {
      remainingSeconds = totalSeconds;
      timerStatus.textContent = '準備就緒';
    } else {
      stopwatchSeconds = 0;
      timerStatus.textContent = '碼錶準備就緒';
    }
    updateDisplay();
  }

  // Event Listeners
  btnStartPause.addEventListener('click', () => {
    if (isRunning) pauseTimer();
    else startTimer();
  });

  btnReset.addEventListener('click', resetTimer);

  tabCountdown.addEventListener('click', () => {
    mode = 'countdown';
    tabCountdown.classList.add('active');
    tabStopwatch.classList.remove('active');
    adjustButtons.style.display = 'flex';
    quickPresets.style.display = 'flex';
    resetTimer();
  });

  tabStopwatch.addEventListener('click', () => {
    mode = 'stopwatch';
    tabStopwatch.classList.add('active');
    tabCountdown.classList.remove('active');
    adjustButtons.style.display = 'none';
    quickPresets.style.display = 'none';
    resetTimer();
  });

  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.dataset.mins, 10);
      totalSeconds = mins * 60;
      remainingSeconds = totalSeconds;
      resetTimer();
    });
  });

  document.getElementById('btnSub1Min').addEventListener('click', () => {
    if (remainingSeconds >= 60) {
      remainingSeconds -= 60;
      totalSeconds = Math.max(totalSeconds, remainingSeconds);
      updateDisplay();
    }
  });

  document.getElementById('btnAdd1Min').addEventListener('click', () => {
    remainingSeconds += 60;
    totalSeconds = Math.max(totalSeconds, remainingSeconds);
    updateDisplay();
  });

  document.getElementById('btnAdd5Min').addEventListener('click', () => {
    remainingSeconds += 300;
    totalSeconds = Math.max(totalSeconds, remainingSeconds);
    updateDisplay();
  });

  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => alert('無法切換全螢幕: ' + err.message));
    } else {
      document.exitFullscreen();
    }
  });

  updateDisplay();
});
