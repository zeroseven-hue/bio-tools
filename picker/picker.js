// bio-tools Random Picker & Grouping Logic
document.addEventListener('DOMContentLoaded', () => {
  // Storage key
  const LOCAL_STORAGE_KEY = 'bio_tools_student_roster';

  // Default roster if empty
  const defaultRoster = Array.from({ length: 30 }, (_, i) => `${i + 1}號`);

  let studentList = getSavedRoster();
  let remainingList = [...studentList];
  let pickedHistory = [];
  let isSpinning = false;
  let currentAngle = 0;

  // Web Audio for spinning wheel sounds
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playTickSound() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  }

  function playWinSound() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + idx * 0.12);
      osc.stop(audioCtx.currentTime + idx * 0.12 + 0.3);
    });
  }

  function getSavedRoster() {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return defaultRoster;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultRoster;
    } catch {
      return defaultRoster;
    }
  }

  function saveRoster(list) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    studentList = list;
    remainingList = [...studentList];
    drawWheel();
  }

  // DOM Elements
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const btnSpin = document.getElementById('btnSpin');
  const checkRemovePicked = document.getElementById('checkRemovePicked');
  const pickedHistoryEl = document.getElementById('pickedHistory');
  const btnResetPicked = document.getElementById('btnResetPicked');
  const winnerModal = document.getElementById('winnerModal');
  const winnerText = document.getElementById('winnerText');
  const btnCloseModal = document.getElementById('btnCloseModal');

  const rosterInput = document.getElementById('rosterInput');
  const btnSaveRoster = document.getElementById('btnSaveRoster');
  const btnLoadPreset30 = document.getElementById('btnLoadPreset30');

  // Colors for wheel segments
  const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#6366f1'];

  function drawWheel() {
    const num = remainingList.length;
    if (num === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('所有名單皆已抽完！', canvas.width / 2, canvas.height / 2);
      return;
    }

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = canvas.width / 2 - 15;
    const arc = (2 * Math.PI) / num;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < num; i++) {
      const angle = currentAngle + i * arc;
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle, angle + arc);
      ctx.lineTo(cx, cy);
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = num > 20 ? 'bold 13px sans-serif' : 'bold 16px sans-serif';
      ctx.fillText(remainingList[i], radius - 15, 6);
      ctx.restore();
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 35, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('抽籤', cx, cy + 5);
  }

  function spinWheel() {
    if (isSpinning || remainingList.length === 0) return;
    initAudio();
    isSpinning = true;
    btnSpin.disabled = true;

    const num = remainingList.length;
    const arc = (2 * Math.PI) / num;
    const randomIndex = Math.floor(Math.random() * num);
    
    // Target rotation to land arrow at top (3 * Math.PI / 2)
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 2 * Math.PI;
    const targetAngle = 3 * Math.PI / 2 - (randomIndex * arc + arc / 2) + extraRotations;
    
    const startAngle = currentAngle;
    const duration = 4000; // 4 seconds
    const startTime = performance.now();
    let lastTickAngle = startAngle;

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      currentAngle = startAngle + (targetAngle - startAngle) * ease;

      // Check tick sound interval
      if (Math.abs(currentAngle - lastTickAngle) >= arc) {
        playTickSound();
        lastTickAngle = currentAngle;
      }

      drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isSpinning = false;
        btnSpin.disabled = false;

        const winner = remainingList[randomIndex];
        showWinner(winner);

        if (checkRemovePicked.checked) {
          remainingList.splice(randomIndex, 1);
          pickedHistory.push(winner);
          updatePickedHistoryUI();
        }
        drawWheel();
      }
    }

    requestAnimationFrame(animate);
  }

  function showWinner(name) {
    winnerText.textContent = name;
    winnerModal.classList.remove('hidden');
    playWinSound();
  }

  function updatePickedHistoryUI() {
    pickedHistoryEl.innerHTML = '';
    if (pickedHistory.length === 0) {
      pickedHistoryEl.innerHTML = '<span class="empty-hint">尚無抽中學生</span>';
      return;
    }
    pickedHistory.forEach(name => {
      const tag = document.createElement('span');
      tag.className = 'picked-tag';
      tag.textContent = name;
      pickedHistoryEl.appendChild(tag);
    });
  }

  // Event Listeners for Wheel
  btnSpin.addEventListener('click', spinWheel);
  btnCloseModal.addEventListener('click', () => winnerModal.classList.add('hidden'));

  btnResetPicked.addEventListener('click', () => {
    remainingList = [...studentList];
    pickedHistory = [];
    updatePickedHistoryUI();
    drawWheel();
  });

  // Tabs navigation
  const tabs = {
    tabWheel: { sec: 'secWheel', init: drawWheel },
    tabGroup: { sec: 'secGroup', init: null },
    tabRoster: { sec: 'secRoster', init: () => { rosterInput.value = studentList.join('\n'); } }
  };

  Object.keys(tabs).forEach(tabId => {
    document.getElementById(tabId).addEventListener('click', () => {
      Object.keys(tabs).forEach(t => {
        document.getElementById(t).classList.remove('active');
        document.getElementById(tabs[t].sec).classList.remove('active');
      });
      document.getElementById(tabId).classList.add('active');
      document.getElementById(tabs[tabId].sec).classList.add('active');
      if (tabs[tabId].init) tabs[tabId].init();
    });
  });

  // Grouping logic
  const groupModeSelect = document.getElementById('groupModeSelect');
  const groupNumLabel = document.getElementById('groupNumLabel');
  const groupNumInput = document.getElementById('groupNumInput');
  const btnGenerateGroups = document.getElementById('btnGenerateGroups');
  const groupsDisplayArea = document.getElementById('groupsDisplayArea');

  groupModeSelect.addEventListener('change', () => {
    if (groupModeSelect.value === 'byTeams') {
      groupNumLabel.textContent = '分組總個數：';
      groupNumInput.value = 6;
    } else {
      groupNumLabel.textContent = '每組人數：';
      groupNumInput.value = 5;
    }
  });

  btnGenerateGroups.addEventListener('click', () => {
    const list = [...studentList];
    // Fisher-Yates shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }

    const val = parseInt(groupNumInput.value, 10) || 4;
    let groups = [];

    if (groupModeSelect.value === 'byTeams') {
      const numTeams = Math.max(1, val);
      groups = Array.from({ length: numTeams }, () => []);
      list.forEach((name, idx) => {
        groups[idx % numTeams].push(name);
      });
    } else {
      const teamSize = Math.max(1, val);
      for (let i = 0; i < list.length; i += teamSize) {
        groups.push(list.slice(i, i + teamSize));
      }
    }

    // Render groups
    groupsDisplayArea.innerHTML = '';
    groups.forEach((team, idx) => {
      const box = document.createElement('div');
      box.className = 'group-box';
      box.innerHTML = `
        <div class="group-title">第 ${idx + 1} 組 (${team.length} 人)</div>
        <ul class="group-members">
          ${team.map(m => `<li>${m}</li>`).join('')}
        </ul>
      `;
      groupsDisplayArea.appendChild(box);
    });
  });

  // Roster Management
  btnSaveRoster.addEventListener('click', () => {
    const text = rosterInput.value.trim();
    const newList = text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (newList.length === 0) {
      alert('請至少輸入一位學生！');
      return;
    }
    saveRoster(newList);
    alert(`✅ 已成功儲存 ${newList.length} 位學生名單！`);
  });

  btnLoadPreset30.addEventListener('click', () => {
    rosterInput.value = defaultRoster.join('\n');
  });

  drawWheel();
});
