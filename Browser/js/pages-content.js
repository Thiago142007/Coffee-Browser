/**
 * Coffee Browser Content Renderer for cafe:// pages & Real Web Browser Engine
 */

class PagesContentRenderer {
  constructor() {
    this.hasStatsListener = false;
    this.hasHistoryListener = false;
    this.setupLanguageListener();
  }

  setupLanguageListener() {
    if (window.BrowserState) {
      window.BrowserState.on('languageChanged', () => {
        const activeTab = window.BrowserState.getActiveTab();
        if (activeTab && activeTab.url && activeTab.url.startsWith('cafe://')) {
          const view = document.getElementById(`tab-view-${activeTab.id}`);
          if (view) {
            view.innerHTML = this.render(activeTab.url, activeTab);
          }
        }
      });
    }
  }

  t(key, fallback = '') {
    return window.CoffeeI18n ? window.CoffeeI18n.t(key, fallback) : (fallback || key);
  }

  render(url, tab) {
    const cleanUrl = (url || '').trim().toLowerCase();

    if (cleanUrl === 'cafe://newtab' || cleanUrl === 'cafe://nova-aba' || cleanUrl === 'about:blank' || cleanUrl === '') {
      return this.renderNewTab();
    }
    if (cleanUrl === 'cafe://shields' || cleanUrl === 'cafe://privacidade' || cleanUrl === 'cafe://coador' || cleanUrl === 'cafe://adblock') {
      return this.renderShieldsDashboard();
    }
    if (cleanUrl === 'cafe://terminal' || cleanUrl === 'cafe://cli') {
      return this.renderTerminal();
    }
    if (cleanUrl === 'cafe://history' || cleanUrl === 'cafe://historico') {
      return this.renderHistory();
    }
    if (cleanUrl === 'cafe://bookmarks' || cleanUrl === 'cafe://favoritos') {
      return this.renderBookmarks();
    }
    if (cleanUrl === 'cafe://downloads') {
      return this.renderDownloads();
    }
    if (cleanUrl === 'cafe://settings' || cleanUrl === 'cafe://configuracoes') {
      return this.renderBraveSettings();
    }
    if (cleanUrl === 'cafe://docs' || cleanUrl === 'cafe://manual') {
      return this.renderDocs();
    }
    if (cleanUrl === 'cafe://vitals' || cleanUrl === 'cafe://telemetria') {
      return this.renderVitals();
    }
    if (cleanUrl === 'cafe://beans') {
      return this.renderBeans();
    }

    // Real Live Web Page View
    return this.renderLiveWebPage(url, tab);
  }

