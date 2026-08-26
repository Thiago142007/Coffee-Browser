/**
 * Coador AdBlock Controller (AdBlock Official Inspired Engine & UI)
 */

class CoffeeShieldsController {
  constructor() {
    this.siteWhitelist = this.loadWhitelist();
    this.isPausedGlobal = localStorage.getItem('coffee_coador_paused_global') === 'true';
    this.customRules = this.loadCustomRules();
    this.initUI();
    this.bindEvents();
  }

  loadWhitelist() {
    try {
      return JSON.parse(localStorage.getItem('coffee_coador_whitelist') || '{}');
    } catch(e) {
      return {};
    }
  }

  saveWhitelist() {
    try {
      localStorage.setItem('coffee_coador_whitelist', JSON.stringify(this.siteWhitelist));
    } catch(e) {}
  }

  loadCustomRules() {
    try {
      return JSON.parse(localStorage.getItem('coffee_coador_custom_rules') || '{}');
    } catch(e) {
      return {};
    }
  }

  saveCustomRules() {
    try {
      localStorage.setItem('coffee_coador_custom_rules', JSON.stringify(this.customRules));
    } catch(e) {}
  }

  initUI() {
    this.controlGroup = document.getElementById('coador-control-group');
    this.shieldBtn = document.getElementById('shield-toggle-btn');
    this.powerBtn = document.getElementById('coador-power-btn');
    this.shieldBadge = document.getElementById('shield-badge-count');
    this.popover = document.getElementById('shield-popover');
    this.statusBadge = document.getElementById('adblock-status-badge');
    this.trackersCount = document.getElementById('popover-trackers-count');
    this.totalCount = document.getElementById('adblock-total-count');
    this.pauseSiteBtn = document.getElementById('adblock-pause-site-btn');
    this.pauseSiteText = document.getElementById('adblock-pause-site-text');
    this.currentDomainText = document.getElementById('adblock-current-domain');
    this.pauseGlobalBtn = document.getElementById('adblock-pause-global-btn');
    this.pauseGlobalText = document.getElementById('adblock-pause-global-text');

    this.syncMainProcessConfig();
  }

  syncMainProcessConfig() {
    try {
      if (typeof require !== 'undefined') {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('update-coador-state', {
          isPausedGlobal: this.isPausedGlobal,
          siteWhitelist: this.siteWhitelist
        });
      }
    } catch(e) {}
  }

