/**
 * Coffee Browser State Management
 */

class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(data));
  }
}

class BrowserState extends EventEmitter {
  constructor() {
    super();
    this.loadState();
  }

  loadState() {
    const saved = localStorage.getItem('coffee_browser_state');
    let data = {};
    if (saved) {
      try { data = JSON.parse(saved); } catch(e) { console.error(e); }
    }

    if (!data.searchEngine || data.searchEngine === 'duckduckgo') {
      data.searchEngine = 'google';
    }
    this.roast = data.roast || 'medio';
    this.language = data.language || 'auto'; // 'auto' (detects system), 'pt-BR', 'en-US', 'es-ES', etc.
    this.searchEngine = data.searchEngine;
    this.currentWorkspace = data.currentWorkspace || 'Principal';
    this.startupBehavior = data.startupBehavior || 'newtab'; // 'newtab', 'continue', 'custom'
    this.showBookmarksBar = data.showBookmarksBar !== undefined ? data.showBookmarksBar : true;
    this.hardwareAcceleration = data.hardwareAcceleration !== undefined ? data.hardwareAcceleration : true;

    // Shields Settings (Brave Shields style)
    this.shieldsEnabled = data.shieldsEnabled !== undefined ? data.shieldsEnabled : true;
    this.shieldsAggressive = data.shieldsAggressive !== undefined ? data.shieldsAggressive : true;
    this.httpsUpgrade = data.httpsUpgrade !== undefined ? data.httpsUpgrade : true;
    this.blockScripts = data.blockScripts !== undefined ? data.blockScripts : false;
    this.fingerprintProtection = data.fingerprintProtection !== undefined ? data.fingerprintProtection : true;
    this.blockThirdPartyCookies = data.blockThirdPartyCookies !== undefined ? data.blockThirdPartyCookies : true;

    this.shieldsStats = data.shieldsStats || {
      trackersBlocked: 0,
      bandwidthSavedMB: 0,
      timeSavedMinutes: 0,
      httpsUpgrades: 0,
      fingerprintsBlocked: 0
    };

    // Auto-reset legacy mock stats from localStorage if present
    if (this.shieldsStats.trackersBlocked === 14820 || this.shieldsStats.httpsUpgrades === 840 || this.shieldsStats.trackersBlocked > 10000) {
      this.shieldsStats = {
        trackersBlocked: 0,
        bandwidthSavedMB: 0,
        timeSavedMinutes: 0,
        httpsUpgrades: 0,
        fingerprintsBlocked: 0
      };
    }

    // Bookmarks (Clean, no wallet)
    this.bookmarks = data.bookmarks || [
      { id: 'b1', title: 'DuckDuckGo', url: 'https://html.duckduckgo.com', iconType: 'search' },
      { id: 'b2', title: 'Wikipedia', url: 'https://pt.wikipedia.org', iconType: 'wikipedia' },
      { id: 'b3', title: 'GitHub', url: 'https://github.com', iconType: 'github' },
      { id: 'b4', title: 'Reddit', url: 'https://reddit.com', iconType: 'reddit' },
      { id: 'b5', title: 'Hacker News', url: 'https://news.ycombinator.com', iconType: 'zap' },
      { id: 'b6', title: 'Escudos', url: 'cafe://shields', iconType: 'shield' },
      { id: 'b7', title: 'Configurações', url: 'cafe://settings', iconType: 'settings' }
    ];

    // History
    this.history = data.history || [
      { url: 'cafe://newtab', title: 'Nova Aba', time: Date.now() - 3600000 },
      { url: 'cafe://docs', title: 'Documentação do Navegador', time: Date.now() - 7200000 },
      { url: 'cafe://settings', title: 'Configurações', time: Date.now() - 10800000 }
    ];

    // Downloads
    this.downloads = data.downloads || [
      { id: 'd1', name: 'CoffeeBrowser-Setup-x64.exe', size: '64.2 MB', progress: 100, state: 'completed', time: 'Hoje 10:45' },
      { id: 'd2', name: 'coffee-engine-core.tar.gz', size: '12.8 MB', progress: 100, state: 'completed', time: 'Ontem 18:20' }
    ];

    this.workspaces = ['Principal', 'Desenvolvimento', 'Pesquisa', 'Geral'];

    // Active Tabs
    this.tabs = [
      {
        id: 'tab-1',
        title: 'Nova Aba',
        url: 'cafe://newtab',
        iconType: 'globe',
        isLoading: false,
        isPinned: false,
        isPrivate: false,
        isMuted: false,
        history: ['cafe://newtab'],
        historyIndex: 0,
        workspace: 'Principal',
        readerMode: false,
        blockedOnPage: 0
      }
    ];

    this.activeTabId = 'tab-1';
  }

