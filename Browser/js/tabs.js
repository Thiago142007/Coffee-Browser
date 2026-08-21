/**
 * Coffee Browser Professional Multi-Tab Manager
 * Persistent per-tab isolated WebView architecture
 */

class CoffeeTabsManager {
  constructor() {
    this.tabStrip = document.getElementById('tab-strip');
    this.webviewContainer = document.getElementById('webview-container');
    this.loadingBar = document.getElementById('page-loading-bar');
    this.init();
  }

  init() {
    if (window.BrowserState && Array.isArray(window.BrowserState.tabs)) {
      window.BrowserState.tabs.forEach(tab => {
        this.createTabView(tab);
      });
    }
    this.renderTabs();
    this.showActiveTab();
    this.setupZoomListener();

    if (window.BrowserState) {
      window.BrowserState.on('languageChanged', () => {
        window.BrowserState.tabs.forEach(t => this.updateTabMetadata(t));
        this.renderTabs();
      });
    }
  }

  createTab(url = 'cafe://newtab', isPrivate = false) {
    const id = 'tab-' + Date.now() + '-' + Math.floor(Math.random()*1000);
    const t = (k, fb) => window.CoffeeI18n ? window.CoffeeI18n.t(k, fb) : fb;
    const newTab = {
      id: id,
      title: isPrivate ? t('private_tab', 'Aba Privada') : t('new_tab', 'Nova Aba'),
      url: url,
      iconType: isPrivate ? 'incognito' : 'globe',
      faviconUrl: this.getFaviconUrl(url),
      isLoading: false,
      isPinned: false,
      isPrivate: isPrivate,
      history: [url],
      historyIndex: 0,
      workspace: 'Principal',
      readerMode: false,
      blockedOnPage: 0,
      isOpening: true,
      zoomFactor: 1.0
    };

    window.BrowserState.tabs.push(newTab);
    window.BrowserState.activeTabId = id;

    // Create persistent DOM view for this tab
    this.createTabView(newTab);

    this.renderTabs();
    this.showActiveTab();
    this.saveSessionSnapshot();
    window.BrowserState.emit('tabChanged', newTab);

    if (window.CoffeeOmnibox) {
      window.CoffeeOmnibox.updateUI();
    }
    return newTab;
  }

  openSettings(section = '') {
    const targetUrl = 'cafe://settings';

    // 1. If an existing tab already has settings open, switch directly to it
    const existingTab = window.BrowserState.tabs.find(t => t.url && (t.url.startsWith('cafe://settings') || t.url.startsWith('cafe://configuracoes')));
    if (existingTab) {
      this.switchTab(existingTab.id);
      if (section && typeof window.showSettingsSection === 'function') {
        window.showSettingsSection(section);
      }
      return existingTab;
    }

    // 2. If the current active tab is completely blank (newtab with no prior history), navigate it
    const activeTab = window.BrowserState.getActiveTab();
    if (activeTab && (activeTab.url === 'cafe://newtab' || activeTab.url === 'about:blank' || !activeTab.url) && (!activeTab.history || activeTab.history.length <= 1)) {
      this.navigateActiveTab(targetUrl);
      if (section && typeof window.showSettingsSection === 'function') {
        setTimeout(() => window.showSettingsSection(section), 50);
      }
      return activeTab;
    }

    // 3. Otherwise (active tab has a website or content loaded), open a brand new tab with Settings!
    const newTab = this.createTab(targetUrl);
    if (section && typeof window.showSettingsSection === 'function') {
      setTimeout(() => window.showSettingsSection(section), 50);
    }
    return newTab;
  }

  createTabView(tab) {
    if (!this.webviewContainer || !tab) return;

    let view = document.getElementById(`tab-view-${tab.id}`);
    if (!view) {
      view = document.createElement('div');
      view.id = `tab-view-${tab.id}`;
      view.className = 'tab-content-view';
      this.webviewContainer.appendChild(view);
    }

    this.renderTabContent(tab, view);
  }

  normalizeNavigationUrl(raw) {
    if (!raw) return 'cafe://newtab';
    let text = String(raw).trim();

    // Check if user already typed protocol (case-insensitive)
    if (/^(https?|cafe|file|about|chrome):\/\//i.test(text) || /^about:/i.test(text)) {
      return text;
    }

    // Fix double protocol prefixes like "https://https://"
    if (text.toLowerCase().startsWith('https://http://') || text.toLowerCase().startsWith('https://https://')) {
      return text.replace(/^https:\/\/(https?:\/\/)/i, '$1');
    }

    // Check if input looks like a domain name, IP address, or localhost
    const isDomain = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(text) ||
                     /^localhost(:\d+)?(\/.*)?$/i.test(text) ||
                     /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?(\/.*)?$/i.test(text) ||
                     (text.includes('.') && !text.includes(' ') && !text.endsWith('.'));

    if (isDomain) {
      return `https://${text}`;
    }

    // Otherwise, treat as search query
    if (window.SearchEngine && typeof window.SearchEngine.getSearchUrl === 'function') {
      return window.SearchEngine.getSearchUrl(text);
    }
    return `https://www.google.com/search?q=${encodeURIComponent(text)}`;
  }

