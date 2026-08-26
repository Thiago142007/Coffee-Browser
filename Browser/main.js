const { app, BrowserWindow, session, ipcMain, nativeTheme, nativeImage, shell, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const { CoadorEngine } = require('./adblock');

// Set Windows App User Model ID so the custom logo appears on the Windows Taskbar & Alt+Tab
if (process.platform === 'win32') {
  app.setAppUserModelId('com.coffeebrowser.app');
}

// Single Instance Lock — Ensure links clicked in other apps open in the existing browser instance
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      const targetUrl = extractUrlFromArgs(commandLine);
      if (targetUrl) {
        openUrlInRenderer(targetUrl);
      }
    }
  });
}

// Register as default protocol client for web browsing
try {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('http', process.execPath, [path.resolve(process.argv[1])]);
      app.setAsDefaultProtocolClient('https', process.execPath, [path.resolve(process.argv[1])]);
      app.setAsDefaultProtocolClient('coffee', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('http');
    app.setAsDefaultProtocolClient('https');
    app.setAsDefaultProtocolClient('coffee');
  }
} catch(e) {}

// Extract URL or web document from CLI arguments (e.g. when launched via Windows shell, protocol or default browser)
function extractUrlFromArgs(argv) {
  if (!Array.isArray(argv)) return null;
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg || typeof arg !== 'string') continue;
    const clean = arg.trim().replace(/^["']|["']$/g, '');
    if (clean.startsWith('--') || clean.startsWith('-')) continue;
    if (clean === '.' || clean.endsWith('main.js') || clean.endsWith('electron.exe') || clean.endsWith('CoffeeBrowser.exe')) continue;
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('cafe://') || clean.startsWith('coffee://') || clean.startsWith('file://')) {
      return clean;
    }
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(clean)) {
      return 'https://' + clean;
    }
    if (fs.existsSync(clean) && (clean.endsWith('.html') || clean.endsWith('.htm') || clean.endsWith('.xhtml') || clean.endsWith('.pdf'))) {
      return 'file://' + path.resolve(clean).replace(/\\/g, '/');
    }
  }
  return null;
}

function openUrlInRenderer(url) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.executeJavaScript(`
    if (window.CoffeeTabs) {
      if (typeof window.CoffeeTabs.openExternalUrl === 'function') {
        window.CoffeeTabs.openExternalUrl(${JSON.stringify(url)});
      } else {
        window.CoffeeTabs.createTab(${JSON.stringify(url)});
      }
    }
  `).catch(() => {});
}

// macOS Protocol event
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    openUrlInRenderer(url);
  }
});

// Clean Standard Chrome User-Agent string to guarantee 100% compatibility with Google Sign-In / OAuth
// IMPORTANT: the Chrome version MUST match the REAL embedded Chromium version (process.versions.chrome).
// Claiming a different version than the engine (e.g. "Chrome/134" on Chromium 150) creates an inconsistency
// between the User-Agent header and Sec-CH-UA client hints, which makes Google (and other providers)
// classify the browser as unsafe/bot and BLOCK the authentication.
const chromeFullVersion = process.versions.chrome || '134.0.0.0';
const uaPlatform = process.platform === 'darwin'
  ? 'Macintosh; Intel Mac OS X 10_15_7'
  : process.platform === 'linux'
    ? 'X11; Linux x86_64'
    : 'Windows NT 10.0; Win64; x64';
const cleanChromeUA = `Mozilla/5.0 (${uaPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeFullVersion} Safari/537.36`;
app.userAgentFallback = cleanChromeUA;

