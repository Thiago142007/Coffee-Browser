/**
 * Coffee Browser Main Application Bootstrap, Native Window IPC & Shortcuts
 */

// Native Electron Window Bridge
// NOTE: named appIpcRenderer (not plain ipcRenderer) because downloads.js already
// declares a top-level binding with the plain name in this shared renderer realm —
// redeclaring it here would throw SyntaxError and kill this entire file.
let appIpcRenderer = null;

function getIpc() {
  if (appIpcRenderer) return appIpcRenderer;
  try {
    // 1. Preload bridge (always available when preload.js runs)
    if (typeof window !== 'undefined' && window.ipcRenderer && typeof window.ipcRenderer.invoke === 'function') {
      appIpcRenderer = window.ipcRenderer;
    } else if (typeof window !== 'undefined' && window.electron && window.electron.ipcRenderer && typeof window.electron.ipcRenderer.invoke === 'function') {
      appIpcRenderer = window.electron.ipcRenderer;
    } else if (typeof require !== 'undefined') {
      const electron = require('electron');
      appIpcRenderer = electron.ipcRenderer;
    }
  } catch(e) {}
  return appIpcRenderer;
}

/**
 * IPC invoke with a hard timeout so a stalled main-process probe can never
 * block the 1.5s footer refresh cadence. Resolves `null` on timeout/error.
 */
function invokeWithTimeout(ipc, channel, timeoutMs, ...args) {
  if (!ipc || typeof ipc.invoke !== 'function') return Promise.resolve(null);
  return Promise.race([
    ipc.invoke(channel, ...args).catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs))
  ]);
}

let isWindowMaximized = false;

function updateMaximizeButtonUI(maximized) {
  isWindowMaximized = !!maximized;
  const maxBtn = document.getElementById('win-max-btn');
  if (!maxBtn) return;
  const iconMax = maxBtn.querySelector('.icon-max');
  const iconRestore = maxBtn.querySelector('.icon-restore');
  const titleText = isWindowMaximized 
    ? (window.CoffeeI18n ? window.CoffeeI18n.t('restore', 'Restaurar') : 'Restaurar')
    : (window.CoffeeI18n ? window.CoffeeI18n.t('maximize', 'Maximizar') : 'Maximizar');

  maxBtn.title = titleText;
  maxBtn.setAttribute('aria-label', titleText);

  if (iconMax && iconRestore) {
    iconMax.style.display = isWindowMaximized ? 'none' : 'block';
    iconRestore.style.display = isWindowMaximized ? 'block' : 'none';
  }
}

window.CoffeeApp = {
  minimizeWindow: () => {
    try {
      if (window.CoffeeNativeBridge && typeof window.CoffeeNativeBridge.minimize === 'function') {
        window.CoffeeNativeBridge.minimize();
        return;
      }
    } catch(e) {}
    try {
      const ipc = getIpc();
      if (ipc && typeof ipc.send === 'function') {
        ipc.send('window-minimize');
      }
    } catch(e) {}
  },
  maximizeWindow: () => {
    try {
      if (window.CoffeeNativeBridge && typeof window.CoffeeNativeBridge.maximize === 'function') {
        window.CoffeeNativeBridge.maximize();
        return;
      }
    } catch(e) {}
    try {
      const ipc = getIpc();
      if (ipc && typeof ipc.send === 'function') {
        ipc.send('window-maximize');
      }
    } catch(e) {}
  },
  closeWindow: () => {
    try {
      if (window.CoffeeNativeBridge && typeof window.CoffeeNativeBridge.close === 'function') {
        window.CoffeeNativeBridge.close();
        return;
      }
    } catch(e) {}
    try {
      const ipc = getIpc();
      if (ipc && typeof ipc.send === 'function') {
        ipc.send('window-close');
        return;
      }
    } catch(e) {}
    try {
      window.close();
    } catch(e) {}
  }
};

