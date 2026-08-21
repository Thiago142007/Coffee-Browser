/**
 * Coffee Browser Internationalization (i18n) Engine
 * Detects system language, manages language state, and provides translations.
 */

(function() {
  const supportedLanguages = {
    'pt-BR': {
      name: 'Português (Brasil)',
      flag: '🇧🇷'
    },
    'en-US': {
      name: 'English (United States)',
      flag: '🇺🇸'
    },
    'es-ES': {
      name: 'Español',
      flag: '🇪🇸'
    },
    'fr-FR': {
      name: 'Français',
      flag: '🇫🇷'
    },
    'de-DE': {
      name: 'Deutsch',
      flag: '🇩🇪'
    },
    'it-IT': {
      name: 'Italiano',
      flag: '🇮🇹'
    },
    'ja-JP': {
      name: '日本語 (Japanese)',
      flag: '🇯🇵'
    },
    'zh-CN': {
      name: '中文 (Simplified)',
      flag: '🇨🇳'
    },
    'ru-RU': {
      name: 'Русский (Russian)',
      flag: '🇷🇺'
    }
  };

  const translations = {
    'pt-BR': {
      // General & Window Controls
      app_title: 'Coffee Browser',
      app_desc: 'Coffee Browser — Navegador web de alta performance com arquitetura de privacidade e proteção ativa de dados.',
      minimize: 'Minimizar',
      maximize: 'Maximizar',
      restore: 'Restaurar',
      close: 'Fechar',
      back: 'Voltar',
      forward: 'Avançar',
      refresh: 'Recarregar',
      stop: 'Parar',
      search_placeholder: 'Pesquisar na Web ou digitar URL (ex: wikipedia.org, github.com)...',
      security_system: 'Sistema',
      security_secure: 'Seguro',
      security_insecure: 'Não seguro',
      zoom_page: 'Zoom da página',
      reader_mode: 'Modo Leitor',
      bookmark_page: 'Favoritar esta página',
      settings: 'Configurações',
      new_tab: 'Nova Aba',
      private_tab: 'Aba Privada',
      close_tab: 'Fechar Aba',
      open_in_new_tab: 'Abrir em Nova Aba',
      open_in_private_tab: 'Abrir em Aba Privada',

      // Status Bar
      status_online: 'ONLINE',
      status_offline: 'OFFLINE',
      status_latency: 'LATÊNCIA:',
      status_roast: 'TORRA:',
      status_memory: 'MEMÓRIA:',
      status_shields: 'ESCUDOS:',
      status_active: 'ATIVOS',
      status_paused: 'PAUSADOS',

      // Roast Levels
      roast_claro: 'CLARA',
      roast_medio: 'MÉDIA',
      roast_escuro: 'ESCURA',
      roast_oculto: 'OCULTA',

      // Coador AdBlock
      coador_title: 'Coador',
      coador_tag: 'AdBlock',
      coador_version: 'v5.4.1 • Proteção Premium',
      coador_active: 'ATIVO',
      coador_paused: 'PAUSADO',
      coador_blocked_page: 'Anúncios bloqueados nesta página:',
      coador_total_blocked: 'Total de anúncios bloqueados:',
      coador_pause_site: 'Pausar o Coador neste site',
      coador_resume_site: 'Reativar o Coador neste site',
      coador_pause_global: 'Pausar em todos os sites',
      coador_resume_global: 'Reativar em todos os sites',
      coador_pause_global_sub: 'Desativa temporariamente o bloqueador',
      coador_resume_global_sub: 'Bloqueio ativo em toda a web',
      coador_block_element: 'Bloquear um elemento nesta página',
      coador_block_element_sub: 'Clique em qualquer anúncio ou item para sumir',
      coador_options_btn: 'Opções & Filtros do Coador',

      // New Tab
      nt_trackers_blocked: 'Rastreadores Bloqueados',
      nt_bandwidth_saved: 'Banda Economizada',
      nt_time_saved: 'Tempo Economizado',
      nt_https_connections: 'Conexões HTTPS',
      nt_greeting_morning: 'Bom dia',
      nt_greeting_afternoon: 'Boa tarde',
      nt_greeting_evening: 'Boa noite',
      nt_search_btn: 'Pesquisar',
      nt_widget_protection: 'Proteção e Escudos',
      nt_widget_protection_desc: 'Escudos ativos bloqueando anúncios invasivos, rastreadores e coleta de dados.',
      nt_widget_details: 'Detalhes',
      nt_widget_settings: 'Configurações',
      nt_widget_settings_desc: 'Gerencie privacidade, aparência, idioma, mecanismos de busca e inicialização.',
      nt_widget_access: 'Acessar',

      // Settings Navigation
      settings_nav_shields: 'Coador (Bloqueador)',
      settings_nav_appearance: 'Aparência & Tema',
      settings_nav_search: 'Mecanismo de Pesquisa',
      settings_nav_language: 'Idioma & Região',
      settings_nav_startup: 'Na Inicialização',
      settings_nav_privacy: 'Privacidade e Segurança',
      settings_nav_history: 'Histórico de Navegação',
      settings_nav_system: 'Sistema & Desempenho',
      settings_nav_about: 'Sobre o Coffee Browser',

      // Settings - Shields
      settings_shields_title: 'Proteção e Escudos Brave',
      settings_shields_sub: 'Configure as proteções padrão que o navegador aplica em todas as páginas visitadas.',
      settings_shields_block_title: 'Proteção contra rastreamento e anúncios',
      settings_shields_block_label: 'Bloqueio de Rastreamento (Shields)',
      settings_shields_block_desc: 'Bloqueia anúncios e rastreadores incorporados em websites.',
      settings_shields_aggressive: 'Agressivo (Recomendado)',
      settings_shields_standard: 'Padrão',
      settings_shields_disabled: 'Desativado',
      settings_shields_https_title: 'Atualização automática para HTTPS',
      settings_shields_https_desc: 'Reescreve conexões inseguras HTTP para conexões criptografadas.',
      settings_shields_fp_title: 'Proteção contra Impressão Digital (Anti-Fingerprinting)',
      settings_shields_fp_desc: 'Impede que sites identifiquem exclusivamente a configuração de hardware do seu dispositivo.',
      settings_shields_dns_title: 'DNS Seguro Criptografado (Cloudflare 1.1.1.1)',
      settings_shields_dns_desc: 'Todas as buscas e navegações utilizam DNS over HTTPS (DoH) da Cloudflare para privacidade total.',
      settings_shields_scriptlets_title: 'Desarmador de Anti-Adblock (Scriptlets)',
      settings_shields_scriptlets_desc: 'Neutraliza verificações de adblock e bypassa avisos de bloqueio em portais de notícias e vídeos.',
      settings_shields_query_title: 'Higienizador de URLs contra Rastreamento (Query Stripper)',
      settings_shields_query_desc: 'Remove automaticamente parâmetros espiões (fbclid, gclid, utm_source, igshid) de links clicados.',
      settings_shields_cookies_title: 'Bloquear Cookies de Terceiros',
      settings_shields_cookies_desc: 'Impede que anunciantes rastreiem sua navegação entre diferentes domínios.',
      settings_shields_whitelist_title: 'Lista de Exceções do Coador (Sites Pausados)',
      settings_shields_whitelist_sub: 'Sites onde o bloqueador de anúncios foi pausado pelo usuário:',
      settings_shields_whitelist_empty: 'Nenhum site pausado. O Coador está protegendo 100% dos sites.',
      settings_shields_reactivate: 'Reativar Coador',

      // Settings - Appearance
      settings_appearance_title: 'Aparência e Tema',
      settings_appearance_sub: 'Personalize a identidade visual e os controles do navegador.',
      settings_appearance_theme_title: 'Esquema de Cores e Nível de Torra',
      settings_appearance_show_bm: 'Exibir Barra de Favoritos',
      settings_appearance_show_bm_sub: 'Mostra a barra de atalhos logo abaixo da barra de endereços.',

      // Settings - Search
      settings_search_title: 'Mecanismo de Pesquisa',
      settings_search_sub: 'Defina o provedor padrão utilizado na barra de endereços e na página inicial.',
      settings_search_active_title: 'Provedor de Busca Ativo',
      settings_search_default_label: 'Mecanismo de busca padrão:',

      // Settings - Language
      settings_language_title: 'Idioma e Região',
      settings_language_sub: 'Defina a linguagem da interface do navegador e a sincronização com o site.',
      settings_language_active_title: 'Linguagem do Navegador',
      settings_language_select_label: 'Selecione o idioma desejado:',
      settings_language_auto_option: 'Automático (Detectar do Sistema)',
      settings_language_detected_info: 'Idioma detectado no seu sistema:',
      settings_language_sync_badge: 'SINCRONIZAÇÃO AUTOMÁTICA ATIVA',
      settings_language_sync_info: 'As alterações de idioma são salvas instantaneamente e sincronizadas com o site oficial.',

      // Settings - Startup
      settings_startup_title: 'Na Inicialização',
      settings_startup_sub: 'Escolha o que abrir quando o navegador for iniciado.',
      settings_startup_newtab: 'Abrir a página Nova Aba',
      settings_startup_continue: 'Continuar de onde você parou',

      // Settings - Privacy
      settings_privacy_title: 'Privacidade e Segurança',
      settings_privacy_sub: 'Gerencie dados de navegação, cookies e permissões.',
      settings_privacy_history_title: 'Histórico de Navegação',
      settings_privacy_history_desc: 'Visualize e gerencie suas pesquisas e sites visitados por dia e horário.',
      settings_privacy_history_btn: 'Abrir Histórico',
      settings_privacy_clear_title: 'Limpar Dados de Navegação',
      settings_privacy_clear_desc: 'Exclui histórico, cache e cookies salvos localmente.',
      settings_privacy_clear_btn: 'Limpar Agora',

      // Settings - System
      settings_system_title: 'Sistema e Desempenho',
      settings_system_sub: 'Configurações avançadas de hardware e recursos.',
      settings_system_gpu_title: 'Aceleração de Hardware',
      settings_system_gpu_desc: 'Usar aceleração de GPU gráfica quando disponível.',

      // Settings - About
      settings_about_title: 'Sobre o Coffee Browser',
      settings_about_sub: 'Informações do aplicativo e versão instalada.',
      settings_about_app_name: 'Coffee Browser Desktop',
      settings_about_version: 'Versão 1.0.0 (Windows x64 Executable)',
      settings_about_up_to_date: 'O Coffee Browser está atualizado.',

      // History
      history_title: 'Histórico de Navegação',
      history_sub: 'Registros cronológicos detalhados da sua navegação e pesquisas.',
      history_clear_all: 'Limpar Todo o Histórico',
      history_search_placeholder: 'Pesquisar no histórico por título ou URL...',
      history_empty_title: 'Seu histórico está limpo',
      history_empty_desc: 'Páginas e buscas que você visitar aparecerão aqui organizadas por dia e horário.',
      history_today: 'Hoje',
      history_yesterday: 'Ontem',
      history_visits: 'visitas',
      history_visit: 'visita',
      history_delete_item: 'Remover do histórico',

      // Bookmarks
      bookmarks_title: 'Favoritos',
      bookmarks_add_title: 'Adicionar aos Favoritos',
      bookmarks_edit_title: 'Editar Favorito',
      bookmarks_name_label: 'Nome',
      bookmarks_url_label: 'URL',
      bookmarks_name_placeholder: 'Nome do favorito...',
      bookmarks_cancel_btn: 'Cancelar',
      bookmarks_save_btn: 'Adicionar',
      bookmarks_edit_save_btn: 'Salvar',
      bookmarks_delete_btn: 'Excluir Favorito',

      // Downloads
      downloads_title: 'Downloads',
      downloads_completed: 'Concluído',

      // Session Recovery
      restore_title: 'Aviso de Recuperação',
      restore_desc: 'Suas abas foram fechadas de forma inesperada!',
      restore_btn: 'Restaurar',

      // Quotes
      quote_1: '“A simplicidade é o último grau da sofisticação.”',
      quote_2: '“Navegue com privacidade total, alta performance e controle dos seus dados.”',
      quote_3: '“A velocidade da web depende da ausência de rastreadores e ruídos desnecessários.”'
    },

    'en-US': {
      app_title: 'Coffee Browser',
      app_desc: 'Coffee Browser — High-performance web browser with privacy-first architecture and active protection.',
      minimize: 'Minimize',
      maximize: 'Maximize',
      restore: 'Restore',
      close: 'Close',
      back: 'Back',
      forward: 'Forward',
      refresh: 'Reload',
      stop: 'Stop',
      search_placeholder: 'Search the web or type a URL (e.g., wikipedia.org, github.com)...',
      security_system: 'System',
      security_secure: 'Secure',
      security_insecure: 'Not secure',
      zoom_page: 'Page zoom',
      reader_mode: 'Reader Mode',
      bookmark_page: 'Bookmark this page',
      settings: 'Settings',
      new_tab: 'New Tab',
      private_tab: 'Private Tab',
      close_tab: 'Close Tab',
      open_in_new_tab: 'Open in New Tab',
      open_in_private_tab: 'Open in Private Tab',

      status_online: 'ONLINE',
      status_offline: 'OFFLINE',
      status_latency: 'LATENCY:',
      status_roast: 'ROAST:',
      status_memory: 'MEMORY:',
      status_shields: 'SHIELDS:',
      status_active: 'ACTIVE',
      status_paused: 'PAUSED',

      roast_claro: 'LIGHT',
      roast_medio: 'MEDIUM',
      roast_escuro: 'DARK',
      roast_oculto: 'STEALTH',

      coador_title: 'Coador',
      coador_tag: 'AdBlock',
      coador_version: 'v5.4.1 • Premium Protection',
      coador_active: 'ACTIVE',
      coador_paused: 'PAUSED',
      coador_blocked_page: 'Ads blocked on this page:',
      coador_total_blocked: 'Total ads blocked:',
      coador_pause_site: 'Pause Coador on this site',
      coador_resume_site: 'Resume Coador on this site',
      coador_pause_global: 'Pause on all sites',
      coador_resume_global: 'Resume on all sites',
      coador_pause_global_sub: 'Temporarily disables the adblocker',
      coador_resume_global_sub: 'Active ad blocking across the web',
      coador_block_element: 'Block an element on this page',
      coador_block_element_sub: 'Click any ad or element to hide it',
      coador_options_btn: 'Coador Options & Filters',

      nt_trackers_blocked: 'Trackers Blocked',
      nt_bandwidth_saved: 'Bandwidth Saved',
      nt_time_saved: 'Time Saved',
      nt_https_connections: 'HTTPS Connections',
      nt_greeting_morning: 'Good morning',
      nt_greeting_afternoon: 'Good afternoon',
      nt_greeting_evening: 'Good evening',
      nt_search_btn: 'Search',
      nt_widget_protection: 'Protection & Shields',
      nt_widget_protection_desc: 'Active shields blocking intrusive ads, trackers, and data harvesting.',
      nt_widget_details: 'Details',
      nt_widget_settings: 'Settings',
      nt_widget_settings_desc: 'Manage privacy, appearance, language, search engines, and startup preferences.',
      nt_widget_access: 'Access',

      settings_nav_shields: 'Coador (AdBlocker)',
      settings_nav_appearance: 'Appearance & Theme',
      settings_nav_search: 'Search Engine',
      settings_nav_language: 'Language & Region',
      settings_nav_startup: 'On Startup',
      settings_nav_privacy: 'Privacy & Security',
      settings_nav_history: 'Browsing History',
      settings_nav_system: 'System & Performance',
      settings_nav_about: 'About Coffee Browser',

      settings_shields_title: 'Brave-Style Shields & Protection',
      settings_shields_sub: 'Configure default protection applied to all visited websites.',
      settings_shields_block_title: 'Tracking & Ads Protection',
      settings_shields_block_label: 'Trackers & Ads Blocking (Shields)',
      settings_shields_block_desc: 'Blocks embedded ads and tracking scripts across web pages.',
      settings_shields_aggressive: 'Aggressive (Recommended)',
      settings_shields_standard: 'Standard',
      settings_shields_disabled: 'Disabled',
      settings_shields_https_title: 'Automatic Upgrade to HTTPS',
      settings_shields_https_desc: 'Automatically upgrades insecure HTTP requests to encrypted HTTPS connections.',
      settings_shields_fp_title: 'Anti-Fingerprinting Protection',
      settings_shields_fp_desc: 'Prevents websites from uniquely identifying your hardware and canvas profile.',
      settings_shields_dns_title: 'Secure Encrypted DNS (Cloudflare 1.1.1.1)',
      settings_shields_dns_desc: 'All searches and lookups route through Cloudflare DNS-over-HTTPS (DoH) for total ISP privacy.',
      settings_shields_scriptlets_title: 'Anti-Adblock Defuser (Scriptlets)',
      settings_shields_scriptlets_desc: 'Neutralizes adblock detectors and bypasses forced anti-adblock banners on news and video sites.',
      settings_shields_query_title: 'URL Tracking Parameter Stripper',
      settings_shields_query_desc: 'Automatically removes tracking parameters (fbclid, gclid, utm_source, igshid) from clicked links.',
      settings_shields_cookies_title: 'Block Third-Party Cookies',
      settings_shields_cookies_desc: 'Prevents advertisers from following you across multiple websites.',
      settings_shields_whitelist_title: 'Coador Whitelist (Paused Sites)',
      settings_shields_whitelist_sub: 'Domains where ad blocking has been paused by the user:',
      settings_shields_whitelist_empty: 'No paused sites. Coador is actively protecting 100% of sites.',
      settings_shields_reactivate: 'Re-enable Coador',

      settings_appearance_title: 'Appearance and Theme',
      settings_appearance_sub: 'Customize the visual identity and browser controls.',
      settings_appearance_theme_title: 'Color Scheme & Roast Level',
      settings_appearance_show_bm: 'Show Bookmarks Bar',
      settings_appearance_show_bm_sub: 'Displays the shortcuts bar directly under the address bar.',

      settings_search_title: 'Search Engine',
      settings_search_sub: 'Set the default search engine used in the omnibox and new tab page.',
      settings_search_active_title: 'Active Search Engine',
      settings_search_default_label: 'Default search engine:',

      settings_language_title: 'Language & Region',
      settings_language_sub: 'Choose your browser interface language and synchronize it with the website.',
      settings_language_active_title: 'Browser Language',
      settings_language_select_label: 'Select desired language:',
      settings_language_auto_option: 'Automatic (Detect from System)',
      settings_language_detected_info: 'Language detected from your OS:',
      settings_language_sync_badge: 'AUTO-SYNC ACTIVE',
      settings_language_sync_info: 'Language settings are instantly saved and synchronized with the official website.',

      settings_startup_title: 'On Startup',
      settings_startup_sub: 'Choose what opens when you start the browser.',
      settings_startup_newtab: 'Open the New Tab page',
      settings_startup_continue: 'Continue where you left off',

      settings_privacy_title: 'Privacy and Security',
      settings_privacy_sub: 'Manage browsing data, cookies, and permissions.',
      settings_privacy_history_title: 'Browsing History',
      settings_privacy_history_desc: 'View and manage your searches and visited sites by date and time.',
      settings_privacy_history_btn: 'Open History',
      settings_privacy_clear_title: 'Clear Browsing Data',
      settings_privacy_clear_desc: 'Deletes browsing history, cache, and locally stored cookies.',
      settings_privacy_clear_btn: 'Clear Now',

      settings_system_title: 'System & Performance',
      settings_system_sub: 'Advanced hardware acceleration and resource settings.',
      settings_system_gpu_title: 'Hardware Acceleration',
      settings_system_gpu_desc: 'Use GPU hardware graphics acceleration when available.',

      settings_about_title: 'About Coffee Browser',
      settings_about_sub: 'Application information and installed build.',
      settings_about_app_name: 'Coffee Browser Desktop',
      settings_about_version: 'Version 1.0.0 (Windows x64 Executable)',
      settings_about_up_to_date: 'Coffee Browser is up to date.',

      history_title: 'Browsing History',
      history_sub: 'Detailed chronological records of your navigation and searches.',
      history_clear_all: 'Clear All History',
      history_search_placeholder: 'Search history by title or URL...',
      history_empty_title: 'Your history is clean',
      history_empty_desc: 'Pages and searches you visit will appear here organized by date and time.',
      history_today: 'Today',
      history_yesterday: 'Yesterday',
      history_visits: 'visits',
      history_visit: 'visit',
      history_delete_item: 'Remove from history',

      bookmarks_title: 'Bookmarks',
      bookmarks_add_title: 'Add to Bookmarks',
      bookmarks_edit_title: 'Edit Bookmark',
      bookmarks_name_label: 'Name',
      bookmarks_url_label: 'URL',
      bookmarks_name_placeholder: 'Bookmark name...',
      bookmarks_cancel_btn: 'Cancel',
      bookmarks_save_btn: 'Add',
      bookmarks_edit_save_btn: 'Save',
      bookmarks_delete_btn: 'Delete Bookmark',

      downloads_title: 'Downloads',
      downloads_completed: 'Completed',

      restore_title: 'Recovery Warning',
      restore_desc: 'Your tabs were closed unexpectedly!',
      restore_btn: 'Restore',

      quote_1: '“Simplicity is the ultimate sophistication.”',
      quote_2: '“Browse with complete privacy, blazing speed, and absolute control over your data.”',
      quote_3: '“The speed of the web begins with the absence of trackers and unwanted noise.”'
    },

    'es-ES': {
      app_title: 'Coffee Browser',
      app_desc: 'Coffee Browser — Navegador web de alto rendimiento con privacidad y protección activa.',
      minimize: 'Minimizar',
      maximize: 'Maximizar',
      restore: 'Restaurar',
      close: 'Cerrar',
      back: 'Atrás',
      forward: 'Adelante',
      refresh: 'Recargar',
      stop: 'Detener',
      search_placeholder: 'Buscar en la web o escribir URL...',
      security_system: 'Sistema',
      security_secure: 'Seguro',
      security_insecure: 'No seguro',
      zoom_page: 'Zoom de la página',
      reader_mode: 'Modo Lectura',
      bookmark_page: 'Guardar en marcadores',
      settings: 'Configuración',
      new_tab: 'Nueva Pestaña',
      private_tab: 'Pestaña Privada',
      close_tab: 'Cerrar Pestaña',
      open_in_new_tab: 'Abrir en Nueva Pestaña',
      open_in_private_tab: 'Abrir en Pestaña Privada',

      status_online: 'EN LÍNEA',
      status_offline: 'DESCONECTADO',
      status_latency: 'LATENCIA:',
      status_roast: 'TUESTE:',
      status_memory: 'MEMORIA:',
      status_shields: 'ESCUDOS:',
      status_active: 'ACTIVOS',
      status_paused: 'PAUSADOS',

      roast_claro: 'CLARO',
      roast_medio: 'MEDIO',
      roast_escuro: 'OSCURO',
      roast_oculto: 'SIGILOSO',

      coador_title: 'Coador',
      coador_tag: 'AdBlock',
      coador_version: 'v5.4.1 • Protección Premium',
      coador_active: 'ACTIVO',
      coador_paused: 'PAUSADO',
      coador_blocked_page: 'Anuncios bloqueados en esta página:',
      coador_total_blocked: 'Total de anuncios bloqueados:',
      coador_pause_site: 'Pausar Coador en este sitio',
      coador_resume_site: 'Reanudar Coador en este sitio',
      coador_pause_global: 'Pausar en todos los sitios',
      coador_resume_global: 'Reanudar en todos los sitios',
      coador_pause_global_sub: 'Desactiva temporalmente el bloqueador',
      coador_resume_global_sub: 'Bloqueo activo en toda la web',
      coador_block_element: 'Bloquear un elemento en esta página',
      coador_block_element_sub: 'Haga clic en cualquier anuncio para ocultarlo',
      coador_options_btn: 'Opciones y Filtros de Coador',

      nt_trackers_blocked: 'Rastreadores Bloqueados',
      nt_bandwidth_saved: 'Banda Ahorrada',
      nt_time_saved: 'Tiempo Ahorrado',
      nt_https_connections: 'Conexiones HTTPS',
      nt_greeting_morning: 'Buenos días',
      nt_greeting_afternoon: 'Buenas tardes',
      nt_greeting_evening: 'Buenas noches',
      nt_search_btn: 'Buscar',
      nt_widget_protection: 'Protección y Escudos',
      nt_widget_protection_desc: 'Escudos activos bloqueando rastreadores y anuncios.',
      nt_widget_details: 'Detalles',
      nt_widget_settings: 'Configuración',
      nt_widget_settings_desc: 'Administre privacidad, apariencia, idioma e inicio.',
      nt_widget_access: 'Acceder',

      settings_nav_shields: 'Coador (Bloqueador)',
      settings_nav_appearance: 'Apariencia y Tema',
      settings_nav_search: 'Motor de Búsqueda',
      settings_nav_language: 'Idioma y Región',
      settings_nav_startup: 'Al Iniciar',
      settings_nav_privacy: 'Privacidad y Seguridad',
      settings_nav_history: 'Historial de Navegación',
      settings_nav_system: 'Sistema y Rendimiento',
      settings_nav_about: 'Acerca de Coffee Browser',

      settings_shields_title: 'Protección y Escudos',
      settings_shields_sub: 'Configure las protecciones estándar para todas las páginas.',
      settings_shields_block_title: 'Protección contra anuncios y rastreo',
      settings_shields_block_label: 'Bloqueo de Rastreo (Shields)',
      settings_shields_block_desc: 'Bloquea rastreadores y anuncios incrustados.',
      settings_shields_aggressive: 'Agresivo (Recomendado)',
      settings_shields_standard: 'Estándar',
      settings_shields_disabled: 'Desactivado',
      settings_shields_https_title: 'Actualización automática a HTTPS',
      settings_shields_https_desc: 'Actualiza automáticamente a conexiones seguras HTTPS.',
      settings_shields_fp_title: 'Protección contra Huella Digital',
      settings_shields_fp_desc: 'Evita que los sitios identifiquen su configuración de hardware.',
      settings_shields_dns_title: 'DNS Seguro Cifrado (Cloudflare 1.1.1.1)',
      settings_shields_dns_desc: 'Todas las consultas usan DNS sobre HTTPS de Cloudflare.',
      settings_shields_scriptlets_title: 'Desarmador de Anti-Adblock',
      settings_shields_scriptlets_desc: 'Neutraliza detectores de adblock en sitios web.',
      settings_shields_query_title: 'Limpieza de parámetros de rastreo en URLs',
      settings_shields_query_desc: 'Elimina automáticamente parámetros espía como fbclid y gclid.',
      settings_shields_cookies_title: 'Bloquear Cookies de Terceros',
      settings_shields_cookies_desc: 'Impide que los anunciantes rastreen entre diferentes dominios.',
      settings_shields_whitelist_title: 'Lista de Excepciones',
      settings_shields_whitelist_sub: 'Sitios donde el bloqueador está en pausa:',
      settings_shields_whitelist_empty: 'No hay sitios pausados. Coador protege el 100% de los sitios.',
      settings_shields_reactivate: 'Reactivar Coador',

      settings_appearance_title: 'Apariencia y Tema',
      settings_appearance_sub: 'Personalice el tema y controles del navegador.',
      settings_appearance_theme_title: 'Nivel de Tueste y Color',
      settings_appearance_show_bm: 'Mostrar Barra de Marcadores',
      settings_appearance_show_bm_sub: 'Muestra la barra de atajos debajo de la barra de direcciones.',

      settings_search_title: 'Motor de Búsqueda',
      settings_search_sub: 'Defina el buscador predeterminado.',
      settings_search_active_title: 'Buscador Activo',
      settings_search_default_label: 'Motor de búsqueda predeterminado:',

      settings_language_title: 'Idioma y Región',
      settings_language_sub: 'Elija el idioma de la interfaz y la sincronización con el sitio.',
      settings_language_active_title: 'Idioma del Navegador',
      settings_language_select_label: 'Seleccione el idioma deseado:',
      settings_language_auto_option: 'Automático (Detectar del Sistema)',
      settings_language_detected_info: 'Idioma detectado en su sistema operativo:',
      settings_language_sync_badge: 'SINCRONIZACIÓN ACTIVA',
      settings_language_sync_info: 'Las modificaciones se guardan y se sincronizan con el sitio web.',

      settings_startup_title: 'Al Iniciar',
      settings_startup_sub: 'Elija qué abrir al iniciar el navegador.',
      settings_startup_newtab: 'Abrir la página Nueva Pestaña',
      settings_startup_continue: 'Continuar donde lo dejó',

      settings_privacy_title: 'Privacidad y Seguridad',
      settings_privacy_sub: 'Administre datos de navegación y cookies.',
      settings_privacy_history_title: 'Historial de Navegación',
      settings_privacy_history_desc: 'Vea y administre sus sitios visitados por fecha.',
      settings_privacy_history_btn: 'Abrir Historial',
      settings_privacy_clear_title: 'Borrar Datos de Navegación',
      settings_privacy_clear_desc: 'Elimina historial, caché y cookies guardadas.',
      settings_privacy_clear_btn: 'Borrar Ahora',

      settings_system_title: 'Sistema y Rendimiento',
      settings_system_sub: 'Configuración avanzada de hardware.',
      settings_system_gpu_title: 'Aceleración por Hardware',
      settings_system_gpu_desc: 'Usar GPU gráfica cuando esté disponible.',

      settings_about_title: 'Acerca de Coffee Browser',
      settings_about_sub: 'Información y versión de la aplicación.',
      settings_about_app_name: 'Coffee Browser Desktop',
      settings_about_version: 'Versión 1.0.0 (Windows x64 Executable)',
      settings_about_up_to_date: 'Coffee Browser está actualizado.',

      history_title: 'Historial de Navegación',
      history_sub: 'Registros cronológicos detallados de su navegación.',
      history_clear_all: 'Borrar Todo el Historial',
      history_search_placeholder: 'Buscar en el historial por título o URL...',
      history_empty_title: 'Su historial está limpio',
      history_empty_desc: 'Las páginas visitadas aparecerán aquí organizadas.',
      history_today: 'Hoy',
      history_yesterday: 'Ayer',
      history_visits: 'visitas',
      history_visit: 'visita',
      history_delete_item: 'Eliminar del historial',

      bookmarks_title: 'Marcadores',
      bookmarks_add_title: 'Añadir a Marcadores',
      bookmarks_edit_title: 'Editar Marcador',
      bookmarks_name_label: 'Nombre',
      bookmarks_url_label: 'URL',
      bookmarks_name_placeholder: 'Nombre del marcador...',
      bookmarks_cancel_btn: 'Cancelar',
      bookmarks_save_btn: 'Añadir',
      bookmarks_edit_save_btn: 'Guardar',
      bookmarks_delete_btn: 'Eliminar Marcador',

      downloads_title: 'Descargas',
      downloads_completed: 'Completado',

      restore_title: 'Aviso de Recuperación',
      restore_desc: '¡Sus pestañas se cerraron de forma inesperada!',
      restore_btn: 'Restaurar',

      quote_1: '“La simplicidad es la máxima sofisticación.”',
      quote_2: '“Navegue con privacidad total, velocidad y control sobre sus datos.”',
      quote_3: '“La velocidad de la web empieza con la ausencia de rastreadores y ruido.”'
    },

    'fr-FR': {
      app_title: 'Coffee Browser',
      app_desc: 'Coffee Browser — Navigateur haute performance axé sur la confidentialité et la vitesse.',
      minimize: 'Réduire',
      maximize: 'Agrandir',
      restore: 'Restaurer',
      close: 'Fermer',
      back: 'Précédent',
      forward: 'Suivant',
      refresh: 'Actualiser',
      stop: 'Arrêter',
      search_placeholder: 'Rechercher sur le Web ou saisir une URL...',
      security_system: 'Système',
      security_secure: 'Sécurisé',
      security_insecure: 'Non sécurisé',
      zoom_page: 'Zoom de page',
      reader_mode: 'Mode Lecture',
      bookmark_page: 'Ajouter aux favoris',
      settings: 'Paramètres',
      new_tab: 'Nouvel Onglet',
      private_tab: 'Onglet Privé',
      close_tab: 'Fermer l’onglet',
      open_in_new_tab: 'Ouvrir dans un nouvel onglet',
      open_in_private_tab: 'Ouvrir dans un onglet privé',

      status_online: 'EN LIGNE',
      status_offline: 'HORS LIGNE',
      status_latency: 'LATENCE:',
      status_roast: 'TORRÉFACTION:',
      status_memory: 'MÉMOIRE:',
      status_shields: 'BOUCLIERS:',
      status_active: 'ACTIFS',
      status_paused: 'PAUSE',

      roast_claro: 'CLAIRE',
      roast_medio: 'MOYENNE',
      roast_escuro: 'FONCÉE',
      roast_oculto: 'FURTIVE',

      coador_title: 'Coador',
      coador_tag: 'AdBlock',
      coador_version: 'v5.4.1 • Protection Premium',
      coador_active: 'ACTIF',
      coador_paused: 'PAUSE',
      coador_blocked_page: 'Publicités bloquées sur cette page:',
      coador_total_blocked: 'Total des publicités bloquées:',
      coador_pause_site: 'Mettre Coador en pause sur ce site',
      coador_resume_site: 'Reprendre Coador sur ce site',
      coador_pause_global: 'Mettre en pause sur tous les sites',
      coador_resume_global: 'Reprendre sur tous les sites',
      coador_pause_global_sub: 'Désactive temporairement le bloqueur',
      coador_resume_global_sub: 'Blocage actif sur tout le web',
      coador_block_element: 'Bloquer un élément sur cette page',
      coador_block_element_sub: 'Cliquez sur n’importe quel élément pour le masquer',
      coador_options_btn: 'Options et Filtres Coador',

      nt_trackers_blocked: 'Traqueurs Bloqués',
      nt_bandwidth_saved: 'Bande Passante Économisée',
      nt_time_saved: 'Temps Économisé',
      nt_https_connections: 'Connexions HTTPS',
      nt_greeting_morning: 'Bonjour',
      nt_greeting_afternoon: 'Bon après-midi',
      nt_greeting_evening: 'Bonsoir',
      nt_search_btn: 'Rechercher',
      nt_widget_protection: 'Protection & Boucliers',
      nt_widget_protection_desc: 'Boucliers actifs bloquant les publicités intrusives et les traqueurs.',
      nt_widget_details: 'Détails',
      nt_widget_settings: 'Paramètres',
      nt_widget_settings_desc: 'Gérez la confidentialité, l’apparence, la langue et le démarrage.',
      nt_widget_access: 'Accéder',

      settings_nav_shields: 'Coador (Bloqueur)',
      settings_nav_appearance: 'Apparence & Thème',
      settings_nav_search: 'Moteur de Recherche',
      settings_nav_language: 'Langue & Région',
      settings_nav_startup: 'Au Démarrage',
      settings_nav_privacy: 'Confidentialité & Sécurité',
      settings_nav_history: 'Historique de Navigation',
      settings_nav_system: 'Système & Performance',
      settings_nav_about: 'À Propos de Coffee Browser',

      settings_shields_title: 'Boucliers et Protection',
      settings_shields_sub: 'Configurez la protection par défaut appliquée à tous les sites.',
      settings_shields_block_title: 'Protection contre les traqueurs et publicités',
      settings_shields_block_label: 'Blocage des Traqueurs (Shields)',
      settings_shields_block_desc: 'Bloque les publicités et traqueurs intégrés.',
      settings_shields_aggressive: 'Agressif (Recommandé)',
      settings_shields_standard: 'Standard',
      settings_shields_disabled: 'Désactivé',
      settings_shields_https_title: 'Mise à niveau automatique HTTPS',
      settings_shields_https_desc: 'Met à niveau les connexions non sécurisées vers HTTPS.',
      settings_shields_fp_title: 'Protection Anti-Empreinte Numérique',
      settings_shields_fp_desc: 'Empêche les sites d’identifier le profil matériel de votre appareil.',
      settings_shields_dns_title: 'DNS Sécurisé Chiffré (Cloudflare 1.1.1.1)',
      settings_shields_dns_desc: 'Toutes les recherches utilisent Cloudflare DNS over HTTPS.',
      settings_shields_scriptlets_title: 'Désamorceur Anti-Adblock',
      settings_shields_scriptlets_desc: 'Neutralise les détecteurs d’adblock sur les sites.',
      settings_shields_query_title: 'Nettoyeur de Paramètres d’URL',
      settings_shields_query_desc: 'Supprime automatiquement les paramètres de suivi (fbclid, gclid).',
      settings_shields_cookies_title: 'Bloquer les Cookies Tiers',
      settings_shields_cookies_desc: 'Empêche les annonceurs de vous suivre entre plusieurs domaines.',
      settings_shields_whitelist_title: 'Liste Blanche Coador',
      settings_shields_whitelist_sub: 'Sites où le bloqueur a été mis en pause:',
      settings_shields_whitelist_empty: 'Aucun site en pause. Coador protège 100% des sites.',
      settings_shields_reactivate: 'Réactiver Coador',

      settings_appearance_title: 'Apparence et Thème',
      settings_appearance_sub: 'Personnalisez les thèmes visuels et les commandes.',
      settings_appearance_theme_title: 'Niveau de Torréfaction & Couleur',
      settings_appearance_show_bm: 'Afficher la Barre de Favoris',
      settings_appearance_show_bm_sub: 'Affiche les raccourcis sous la barre d’adresse.',

      settings_search_title: 'Moteur de Recherche',
      settings_search_sub: 'Définissez le moteur de recherche par défaut.',
      settings_search_active_title: 'Moteur de Recherche Actif',
      settings_search_default_label: 'Moteur par défaut:',

      settings_language_title: 'Langue & Région',
      settings_language_sub: 'Choisissez la langue de l’interface et la synchronisation avec le site.',
      settings_language_active_title: 'Langue du Navigateur',
      settings_language_select_label: 'Sélectionnez la langue souhaitée:',
      settings_language_auto_option: 'Automatique (Détecter du Système)',
      settings_language_detected_info: 'Langue détectée sur votre système:',
      settings_language_sync_badge: 'SYNCHRONISATION ACTIVE',
      settings_language_sync_info: 'Les paramètres de langue sont enregistrés et synchronisés avec le site officiel.',

      settings_startup_title: 'Au Démarrage',
      settings_startup_sub: 'Choisissez la page à ouvrir au lancement.',
      settings_startup_newtab: 'Ouvrir la page Nouvel Onglet',
      settings_startup_continue: 'Reprendre où vous vous étiez arrêté',

      settings_privacy_title: 'Confidentialité et Sécurité',
      settings_privacy_sub: 'Gérez vos données de navigation et cookies.',
      settings_privacy_history_title: 'Historique de Navigation',
      settings_privacy_history_desc: 'Consultez et gérez vos sites visités par date.',
      settings_privacy_history_btn: 'Ouvrir l’Historique',
      settings_privacy_clear_title: 'Effacer les Données de Navigation',
      settings_privacy_clear_desc: 'Supprime l’historique, le cache et les cookies locaux.',
      settings_privacy_clear_btn: 'Effacer Maintenant',

      settings_system_title: 'Système & Performance',
      settings_system_sub: 'Paramètres matériels avancés.',
      settings_system_gpu_title: 'Accélération Matérielle',
      settings_system_gpu_desc: 'Utilise l’accélération graphique GPU si disponible.',

      settings_about_title: 'À Propos de Coffee Browser',
      settings_about_sub: 'Informations et version installée.',
      settings_about_app_name: 'Coffee Browser Desktop',
      settings_about_version: 'Version 1.0.0 (Windows x64 Executable)',
      settings_about_up_to_date: 'Coffee Browser est à jour.',

      history_title: 'Historique de Navigation',
      history_sub: 'Enregistrements chronologiques de vos recherches et visites.',
      history_clear_all: 'Effacer Tout l’Historique',
      history_search_placeholder: 'Rechercher dans l’historique...',
      history_empty_title: 'Votre historique est vide',
      history_empty_desc: 'Les pages visitées apparaîtront ici organisées.',
      history_today: 'Aujourd’hui',
      history_yesterday: 'Hier',
      history_visits: 'visites',
      history_visit: 'visite',
      history_delete_item: 'Supprimer de l’historique',

      bookmarks_title: 'Favoris',
      bookmarks_add_title: 'Ajouter aux Favoris',
      bookmarks_edit_title: 'Modifier le Favori',
      bookmarks_name_label: 'Nom',
      bookmarks_url_label: 'URL',
      bookmarks_name_placeholder: 'Nom du favori...',
      bookmarks_cancel_btn: 'Annuler',
      bookmarks_save_btn: 'Ajouter',
      bookmarks_edit_save_btn: 'Enregistrer',
      bookmarks_delete_btn: 'Supprimer le Favori',

      downloads_title: 'Téléchargements',
      downloads_completed: 'Terminé',

      restore_title: 'Alerte de Récupération',
      restore_desc: 'Vos onglets ont été fermés de manière inattendue !',
      restore_btn: 'Restaurer',

      quote_1: '“La simplicité est la sophistication suprême.”',
      quote_2: '“Naviguez avec une confidentialité totale, rapidité et maîtrise de vos données.”',
      quote_3: '“La vitesse du web commence par l’absence de traqueurs et de bruits inutiles.”'
    },

    'de-DE': {
      app_title: 'Coffee Browser',
      app_desc: 'Coffee Browser — Schneller Browser mit Fokus auf Privatsphäre und aktiven Schutz.',
      minimize: 'Minimieren',
      maximize: 'Maximieren',
      restore: 'Wiederherstellen',
      close: 'Schließen',
      back: 'Zurück',
      forward: 'Vorwärts',
      refresh: 'Neu laden',
      stop: 'Stoppen',
      search_placeholder: 'Im Web suchen oder URL eingeben...',
      security_system: 'System',
      security_secure: 'Sicher',
      security_insecure: 'Nicht sicher',
      zoom_page: 'Seitenzoom',
      reader_mode: 'Lesemodus',
      bookmark_page: 'Lesezeichen hinzufügen',
      settings: 'Einstellungen',
      new_tab: 'Neuer Tab',
      private_tab: 'Privater Tab',
      close_tab: 'Tab schließen',
      open_in_new_tab: 'In neuem Tab öffnen',
      open_in_private_tab: 'In privatem Tab öffnen',

      status_online: 'ONLINE',
      status_offline: 'OFFLINE',
      status_latency: 'LATENZ:',
      status_roast: 'RÖSTUNG:',
      status_memory: 'SPEICHER:',
      status_shields: 'SCHUTZ:',
      status_active: 'AKTIV',
      status_paused: 'PAUSIERT',

      roast_claro: 'HELL',
      roast_medio: 'MITTEL',
      roast_escuro: 'DUNKEL',
      roast_oculto: 'VERBORGEN',

      coador_title: 'Coador',
      coador_tag: 'AdBlock',
      coador_version: 'v5.4.1 • Premium-Schutz',
      coador_active: 'AKTIV',
      coador_paused: 'PAUSIERT',
      coador_blocked_page: 'Blockierte Werbung auf dieser Seite:',
      coador_total_blocked: 'Insgesamt blockierte Werbung:',
      coador_pause_site: 'Coador auf dieser Seite pausieren',
      coador_resume_site: 'Coador auf dieser Seite fortsetzen',
      coador_pause_global: 'Auf allen Seiten pausieren',
      coador_resume_global: 'Auf allen Seiten fortsetzen',
      coador_pause_global_sub: 'Deaktiviert den Werbeblocker vorübergehend',
      coador_resume_global_sub: 'Aktive Blockierung im gesamten Web',
      coador_block_element: 'Element auf dieser Seite blockieren',
      coador_block_element_sub: 'Klicken Sie auf ein Element, um es auszublenden',
      coador_options_btn: 'Coador Optionen & Filter',

      nt_trackers_blocked: 'Blockierte Tracker',
      nt_bandwidth_saved: 'Bandbreite gespart',
      nt_time_saved: 'Zeit gespart',
      nt_https_connections: 'HTTPS-Verbindungen',
      nt_greeting_morning: 'Guten Morgen',
      nt_greeting_afternoon: 'Guten Tag',
      nt_greeting_evening: 'Guten Abend',
      nt_search_btn: 'Suchen',
      nt_widget_protection: 'Schutz & Schilde',
      nt_widget_protection_desc: 'Aktiver Schutz vor Werbung, Trackern und Datensammlung.',
      nt_widget_details: 'Details',
      nt_widget_settings: 'Einstellungen',
      nt_widget_settings_desc: 'Privatsphäre, Aussehen, Sprache und Startoptionen anpassen.',
      nt_widget_access: 'Öffnen',

      settings_nav_shields: 'Coador (Werbeblocker)',
      settings_nav_appearance: 'Erscheinungsbild & Design',
      settings_nav_search: 'Suchmaschine',
      settings_nav_language: 'Sprache & Region',
      settings_nav_startup: 'Beim Start',
      settings_nav_privacy: 'Datenschutz & Sicherheit',
      settings_nav_history: 'Verlauf',
      settings_nav_system: 'System & Leistung',
      settings_nav_about: 'Über Coffee Browser',

      settings_shields_title: 'Schutz & Schilde',
      settings_shields_sub: 'Standard-Schutzeinstellungen für alle besuchten Seiten.',
      settings_shields_block_title: 'Schutz vor Trackern und Werbung',
      settings_shields_block_label: 'Tracker-Blockierung (Shields)',
      settings_shields_block_desc: 'Blockiert Tracker und eingebettete Werbung.',
      settings_shields_aggressive: 'Aggressiv (Empfohlen)',
      settings_shields_standard: 'Standard',
      settings_shields_disabled: 'Deaktiviert',
      settings_shields_https_title: 'Automatisches Upgrade auf HTTPS',
      settings_shields_https_desc: 'Leitet unsichere Verbindungen automatisch auf HTTPS um.',
      settings_shields_fp_title: 'Schutz vor digitalem Fingerabdruck',
      settings_shields_fp_desc: 'Verhindert die Identifizierung Ihrer Hardwarekonfiguration.',
      settings_shields_dns_title: 'Verschlüsseltes DNS (Cloudflare 1.1.1.1)',
      settings_shields_dns_desc: 'Alle Anfragen nutzen Cloudflare DNS-over-HTTPS.',
      settings_shields_scriptlets_title: 'Anti-Adblock Entschärfer',
      settings_shields_scriptlets_desc: 'Neutralisiert Adblock-Erkennung auf Webseiten.',
      settings_shields_query_title: 'URL-Tracking Parameter Bereinigung',
      settings_shields_query_desc: 'Entfernt automatisch Tracking-Parameter wie fbclid und gclid.',
      settings_shields_cookies_title: 'Drittanbieter-Cookies blockieren',
      settings_shields_cookies_desc: 'Verhindert domainübergreifendes Tracking durch Werbetreibende.',
      settings_shields_whitelist_title: 'Coador Ausnahmen (Pausierte Seiten)',
      settings_shields_whitelist_sub: 'Domains mit pausiertem Werbeblocker:',
      settings_shields_whitelist_empty: 'Keine pausierten Seiten. Coador schützt 100% der Seiten.',
      settings_shields_reactivate: 'Coador reaktivieren',

      settings_appearance_title: 'Erscheinungsbild und Design',
      settings_appearance_sub: 'Passen Sie das Design und die Bedienelemente an.',
      settings_appearance_theme_title: 'Röstgrad & Farbpalette',
      settings_appearance_show_bm: 'Lesezeichenleiste anzeigen',
      settings_appearance_show_bm_sub: 'Zeigt Lesezeichen unter der Adressleiste an.',

      settings_search_title: 'Suchmaschine',
      settings_search_sub: 'Legen Sie die Standardsuchmaschine fest.',
      settings_search_active_title: 'Aktive Suchmaschine',
      settings_search_default_label: 'Standard-Suchmaschine:',

      settings_language_title: 'Sprache & Region',
      settings_language_sub: 'Wählen Sie die Sprache der Benutzeroberfläche.',
      settings_language_active_title: 'Browsersprache',
      settings_language_select_label: 'Gewünschte Sprache auswählen:',
      settings_language_auto_option: 'Automatisch (Vom System erkennen)',
      settings_language_detected_info: 'Auf Ihrem Betriebssystem erkannte Sprache:',
      settings_language_sync_badge: 'SYNCHRONISIERUNG AKTIV',
      settings_language_sync_info: 'Spracheinstellungen werden gespeichert und mit der Website synchronisiert.',

      settings_startup_title: 'Beim Start',
      settings_startup_sub: 'Wählen Sie, was beim Start geöffnet werden soll.',
      settings_startup_newtab: 'Neuen Tab öffnen',
      settings_startup_continue: 'Zuletzt geöffnete Seiten fortsetzen',

      settings_privacy_title: 'Datenschutz und Sicherheit',
      settings_privacy_sub: 'Browserdaten und Cookies verwalten.',
      settings_privacy_history_title: 'Verlauf',
      settings_privacy_history_desc: 'Besuchte Webseiten und Suchanfragen einsehen.',
      settings_privacy_history_btn: 'Verlauf öffnen',
      settings_privacy_clear_title: 'Browserdaten löschen',
      settings_privacy_clear_desc: 'Löscht Verlauf, Cache und gespeicherte Cookies.',
      settings_privacy_clear_btn: 'Jetzt löschen',

      settings_system_title: 'System & Leistung',
      settings_system_sub: 'Erweiterte Hardware-Optionen.',
      settings_system_gpu_title: 'Hardwarebeschleunigung',
      settings_system_gpu_desc: 'GPU-Grafikbeschleunigung verwenden, falls verfügbar.',

      settings_about_title: 'Über Coffee Browser',
      settings_about_sub: 'Informationen zur installierten Version.',
      settings_about_app_name: 'Coffee Browser Desktop',
      settings_about_version: 'Version 1.0.0 (Windows x64 Executable)',
      settings_about_up_to_date: 'Coffee Browser ist auf dem neuesten Stand.',

      history_title: 'Verlauf',
      history_sub: 'Detaillierte chronologische Übersicht Ihrer Webseitenbesuche.',
      history_clear_all: 'Gesamten Verlauf löschen',
      history_search_placeholder: 'Im Verlauf suchen...',
      history_empty_title: 'Ihr Verlauf ist leer',
      history_empty_desc: 'Besuchte Seiten werden hier übersichtlich angezeigt.',
      history_today: 'Heute',
      history_yesterday: 'Gestern',
      history_visits: 'Besuche',
      history_visit: 'Besuch',
      history_delete_item: 'Aus Verlauf entfernen',

      bookmarks_title: 'Lesezeichen',
      bookmarks_add_title: 'Lesezeichen hinzufügen',
      bookmarks_edit_title: 'Lesezeichen bearbeiten',
      bookmarks_name_label: 'Name',
      bookmarks_url_label: 'URL',
      bookmarks_name_placeholder: 'Lesezeichen-Name...',
      bookmarks_cancel_btn: 'Abbrechen',
      bookmarks_save_btn: 'Hinzufügen',
      bookmarks_edit_save_btn: 'Speichern',
      bookmarks_delete_btn: 'Lesezeichen löschen',

      downloads_title: 'Downloads',
      downloads_completed: 'Abgeschlossen',

      restore_title: 'Wiederherstellungswarnung',
      restore_desc: 'Ihre Tabs wurden unerwartet geschlossen!',
      restore_btn: 'Wiederherstellen',

      quote_1: '„Einfachheit ist die höchste Stufe der Vollendung.“',
      quote_2: '„Surfen Sie mit absoluter Privatsphäre, hoher Geschwindigkeit und voller Kontrolle.“',
      quote_3: '„Die Geschwindigkeit des Internets beginnt ohne Tracker und störende Werbung.“'
    },

    'it-IT': {
      app_title: 'Coffee Browser',
      app_desc: 'Coffee Browser — Browser web ad alte prestazioni focalizzato su privacy e velocità.',
      minimize: 'Riduci a icona',
      maximize: 'Ingrandisci',
      restore: 'Ripristina',
      close: 'Chiudi',
      back: 'Indietro',
      forward: 'Avanti',
      refresh: 'Ricarica',
      stop: 'Ferma',
      search_placeholder: 'Cerca sul Web o inserisci un URL...',
      security_system: 'Sistema',
      security_secure: 'Sicuro',
      security_insecure: 'Non sicuro',
      zoom_page: 'Zoom pagina',
      reader_mode: 'Modalità Lettura',
      bookmark_page: 'Aggiungi ai preferiti',
      settings: 'Impostazioni',
      new_tab: 'Nuova Scheda',
      private_tab: 'Scheda Privata',
      close_tab: 'Chiudi Scheda',
      open_in_new_tab: 'Apri in nuova scheda',
      open_in_private_tab: 'Apri in scheda privata',

      status_online: 'ONLINE',
      status_offline: 'OFFLINE',
      status_latency: 'LATENZA:',
      status_roast: 'TOSTATURA:',
      status_memory: 'MEMORIA:',
      status_shields: 'SCUDI:',
      status_active: 'ATTIVI',
      status_paused: 'IN PAUSA',

      roast_claro: 'CHIARA',
      roast_medio: 'MEDIA',
      roast_escuro: 'SCURA',
      roast_oculto: 'OCCULTA',

      coador_title: 'Coador',
      coador_tag: 'AdBlock',
      coador_version: 'v5.4.1 • Protezione Premium',
      coador_active: 'ATTIVO',
      coador_paused: 'IN PAUSA',
      coador_blocked_page: 'Annunci bloccati su questa pagina:',
      coador_total_blocked: 'Totale annunci bloccati:',
      coador_pause_site: 'Sospendi Coador su questo sito',
      coador_resume_site: 'Riattiva Coador su questo sito',
      coador_pause_global: 'Sospendi su tutti i siti',
      coador_resume_global: 'Riattiva su tutti i siti',
      coador_pause_global_sub: 'Disabilita temporaneamente il blocco',
      coador_resume_global_sub: 'Blocco attivo su tutto il web',
      coador_block_element: 'Blocca un elemento in questa pagina',
      coador_block_element_sub: 'Fai clic su qualsiasi elemento per nasconderlo',
      coador_options_btn: 'Opzioni e Filtri Coador',

      nt_trackers_blocked: 'Tracker Bloccati',
      nt_bandwidth_saved: 'Banda Risparmiata',
      nt_time_saved: 'Tempo Risparmiato',
      nt_https_connections: 'Connessioni HTTPS',
      nt_greeting_morning: 'Buongiorno',
      nt_greeting_afternoon: 'Buon pomeriggio',
      nt_greeting_evening: 'Buonasera',
      nt_search_btn: 'Cerca',
      nt_widget_protection: 'Protezione e Scudi',
      nt_widget_protection_desc: 'Scudi attivi che bloccano pubblicità invadenti e tracker.',
      nt_widget_details: 'Dettagli',
      nt_widget_settings: 'Impostazioni',
      nt_widget_settings_desc: 'Gestisci privacy, aspetto, lingua e avvio.',
      nt_widget_access: 'Accedi',

      settings_nav_shields: 'Coador (Blocco)',
      settings_nav_appearance: 'Aspetto & Tema',
      settings_nav_search: 'Motore di Ricerca',
      settings_nav_language: 'Lingua & Regione',
      settings_nav_startup: 'All’Avvio',
      settings_nav_privacy: 'Privacy e Sicurezza',
      settings_nav_history: 'Cronologia',
      settings_nav_system: 'Sistema & Prestazioni',
      settings_nav_about: 'Info su Coffee Browser',

      settings_shields_title: 'Protezione e Scudi',
      settings_shields_sub: 'Configura la protezione predefinita applicata a tutti i siti.',
      settings_shields_block_title: 'Protezione da tracker e pubblicità',
      settings_shields_block_label: 'Blocco Tracker (Shields)',
      settings_shields_block_desc: 'Blocca annunci e tracker incorporati.',
      settings_shields_aggressive: 'Aggressivo (Consigliato)',
      settings_shields_standard: 'Standard',
      settings_shields_disabled: 'Disattivato',
      settings_shields_https_title: 'Aggiornamento automatico a HTTPS',
      settings_shields_https_desc: 'Aggiorna automaticamente a connessioni crittografate HTTPS.',
      settings_shields_fp_title: 'Protezione Anti-Fingerprinting',
      settings_shields_fp_desc: 'Impedisce ai siti di identificare la configurazione hardware.',
      settings_shields_dns_title: 'DNS Sicuro Crittografato (Cloudflare 1.1.1.1)',
      settings_shields_dns_desc: 'Tutte le richieste usano Cloudflare DNS over HTTPS.',
      settings_shields_scriptlets_title: 'Disarmatore Anti-Adblock',
      settings_shields_scriptlets_desc: 'Neutralizza i rilevatori di blocco pubblicità.',
      settings_shields_query_title: 'Pulizia Parametri di Tracciamento URL',
      settings_shields_query_desc: 'Rimuove automaticamente parametri di tracciamento come fbclid e gclid.',
      settings_shields_cookies_title: 'Blocca Cookie di Terze Parti',
      settings_shields_cookies_desc: 'Impedisce agli inserzionisti di monitorarti tra più domini.',
      settings_shields_whitelist_title: 'Lista Eccezioni Coador',
      settings_shields_whitelist_sub: 'Domini in cui il blocco è stato sospeso:',
      settings_shields_whitelist_empty: 'Nessun sito in pausa. Coador protegge il 100% dei siti.',
      settings_shields_reactivate: 'Riattiva Coador',

      settings_appearance_title: 'Aspetto e Tema',
      settings_appearance_sub: 'Personalizza il tema e i comandi del browser.',
      settings_appearance_theme_title: 'Livello di Tostatura & Colore',
      settings_appearance_show_bm: 'Mostra Barra dei Preferiti',
      settings_appearance_show_bm_sub: 'Mostra i preferiti sotto la barra degli indirizzi.',

      settings_search_title: 'Motore di Ricerca',
      settings_search_sub: 'Imposta il motore di ricerca predefinito.',
      settings_search_active_title: 'Motore Attivo',
      settings_search_default_label: 'Motore predefinito:',

      settings_language_title: 'Lingua & Regione',
      settings_language_sub: 'Scegli la lingua dell’interfaccia e la sincronizzazione col sito.',
      settings_language_active_title: 'Lingua del Browser',
      settings_language_select_label: 'Seleziona la lingua desiderata:',
      settings_language_auto_option: 'Automatico (Rileva dal Sistema)',
      settings_language_detected_info: 'Lingua rilevata dal sistema operativo:',
      settings_language_sync_badge: 'SINCRONIZZAZIONE ATTIVA',
      settings_language_sync_info: 'Le impostazioni della lingua sono salvate e sincronizzate col sito.',

      settings_startup_title: 'All’Avvio',
      settings_startup_sub: 'Scegli cosa aprire all’avvio del browser.',
      settings_startup_newtab: 'Apri la pagina Nuova Scheda',
      settings_startup_continue: 'Riprendi da dove avevi interrotto',

      settings_privacy_title: 'Privacy e Sicurezza',
      settings_privacy_sub: 'Gestisci cronologia, cache e cookie.',
      settings_privacy_history_title: 'Cronologia di Navigazione',
      settings_privacy_history_desc: 'Visualizza e gestisci le tue ricerche per data.',
      settings_privacy_history_btn: 'Apri Cronologia',
      settings_privacy_clear_title: 'Cancella Dati di Navigazione',
      settings_privacy_clear_desc: 'Elimina cronologia, cache e cookie locali.',
      settings_privacy_clear_btn: 'Cancella Ora',

      settings_system_title: 'Sistema & Prestazioni',
      settings_system_sub: 'Impostazioni hardware avanzate.',
      settings_system_gpu_title: 'Accelerazione Hardware',
      settings_system_gpu_desc: 'Utilizza accelerazione GPU grafica se disponibile.',

      settings_about_title: 'Info su Coffee Browser',
      settings_about_sub: 'Informazioni e versione installata.',
      settings_about_app_name: 'Coffee Browser Desktop',
      settings_about_version: 'Versione 1.0.0 (Windows x64 Executable)',
      settings_about_up_to_date: 'Coffee Browser è aggiornato.',

      history_title: 'Cronologia di Navigazione',
      history_sub: 'Riepilogo cronologico delle tue ricerche e navigazioni.',
      history_clear_all: 'Cancella Tutta la Cronologia',
      history_search_placeholder: 'Cerca nella cronologia...',
      history_empty_title: 'La tua cronologia è pulita',
      history_empty_desc: 'Le pagine visitate appariranno qui.',
      history_today: 'Oggi',
      history_yesterday: 'Ieri',
      history_visits: 'visite',
      history_visit: 'visita',
      history_delete_item: 'Rimuovi dalla cronologia',

      bookmarks_title: 'Preferiti',
      bookmarks_add_title: 'Aggiungi ai Preferiti',
      bookmarks_edit_title: 'Modifica Preferito',
      bookmarks_name_label: 'Nome',
      bookmarks_url_label: 'URL',
      bookmarks_name_placeholder: 'Nome del preferito...',
      bookmarks_cancel_btn: 'Annulla',
      bookmarks_save_btn: 'Aggiungi',
      bookmarks_edit_save_btn: 'Salva',
      bookmarks_delete_btn: 'Elimina Preferito',

      downloads_title: 'Download',
      downloads_completed: 'Completato',

      restore_title: 'Avviso di Ripristino',
      restore_desc: 'Le tue schede sono state chiuse in modo imprevisto!',
      restore_btn: 'Ripristina',

      quote_1: '“La semplicità è l’ultima sofisticazione.”',
      quote_2: '“Naviga con totale privacy, velocità elevata e controllo assoluto dei tuoi dati.”',
      quote_3: '“La velocità del web nasce dall’assenza di tracker e rumore inutile.”'
    },

    'ja-JP': {
      app_title: 'Coffee Browser',
      app_desc: 'Coffee Browser — プライバシーと高速性を重視したターミナルスタイルの次世代ブラウザ。',
      minimize: '最小化',
      maximize: '最大化',
      restore: '元に戻す',
      close: '閉じる',
      back: '戻る',
      forward: '進む',
      refresh: '再読み込み',
      stop: '停止',
      search_placeholder: 'Webを検索またはURLを入力...',
      security_system: 'システム',
      security_secure: '保護された通信',
      security_insecure: '保護されていない通信',
      zoom_page: 'ページの拡大/縮小',
      reader_mode: 'リーダーモード',
      bookmark_page: 'ブックマークに追加',
      settings: '設定',
      new_tab: '新しいタブ',
      private_tab: 'プライベートタブ',
      close_tab: 'タブを閉じる',
      open_in_new_tab: '新しいタブで開く',
      open_in_private_tab: 'プライベートタブで開く',

      status_online: 'オンライン',
      status_offline: 'オフライン',
      status_latency: 'レイテンシ:',
      status_roast: 'ロースト:',
      status_memory: 'メモリ:',
      status_shields: 'シールド:',
      status_active: '有効',
      status_paused: '一時停止',

      roast_claro: '浅煎り',
      roast_medio: '中煎り',
      roast_escuro: '深煎り',
      roast_oculto: '極秘',

      coador_title: 'Coador',
      coador_tag: 'AdBlock',
      coador_version: 'v5.4.1 • プレミアム保護',
      coador_active: '有効',
      coador_paused: '一時停止',
      coador_blocked_page: 'このページでブロックされた広告:',
      coador_total_blocked: '合計ブロック数:',
      coador_pause_site: 'このサイトでCoadorを一時停止',
      coador_resume_site: 'このサイトでCoadorを再開',
      coador_pause_global: 'すべてのサイトで一時停止',
      coador_resume_global: 'すべてのサイトで再開',
      coador_pause_global_sub: '広告ブロックを一時的に無効化',
      coador_resume_global_sub: 'Web全体で広告ブロックを有効化',
      coador_block_element: 'このページの要素をブロック',
      coador_block_element_sub: '要素をクリックして非表示にします',
      coador_options_btn: 'Coador オプションとフィルター',

      nt_trackers_blocked: 'ブロックされたトラッカー',
      nt_bandwidth_saved: '節約された通信量',
      nt_time_saved: '節約された時間',
      nt_https_connections: 'HTTPS接続',
      nt_greeting_morning: 'おはようございます',
      nt_greeting_afternoon: 'こんにちは',
      nt_greeting_evening: 'こんばんは',
      nt_search_btn: '検索',
      nt_widget_protection: '保護とシールド',
      nt_widget_protection_desc: '侵入型広告や追跡スクリプトをリアルタイムでブロックします。',
      nt_widget_details: '詳細',
      nt_widget_settings: '設定',
      nt_widget_settings_desc: 'プライバシー、テーマ、言語、起動時の動作を管理します。',
      nt_widget_access: '開く',

      settings_nav_shields: 'Coador (広告ブロッカー)',
      settings_nav_appearance: '外観とテーマ',
      settings_nav_search: '検索エンジン',
      settings_nav_language: '言語と地域',
      settings_nav_startup: '起動時',
      settings_nav_privacy: 'プライバシーとセキュリティ',
      settings_nav_history: '閲覧履歴',
      settings_nav_system: 'システムとパフォーマンス',
      settings_nav_about: 'Coffee Browser について',

      settings_shields_title: '保護とシールド',
      settings_shields_sub: 'すべてのWebサイトに適用される標準の保護設定。',
      settings_shields_block_title: 'トラッカーと広告の保護',
      settings_shields_block_label: 'トラッカーのブロック (Shields)',
      settings_shields_block_desc: '埋め込み広告やトラッカーをブロックします。',
      settings_shields_aggressive: '高度 (推奨)',
      settings_shields_standard: '標準',
      settings_shields_disabled: '無効',
      settings_shields_https_title: '自動HTTPSアップグレード',
      settings_shields_https_desc: '暗号化されていない接続を自動的にHTTPSにアップグレードします。',
      settings_shields_fp_title: 'フィンガープリント防止',
      settings_shields_fp_desc: 'サイトによる端末構成の特定を防ぎます。',
      settings_shields_dns_title: '安全な暗号化DNS (Cloudflare 1.1.1.1)',
      settings_shields_dns_desc: 'すべての検索はCloudflare DNS over HTTPSで保護されます。',
      settings_shields_scriptlets_title: 'アンチAdblock無効化',
      settings_shields_scriptlets_desc: 'Adblock検知スクリプトを無力化します。',
      settings_shields_query_title: 'URLトラッキングパラメータ削除',
      settings_shields_query_desc: 'リンクからfbclidやgclidなどの不要なパラメータを削除します。',
      settings_shields_cookies_title: 'サードパーティCookieのブロック',
      settings_shields_cookies_desc: 'ドメインをまたぐ追跡を遮断します。',
      settings_shields_whitelist_title: 'Coador 除外リスト',
      settings_shields_whitelist_sub: '広告ブロックを一時停止したサイト:',
      settings_shields_whitelist_empty: '一時停止されたサイトはありません。',
      settings_shields_reactivate: 'Coadorを再有効化',

      settings_appearance_title: '外観とテーマ',
      settings_appearance_sub: '視覚テーマと操作コントロールをカスタマイズ。',
      settings_appearance_theme_title: 'ローストレベルと配色',
      settings_appearance_show_bm: 'ブックマークバーを表示',
      settings_appearance_show_bm_sub: 'アドレスバーの下にショートカットバーを表示します。',

      settings_search_title: '検索エンジン',
      settings_search_sub: 'アドレスバーで使用するデフォルトの検索エンジンを設定。',
      settings_search_active_title: '現在の検索エンジン',
      settings_search_default_label: 'デフォルト検索エンジン:',

      settings_language_title: '言語と地域',
      settings_language_sub: 'ブラウザの表示言語を選択し、公式サイトと同期します。',
      settings_language_active_title: 'ブラウザ言語',
      settings_language_select_label: '言語を選択:',
      settings_language_auto_option: '自動 (システム言語を検出)',
      settings_language_detected_info: 'OSから検出された言語:',
      settings_language_sync_badge: '自動同期 有効',
      settings_language_sync_info: '言語設定は即座に保存され、公式サイトとも同期されます。',

      settings_startup_title: '起動時',
      settings_startup_sub: 'ブラウザ起動時に開くページを選択。',
      settings_startup_newtab: '新しいタブを開く',
      settings_startup_continue: '前回のセッションを復元',

      settings_privacy_title: 'プライバシーとセキュリティ',
      settings_privacy_sub: '閲覧データとCookieを管理。',
      settings_privacy_history_title: '閲覧履歴',
      settings_privacy_history_desc: '検索履歴や訪問サイトを日時順に確認します。',
      settings_privacy_history_btn: '履歴を開く',
      settings_privacy_clear_title: '閲覧データを消去',
      settings_privacy_clear_desc: '履歴、キャッシュ、保存されたCookieを削除します。',
      settings_privacy_clear_btn: '今すぐ消去',

      settings_system_title: 'システムとパフォーマンス',
      settings_system_sub: '高度なハードウェア設定。',
      settings_system_gpu_title: 'ハードウェアアクセラレーション',
      settings_system_gpu_desc: '利用可能な場合にGPUグラフィックアクセラレーションを使用します。',

      settings_about_title: 'Coffee Browser について',
      settings_about_sub: 'アプリケーションとバージョン情報。',
      settings_about_app_name: 'Coffee Browser Desktop',
      settings_about_version: 'バージョン 1.0.0 (Windows x64 Executable)',
      settings_about_up_to_date: 'Coffee Browser は最新です。',

      history_title: '閲覧履歴',
      history_sub: '訪問したWebページと検索の詳細な記録。',
      history_clear_all: 'すべての履歴を消去',
      history_search_placeholder: '履歴を検索...',
      history_empty_title: '履歴はありません',
      history_empty_desc: 'アクセスしたページがここに表示されます。',
      history_today: '今日',
      history_yesterday: '昨日',
      history_visits: '回訪問',
      history_visit: '回訪問',
      history_delete_item: '履歴から削除',

      bookmarks_title: 'ブックマーク',
      bookmarks_add_title: 'ブックマークを追加',
      bookmarks_edit_title: 'ブックマークを編集',
      bookmarks_name_label: '名前',
      bookmarks_url_label: 'URL',
      bookmarks_name_placeholder: 'ブックマーク名...',
      bookmarks_cancel_btn: 'キャンセル',
      bookmarks_save_btn: '追加',
      bookmarks_edit_save_btn: '保存',
      bookmarks_delete_btn: 'ブックマークを削除',

      downloads_title: 'ダウンロード',
      downloads_completed: '完了',

      restore_title: 'セッション復元',
      restore_desc: '前回のタブが正しく閉じられませんでした！',
      restore_btn: '復元する',

      quote_1: '「シンプルさは究極の洗練である。」',
      quote_2: '「完全なプライバシーと驚異的なスピードでWebを探索しよう。」',
      quote_3: '「Webの高速化は、不要なトラッカーの排除から始まります。」'
    },

    'zh-CN': {
      app_title: 'Coffee Browser',
      app_desc: 'Coffee Browser — 极速、隐私优先的终端风格现代化桌面浏览器。',
      minimize: '最小化',
      maximize: '最大化',
      restore: '还原',
      close: '关闭',
      back: '后退',
      forward: '前进',
      refresh: '刷新',
      stop: '停止',
      search_placeholder: '搜索网页或输入网址 (如 wikipedia.org, github.com)...',
      security_system: '系统',
      security_secure: '安全连接',
      security_insecure: '不安全',
      zoom_page: '页面缩放',
      reader_mode: '阅读模式',
      bookmark_page: '添加至书签',
      settings: '设置',
      new_tab: '新标签页',
      private_tab: '隐身标签页',
      close_tab: '关闭标签页',
      open_in_new_tab: '在新标签页中打开',
      open_in_private_tab: '在隐身标签页中打开',

      status_online: '在线',
      status_offline: '离线',
      status_latency: '延迟:',
      status_roast: '烘焙度:',
      status_memory: '内存:',
      status_shields: '防护盾:',
      status_active: '已启用',
      status_paused: '已暂停',

      roast_claro: '浅焙',
      roast_medio: '中焙',
      roast_escuro: '深焙',
      roast_oculto: '隐秘',

      coador_title: 'Coador',
      coador_tag: 'AdBlock',
      coador_version: 'v5.4.1 • 高级隐私防护',
      coador_active: '已激活',
      coador_paused: '已暂停',
      coador_blocked_page: '本页面拦截广告数:',
      coador_total_blocked: '累计拦截广告数:',
      coador_pause_site: '在此网站暂停 Coador',
      coador_resume_site: '在此网站恢复 Coador',
      coador_pause_global: '在所有网站暂停',
      coador_resume_global: '在所有网站恢复',
      coador_pause_global_sub: '暂时关闭广告拦截器',
      coador_resume_global_sub: '全局启用广告与追踪拦截',
      coador_block_element: '拦截此页面的特定元素',
      coador_block_element_sub: '点击网页上的任何元素进行隐藏',
      coador_options_btn: 'Coador 选项与过滤规则',

      nt_trackers_blocked: '已拦截追踪器',
      nt_bandwidth_saved: '节省流量',
      nt_time_saved: '节省时间',
      nt_https_connections: 'HTTPS 安全连接',
      nt_greeting_morning: '早上好',
      nt_greeting_afternoon: '下午好',
      nt_greeting_evening: '晚上好',
      nt_search_btn: '搜索',
      nt_widget_protection: '防护与盾牌',
      nt_widget_protection_desc: '实时拦截侵入性广告、跨站追踪和数据收集。',
      nt_widget_details: '详情',
      nt_widget_settings: '设置',
      nt_widget_settings_desc: '管理隐私、外观、语言、搜索引擎和启动选项。',
      nt_widget_access: '进入',

      settings_nav_shields: 'Coador (广告拦截)',
      settings_nav_appearance: '外观与主题',
      settings_nav_search: '搜索引擎',
      settings_nav_language: '语言与地区',
      settings_nav_startup: '启动设置',
      settings_nav_privacy: '隐私与安全',
      settings_nav_history: '浏览历史',
      settings_nav_system: '系统与性能',
      settings_nav_about: '关于 Coffee Browser',

      settings_shields_title: 'Brave 级防护与盾牌',
      settings_shields_sub: '配置适用于所有已访问网站的默认安全防护规则。',
      settings_shields_block_title: '追踪与广告防护',
      settings_shields_block_label: '追踪器拦截 (Shields)',
      settings_shields_block_desc: '阻止网页中的内嵌广告与追踪脚本。',
      settings_shields_aggressive: '严格拦截 (推荐)',
      settings_shields_standard: '标准拦截',
      settings_shields_disabled: '已禁用',
      settings_shields_https_title: '自动升级至 HTTPS',
      settings_shields_https_desc: '将不安全的 HTTP 请求自动重写为加密的 HTTPS 连接。',
      settings_shields_fp_title: '防指纹识别保护 (Anti-Fingerprinting)',
      settings_shields_fp_desc: '防止网站识别您设备的唯一硬件及 Canvas 指纹配置。',
      settings_shields_dns_title: '加密安全 DNS (Cloudflare 1.1.1.1)',
      settings_shields_dns_desc: '所有搜索与网络解析均经由 Cloudflare DNS-over-HTTPS (DoH) 加密。',
      settings_shields_scriptlets_title: '反广告拦截破解器',
      settings_shields_scriptlets_desc: '自动消除新闻及视频网站上的 AdBlock 弹窗警告。',
      settings_shields_query_title: 'URL 追踪参数自动净化',
      settings_shields_query_desc: '自动剔除链接中的追踪参数 (如 fbclid, gclid, utm_source)。',
      settings_shields_cookies_title: '拦截第三方 Cookie',
      settings_shields_cookies_desc: '禁止广告商跨多个域名追踪您的浏览习惯。',
      settings_shields_whitelist_title: 'Coador 白名单 (已暂停网站)',
      settings_shields_whitelist_sub: '已由用户手动暂停拦截的域名：',
      settings_shields_whitelist_empty: '暂无暂停网站。Coador 正在 100% 保护所有访问。',
      settings_shields_reactivate: '重新启用 Coador',

      settings_appearance_title: '外观与主题',
      settings_appearance_sub: '自定义浏览器的视觉风格及操作栏。',
      settings_appearance_theme_title: '色彩搭配与烘焙等级',
      settings_appearance_show_bm: '显示书签栏',
      settings_appearance_show_bm_sub: '在地址栏下方显示书签快捷工具栏。',

      settings_search_title: '搜索引擎',
      settings_search_sub: '设置地址栏和主页默认使用的搜索引擎。',
      settings_search_active_title: '当前搜索引擎',
      settings_search_default_label: '默认搜索引擎:',

      settings_language_title: '语言与地区',
      settings_language_sub: '选择浏览器界面语言，并自动与官网同步保存。',
      settings_language_active_title: '浏览器语言',
      settings_language_select_label: '选择首选语言:',
      settings_language_auto_option: '自动 (检测操作系统语言)',
      settings_language_detected_info: '从您的操作系统中检测到的语言:',
      settings_language_sync_badge: '自动同步已开启',
      settings_language_sync_info: '语言偏好会即时保存，并在浏览器与官方网站之间实时同步。',

      settings_startup_title: '启动设置',
      settings_startup_sub: '选择启动浏览器时打开的内容。',
      settings_startup_newtab: '打开新标签页',
      settings_startup_continue: '继续浏览上次打开的页面',

      settings_privacy_title: '隐私与安全',
      settings_privacy_sub: '管理浏览数据、Cookie 和网站权限。',
      settings_privacy_history_title: '浏览历史记录',
      settings_privacy_history_desc: '按日期和时间查看并管理您的访问记录与搜索。',
      settings_privacy_history_btn: '打开历史记录',
      settings_privacy_clear_title: '清除浏览数据',
      settings_privacy_clear_desc: '删除本地保存的历史记录、缓存和 Cookie。',
      settings_privacy_clear_btn: '立即清除',

      settings_system_title: '系统与性能',
      settings_system_sub: '高级硬件加速及资源配置。',
      settings_system_gpu_title: '硬件加速',
      settings_system_gpu_desc: '在可用时使用 GPU 硬件图形加速。',

      settings_about_title: '关于 Coffee Browser',
      settings_about_sub: '应用程序与版本信息。',
      settings_about_app_name: 'Coffee Browser 桌面端',
      settings_about_version: '版本 1.0.0 (Windows x64 Executable)',
      settings_about_up_to_date: 'Coffee Browser 已是最新版本。',

      history_title: '浏览历史',
      history_sub: '按时间顺序记录的浏览与搜索详情。',
      history_clear_all: '清除所有历史记录',
      history_search_placeholder: '按标题或 URL 搜索历史记录...',
      history_empty_title: '暂无浏览历史',
      history_empty_desc: '您访问的网页将在此处整齐列出。',
      history_today: '今天',
      history_yesterday: '昨天',
      history_visits: '次访问',
      history_visit: '次访问',
      history_delete_item: '从历史记录中删除',

      bookmarks_title: '书签',
      bookmarks_add_title: '添加书签',
      bookmarks_edit_title: '编辑书签',
      bookmarks_name_label: '名称',
      bookmarks_url_label: '网址',
      bookmarks_name_placeholder: '书签名称...',
      bookmarks_cancel_btn: '取消',
      bookmarks_save_btn: '添加',
      bookmarks_edit_save_btn: '保存',
      bookmarks_delete_btn: '删除书签',

      downloads_title: '下载内容',
      downloads_completed: '已完成',

      restore_title: '会话恢复提醒',
      restore_desc: '您的标签页先前异常关闭！',
      restore_btn: '恢复标签页',

      quote_1: '“大道至简，精练至极。”',
      quote_2: '“在全方位隐私与极速响应中探索数字世界。”',
      quote_3: '“网络的飞跃，始于过滤杂音与追踪。”'
    },

    'ru-RU': {
      app_title: 'Coffee Browser',
      app_desc: 'Coffee Browser — Высокопроизводительный веб-браузер с упором на приватность и защиту данных.',
      minimize: 'Свернуть',
      maximize: 'Развернуть',
      restore: 'Восстановить',
      close: 'Закрыть',
      back: 'Назад',
      forward: 'Вперед',
      refresh: 'Обновить',
      stop: 'Остановить',
      search_placeholder: 'Искать в Интернете или ввести URL...',
      security_system: 'Система',
      security_secure: 'Безопасное соединение',
      security_insecure: 'Не защищено',
      zoom_page: 'Масштаб страницы',
      reader_mode: 'Режим чтения',
      bookmark_page: 'Добавить в закладки',
      settings: 'Настройки',
      new_tab: 'Новая вкладка',
      private_tab: 'Приватная вкладка',
      close_tab: 'Закрыть вкладку',
      open_in_new_tab: 'Открыть в новой вкладке',
      open_in_private_tab: 'Открыть в приватной вкладке',

      status_online: 'ОНЛАЙН',
      status_offline: 'ОФЛАЙН',
      status_latency: 'ЗАДЕРЖКА:',
      status_roast: 'ОБЖАРКА:',
      status_memory: 'ПАМЯТЬ:',
      status_shields: 'ЩИТЫ:',
      status_active: 'АКТИВНЫ',
      status_paused: 'ПАУЗА',

      roast_claro: 'СВЕТЛАЯ',
      roast_medio: 'СРЕДНЯЯ',
      roast_escuro: 'ТЕМНАЯ',
      roast_oculto: 'СКРЫТАЯ',

      coador_title: 'Coador',
      coador_tag: 'AdBlock',
      coador_version: 'v5.4.1 • Премиум Защита',
      coador_active: 'АКТИВЕН',
      coador_paused: 'ПАУЗА',
      coador_blocked_page: 'Рекламы заблокировано на странице:',
      coador_total_blocked: 'Всего заблокировано рекламы:',
      coador_pause_site: 'Приостановить Coador на этом сайте',
      coador_resume_site: 'Возобновить Coador на этом сайте',
      coador_pause_global: 'Приостановить на всех сайтах',
      coador_resume_global: 'Возобновить на всех сайтах',
      coador_pause_global_sub: 'Временно отключает блокировщик',
      coador_resume_global_sub: 'Блокировка активна во всем интернете',
      coador_block_element: 'Заблокировать элемент на странице',
      coador_block_element_sub: 'Нажмите на любой элемент, чтобы скрыть его',
      coador_options_btn: 'Параметры и Фильтры Coador',

      nt_trackers_blocked: 'Трекеров заблокировано',
      nt_bandwidth_saved: 'Трафика сэкономлено',
      nt_time_saved: 'Времени сэкономлено',
      nt_https_connections: 'HTTPS Соединений',
      nt_greeting_morning: 'Доброе утро',
      nt_greeting_afternoon: 'Добрый день',
      nt_greeting_evening: 'Добрый вечер',
      nt_search_btn: 'Поиск',
      nt_widget_protection: 'Защита и Щиты',
      nt_widget_protection_desc: 'Активные щиты блокируют назойливую рекламу и трекеры.',
      nt_widget_details: 'Подробнее',
      nt_widget_settings: 'Настройки',
      nt_widget_settings_desc: 'Управление приватностью, внешним видом, языком и автозапуском.',
      nt_widget_access: 'Перейти',

      settings_nav_shields: 'Coador (Блокировщик)',
      settings_nav_appearance: 'Внешний вид и Тема',
      settings_nav_search: 'Поисковая система',
      settings_nav_language: 'Язык и Регион',
      settings_nav_startup: 'При запуске',
      settings_nav_privacy: 'Конфиденциальность',
      settings_nav_history: 'История браузера',
      settings_nav_system: 'Система и Производительность',
      settings_nav_about: 'О Coffee Browser',

      settings_shields_title: 'Защита и Щиты Brave',
      settings_shields_sub: 'Настройка защиты по умолчанию для всех посещаемых сайтов.',
      settings_shields_block_title: 'Защита от трекеров и рекламы',
      settings_shields_block_label: 'Блокировка трекеров (Shields)',
      settings_shields_block_desc: 'Блокирует встроенную рекламу и скрипты отслеживания.',
      settings_shields_aggressive: 'Агрессивная (Рекомендуется)',
      settings_shields_standard: 'Стандартная',
      settings_shields_disabled: 'Отключено',
      settings_shields_https_title: 'Автоматическое обновление до HTTPS',
      settings_shields_https_desc: 'Автоматически переводит небезопасные соединения на HTTPS.',
      settings_shields_fp_title: 'Защита от цифровых отпечатков (Anti-Fingerprinting)',
      settings_shields_fp_desc: 'Предотвращает идентификацию конфигурации вашего устройства.',
      settings_shields_dns_title: 'Зашифрованный DNS (Cloudflare 1.1.1.1)',
      settings_shields_dns_desc: 'Все запросы маршрутизируются через DNS over HTTPS от Cloudflare.',
      settings_shields_scriptlets_title: 'Нейтрализатор анти-блокировщиков',
      settings_shields_scriptlets_desc: 'Блокирует предупреждения об AdBlock на новостных и видео сайтах.',
      settings_shields_query_title: 'Очистка параметров отслеживания из URL',
      settings_shields_query_desc: 'Автоматически удаляет шпионские параметры (fbclid, gclid, utm).',
      settings_shields_cookies_title: 'Блокировать сторонние Cookie',
      settings_shields_cookies_desc: 'Запрещает рекламодателям отслеживать вас между сайтами.',
      settings_shields_whitelist_title: 'Белый список Coador',
      settings_shields_whitelist_sub: 'Домены, где блокировка приостановлена:',
      settings_shields_whitelist_empty: 'Нет сайтов в паузе. Coador защищает 100% сайтов.',
      settings_shields_reactivate: 'Возобновить Coador',

      settings_appearance_title: 'Внешний вид и Тема',
      settings_appearance_sub: 'Персонализация цветовой схемы и элементов управления.',
      settings_appearance_theme_title: 'Степень обжарки и Цвета',
      settings_appearance_show_bm: 'Показывать панель закладок',
      settings_appearance_show_bm_sub: 'Отображает панель закладок под адресной строкой.',

      settings_search_title: 'Поисковая система',
      settings_search_sub: 'Поисковая система по умолчанию в адресной строке.',
      settings_search_active_title: 'Текущий поиск',
      settings_search_default_label: 'Поиск по умолчанию:',

      settings_language_title: 'Язык и Регион',
      settings_language_sub: 'Выберите язык интерфейса и синхронизацию с сайтом.',
      settings_language_active_title: 'Язык браузера',
      settings_language_select_label: 'Выберите язык:',
      settings_language_auto_option: 'Автоматически (Определить язык системы)',
      settings_language_detected_info: 'Язык, определенный в вашей операционной системе:',
      settings_language_sync_badge: 'АВТО-СИНХРОНИЗАЦИЯ АКТИВНА',
      settings_language_sync_info: 'Изменения языка сохраняются мгновенно и синхронизируются с сайтом.',

      settings_startup_title: 'При запуске',
      settings_startup_sub: 'Выберите, что открывать при запуске браузера.',
      settings_startup_newtab: 'Открыть Новую вкладку',
      settings_startup_continue: 'Продолжить с того же места',

      settings_privacy_title: 'Конфиденциальность и Безопасность',
      settings_privacy_sub: 'Управление данными браузера и cookie.',
      settings_privacy_history_title: 'История браузера',
      settings_privacy_history_desc: 'Просмотр и удаление посещенных сайтов по дате.',
      settings_privacy_history_btn: 'Открыть Историю',
      settings_privacy_clear_title: 'Очистить данные браузера',
      settings_privacy_clear_desc: 'Удаляет историю, кэш и файлы cookie.',
      settings_privacy_clear_btn: 'Очистить сейчас',

      settings_system_title: 'Система и Производительность',
      settings_system_sub: 'Расширенные настройки оборудования.',
      settings_system_gpu_title: 'Аппаратное ускорение',
      settings_system_gpu_desc: 'Использовать аппаратное ускорение GPU при наличии.',

      settings_about_title: 'О Coffee Browser',
      settings_about_sub: 'Информация о приложении и версии.',
      settings_about_app_name: 'Coffee Browser Desktop',
      settings_about_version: 'Версия 1.0.0 (Windows x64 Executable)',
      settings_about_up_to_date: 'У вас установлена актуальная версия.',

      history_title: 'История браузера',
      history_sub: 'Хронологический список ваших поисковых запросов и страниц.',
      history_clear_all: 'Очистить всю историю',
      history_search_placeholder: 'Поиск по истории...',
      history_empty_title: 'История пуста',
      history_empty_desc: 'Посещенные страницы будут отображаться здесь.',
      history_today: 'Сегодня',
      history_yesterday: 'Вчера',
      history_visits: 'визитов',
      history_visit: 'визит',
      history_delete_item: 'Удалить из истории',

      bookmarks_title: 'Закладки',
      bookmarks_add_title: 'Добавить в закладки',
      bookmarks_edit_title: 'Редактировать закладку',
      bookmarks_name_label: 'Название',
      bookmarks_url_label: 'URL',
      bookmarks_name_placeholder: 'Название закладки...',
      bookmarks_cancel_btn: 'Отмена',
      bookmarks_save_btn: 'Добавить',
      bookmarks_edit_save_btn: 'Сохранить',
      bookmarks_delete_btn: 'Удалить закладку',

      downloads_title: 'Загрузки',
      downloads_completed: 'Завершено',

      restore_title: 'Восстановление сессии',
      restore_desc: 'Ваши вкладки были закрыты некорректно!',
      restore_btn: 'Восстановить',

      quote_1: '«Простота — это высшая степень утонченности.»',
      quote_2: '«Работайте в интернете с полной конфиденциальностью и контролем над данными.»',
      quote_3: '«Скорость интернета начинается с отсутствия трекеров и лишнего шума.»'
    }
  };

  class CoffeeI18nEngine {
    constructor() {
      this.supportedLanguages = supportedLanguages;
      this.translations = translations;
      this.detectedSystemLanguage = this.detectSystemLanguage();
    }

    /**
     * Inspects browser / OS navigator properties and resolves to supported locale code
     */
    detectSystemLanguage() {
      try {
        const navLangs = (navigator.languages && navigator.languages.length > 0)
          ? navigator.languages
          : [navigator.language || navigator.userLanguage || 'pt-BR'];

        for (const lang of navLangs) {
          if (!lang) continue;
          const clean = lang.toLowerCase();

          if (clean.startsWith('pt')) return 'pt-BR';
          if (clean.startsWith('en')) return 'en-US';
          if (clean.startsWith('es')) return 'es-ES';
          if (clean.startsWith('fr')) return 'fr-FR';
          if (clean.startsWith('de')) return 'de-DE';
          if (clean.startsWith('it')) return 'it-IT';
          if (clean.startsWith('ja')) return 'ja-JP';
          if (clean.startsWith('zh')) return 'zh-CN';
          if (clean.startsWith('ru')) return 'ru-RU';
        }
      } catch (e) {
        console.warn('Error detecting system language:', e);
      }
      return 'pt-BR';
    }

    /**
     * Resolves effective language code ('pt-BR', 'en-US', etc.)
     */
    getEffectiveLanguage() {
      let langPreference = 'auto';
      if (window.BrowserState && window.BrowserState.language) {
        langPreference = window.BrowserState.language;
      } else {
        try {
          const savedState = localStorage.getItem('coffee_browser_state');
          if (savedState) {
            const parsed = JSON.parse(savedState);
            if (parsed.language) langPreference = parsed.language;
          }
          if (langPreference === 'auto') {
            const direct = localStorage.getItem('coffee_language');
            if (direct && direct !== 'auto' && this.translations[direct]) {
              langPreference = direct;
            }
          }
        } catch (e) {}
      }

      if (langPreference === 'auto' || !this.translations[langPreference]) {
        return this.detectedSystemLanguage;
      }
      return langPreference;
    }

    /**
     * Returns user setting mode ('auto', 'pt-BR', 'en-US', etc.)
     */
    getLanguageMode() {
      if (window.BrowserState && window.BrowserState.language) {
        return window.BrowserState.language;
      }
      try {
        const saved = localStorage.getItem('coffee_browser_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.language) return parsed.language;
        }
      } catch(e) {}
      return 'auto';
    }

    /**
     * Translate key with optional fallback
     */
    t(key, fallback = '') {
      const effectiveLang = this.getEffectiveLanguage();
      const dict = this.translations[effectiveLang] || this.translations['pt-BR'] || {};
      if (dict[key] !== undefined) {
        return dict[key];
      }
      // Try fallback to pt-BR or en-US
      if (this.translations['pt-BR'] && this.translations['pt-BR'][key] !== undefined) {
        return this.translations['pt-BR'][key];
      }
      if (this.translations['en-US'] && this.translations['en-US'][key] !== undefined) {
        return this.translations['en-US'][key];
      }
      return fallback || key;
    }

    /**
     * Change active language, persist to localStorage and notify state
     */
    setLanguage(lang) {
      if (window.BrowserState) {
        window.BrowserState.setLanguage(lang);
      } else {
        try {
          localStorage.setItem('coffee_language', lang);
          const saved = localStorage.getItem('coffee_browser_state');
          let state = saved ? JSON.parse(saved) : {};
          state.language = lang;
          localStorage.setItem('coffee_browser_state', JSON.stringify(state));
        } catch(e) {}
      }
      this.applyStaticTranslations();
    }

    /**
     * Apply translations to static DOM shell (index.html)
     */
    applyStaticTranslations() {
      const effectiveLang = this.getEffectiveLanguage();
      document.documentElement.lang = effectiveLang;

      // Update elements with data-i18n
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
          el.textContent = this.t(key, el.textContent);
        }
      });

      // Update elements with data-i18n-title
      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key) {
          el.setAttribute('title', this.t(key, el.getAttribute('title') || ''));
        }
      });

      // Update elements with data-i18n-placeholder
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
          el.setAttribute('placeholder', this.t(key, el.getAttribute('placeholder') || ''));
        }
      });

      // Update Specific Shell Elements
      const omniboxInput = document.getElementById('omnibox-input');
      if (omniboxInput) {
        omniboxInput.setAttribute('placeholder', this.t('search_placeholder'));
      }

      const omniboxSecuritySpan = document.querySelector('#omnibox-security span');
      if (omniboxSecuritySpan) {
        const isInternal = document.getElementById('omnibox-security')?.classList.contains('internal');
        if (isInternal) {
          omniboxSecuritySpan.textContent = this.t('security_system');
        }
      }

      // Titlebar buttons
      const winMinBtn = document.getElementById('win-min-btn');
      if (winMinBtn) winMinBtn.title = this.t('minimize');
      const winMaxBtn = document.getElementById('win-max-btn');
      if (winMaxBtn) {
        winMaxBtn.title = (typeof isWindowMaximized !== 'undefined' && isWindowMaximized) ? this.t('restore') : this.t('maximize');
      }
      const winCloseBtn = document.getElementById('win-close-btn');
      if (winCloseBtn) winCloseBtn.title = this.t('close');

      // Nav buttons
      const navBackBtn = document.getElementById('nav-back-btn');
      if (navBackBtn) navBackBtn.title = this.t('back');
      const navForwardBtn = document.getElementById('nav-forward-btn');
      if (navForwardBtn) navForwardBtn.title = this.t('forward');
      const navRefreshBtn = document.getElementById('nav-refresh-btn');
      if (navRefreshBtn) navRefreshBtn.title = `${this.t('refresh')} (Ctrl+R)`;

      // Omnibox actions
      const readerBtn = document.getElementById('reader-mode-btn');
      if (readerBtn) readerBtn.title = this.t('reader_mode');
      const bmPageBtn = document.getElementById('bookmark-page-btn');
      if (bmPageBtn) bmPageBtn.title = this.t('bookmark_page');

      // Coador Button
      const shieldToggleBtn = document.getElementById('shield-toggle-btn');
      if (shieldToggleBtn) {
        const span = shieldToggleBtn.querySelector('span:not(.shield-badge-count)');
        if (span) span.textContent = this.t('coador_title');
        shieldToggleBtn.title = `${this.t('coador_title')} — ${this.t('coador_tag')}`;
      }

      // Coador Popover
      const adblockStatusBadge = document.getElementById('adblock-status-badge');
      if (adblockStatusBadge && window.CoffeeShields) {
        adblockStatusBadge.textContent = window.CoffeeShields.isPausedGlobal ? this.t('coador_paused') : this.t('coador_active');
      }
      const adblockStatLabels = document.querySelectorAll('.adblock-stat-label');
      if (adblockStatLabels.length >= 2) {
        adblockStatLabels[0].textContent = this.t('coador_blocked_page');
        adblockStatLabels[1].textContent = this.t('coador_total_blocked');
      }

      // Session restore popup
      const restoreTitle = document.querySelector('.restore-popup-title');
      if (restoreTitle) restoreTitle.textContent = this.t('restore_title');
      const restoreText = document.querySelector('.restore-popup-text');
      if (restoreText) restoreText.textContent = this.t('restore_desc');
      const restoreBtn = document.getElementById('restore-session-btn');
      if (restoreBtn) restoreBtn.textContent = this.t('restore_btn');

      // Status bar items
      const statusOnlineText = document.getElementById('status-online-text');
      if (statusOnlineText) {
        statusOnlineText.textContent = navigator.onLine ? this.t('status_online') : (this.t('status_offline') || 'OFFLINE');
      }
      const statusLatencyLabel = document.getElementById('status-latency-label');
      if (statusLatencyLabel) statusLatencyLabel.textContent = this.t('status_latency');

      const statusRoastLabel = document.getElementById('status-roast-label');
      if (statusRoastLabel) statusRoastLabel.textContent = this.t('status_roast');

      const statusRoastText = document.getElementById('status-roast-text');
      if (statusRoastText && window.BrowserState) {
        statusRoastText.textContent = this.t(`roast_${window.BrowserState.roast || 'medio'}`);
      }

      const statusMemoryLabel = document.getElementById('status-memory-label');
      if (statusMemoryLabel) statusMemoryLabel.textContent = this.t('status_memory');

      const statusShieldsLabel = document.getElementById('status-shields-label');
      if (statusShieldsLabel) statusShieldsLabel.textContent = this.t('status_shields');

      const statusShieldsText = document.getElementById('status-shields-text');
      if (statusShieldsText && window.CoffeeShields) {
        statusShieldsText.textContent = window.CoffeeShields.isPausedGlobal ? (this.t('status_paused') || 'PAUSADOS') : (this.t('status_active') || 'ATIVOS');
      }
    }
  }

  window.CoffeeI18n = new CoffeeI18nEngine();
})();
