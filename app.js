// bio-tools Main Lobby JavaScript (大廳三) - V2.0 Categorized Collapsible Logic
document.addEventListener('DOMContentLoaded', () => {
  const LOCAL_STORAGE_COLLAPSE_KEY = 'bio_tools_collapsed_categories';

  // DOM Elements for QR Dispatch
  const selectTool = document.getElementById('selectTool');
  const btnGenerateQR = document.getElementById('btnGenerateQR');
  const btnCopyUrl = document.getElementById('btnCopyUrl');
  const qrResultArea = document.getElementById('qrResultArea');
  const qrcodeContainer = document.getElementById('qrcode');
  const generatedUrlInput = document.getElementById('generatedUrlInput');
  const btnDirectLaunch = document.getElementById('btnDirectLaunch');

  // DOM Elements for Collapsible Categories
  const categorySections = document.querySelectorAll('.category-section');
  const btnExpandAll = document.getElementById('btnExpandAll');
  const btnCollapseAll = document.getElementById('btnCollapseAll');

  let qrInstance = null;

  // --- Collapsible Category Logic ---
  function loadCollapseState() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_COLLAPSE_KEY);
      if (raw) {
        const collapsedState = JSON.parse(raw);
        categorySections.forEach(sec => {
          const catKey = sec.dataset.cat;
          if (collapsedState[catKey] === true) {
            sec.classList.add('collapsed');
            updateHeaderToggleUI(sec);
          }
        });
      }
    } catch (e) {
      console.error('Failed to load collapse state', e);
    }
  }

  function saveCollapseState() {
    const collapsedState = {};
    categorySections.forEach(sec => {
      const catKey = sec.dataset.cat;
      collapsedState[catKey] = sec.classList.contains('collapsed');
    });
    localStorage.setItem(LOCAL_STORAGE_COLLAPSE_KEY, JSON.stringify(collapsedState));
  }

  function updateHeaderToggleUI(sec) {
    const textSpan = sec.querySelector('.toggle-text');
    const isCollapsed = sec.classList.contains('collapsed');
    if (textSpan) {
      textSpan.textContent = isCollapsed ? '▼ 點擊展開' : '▲ 折疊收合';
    }
  }

  function toggleSection(sec) {
    sec.classList.toggle('collapsed');
    updateHeaderToggleUI(sec);
    saveCollapseState();
  }

  categorySections.forEach(sec => {
    const header = sec.querySelector('.category-header');
    if (header) {
      header.addEventListener('click', () => toggleSection(sec));
    }
  });

  if (btnExpandAll) {
    btnExpandAll.addEventListener('click', () => {
      categorySections.forEach(sec => {
        sec.classList.remove('collapsed');
        updateHeaderToggleUI(sec);
      });
      saveCollapseState();
    });
  }

  if (btnCollapseAll) {
    btnCollapseAll.addEventListener('click', () => {
      categorySections.forEach(sec => {
        sec.classList.add('collapsed');
        updateHeaderToggleUI(sec);
      });
      saveCollapseState();
    });
  }

  // --- 📱 Smart Dispatcher (Auto Appends ?dispatch=true to hide return buttons) ---
  function getTargetUrl() {
    const relativePath = selectTool.value;
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const separator = relativePath.includes('?') ? '&' : '?';
    return baseUrl + relativePath + separator + 'dispatch=true';
  }

  btnGenerateQR.addEventListener('click', () => {
    const fullUrl = getTargetUrl();
    qrResultArea.classList.remove('hidden');
    generatedUrlInput.value = fullUrl;
    btnDirectLaunch.href = fullUrl;

    qrcodeContainer.innerHTML = '';
    qrInstance = new QRCode(qrcodeContainer, {
      text: fullUrl,
      width: 180,
      height: 180,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  });

  btnCopyUrl.addEventListener('click', () => {
    const fullUrl = getTargetUrl();
    navigator.clipboard.writeText(fullUrl).then(() => {
      alert('✅ 派發網址已成功複製到剪貼簿！');
    }).catch(() => {
      alert('複製失敗，請手動選取複製：\n' + fullUrl);
    });
  });

  // Initialize collapse states from LocalStorage
  loadCollapseState();
});
