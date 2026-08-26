const { CoadorEngine, parseFilterLine } = require('./adblock');

const engine = new CoadorEngine();

const sampleFilters = [
  '! Title: EasyList (sample)',
  '||doubleclick.net^',
  '||googlesyndication.com^$script,image',
  '/ads/banner.$script',
  '@@||googleapis.com^$script',
  '||adnxs.com^$third-party',
  '||example-tracker.com^$important',
  '@@||example-tracker.com^$important,domain=trusted.com',
  '||taboola.com^$domain=news.com|~safe.com',
  '##div.ad-banner',
  '#@#.keep-visible',
  'news.com##.hero-ad',
  'news.com#@#.hero-ad-keep',
  '||ads.example.com^'
];

for (const line of sampleFilters) engine.loadFromString(line);
engine.ready = true;

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name); }
}

// Network blocking
check('doubleclick image blocked', engine.shouldBlock('https://ad.doubleclick.net/ddm/adj/n123/x?sz=300x250', 'image', 'https://news.com/') === true);
check('doubleclick subFrame blocked', engine.shouldBlock('https://googleads.g.doubleclick.net/pagead/id', 'subFrame', 'https://news.com/') === true);
check('googlesyndication script blocked', engine.shouldBlock('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', 'script', 'https://news.com/') === true);
check('/ads/banner. script blocked', engine.shouldBlock('https://cdn.news.com/ads/banner.320x50.js', 'script', 'https://news.com/') === true);
check('normal page not blocked', engine.shouldBlock('https://news.com/articles/tech/story.html', 'mainFrame', '') === false);
check('normal asset not blocked', engine.shouldBlock('https://cdn.news.com/img/logo.png', 'image', 'https://news.com/') === false);

// Exceptions
check('googleapis script excepted (@@)', engine.shouldBlock('https://www.googleapis.com/customsearch/v1?x=/ads/banner.', 'script', 'https://news.com/') === false);

// Third-party option
check('adnxs third-party blocked', engine.shouldBlock('https://ib.adnxs.com/px?id=1', 'image', 'https://other.com/') === true);
check('adnxs first-party NOT blocked ($third-party)', engine.shouldBlock('https://ib.adnxs.com/px?id=1', 'image', 'https://adnxs.com/') === false);

// exception wins over non-important block
check('normal exception allows blocked domain', (() => {
  const e2 = new CoadorEngine();
  e2.loadFromString('||tracker.io^\n@@||tracker.io^');
  e2.ready = true;
  return e2.shouldBlock('https://t.tracker.io/pixel.gif', 'image', 'https://x.com/') === false;
})());
check('$important block wins over normal exception', (() => {
  const e3 = new CoadorEngine();
  e3.loadFromString('||tracker.io^$important\n@@||tracker.io^');
  e3.ready = true;
  return e3.shouldBlock('https://t.tracker.io/pixel.gif', 'image', 'https://x.com/') === true;
})());
check('$important block beats important exception (both exist)', engine.shouldBlock('https://srv.example-tracker.com/t.js', 'script', 'https://trusted.com/') === true);
check('important EXCEPTION saves domain when block is normal', (() => {
  const e4 = new CoadorEngine();
  e4.loadFromString('||tracker2.io^\n@@||tracker2.io^$important,domain=trusted.com');
  e4.ready = true;
  return e4.shouldBlock('https://t.tracker2.io/p.gif', 'image', 'https://trusted.com/') === false
      && e4.shouldBlock('https://t.tracker2.io/p.gif', 'image', 'https://random.org/') === true;
})());
check('important rule blocks other domains', engine.shouldBlock('https://srv.example-tracker.com/t.js', 'script', 'https://random.org/') === true);

// domain= include/exclude
check('taboola blocked for news.com ($domain)', engine.shouldBlock('https://cdn.taboola.com/libtrc/loader.js', 'script', 'https://news.com/') === true);
check('taboola NOT blocked for safe.com (~exclude)', engine.shouldBlock('https://cdn.taboola.com/libtrc/loader.js', 'script', 'https://safe.com/') === false);

// subresource hostname bucket matching with subdomains
check('ads.example.com bucket match', engine.shouldBlock('https://ads.example.com/b.js', 'script', 'https://site.br/') === true);
check('example.com itself NOT matched by ||ads.example.com', engine.shouldBlock('https://example.com/b.js', 'script', 'https://site.br/') === false);

// Verdict cache consistency
check('cache returns same verdict', engine.shouldBlock('https://ad.doubleclick.net/ddm/adj/n123/x?sz=300x250', 'image', 'https://news.com/') === true);

// Cosmetic CSS
const css = engine.getCosmeticCss('https://www.news.com/home');
check('cosmetic: global selector present', css.includes('div.ad-banner'));
check('cosmetic: domain selector present', css.includes('.hero-ad'));
check('cosmetic: global exception removed', !css.includes('.keep-visible'));
check('cosmetic: domain exception removed', !css.includes('.hero-ad-keep'));

const cssOther = engine.getCosmeticCss('https://blog.example.org/post');
check('cosmetic: only global rules on other site', cssOther.includes('div.ad-banner') && !cssOther.includes('.hero-ad'));

// generichide exception (drops GENERIC hiding; site-specific selectors stay)
engine.loadFromString('@@||news.com^$generichide');
const cssGH = engine.getCosmeticCss('https://news.com/x');
check('generichide disables GLOBAL hiding on news.com', cssGH !== null && !cssGH.includes('div.ad-banner'));
check('site-specific selectors survive generichide', cssGH !== null && cssGH.includes('.hero-ad'));
check('generichide does not affect other sites', (() => {
  const c = engine.getCosmeticCss('https://blog.example.org/post');
  return c !== null && c.includes('div.ad-banner');
})());

// parseFilterLine sanity
check('comment ignored', parseFilterLine('! comment') === null);
check('header ignored', parseFilterLine('[Adblock Plus 2.0]') === null);
check('procedural #?# skipped', parseFilterLine('example.com#?#div:has(.ad)') === null);
check(':has via ## kept (Chromium supports)', (() => {
  const r = parseFilterLine('example.com##div:has(.ad)');
  return !!r && r.kind === 'cosmetic-domain';
})());
check('$redirect= option does not discard rule', parseFilterLine('||ads.net^$script,redirect=noopjs') !== null);
check('bad regex discarded', parseFilterLine('**[[') === null);
check('pure wildcard discarded', parseFilterLine('***') === null);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
