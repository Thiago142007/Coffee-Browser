/**
 * Coffee Browser Intelligent Omnibox (Address & Real Search Bar)
 */

class CoffeeOmniboxManager {
  constructor() {
    this.input = document.getElementById('omnibox-input');
    this.dropdown = document.getElementById('omnibox-dropdown');
    this.securityBadge = document.getElementById('omnibox-security');
    this.backBtn = document.getElementById('nav-back-btn');
    this.forwardBtn = document.getElementById('nav-forward-btn');
    this.refreshBtn = document.getElementById('nav-refresh-btn');
    this.homeBtn = document.getElementById('nav-home-btn');
    this.zoomBtn = document.getElementById('omnibox-zoom-btn');
    this.zoomText = document.getElementById('omnibox-zoom-text');
    this.zoomPopover = document.getElementById('zoom-popover');
    this.zoomPopoverValue = document.getElementById('zoom-popover-value');

    this.selectedIndex = -1;
    this.debounceTimer = null;
    this.currentRequestId = 0;
    this.bindEvents();
  }

  getInternalCommands() {
    const t = (k, fb) => window.CoffeeI18n ? window.CoffeeI18n.t(k, fb) : fb;
    return [
      { text: 'cafe://newtab', desc: t('new_tab', 'Nova Aba'), iconType: 'home' },
      { text: 'cafe://shields', desc: t('settings_shields_title', 'Escudos e Privacidade'), iconType: 'shield' },
      { text: 'cafe://settings', desc: t('settings', 'Configurações do Navegador'), iconType: 'settings' },
      { text: 'cafe://terminal', desc: 'Terminal CLI', iconType: 'terminal' },
      { text: 'cafe://history', desc: t('history_title', 'Histórico'), iconType: 'clock' },
      { text: 'cafe://bookmarks', desc: t('bookmarks_title', 'Favoritos'), iconType: 'star' },
      { text: 'cafe://downloads', desc: t('downloads_title', 'Downloads'), iconType: 'download' },
      { text: 'cafe://docs', desc: 'Documentação', iconType: 'bookOpen' },
      { text: 'cafe://vitals', desc: 'Web Vitals', iconType: 'zap' }
    ];
  }