function initCoffeeApp() {
  // Telemetry FIRST: the footer must keep updating even if another init step throws.
  try { startTelemetryLoops(); } catch(e) {}
  try { applyFooterVisibility(); } catch(e) {}

  // Sync Force Dark Mode preference with the main process (pref file wins).
  try {
    const ipc0 = getIpc();
    if (ipc0 && typeof ipc0.invoke === 'function') {
      invokeWithTimeout(ipc0, 'get-force-dark-mode', 1500).then((v) => {
        try {
          // Never clobber a toggle the user already made this session.
          if (window.__coffeeForceDarkDirty) return;
          if (!v || typeof v.enabled !== 'boolean') return;
          const on = v.enabled;
          if (window.BrowserState && window.BrowserState.forceDarkMode !== on) {
            window.BrowserState.forceDarkMode = on;
            window.BrowserState.saveState();
          }
          applyForceDarkToOpenTabs();
        } catch(e) {}
      });
    }
  } catch(e) {}

  // Sync Hardware Acceleration preference with the main process (pref file wins).
  try {
    const ipc0b = getIpc();
    if (ipc0b && typeof ipc0b.invoke === 'function') {
      invokeWithTimeout(ipc0b, 'get-hardware-acceleration', 1500).then((v) => {
        try {
          if (window.__coffeeHwAccelDirty) return;
          if (!v || typeof v.enabled !== 'boolean') return;
          if (window.BrowserState && window.BrowserState.hardwareAcceleration !== v.enabled) {
            window.BrowserState.hardwareAcceleration = v.enabled;
            window.BrowserState.saveState();
          }
        } catch(e) {}
      });
    }
  } catch(e) {}

  // Bind Window Controls (Minimize, Maximize, Close) with clean single-click handlers
  const minBtn = document.getElementById('win-min-btn');
  const maxBtn = document.getElementById('win-max-btn');
  const closeBtn = document.getElementById('win-close-btn');

  if (minBtn) {
    minBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.CoffeeApp.minimizeWindow();
    };
  }
  if (maxBtn) {
    maxBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.CoffeeApp.maximizeWindow();
    };
  }
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.CoffeeApp.closeWindow();
    };
  }

  // Sincroniza estado de maximização da janela via IPC
  const ipc = getIpc();
  if (ipc) {
    if (typeof ipc.on === 'function') {
      ipc.on('window-state-changed', (event, data) => {
        if (data && typeof data.isMaximized === 'boolean') {
          updateMaximizeButtonUI(data.isMaximized);
        }
      });
    }
    if (typeof ipc.invoke === 'function') {
      ipc.invoke('is-window-maximized').then((isMax) => {
        updateMaximizeButtonUI(isMax);
      }).catch(() => {});
    }
  }

  // Apply saved roast theme
  if (window.BrowserState && window.BrowserState.roast) {
    document.documentElement.dataset.roast = window.BrowserState.roast;
  }

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

  // Telemetry loops already started at the top of init (1.5s cadence, idempotent).

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
      if (window.CoffeeTabs) {
        window.CoffeeTabs.createTab('cafe://newtab');
      }
    });
  }

  // Initialize Bookmarks Manager
  if (typeof CoffeeBookmarksManager !== 'undefined' && !window.CoffeeBookmarks) {
    window.CoffeeBookmarks = new CoffeeBookmarksManager();
  }

  // Check previous session to offer the Brave-style reopen popup (top-right)
  setTimeout(checkForPreviousSession, 600);

  // Initial Welcome Toast
  setTimeout(() => {
    showToastNotification("Coffee Browser pronto com Proteção Ativa.");
  }, 400);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCoffeeApp);
} else {
  initCoffeeApp();
}

let restorePopupTimer = null;
let restorePopupMode = 'reopen'; // 'crash' | 'reopen'

/**
 * Tabs worth offering to reopen: skips private tabs and trivial blank pages.
 */
function getRestorableTabs() {
  try {
    const raw = localStorage.getItem('coffee_last_session_tabs');
    if (!raw) return [];
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];
    return saved.filter((t) => {
      if (!t || t.isPrivate) return false;
      const url = (t.url || '').trim().toLowerCase();
      if (!url || url === 'cafe://newtab' || url === 'about:blank') return false;
      return true;
    });
  } catch(e) { return []; }
}