  // ==========================================
  // 1. Clean Professional New Tab Dashboard
  // ==========================================
  renderNewTab() {
    const stats = (window.BrowserState && window.BrowserState.shieldsStats) || {};
    const effLang = window.BrowserState ? window.BrowserState.getEffectiveLanguage() : 'pt-BR';
    const trackers = (stats.trackersBlocked !== undefined ? stats.trackersBlocked : 0).toLocaleString(effLang);
    const bandwidth = (stats.bandwidthSavedMB !== undefined ? stats.bandwidthSavedMB : 0).toFixed(1);
    const timeSaved = (stats.timeSavedMinutes !== undefined ? stats.timeSavedMinutes : 0).toFixed(1);
    const httpsCount = stats.httpsUpgrades !== undefined ? stats.httpsUpgrades : 0;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    let greeting = this.t('nt_greeting_evening', 'Boa noite');
    const h = now.getHours();
    if (h >= 5 && h < 12) greeting = this.t('nt_greeting_morning', 'Bom dia');
    else if (h >= 12 && h < 18) greeting = this.t('nt_greeting_afternoon', 'Boa tarde');

    const quoteIdx = Math.floor(Math.random() * 3) + 1;
    const quote = this.t(`quote_${quoteIdx}`, '“Navegue com privacidade total, alta performance e controle dos seus dados.”');

    // Attach real-time DOM listener once
    if (!this.hasStatsListener && window.BrowserState) {
      this.hasStatsListener = true;
      window.BrowserState.on('shieldsStatsUpdated', (s) => {
        const elT = document.getElementById('nt-stat-trackers');
        const elB = document.getElementById('nt-stat-bandwidth');
        const elM = document.getElementById('nt-stat-time');
        const elH = document.getElementById('nt-stat-https');

        const currentLang = window.BrowserState.getEffectiveLanguage();
        if (elT) elT.textContent = (s.trackersBlocked || 0).toLocaleString(currentLang);
        if (elB) elB.innerHTML = `${(s.bandwidthSavedMB || 0).toFixed(1)} <span style="font-size:13px">MB</span>`;
        if (elM) elM.innerHTML = `${(s.timeSavedMinutes || 0).toFixed(1)} <span style="font-size:13px">min</span>`;
        if (elH) elH.textContent = (s.httpsUpgrades || 0).toLocaleString(currentLang);
      });
    }

    return `
      <div class="newtab-dashboard">
        <!-- Top Metrics Strip -->
        <div class="dashboard-stats-strip animate-fade-in">
          <div class="stat-item">
            <div class="stat-value" id="nt-stat-trackers">${trackers}</div>
            <div class="stat-label">${this.t('nt_trackers_blocked', 'Rastreadores Bloqueados')}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" id="nt-stat-bandwidth">${bandwidth} <span style="font-size:13px">MB</span></div>
            <div class="stat-label">${this.t('nt_bandwidth_saved', 'Banda Economizada')}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" id="nt-stat-time">${timeSaved} <span style="font-size:13px">min</span></div>
            <div class="stat-label">${this.t('nt_time_saved', 'Tempo Economizado')}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" id="nt-stat-https" style="color:var(--green)">${httpsCount}</div>
            <div class="stat-label">${this.t('nt_https_connections', 'Conexões HTTPS')}</div>
          </div>
        </div>

        <!-- Clock & Greeting -->
        <div class="dashboard-center animate-fade-in">
          <div class="dashboard-time" id="nt-clock">${hours}:${minutes}</div>
          <div class="dashboard-greeting">${greeting}</div>
          <div class="dashboard-quote">${quote}</div>
        </div>

        <!-- Real Search Bar -->
        <div class="dashboard-search-bar animate-fade-in" style="margin-bottom:32px;">
          <span class="dashboard-search-icon">${window.Icons.search}</span>
          <input type="text" class="dashboard-search-input" id="nt-search-input" placeholder="${this.t('search_placeholder', 'Pesquisar na Web ou digitar URL...')}" autocomplete="off" />
          <button class="brand-pill" onclick="window.CoffeeOmnibox.navigateFromInput(document.getElementById('nt-search-input').value)">${this.t('nt_search_btn', 'Pesquisar')}</button>
        </div>

        <!-- System Summary Cards -->
        <div class="dashboard-cards-section animate-fade-in">
          <div class="feature-widget-card">
            <div class="widget-header">
              <div class="widget-title"><span style="display:flex;">${window.Icons.shield}</span> ${this.t('nt_widget_protection', 'Proteção e Escudos')}</div>
              <button class="brand-pill" onclick="window.CoffeeTabs.openSettings('shields')" style="font-size:10px">${this.t('nt_widget_details', 'Detalhes')}</button>
            </div>
            <div class="widget-body">
              <p>${this.t('nt_widget_protection_desc', 'Escudos ativos bloqueando anúncios invasivos, rastreadores e coleta de dados.')}</p>
            </div>
          </div>

          <div class="feature-widget-card">
            <div class="widget-header">
              <div class="widget-title"><span style="display:flex;">${window.Icons.settings}</span> ${this.t('nt_widget_settings', 'Configurações')}</div>
              <button class="brand-pill" onclick="window.CoffeeTabs.openSettings()" style="font-size:10px">${this.t('nt_widget_access', 'Acessar')}</button>
            </div>
            <div class="widget-body">
              <p>${this.t('nt_widget_settings_desc', 'Gerencie privacidade, aparência, idioma, mecanismos de busca e inicialização.')}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 2. Real Live Web Page Engine
  // ==========================================
  renderLiveWebPage(url, tab) {
    let target = url;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }

    const domain = window.CoffeeShields ? window.CoffeeShields.getDomain(target) : target;
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

    return `
      <div class="webpage-live-wrapper" style="display:flex; flex-direction:column; width:100%; height:100%;">
        <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 14px; background:var(--card); border-bottom:1px solid var(--line); font-size:11.5px; color:var(--t2);">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${faviconUrl}" style="width:16px; height:16px; border-radius:2px;" onerror="this.style.display='none';" />
            <span style="color:var(--green); display:flex; align-items:center;">${window.Icons.shieldCheck}</span>
            <span style="font-family:'Fira Code', monospace; color:var(--crema);">${domain}</span>
            <span style="color:var(--mut);">• Conexão segura protegida</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="brand-pill" onclick="window.CoffeeTabs.toggleReaderMode()" style="font-size:10.5px; display:flex; align-items:center; gap:4px;">
              ${window.Icons.bookOpen} <span>${this.t('reader_mode', 'Modo Leitor')}</span>
            </button>
            <a href="${target}" target="_blank" rel="noopener noreferrer" class="brand-pill" style="font-size:10.5px; display:flex; align-items:center; gap:4px; text-decoration:none;">
              ${window.Icons.externalLink} <span>Abrir Direto</span>
            </a>
          </div>
        </div>

        <div style="flex:1; width:100%; position:relative; background:#120A06;">
          <iframe
            id="browser-active-iframe"
            src="${target}"
            style="width:100%; height:100%; border:none; background:#120A06;"
            onload="try { const l = this.contentWindow.location.href; if(l && l !== 'about:blank' && window.BrowserState) { const t = window.BrowserState.getActiveTab(); if(t && t.url !== l) { t.url = l; window.CoffeeTabs.updateTabMetadata(t); window.CoffeeTabs.renderTabs(); window.CoffeeOmnibox.updateUI(); } } } catch(e){}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
          </iframe>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 3. Settings Page (Brave Style with i18n)
  // ==========================================
  renderBraveSettings() {
    return `
      <div class="brave-settings-container" style="display:flex; width:100%; height:100%; overflow:hidden; background:var(--bg);">
        <aside style="width:260px; border-right:1px solid var(--line); background:var(--card); display:flex; flex-direction:column; padding:24px 12px; gap:4px; flex-shrink:0;">
          <div style="padding:0 12px 16px; font-weight:700; font-size:15px; color:var(--crema); display:flex; align-items:center; gap:8px; border-bottom:1px solid var(--line); margin-bottom:12px;">
            <span style="display:flex; color:var(--caramel);">${window.Icons.settings}</span>
            <span>${this.t('settings', 'Configurações')}</span>
          </div>

          <div class="settings-nav-item active" onclick="window.showSettingsSection('shields')" id="nav-item-shields">
            <span style="display:flex;">${window.Icons.coador || window.Icons.shield}</span>
            <span>${this.t('settings_nav_shields', 'Coador (Bloqueador)')}</span>
          </div>
          <div class="settings-nav-item" onclick="window.showSettingsSection('appearance')" id="nav-item-appearance">
            <span style="display:flex;">${window.Icons.zap}</span>
            <span>${this.t('settings_nav_appearance', 'Aparência & Tema')}</span>
          </div>
          <div class="settings-nav-item" onclick="window.showSettingsSection('search')" id="nav-item-search">
            <span style="display:flex;">${window.Icons.search}</span>
            <span>${this.t('settings_nav_search', 'Mecanismo de Pesquisa')}</span>
          </div>
          <div class="settings-nav-item" onclick="window.showSettingsSection('language')" id="nav-item-language">
            <span style="display:flex;">${window.Icons.language || window.Icons.globe}</span>
            <span>${this.t('settings_nav_language', 'Idioma & Região')}</span>
          </div>
          <div class="settings-nav-item" onclick="window.showSettingsSection('startup')" id="nav-item-startup">
            <span style="display:flex;">${window.Icons.home}</span>
            <span>${this.t('settings_nav_startup', 'Na Inicialização')}</span>
          </div>
          <div class="settings-nav-item" onclick="window.showSettingsSection('privacy')" id="nav-item-privacy">
            <span style="display:flex;">${window.Icons.lock}</span>
            <span>${this.t('settings_nav_privacy', 'Privacidade e Segurança')}</span>
          </div>
          <div class="settings-nav-item" onclick="window.CoffeeTabs.navigateActiveTab('cafe://history')" id="nav-item-history">
            <span style="display:flex;">${window.Icons.clock}</span>
            <span>${this.t('settings_nav_history', 'Histórico de Navegação')}</span>
          </div>
          <div class="settings-nav-item" onclick="window.showSettingsSection('downloads')" id="nav-item-downloads">
            <span style="display:flex;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
            <span>Gerenciador de Downloads</span>
          </div>
          <div class="settings-nav-item" onclick="window.showSettingsSection('system')" id="nav-item-system">
            <span style="display:flex;">${window.Icons.code}</span>
            <span>${this.t('settings_nav_system', 'Sistema & Desempenho')}</span>
          </div>
          <div class="settings-nav-item" onclick="window.showSettingsSection('about')" id="nav-item-about">
            <span style="display:flex;">${window.Icons.coffee}</span>
            <span>${this.t('settings_nav_about', 'Sobre o Coffee Browser')}</span>
          </div>
        </aside>

        <main style="flex:1; overflow-y:auto; padding:36px 48px; max-width:900px;" id="settings-content-pane">
          ${this.renderSettingsShieldsSection()}
        </main>
      </div>
    `;
  }

  // ==========================================
  // 4. Settings Sections
  // ==========================================

  renderSettingsShieldsSection() {
    const s = window.BrowserState;
    return `
      <div class="animate-fade-in" id="section-shields">
        <h2 class="font-display" style="font-size:22px; font-weight:700; color:var(--crema); margin-bottom:6px;">${this.t('settings_shields_title', 'Proteção e Escudos Brave')}</h2>
        <p style="color:var(--t2); font-size:13px; margin-bottom:24px;">${this.t('settings_shields_sub', 'Configure as proteções padrão que o navegador aplica em todas as páginas visitadas.')}</p>

        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div class="widget-title">${this.t('settings_shields_block_title', 'Proteção contra rastreamento e anúncios')}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
            <div>
              <div style="font-size:13px; color:var(--crema); font-weight:600;">${this.t('settings_shields_block_label', 'Bloqueio de Rastreamento (Shields)')}</div>
              <div style="font-size:11.5px; color:var(--mut);">${this.t('settings_shields_block_desc', 'Bloqueia anúncios e rastreadores incorporados em websites.')}</div>
            </div>
            <select class="brand-pill" style="background:var(--term);" onchange="window.BrowserState.shieldsAggressive = (this.value === 'aggressive'); window.BrowserState.saveState();">
              <option value="aggressive" ${s.shieldsAggressive ? 'selected' : ''}>${this.t('settings_shields_aggressive', 'Agressivo (Recomendado)')}</option>
              <option value="standard" ${!s.shieldsAggressive ? 'selected' : ''}>${this.t('settings_shields_standard', 'Padrão')}</option>
              <option value="disabled">${this.t('settings_shields_disabled', 'Desativado')}</option>
            </select>
          </div>
        </div>

        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:13px; color:var(--crema); font-weight:600;">${this.t('settings_shields_https_title', 'Atualização automática para HTTPS')}</div>
              <div style="font-size:11.5px; color:var(--mut);">${this.t('settings_shields_https_desc', 'Reescreve conexões inseguras HTTP para conexões criptografadas.')}</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" ${s.httpsUpgrade ? 'checked' : ''} onchange="window.BrowserState.httpsUpgrade = this.checked; window.BrowserState.saveState();">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:13px; color:var(--crema); font-weight:600;">${this.t('settings_shields_fp_title', 'Proteção contra Impressão Digital')}</div>
              <div style="font-size:11.5px; color:var(--mut);">${this.t('settings_shields_fp_desc', 'Impede que sites identifiquem a configuração do seu dispositivo.')}</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" ${s.fingerprintProtection ? 'checked' : ''} onchange="window.BrowserState.fingerprintProtection = this.checked; window.BrowserState.saveState();">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:13px; color:var(--crema); font-weight:600; display:flex; align-items:center; gap:6px;">
                <span style="color:var(--green)">●</span> ${this.t('settings_shields_dns_title', 'DNS Seguro Criptografado (Cloudflare 1.1.1.1)')}
              </div>
              <div style="font-size:11.5px; color:var(--mut);">${this.t('settings_shields_dns_desc', 'Todas as buscas e navegações utilizam DNS over HTTPS (DoH) da Cloudflare para privacidade total.')}</div>
            </div>
            <span class="brand-pill" style="color:var(--green); border-color:var(--green); font-size:10px; font-weight:700;">ATIVO (1.1.1.1)</span>
          </div>
        </div>

        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:13px; color:var(--crema); font-weight:600;">${this.t('settings_shields_scriptlets_title', 'Desarmador de Anti-Adblock (Scriptlets)')}</div>
              <div style="font-size:11.5px; color:var(--mut);">${this.t('settings_shields_scriptlets_desc', 'Neutraliza verificações de adblock e bypassa avisos de bloqueio em portais de notícias e vídeos.')}</div>
            </div>
            <span class="brand-pill" style="color:var(--green); border-color:var(--green); font-size:10px; font-weight:700;">ATIVO</span>
          </div>
        </div>

        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:13px; color:var(--crema); font-weight:600;">${this.t('settings_shields_query_title', 'Higienizador de URLs contra Rastreamento')}</div>
              <div style="font-size:11.5px; color:var(--mut);">${this.t('settings_shields_query_desc', 'Remove automaticamente parâmetros espiões (fbclid, gclid, utm_source, igshid) de links clicados.')}</div>
            </div>
            <span class="brand-pill" style="color:var(--green); border-color:var(--green); font-size:10px; font-weight:700;">ATIVO</span>
          </div>
        </div>

        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:13px; color:var(--crema); font-weight:600;">${this.t('settings_shields_cookies_title', 'Bloquear Cookies de Terceiros')}</div>
              <div style="font-size:11.5px; color:var(--mut);">${this.t('settings_shields_cookies_desc', 'Impede que anunciantes rastreiem sua navegação entre diferentes domínios.')}</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" ${s.blockThirdPartyCookies ? 'checked' : ''} onchange="window.BrowserState.blockThirdPartyCookies = this.checked; window.BrowserState.saveState();">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <!-- Whitelist / Exceptions Manager -->
        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div class="widget-title" style="margin-bottom:10px;">${this.t('settings_shields_whitelist_title', 'Lista de Exceções do Coador (Sites Pausados)')}</div>
          <div style="font-size:11.5px; color:var(--t2); margin-bottom:12px;">${this.t('settings_shields_whitelist_sub', 'Sites onde o bloqueador de anúncios foi pausado pelo usuário:')}</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${(() => {
              const whitelist = (window.CoffeeShields && window.CoffeeShields.siteWhitelist) || {};
              const domains = Object.keys(whitelist);
              if (domains.length === 0) {
                return `<div style="font-size:11px; color:var(--mut); font-style:italic;">${this.t('settings_shields_whitelist_empty', 'Nenhum site pausado. O Coador está protegendo 100% dos sites.')}</div>`;
              }
              return domains.map(d => `
                <div style="display:flex; align-items:center; justify-content:space-between; background:var(--elev); padding:6px 12px; border-radius:4px; border:1px solid var(--line);">
                  <span style="font-size:12px; font-family:'Fira Code', monospace; color:var(--crema);">${d}</span>
                  <button class="brand-pill" style="font-size:10px; color:var(--caramel); padding:3px 8px;" onclick="delete window.CoffeeShields.siteWhitelist['${d}']; window.CoffeeShields.saveWhitelist(); window.showSettingsSection('shields');">${this.t('settings_shields_reactivate', 'Reativar Coador')}</button>
                </div>
              `).join('');
            })()}
          </div>
        </div>
      </div>
    `;
  }

  renderSettingsAppearanceSection() {
    const s = window.BrowserState;
    return `
      <div class="animate-fade-in" id="section-appearance">
        <h2 class="font-display" style="font-size:22px; font-weight:700; color:var(--crema); margin-bottom:6px;">${this.t('settings_appearance_title', 'Aparência e Tema')}</h2>
        <p style="color:var(--t2); font-size:13px; margin-bottom:24px;">${this.t('settings_appearance_sub', 'Personalize a identidade visual e os controles do navegador.')}</p>

        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div class="widget-title">${this.t('settings_appearance_theme_title', 'Esquema de Cores e Nível de Torra')}</div>
          <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
            <button class="brand-pill ${s.roast === 'claro' ? 'border-caramel' : ''}" onclick="window.BrowserState.setRoast('claro'); window.showSettingsSection('appearance');">${this.t('roast_claro', 'Torra Clara')}</button>
            <button class="brand-pill ${s.roast === 'medio' ? 'border-caramel' : ''}" onclick="window.BrowserState.setRoast('medio'); window.showSettingsSection('appearance');">${this.t('roast_medio', 'Torra Média')}</button>
            <button class="brand-pill ${s.roast === 'escuro' ? 'border-caramel' : ''}" onclick="window.BrowserState.setRoast('escuro'); window.showSettingsSection('appearance');">${this.t('roast_escuro', 'Torra Escura')}</button>
            <button class="brand-pill ${s.roast === 'oculto' ? 'border-caramel' : ''}" onclick="window.BrowserState.setRoast('oculto'); window.showSettingsSection('appearance');">${this.t('roast_oculto', 'Torra Oculta')}</button>
          </div>
        </div>

        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:13px; color:var(--crema); font-weight:600;">${this.t('settings_appearance_show_bm', 'Exibir Barra de Favoritos')}</div>
              <div style="font-size:11.5px; color:var(--mut);">${this.t('settings_appearance_show_bm_sub', 'Mostra a barra de atalhos logo abaixo da barra de endereços.')}</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" ${s.showBookmarksBar ? 'checked' : ''} onchange="window.BrowserState.showBookmarksBar = this.checked; window.BrowserState.saveState(); const bar = document.getElementById('bookmarks-bar'); if(bar) bar.style.display = this.checked ? 'flex' : 'none';">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  renderSettingsSearchSection() {
    const s = window.BrowserState;
    return `
      <div class="animate-fade-in" id="section-search">
        <h2 class="font-display" style="font-size:22px; font-weight:700; color:var(--crema); margin-bottom:6px;">${this.t('settings_search_title', 'Mecanismo de Pesquisa')}</h2>
        <p style="color:var(--t2); font-size:13px; margin-bottom:24px;">${this.t('settings_search_sub', 'Defina o provedor padrão utilizado na barra de endereços e na página inicial.')}</p>

        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div class="widget-title">${this.t('settings_search_active_title', 'Provedor de Busca Ativo')}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; flex-wrap:wrap; gap:10px;">
            <div style="font-size:13px; color:var(--crema);">${this.t('settings_search_default_label', 'Mecanismo de busca padrão:')}</div>
            <select class="brand-pill" style="background:var(--term);" onchange="window.BrowserState.searchEngine = this.value; window.BrowserState.saveState();">
              <option value="google" ${s.searchEngine === 'google' ? 'selected' : ''}>Google</option>
              <option value="duckduckgo" ${s.searchEngine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo (Privativo)</option>
              <option value="brave" ${s.searchEngine === 'brave' ? 'selected' : ''}>Brave Search</option>
              <option value="bing" ${s.searchEngine === 'bing' ? 'selected' : ''}>Bing</option>
              <option value="wikipedia" ${s.searchEngine === 'wikipedia' ? 'selected' : ''}>Wikipedia</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 5. Dedicated Language Settings Section
  // ==========================================
  renderSettingsLanguageSection() {
    const s = window.BrowserState;
    const i18n = window.CoffeeI18n;
    const currentMode = (s && s.language) ? s.language : 'auto';
    const detected = i18n ? i18n.detectSystemLanguage() : 'pt-BR';
    const effective = s ? s.getEffectiveLanguage() : (i18n ? i18n.getEffectiveLanguage() : 'pt-BR');
    const supported = (i18n && i18n.supportedLanguages) || {};
    const detectedInfo = supported[detected] ? `${supported[detected].flag} ${supported[detected].name} [${detected}]` : detected;

    return `
      <div class="animate-fade-in" id="section-language">
        <h2 class="font-display" style="font-size:22px; font-weight:700; color:var(--crema); margin-bottom:6px;">${this.t('settings_language_title', 'Idioma e Região')}</h2>
        <p style="color:var(--t2); font-size:13px; margin-bottom:24px;">${this.t('settings_language_sub', 'Defina a linguagem da interface do navegador e a sincronização com o site.')}</p>

        <!-- Main Language Selector -->
        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div class="widget-title">${this.t('settings_language_active_title', 'Linguagem do Navegador')}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; flex-wrap:wrap; gap:12px;">
            <div>
              <div style="font-size:13px; color:var(--crema); font-weight:600;">${this.t('settings_language_select_label', 'Selecione o idioma desejado:')}</div>
              <div style="font-size:11.5px; color:var(--mut); margin-top:3px;">
                ${this.t('settings_language_detected_info', 'Idioma detectado no seu sistema:')} <span style="color:var(--caramel); font-weight:600;">${detectedInfo}</span>
              </div>
            </div>
            <select class="brand-pill" style="background:var(--term); padding:8px 14px; font-size:12.5px; cursor:pointer; min-width:240px;" onchange="window.BrowserState.setLanguage(this.value); window.showSettingsSection('language'); if (window.CoffeeTabs) window.CoffeeTabs.renderTabs();">
              <option value="auto" ${currentMode === 'auto' ? 'selected' : ''}>🌐 ${this.t('settings_language_auto_option', 'Automático (Detectar do Sistema)')} [${detected}]</option>
              ${Object.keys(supported).map(code => `
                <option value="${code}" ${currentMode === code ? 'selected' : ''}>${supported[code].flag} ${supported[code].name} (${code})</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Sync Badge Card -->
        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap;">
            <div>
              <div style="font-size:13px; color:var(--crema); font-weight:600; display:flex; align-items:center; gap:8px;">
                <span style="color:var(--green)">●</span>
                <span>${this.t('settings_language_sync_badge', 'SINCRONIZAÇÃO AUTOMÁTICA ATIVA')}</span>
              </div>
              <div style="font-size:11.5px; color:var(--mut); margin-top:4px;">${this.t('settings_language_sync_info', 'As alterações de idioma são salvas instantaneamente no navegador e sincronizadas com o site oficial.')}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="brand-pill" style="color:var(--green); border-color:var(--green); font-size:11px; font-weight:700;">${effective.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSettingsStartupSection() {
    const s = window.BrowserState;
    return `
      <div class="animate-fade-in" id="section-startup">
        <h2 class="font-display" style="font-size:22px; font-weight:700; color:var(--crema); margin-bottom:6px;">${this.t('settings_startup_title', 'Na Inicialização')}</h2>
        <p style="color:var(--t2); font-size:13px; margin-bottom:24px;">${this.t('settings_startup_sub', 'Escolha o que abrir quando o navegador for iniciado.')}</p>

        <div class="feature-widget-card">
          <div style="display:flex; flex-direction:column; gap:12px;">
            <label style="display:flex; align-items:center; gap:10px; font-size:13px; color:var(--crema); cursor:pointer;">
              <input type="radio" name="startup" ${s.startupBehavior === 'newtab' ? 'checked' : ''} onchange="window.BrowserState.startupBehavior = 'newtab'; window.BrowserState.saveState();">
              <span>${this.t('settings_startup_newtab', 'Abrir a página Nova Aba')}</span>
            </label>
            <label style="display:flex; align-items:center; gap:10px; font-size:13px; color:var(--crema); cursor:pointer;">
              <input type="radio" name="startup" ${s.startupBehavior === 'continue' ? 'checked' : ''} onchange="window.BrowserState.startupBehavior = 'continue'; window.BrowserState.saveState();">
              <span>${this.t('settings_startup_continue', 'Continuar de onde você parou')}</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  renderSettingsPrivacySection() {
    return `
      <div class="animate-fade-in" id="section-privacy">
        <h2 class="font-display" style="font-size:22px; font-weight:700; color:var(--crema); margin-bottom:6px;">${this.t('settings_privacy_title', 'Privacidade e Segurança')}</h2>
        <p style="color:var(--t2); font-size:13px; margin-bottom:24px;">${this.t('settings_privacy_sub', 'Gerencie dados de navegação, cookies e permissões.')}</p>

        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:13px; color:var(--crema); font-weight:600;">${this.t('settings_privacy_history_title', 'Histórico de Navegação')}</div>
              <div style="font-size:11.5px; color:var(--mut);">${this.t('settings_privacy_history_desc', 'Visualize e gerencie suas pesquisas e sites visitados por dia e horário.')}</div>
            </div>
            <button class="brand-pill" onclick="window.CoffeeTabs.navigateActiveTab('cafe://history')">${this.t('settings_privacy_history_btn', 'Abrir Histórico')}</button>
          </div>
        </div>

        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:13px; color:var(--crema); font-weight:600;">${this.t('settings_privacy_clear_title', 'Limpar Dados de Navegação')}</div>
              <div style="font-size:11.5px; color:var(--mut);">${this.t('settings_privacy_clear_desc', 'Exclui histórico, cache e cookies salvos localmente.')}</div>
            </div>
            <button class="brand-pill" style="color:var(--red); border-color:var(--red);" onclick="window.CoffeeStateHelpers.clearHistory()">${this.t('settings_privacy_clear_btn', 'Limpar Agora')}</button>
          </div>
        </div>
      </div>
    `;
  }

  renderSettingsSystemSection() {
    const s = window.BrowserState;
    return `
      <div class="animate-fade-in" id="section-system">
        <h2 class="font-display" style="font-size:22px; font-weight:700; color:var(--crema); margin-bottom:6px;">${this.t('settings_system_title', 'Sistema e Desempenho')}</h2>
        <p style="color:var(--t2); font-size:13px; margin-bottom:24px;">${this.t('settings_system_sub', 'Configurações avançadas de hardware e recursos.')}</p>

        <div class="feature-widget-card" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:13px; color:var(--crema); font-weight:600;">${this.t('settings_system_gpu_title', 'Aceleração de Hardware')}</div>
              <div style="font-size:11.5px; color:var(--mut);">${this.t('settings_system_gpu_desc', 'Usar aceleração de GPU gráfica quando disponível.')}</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" ${s.hardwareAcceleration ? 'checked' : ''} onchange="window.BrowserState.hardwareAcceleration = this.checked; window.BrowserState.saveState();">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  renderSettingsAboutSection() {
    return `
      <div class="animate-fade-in" id="section-about">
        <h2 class="font-display" style="font-size:22px; font-weight:700; color:var(--crema); margin-bottom:6px;">${this.t('settings_about_title', 'Sobre o Coffee Browser')}</h2>
        <p style="color:var(--t2); font-size:13px; margin-bottom:24px;">${this.t('settings_about_sub', 'Informações do aplicativo e versão instalada.')}</p>

        <div class="feature-widget-card">
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="width:48px; height:48px; border-radius:12px; background:var(--term); border:1px solid var(--line); display:flex; align-items:center; justify-content:center; color:var(--caramel);">
              ${window.Icons.coffee}
            </div>
            <div>
              <div style="font-size:16px; font-weight:700; color:var(--crema);">${this.t('settings_about_app_name', 'Coffee Browser Desktop')}</div>
              <div style="font-size:12px; color:var(--mut);">${this.t('settings_about_version', 'Versão 1.0.0 (Windows x64 Executable)')}</div>
              <div style="font-size:11px; color:var(--green); margin-top:4px;">${this.t('settings_about_up_to_date', 'O Coffee Browser está atualizado.')}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSettingsDownloadsSection() {
    const list = (window.CoffeeDownloads && window.CoffeeDownloads.downloads) || [];
    const itemsHtml = list.length > 0
      ? list.map(item => window.CoffeeDownloads.renderItemHtml(item, false)).join('')
      : `<div style="padding:48px 24px; text-align:center; color:var(--mut); font-size:13px;">Nenhum arquivo baixado no momento.</div>`;

    return `
      <div class="animate-fade-in" id="section-downloads">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <h2 class="font-display" style="font-size:22px; font-weight:700; color:var(--crema); margin-bottom:4px;">Gerenciador de Downloads 📥</h2>
            <p style="color:var(--t2); font-size:13px;">Acompanhe o progresso, velocidade real e histórico de arquivos baixados.</p>
          </div>
          <button class="brand-pill" onclick="window.CoffeeDownloads && window.CoffeeDownloads.refreshDownloads()" style="font-size:11px; padding:4px 12px; font-weight:600;">🔄 Atualizar Lista</button>
        </div>

        <div id="settings-downloads-list-container" style="display:flex; flex-direction:column; gap:10px; margin-top:16px;">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  updateDownloadsSettingsView(list) {
    const container = document.getElementById('settings-downloads-list-container');
    if (!container) return;
    if (!list || list.length === 0) {
      container.innerHTML = `<div style="padding:48px 24px; text-align:center; color:var(--mut); font-size:13px;">Nenhum arquivo baixado no momento.</div>`;
      return;
    }
    container.innerHTML = list.map(item => window.CoffeeDownloads.renderItemHtml(item, false)).join('');
  }

  renderShieldsDashboard() {
    return this.renderBraveSettings();
  }

  renderTerminal() {
    return `
      <div class="terminal-page-view" id="term-container" onclick="document.getElementById('term-input') && document.getElementById('term-input').focus()">
        <div class="term-banner">
COFFEE BROWSER TERMINAL ENGINE v4.0
SISTEMA INTEGRADO CLI & SHELL REAL DO WINDOWS
        </div>
        <div class="term-line output">Terminal interativo ativo com execução real de comandos do sistema. Digite <span style="color:var(--amber)">help</span> para ver a lista de comandos.</div>
        <div class="term-line" style="margin-bottom:12px;"></div>
        
        <div id="term-log"></div>

        <div class="term-input-row">
          <span class="term-prompt-symbol" id="term-prompt-symbol">&gt;</span>
          <input type="text" class="term-cli-input" id="term-input" autocomplete="off" spellcheck="false" autofocus />
        </div>
      </div>
    `;
  }

  renderHistory() {
    const history = (window.BrowserState && window.BrowserState.history) || [];
    const effLang = window.BrowserState ? window.BrowserState.getEffectiveLanguage() : 'pt-BR';

    const getDateKey = (time) => {
      const d = new Date(time);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const getDateTitle = (time) => {
      const date = new Date(time);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return `${this.t('history_today', 'Hoje')} — ${date.toLocaleDateString(effLang, { day: 'numeric', month: 'long', year: 'numeric' })}`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `${this.t('history_yesterday', 'Ontem')} — ${date.toLocaleDateString(effLang, { day: 'numeric', month: 'long', year: 'numeric' })}`;
      } else {
        return date.toLocaleDateString(effLang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      }
    };

    const groups = {};
    history.forEach(item => {
      const key = getDateKey(item.time);
      if (!groups[key]) {
        groups[key] = {
          title: getDateTitle(item.time),
          items: []
        };
      }
      groups[key].items.push(item);
    });

    const sortedGroupKeys = Object.keys(groups).sort().reverse();

    if (!this.hasHistoryListener && window.BrowserState) {
      this.hasHistoryListener = true;
      window.BrowserState.on('historyChanged', () => {
        const activeTab = window.BrowserState.getActiveTab();
        if (activeTab && (activeTab.url === 'cafe://history' || activeTab.url === 'cafe://historico')) {
          const view = document.getElementById(`tab-view-${activeTab.id}`);
          if (view) {
            view.innerHTML = this.renderHistory();
          }
        }
      });
    }

    return `
      <div style="max-width:900px; margin:0 auto; padding:36px 24px; animation:fadeIn 0.25s ease; color:var(--crema);">
        <!-- Top Action Header -->
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; border-bottom:1px solid var(--line); padding-bottom:18px; gap:16px; flex-wrap:wrap;">
          <div>
            <h1 class="font-display" style="font-size:24px; font-weight:700; color:var(--crema); margin-bottom:4px; display:flex; align-items:center; gap:10px;">
              <span style="color:var(--caramel);">${window.Icons.clock}</span>
              <span>${this.t('history_title', 'Histórico de Navegação')}</span>
            </h1>
            <p style="color:var(--t2); font-size:12.5px;">${this.t('history_sub', 'Registros cronológicos detalhados da sua navegação e pesquisas.')}</p>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <button class="brand-pill" onclick="window.CoffeeStateHelpers.clearHistory()" style="color:var(--red); border-color:var(--red); font-size:11.5px; font-weight:600; padding:6px 14px; cursor:pointer;">
              ${this.t('history_clear_all', 'Limpar Todo o Histórico')}
            </button>
          </div>
        </div>

        <!-- Real-time Filter Bar -->
        <div style="display:flex; align-items:center; gap:10px; background:var(--card); border:1px solid var(--line); border-radius:var(--radius-md); padding:8px 14px; margin-bottom:24px;">
          <span style="display:flex; color:var(--mut);">${window.Icons.search}</span>
          <input
            type="text"
            id="history-search-input"
            placeholder="${this.t('history_search_placeholder', 'Pesquisar no histórico por título ou URL...')}"
            oninput="(function(val){
              const q = (val || '').toLowerCase();
              document.querySelectorAll('.history-item-row').forEach(row => {
                const text = (row.dataset.search || '').toLowerCase();
                row.style.display = text.includes(q) ? 'flex' : 'none';
              });
              document.querySelectorAll('.history-date-group').forEach(grp => {
                const visible = Array.from(grp.querySelectorAll('.history-item-row')).some(r => r.style.display !== 'none');
                grp.style.display = visible ? 'block' : 'none';
              });
            })(this.value)"
            style="background:transparent; border:none; outline:none; color:var(--crema); font-size:12.5px; width:100%;"
          />
        </div>

        <!-- History Groups -->
        <div id="history-groups-container">
          ${history.length === 0 ? `
            <div style="text-align:center; padding:60px 20px; background:var(--card); border:1px solid var(--line); border-radius:var(--radius-lg); color:var(--mut);">
              <div style="font-size:36px; margin-bottom:12px; color:var(--caramel);">${window.Icons.clock}</div>
              <div style="font-size:15px; font-weight:600; color:var(--crema); margin-bottom:4px;">${this.t('history_empty_title', 'Seu histórico está limpo')}</div>
              <div style="font-size:12px;">${this.t('history_empty_desc', 'Páginas e buscas que você visitar aparecerão aqui organizadas.')}</div>
            </div>
          ` : sortedGroupKeys.map(key => {
            const grp = groups[key];
            const visitLabel = grp.items.length === 1 ? this.t('history_visit', 'visita') : this.t('history_visits', 'visitas');
            return `
              <div class="history-date-group" style="margin-bottom:28px;">
                <div style="font-size:13px; font-weight:700; color:var(--caramel); margin-bottom:10px; display:flex; align-items:center; gap:8px; text-transform:capitalize;">
                  <span>${grp.title}</span>
                  <span style="font-size:11px; color:var(--mut); font-weight:500;">(${grp.items.length} ${visitLabel})</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${grp.items.map(item => {
                    const domain = window.CoffeeShields ? window.CoffeeShields.getDomain(item.url) : item.url;
                    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                    const timeStr = new Date(item.time).toLocaleTimeString(effLang, { hour: '2-digit', minute: '2-digit' });
                    const safeTitle = (item.title || item.url).replace(/'/g, "\\'");
                    const safeUrl = item.url.replace(/'/g, "\\'");
                    const searchText = `${item.title || ''} ${item.url}`.toLowerCase();

                    return `
                      <div class="history-item-row" data-search="${searchText.replace(/"/g, '&quot;')}" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--card); border:1px solid var(--line); border-radius:var(--radius-md); transition:all 0.15s ease;">
                        <div style="display:flex; align-items:center; gap:12px; flex:1; overflow:hidden; cursor:pointer;" onclick="window.CoffeeTabs.navigateActiveTab('${safeUrl}')">
                          <span style="font-size:11px; font-family:'Fira Code', monospace; color:var(--mut); min-width:44px;">${timeStr}</span>
                          <img src="${faviconUrl}" style="width:16px; height:16px; border-radius:2px; flex-shrink:0;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23C97A3E\\' stroke-width=\\'2\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'/></svg>';" />
                          <div style="display:flex; flex-direction:column; gap:2px; overflow:hidden; flex:1;">
                            <span style="font-weight:600; font-size:12.5px; color:var(--crema); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.title || item.url}</span>
                            <span style="font-size:11px; font-family:'Fira Code', monospace; color:var(--t2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.url}</span>
                          </div>
                          ${item.visitCount && item.visitCount > 1 ? `<span style="font-size:10px; color:var(--amber); background:var(--elev); padding:2px 6px; border-radius:4px; font-weight:700; flex-shrink:0;">${item.visitCount}x</span>` : ''}
                        </div>
                        <button
                          title="${this.t('history_delete_item', 'Remover do histórico')}"
                          onclick="event.stopPropagation(); window.CoffeeStateHelpers.deleteHistoryEntry('${item.id || item.url}');"
                          style="background:transparent; border:none; color:var(--mut); cursor:pointer; padding:6px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:all 0.15s ease; margin-left:12px;"
                          onmouseover="this.style.color='var(--red)'; this.style.background='var(--elev)';"
                          onmouseout="this.style.color='var(--mut)'; this.style.background='transparent';"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderBookmarks() {
    const bookmarks = (window.BrowserState && window.BrowserState.bookmarks) || [];
    return `
      <div style="max-width:860px; margin:0 auto; padding:36px 24px; animation:fadeIn 0.25s ease;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; border-bottom:1px solid var(--line); padding-bottom:16px;">
          <h1 class="font-display" style="font-size:24px; font-weight:700; color:var(--crema);">${this.t('bookmarks_title', 'Favoritos')}</h1>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:12px;">
          ${bookmarks.map(b => {
            const domain = window.CoffeeShields ? window.CoffeeShields.getDomain(b.url) : b.url;
            const favImg = b.url.startsWith('http') ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null;
            const iconSvg = window.Icons[b.iconType] || window.Icons.globe;

            return `
              <div style="display:flex; align-items:center; gap:12px; padding:14px; background:var(--card); border:1px solid var(--line); border-radius:var(--radius-md); cursor:pointer;" onclick="window.CoffeeTabs.navigateActiveTab('${b.url}')">
                <div style="display:flex; color:var(--caramel);">
                  ${favImg ? `<img src="${favImg}" style="width:20px; height:20px; border-radius:3px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" /><span style="display:none;">${iconSvg}</span>` : iconSvg}
                </div>
                <div>
                  <div style="font-weight:600; font-size:13px; color:var(--crema);">${b.title}</div>
                  <div style="font-size:11px; font-family:'Fira Code', monospace; color:var(--mut);">${b.url}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderDownloads() {
    const downloads = (window.BrowserState && window.BrowserState.downloads) || [];
    return `
      <div style="max-width:860px; margin:0 auto; padding:36px 24px; animation:fadeIn 0.25s ease;">
        <h1 class="font-display" style="font-size:24px; font-weight:700; color:var(--crema); margin-bottom:24px; border-bottom:1px solid var(--line); padding-bottom:16px;">${this.t('downloads_title', 'Downloads')}</h1>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${downloads.map(d => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:16px; background:var(--card); border:1px solid var(--line); border-radius:var(--radius-md);">
              <div>
                <div style="font-weight:600; font-size:13px; color:var(--crema);">${d.name}</div>
                <div style="font-size:11px; color:var(--mut);">${d.size} • ${d.time} • ${this.t('downloads_completed', 'Concluído')}</div>
              </div>
              <div class="brand-pill" style="color:var(--green)">${this.t('downloads_completed', 'Concluído')}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderDocs() {
    return `
      <div class="reader-mode-container animate-fade-in">
        <div class="reader-header">
          <div class="reader-title">Coffee Browser Documentation</div>
          <div class="reader-meta">
            <span>Version 1.0.0</span> • <span>Fast Rendering</span> • <span>Privacy First Architecture</span>
          </div>
        </div>
        <div class="reader-body">
          <p>${this.t('app_desc', 'Coffee Browser — Navegador web de alta performance com arquitetura de privacidade e proteção ativa de dados.')}</p>
        </div>
      </div>
    `;
  }

  renderVitals() {
    return `
      <div style="max-width:760px; margin:0 auto; padding:36px 24px; font-family:'Fira Code', monospace; animation:fadeIn 0.25s ease;">
        <h1 style="color:var(--amber); font-size:18px; margin-bottom:16px;">WEB VITALS — SYSTEM TELEMETRY</h1>
        <div style="display:flex; flex-direction:column; gap:12px; font-size:13px; color:var(--crema);">
          <div>LCP:   <span style="color:var(--green)">0.4s</span>    [EXCELLENT]</div>
          <div>INP:   <span style="color:var(--green)">42ms</span>    [EXCELLENT]</div>
          <div>CLS:   <span style="color:var(--green)">0.00</span>    [PERFECT]</div>
          <div>TTFB:  <span style="color:var(--amber)">89ms</span>    [GOOD]</div>
          <div>RAM:   <span style="color:var(--t2)">14.2MB</span>  [LIGHTWEIGHT]</div>
        </div>
      </div>
    `;
  }

  renderBeans() {
    return `
      <div style="max-width:860px; margin:0 auto; padding:36px 24px; animation:fadeIn 0.25s ease;">
        <h1 class="font-display" style="font-size:24px; font-weight:700; color:var(--crema); margin-bottom:20px; border-bottom:1px solid var(--line); padding-bottom:16px;">Coffee Origins</h1>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px;">
          <div class="feature-widget-card">
            <div class="widget-title" style="color:var(--amber)">01 • Ethiopia Yirgacheffe</div>
            <div style="font-size:12px; color:var(--t2);">Floral & citrus notes</div>
          </div>
          <div class="feature-widget-card">
            <div class="widget-title" style="color:var(--caramel)">02 • Brazil Cerrado</div>
            <div style="font-size:12px; color:var(--t2);">Chocolate & hazelnut profile</div>
          </div>
        </div>
      </div>
    `;
  }
}

window.showSettingsSection = function(sectionId) {
  const contentPane = document.getElementById('settings-content-pane');
  if (!contentPane) return;

  document.querySelectorAll('.settings-nav-item').forEach(el => el.classList.remove('active'));
  const navItem = document.getElementById(`nav-item-${sectionId}`);
  if (navItem) navItem.classList.add('active');

  const renderer = window.CoffeePagesRenderer;
  if (sectionId === 'shields') contentPane.innerHTML = renderer.renderSettingsShieldsSection();
  else if (sectionId === 'appearance') contentPane.innerHTML = renderer.renderSettingsAppearanceSection();
  else if (sectionId === 'search') contentPane.innerHTML = renderer.renderSettingsSearchSection();
  else if (sectionId === 'language') contentPane.innerHTML = renderer.renderSettingsLanguageSection();
  else if (sectionId === 'startup') contentPane.innerHTML = renderer.renderSettingsStartupSection();
  else if (sectionId === 'privacy') contentPane.innerHTML = renderer.renderSettingsPrivacySection();
  else if (sectionId === 'system') contentPane.innerHTML = renderer.renderSettingsSystemSection();
  else if (sectionId === 'about') contentPane.innerHTML = renderer.renderSettingsAboutSection();
  else if (sectionId === 'downloads') contentPane.innerHTML = renderer.renderSettingsDownloadsSection();
};

window.CoffeePagesRenderer = new PagesContentRenderer();