// Detect if a window.open request is for OAuth / Google Sign-In / Account Verification / Popup Modal
function isAuthOrPopupWindow(details) {
  if (!details || !details.url) return false;
  const { url, features, disposition } = details;

  // 1. Explicitly requested with popup window features (width, height, popup=1, etc.)
  if (features && typeof features === 'string' && (
    features.includes('width=') ||
    features.includes('height=') ||
    features.includes('popup=') ||
    features.includes('menubar=') ||
    features.includes('toolbar=') ||
    features.includes('location=')
  )) {
    return true;
  }

  // 2. Disposition requested as a new window popup
  if (disposition === 'new-window') {
    return true;
  }

  // 3. Known OAuth / Authentication / Verification URL patterns
  const lowerUrl = url.toLowerCase();
  const authPatterns = [
    'accounts.google.com',
    'appleid.apple.com',
    'login.microsoftonline.com',
    'login.live.com',
    'github.com/login',
    'api.twitter.com/oauth',
    'twitter.com/i/oauth',
    'x.com/i/oauth',
    'facebook.com/dialog/oauth',
    'facebook.com/v',
    'discord.com/api/oauth2',
    'discord.com/oauth2',
    'auth0.com',
    'cognito',
    'firebaseapp.com/__/auth',
    'supabase.co/auth',
    'clerk.',
    'okta.com',
    'id.twitch.tv/oauth2',
    'steamcommunity.com/openid',
    'oauth',
    'signin',
    'authorize'
  ];

  return authPatterns.some(p => lowerUrl.includes(p));
}

// Enforce Dark Mode by default across all Chromium web contents & engine
nativeTheme.themeSource = 'dark';
app.commandLine.appendSwitch('force-dark-mode');
app.commandLine.appendSwitch('enable-features', 'WebContentsForceDark:choice/reversal_and_color_inversion,DnsOverHttps');
app.commandLine.appendSwitch('blink-settings', 'forceDarkModeEnabled=true');

// Enforce Cloudflare DNS over HTTPS (1.1.1.1 / DoH) across all Chromium web requests & searches
app.commandLine.appendSwitch('dns-over-https-templates', 'https://cloudflare-dns.com/dns-query{?dns}');
app.commandLine.appendSwitch('dns-over-https-mode', 'secure');

let mainWindow;
let isAdblockPausedGlobal = false;
let adblockSiteWhitelist = {};

// Coador — Real Filter Engine (EasyList/EasyPrivacy)
const coadorEngine = new CoadorEngine();
let coadorPendingBlocks = 0;
let coadorFlushTimer = null;

function notifyCoadorBlock(count) {
  coadorPendingBlocks += count;
  if (coadorFlushTimer) return;
  coadorFlushTimer = setTimeout(() => {
    const n = coadorPendingBlocks;
    coadorPendingBlocks = 0;
    coadorFlushTimer = null;
    if (n > 0 && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('coador-blocked-ad', { count: n });
    }
  }, 400);
}

const AUTH_DOMAIN_WHITELIST = [
  'accounts.google.com',
  'apis.google.com',
  'gstatic.com',
  'googleapis.com',
  'googleusercontent.com',
  'appleid.apple.com',
  'login.microsoftonline.com',
  'login.live.com',
  'github.com/login'
];

// Listen to Coador state updates from renderer
ipcMain.on('update-coador-state', (event, data) => {
  if (data) {
    if (typeof data.isPausedGlobal === 'boolean') isAdblockPausedGlobal = data.isPausedGlobal;
    if (data.siteWhitelist) adblockSiteWhitelist = data.siteWhitelist;
  }
});

