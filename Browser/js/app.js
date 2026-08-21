/**
 * Coffee Browser Main Application Bootstrap, Native Window IPC & Shortcuts
 */

// Native Electron Window Bridge
let ipcRenderer = null;
try {
  if (typeof require !== 'undefined') {
    const electron = require('electron');
    ipcRenderer = electron.ipcRenderer;
  }
} catch(e) {}

window.CoffeeApp = {
  minimizeWindow: () => {
    if (ipcRenderer) {
      ipcRenderer.send('window-minimize');
    }
  },
  maximizeWindow: () => {
    if (ipcRenderer) {
      ipcRenderer.send('window-maximize');
    }
  },
  closeWindow: () => {
    if (ipcRenderer) {
      ipcRenderer.send('window-close');
    } else {
      window.close();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Apply saved roast theme
  document.documentElement.dataset.roast = window.BrowserState.roast;

  // Apply internationalization translations
  if (window.CoffeeI18n) {
    window.CoffeeI18n.applyStaticTranslations();
  }

  // Double click titlebar to maximize / unmaximize
  const titlebar = document.querySelector('.titlebar-and-tabs');
  if (titlebar) {
    titlebar.addEventListener('dblclick', (e) => {
      // Ignore double-clicks on tabs, buttons, brand-pill
      if (e.target.closest('.browser-tab') || e.target.closest('button') || e.target.closest('.brand-pill')) {
        return;
      }
      window.CoffeeApp.maximizeWindow();
    });
  }

  // Initialize Telemetry Engine & Loops
  pollLatency();
  pollMemory();
  setInterval(pollLatency, 3000);
  setInterval(pollMemory, 1500);

  // Initialize Clock & Telemetry UI Loop
  setInterval(updateLiveTelemetry, 1000);
  updateLiveTelemetry();

  // Online / Offline event listeners for instant UI update
  window.addEventListener('online', () => {
    pollLatency();
    updateLiveTelemetry();
  });
  window.addEventListener('offline', () => {
    currentLatencyMs = -1;
    updateLiveTelemetry();
  });

  // Bind Global Keyboard Shortcuts
  document.addEventListener('keydown', handleKeyShortcuts);

  // Mouse Extra Buttons (Mouse 4 = Back / Mouse 5 = Forward)
  window.addEventListener('mouseup', (e) => {
    if (e.button === 3) {
      e.preventDefault();
      if (window.CoffeeOmnibox) window.CoffeeOmnibox.goBack();
    } else if (e.button === 4) {
      e.preventDefault();
      if (window.CoffeeOmnibox) window.CoffeeOmnibox.goForward();
    }
  });

  window.addEventListener('auxclick', (e) => {
    if (e.button === 3 || e.button === 4) {
      e.preventDefault();
    }
  });

  // New Tab Button Event
  const newTabBtn = document.getElementById('new-tab-btn');
  if (newTabBtn) {
    newTabBtn.addEventListener('click', () => {
      window.CoffeeTabs.createTab('cafe://newtab');
    });
  }

  // Initialize Bookmarks Manager
  if (typeof CoffeeBookmarksManager !== 'undefined') {
    window.CoffeeBookmarks = new CoffeeBookmarksManager();
  }

  // Check for crashed session to offer 10s restore popup
  setTimeout(checkForCrashedSession, 600);

  // Initial Welcome Toast
  setTimeout(() => {
    showToastNotification("Coffee Browser pronto com Proteção Ativa.");
  }, 400);
});

let restorePopupTimer = null;

function checkForCrashedSession() {
  try {
    const wasActive = localStorage.getItem('coffee_session_active');
    const savedTabsRaw = localStorage.getItem('coffee_last_session_tabs');

    // Mark current session as active
    localStorage.setItem('coffee_session_active', 'true');

    if (wasActive === 'true' && savedTabsRaw) {
      const savedTabs = JSON.parse(savedTabsRaw);
      if (Array.isArray(savedTabs) && savedTabs.length > 0) {
        showRestorePopup();
      }
    }
  } catch(e) {}
}

function showRestorePopup() {
  const popup = document.getElementById('session-restore-popup');
  if (!popup) return;

  clearTimeout(restorePopupTimer);
  popup.style.display = 'flex';
  popup.classList.remove('slide-out');
  popup.classList.add('slide-in');

  // Auto dismiss after 10 seconds with slideOutRight animation
  restorePopupTimer = setTimeout(() => {
    dismissRestorePopup();
  }, 10000);
}

function dismissRestorePopup() {
  const popup = document.getElementById('session-restore-popup');
  if (!popup) return;

  clearTimeout(restorePopupTimer);
  popup.classList.remove('slide-in');
  popup.classList.add('slide-out');

  setTimeout(() => {
    popup.style.display = 'none';
    popup.classList.remove('slide-out');
  }, 350);
}

function restorePreviousSession() {
  try {
    const savedTabsRaw = localStorage.getItem('coffee_last_session_tabs');
    if (savedTabsRaw && window.CoffeeTabs && window.BrowserState) {
      const savedTabs = JSON.parse(savedTabsRaw);
      if (Array.isArray(savedTabs) && savedTabs.length > 0) {
        // Clear current tabs and recreate saved tabs
        window.BrowserState.tabs = [];
        document.querySelectorAll('.tab-content-view').forEach(v => v.remove());

        savedTabs.forEach((t) => {
          const newTab = window.CoffeeTabs.createTab(t.url || 'cafe://newtab', t.isPrivate || false);
          if (t.title) newTab.title = t.title;
          if (t.iconType) newTab.iconType = t.iconType;
          if (t.zoomFactor) newTab.zoomFactor = t.zoomFactor;
        });

        const firstTab = window.BrowserState.tabs[0];
        if (firstTab) {
          window.CoffeeTabs.switchTab(firstTab.id);
        }
      }
    }
  } catch(e) {
    console.error('Error restoring session:', e);
  }
  dismissRestorePopup();
}

window.restorePreviousSession = restorePreviousSession;
window.dismissRestorePopup = dismissRestorePopup;

// Clean shutdown flag on normal close
window.addEventListener('beforeunload', () => {
  localStorage.setItem('coffee_session_active', 'false');
});

function handleKeyShortcuts(e) {
  // Back Navigation: Alt + Left or dedicated BrowserBack key
  if ((e.altKey && e.key === 'ArrowLeft') || e.key === 'BrowserBack') {
    e.preventDefault();
    if (window.CoffeeOmnibox) window.CoffeeOmnibox.goBack();
  }
  // Forward Navigation: Alt + Right or dedicated BrowserForward key
  else if ((e.altKey && e.key === 'ArrowRight') || e.key === 'BrowserForward') {
    e.preventDefault();
    if (window.CoffeeOmnibox) window.CoffeeOmnibox.goForward();
  }
  // Ctrl + T: New Tab
  else if (e.ctrlKey && e.key.toLowerCase() === 't') {
    e.preventDefault();
    window.CoffeeTabs.createTab('cafe://newtab');
  }
  // Ctrl + W: Close Active Tab
  else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
    e.preventDefault();
    window.CoffeeTabs.closeTab(window.BrowserState.activeTabId);
  }
  // Ctrl + L or Ctrl + K: Focus Omnibox
  else if ((e.ctrlKey && e.key.toLowerCase() === 'l') || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
    e.preventDefault();
    const omni = document.getElementById('omnibox-input');
    if (omni) {
      omni.focus();
      omni.select();
    }
  }
  // Ctrl + Shift + N: Private Tab
  else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    window.CoffeeTabs.createTab('cafe://newtab', true);
    showToastNotification("Aba Privada iniciada.");
  }
  // Ctrl + H: History
  else if (e.ctrlKey && e.key.toLowerCase() === 'h') {
    e.preventDefault();
    window.CoffeeTabs.navigateActiveTab('cafe://history');
  }
  // Ctrl + , : Open Settings in new tab
  else if (e.ctrlKey && e.key === ',') {
    e.preventDefault();
    if (window.CoffeeTabs) window.CoffeeTabs.openSettings();
  }
  // Ctrl + B: Toggle Bookmarks Bar
  else if (e.ctrlKey && e.key.toLowerCase() === 'b') {
    e.preventDefault();
    const bar = document.getElementById('bookmarks-bar');
    if (bar) {
      const isHidden = bar.style.display === 'none';
      bar.style.display = isHidden ? 'flex' : 'none';
      window.BrowserState.showBookmarksBar = isHidden;
      window.BrowserState.saveState();
    }
  }
  // Ctrl + R or F5: Refresh
  else if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F5') {
    e.preventDefault();
    window.CoffeeOmnibox.refreshOrStop();
  }
  // Ctrl + 0: Reset Zoom Level to 100%
  else if (e.ctrlKey && (e.key === '0' || e.code === 'Numpad0')) {
    e.preventDefault();
    if (window.CoffeeTabs) window.CoffeeTabs.resetZoom();
  }
  // Ctrl + Plus / Ctrl + =: Zoom In
  else if (e.ctrlKey && (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd')) {
    e.preventDefault();
    if (window.CoffeeTabs) window.CoffeeTabs.zoomIn();
  }
  // Ctrl + Minus / Ctrl + -: Zoom Out
  else if (e.ctrlKey && (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract')) {
    e.preventDefault();
    if (window.CoffeeTabs) window.CoffeeTabs.zoomOut();
  }
}

// ==========================================
// Real-time Telemetry Engine (Latency & Memory)
// ==========================================
let currentLatencyMs = null;
let currentMemoryKB = null;
let isLatencyProbeRunning = false;
let isMemoryProbeRunning = false;

/**
 * Measure real network roundtrip latency (ping) via TCP socket or HTTP probe
 */
async function measureNetworkLatency() {
  if (!navigator.onLine) {
    return -1;
  }

  // 1. Primary probe: Node.js TCP socket connect (Zero overhead, accurate ICMP/RTT equivalent)
  try {
    if (typeof require !== 'undefined') {
      const net = require('net');
      if (net && typeof net.Socket === 'function') {
        const pingResult = await new Promise((resolve) => {
          const start = performance.now();
          const socket = new net.Socket();
          let finished = false;

          const finish = (val) => {
            if (finished) return;
            finished = true;
            try { socket.destroy(); } catch(e) {}
            resolve(val);
          };

          socket.setTimeout(2500);

          socket.connect(53, '1.1.1.1', () => {
            const rtt = Math.round(performance.now() - start);
            finish(rtt);
          });

          socket.on('error', () => {
            finish(-2);
          });

          socket.on('timeout', () => {
            finish(-1);
          });
        });

        if (pingResult >= 0) {
          return pingResult;
        }
      }
    }
  } catch(e) {}

  // 2. Fallback probe: HTTP/HTTPS probe with anti-cache timestamp
  try {
    const start = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    await fetch(`https://1.1.1.1/cdn-cgi/trace?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      mode: 'no-cors',
      signal: controller.signal
    });
    clearTimeout(timer);
    return Math.round(performance.now() - start);
  } catch(e) {
    try {
      const start2 = performance.now();
      const controller2 = new AbortController();
      const timer2 = setTimeout(() => controller2.abort(), 2500);

      await fetch(`https://www.google.com/generate_204?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors',
        signal: controller2.signal
      });
      clearTimeout(timer2);
      return Math.round(performance.now() - start2);
    } catch(err2) {
      return -1; // Unreachable / Offline
    }
  }
}

