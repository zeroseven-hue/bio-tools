// bio-tools Classroom Scoreboard & Sound Effects Logic
document.addEventListener('DOMContentLoaded', () => {
  const LOCAL_STORAGE_KEY = 'bio_tools_scoreboard_data';

  let teamCount = 6;
  let teamsData = [];

  // Web Audio API Synthesizers for 4 Sound Effects
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // SFX 1: 🎵 答對叮咚 (Correct Chime: High-low two-tone bell)
  function playCorrectSFX() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.frequency.setValueAtTime(880, now + 0.15); // A5
    gain2.gain.setValueAtTime(0.4, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  }

  // SFX 2: ❌ 答錯嗶嗶 (Wrong Buzzer: Sawtooth low harsh buzz)
  function playWrongSFX() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // SFX 3: 🚨 搶答響鈴 (Buzzer Sound: Siren / Alarm pulse)
  function playBuzzerSFX() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800 + i * 200, now + i * 0.1);
      gain.gain.setValueAtTime(0.2, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.08);
    }
  }

  // SFX 4: 🎉 歡呼鼓掌 (Celebration Fanfare)
  function playCheerSFX() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51];

    arpeggio.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.3, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  }

  // DOM Elements
  const selectTeamCount = document.getElementById('selectTeamCount');
  const btnResetAllScores = document.getElementById('btnResetAllScores');
  const teamsGrid = document.getElementById('teamsGrid');
  const btnFullscreen = document.getElementById('btnFullscreen');

  // Sound Buttons Listeners
  document.getElementById('sfxCorrect').addEventListener('click', playCorrectSFX);
  document.getElementById('sfxWrong').addEventListener('click', playWrongSFX);
  document.getElementById('sfxBuzzer').addEventListener('click', playBuzzerSFX);
  document.getElementById('sfxCheer').addEventListener('click', playCheerSFX);

  function loadSavedData() {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          teamsData = parsed;
          teamCount = teamsData.length;
          selectTeamCount.value = teamCount;
          return;
        }
      } catch (e) {
        console.error('Failed to parse scoreboard storage', e);
      }
    }
    initTeams(6);
  }

  function saveCurrentData() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(teamsData));
  }

  function initTeams(count) {
    teamCount = count;
    teamsData = Array.from({ length: count }, (_, i) => {
      return teamsData[i] || { name: `第 ${i + 1} 組`, score: 0 };
    });
    renderTeams();
  }

  function renderTeams() {
    teamsGrid.innerHTML = '';
    const maxScore = Math.max(...teamsData.map(t => t.score));

    teamsData.forEach((team, idx) => {
      const isLeader = maxScore > 0 && team.score === maxScore;
      const card = document.createElement('div');
      card.className = `team-card ${isLeader ? 'leader' : ''}`;

      card.innerHTML = `
        ${isLeader ? '<div class="crown-badge">👑 領先小組</div>' : ''}
        <input type="text" class="team-name-input" value="${team.name}" data-idx="${idx}">
        <div class="score-display">${team.score}</div>
        <div class="score-buttons">
          <button class="btn-score btn-sub" data-idx="${idx}" data-val="-1">-1</button>
          <button class="btn-score btn-add1" data-idx="${idx}" data-val="1">+1</button>
          <button class="btn-score btn-add5" data-idx="${idx}" data-val="5">+5</button>
        </div>
      `;
      teamsGrid.appendChild(card);
    });

    // Add listeners for score changes
    document.querySelectorAll('.btn-score').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const val = parseInt(e.target.dataset.val, 10);
        teamsData[idx].score += val;
        if (val > 0) playCorrectSFX();
        saveCurrentData();
        renderTeams();
      });
    });

    // Add listeners for name changes
    document.querySelectorAll('.team-name-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        teamsData[idx].name = e.target.value.trim() || `第 ${idx + 1} 組`;
        saveCurrentData();
      });
    });
  }

  selectTeamCount.addEventListener('change', (e) => {
    initTeams(parseInt(e.target.value, 10));
    saveCurrentData();
  });

  btnResetAllScores.addEventListener('click', () => {
    if (confirm('確定要將全部分數清零嗎？')) {
      teamsData.forEach(t => t.score = 0);
      saveCurrentData();
      renderTeams();
    }
  });

  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => alert('無法切換全螢幕: ' + err.message));
    } else {
      document.exitFullscreen();
    }
  });

  loadSavedData();
  renderTeams();
});
