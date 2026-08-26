const { CoadorEngine } = require('./adblock');

(async () => {
  const engine = new CoadorEngine();
  engine.init(require('os').tmpdir() + '/coador_test_' + Date.now());
  console.log('Baixando listas reais...');
  const t0 = Date.now();
  const ok = await engine.ensureReady();
  console.log('ensureReady:', ok, 'em', Date.now() - t0, 'ms');
  console.log('regras carregadas:', engine.ruleCount);
  console.log('buckets de hostname:', engine.networkBuckets.size);

  // Perf: 3000 avaliacoes tipicas
  const urls = [
    ['https://securepubads.g.doubleclick.net/tag/js/gpt.js', 'script'],
    ['https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', 'script'],
    ['https://www.google-analytics.com/analytics.js', 'script'],
    ['https://cdn.site.com/images/logo.png', 'image'],
    ['https://googleads.g.doubleclick.net/pagead/id?slf', 'xhr'],
    ['https://static.hotjar.com/c/hotjar-123.js', 'script'],
    ['https://www.googletagmanager.com/gtm.js?id=GTM-ABC', 'script']
  ];
  const t1 = Date.now();
  let blockedCount = 0;
  for (let i = 0; i < 3000; i++) {
    const [u, t] = urls[i % urls.length];
    if (engine.shouldBlock(u, t, 'https://www.example-news.com/')) blockedCount++;
  }
  const dt = Date.now() - t1;
  console.log('3000 avaliacoes em', dt, 'ms →', (dt / 3000 * 1000).toFixed(1), 'us/avaliacao (com cache)');
  console.log('bloqueados:', blockedCount, '(esperado: ~4 de 7 tipos por ciclo)');

  // Cold verdicts (sem cache) — pior caso
  const e2 = new CoadorEngine();
  e2.init(engine.dataDir);
  e2.readCachedLists();
  e2.ready = true;
  const t2 = Date.now();
  for (let i = 0; i < 200; i++) {
    e2.shouldBlock('https://tracker' + i + '.example.com/px.gif?t=' + i, 'image', 'https://news.com/');
  }
  console.log('200 vereditos frios em', Date.now() - t2, 'ms');

  // CSS cosmético real
  const css = engine.getCosmeticCss('https://www.uol.com.br/noticias/');
  console.log('CSS uol:', css ? css.length + ' chars, ' + css.split('\n').length + ' regras' : 'null');
})().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