/**
 * Fetch total real RAM memory from Electron main process or Node/browser APIs
 */
async function fetchRealMemoryKB() {
  // 1. Electron IPC: Total of all app processes (Main + Tabs/WebViews + GPU + Utilities)
  if (ipcRenderer && typeof ipcRenderer.invoke === 'function') {
    try {
      const data = await ipcRenderer.invoke('get-system-memory');
      if (data && typeof data.workingSetKB === 'number' && data.workingSetKB > 0) {
        return data.workingSetKB;
      }
    } catch(e) {}
  }

  // 2. Node.js process RSS memory fallback
  try {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      if (mem && mem.rss) {
        return Math.round(mem.rss / 1024);
      }
    }
  } catch(e) {}

  // 3. Performance API fallback
  try {
    if (window.performance && window.performance.memory && window.performance.memory.usedJSHeapSize) {
      return Math.round(window.performance.memory.usedJSHeapSize / 1024);
    }
  } catch(e) {}

  return null;
}

/**
 * Periodic latency measurement polling
 */
async function pollLatency() {
  if (isLatencyProbeRunning) return;
  isLatencyProbeRunning = true;
  try {
    const lat = await measureNetworkLatency();
    currentLatencyMs = lat;
  } catch(e) {
    currentLatencyMs = -1;
  } finally {
    isLatencyProbeRunning = false;
  }
}

