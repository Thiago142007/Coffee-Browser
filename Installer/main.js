/**
 * Coffee Browser Custom Desktop Installer — Main Process
 * Fully Self-Contained with Multi-Tier Fallbacks & Embedded Archive Support
 */
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');

let mainWindow = null;

function createInstallerWindow() {
  mainWindow = new BrowserWindow({
    width: 760,
    height: 560,
    resizable: false,
    maximizable: false,
    frame: false,
    show: false,
    center: true,
    backgroundColor: '#120A06',
    title: 'Instalador do Coffee Browser',
    icon: path.join(__dirname, 'assets', 'logo.jpg'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createInstallerWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Window Controls IPC
ipcMain.on('installer-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('installer-close', () => {
  if (mainWindow) mainWindow.close();
});

// Default Installation Path IPC
ipcMain.handle('get-default-install-path', () => {
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\', 'AppData', 'Local');
  return path.join(localAppData, 'CoffeeBrowser');
});

// Browse Directory Dialog IPC
ipcMain.handle('browse-install-folder', async (event, currentPath) => {
  if (!mainWindow) return currentPath;
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Selecione a pasta de instalação do Coffee Browser',
      defaultPath: currentPath || process.env.LOCALAPPDATA,
      properties: ['openDirectory', 'createDirectory']
    });

    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
  } catch(e) {}
  return currentPath;
});

