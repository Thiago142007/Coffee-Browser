/**
 * Coffee Browser Custom Installer — Client UI Controller
 */

let ipcRenderer = null;
try {
  if (typeof require !== 'undefined') {
    const electron = require('electron');
    ipcRenderer = electron.ipcRenderer;
  }
} catch(e) {}

let currentStep = 1;
let selectedRoast = 'medio';
let destinationPath = '';

document.addEventListener('DOMContentLoaded', async () => {
  initWindowControls();
  initStepNavigation();
  initDefaultPath();
  initProgressEvents();
});

// 1. Frameless Window Controls
function initWindowControls() {
  const minBtn = document.getElementById('win-min-btn');
  const closeBtn = document.getElementById('win-close-btn');

  if (minBtn) {
    minBtn.addEventListener('click', () => {
      if (ipcRenderer) ipcRenderer.send('installer-minimize');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (ipcRenderer) ipcRenderer.send('installer-close');
      else window.close();
    });
  }
}

// 2. Default Path Initialization & Browse Dialog
async function initDefaultPath() {
  const pathInput = document.getElementById('dest-path-input');
  const browseBtn = document.getElementById('browse-folder-btn');

  if (ipcRenderer) {
    try {
      destinationPath = await ipcRenderer.invoke('get-default-install-path');
      if (pathInput) pathInput.value = destinationPath;
    } catch(e) {
      destinationPath = 'C:\\Users\\Default\\AppData\\Local\\CoffeeBrowser';
      if (pathInput) pathInput.value = destinationPath;
    }
  } else {
    destinationPath = 'C:\\CoffeeBrowser';
    if (pathInput) pathInput.value = destinationPath;
  }

  if (browseBtn) {
    browseBtn.addEventListener('click', async () => {
      if (ipcRenderer) {
        const newPath = await ipcRenderer.invoke('browse-install-folder', pathInput.value || destinationPath);
        if (newPath) {
          destinationPath = newPath;
          if (pathInput) pathInput.value = newPath;
        }
      }
    });
  }

  if (pathInput) {
    pathInput.addEventListener('input', () => {
      destinationPath = pathInput.value;
    });
  }
}

// 3. Step Navigation Controls
function initStepNavigation() {
  const btnNext = document.getElementById('btn-next');
  const btnBack = document.getElementById('btn-back');
  const btnCancel = document.getElementById('btn-cancel');

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (currentStep === 1) {
        goToStep(2);
      } else if (currentStep === 2) {
        startInstallation();
      } else if (currentStep === 4) {
        finishAndLaunch();
      }
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', () => {
      if (currentStep === 2) {
        goToStep(1);
      }
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      if (ipcRenderer) ipcRenderer.send('installer-close');
      else window.close();
    });
  }
}

function goToStep(step) {
  currentStep = step;

  // Switch step views
  document.querySelectorAll('.wizard-step').forEach((el, index) => {
    el.classList.toggle('active', index + 1 === step);
  });

  // Update step indicators
  for (let i = 1; i <= 4; i++) {
    const ind = document.getElementById(`step-nav-${i}`);
    if (ind) {
      ind.classList.remove('active', 'completed');
      if (i === step) {
        ind.classList.add('active');
      } else if (i < step) {
        ind.classList.add('completed');
      }
    }
  }

  // Update Footer buttons
  const btnBack = document.getElementById('btn-back');
  const btnNext = document.getElementById('btn-next');
  const btnCancel = document.getElementById('btn-cancel');

  if (step === 1) {
    if (btnBack) btnBack.style.display = 'none';
    if (btnCancel) btnCancel.style.display = 'inline-flex';
    if (btnNext) {
      btnNext.textContent = 'Avançar →';
      btnNext.className = 'btn btn-primary';
      btnNext.disabled = false;
    }
  } else if (step === 2) {
    if (btnBack) btnBack.style.display = 'inline-flex';
    if (btnCancel) btnCancel.style.display = 'inline-flex';
    if (btnNext) {
      btnNext.textContent = 'Instalar Agora ☕';
      btnNext.className = 'btn btn-primary';
      btnNext.disabled = false;
    }
  } else if (step === 3) {
    if (btnBack) btnBack.style.display = 'none';
    if (btnCancel) btnCancel.style.display = 'none';
    if (btnNext) {
      btnNext.textContent = 'Instalando...';
      btnNext.className = 'btn btn-primary';
      btnNext.disabled = true;
    }
  } else if (step === 4) {
    if (btnBack) btnBack.style.display = 'none';
    if (btnCancel) btnCancel.style.display = 'none';
    if (btnNext) {
      btnNext.textContent = 'Concluir & Degustar 🚀';
      btnNext.className = 'btn btn-success';
      btnNext.disabled = false;
    }
  }
}

