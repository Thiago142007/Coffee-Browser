/**
 * Harness que executa webview-preload.js num "window" falso e valida o scrubber.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, 'webview-preload.js'), 'utf8');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name); }
}

function runInWindow(hostname, seedYPR) {
  const win = {
    location: { hostname },
    setInterval: () => 0,
    Math,
    JSON,
    Date
  };
  // O global do guest referencia a si mesmo como window (como no Electron)
  win.window = win;
  if (seedYPR) {
    win.ytInitialPlayerResponse = { videoDetails: { title: 'pre' }, adPlacements: { a: 1 }, adSlots: [1], playerAds: [{}], adBreakHeartbeatParams: 'z' };
  }
  const ctx = vm.createContext(win);
  try {
    vm.runInContext(code, ctx);
  } catch (e) {
    console.log('ERRO no preload:', e.message);
  }
  return win;
}

// --- Cenário 1: YouTube — trap de ytInitialPlayerResponse ---
{
  const win = runInWindow('www.youtube.com', true);
  const existing = win.ytInitialPlayerResponse;
  check('scrub do objeto já existente', existing && !('adPlacements' in existing) && Array.isArray(existing.playerAds) && existing.playerAds.length === 0);

  // Atribuição nova deve passar pelo trap
  win.ytInitialPlayerResponse = { videoDetails: { title: 'x' }, adPlacements: { a: 1 }, adSlots: [1], adBreakHeartbeatParams: 'x', playerAds: [{}] };
  const now = win.ytInitialPlayerResponse;
  check('trap remove adPlacements/adSlots/adBreakHeartbeatParams', now && !('adPlacements' in now) && !('adSlots' in now) && !('adBreakHeartbeatParams' in now));
  check('mantém dados legítimos (videoDetails)', now && now.videoDetails && now.videoDetails.title === 'x');
  check('esvazia playerAds', now.playerAds.length === 0);

  // playerResponse aninhado também é limpo
  win.ytInitialPlayerResponse = { playerResponse: { adSlots: [1], key: 'v' } };
  check('scrub aninhado em .playerResponse', !('adSlots' in win.ytInitialPlayerResponse.playerResponse) && win.ytInitialPlayerResponse.playerResponse.key === 'v');
}

// --- Cenário 2: Site normal — nada é tocado ---
{
  const win = runInWindow('github.com');
  check('não define trap fora do YouTube', !Object.getOwnPropertyDescriptor(win, 'ytInitialPlayerResponse'));
  win.ytInitialPlayerResponse = { adPlacements: { keep: true } };
  check('objeto externo permanece intacto', win.ytInitialPlayerResponse.adPlacements && win.ytInitialPlayerResponse.adPlacements.keep === true);
}

// --- Cenário 3: youtube-nocookie (embeds) ---
{
  const win = runInWindow('youtube-nocookie.com', true);
  check('nocookie: objeto inicial já foi limpo', !('adPlacements' in win.ytInitialPlayerResponse));
  win.ytInitialPlayerResponse = { adPlacements: { x: 1 } };
  check('embeds nocookie também são tratados', !('adPlacements' in win.ytInitialPlayerResponse));
}

// --- Cenário 3b: hook de fetch satura respostas /youtubei/ ---
{
  // Stubs precisam existir ANTES do preload rodar
  const win = { location: { hostname: 'www.youtube.com' }, setInterval: () => 0 };
  win.window = win;
  class FakeHeaders {
    set() {} get() { return 'application/json'; }
  }
  class FakeResponse {
    constructor(body) { this.body = body; }
  }
  win.Headers = FakeHeaders;
  win.Response = FakeResponse;
  win.fetch = function () {
    return Promise.resolve({
      clone() { return { json: () => Promise.resolve({ adSlots: [1], adPlacements: { x: 1 }, videoDetails: { title: 'ok' } }) }; },
      status: 200,
      statusText: 'OK',
      headers: new FakeHeaders()
    });
  };

  const ctx3b = vm.createContext(win);
  let loadError = null;
  try { vm.runInContext(code, ctx3b); } catch (e) { loadError = e; }

  if (loadError) {
    check('fetch hook executou', false);
    console.log('\n' + pass + ' passed, ' + fail + ' failed');
    process.exit(1);
  }

  win.fetch('https://www.youtube.com/youtubei/v1/player?key=x').then((r) => {
    const out = JSON.parse(r.body);
    check('fetch /youtubei/ sem adSlots', !('adSlots' in out));
    check('fetch /youtubei/ sem adPlacements', !('adPlacements' in out));
    check('dados legítimos preservados', out.videoDetails && out.videoDetails.title === 'ok');
    finish();
  }).catch(() => { check('fetch hook executou', false); finish(); });

  function finish() {
    console.log('\n' + pass + ' passed, ' + fail + ' failed');
    process.exit(fail ? 1 : 0);
  }
}
