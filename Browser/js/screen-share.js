/**
 * Coffee Browser — Native Screen & Window Share Picker Modal Engine
 */

(function() {
  let currentRequestId = null;
  let allSources = [];
  let currentTab = 'screens'; // 'screens' | 'windows'
  let selectedSourceId = null;
  let ipc = null;

  function getRendererIpc() {
    if (ipc) return ipc;
    try {
      if (typeof require !== 'undefined') {
        const electron = require('electron');
        ipc = electron.ipcRenderer;
      } else if (window.electron && window.electron.ipcRenderer) {
        ipc = window.electron.ipcRenderer;
      }
    } catch(e) {}
    return ipc;
  }

  function initScreenShareUI() {
    const overlay = document.getElementById('screen-share-modal-overlay');
    const tabScreens = document.getElementById('tab-btn-screens');
    const tabWindows = document.getElementById('tab-btn-windows');
    const cancelBtn = document.getElementById('screen-share-cancel-btn');
    const confirmBtn = document.getElementById('screen-share-confirm-btn');
    const closeBtn = document.getElementById('screen-share-close-btn');
    const audioCheckbox = document.getElementById('screen-share-audio-checkbox');

    if (!overlay) return;

    if (tabScreens) {
      tabScreens.addEventListener('click', () => switchTab('screens'));
    }
    if (tabWindows) {
      tabWindows.addEventListener('click', () => switchTab('windows'));
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => cancelSelection());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => cancelSelection());
    }
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => confirmSelection());
    }

    // Keyboard support: Escape cancels, Enter confirms
    window.addEventListener('keydown', (e) => {
      if (overlay.style.display !== 'none' && overlay.style.display !== '') {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelSelection();
        } else if (e.key === 'Enter' && selectedSourceId) {
          e.preventDefault();
          confirmSelection();
        }
      }
    });

    const ipcRenderer = getRendererIpc();
    if (ipcRenderer && typeof ipcRenderer.on === 'function') {
      ipcRenderer.on('open-screen-share-picker', (event, data) => {
        if (!data || !data.requestId) return;
        openModal(data);
      });
    }
  }

  function openModal(data) {
    currentRequestId = data.requestId;
    allSources = data.sources || [];
    selectedSourceId = null;

    const overlay = document.getElementById('screen-share-modal-overlay');
    const subtitle = document.getElementById('screen-share-subtitle');
    const screensCount = document.getElementById('screen-share-screens-count');
    const windowsCount = document.getElementById('screen-share-windows-count');
    const audioCheckbox = document.getElementById('screen-share-audio-checkbox');
    const confirmBtn = document.getElementById('screen-share-confirm-btn');

    if (!overlay) return;

    // Filter counts
    const screens = allSources.filter(s => s.isScreen);
    const windows = allSources.filter(s => !s.isScreen);

    if (screensCount) screensCount.textContent = screens.length;
    if (windowsCount) windowsCount.textContent = windows.length;

    // Default to 'screens' if available, otherwise 'windows'
    if (screens.length > 0) {
      currentTab = 'screens';
    } else {
      currentTab = 'windows';
    }

    // Origin hint
    if (subtitle) {
      if (data.origin) {
        subtitle.textContent = `${data.origin} deseja compartilhar a sua tela.`;
      } else {
        subtitle.textContent = 'Escolha uma tela ou janela para compartilhar.';
      }
    }

    if (audioCheckbox) {
      audioCheckbox.checked = !!data.audioRequested || true;
    }

    if (confirmBtn) {
      confirmBtn.disabled = true;
    }

    overlay.style.display = 'flex';
    switchTab(currentTab);
  }

  function switchTab(tabName) {
    currentTab = tabName;
    const tabScreens = document.getElementById('tab-btn-screens');
    const tabWindows = document.getElementById('tab-btn-windows');

    if (tabScreens) {
      tabScreens.classList.toggle('active', tabName === 'screens');
    }
    if (tabWindows) {
      tabWindows.classList.toggle('active', tabName === 'windows');
    }

    renderSourcesGrid();
  }

  function renderSourcesGrid() {
    const grid = document.getElementById('screen-share-grid');
    const empty = document.getElementById('screen-share-empty');
    const confirmBtn = document.getElementById('screen-share-confirm-btn');

    if (!grid) return;
    grid.innerHTML = '';

    const list = allSources.filter(s => currentTab === 'screens' ? s.isScreen : !s.isScreen);

    if (list.length === 0) {
      if (empty) empty.style.display = 'flex';
      if (confirmBtn) confirmBtn.disabled = true;
      return;
    }

    if (empty) empty.style.display = 'none';

    // Auto-select first item if current selection not in list
    if (!selectedSourceId || !list.some(s => s.id === selectedSourceId)) {
      selectedSourceId = list[0].id;
    }

    if (confirmBtn) {
      confirmBtn.disabled = !selectedSourceId;
    }

    list.forEach(source => {
      const card = document.createElement('div');
      card.className = `screen-share-card ${source.id === selectedSourceId ? 'selected' : ''}`;
      card.dataset.id = source.id;

      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'screen-share-thumb-wrap';

      if (source.thumbnail) {
        const img = document.createElement('img');
        img.className = 'screen-share-thumb';
        img.src = source.thumbnail;
        img.alt = source.name;
        thumbWrap.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.style.color = 'var(--mut)';
        placeholder.style.fontSize = '12px';
        placeholder.textContent = 'Sem Prévia';
        thumbWrap.appendChild(placeholder);
      }

      const meta = document.createElement('div');
      meta.className = 'screen-share-card-meta';

      if (source.appIcon) {
        const appIcon = document.createElement('img');
        appIcon.className = 'screen-share-card-icon';
        appIcon.src = source.appIcon;
        meta.appendChild(appIcon);
      } else {
        const iconSvg = document.createElement('div');
        iconSvg.className = 'screen-share-card-icon';
        iconSvg.innerHTML = source.isScreen 
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>';
        meta.appendChild(iconSvg);
      }

      const nameSpan = document.createElement('span');
      nameSpan.className = 'screen-share-card-name';
      nameSpan.textContent = source.name || (source.isScreen ? 'Tela' : 'Janela');
      meta.appendChild(nameSpan);

      card.appendChild(thumbWrap);
      card.appendChild(meta);

      // Click to select
      card.addEventListener('click', () => {
        selectedSourceId = source.id;
        document.querySelectorAll('.screen-share-card').forEach(c => {
          c.classList.toggle('selected', c.dataset.id === source.id);
        });
        if (confirmBtn) confirmBtn.disabled = false;
      });

      // Double click to instantly share
      card.addEventListener('dblclick', () => {
        selectedSourceId = source.id;
        confirmSelection();
      });

      grid.appendChild(card);
    });
  }

  function confirmSelection() {
    if (!selectedSourceId || !currentRequestId) return;
    const overlay = document.getElementById('screen-share-modal-overlay');
    const audioCheckbox = document.getElementById('screen-share-audio-checkbox');
    const wantsAudio = audioCheckbox ? audioCheckbox.checked : true;

    const ipcRenderer = getRendererIpc();
    if (ipcRenderer && typeof ipcRenderer.send === 'function') {
      ipcRenderer.send('screen-share-choice', {
        requestId: currentRequestId,
        sourceId: selectedSourceId,
        audio: wantsAudio,
        canceled: false
      });
    }

    if (overlay) overlay.style.display = 'none';
    currentRequestId = null;
    selectedSourceId = null;
  }

  function cancelSelection() {
    const overlay = document.getElementById('screen-share-modal-overlay');
    if (currentRequestId) {
      const ipcRenderer = getRendererIpc();
      if (ipcRenderer && typeof ipcRenderer.send === 'function') {
        ipcRenderer.send('screen-share-choice', {
          requestId: currentRequestId,
          canceled: true
        });
      }
    }

    if (overlay) overlay.style.display = 'none';
    currentRequestId = null;
    selectedSourceId = null;
  }

  window.CoffeeScreenShare = {
    init: initScreenShareUI,
    open: openModal,
    cancel: cancelSelection,
    confirm: confirmSelection
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScreenShareUI);
  } else {
    initScreenShareUI();
  }
})();