// 4. Roast Selection
function selectRoast(roast) {
  selectedRoast = roast;
  document.querySelectorAll('.roast-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.roast === roast);
  });
}
window.selectRoast = selectRoast;

// 5. Real-Time Installation Execution
async function startInstallation() {
  goToStep(3);

  const config = {
    destPath: destinationPath || (document.getElementById('dest-path-input') ? document.getElementById('dest-path-input').value : ''),
    roast: selectedRoast,
    desktopShortcut: document.getElementById('chk-desktop-shortcut') ? document.getElementById('chk-desktop-shortcut').checked : true,
    startMenuShortcut: document.getElementById('chk-startmenu-shortcut') ? document.getElementById('chk-startmenu-shortcut').checked : true,
    autostart: document.getElementById('chk-autostart') ? document.getElementById('chk-autostart').checked : true,
    defaultBrowser: document.getElementById('chk-default-browser') ? document.getElementById('chk-default-browser').checked : true,
    enableCador: document.getElementById('chk-enable-coador') ? document.getElementById('chk-enable-coador').checked : true
  };

  if (ipcRenderer) {
    try {
      const result = await ipcRenderer.invoke('execute-installation', config);
      if (result && result.success) {
        setTimeout(() => showCompletion(config), 600);
      } else {
        appendLog(`[FALHA] ${result.error || 'Erro desconhecido durante instalação'}`, 'warn');
      }
    } catch(err) {
      appendLog(`[ERRO] ${err.message}`, 'warn');
    }
  } else {
    // Simulated fallback for browser preview
    simulateInstallation(config);
  }
}

function initProgressEvents() {
  if (ipcRenderer) {
    ipcRenderer.on('install-progress-update', (event, data) => {
      updateProgressUI(data.percent, data.message);
      if (data.log) {
        appendLog(data.log, data.ok ? 'ok' : 'info');
      }
    });
  }
}

function updateProgressUI(percent, message) {
  const fill = document.getElementById('progress-bar-fill');
  const label = document.getElementById('install-percentage-label');
  const status = document.getElementById('install-status-label');

  if (fill) fill.style.width = `${percent}%`;
  if (label) label.textContent = `${percent}%`;
  if (status && message) status.textContent = message;
}

function appendLog(text, type = 'info') {
  const logContainer = document.getElementById('terminal-stream-logs');
  if (!logContainer) return;

  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<span>[${new Date().toLocaleTimeString()}]</span> <span>${text}</span>`;
  logContainer.appendChild(entry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

function simulateInstallation(config) {
  let p = 0;
  const steps = [
    { p: 15, msg: 'Preparando diretório de instalação...', log: '[INFO] Criando pasta de instalação...' },
    { p: 35, msg: 'Copiando recursos e bibliotecas...', log: '[INFO] Descompactando binários Chromium e Electron...' },
    { p: 60, msg: 'Configurando tema e preferências...', log: `[OK] Perfil [${config.roast}] registrado com sucesso.` },
    { p: 85, msg: 'Criando atalhos no sistema...', log: '[OK] Atalhos na Área de Trabalho e Menu Iniciar gerados.' },
    { p: 100, msg: 'Instalação concluída com sucesso!', log: '[OK] Coffee Browser pronto para execução.' }
  ];

  let i = 0;
  const timer = setInterval(() => {
    if (i < steps.length) {
      updateProgressUI(steps[i].p, steps[i].msg);
      appendLog(steps[i].log, 'ok');
      i++;
    } else {
      clearInterval(timer);
      setTimeout(() => showCompletion(config), 500);
    }
  }, 600);
}

// 6. Completion Screen
function showCompletion(config) {
  goToStep(4);

  const summaryPath = document.getElementById('summary-path-val');
  const summaryRoast = document.getElementById('summary-roast-val');

  if (summaryPath) summaryPath.textContent = config.destPath;
  if (summaryRoast) {
    const roastNames = { 'claro': 'Torra Clara', 'medio': 'Torra Média', 'escuro': 'Torra Escura' };
    summaryRoast.textContent = roastNames[config.roast] || 'Torra Média';
  }
}

// 7. Finish & Launch Application
function finishAndLaunch() {
  const chkLaunch = document.getElementById('chk-launch-now');
  const shouldLaunch = chkLaunch ? chkLaunch.checked : true;

  if (shouldLaunch && ipcRenderer) {
    ipcRenderer.send('launch-installed-app', destinationPath);
  } else {
    if (ipcRenderer) ipcRenderer.send('installer-close');
    else window.close();
  }
}