function createWindow() {
  // Set clean Chrome User-Agent across all network requests
  session.defaultSession.setUserAgent(cleanChromeUA);

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = Object.assign({}, details.requestHeaders);
    for (const key of Object.keys(requestHeaders)) {
      if (key.toLowerCase() === 'user-agent') {
        requestHeaders[key] = cleanChromeUA;
      }
    }
    callback({ cancel: false, requestHeaders });
  });

  // Coador — Real network-level blocking via EasyList/EasyPrivacy engine
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (isAdblockPausedGlobal || !coadorEngine.ready) {
      callback({ cancel: false });
      return;
    }

    const u = (details.url || '').toLowerCase();
    if (AUTH_DOMAIN_WHITELIST.some((a) => u.includes(a))) {
      callback({ cancel: false });
      return;
    }

    try {
      if (details.initiator) {
        const initHost = new URL(details.initiator).hostname;
        const cleanHost = initHost.replace(/^www\./, '');
        if (adblockSiteWhitelist[initHost] || adblockSiteWhitelist[cleanHost]) {
          callback({ cancel: false });
          return;
        }
      }
    } catch(e) {}

    if (coadorEngine.shouldBlock(details.url, details.type, details.initiator)) {
      notifyCoadorBlock(1);
      callback({ cancel: true });
      return;
    }

    callback({ cancel: false });
  });

  // Intercept headers globally so any site can be loaded in webview without CSP, COOP, COEP or frame block
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = Object.assign({}, details.responseHeaders);
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];
    delete responseHeaders['content-security-policy'];
    delete responseHeaders['Content-Security-Policy'];
    delete responseHeaders['frame-options'];
    delete responseHeaders['cross-origin-opener-policy'];
    delete responseHeaders['Cross-Origin-Opener-Policy'];
    delete responseHeaders['cross-origin-embedder-policy'];
    delete responseHeaders['Cross-Origin-Embedder-Policy'];
    callback({ cancel: false, responseHeaders });
  });

  const appIcoPath = path.join(__dirname, 'assets', 'logo.ico');
  const appPngPath = path.join(__dirname, 'assets', 'logo.png');
  const appJpgPath = path.join(__dirname, 'assets', 'logo.jpg');
  
  let iconPath = appJpgPath;
  if (fs.existsSync(appIcoPath)) iconPath = appIcoPath;
  else if (fs.existsSync(appPngPath)) iconPath = appPngPath;

  const appIcon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#120A06',
    title: 'Coffee Browser',
    icon: appIcon,
    frame: false, // 100% Frameless custom window
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true, // Enables <webview> tags for full Chromium embedded instances per tab
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });

  if (appIcon && !appIcon.isEmpty()) {
    mainWindow.setIcon(appIcon);
  }

  // Prevent top-level window from ever navigating away from index.html
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      mainWindow.webContents.executeJavaScript(`
        if (window.CoffeeTabs) {
          window.CoffeeTabs.navigateActiveTab(${JSON.stringify(url)});
        }
      `);
    }
  });

  // Helper for window open handling across main window and child webviews
  function handleWindowOpen(details) {
    const { url } = details;
    if (isAuthOrPopupWindow(details)) {
      // Parse custom width/height from features if provided
      let winWidth = 540;
      let winHeight = 680;
      if (details.features && typeof details.features === 'string') {
        const wMatch = details.features.match(/width=(\d+)/i);
        const hMatch = details.features.match(/height=(\d+)/i);
        if (wMatch && parseInt(wMatch[1], 10)) winWidth = Math.max(380, Math.min(1200, parseInt(wMatch[1], 10)));
        if (hMatch && parseInt(hMatch[1], 10)) winHeight = Math.max(420, Math.min(1000, parseInt(hMatch[1], 10)));
      }

      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: winWidth,
          height: winHeight,
          minWidth: 380,
          minHeight: 420,
          center: true,
          autoHideMenuBar: true,
          backgroundColor: '#120A06',
          icon: appIcon,
          show: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            webSecurity: true,
            allowRunningInsecureContent: true
          }
        }
      };
    }

    // Standard links open as tabs in CoffeeTabs
    if (mainWindow && !mainWindow.isDestroyed() && url && url !== 'about:blank') {
      mainWindow.webContents.executeJavaScript(`
        if (window.CoffeeTabs) {
          window.CoffeeTabs.createTab(${JSON.stringify(url)});
        }
      `);
    }
    return { action: 'deny' };
  }

  // Prevent target="_blank" from breaking out of the window - open in new tab or auth popup
  mainWindow.webContents.setWindowOpenHandler(handleWindowOpen);

  // Intercept all child webviews / windows and apply proper window open handler
  app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(handleWindowOpen);

    // Global keyboard shortcuts: F5 = Reload page | F12 = Toggle DevTools console
    contents.on('before-input-event', (event, input) => {
      if (!input || input.type !== 'keyDown') return;

      let currentUrl = '';
      try { currentUrl = contents.getURL() || ''; } catch(e) {}
      if (currentUrl.startsWith('devtools:')) return;

      const isMainWindowShell = mainWindow && !mainWindow.isDestroyed() && contents === mainWindow.webContents;

      if (input.key === 'F5') {
        event.preventDefault();
        if (isMainWindowShell) {
          mainWindow.webContents.executeJavaScript(`if (window.CoffeeOmnibox) window.CoffeeOmnibox.refreshOrStop();`).catch(() => {});
        } else {
          try { contents.reload(); } catch(e) {}
        }
      } else if (input.key === 'F12') {
        event.preventDefault();
        if (isMainWindowShell) {
          // Focus is on the browser UI: toggle DevTools of the ACTIVE tab webview
          mainWindow.webContents.executeJavaScript(`
            (function() {
              var wv = document.querySelector('.tab-content-view.active webview');
              if (!wv) return;
              try {
                if (wv.isDevToolsOpened()) wv.closeDevTools();
                else wv.openDevTools();
              } catch(e) {}
            })();
          `).catch(() => {});
        } else {
          try {
            if (contents.isDevToolsOpened()) contents.closeDevTools();
            else contents.openDevTools();
          } catch(e) {}
        }
      }
    });

    // Coador cosmetic filters — inject real EasyList element-hiding CSS per page
    contents.on('dom-ready', () => {
      try {
        const pageUrl = contents.getURL();
        if (!pageUrl || !/^https?:/i.test(pageUrl)) return;
        if (isAdblockPausedGlobal || !coadorEngine.ready) return;
        let host = '';
        try { host = new URL(pageUrl).hostname; } catch(e) { return; }
        const cleanHost = host.replace(/^www\./, '');
        if (adblockSiteWhitelist[host] || adblockSiteWhitelist[cleanHost]) return;
        const css = coadorEngine.getCosmeticCss(pageUrl);
        if (css) contents.insertCSS(css, { cssOrigin: 'user' });
      } catch(e) {}
    });
  });

  // Configure any created popup window (OAuth / Login dialogs)
  app.on('browser-window-created', (event, win) => {
    if (win !== mainWindow) {
      if (appIcon && !appIcon.isEmpty()) {
        win.setIcon(appIcon);
      }
      win.setMenuBarVisibility(false);
      win.webContents.setUserAgent(cleanChromeUA);
      win.webContents.setWindowOpenHandler(handleWindowOpen);
    }
  });

  // Windows Hardware & Mouse Extra Buttons Navigation (Mouse 4 & 5 / App Commands)
  mainWindow.on('app-command', (e, cmd) => {
    if (cmd === 'browser-backward') {
      mainWindow.webContents.executeJavaScript(`if (window.CoffeeOmnibox) window.CoffeeOmnibox.goBack();`);
    } else if (cmd === 'browser-forward') {
      mainWindow.webContents.executeJavaScript(`if (window.CoffeeOmnibox) window.CoffeeOmnibox.goForward();`);
    }
  });

  mainWindow.on('maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-state-changed', { isMaximized: true });
    }
  });

  mainWindow.on('unmaximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-state-changed', { isMaximized: false });
    }
  });

  mainWindow.on('restore', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-state-changed', { isMaximized: mainWindow.isMaximized() });
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    const initialUrl = extractUrlFromArgs(process.argv);
    if (initialUrl) {
      setTimeout(() => {
        openUrlInRenderer(initialUrl);
      }, 400);
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function getTargetWindow(event) {
  if (event && event.sender) {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) return win;
  }
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
  const focused = BrowserWindow.getFocusedWindow();
  if (focused && !focused.isDestroyed()) return focused;
  const all = BrowserWindow.getAllWindows();
  return all.length > 0 ? all[0] : null;
}

// Native Window Controls IPC
ipcMain.on('window-minimize', (event) => {
  const win = getTargetWindow(event);
  if (win && !win.isDestroyed()) {
    win.minimize();
  }
});

ipcMain.on('window-maximize', (event) => {
  const win = getTargetWindow(event);
  if (win && !win.isDestroyed()) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
    if (!win.isDestroyed()) {
      win.webContents.send('window-state-changed', { isMaximized: win.isMaximized() });
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = getTargetWindow(event);
  if (win && !win.isDestroyed()) {
    win.close();
  }
});

ipcMain.handle('is-window-maximized', (event) => {
  const win = getTargetWindow(event);
  return win && !win.isDestroyed() ? win.isMaximized() : false;
});

// Telemetry: Real Total RAM calculation across all browser processes
ipcMain.handle('get-system-memory', async () => {
  try {
    let totalKB = 0;
    if (app && typeof app.getAppMetrics === 'function') {
      const metrics = app.getAppMetrics();
      for (const m of metrics) {
        if (m.memory && typeof m.memory.workingSetSize === 'number') {
          totalKB += m.memory.workingSetSize;
        }
      }
    }
    // Fallback to process RSS memory if getAppMetrics is empty
    if (totalKB === 0 && process.memoryUsage) {
      totalKB = Math.round(process.memoryUsage().rss / 1024);
    }
    return { workingSetKB: totalKB };
  } catch (err) {
    let rss = 0;
    if (process.memoryUsage) {
      rss = Math.round(process.memoryUsage().rss / 1024);
    }
    return { workingSetKB: rss };
  }
});

// Telemetry: Ultra-low latency network ping
ipcMain.handle('get-network-latency', async () => {
  const net = require('net');
  const hosts = [
    { host: '1.1.1.1', port: 80 },
    { host: '1.0.0.1', port: 80 },
    { host: '8.8.8.8', port: 53 },
    { host: '1.1.1.1', port: 443 }
  ];

  for (const target of hosts) {
    try {
      const ping = await new Promise((resolve) => {
        const start = performance.now();
        const socket = new net.Socket();
        let finished = false;

        const finish = (val) => {
          if (finished) return;
          finished = true;
          try { socket.destroy(); } catch(e) {}
          resolve(val);
        };

        socket.setTimeout(1800);

        socket.connect(target.port, target.host, () => {
          const rtt = Math.max(1, Math.round(performance.now() - start));
          finish(rtt);
        });

        socket.on('error', () => finish(-1));
        socket.on('timeout', () => finish(-1));
      });

      if (ping > 0) {
        return { latencyMs: ping };
      }
    } catch(e) {}
  }

  return { latencyMs: -1 };
});

// ==========================================
// Integrated Download Manager Backend
// ==========================================
let downloadsStore = [];
const activeDownloadItems = new Map();

function getDownloadsHistoryPath() {
  return path.join(app.getPath('userData'), 'downloads_history.json');
}

function loadDownloadsHistory() {
  try {
    const p = getDownloadsHistoryPath();
    if (fs.existsSync(p)) {
      downloadsStore = JSON.parse(fs.readFileSync(p, 'utf8')) || [];
    }
  } catch(e) {
    downloadsStore = [];
  }
}

function saveDownloadsHistory() {
  try {
    const p = getDownloadsHistoryPath();
    fs.writeFileSync(p, JSON.stringify(downloadsStore.slice(0, 100), null, 2));
  } catch(e) {}
}

function setupDownloadManager() {
  loadDownloadsHistory();

  session.defaultSession.on('will-download', (event, item, webContents) => {
    const id = 'dl_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    activeDownloadItems.set(id, item);

    const savePath = item.getSavePath() || path.join(app.getPath('downloads'), item.getFilename());
    if (!item.getSavePath()) {
      item.setSavePath(savePath);
    }

    const dlRecord = {
      id,
      filename: item.getFilename(),
      savePath: item.getSavePath() || savePath,
      url: item.getURL(),
      receivedBytes: item.getReceivedBytes(),
      totalBytes: item.getTotalBytes(),
      speed: 0,
      state: 'progressing',
      isPaused: item.isPaused(),
      startTime: Date.now(),
      endTime: null,
      fileDeleted: false
    };

    downloadsStore.unshift(dlRecord);
    saveDownloadsHistory();

    const notifyProgress = (stateName) => {
      dlRecord.receivedBytes = item.getReceivedBytes();
      dlRecord.totalBytes = item.getTotalBytes();
      dlRecord.savePath = item.getSavePath() || dlRecord.savePath;
      dlRecord.speed = typeof item.getCurrentBandwidth === 'function' ? item.getCurrentBandwidth() : 0;
      dlRecord.isPaused = item.isPaused();
      dlRecord.state = stateName || item.getState();

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-progress-update', dlRecord);
      }
    };

    notifyProgress('progressing');

    item.on('updated', (evt, state) => {
      notifyProgress(state);
    });

    item.once('done', (evt, state) => {
      activeDownloadItems.delete(id);
      dlRecord.state = state;
      dlRecord.endTime = Date.now();
      dlRecord.receivedBytes = item.getReceivedBytes();
      dlRecord.totalBytes = item.getTotalBytes();
      dlRecord.speed = 0;

      saveDownloadsHistory();

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-completed', dlRecord);
      }
    });
  });
}