  saveState() {
    const data = {
      roast: this.roast,
      language: this.language,
      searchEngine: this.searchEngine,
      currentWorkspace: this.currentWorkspace,
      startupBehavior: this.startupBehavior,
      showBookmarksBar: this.showBookmarksBar,
      hardwareAcceleration: this.hardwareAcceleration,
      shieldsEnabled: this.shieldsEnabled,
      shieldsAggressive: this.shieldsAggressive,
      httpsUpgrade: this.httpsUpgrade,
      blockScripts: this.blockScripts,
      fingerprintProtection: this.fingerprintProtection,
      blockThirdPartyCookies: this.blockThirdPartyCookies,
      shieldsStats: this.shieldsStats,
      bookmarks: this.bookmarks,
      history: this.history.slice(0, 100),
      downloads: this.downloads
    };
    try {
      localStorage.setItem('coffee_browser_state', JSON.stringify(data));
      localStorage.setItem('coffee_language', this.getEffectiveLanguage());
    } catch(e) {
      console.warn('Storage quota exceeded', e);
    }
  }

  getEffectiveLanguage() {
    if (window.CoffeeI18n) {
      return window.CoffeeI18n.getEffectiveLanguage();
    }
    return this.language === 'auto' ? 'pt-BR' : (this.language || 'pt-BR');
  }

  setLanguage(lang) {
    this.language = lang;
    this.saveState();
    if (window.CoffeeI18n) {
      window.CoffeeI18n.applyStaticTranslations();
    }
    this.emit('languageChanged', lang);
  }

  setRoast(roast) {
    this.roast = roast;
    document.documentElement.dataset.roast = roast;
    this.saveState();
    this.emit('roastChanged', roast);
  }

  addShieldStats(trackersCount = 0, isHttps = false) {
    if (isHttps) {
      this.shieldsStats.httpsUpgrades = (this.shieldsStats.httpsUpgrades || 0) + 1;
    }
    if (trackersCount > 0) {
      this.shieldsStats.trackersBlocked = (this.shieldsStats.trackersBlocked || 0) + trackersCount;
      const mbSaved = Number((trackersCount * 0.25).toFixed(2));
      const minSaved = Number((trackersCount * 0.01).toFixed(2));
      this.shieldsStats.bandwidthSavedMB = Number(((this.shieldsStats.bandwidthSavedMB || 0) + mbSaved).toFixed(2));
      this.shieldsStats.timeSavedMinutes = Number(((this.shieldsStats.timeSavedMinutes || 0) + minSaved).toFixed(2));
    }
    this.saveState();
    this.emit('shieldsStatsUpdated', this.shieldsStats);
  }

  addHistoryEntry(entry) {
    if (!entry || !entry.url || entry.url.startsWith('about:blank') || entry.url === 'cafe://newtab') return;
    
    const existingIndex = this.history.findIndex(h => h.url === entry.url);
    const visitCount = (existingIndex >= 0 && this.history[existingIndex].visitCount) ? this.history[existingIndex].visitCount + 1 : 1;

    const newRecord = {
      id: 'hist-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      url: entry.url,
      title: entry.title || entry.url,
      time: Date.now(),
      visitCount: visitCount
    };

    if (existingIndex >= 0) {
      this.history.splice(existingIndex, 1);
    }
    this.history.unshift(newRecord);
    if (this.history.length > 500) {
      this.history = this.history.slice(0, 500);
    }
    this.saveState();
    this.emit('historyChanged', this.history);
  }

  deleteHistoryEntry(id) {
    this.history = this.history.filter(h => h.id !== id && h.url !== id);
    this.saveState();
    this.emit('historyChanged', this.history);
  }

  clearHistory() {
    this.history = [];
    this.saveState();
    this.emit('historyChanged', this.history);
  }

  getActiveTab() {
    return this.tabs.find(t => t.id === this.activeTabId) || this.tabs[0];
  }
}

window.BrowserState = new BrowserState();

window.CoffeeStateHelpers = {
  clearHistory: () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico de navegação?')) {
      window.BrowserState.clearHistory();
    }
  },
  deleteHistoryEntry: (id) => {
    window.BrowserState.deleteHistoryEntry(id);
  }
};