function checkForPreviousSession() {
  try {
    const wasActive = localStorage.getItem('coffee_session_active');

    // Mark current session as active
    localStorage.setItem('coffee_session_active', 'true');

    const restorable = getRestorableTabs();
    if (restorable.length === 0) {
      try { localStorage.setItem('coffee_last_popup_decision', 'skipped:empty'); } catch(e) {}
      return;
    }

    // "Continue where you left off" restores silently — no need to ask.
    if (window.BrowserState && window.BrowserState.startupBehavior === 'continue') {
      try { localStorage.setItem('coffee_last_popup_decision', 'skipped:continue-auto'); } catch(e) {}
      restorePreviousSession();
      return;
    }

    try { localStorage.setItem('coffee_last_popup_decision', 'shown:' + (wasActive === 'true' ? 'crash' : 'reopen')); } catch(e) {}
    showRestorePopup(wasActive === 'true' ? 'crash' : 'reopen');
  } catch(e) {}
}

function showRestorePopup(mode) {
  const popup = document.getElementById('session-restore-popup');
  if (!popup) return;
  restorePopupMode = (mode === 'crash') ? 'crash' : 'reopen';

  // Mode-specific, fully translated copy (Brave-style reopen vs crash recovery)
  try {
    const t = (k, fb) => (window.CoffeeI18n ? window.CoffeeI18n.t(k, fb) : (fb || k));
    const titleEl = popup.querySelector('.restore-popup-title');
    const textEl = popup.querySelector('.restore-popup-text');
    const btnEl = document.getElementById('restore-session-btn');
    if (restorePopupMode === 'crash') {
      if (titleEl) titleEl.textContent = t('restore_title', 'Aviso de Recuperação');
      if (textEl) textEl.textContent = t('restore_desc', 'Suas abas foram fechadas de forma inesperada!');
      if (btnEl) btnEl.textContent = t('restore_btn', 'Restaurar');
    } else {
      if (titleEl) titleEl.textContent = t('reopen_title', 'Restaurar abas?');
      if (textEl) textEl.textContent = t('reopen_desc', 'Gostaria de voltar às abas que estavam abertas?');
      if (btnEl) btnEl.textContent = t('reopen_btn', 'Reabrir');
    }
  } catch(e) {}

  // Pin below the top toolbar (under the Settings gear), whatever its height is.
  try {
    const header = document.querySelector('.browser-header');
    if (header && header.offsetHeight > 0) {
      popup.style.top = (header.offsetHeight + 12) + 'px';
      popup.style.bottom = 'auto';
    }
  } catch(e) {}

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
    const restorable = getRestorableTabs();
    if (restorable.length > 0 && window.CoffeeTabs && window.BrowserState) {
      // Clear current tabs and recreate saved tabs (private tabs are never restored)
      window.BrowserState.tabs = [];
      document.querySelectorAll('.tab-content-view').forEach(v => v.remove());

      restorable.forEach((t) => {
        const newTab = window.CoffeeTabs.createTab(t.url || 'cafe://newtab', false);
        if (t.title) newTab.title = t.title;
        if (t.iconType) newTab.iconType = t.iconType;
        if (t.zoomFactor) newTab.zoomFactor = t.zoomFactor;
      });

      const firstTab = window.BrowserState.tabs[0];
      if (firstTab) {
        window.CoffeeTabs.switchTab(firstTab.id);
      }
      if (typeof window.CoffeeTabs.saveSessionSnapshot === 'function') {
        window.CoffeeTabs.saveSessionSnapshot();
      }
    }
  } catch(e) {
    console.error('Error restoring session:', e);
  }
  dismissRestorePopup();
}

window.restorePreviousSession = restorePreviousSession;
window.dismissRestorePopup = dismissRestorePopup;

