/**
 * Coffee Browser Intelligent Omnibox & Smart Autocomplete Engine
 * Real-time History, Bookmarks & Web Search Predictor
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
    this.activeInput = this.input;

    this.bindGlobalEvents();
    if (this.input) {
      this.attachSmartAutocomplete(this.input, false);
    }
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

  /**
   * Predict best link or domain based on History, Bookmarks, and System Pages
   * @param {string} userTyped 
   * @returns {{ fullText: string, originalUrl: string, title?: string, type: string } | null}
   */
  findBestMatch(userTyped) {
    if (!userTyped || typeof userTyped !== 'string') return null;
    const query = userTyped.trim().toLowerCase();
    if (query.length === 0) return null;

    const candidates = [];

    // 1. Browsing History
    const historyList = (window.BrowserState && window.BrowserState.history) || [];
    for (const h of historyList) {
      if (!h || !h.url) continue;
      const url = h.url.trim();
      if (url.startsWith('about:blank') || url === 'cafe://newtab' || url === '') continue;

      let clean = url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
      if (clean.endsWith('/')) clean = clean.slice(0, -1);

      let domain = clean.split('/')[0];
      const visits = h.visitCount || 1;
      const score = visits * 15 + (h.time ? Math.min(20, Math.round((Date.now() - h.time) / 86400000)) : 0);

      // Match domain prefix (e.g. "yo" -> "youtube.com")
      if (domain.toLowerCase().startsWith(query)) {
        candidates.push({
          fullText: domain,
          originalUrl: url.startsWith('http') ? `https://${domain}` : url,
          title: h.title,
          score: score + 120,
          type: 'history-domain'
        });
      }

      // Match full path (e.g. "github.com/th" -> "github.com/Thiago142007")
      if (clean.toLowerCase().startsWith(query) && clean.toLowerCase() !== domain.toLowerCase()) {
        candidates.push({
          fullText: clean,
          originalUrl: url,
          title: h.title,
          score: score + 90,
          type: 'history-url'
        });
      }

      // Match internal protocol (e.g. "cafe://set" -> "cafe://settings")
      if (url.toLowerCase().startsWith(query)) {
        candidates.push({
          fullText: url,
          originalUrl: url,
          title: h.title,
          score: score + 100,
          type: 'internal'
        });
      }
    }

    // 2. Bookmarks
    const bookmarks = (window.BrowserState && window.BrowserState.bookmarks) || [];
    for (const b of bookmarks) {
      if (!b || !b.url) continue;
      let clean = b.url.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
      if (clean.endsWith('/')) clean = clean.slice(0, -1);
      let domain = clean.split('/')[0];

      if (domain.toLowerCase().startsWith(query)) {
        candidates.push({
          fullText: domain,
          originalUrl: b.url,
          title: b.title,
          score: 110,
          type: 'bookmark'
        });
      } else if (clean.toLowerCase().startsWith(query)) {
        candidates.push({
          fullText: clean,
          originalUrl: b.url,
          title: b.title,
          score: 85,
          type: 'bookmark'
        });
      }
    }

    // 3. System Pages
    const internalCommands = this.getInternalCommands();
    for (const cmd of internalCommands) {
      if (cmd.text.toLowerCase().startsWith(query)) {
        candidates.push({
          fullText: cmd.text,
          originalUrl: cmd.text,
          title: cmd.desc,
          score: 115,
          type: 'system'
        });
      }
    }

    // 4. Common top websites fallback (for instant out-of-the-box convenience)
    const commonDomains = [
      'google.com', 'youtube.com', 'github.com', 'wikipedia.org', 'reddit.com',
      'twitter.com', 'instagram.com', 'facebook.com', 'discord.com', 'netflix.com',
      'amazon.com', 'linkedin.com', 'whatsapp.com', 'twitch.tv', 'spotify.com',
      'globo.com', 'uol.com.br', 'g1.globo.com'
    ];
    for (const d of commonDomains) {
      if (d.startsWith(query)) {
        candidates.push({
          fullText: d,
          originalUrl: `https://${d}`,
          title: d,
          score: 30,
          type: 'common'
        });
      }
    }

    if (candidates.length === 0) return null;

    // Sort by highest score first
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  /**
   * Attach smart history guessing, inline completion, and key navigation to any input
   * @param {HTMLInputElement} inputEl 
   * @param {boolean} isNewTab 
   */
  attachSmartAutocomplete(inputEl, isNewTab = false) {
    if (!inputEl || inputEl._hasSmartAutocomplete) return;
    inputEl._hasSmartAutocomplete = true;
    inputEl._isDeleting = false;
    inputEl._userTypedPrefix = '';

    inputEl.addEventListener('keydown', (e) => {
      // Enter: Accept autocomplete and navigate/search immediately!
      if (e.key === 'Enter') {
        e.preventDefault();
        const items = this.dropdown ? this.dropdown.querySelectorAll('.dropdown-item') : [];
        if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
          items[this.selectedIndex].click();
        } else {
          this.closeDropdown();
          this.navigateFromInput(inputEl.value);
        }
        return;
      }

      // Tab or ArrowRight: Accept the inline suggested completion
      if (e.key === 'Tab' || e.key === 'ArrowRight') {
        const start = inputEl.selectionStart;
        const end = inputEl.selectionEnd;
        const len = inputEl.value.length;

        // If autocomplete text is currently selected at the end
        if (start < end && end === len) {
          e.preventDefault();
          // Move cursor to the end and clear selection so user can continue typing
          inputEl.setSelectionRange(len, len);
          inputEl._userTypedPrefix = inputEl.value;
          return;
        }
      }

      // ArrowDown / ArrowUp: Dropdown navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.moveSelection(1);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.moveSelection(-1);
        return;
      }

      // Escape: Revert autocomplete and close dropdown
      if (e.key === 'Escape') {
        this.closeDropdown();
        if (inputEl._userTypedPrefix && inputEl.value !== inputEl._userTypedPrefix) {
          inputEl.value = inputEl._userTypedPrefix;
        }
        inputEl.blur();
        return;
      }

      // Backspace / Delete: Mark deleting state so autocomplete doesn't immediately re-fill
      if (e.key === 'Backspace' || e.key === 'Delete') {
        inputEl._isDeleting = true;
        // If selection exists at end, remove the selection and let backspace proceed cleanly
        const start = inputEl.selectionStart;
        const end = inputEl.selectionEnd;
        if (start < end && end === inputEl.value.length) {
          e.preventDefault();
          inputEl.value = inputEl.value.slice(0, start);
          inputEl._userTypedPrefix = inputEl.value;
          this.onInput(inputEl);
          return;
        }
      }
    });

    inputEl.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);

      if (inputEl._isDeleting) {
        inputEl._isDeleting = false;
        inputEl._userTypedPrefix = inputEl.value;
        this.debounceTimer = setTimeout(() => this.onInput(inputEl), 80);
        return;
      }

      // Calculate what the user actually typed
      let typed = inputEl.value;
      if (inputEl.selectionStart !== null && inputEl.selectionStart < inputEl.selectionEnd) {
        typed = inputEl.value.slice(0, inputEl.selectionStart);
      }
      inputEl._userTypedPrefix = typed;

      // Smart Inline History Autocomplete
      if (typed.trim().length > 0) {
        const bestMatch = this.findBestMatch(typed);
        if (bestMatch && bestMatch.fullText) {
          const matchText = bestMatch.fullText;
          if (matchText.toLowerCase().startsWith(typed.toLowerCase()) && matchText.length > typed.length) {
            const remainder = matchText.slice(typed.length);
            const fullVal = typed + remainder;
            inputEl.value = fullVal;
            inputEl.setSelectionRange(typed.length, fullVal.length);
          }
        }
      }

      this.debounceTimer = setTimeout(() => this.onInput(inputEl), 80);
    });

    inputEl.addEventListener('focus', () => {
      this.activeInput = inputEl;
      inputEl.select();
      if (inputEl.value.trim()) {
        this.onInput(inputEl);
      }
    });
  }

  bindGlobalEvents() {
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

    if (window.BrowserState) {
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

  async onInput(targetInput) {
    const inputEl = targetInput || this.activeInput || this.input;
    if (!inputEl || document.activeElement !== inputEl) {
      this.closeDropdown();
      return;
    }

    // Use user-typed prefix if selection exists
    let raw = inputEl.value;
    if (inputEl.selectionStart !== null && inputEl.selectionStart < inputEl.selectionEnd) {
      raw = inputEl.value.slice(0, inputEl.selectionStart);
    }

    const query = raw.trim().toLowerCase();
    if (!query) {
      this.closeDropdown();
      return;
    }

    const reqId = ++this.currentRequestId;
    this.selectedIndex = -1;
    let html = '';

    // 1. History & Frequently Visited
    const historyList = (window.BrowserState && window.BrowserState.history) || [];
    const historyMatches = historyList
      .filter(h => h.url.toLowerCase().includes(query) || (h.title && h.title.toLowerCase().includes(query)))
      .sort((a, b) => (b.visitCount || 1) - (a.visitCount || 1))
      .slice(0, 4);

    if (historyMatches.length > 0) {
      html += `
        <div class="dropdown-section-title">Histórico & Sugestões</div>
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

    // 3. Live Web Search Engine Suggestions
    let suggestions = [];
    if (window.SearchEngine && typeof window.SearchEngine.fetchLiveSuggestions === 'function') {
      try {
        suggestions = await window.SearchEngine.fetchLiveSuggestions(raw);
      } catch(e) {}
    }

    // Cancel render if a newer request came in
    if (reqId !== this.currentRequestId || document.activeElement !== inputEl || !inputEl.value.trim()) {
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

    if (this.dropdown) {
      this.dropdown.innerHTML = html;
      this.dropdown.style.display = 'block';
      this.dropdown.classList.add('open');
    }
  }

  selectSuggestion(url) {
    if (this.input) this.input.value = url;
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
      this.input._userTypedPrefix = tab.url;
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