// Download IPC Handlers
ipcMain.handle('get-downloads-list', async () => {
  // Check file existence on disk for completed downloads
  for (const item of downloadsStore) {
    if (item.savePath) {
      item.fileDeleted = !fs.existsSync(item.savePath);
    }
  }
  return downloadsStore;
});

ipcMain.handle('pause-download', (event, id) => {
  const item = activeDownloadItems.get(id);
  if (item && !item.isPaused()) {
    item.pause();
    return true;
  }
  return false;
});

ipcMain.handle('resume-download', (event, id) => {
  const item = activeDownloadItems.get(id);
  if (item && item.isPaused()) {
    item.resume();
    return true;
  }
  return false;
});

ipcMain.handle('cancel-download', (event, id) => {
  const item = activeDownloadItems.get(id);
  if (item) {
    item.cancel();
    activeDownloadItems.delete(id);
    return true;
  }
  return false;
});

ipcMain.handle('retry-download', (event, url) => {
  if (mainWindow && url) {
    mainWindow.webContents.downloadURL(url);
    return true;
  }
  return false;
});

ipcMain.handle('open-download-file', async (event, savePath) => {
  if (savePath && fs.existsSync(savePath)) {
    try {
      await shell.openPath(savePath);
      return true;
    } catch(e) {}
  }
  return false;
});