  bindEvents() {
    if (this.shieldBtn) {
      this.shieldBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePopover();
      });
    }

    // Close popover on outer click
    document.addEventListener('click', (e) => {
      if (this.popover && !this.popover.contains(e.target) && (!this.shieldBtn || !this.shieldBtn.contains(e.target)) && (!this.controlGroup || !this.controlGroup.contains(e.target))) {
        this.popover.classList.remove('open');
      }
    });

    window.BrowserState.on('tabChanged', () => this.updateShieldUI());
    window.BrowserState.on('tabNavigated', () => this.onTabNavigated());

    // Listen to network-level ad blocks from main process (REAL block events, batched)
    try {
      if (typeof require !== 'undefined') {
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('coador-blocked-ad', (event, data) => {
          const count = (data && typeof data.count === 'number' && data.count > 0) ? data.count : 1;
          const activeTab = window.BrowserState.getActiveTab();
          if (activeTab && !activeTab.url.startsWith('cafe://') && this.isShieldActiveForUrl(activeTab.url)) {
            activeTab.blockedOnPage = (activeTab.blockedOnPage || 0) + count;
            window.BrowserState.addShieldStats(count, activeTab.url.startsWith('https://'));
            this.updateShieldUI();
          }
        });
      }
    } catch(e) {}
  }

  togglePopover() {
    const isOpen = this.popover.classList.toggle('open');
    if (isOpen) {
      this.updateShieldUI();
    }
  }

  quickToggleActiveSite(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const tab = window.BrowserState.getActiveTab();
    if (!tab) return;

    const domain = this.getDomain(tab.url);
    const isCurrentlyPaused = !!this.siteWhitelist[domain];
    
    if (isCurrentlyPaused) {
      delete this.siteWhitelist[domain];
    } else {
      this.siteWhitelist[domain] = true;
    }
    this.saveWhitelist();
    this.syncMainProcessConfig();
    this.updateShieldUI();

    // Reload tab immediately so anti-adblock websites can be accessed smoothly
    if (window.CoffeeTabs) {
      window.CoffeeTabs.reloadActiveTab();
    }
  }

  togglePauseOnSite() {
    this.quickToggleActiveSite();
  }

  togglePauseGlobal() {
    this.isPausedGlobal = !this.isPausedGlobal;
    localStorage.setItem('coffee_coador_paused_global', this.isPausedGlobal ? 'true' : 'false');
    this.syncMainProcessConfig();
    this.updateShieldUI();

    if (window.CoffeeTabs) {
      window.CoffeeTabs.reloadActiveTab();
    }
  }

  startElementPicker() {
    this.popover.classList.remove('open');
    const tab = window.BrowserState.getActiveTab();
    if (!tab) return;

    const webview = document.getElementById(`webview-${tab.id}`);
    if (!webview) return;

    webview.executeJavaScript(`
      (function() {
        if (window.__coadorPickerActive) return;
        window.__coadorPickerActive = true;

        // Create on-screen instructions badge
        const badge = document.createElement('div');
        badge.id = '__coador_picker_badge';
        badge.textContent = '🎯 Modo de Seleção: Clique no elemento para bloquear (Esc para cancelar)';
        badge.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#1A0F0A;color:#FFFFFF;border:2px solid #C97A3E;border-radius:24px;padding:10px 22px;font-size:13px;font-weight:700;z-index:2147483647;box-shadow:0 8px 32px rgba(0,0,0,0.8);font-family:sans-serif;pointer-events:none;';
        document.body.appendChild(badge);

        // Highlight box
        const highlight = document.createElement('div');
        highlight.id = '__coador_picker_highlight';
        highlight.style.cssText = 'position:fixed;display:none;border:2px solid #E59866;background:rgba(201,122,62,0.35);z-index:2147483646;pointer-events:none;transition:all 0.05s ease;';
        document.body.appendChild(highlight);

        let currentTarget = null;

        function onMouseMove(e) {
          const target = document.elementFromPoint(e.clientX, e.clientY);
          if (!target || target === badge || target === highlight || target === document.body || target === document.documentElement) return;
          currentTarget = target;
          const rect = target.getBoundingClientRect();
          highlight.style.display = 'block';
          highlight.style.top = rect.top + 'px';
          highlight.style.left = rect.left + 'px';
          highlight.style.width = rect.width + 'px';
          highlight.style.height = rect.height + 'px';
        }

        function onClick(e) {
          e.preventDefault();
          e.stopPropagation();
          if (currentTarget) {
            currentTarget.style.display = 'none';
            // Extract selector
            let selector = currentTarget.id ? '#' + currentTarget.id : (currentTarget.className ? '.' + currentTarget.className.split(' ').filter(c => c).join('.') : currentTarget.tagName.toLowerCase());
            console.log('[COFFEE_ADBLOCK_BLOCK_SELECTOR]:' + selector);
          }
          cleanup();
        }

        function onKeyDown(e) {
          if (e.key === 'Escape') {
            cleanup();
          }
        }

        function cleanup() {
          window.__coadorPickerActive = false;
          if (badge) badge.remove();
          if (highlight) highlight.remove();
          window.removeEventListener('mousemove', onMouseMove, true);
          window.removeEventListener('click', onClick, true);
          window.removeEventListener('keydown', onKeyDown, true);
        }

        window.addEventListener('mousemove', onMouseMove, true);
        window.addEventListener('click', onClick, true);
        window.addEventListener('keydown', onKeyDown, true);
      })();
    `).catch(() => {});
  }

  onTabNavigated() {
    // Real block counts now arrive exclusively via 'coador-blocked-ad' IPC events
    const tab = window.BrowserState.getActiveTab();
    if (!tab) return;
    tab.blockedOnPage = 0;
    this.updateShieldUI();
  }

  isShieldActiveForUrl(url) {
    if (this.isPausedGlobal) return false;
    if (!window.BrowserState.shieldsEnabled) return false;
    const domain = this.getDomain(url);
    if (this.siteWhitelist[domain]) return false;
    return true;
  }

  getDomain(url) {
    try {
      if (url.startsWith('cafe://')) return url.split('/')[2] || 'cafe';
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname;
    } catch(e) {
      return url;
    }
  }

  updateShieldUI() {
    const tab = window.BrowserState.getActiveTab();
    if (!tab) return;

    const t = (k, fb) => window.CoffeeI18n ? window.CoffeeI18n.t(k, fb) : fb;
    const domain = this.getDomain(tab.url);
    const isSitePaused = !!this.siteWhitelist[domain];
    const isShieldOn = this.isShieldActiveForUrl(tab.url);
    const totalBlocked = (window.BrowserState.shieldsStats && window.BrowserState.shieldsStats.trackersBlocked) || 0;

    if (this.controlGroup) {
      if (isShieldOn) {
        this.controlGroup.classList.remove('shield-off');
      } else {
        this.controlGroup.classList.add('shield-off');
      }
    }

    if (this.shieldBtn) {
      if (isShieldOn) {
        this.shieldBtn.classList.remove('shield-off');
      } else {
        this.shieldBtn.classList.add('shield-off');
      }
    }

    if (this.powerBtn) {
      if (isShieldOn) {
        this.powerBtn.classList.remove('paused');
        this.powerBtn.title = `Coador ATIVO em ${domain} — Clique para desativar e acessar sites com bloqueio de AdBlock`;
        this.powerBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`;
      } else {
        this.powerBtn.classList.add('paused');
        this.powerBtn.title = `Coador DESATIVADO em ${domain} — Clique para reativar proteção`;
        this.powerBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M18.36 6.64a9 9 0 0 1-.95 11.75M6.64 6.64a9 9 0 0 0 .95 11.75"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`;
      }
    }

    if (this.shieldBadge) {
      if (isShieldOn) {
        this.shieldBadge.textContent = tab.blockedOnPage || 0;
        this.shieldBadge.classList.remove('paused');
        this.shieldBadge.style.display = (tab.blockedOnPage > 0) ? 'inline-block' : 'none';
      } else {
        this.shieldBadge.textContent = 'OFF';
        this.shieldBadge.classList.add('paused');
        this.shieldBadge.style.display = 'inline-block';
      }
    }

    if (this.statusBadge) {
      if (isShieldOn) {
        this.statusBadge.textContent = t('coador_active', 'ATIVO');
        this.statusBadge.classList.remove('paused');
      } else {
        this.statusBadge.textContent = t('coador_paused', 'DESATIVADO');
        this.statusBadge.classList.add('paused');
      }
    }

    if (this.trackersCount) {
      this.trackersCount.textContent = isShieldOn ? (tab.blockedOnPage || 0) : `0 (${t('coador_paused', 'Pausado')})`;
    }

    if (this.totalCount) {
      this.totalCount.textContent = totalBlocked;
    }

    if (this.currentDomainText) {
      this.currentDomainText.textContent = domain;
    }

    if (this.pauseSiteText) {
      this.pauseSiteText.textContent = isSitePaused ? t('coador_resume_site', 'Retomar o Coador neste site') : t('coador_pause_site', 'Desativar o Coador neste site (Liberar)');
    }

    if (this.pauseGlobalText) {
      this.pauseGlobalText.textContent = this.isPausedGlobal ? t('coador_resume_global', 'Retomar em todos os sites') : t('coador_pause_global', 'Pausar em todos os sites');
    }
  }
}

window.CoffeeShields = new CoffeeShieldsController();