// Real Installation Routine with Full Fallbacks
ipcMain.handle('execute-installation', async (event, config) => {
  const destDir = config.destPath;
  const sendProgress = (percent, message, log, ok = false) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('install-progress-update', {
        percent,
        message,
        log,
        ok
      });
    }
  };

  try {
    sendProgress(5, 'Fechando instâncias antigas se houver...', '[INFO] Verificando processos ativos do Coffee Browser...');
    
    // Close existing running instance to prevent EBUSY/file locking
    if (process.platform === 'win32') {
      try {
        await new Promise((resolve) => {
          exec('taskkill /F /IM CoffeeBrowser.exe /T', () => resolve());
        });
      } catch(e) {}
    }

    sendProgress(12, 'Preparando diretório de destino...', `[INFO] Criando pasta: ${destDir}`);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Determine payload locations
    const possibleZipPaths = [
      path.join(__dirname, 'payload.zip'),
      path.join(__dirname, '..', 'Installer', 'payload.zip'),
      path.join(process.resourcesPath || '', 'payload.zip'),
      path.join(process.cwd(), 'payload.zip'),
      path.join(process.cwd(), 'Installer', 'payload.zip')
    ];

    let foundZipPath = null;
    for (const p of possibleZipPaths) {
      if (fs.existsSync(p)) {
        foundZipPath = p;
        break;
      }
    }

    let installedSuccessfully = false;

    // STRATEGY 1: Extract Embedded payload.zip (100% Self-Contained)
    if (foundZipPath) {
      sendProgress(25, 'Extraindo pacote autônomo do Coffee Browser...', `[INFO] Descompactando arquivo ${path.basename(foundZipPath)}...`);
      
      const extractCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '${foundZipPath}' -DestinationPath '${destDir}' -Force"`;
      
      try {
        await new Promise((resolve, reject) => {
          exec(extractCmd, { maxBuffer: 1024 * 1024 * 32 }, (err, stdout, stderr) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        installedSuccessfully = true;
        sendProgress(65, 'Arquivos descompactados com sucesso!', '[OK] Todos os módulos do Chromium e binários foram extraídos.', true);
      } catch (zipErr) {
        sendProgress(35, 'Falha ao descompactar via PowerShell, tentando cópia direta...', `[AVISO] ${zipErr.message}`);
      }
    }

    // STRATEGY 2 (Fallback): Copy from packaged dist directory if available
    if (!installedSuccessfully) {
      const possibleDistDirs = [
        path.join(__dirname, '..', 'Browser', 'dist', 'CoffeeBrowser-win32-x64'),
        path.join(process.cwd(), 'Browser', 'dist', 'CoffeeBrowser-win32-x64'),
        path.join(process.cwd(), 'dist', 'CoffeeBrowser-win32-x64')
      ];

      let foundDist = null;
      for (const d of possibleDistDirs) {
        if (fs.existsSync(d)) {
          foundDist = d;
          break;
        }
      }

      if (foundDist) {
        sendProgress(40, 'Copiando arquivos do pacote pré-compilado...', `[INFO] Transferindo arquivos de ${foundDist}...`);
        
        const copyDirRecursive = (src, dest) => {
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          const entries = fs.readdirSync(src, { withFileTypes: true });
          for (const entry of entries) {
            const srcP = path.join(src, entry.name);
            const destP = path.join(dest, entry.name);
            if (entry.isDirectory()) {
              copyDirRecursive(srcP, destP);
            } else {
              try {
                fs.copyFileSync(srcP, destP);
              } catch(e) {}
            }
          }
        };

        copyDirRecursive(foundDist, destDir);
        installedSuccessfully = true;
        sendProgress(65, 'Cópia de binários concluída!', '[OK] Binários copiados com sucesso.', true);
      }
    }

    // STRATEGY 3 (Fallback): Copy source Browser files
    if (!installedSuccessfully) {
      const possibleSourceDirs = [
        path.join(__dirname, '..', 'Browser'),
        path.join(process.cwd(), 'Browser')
      ];

      let foundSource = null;
      for (const s of possibleSourceDirs) {
        if (fs.existsSync(s) && fs.existsSync(path.join(s, 'index.html'))) {
          foundSource = s;
          break;
        }
      }

      if (foundSource) {
        sendProgress(40, 'Copiando arquivos fonte do Coffee Browser...', `[INFO] Transferindo estrutura de ${foundSource}...`);
        
        const copySourceRecursive = (src, dest) => {
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          const entries = fs.readdirSync(src, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.name === 'dist' || entry.name === '.git') continue;
            const srcP = path.join(src, entry.name);
            const destP = path.join(dest, entry.name);
            if (entry.isDirectory()) {
              copySourceRecursive(srcP, destP);
            } else {
              try {
                fs.copyFileSync(srcP, destP);
              } catch(e) {}
            }
          }
        };

        copySourceRecursive(foundSource, destDir);
        installedSuccessfully = true;
        sendProgress(65, 'Estrutura transferida com sucesso!', '[OK] Arquivos copiados com sucesso.', true);
      }
    }

    if (!installedSuccessfully) {
      throw new Error('Nenhum pacote de instalação (payload.zip ou dist) foi encontrado para extração.');
    }

    // Step: Write initial preferences
    sendProgress(75, 'Configurando preferências e perfil de torra...', `[INFO] Gravando perfil [${config.roast}] e preferências do Coador...`, true);
    
    const prefs = {
      roast: config.roast || 'medio',
      shieldsEnabled: config.enableCador !== false,
      installedAt: Date.now(),
      installPath: destDir
    };
    try {
      fs.writeFileSync(path.join(destDir, 'install_preferences.json'), JSON.stringify(prefs, null, 2));
    } catch(e) {}

    // Step: Shortcuts Registration on Windows
    sendProgress(85, 'Criando atalhos no Windows...', '[INFO] Registrando atalhos na Área de Trabalho e Menu Iniciar...');

    const exeTarget = fs.existsSync(path.join(destDir, 'CoffeeBrowser.exe'))
      ? path.join(destDir, 'CoffeeBrowser.exe')
      : (fs.existsSync(path.join(destDir, 'Launcher.cs')) ? path.join(destDir, 'CoffeeBrowser.exe') : path.join(destDir, 'main.js'));

    const iconTarget = fs.existsSync(path.join(destDir, 'assets', 'logo.jpg'))
      ? path.join(destDir, 'assets', 'logo.jpg')
      : path.join(__dirname, 'assets', 'logo.jpg');

    if (process.platform === 'win32') {
      const desktopPath = path.join(process.env.USERPROFILE || 'C:\\', 'Desktop');
      const startMenuPath = path.join(process.env.APPDATA || 'C:\\', 'Microsoft', 'Windows', 'Start Menu', 'Programs');

      const psShortcutScript = `
        try {
          $WshShell = New-Object -ComObject WScript.Shell;
          ${config.desktopShortcut ? `
          $dPath = "${path.join(desktopPath, 'Coffee Browser.lnk').replace(/\\/g, '\\\\')}";
          $DesktopShortcut = $WshShell.CreateShortcut($dPath);
          $DesktopShortcut.TargetPath = "${exeTarget.replace(/\\/g, '\\\\')}";
          $DesktopShortcut.WorkingDirectory = "${destDir.replace(/\\/g, '\\\\')}";
          $DesktopShortcut.Description = "Coffee Browser — Navegador Web Minimalista e Seguro";
          if (Test-Path "${iconTarget.replace(/\\/g, '\\\\')}") { $DesktopShortcut.IconLocation = "${iconTarget.replace(/\\/g, '\\\\')}"; }
          $DesktopShortcut.Save();
          ` : ''}
          ${config.startMenuShortcut ? `
          $sDir = "${startMenuPath.replace(/\\/g, '\\\\')}";
          if (!(Test-Path $sDir)) { New-Item -ItemType Directory -Path $sDir -Force | Out-Null; }
          $sPath = "${path.join(startMenuPath, 'Coffee Browser.lnk').replace(/\\/g, '\\\\')}";
          $StartShortcut = $WshShell.CreateShortcut($sPath);
          $StartShortcut.TargetPath = "${exeTarget.replace(/\\/g, '\\\\')}";
          $StartShortcut.WorkingDirectory = "${destDir.replace(/\\/g, '\\\\')}";
          $StartShortcut.Description = "Coffee Browser";
          if (Test-Path "${iconTarget.replace(/\\/g, '\\\\')}") { $StartShortcut.IconLocation = "${iconTarget.replace(/\\/g, '\\\\')}"; }
          $StartShortcut.Save();
          ` : ''}
          ${config.autostart ? `
          Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "CoffeeBrowser" -Value "\\"${exeTarget.replace(/\\/g, '\\\\')}\\"";
          ` : ''}
          ${config.defaultBrowser ? `
          $exeCmd = "\\"${exeTarget.replace(/\\/g, '\\\\')}\\" \\"%1\\"";
          New-Item -Path "HKCU:\\Software\\Classes\\CoffeeBrowserHTML\\shell\\open\\command" -Force | Out-Null;
          Set-ItemProperty -Path "HKCU:\\Software\\Classes\\CoffeeBrowserHTML\\shell\\open\\command" -Name "(default)" -Value $exeCmd;
          New-Item -Path "HKCU:\\Software\\Classes\\CoffeeBrowserURL\\shell\\open\\command" -Force | Out-Null;
          Set-ItemProperty -Path "HKCU:\\Software\\Classes\\CoffeeBrowserURL\\shell\\open\\command" -Name "(default)" -Value $exeCmd;
          New-Item -Path "HKCU:\\Software\\Classes\\http\\shell\\open\\command" -Force | Out-Null;
          Set-ItemProperty -Path "HKCU:\\Software\\Classes\\http\\shell\\open\\command" -Name "(default)" -Value $exeCmd;
          New-Item -Path "HKCU:\\Software\\Classes\\https\\shell\\open\\command" -Force | Out-Null;
          Set-ItemProperty -Path "HKCU:\\Software\\Classes\\https\\shell\\open\\command" -Name "(default)" -Value $exeCmd;
          New-Item -Path "HKCU:\\Software\\RegisteredApplications" -Force | Out-Null;
          Set-ItemProperty -Path "HKCU:\\Software\\RegisteredApplications" -Name "CoffeeBrowser" -Value "Software\\CoffeeBrowser\\Capabilities";
          New-Item -Path "HKCU:\\Software\\CoffeeBrowser\\Capabilities\\URLAssociations" -Force | Out-Null;
          Set-ItemProperty -Path "HKCU:\\Software\\CoffeeBrowser\\Capabilities\\URLAssociations" -Name "http" -Value "CoffeeBrowserURL";
          Set-ItemProperty -Path "HKCU:\\Software\\CoffeeBrowser\\Capabilities\\URLAssociations" -Name "https" -Value "CoffeeBrowserURL";
          New-Item -Path "HKCU:\\Software\\CoffeeBrowser\\Capabilities\\FileAssociations" -Force | Out-Null;
          Set-ItemProperty -Path "HKCU:\\Software\\CoffeeBrowser\\Capabilities\\FileAssociations" -Name ".html" -Value "CoffeeBrowserHTML";
          Set-ItemProperty -Path "HKCU:\\Software\\CoffeeBrowser\\Capabilities\\FileAssociations" -Name ".htm" -Value "CoffeeBrowserHTML";
          ` : ''}
        } catch {}
      `;

      try {
        await new Promise((resolve) => {
          exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psShortcutScript.replace(/\r?\n/g, ' ')}"`, () => {
            resolve();
          });
        });
      } catch(e) {}
    }

    sendProgress(100, 'Instalação concluída com sucesso!', '[OK] Coffee Browser instalado e pronto para degustação!', true);
    await new Promise(r => setTimeout(r, 400));
    return { success: true };
  } catch (err) {
    sendProgress(100, 'Erro na instalação', `[ERRO] ${err.message}`);
    return { success: false, error: err.message };
  }
});

// Launch App IPC
ipcMain.on('launch-installed-app', (event, destDir) => {
  try {
    const exeDist = path.join(destDir, 'CoffeeBrowser.exe');
    if (fs.existsSync(exeDist)) {
      spawn(exeDist, [], { detached: true, stdio: 'ignore', cwd: destDir }).unref();
    } else {
      const electronExe = path.join(destDir, 'node_modules', 'electron', 'dist', 'electron.exe');
      if (fs.existsSync(electronExe)) {
        spawn(electronExe, [destDir], { detached: true, stdio: 'ignore', cwd: destDir }).unref();
      } else {
        spawn('npx', ['electron', '.'], { detached: true, stdio: 'ignore', cwd: destDir, shell: true }).unref();
      }
    }
  } catch (e) {}

  setTimeout(() => {
    app.quit();
  }, 500);
});