ipcMain.handle('open-download-folder', (event, savePath) => {
  if (savePath) {
    try {
      shell.showItemInFolder(savePath);
      return true;
    } catch(e) {}
  }
  return false;
});

// ==========================================
// Screen Sharing & Media Permissions Backend
// ==========================================
const pendingScreenShareRequests = new Map();

function setupMediaAndPermissions() {
  // Allow camera, microphone, screen capture, notifications, etc.
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    callback(true);
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    return true;
  });

  // Handle getDisplayMedia (Screen Sharing) for all tabs & webviews
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 500, height: 300 },
        fetchWindowIcons: true
      });

      if (!sources || sources.length === 0) {
        callback({});
        return;
      }

      if (!mainWindow || mainWindow.isDestroyed()) {
        callback({ video: sources[0], audio: request.audioRequested ? 'loopback' : null });
        return;
      }

      const requestId = 'screen_req_' + Date.now() + '_' + Math.floor(Math.random() * 100000);

      const serializableSources = sources.map(s => ({
        id: s.id,
        name: s.name,
        thumbnail: s.thumbnail ? s.thumbnail.toDataURL() : null,
        appIcon: s.appIcon ? s.appIcon.toDataURL() : null,
        isScreen: s.id.startsWith('screen:')
      }));

      // Set timeout in case user closes or ignores picker
      const timeoutId = setTimeout(() => {
        if (pendingScreenShareRequests.has(requestId)) {
          const req = pendingScreenShareRequests.get(requestId);
          pendingScreenShareRequests.delete(requestId);
          req.callback({});
        }
      }, 90000);

      pendingScreenShareRequests.set(requestId, {
        callback,
        sources,
        request,
        timeoutId
      });

      let requestingOrigin = request.securityOrigin || '';
      if (!requestingOrigin && request.frame && request.frame.url) {
        try {
          requestingOrigin = new URL(request.frame.url).origin;
        } catch(e) {
          requestingOrigin = request.frame.url;
        }
      }

      mainWindow.webContents.send('open-screen-share-picker', {
        requestId,
        sources: serializableSources,
        origin: requestingOrigin,
        audioRequested: !!request.audioRequested
      });
    } catch (err) {
      console.error('[ScreenShare] Error in getDisplayMedia handler:', err);
      callback({});
    }
  });

  // Renderer screen share selection response
  ipcMain.on('screen-share-choice', (event, data) => {
    if (!data || !data.requestId) return;
    const pending = pendingScreenShareRequests.get(data.requestId);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pendingScreenShareRequests.delete(data.requestId);

    if (data.canceled || !data.sourceId) {
      pending.callback({});
      return;
    }

    const selectedSource = pending.sources.find(s => s.id === data.sourceId);
    if (selectedSource) {
      pending.callback({
        video: selectedSource,
        audio: data.audio ? 'loopback' : (pending.request.audioRequested ? 'loopback' : null)
      });
    } else {
      pending.callback({
        video: pending.sources[0],
        audio: data.audio ? 'loopback' : null
      });
    }
  });
}

app.whenReady().then(() => {
  coadorEngine.init(app.getPath('userData'));
  coadorEngine.ensureReady().catch(() => {});
  setupMediaAndPermissions();
  setupDownloadManager();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