// Persist the tab snapshot on close so the reopen popup always has fresh data
window.addEventListener('beforeunload', () => {
  try {
    if (window.CoffeeTabs && typeof window.CoffeeTabs.saveSessionSnapshot === 'function') {
      window.CoffeeTabs.saveSessionSnapshot();
    }
  } catch(e) {}
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
 * Measure real network roundtrip latency (ping) via IPC socket, renderer socket, or HTTP probe
 */
async function measureNetworkLatency() {
  if (!navigator.onLine) {
    return -1;
  }

  // 1. Primary probe: Electron main process ultra-fast native socket ping
  const ipc = getIpc();
  if (ipc && typeof ipc.invoke === 'function') {
    try {
      const res = await invokeWithTimeout(ipc, 'get-network-latency', 1300);
      if (res && typeof res.latencyMs === 'number' && res.latencyMs >= 0) {
        return res.latencyMs;
      }
    } catch(e) {}
  }

  // 2. Secondary probe: Renderer Node.js TCP socket connect (Zero overhead, accurate ICMP/RTT equivalent)
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

          socket.setTimeout(1200);

          socket.connect(80, '1.1.1.1', () => {
            const rtt = Math.max(1, Math.round(performance.now() - start));
            finish(rtt);
          });

          socket.on('error', () => {
            finish(-1);
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

  // 3. Fallback probe: HTTP/HTTPS probe with anti-cache timestamp
  try {
    const start = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);

    await fetch(`https://1.1.1.1/cdn-cgi/trace?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      mode: 'no-cors',
      signal: controller.signal
    });
    clearTimeout(timer);
    return Math.max(1, Math.round(performance.now() - start));
  } catch(e) {
    try {
      const start2 = performance.now();
      const controller2 = new AbortController();
      const timer2 = setTimeout(() => controller2.abort(), 1200);

      await fetch(`https://www.google.com/generate_204?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors',
        signal: controller2.signal
      });
      clearTimeout(timer2);
      return Math.max(1, Math.round(performance.now() - start2));
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
  const ipc = getIpc();
  if (ipc && typeof ipc.invoke === 'function') {
    try {
      const data = await invokeWithTimeout(ipc, 'get-system-memory', 1000);
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

  // 4. Tab count baseline estimation for browser preview
  const tabCount = (window.BrowserState && Array.isArray(window.BrowserState.tabs)) ? window.BrowserState.tabs.length : 1;
  return Math.round((120 + tabCount * 35) * 1024);
}

// Footer telemetry refresh cadence (latency + memory)
const TELEMETRY_INTERVAL_MS = 1500;
let telemetryLoopsStarted = false;

/**
 * Starts the footer telemetry loops. Idempotent and exception-proof: every
 * callback is individually guarded so a failure can never freeze the footer.
 */
function startTelemetryLoops() {
  if (telemetryLoopsStarted) return;
  telemetryLoopsStarted = true;
  const safe = (fn) => { try { fn(); } catch(e) {} };
  safe(pollLatency);
  safe(pollMemory);
  safe(updateLiveTelemetry);
  setInterval(() => safe(pollLatency), TELEMETRY_INTERVAL_MS);
  setInterval(() => safe(pollMemory), TELEMETRY_INTERVAL_MS);
  setInterval(() => safe(updateLiveTelemetry), 1000);
}

/**
 * Shows/hides the Latency and Memory footer items per user settings.
 */
function applyFooterVisibility() {
  try {
    const showLat = !window.BrowserState || window.BrowserState.showFooterLatency !== false;
    const showMem = !window.BrowserState || window.BrowserState.showFooterMemory !== false;
    const latItem = document.getElementById('status-latency-item');
    if (latItem) latItem.style.display = showLat ? '' : 'none';
    const memItem = document.getElementById('status-memory-item');
    if (memItem) memItem.style.display = showMem ? '' : 'none';
  } catch(e) {}
}

/**
 * Persists the footer visibility preference and refreshes the footer immediately.
 * @param {'latency'|'memory'} which
 * @param {boolean} visible
 */
function setFooterVisibility(which, visible) {
  try {
    if (window.BrowserState) {
      if (which === 'latency') window.BrowserState.showFooterLatency = !!visible;
      else if (which === 'memory') window.BrowserState.showFooterMemory = !!visible;
      window.BrowserState.saveState();
    }
  } catch(e) {}
  applyFooterVisibility();
  try {
    if (visible && which === 'latency') pollLatency();
    if (visible && which === 'memory') pollMemory();
    updateLiveTelemetry();
  } catch(e) {}
}

// Expose footer/telemetry controls on the existing CoffeeApp bridge
try {
  window.CoffeeApp.applyFooterVisibility = applyFooterVisibility;
  window.CoffeeApp.setFooterVisibility = setFooterVisibility;
  window.CoffeeApp.refreshTelemetry = () => {
    try { pollLatency(); } catch(e) {}
    try { pollMemory(); } catch(e) {}
    try { updateLiveTelemetry(); } catch(e) {}
  };
} catch(e) {}

// ==========================================
// Force Dark Mode on pages (Settings > Appearance, default OFF)
// ==========================================
function buildForceDarkSnippet(enabled) {
  const on = enabled ? 'true' : 'false';
  return `(function(){try{var on=${on};var s=document.getElementById('__coffee_darkmode_engine');`
    + `if(on){if(!s){var st=document.createElement('style');st.id='__coffee_darkmode_engine';`
    + `st.textContent=':root,html{color-scheme:dark !important}';(document.head||document.documentElement).appendChild(st);}`
    + `if(!document.querySelector('meta[name="color-scheme"][data-coffee-dm]')){var m=document.createElement('meta');`
    + `m.name='color-scheme';m.content='dark';m.setAttribute('data-coffee-dm','1');`
    + `(document.head||document.documentElement).appendChild(m);}}`
    + `else{if(s)s.remove();var om=document.querySelector('meta[name="color-scheme"][data-coffee-dm]');if(om)om.remove();}}catch(e){}})();`;
}

/**
 * Applies/removes the page darkening on every already-open tab webview instantly.
 * (Fresh navigations are handled by the tabs.js injection; full compositor-level
 * forcing applies on next launch — see the relaunch hint in Settings.)
 */
function applyForceDarkToOpenTabs() {
  try {
    const on = !!(window.BrowserState && window.BrowserState.forceDarkMode);
    const snippet = buildForceDarkSnippet(on);
    const views = document.querySelectorAll('webview.tab-webview');
    views.forEach((wv) => {
      try {
        if (wv && typeof wv.executeJavaScript === 'function') {
          const r = wv.executeJavaScript(snippet);
          if (r && typeof r.catch === 'function') r.catch(() => {});
        }
      } catch(e) {}
    });
  } catch(e) {}
}

/**
 * Persists the Force Dark Mode preference, notifies the main process
 * (instant nativeTheme effect), updates open tabs and flags the relaunch hint.
 */
async function setForceDarkMode(enabled) {
  const on = !!enabled;
  try {
    if (window.BrowserState) {
      window.BrowserState.forceDarkMode = on;
      window.BrowserState.saveState();
    }
  } catch(e) {}
  try {
    const ipc = getIpc();
    if (ipc && typeof ipc.invoke === 'function') {
      await invokeWithTimeout(ipc, 'set-force-dark-mode', 2000, on);
    }
  } catch(e) {}
  try { applyForceDarkToOpenTabs(); } catch(e) {}
  try { window.__coffeeForceDarkDirty = true; } catch(e) {}
  try { if (typeof window.showSettingsSection === 'function') window.showSettingsSection('appearance'); } catch(e) {}
  return on;
}

async function relaunchApp() {
  try {
    const ipc = getIpc();
    if (ipc && typeof ipc.invoke === 'function') {
      await invokeWithTimeout(ipc, 'relaunch-app', 2000);
    }
  } catch(e) {}
}

try {
  window.CoffeeApp.setForceDarkMode = setForceDarkMode;
  window.CoffeeApp.applyForceDarkToOpenTabs = applyForceDarkToOpenTabs;
  window.CoffeeApp.relaunchApp = relaunchApp;
} catch(e) {}

// ==========================================
// Hardware Acceleration (Settings > System, default ON)
// ==========================================
/**
 * Persists the GPU preference, notifies the main process and flags the
 * relaunch hint (GPU mode can only change at startup).
 */
async function setHardwareAcceleration(enabled) {
  const on = !!enabled;
  try {
    if (window.BrowserState) {
      window.BrowserState.hardwareAcceleration = on;
      window.BrowserState.saveState();
    }
  } catch(e) {}
  try {
    const ipc = getIpc();
    if (ipc && typeof ipc.invoke === 'function') {
      await invokeWithTimeout(ipc, 'set-hardware-acceleration', 2000, on);
    }
  } catch(e) {}
  try { window.__coffeeHwAccelDirty = true; } catch(e) {}
  try { if (typeof window.showSettingsSection === 'function') window.showSettingsSection('system'); } catch(e) {}
  return on;
}

try {
  window.CoffeeApp.setHardwareAcceleration = setHardwareAcceleration;
} catch(e) {}

// ==========================================
// Diagnostics (About > card + window.CoffeeDiagnostics())
// ==========================================
function getCoffeeDiagnostics() {
  const d = { build: null, userAgent: null, brands: null, sessionActive: null, savedTabs: 0, restorableTabs: 0, popupDecision: null, prefs: {} };
  try { d.build = window.COFFEE_BUILD_ID || 'unknown'; } catch(e) {}
  try { d.userAgent = (typeof navigator !== 'undefined' && navigator.userAgent) || null; } catch(e) {}
  try {
    const uad = (typeof navigator !== 'undefined' && navigator.userAgentData) || null;
    d.brands = (uad && Array.isArray(uad.brands)) ? uad.brands.map((b) => `${b.brand}@${b.version}`) : null;
  } catch(e) {}
  try { d.sessionActive = localStorage.getItem('coffee_session_active'); } catch(e) {}
  try {
    const raw = localStorage.getItem('coffee_last_session_tabs');
    const arr = raw ? JSON.parse(raw) : [];
    d.savedTabs = Array.isArray(arr) ? arr.length : 0;
  } catch(e) {}
  try { d.restorableTabs = getRestorableTabs().length; } catch(e) {}
  try { d.popupDecision = localStorage.getItem('coffee_last_popup_decision'); } catch(e) {}
  try {
    if (window.BrowserState) {
      d.prefs = {
        forceDarkMode: !!window.BrowserState.forceDarkMode,
        hardwareAcceleration: window.BrowserState.hardwareAcceleration !== false,
        showFooterLatency: window.BrowserState.showFooterLatency !== false,
        showFooterMemory: window.BrowserState.showFooterMemory !== false,
        startupBehavior: window.BrowserState.startupBehavior || null
      };
    }
  } catch(e) {}
  return d;
}

try { window.CoffeeDiagnostics = getCoffeeDiagnostics; } catch(e) {}

/**
 * Periodic latency measurement polling
 */
async function pollLatency() {
  if (isLatencyProbeRunning) return;
  try {
    if (window.BrowserState && window.BrowserState.showFooterLatency === false) return;
  } catch(e) {}
  isLatencyProbeRunning = true;
  try {
    const lat = await measureNetworkLatency();
    currentLatencyMs = lat;
    updateLiveTelemetry();
  } catch(e) {
    currentLatencyMs = -1;
    updateLiveTelemetry();
  } finally {
    isLatencyProbeRunning = false;
  }
}

/**
 * Periodic memory measurement polling
 */
async function pollMemory() {
  if (isMemoryProbeRunning) return;
  try {
    if (window.BrowserState && window.BrowserState.showFooterMemory === false) return;
  } catch(e) {}
  isMemoryProbeRunning = true;
  try {
    const mem = await fetchRealMemoryKB();
    if (mem !== null && mem > 0) {
      currentMemoryKB = mem;
      updateLiveTelemetry();
    }
  } catch(e) {
  } finally {
    isMemoryProbeRunning = false;
  }
}

function updateLiveTelemetry() {
  try { applyFooterVisibility(); } catch(e) {}
  const now = new Date();
  let effLang = 'pt-BR';
  try {
    effLang = window.BrowserState ? window.BrowserState.getEffectiveLanguage() : 'pt-BR';
  } catch(e) { effLang = 'pt-BR'; }
  let timeStr = '';
  try {
    timeStr = now.toLocaleTimeString(effLang, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch(e) {
    timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  try {
  // 1. Time / Clock
  const statusTime = document.getElementById('status-time');
  if (statusTime) statusTime.textContent = timeStr;

  const ntClock = document.getElementById('nt-clock');
  if (ntClock) {
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    ntClock.textContent = `${hours}:${minutes}`;
  }
  } catch(e) {}

  try {
  // 2. Roast theme level
  const statusRoastText = document.getElementById('status-roast-text');
  if (statusRoastText && window.BrowserState && window.CoffeeI18n) {
    statusRoastText.textContent = window.CoffeeI18n.t(`roast_${window.BrowserState.roast || 'medio'}`);
  }
  } catch(e) {}

  try {
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
  } catch(e) {}

  try {
  // 4. Real Memory RAM Status
  const statusMemoryValue = document.getElementById('status-memory-value');
  if (statusMemoryValue) {
    if (currentMemoryKB !== null && currentMemoryKB > 0) {
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
    } else {
      // Default initial baseline while first measurement resolves
      statusMemoryValue.textContent = '120.0 MB';
      statusMemoryValue.style.color = 'var(--t2)';
    }
  }
  } catch(e) {}

  try {
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
  } catch(e) {}
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