/**
 * Periodic memory measurement polling
 */
async function pollMemory() {
  if (isMemoryProbeRunning) return;
  isMemoryProbeRunning = true;
  try {
    const mem = await fetchRealMemoryKB();
    if (mem !== null) {
      currentMemoryKB = mem;
    }
  } catch(e) {
  } finally {
    isMemoryProbeRunning = false;
  }
}

function updateLiveTelemetry() {
  const now = new Date();
  const effLang = window.BrowserState ? window.BrowserState.getEffectiveLanguage() : 'pt-BR';
  const timeStr = now.toLocaleTimeString(effLang, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // 1. Time / Clock
  const statusTime = document.getElementById('status-time');
  if (statusTime) statusTime.textContent = timeStr;

  const ntClock = document.getElementById('nt-clock');
  if (ntClock) {
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    ntClock.textContent = `${hours}:${minutes}`;
  }

  // 2. Roast theme level
  const statusRoastText = document.getElementById('status-roast-text');
  if (statusRoastText && window.BrowserState && window.CoffeeI18n) {
    statusRoastText.textContent = window.CoffeeI18n.t(`roast_${window.BrowserState.roast || 'medio'}`);
  }

  // 3. Online / Offline & Latency Status
  const statusOnlineDot = document.getElementById('status-online-dot');
  const statusOnlineText = document.getElementById('status-online-text');
  const statusLatencyValue = document.getElementById('status-latency-value');

  const isOnline = navigator.onLine && (currentLatencyMs === null || currentLatencyMs >= 0);

  if (statusOnlineDot) {
    if (isOnline) {
      statusOnlineDot.style.background = 'var(--green)';
      statusOnlineDot.style.boxShadow = '0 0 6px var(--green)';
    } else {
      statusOnlineDot.style.background = '#E57373';
      statusOnlineDot.style.boxShadow = '0 0 6px #E57373';
    }
  }

  if (statusOnlineText && window.CoffeeI18n) {
    statusOnlineText.textContent = isOnline 
      ? (window.CoffeeI18n.t('status_online') || 'ONLINE')
      : (window.CoffeeI18n.t('status_offline') || 'OFFLINE');
  }

  if (statusLatencyValue) {
    if (currentLatencyMs !== null && currentLatencyMs >= 0) {
      statusLatencyValue.textContent = `${currentLatencyMs}ms`;
      if (currentLatencyMs <= 45) {
        statusLatencyValue.style.color = 'var(--green)';
      } else if (currentLatencyMs <= 120) {
        statusLatencyValue.style.color = 'var(--caramel-light)';
      } else {
        statusLatencyValue.style.color = '#E57373';
      }
    } else if (currentLatencyMs === -1 || !navigator.onLine) {
      statusLatencyValue.textContent = '--';
      statusLatencyValue.style.color = 'var(--mut)';
    } else {
      statusLatencyValue.textContent = '...';
      statusLatencyValue.style.color = 'var(--mut)';
    }
  }

  // 4. Real Memory RAM Status
  const statusMemoryValue = document.getElementById('status-memory-value');
  if (statusMemoryValue && currentMemoryKB !== null && currentMemoryKB > 0) {
    const totalMB = currentMemoryKB / 1024;
    let formattedMemory = '';
    if (totalMB < 1024) {
      formattedMemory = `${totalMB.toFixed(1)} MB`;
    } else {
      const totalGB = totalMB / 1024;
      formattedMemory = `${totalGB.toFixed(2)} GB`;
    }
    statusMemoryValue.textContent = formattedMemory;

    // Dynamic color coding based on RAM utilization
    if (totalMB < 600) {
      statusMemoryValue.style.color = 'var(--t2)';
    } else if (totalMB < 1400) {
      statusMemoryValue.style.color = 'var(--caramel-light)';
    } else {
      statusMemoryValue.style.color = '#E57373';
    }
  } else if (statusMemoryValue && currentMemoryKB === null) {
    statusMemoryValue.textContent = '...';
    statusMemoryValue.style.color = 'var(--mut)';
  }

  // 5. Coador Shields Status
  const statusShieldsText = document.getElementById('status-shields-text');
  if (statusShieldsText && window.CoffeeI18n) {
    const isPaused = window.CoffeeShields ? window.CoffeeShields.isPausedGlobal : false;
    if (isPaused) {
      statusShieldsText.textContent = window.CoffeeI18n.t('status_paused') || 'PAUSADOS';
      statusShieldsText.style.color = '#E57373';
    } else {
      statusShieldsText.textContent = window.CoffeeI18n.t('status_active') || 'ATIVOS';
      statusShieldsText.style.color = 'var(--green)';
    }
  }
}

function showToastNotification(message) {
  // Toast notifications disabled by user request
}

window.showToastNotification = showToastNotification;

window.CoffeeStateHelpers = {
  clearHistory: () => {
    window.BrowserState.history = [];
    window.BrowserState.saveState();
    window.CoffeeTabs.navigateActiveTab('cafe://history');
    showToastNotification("Histórico de navegação excluído.");
  }
};