  navigateActiveTab(url) {
    const tab = window.BrowserState.getActiveTab();
    if (!tab) return;

    const normalized = this.normalizeNavigationUrl(url);
    tab.url = normalized;
    tab.title = normalized.startsWith('cafe://') ? window.CoffeePagesRenderer.getInternalTitle(normalized) : normalized;

    // Check if settings tab is active
    if (normalized.startsWith('cafe://settings')) {
      window.BrowserState.updateTabTitle(tab.id, 'Configurações');
    }

    this.renderTabsUI();
    this.updateOmnibox();

    const view = document.getElementById(`web-view-${tab.id}`);
    if (!view) return;

    const currentUrl = tab.url || 'cafe://newtab';

    // Internal Pages
    if (currentUrl.startsWith('cafe://') || currentUrl.startsWith('about:blank') || currentUrl === '') {
      view.innerHTML = window.CoffeePagesRenderer.render(currentUrl, tab);
      
      const ntInput = view.querySelector('#nt-search-input');
      if (ntInput) {
        ntInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            window.CoffeeOmnibox.navigateFromInput(ntInput.value);
          }
        });
      }
      if (currentUrl.startsWith('cafe://terminal') && window.CoffeeTerminal) {
        window.CoffeeTerminal.initDOM();
      }
      return;
    }

    // Real Web Pages
    let target = this.normalizeNavigationUrl(currentUrl);

    if (window.CoffeeBookmarks) {
      window.CoffeeBookmarks.updateVisibility(target);
    }

    view.innerHTML = `
      <div class="webpage-live-wrapper" style="width:100%; height:100%; position:relative; background:#120A06;">
        <webview
          id="webview-${tab.id}"
          src="${target}"
          class="tab-webview"
          allowpopups
          webpreferences="contextIsolation=false, allowRunningInsecureContent=true">
        </webview>
      </div>
    `;

    // Attach WebView Event Listeners
    const webview = view.querySelector(`#webview-${tab.id}`);
    if (webview) {
      this.attachWebViewEvents(webview, tab);
    }
  }

  renderTabContent(tab, viewElement) {
    let view = viewElement || document.getElementById(`tab-view-${tab.id}`);
    if (!view) {
      this.createTabView(tab);
      view = document.getElementById(`tab-view-${tab.id}`);
    }
    if (!view) return;

    const url = tab.url || 'cafe://newtab';

    // Internal Pages
    if (url.startsWith('cafe://') || url.startsWith('about:blank') || url === '') {
      view.innerHTML = window.CoffeePagesRenderer.render(url, tab);
      
      const ntInput = view.querySelector('#nt-search-input');
      if (ntInput) {
        ntInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            window.CoffeeOmnibox.navigateFromInput(ntInput.value);
          }
        });
      }
      if (url.startsWith('cafe://terminal') && window.CoffeeTerminal) {
        window.CoffeeTerminal.initDOM();
      }
      return;
    }

    // Real Web Pages
    let target = this.normalizeNavigationUrl(url);

    if (window.CoffeeBookmarks) {
      window.CoffeeBookmarks.updateVisibility(target);
    }

    view.innerHTML = `
      <div class="webpage-live-wrapper" style="width:100%; height:100%; position:relative; background:#120A06;">
        <webview
          id="webview-${tab.id}"
          src="${target}"
          class="tab-webview"
          allowpopups
          webpreferences="contextIsolation=false, allowRunningInsecureContent=true">
        </webview>
      </div>
    `;

    // Attach WebView Event Listeners
    const webview = view.querySelector(`#webview-${tab.id}`);
    if (webview) {
      this.attachWebViewEvents(webview, tab);
    }
  }

  attachWebViewEvents(webview, tab) {
    if (!webview) return;

    const injectPageListeners = () => {
      const isShieldActive = window.CoffeeShields ? window.CoffeeShields.isShieldActiveForUrl(tab.url) : true;
      webview.executeJavaScript(`
        (function() {
          // 0. Forçar Modo Escuro por Padrão em Todos os Sites
          try {
            if (!document.getElementById('__coffee_darkmode_engine')) {
              const dmStyle = document.createElement('style');
              dmStyle.id = '__coffee_darkmode_engine';
              dmStyle.textContent = \`
                :root, html {
                  color-scheme: dark !important;
                }
                meta[name="color-scheme"] {
                  content: dark !important;
                }
              \`;
              (document.head || document.documentElement).appendChild(dmStyle);

              if (!document.querySelector('meta[name="color-scheme"]')) {
                const meta = document.createElement('meta');
                meta.name = 'color-scheme';
                meta.content = 'dark';
                (document.head || document.documentElement).appendChild(meta);
              }
            }
          } catch(e) {}

          // 1. Injetar Regras Cosméticas do Coador APENAS SE ESTIVER ATIVO NESTE SITE
          if (${isShieldActive}) {
            if (!document.getElementById('__coador_adblock_css')) {
              const style = document.createElement('style');
              style.id = '__coador_adblock_css';
              style.textContent = \`
                .ad, .ads, .advertisement, .ad-banner, .ad-container, .ad-box,
                [id^="google_ads"], [id^="ad-"], [id^="gpt-ad"], [id*="ad_slot"],
                [class*="sponsored"], [class*="ad-banner"], [class*="ad_container"],
                [class*="advertisement"], iframe[src*="doubleclick"], iframe[src*="googleadservices"],
                iframe[src*="googlesyndication"], iframe[src*="taboola"], iframe[src*="outbrain"],
                .ytp-ad-module, .ytp-ad-player-overlay, .ytp-ad-overlay-container,
                .video-ads, #player-ads, ytd-ad-slot-renderer, ytd-promoted-sparkles-web-renderer,
                ytd-banner-promo-renderer, ytd-in-feed-ad-layout-renderer {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  opacity: 0 !important;
                  pointer-events: none !important;
                }
              \`;
              (document.head || document.documentElement).appendChild(style);
            }

            // 2. Coador YouTube & Video AdBlock Engine (Brave & uBlock Level)
            (function setupYouTubeAdBlock() {
              try {
                if (window.ytInitialPlayerResponse) {
                  delete window.ytInitialPlayerResponse.adPlacements;
                  delete window.ytInitialPlayerResponse.playerAds;
                  delete window.ytInitialPlayerResponse.adSlots;
                }
              } catch(e) {}

              function cleanYouTubeAds() {
                try {
                  // 1. Click all skip buttons immediately
                  const skipSelectors = [
                    '.ytp-ad-skip-button',
                    '.ytp-ad-skip-button-modern',
                    '.ytp-skip-ad-button',
                    '.ytp-ad-skip-button-slot',
                    '.videoAdUiSkipButton',
                    '.ytp-ad-overlay-close-button',
                    'button.ytp-ad-skip-button-modern',
                    '.ytp-ad-text.ytp-ad-skip-button-text'
                  ];
                  for (let i = 0; i < skipSelectors.length; i++) {
                    const btn = document.querySelector(skipSelectors[i]);
                    if (btn) {
                      btn.click();
                      break;
                    }
                  }

                  // 2. Detect ad on HTML5 video player strictly
                  const player = document.querySelector('.html5-video-player, #movie_player');
                  const video = document.querySelector('video.html5-main-video, video');
                  const isAdShowing = player && (
                    player.classList.contains('ad-showing') ||
                    player.classList.contains('ad-interrupting')
                  );

                  if (video && isAdShowing) {
                    video.muted = true;
                    video.playbackRate = 16;
                    // Only fast-forward short ad clips (less than 3 minutes)
                    if (video.duration && isFinite(video.duration) && video.duration < 180 && video.currentTime < video.duration) {
                      video.currentTime = video.duration;
                    }
                  } else if (video && !isAdShowing && video.playbackRate > 2) {
                    video.playbackRate = 1;
                    video.muted = false;
                  }

                  // 3. Remove cosmetic ad elements from DOM
                  const adElements = document.querySelectorAll(
                    'ytd-ad-slot-renderer, ytd-banner-promo-renderer, ytd-statement-banner-renderer, #player-ads, .ytp-ad-overlay-container'
                  );
                  adElements.forEach(el => el.remove());
                } catch(e) {}
              }

              // High frequency interval (50ms)
              if (!window.__coadorAdInterval) {
                window.__coadorAdInterval = setInterval(cleanYouTubeAds, 50);
              }

              // High performance MutationObserver
              if (!window.__coadorAdObserver && window.MutationObserver) {
                window.__coadorAdObserver = new MutationObserver(() => {
                  cleanYouTubeAds();
                });
                const targetNode = document.body || document.documentElement;
                if (targetNode) {
                  window.__coadorAdObserver.observe(targetNode, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class', 'src']
                  });
                }
              }

              // React to YouTube SPA navigation events
              ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated', 'spfdone'].forEach(evt => {
                window.addEventListener(evt, cleanYouTubeAds);
              });
            })();
          } else {
            // Se o Coador estiver desativado para este site, remover regras de bloqueio
            const adCss = document.getElementById('__coador_adblock_css');
            if (adCss) adCss.remove();
          }

          // 3. Anti-Adblock Defuser (Bypass de avisos e detecção de adblock)
          (function setupAntiAdblockDefuser() {
            try {
              window.canRunAds = true;
              window.isAdBlockActive = false;
              window.google_ad_status = 1;
              window.adsBlocked = false;

              // Neutralize common tracking/ad blocker testing stubs
              if (!window.ga) window.ga = function() {};
              if (!window.gtag) window.gtag = function() {};
              if (!window.fbq) window.fbq = function() {};
              if (!window.adsbygoogle) window.adsbygoogle = [];

              // Remove Anti-Adblock blocking modals & restore scroll
              const removeModals = () => {
                const antiAdblockModals = document.querySelectorAll(
                  '[class*="adblock-modal"], [id*="adblock-overlay"], [class*="adblock-backdrop"], [class*="paywall-overlay"], .tp-modal, .tp-backdrop, [id*="adblock-message"], [class*="ad-blocker-message"]'
                );
                antiAdblockModals.forEach(m => m.remove());
                if (document.body && (document.body.style.overflow === 'hidden' || document.documentElement.style.overflow === 'hidden')) {
                  document.body.style.overflow = 'auto';
                  document.documentElement.style.overflow = 'auto';
                }
              };
              removeModals();
              setInterval(removeModals, 1000);
            } catch(e) {}
          })();

          if (window.__coffeeListenersInjected) return;
          window.__coffeeListenersInjected = true;

          // Ctrl + Wheel Zoom
          window.addEventListener('wheel', function(e) {
            if (e.ctrlKey) {
              e.preventDefault();
              e.stopPropagation();
              var delta = e.deltaY < 0 ? 0.1 : -0.1;
              console.log('[COFFEE_ZOOM]:' + delta);
            }
          }, { passive: false, capture: true });

          // Mouse 4 (Back) & Mouse 5 (Forward)
          window.addEventListener('mouseup', function(e) {
            if (e.button === 3) {
              e.preventDefault();
              e.stopPropagation();
              console.log('[COFFEE_NAV]:back');
            } else if (e.button === 4) {
              e.preventDefault();
              e.stopPropagation();
              console.log('[COFFEE_NAV]:forward');
            }
          }, { passive: false, capture: true });

          // Intercept links targeted for new tab/window, Ctrl+Click or Middle-Click
          document.addEventListener('click', function(e) {
            var link = e.target.closest('a');
            if (!link || !link.href) return;
            var target = link.getAttribute('target');
            if (target === '_blank' || target === '_new' || e.ctrlKey || e.metaKey) {
              e.preventDefault();
              e.stopPropagation();
              window.open(link.href, '_blank');
            }
          }, true);

          window.addEventListener('auxclick', function(e) {
            if (e.button === 1) {
              var link = e.target.closest('a');
              if (link && link.href) {
                e.preventDefault();
                e.stopPropagation();
                window.open(link.href, '_blank');
              }
            } else if (e.button === 3 || e.button === 4) {
              e.preventDefault();
              e.stopPropagation();
            }
          }, { passive: false, capture: true });
        })();
      `).catch(function() {});
    };

    webview.addEventListener('console-message', (e) => {
      if (e.message) {
        if (e.message.startsWith('[COFFEE_ZOOM]:')) {
          const delta = parseFloat(e.message.replace('[COFFEE_ZOOM]:', ''));
          if (delta > 0) {
            this.zoomIn(tab);
          } else {
            this.zoomOut(tab);
          }
        } else if (e.message === '[COFFEE_NAV]:back') {
          if (window.CoffeeOmnibox) window.CoffeeOmnibox.goBack();
        } else if (e.message === '[COFFEE_NAV]:forward') {
          if (window.CoffeeOmnibox) window.CoffeeOmnibox.goForward();
        } else if (e.message.startsWith('[COFFEE_ADBLOCK_BLOCK_SELECTOR]:')) {
          const selector = e.message.replace('[COFFEE_ADBLOCK_BLOCK_SELECTOR]:', '').trim();
          if (selector && window.CoffeeShields) {
            const domain = window.CoffeeShields.getDomain(tab.url);
            if (!window.CoffeeShields.customRules[domain]) window.CoffeeShields.customRules[domain] = [];
            if (!window.CoffeeShields.customRules[domain].includes(selector)) {
              window.CoffeeShields.customRules[domain].push(selector);
              window.CoffeeShields.saveCustomRules();
            }
          }
        }
      }
    });

    webview.addEventListener('did-start-loading', () => {
      tab.isLoading = true;
      this.setLoadingProgress(true);
      if (window.CoffeeOmnibox) {
        window.CoffeeOmnibox.closeDropdown();
        if (window.BrowserState.activeTabId === tab.id) {
          window.CoffeeOmnibox.setLoadingState(true);
        }
      }
    });

    webview.addEventListener('dom-ready', () => {
      injectPageListeners();
      this.applyZoom(tab);
    });

    webview.addEventListener('did-finish-load', () => {
      injectPageListeners();
      this.applyZoom(tab);
    });

    webview.addEventListener('did-stop-loading', () => {
      tab.isLoading = false;
      this.setLoadingProgress(false);
      if (window.CoffeeOmnibox && window.BrowserState.activeTabId === tab.id) {
        window.CoffeeOmnibox.setLoadingState(false);
        window.CoffeeOmnibox.updateNavButtons(webview);
      }
    });

    webview.addEventListener('did-navigate', (e) => {
      tab.url = e.url;
      tab.faviconUrl = this.getFaviconUrl(e.url);
      this.updateTabMetadata(tab);
      this.renderTabs();
      injectPageListeners();
      this.applyZoom(tab);
      if (window.BrowserState) {
        window.BrowserState.addHistoryEntry({ url: tab.url, title: tab.title });
      }
      if (window.BrowserState.activeTabId === tab.id && window.CoffeeOmnibox) {
        window.CoffeeOmnibox.input.value = e.url;
        window.CoffeeOmnibox.updateUI();
        window.CoffeeOmnibox.updateNavButtons(webview);
      }
    });

    webview.addEventListener('did-navigate-in-page', (e) => {
      tab.url = e.url;
      this.updateTabMetadata(tab);
      injectPageListeners();
      this.applyZoom(tab);
      if (window.BrowserState) {
        window.BrowserState.addHistoryEntry({ url: tab.url, title: tab.title });
      }
      if (window.BrowserState.activeTabId === tab.id && window.CoffeeOmnibox) {
        window.CoffeeOmnibox.input.value = e.url;
        window.CoffeeOmnibox.updateUI();
        window.CoffeeOmnibox.updateNavButtons(webview);
      }
    });

    webview.addEventListener('page-title-updated', (e) => {
      if (e.title) {
        tab.title = e.title;
        this.renderTabs();
        if (window.BrowserState) {
          window.BrowserState.addHistoryEntry({ url: tab.url, title: tab.title });
        }
      }
    });

    webview.addEventListener('page-favicon-updated', (e) => {
      if (e.favicons && e.favicons.length > 0) {
        tab.faviconUrl = e.favicons[0];
        this.renderTabs();
      }
    });

    webview.addEventListener('new-window', (e) => {
      e.preventDefault();
      if (e.url && e.url !== 'about:blank') {
        this.createTab(e.url);
      }
    });
  }

  showActiveTab() {
    const activeId = window.BrowserState.activeTabId;
    const tab = window.BrowserState.getActiveTab();
    if (!tab) return;

    let activeView = document.getElementById(`tab-view-${activeId}`);
    if (!activeView) {
      this.createTabView(tab);
      activeView = document.getElementById(`tab-view-${activeId}`);
    }

    document.querySelectorAll('.tab-content-view').forEach(view => {
      if (view.id === `tab-view-${activeId}`) {
        view.classList.add('active');
        view.style.display = 'flex';
      } else {
        view.classList.remove('active');
        view.style.display = 'none';
      }
    });

    this.applyZoom(tab);

    const activeWebview = activeView ? activeView.querySelector(`#webview-${tab.id}`) : null;
    if (window.CoffeeOmnibox) {
      window.CoffeeOmnibox.updateUI();
      if (activeWebview) {
        window.CoffeeOmnibox.updateNavButtons(activeWebview);
      }
    }
  }

  setupZoomListener() {
    window.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const tab = window.BrowserState.getActiveTab();
        if (!tab) return;

        if (tab.zoomFactor === undefined) tab.zoomFactor = 1.0;

        if (e.deltaY < 0) {
          tab.zoomFactor = Math.min(3.0, Number((tab.zoomFactor + 0.1).toFixed(2)));
        } else if (e.deltaY > 0) {
          tab.zoomFactor = Math.max(0.3, Number((tab.zoomFactor - 0.1).toFixed(2)));
        }

        this.applyZoom(tab);
      }
    }, { passive: false });
  }

  zoomIn(targetTab) {
    const tab = targetTab || window.BrowserState.getActiveTab();
    if (!tab) return;
    if (tab.zoomFactor === undefined) tab.zoomFactor = 1.0;
    tab.zoomFactor = Math.min(3.0, Number((tab.zoomFactor + 0.1).toFixed(2)));
    this.applyZoom(tab);
  }

  zoomOut(targetTab) {
    const tab = targetTab || window.BrowserState.getActiveTab();
    if (!tab) return;
    if (tab.zoomFactor === undefined) tab.zoomFactor = 1.0;
    tab.zoomFactor = Math.max(0.3, Number((tab.zoomFactor - 0.1).toFixed(2)));
    this.applyZoom(tab);
  }

  resetZoom(targetTab) {
    const tab = targetTab || window.BrowserState.getActiveTab();
    if (!tab) return;
    tab.zoomFactor = 1.0;
    this.applyZoom(tab);
  }

  applyZoom(tab) {
    if (!tab) return;
    const zoom = tab.zoomFactor || 1.0;
    const view = document.getElementById(`tab-view-${tab.id}`);
    if (view) {
      const webview = view.querySelector(`#webview-${tab.id}`);
      if (webview) {
        // 1. Native Electron webview setZoomFactor
        try {
          if (typeof webview.setZoomFactor === 'function') {
            webview.setZoomFactor(zoom);
          }
        } catch(e) {}

        // 2. Native Electron webview setZoomLevel (0 is 100%, 1.2 is 120%, etc.)
        try {
          if (typeof webview.setZoomLevel === 'function') {
            const zoomLevel = Math.log(zoom) / Math.log(1.2);
            webview.setZoomLevel(zoomLevel);
          }
        } catch(e) {}

        // 3. Direct DOM in-page zoom style injection
        webview.executeJavaScript(`
          (function() {
            try {
              document.documentElement.style.zoom = '${zoom}';
              if (document.body) {
                document.body.style.zoom = '${zoom}';
              }
            } catch(e) {}
          })();
        `).catch(() => {});
      } else {
        view.style.zoom = zoom;
      }
    }

    if (window.BrowserState) {
      window.BrowserState.emit('zoomChanged', { tab, zoom });
    }
  }

  sanitizeUrlTracking(rawUrl) {
    if (!rawUrl || rawUrl.startsWith('cafe://') || rawUrl.startsWith('about:') || rawUrl.startsWith('file://')) {
      return rawUrl;
    }
    try {
      const urlObj = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      const trackingParams = [
        'fbclid', 'gclid', 'gbraid', 'wbraid', 'msclkid', 'mc_eid', 'igshid', 'yclid', 'dclid',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'utm_name',
        '_hsenc', '_hsmi', '_openstat', 'mkt_tok', 'wickedid'
      ];
      let modified = false;
      trackingParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.delete(param);
          modified = true;
        }
      });
      return modified ? urlObj.toString() : rawUrl;
    } catch(e) {
      return rawUrl;
    }
  }

  navigateActiveTab(rawUrl) {
    const tab = window.BrowserState.getActiveTab();
    if (!tab) return;

    // If navigating to settings while a webpage or content tab is active, open in a new tab instead of overwriting
    if (rawUrl && (rawUrl.startsWith('cafe://settings') || rawUrl.startsWith('cafe://configuracoes'))) {
      if (tab.url && !tab.url.startsWith('cafe://newtab') && !tab.url.startsWith('about:blank') && !tab.url.startsWith('cafe://settings')) {
        return this.openSettings();
      }
    }

    const url = this.sanitizeUrlTracking(rawUrl);
    tab.url = url;
    this.updateTabMetadata(tab);

    let view = document.getElementById(`tab-view-${tab.id}`);
    if (!view) {
      this.createTabView(tab);
      view = document.getElementById(`tab-view-${tab.id}`);
    }

    const isInternal = url.startsWith('cafe://') || url.startsWith('about:blank') || url === '';
    const activeWebview = view ? view.querySelector(`#webview-${tab.id}`) : null;

    if (isInternal) {
      this.renderTabContent(tab, view);
    } else {
      let target = this.normalizeNavigationUrl(url);

      if (activeWebview && typeof activeWebview.loadURL === 'function') {
        activeWebview.loadURL(target);
      } else {
        this.renderTabContent(tab, view);
      }
    }

    if (!tab.isPrivate) {
      window.BrowserState.history.unshift({
        url: url,
        title: tab.title,
        time: Date.now()
      });
      window.BrowserState.saveState();
    }

    this.renderTabs();
    this.showActiveTab();
    window.BrowserState.emit('tabNavigated', tab);
    window.BrowserState.emit('tabChanged', tab);
  }

  reloadActiveTab() {
    const tab = window.BrowserState.getActiveTab();
    if (!tab) return;
    const view = document.getElementById(`tab-view-${tab.id}`);
    if (!view) return;
    const webview = view.querySelector(`#webview-${tab.id}`);
    if (webview) {
      webview.reload();
    } else {
      this.renderTabContent(tab, view);
    }
  }

  closeTab(tabId, e) {
    if (e) e.stopPropagation();

    const state = window.BrowserState;

    // If closing the last remaining tab, DO NOT delete its DOM container! Just reset its URL to newtab!
    if (state.tabs.length <= 1) {
      const tabEl = this.tabStrip ? this.tabStrip.querySelector(`[data-tab-id="${tabId}"]`) : null;
      if (tabEl) tabEl.classList.add('is-closing');
      setTimeout(() => {
        try {
          if (typeof require !== 'undefined') {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('window-close');
          } else {
            window.close();
          }
        } catch(e) {
          window.close();
        }
      }, 180);
      return;
    }

    const tabEl = this.tabStrip ? this.tabStrip.querySelector(`[data-tab-id="${tabId}"]`) : null;
    if (tabEl && !tabEl.classList.contains('is-closing')) {
      tabEl.classList.add('is-closing');
      setTimeout(() => {
        this._executeCloseTab(tabId);
      }, 180);
    } else {
      this._executeCloseTab(tabId);
    }
  }

  _executeCloseTab(tabId) {
    const state = window.BrowserState;
    const index = state.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    const view = document.getElementById(`tab-view-${tabId}`);
    if (view) view.remove();

    const wasActive = state.activeTabId === tabId;
    state.tabs.splice(index, 1);

    if (wasActive) {
      const nextTab = state.tabs[Math.max(0, index - 1)];
      state.activeTabId = nextTab.id;
    }

    this.renderTabs();
    this.showActiveTab();
    this.saveSessionSnapshot();
    state.emit('tabChanged', state.getActiveTab());
  }

  saveSessionSnapshot() {
    try {
      const state = window.BrowserState;
      if (!state || !state.tabs) return;

      const tabsToSave = state.tabs.map(t => ({
        url: t.url || 'cafe://newtab',
        title: t.title || 'Nova Aba',
        iconType: t.iconType || 'globe',
        isPrivate: t.isPrivate || false,
        zoomFactor: t.zoomFactor || 1.0
      }));

      localStorage.setItem('coffee_last_session_tabs', JSON.stringify(tabsToSave));
      localStorage.setItem('coffee_session_active', 'true');
    } catch(e) {}
  }

  switchTab(tabId) {
    if (window.BrowserState.activeTabId === tabId) return;
    window.BrowserState.activeTabId = tabId;
    this.renderTabs();
    this.showActiveTab();
    window.BrowserState.emit('tabChanged', window.BrowserState.getActiveTab());
  }

  getActiveWebview() {
    const tab = window.BrowserState.getActiveTab();
    if (!tab) return null;
    return document.getElementById(`webview-${tab.id}`);
  }

  setLoadingProgress(isLoading) {
    if (!this.loadingBar) return;
    if (isLoading) {
      this.loadingBar.style.opacity = '1';
      this.loadingBar.style.width = '70%';
    } else {
      this.loadingBar.style.width = '100%';
      setTimeout(() => {
        this.loadingBar.style.opacity = '0';
        this.loadingBar.style.width = '0%';
      }, 200);
    }
  }

  getFaviconUrl(url) {
    if (!url || url.startsWith('cafe://') || url.startsWith('about:')) return null;
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch(e) {
      return null;
    }
  }

  updateTabMetadata(tab) {
    tab.faviconUrl = this.getFaviconUrl(tab.url);
    const t = (k, fb) => window.CoffeeI18n ? window.CoffeeI18n.t(k, fb) : fb;

    if (tab.url.startsWith('cafe://newtab') || tab.url.startsWith('cafe://nova-aba') || tab.url === '') {
      tab.title = tab.isPrivate ? t('private_tab', 'Aba Privada') : t('new_tab', 'Nova Aba');
      tab.iconType = tab.isPrivate ? 'incognito' : 'globe';
    } else if (tab.url.startsWith('cafe://shields')) {
      tab.title = t('settings_shields_title', 'Escudos de Proteção');
      tab.iconType = 'shield';
    } else if (tab.url.startsWith('cafe://terminal')) {
      tab.title = 'Terminal CLI';
      tab.iconType = 'terminal';
    } else if (tab.url.startsWith('cafe://history')) {
      tab.title = t('history_title', 'Histórico');
      tab.iconType = 'clock';
    } else if (tab.url.startsWith('cafe://bookmarks')) {
      tab.title = t('bookmarks_title', 'Favoritos');
      tab.iconType = 'star';
    } else if (tab.url.startsWith('cafe://settings')) {
      tab.title = t('settings', 'Configurações');
      tab.iconType = 'settings';
    } else if (tab.url.startsWith('cafe://docs')) {
      tab.title = 'Documentação';
      tab.iconType = 'bookOpen';
    } else if (tab.url.startsWith('cafe://vitals')) {
      tab.title = 'Web Vitals';
      tab.iconType = 'zap';
    } else {
      try {
        const u = new URL(tab.url.startsWith('http') ? tab.url : `https://${tab.url}`);
        tab.title = u.hostname.replace('www.', '');
        tab.iconType = 'globe';
      } catch(e) {
        tab.title = tab.url;
        tab.iconType = 'globe';
      }
    }
  }

  setupTabDrag(el, tabId) {
    el.onpointerdown = (e) => {
      if (e.target.closest('.tab-close-btn')) return;
      if (e.button !== 0) return;

      this.draggedTabId = tabId;
      this.dragStartX = e.clientX;
      this.isLiveDraggingTab = false;
    };

    el.onpointermove = (e) => {
      if (!this.draggedTabId || this.draggedTabId !== tabId) return;

      const dist = Math.abs(e.clientX - this.dragStartX);
      if (!this.isLiveDraggingTab && dist > 5) {
        this.isLiveDraggingTab = true;
        el.classList.add('is-live-dragging');
        try { el.setPointerCapture(e.pointerId); } catch(err) {}
      }

      if (this.isLiveDraggingTab) {
        const tabs = window.BrowserState.tabs;
        const currentIndex = tabs.findIndex(t => t.id === tabId);
        if (currentIndex === -1) return;

        const allTabEls = Array.from(this.tabStrip.querySelectorAll('.browser-tab'));
        for (let i = 0; i < allTabEls.length; i++) {
          const siblingEl = allTabEls[i];
          const sibId = siblingEl.getAttribute('data-tab-id');
          if (!sibId || sibId === tabId) continue;

          const rect = siblingEl.getBoundingClientRect();
          const midX = rect.left + rect.width / 2;

          const sibIndex = tabs.findIndex(t => t.id === sibId);
          if (sibIndex === -1) continue;

          if ((currentIndex < sibIndex && e.clientX > midX) || (currentIndex > sibIndex && e.clientX < midX)) {
            const [movedTab] = tabs.splice(currentIndex, 1);
            tabs.splice(sibIndex, 0, movedTab);
            window.BrowserState.saveState();
            this.renderTabs();

            const newEl = this.tabStrip.querySelector(`[data-tab-id="${tabId}"]`);
            if (newEl) {
              newEl.classList.add('is-live-dragging');
              try { newEl.setPointerCapture(e.pointerId); } catch(err) {}
            }
            break;
          }
        }
      }
    };

    const endDrag = (e) => {
      if (this.draggedTabId === tabId) {
        if (this.isLiveDraggingTab) {
          try { el.releasePointerCapture(e.pointerId); } catch(err) {}
        } else {
          this.switchTab(tabId);
        }
        el.classList.remove('is-live-dragging');
        this.draggedTabId = null;
        this.isLiveDraggingTab = false;
      }
    };

    el.onpointerup = endDrag;
    el.onpointercancel = endDrag;
  }

  renderTabs() {
    if (!this.tabStrip) return;
    const tabs = window.BrowserState.tabs;
    const activeId = window.BrowserState.activeTabId;

    let newTabBtn = this.tabStrip.querySelector('.new-tab-btn');

    // Collect existing tab elements by data-tab-id
    const existingElements = new Map();
    this.tabStrip.querySelectorAll('.browser-tab').forEach(el => {
      const tabId = el.getAttribute('data-tab-id');
      if (tabId) existingElements.set(tabId, el);
    });

    const activeTabIds = new Set(tabs.map(t => t.id));

    // Remove elements that are no longer in state (unless currently animating close)
    existingElements.forEach((el, tabId) => {
      if (!activeTabIds.has(tabId) && !el.classList.contains('is-closing')) {
        el.remove();
      }
    });

    tabs.forEach(t => {
      const isActive = t.id === activeId;
      const isPinned = t.isPinned;
      const isPrivate = t.isPrivate;
      const iconSvg = window.Icons[t.iconType] || window.Icons.globe;

      let faviconHtml = `<span class="tab-favicon">${iconSvg}</span>`;
      if (t.faviconUrl) {
        faviconHtml = `
          <span class="tab-favicon">
            <img src="${t.faviconUrl}" style="width:16px; height:16px; border-radius:2px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" />
            <span style="display:none;">${iconSvg}</span>
          </span>
        `;
      }

      let el = existingElements.get(t.id);
      if (!el) {
        el = document.createElement('div');
        el.setAttribute('data-tab-id', t.id);
        if (t.isOpening) {
          el.classList.add('is-opening');
          setTimeout(() => {
            el.classList.remove('is-opening');
            t.isOpening = false;
          }, 220);
        }
        this.tabStrip.insertBefore(el, newTabBtn || null);
      }

      this.setupTabDrag(el, t.id);

      const isClosing = el.classList.contains('is-closing');
      const isOpening = el.classList.contains('is-opening');

      el.className = `browser-tab ${isActive ? 'active' : ''} ${isPinned ? 'is-pinned' : ''} ${isPrivate ? 'is-private' : ''} ${isClosing ? 'is-closing' : ''} ${isOpening ? 'is-opening' : ''}`;

      el.innerHTML = `
        ${faviconHtml}
        ${!isPinned ? `<span class="tab-title">${t.title}</span>` : ''}
        ${!isPinned ? `
          <button class="tab-close-btn" onclick="window.CoffeeTabs.closeTab('${t.id}', event)" title="Fechar aba">
            ${window.Icons.close}
          </button>
        ` : ''}
      `;
    });

    if (!newTabBtn) {
      const btnContainer = document.createElement('div');
      btnContainer.innerHTML = `
        <button class="new-tab-btn" onclick="window.CoffeeTabs.createTab('cafe://newtab')" title="Nova Aba (Ctrl+T)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      `;
      newTabBtn = btnContainer.firstElementChild;
      this.tabStrip.appendChild(newTabBtn);
    } else {
      this.tabStrip.appendChild(newTabBtn);
    }
  }

  openExternal(url) {
    try {
      if (typeof require !== 'undefined') {
        const { shell } = require('electron');
        if (shell && shell.openExternal) {
          shell.openExternal(url);
          return;
        }
      }
    } catch(e) {}
    window.open(url, '_blank');
  }
}

window.CoffeeTabs = new CoffeeTabsManager();
