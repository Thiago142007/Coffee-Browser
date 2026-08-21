/**
 * Real Search Engine & Live Web Navigation Engine for Coffee Browser
 */

class SearchEngineService {
  constructor() {
    this.engines = {
      google: {
        name: 'Google',
        searchUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`
      },
      duckduckgo: {
        name: 'DuckDuckGo',
        searchUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`
      },
      brave: {
        name: 'Brave Search',
        searchUrl: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}`
      },
      bing: {
        name: 'Bing',
        searchUrl: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`
      },
      wikipedia: {
        name: 'Wikipedia',
        searchUrl: (q) => `https://pt.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`
      }
    };
  }

  getSearchUrl(query, engineName) {
    const key = (engineName || window.BrowserState.searchEngine || 'google').toLowerCase();
    const engine = this.engines[key] || this.engines.google;
    return engine.searchUrl(query);
  }

  async fetchLiveSuggestions(query) {
    if (!query || query.trim().length === 0) return [];

    const clean = query.trim();

    // Try DuckDuckGo / Wikipedia real live autocomplete suggestions
    try {
      const wikiUrl = `https://pt.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=${encodeURIComponent(clean)}&limit=6`;
      const res = await fetch(wikiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data[1]) && data[1].length > 0) {
          return data[1].slice(0, 5);
        }
      }
    } catch(e) {
      // Fallback
    }

    // Fallback predictive suggestions
    const terms = [
      `${clean} notícias`,
      `${clean} oficial`,
      `${clean} login`,
      `${clean} download`,
      `${clean} github`
    ];
    return terms;
  }
}

window.SearchEngine = new SearchEngineService();