  bindEvents() {
    if (this.input) {
      this.input.addEventListener('input', () => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.onInput(), 100);
      });

      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const items = this.dropdown ? this.dropdown.querySelectorAll('.dropdown-item') : [];
          if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
            items[this.selectedIndex].click();
          } else {
            this.closeDropdown();
            this.navigateFromInput(this.input.value);
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.moveSelection(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.moveSelection(-1);
        } else if (e.key === 'Escape') {
          this.closeDropdown();
          if (this.input) this.input.blur();
        }
      });

      this.input.addEventListener('focus', () => {
        this.input.select();
        this.onInput();
      });
    }

    if (this.backBtn) {
      this.backBtn.addEventListener('click', () => this.goBack());
    }
    if (this.forwardBtn) {
      this.forwardBtn.addEventListener('click', () => this.goForward());
    }
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', () => this.refreshOrStop());
    }
    if (this.zoomBtn) {
      this.zoomBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleZoomPopover();
      });
    }

    document.addEventListener('click', (e) => {
      if (this.dropdown && !this.dropdown.contains(e.target) && !this.input.contains(e.target)) {
        this.closeDropdown();
      }
      if (this.zoomPopover && !this.zoomPopover.contains(e.target) && (!this.zoomBtn || !this.zoomBtn.contains(e.target))) {
        this.zoomPopover.style.display = 'none';
      }
    });

    window.BrowserState.on('tabChanged', () => {
      this.closeDropdown();
      this.updateUI();
    });

    window.BrowserState.on('tabNavigated', () => {
      this.closeDropdown();
      this.updateUI();
    });

    window.BrowserState.on('zoomChanged', () => {
      this.updateZoomUI();
    });
  }

  moveSelection(delta) {
    if (!this.dropdown || !this.dropdown.classList.contains('open')) return;
    const items = this.dropdown.querySelectorAll('.dropdown-item');
    if (items.length === 0) return;

    items.forEach(el => el.classList.remove('selected'));
    this.selectedIndex = (this.selectedIndex + delta + items.length) % items.length;
    items[this.selectedIndex].classList.add('selected');
    items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
  }

  async onInput() {
    if (!this.input || document.activeElement !== this.input) {
      this.closeDropdown();
      return;
    }

    const raw = this.input.value;
    const query = raw.trim().toLowerCase();
    if (!query) {
      this.closeDropdown();
      return;
    }

    const reqId = ++this.currentRequestId;
    this.selectedIndex = -1;
    let html = '';

    // 1. Match History & Frequently Visited URLs
    const historyList = (window.BrowserState && window.BrowserState.history) || [];
    const historyMatches = historyList
      .filter(h => h.url.toLowerCase().includes(query) || (h.title && h.title.toLowerCase().includes(query)))
      .sort((a, b) => (b.visitCount || 1) - (a.visitCount || 1))
      .slice(0, 4);

    if (historyMatches.length > 0) {
      html += `
        <div class="dropdown-section-title">Histórico & Frequentes</div>
        ${historyMatches.map(h => `
          <div class="dropdown-item" onclick="window.CoffeeOmnibox.selectSuggestion('${h.url.replace(/'/g, "\\'")}')">
            <span class="icon" style="display:flex; color:var(--amber);">${window.Icons.clock}</span>
            <div style="display:flex; flex-direction:column; gap:2px; overflow:hidden; flex:1;">
              <span style="font-weight:600; color:var(--crema); font-size:12px;">${h.title || h.url}</span>
              <span style="font-family:'Fira Code', monospace; font-size:10.5px; color:var(--caramel); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${h.url}</span>
            </div>
            <span style="font-size:10px; color:var(--mut); font-weight:600; padding:2px 6px; background:var(--elev); border-radius:4px; margin-left:8px;">${h.visitCount || 1}x</span>
          </div>
        `).join('')}
      `;
    }

    // 2. Internal System Pages
    const internalCommands = this.getInternalCommands();
    const matches = internalCommands.filter(c => c.text.includes(query) || c.desc.toLowerCase().includes(query));
    if (matches.length > 0) {
      html += `
        <div class="dropdown-section-title">Páginas do Sistema</div>
        ${matches.map(m => {
          const icon = window.Icons[m.iconType] || window.Icons.globe;
          return `
            <div class="dropdown-item" onclick="window.CoffeeOmnibox.selectSuggestion('${m.text}')">
              <span class="icon" style="display:flex;">${icon}</span>
              <span><strong>${m.text}</strong> — ${m.desc}</span>
            </div>
          `;
        }).join('')}
      `;
    }

    const suggestions = await window.SearchEngine.fetchLiveSuggestions(raw);

    // If a new input came in or user navigated / blurred, cancel this render!
    if (reqId !== this.currentRequestId || document.activeElement !== this.input || !this.input.value.trim()) {
      return;
    }

    html += `
      <div class="dropdown-section-title">Pesquisa na Web</div>
      <div class="dropdown-item" onclick="window.CoffeeOmnibox.navigateFromInput('${encodeURIComponent(raw)}')">
        <span class="icon" style="display:flex;">${window.Icons.search}</span>
        <span>Pesquisar "<strong>${raw}</strong>" no ${window.BrowserState.searchEngine || 'Google'}</span>
      </div>
      ${suggestions.map(s => `
        <div class="dropdown-item" onclick="window.CoffeeOmnibox.navigateFromInput('${encodeURIComponent(s)}')">
          <span class="icon" style="display:flex;">${window.Icons.search}</span>
          <span>${s}</span>
        </div>
      `).join('')}
    `;

    this.dropdown.innerHTML = html;
    this.dropdown.style.display = 'block';
    this.dropdown.classList.add('open');
  }

  selectSuggestion(url) {
    this.input.value = url;
    this.closeDropdown();
    this.navigateFromInput(url);
  }

  closeDropdown() {
    this.currentRequestId++;
    this.selectedIndex = -1;
    if (this.dropdown) {
      this.dropdown.classList.remove('open');
      this.dropdown.style.display = 'none';
      this.dropdown.innerHTML = '';
    }
  }

  navigateFromInput(rawInput) {
    this.closeDropdown();
    if (this.input) this.input.blur();

    let text = (rawInput || '').trim();
    if (!text) return;

    try {
      text = decodeURIComponent(text);
    } catch(e) {}

    let targetUrl = window.CoffeeTabs && typeof window.CoffeeTabs.normalizeNavigationUrl === 'function'
      ? window.CoffeeTabs.normalizeNavigationUrl(text)
      : text;

    window.CoffeeTabs.navigateActiveTab(targetUrl);
  }

  goBack() {
    this.closeDropdown();
    const activeWebview = window.CoffeeTabs.getActiveWebview();
    if (activeWebview && typeof activeWebview.goBack === 'function' && activeWebview.canGoBack()) {
      activeWebview.goBack();
      return;
    }

    const tab = window.BrowserState.getActiveTab();
    if (tab && tab.historyIndex > 0) {
      tab.historyIndex--;
      window.CoffeeTabs.navigateActiveTab(tab.history[tab.historyIndex]);
    }
  }

  goForward() {
    this.closeDropdown();
    const activeWebview = window.CoffeeTabs.getActiveWebview();
    if (activeWebview && typeof activeWebview.goForward === 'function' && activeWebview.canGoForward()) {
      activeWebview.goForward();
      return;
    }

    const tab = window.BrowserState.getActiveTab();
    if (tab && tab.historyIndex < tab.history.length - 1) {
      tab.historyIndex++;
      window.CoffeeTabs.navigateActiveTab(tab.history[tab.historyIndex]);
    }
  }

  refreshOrStop() {
    this.closeDropdown();
    const tab = window.BrowserState.getActiveTab();
    const activeWebview = window.CoffeeTabs.getActiveWebview();

    if (activeWebview) {
      if (tab && tab.isLoading) {
        if (typeof activeWebview.stop === 'function') activeWebview.stop();
      } else {
        if (typeof activeWebview.reload === 'function') activeWebview.reload();
      }
    } else {
      window.CoffeeTabs.refreshActiveTab();
    }
  }

  setLoadingState(isLoading) {
    if (this.refreshBtn) {
      this.refreshBtn.innerHTML = isLoading ? window.Icons.close : window.Icons.rotateCw;
      this.refreshBtn.title = isLoading ? 'Parar Carregamento' : 'Recarregar Página';
    }
  }

  updateNavButtons(webview) {
    if (!webview) return;
    try {
      if (this.backBtn && typeof webview.canGoBack === 'function') {
        this.backBtn.disabled = !webview.canGoBack();
      }
      if (this.forwardBtn && typeof webview.canGoForward === 'function') {
        this.forwardBtn.disabled = !webview.canGoForward();
      }
    } catch(e) {}
  }

  updateZoomUI() {
    const tab = window.BrowserState.getActiveTab();
    if (!tab) return;

    const zoom = tab.zoomFactor || 1.0;
    const percentage = Math.round(zoom * 100);

    if (this.zoomBtn) {
      if (percentage !== 100) {
        this.zoomBtn.style.display = 'inline-flex';
        if (this.zoomText) this.zoomText.textContent = `${percentage}%`;
      } else {
        this.zoomBtn.style.display = 'none';
        if (this.zoomPopover) this.zoomPopover.style.display = 'none';
      }
    }

    if (this.zoomPopoverValue) {
      this.zoomPopoverValue.textContent = `${percentage}%`;
    }
  }

  toggleZoomPopover() {
    if (!this.zoomPopover) return;
    const isVisible = this.zoomPopover.style.display === 'flex' || this.zoomPopover.style.display === 'block';
    this.zoomPopover.style.display = isVisible ? 'none' : 'flex';
    this.updateZoomUI();
  }

  updateUI() {
    const tab = window.BrowserState.getActiveTab();
    if (!tab) return;

    if (this.input) {
      this.input.value = tab.url;
    }

    if (this.securityBadge) {
      if (tab.url.startsWith('cafe://')) {
        this.securityBadge.className = 'omnibox-security internal';
        this.securityBadge.innerHTML = `${window.Icons.lock} <span>Sistema</span>`;
      } else if (tab.url.startsWith('https://')) {
        this.securityBadge.className = 'omnibox-security';
        this.securityBadge.innerHTML = `${window.Icons.lock} <span>Seguro</span>`;
      } else {
        this.securityBadge.className = 'omnibox-security insecure';
        this.securityBadge.innerHTML = `${window.Icons.lockOpen} <span>Inseguro</span>`;
      }
    }

    this.updateZoomUI();

    const activeWebview = window.CoffeeTabs.getActiveWebview();
    if (activeWebview) {
      this.updateNavButtons(activeWebview);
    } else {
      if (this.backBtn) this.backBtn.disabled = !(tab.historyIndex > 0);
      if (this.forwardBtn) this.forwardBtn.disabled = !(tab.historyIndex < tab.history.length - 1);
    }
  }
}

window.CoffeeOmnibox = new CoffeeOmniboxManager();
