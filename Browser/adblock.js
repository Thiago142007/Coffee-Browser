/**
 * Coador Filter Engine — Real Adblock Engine (EasyList/EasyPrivacy compatible)
 * Runs in the MAIN process. Pure Node, no Electron dependencies.
 *
 * Supports:
 *  - Network rules: ||anchor^, |left|right|, * wildcards, ^ separator,
 *    $options (script,image,stylesheet,xhr,subdocument,media,font,websocket,other,
 *              third-party/~third-party,important,domain=...,generichide,elemhide)
 *  - Exception rules (@@) with $important precedence
 *  - Cosmetic filters: ##selector, domain##selector, #@# exceptions (per-domain & global)
 *  - Hostname-bucketed index for fast matching + verdict cache
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const FILTER_SOURCES = [
  { name: 'easylist', url: 'https://easylist.to/easylist/easylist.txt' },
  { name: 'easyprivacy', url: 'https://easylist.to/easylist/easyprivacy.txt' }
];
const STALE_MS = 72 * 60 * 60 * 1000;
const DOWNLOAD_TIMEOUT_MS = 25000;

const RESOURCE_TYPES = {
  script: 'script',
  stylesheet: 'stylesheet',
  image: 'image',
  object: 'object',
  xhr: 'xmlhttprequest',
  ping: 'xmlhttprequest',
  cspReport: 'other',
  media: 'media',
  webSocket: 'websocket',
  font: 'font',
  subFrame: 'subdocument',
  other: 'other'
};

function filterToRegex(filter) {
  let s = filter;
  let prefix = '';
  let suffix = '';
  if (s.startsWith('||')) {
    prefix = '^[a-zA-Z][a-zA-Z0-9+.\\-]*:\\/\\/([^\\/?#]+\\.)?';
    s = s.slice(2);
  } else if (s.startsWith('|')) {
    prefix = '^';
    s = s.slice(1);
  }
  if (s.endsWith('|')) {
    suffix = '$';
    s = s.slice(0, -1);
  }
  const body = s
    .replace(/[.+?{}()[\]\\$|]/g, '\\$&')
    .replace(/\*+/g, '.*')
    .replace(/\^/g, '(?:[^a-z0-9_.%\\-]|$)');
  return new RegExp(prefix + body + suffix, 'i');
}

function parseDomainOption(value) {
  const include = [];
  const exclude = [];
  for (const part of value.split('|')) {
    const d = part.trim().toLowerCase().replace(/^www\./, '');
    if (!d) continue;
    if (d.startsWith('~')) exclude.push(d.slice(1));
    else include.push(d);
  }
  return { include, exclude };
}

function parseFilterLine(rawLine) {
  let line = rawLine.trim();
  if (!line || line.startsWith('!') || line.startsWith('[Adblock')) return null;

  let isException = false;
  if (line.startsWith('@@')) {
    isException = true;
    line = line.slice(2);
  }

  // Procedural cosmetic filters (#?#, #@$#, #%#) are not supported
  if (/#[?$%@]#/.test(line)) return null;

  // Cosmetic rules
  const cosmeticIdx = line.search(/#[@?$%]?#|^##/);
  if (/##/.test(line) || /#@#/.test(line)) {
    const sepIdx = line.indexOf('#@#');
    if (sepIdx !== -1) {
      const domainPart = line.slice(0, sepIdx).toLowerCase();
      const selector = line.slice(sepIdx + 3).trim();
      if (!selector || selector.length > 500) return null;
      if (domainPart) {
        return { kind: 'cosmetic-exception', domains: domainPart.split(','), selector };
      }
      return { kind: 'cosmetic-exception-global', selector };
    }
    const hashIdx = line.indexOf('##');
    if (hashIdx !== -1 && !line.includes('#@#') && !line.includes('#?#')) {
      const domainPart = line.slice(0, hashIdx).toLowerCase();
      const selector = line.slice(hashIdx + 2).trim();
      if (!selector || selector.length > 500) return null;
      if (selector.includes('{') || selector.toLowerCase().includes('javascript:')) return null;
      if (domainPart) {
        return { kind: 'cosmetic-domain', domains: domainPart.split(','), selector };
      }
      return { kind: 'cosmetic-global', selector };
    }
    return null; // #?# procedural filters are not supported
  }

  // Network rules with options
  let optionsStr = '';
  const dollarIdx = line.lastIndexOf('$');
  let body = line;
  if (dollarIdx !== -1) {
    const possibleOptions = line.slice(dollarIdx + 1);
    if (/^[\w~|.,=\-*]+$/.test(possibleOptions)) {
      optionsStr = possibleOptions;
      body = line.slice(0, dollarIdx);
    }
  }

  const rule = {
    kind: 'network',
    isException,
    important: false,
    thirdPartyOnly: false,
    firstPartyOnly: false,
    types: null,          // null = all types
    generichide: false,   // exception-only flags
    elemhide: false,
    includeDomains: null,
    excludeDomains: null,
    regex: null,
    key: ''               // hostname bucket key
  };

  if (optionsStr) {
    for (const opt of optionsStr.split(',')) {
      const o = opt.trim();
      if (!o) continue;
      if (o === 'important') rule.important = true;
      else if (o === 'third-party') rule.thirdPartyOnly = true;
      else if (o === '~third-party') rule.firstPartyOnly = true;
      else if (o === 'generichide' && isException) rule.generichide = true;
      else if (o === 'elemhide' && isException) rule.elemhide = true;
      else if (o.startsWith('domain=')) {
        const d = parseDomainOption(o.slice(7));
        rule.includeDomains = d.include.length ? d.include : null;
        rule.excludeDomains = d.exclude.length ? d.exclude : null;
      } else if (o.startsWith('~')) {
        const t = RESOURCE_TYPES[o.slice(1)];
        if (t && !rule.types) rule.types = new Set(Object.values(RESOURCE_TYPES));
        if (t) rule.types.delete(t);
      } else {
        const t = RESOURCE_TYPES[o];
        if (t) {
          if (!rule.types) rule.types = new Set();
          rule.types.add(t);
        } else if (!t && !['match-case', 'collapse', '~collapse', 'badfilter', 'inline-script'].includes(o) && !o.startsWith('redirect') && !o.startsWith('csp=')) {
          return null; // unknown option — discard rule safely
        }
      }
    }
    if (rule.types && rule.types.size === 0) return null;
  }

  if (!body || body === '*' || body === '.**') return null;
  if (!/[a-z0-9]/i.test(body)) return null;

  // Full regex filters written as /pattern/ are used verbatim
  let customRegex = null;
  if (body.length > 2 && body.startsWith('/') && body.endsWith('/')) {
    try {
      customRegex = new RegExp(body.slice(1, -1), 'i');
    } catch (e) {
      return null;
    }
  }

  try {
    rule.regex = customRegex || filterToRegex(body);
  } catch (e) {
    return null;
  }

  // Extract bucket key from ||host anchor without wildcards in host part
  if (body.startsWith('||')) {
    let host = body.slice(2);
    const cut = host.search(/[/^*]/);
    if (cut !== -1) host = host.slice(0, cut);
    host = host.toLowerCase().replace(/^www\./, '');
    if (host && !host.includes('*')) rule.key = host;
  }

  return rule;
}

class CoadorEngine {
  constructor() {
    this.networkBuckets = new Map();   // key -> rule[]
    this.genericNetwork = [];          // rules without hostname anchor
    this.cosmeticGlobal = [];
    this.cosmeticByDomain = new Map(); // domain -> Set(selector)
    this.cosmeticExceptionsGlobal = new Set();
    this.cosmeticExceptionsByDomain = new Map();
    this.verdictCache = new Map();
    this.dataDir = null;
    this.ready = false;
    this.ruleCount = 0;
    this.lastUpdate = 0;
  }

  init(dataDir) {
    this.dataDir = dataDir || path.join(process.env.APPDATA || process.env.TEMP || '.', 'coador_filters');
    try { fs.mkdirSync(this.dataDir, { recursive: true }); } catch (e) {}
  }

  addRule(rule) {
    if (rule.kind === 'network') {
      const bucket = rule.key ? this.networkBuckets : null;
      if (bucket) {
        if (!this.networkBuckets.has(rule.key)) this.networkBuckets.set(rule.key, []);
        this.networkBuckets.get(rule.key).push(rule);
      } else {
        this.genericNetwork.push(rule);
      }
      this.ruleCount++;
    } else if (rule.kind === 'cosmetic-global') {
      this.cosmeticGlobal.push(rule.selector);
    } else if (rule.kind === 'cosmetic-domain') {
      for (let d of rule.domains) {
        d = d.trim().replace(/^~/, '').replace(/^www\./, '');
        if (!d || d.startsWith('~')) continue;
        if (!this.cosmeticByDomain.has(d)) this.cosmeticByDomain.set(d, new Set());
        this.cosmeticByDomain.get(d).add(rule.selector);
      }
    } else if (rule.kind === 'cosmetic-exception-global') {
      this.cosmeticExceptionsGlobal.add(rule.selector);
    } else if (rule.kind === 'cosmetic-exception') {
      for (let d of rule.domains) {
        d = d.trim().replace(/^~/, '').replace(/^www\./, '');
        if (!d || d.startsWith('~')) continue;
        if (!this.cosmeticExceptionsByDomain.has(d)) this.cosmeticExceptionsByDomain.set(d, new Set());
        this.cosmeticExceptionsByDomain.get(d).add(rule.selector);
      }
    }
  }

  loadFromString(content) {
    for (const line of content.split('\n')) {
      const parsed = parseFilterLine(line);
      if (parsed) this.addRule(parsed);
    }
  }

  getFilterPath(name) {
    return path.join(this.dataDir, name + '.txt');
  }

  readCachedLists() {
    let loaded = 0;
    for (const src of FILTER_SOURCES) {
      try {
        const p = this.getFilterPath(src.name);
        if (fs.existsSync(p)) {
          this.loadFromString(fs.readFileSync(p, 'utf8'));
          const st = fs.statSync(p);
          if (st.mtimeMs > this.lastUpdate) this.lastUpdate = st.mtimeMs;
          loaded++;
        }
      } catch (e) {}
    }
    return loaded;
  }

  downloadFile(url, redirects) {
    redirects = redirects || 0;
    return new Promise((resolve, reject) => {
      if (redirects > 4) return reject(new Error('too many redirects'));
      const req = https.get(url, { timeout: DOWNLOAD_TIMEOUT_MS, headers: { 'User-Agent': 'CoffeeBrowser Coador Engine' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(this.downloadFile(new URL(res.headers.location, url).toString(), redirects + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error('HTTP ' + res.statusCode));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      });
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', reject);
    });
  }

  async updateLists() {
    let anyNew = false;
    for (const src of FILTER_SOURCES) {
      try {
        const content = await this.downloadFile(src.url);
        if (content && content.length > 10000) {
          fs.writeFileSync(this.getFilterPath(src.name), content);
          anyNew = true;
          this.lastUpdate = Date.now();
        }
      } catch (e) {}
    }
    if (anyNew) {
      this.resetRules();
      this.readCachedLists();
      this.ready = true;
    }
    return anyNew;
  }

  resetRules() {
    this.networkBuckets = new Map();
    this.genericNetwork = [];
    this.cosmeticGlobal = [];
    this.cosmeticByDomain = new Map();
    this.cosmeticExceptionsGlobal = new Set();
    this.cosmeticExceptionsByDomain = new Map();
    this.verdictCache = new Map();
    this.ruleCount = 0;
  }

  async ensureReady(onStatus) {
    const cached = this.readCachedLists();
    if (cached > 0) {
      this.ready = true;
      const stale = (Date.now() - this.lastUpdate) > STALE_MS;
      if (stale) {
        Promise.resolve(onStatus && onStatus('updating')).catch(() => {});
        this.updateLists().then(() => onStatus && onStatus('updated')).catch(() => {});
      }
      return true;
    }
    try {
      await this.updateLists();
      this.ready = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  hostnameSuffixes(hostname) {
    const parts = hostname.replace(/^www\./, '').split('.');
    const out = [];
    for (let i = 0; i < parts.length - 1; i++) {
      out.push(parts.slice(i).join('.'));
    }
    return out;
  }

  candidateRules(hostname) {
    const out = this.genericNetwork.slice();
    for (const suffix of this.hostnameSuffixes(hostname)) {
      const b = this.networkBuckets.get(suffix);
      if (b) out.push(...b);
    }
    return out;
  }

  domainMatchesList(hostname, list) {
    if (!list) return false;
    for (const d of list) {
      if (hostname === d || hostname.endsWith('.' + d)) return true;
    }
    return false;
  }

  evaluate(rule, urlLower, hostname, initiatorHostname, resourceType) {
    if (rule.types && !rule.types.has(resourceType)) return 0;
    if (rule.includeDomains || rule.excludeDomains) {
      if (!initiatorHostname) return 0;
      if (rule.excludeDomains && this.domainMatchesList(initiatorHostname, rule.excludeDomains)) return 0;
      if (rule.includeDomains && !this.domainMatchesList(initiatorHostname, rule.includeDomains)) return 0;
    }
    if (rule.thirdPartyOnly || rule.firstPartyOnly) {
      if (!initiatorHostname) return 0;
      const thirdParty = initiatorHostname !== hostname && !hostname.endsWith('.' + initiatorHostname) && !initiatorHostname.endsWith('.' + hostname);
      if (rule.thirdPartyOnly && !thirdParty) return 0;
      if (rule.firstPartyOnly && thirdParty) return 0;
    }
    return rule.regex.test(urlLower) ? (rule.important ? 2 : 1) : 0;
  }

  shouldBlock(url, electronType, initiatorUrl) {
    if (!this.ready) return false;
    if (!url || !/^https?:/i.test(url)) return false;

    let hostname = '';
    try { hostname = new URL(url).hostname.toLowerCase(); } catch (e) { return false; }

    const resourceType = RESOURCE_TYPES[electronType] || 'other';
    if (resourceType === 'subdocument' || electronType === 'mainFrame') {
      // never block top-level/main documents via network rules
      if (electronType === 'mainFrame') return false;
    }

    const cacheKey = resourceType + '|' + (initiatorUrl || '-') + '|' + url;
    if (this.verdictCache.has(cacheKey)) return this.verdictCache.get(cacheKey);

    let initiatorHostname = '';
    if (initiatorUrl) {
      try { initiatorHostname = new URL(initiatorUrl).hostname.toLowerCase(); } catch (e) {}
    }

    const urlLower = url.toLowerCase();
    const candidates = this.candidateRules(hostname);

    let blocked = false;
    let blockedImportant = false;
    let excepted = false;
    let exceptedImportant = false;

    for (const rule of candidates) {
      if (rule.isException && rule.generichide) continue;
      if (rule.isException && rule.elemhide) continue;
      const r = this.evaluate(rule, urlLower, hostname, initiatorHostname, resourceType);
      if (!r) continue;
      if (rule.isException) {
        excepted = true;
        if (r === 2) exceptedImportant = true;
      } else {
        blocked = true;
        if (r === 2) blockedImportant = true;
      }
    }

    let verdict;
    if (blockedImportant) verdict = true;
    else if (exceptedImportant) verdict = false;
    else if (blocked && !excepted) verdict = true;
    else verdict = false;

    if (this.verdictCache.size > 40000) this.verdictCache.clear();
    this.verdictCache.set(cacheKey, verdict);
    return verdict;
  }

  hasPageLevelHideException(pageUrl) {
    // returns 'generichide' | 'elemhide' | null
    let hostname = '';
    try { hostname = new URL(pageUrl).hostname.toLowerCase(); } catch (e) { return null; }
    const pageLower = pageUrl.toLowerCase();
    const result = { generichide: false, elemhide: false };
    for (const suffix of this.hostnameSuffixes(hostname)) {
      const b = this.networkBuckets.get(suffix);
      if (!b) continue;
      for (const rule of b) {
        if (!rule.isException || (!rule.generichide && !rule.elemhide)) continue;
        const r = this.evaluate(rule, pageLower, hostname, '', 'other');
        if (r) {
          if (rule.elemhide) result.elemhide = true;
          if (rule.generichide) result.generichide = true;
        }
      }
    }
    for (const rule of this.genericNetwork) {
      if (!rule.isException || (!rule.generichide && !rule.elemhide)) continue;
      const r = this.evaluate(rule, pageLower, hostname, '', 'other');
      if (r) {
        if (rule.elemhide) result.elemhide = true;
        if (rule.generichide) result.generichide = true;
      }
    }
    if (result.elemhide) return 'elemhide';
    if (result.generichide) return 'generichide';
    return null;
  }

  getCosmeticCss(pageUrl) {
    if (!this.ready) return null;
    if (!pageUrl || !/^https?:/i.test(pageUrl)) return null;
    let hostname = '';
    try { hostname = new URL(pageUrl).hostname.toLowerCase(); } catch (e) { return null; }

    const hideMode = this.hasPageLevelHideException(pageUrl);
    const selectors = [];

    if (hideMode !== 'elemhide' && hideMode !== 'generichide' && this.cosmeticGlobal.length) {
      for (const s of this.cosmeticGlobal) {
        if (!this.cosmeticExceptionsGlobal.has(s)) selectors.push(s);
      }
    }

    for (const suffix of this.hostnameSuffixes(hostname)) {
      const selSet = this.cosmeticByDomain.get(suffix);
      if (!selSet) continue;
      const exceptions = new Set(this.cosmeticExceptionsGlobal);
      const excSet = this.cosmeticExceptionsByDomain.get(suffix);
      if (excSet) for (const e of excSet) exceptions.add(e);
      for (const s of selSet) {
        if (!exceptions.has(s)) selectors.push(s);
      }
    }

    if (!selectors.length) return null;
    // One CSS rule per selector: an invalid selector only discards itself
    return selectors.map((sel) => sel + '{display:none !important;}').join('\n');
  }
}

module.exports = { CoadorEngine, parseFilterLine, filterToRegex };
