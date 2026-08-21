/**
 * Coffee Browser Professional Interactive Terminal & Real CLI Engine
 * Supports real system command execution (PowerShell / Windows CMD), CWD tracking,
 * tab auto-completion, command history, and browser control integration.
 */

class CoffeeTerminalEngine {
  constructor() {
    this.history = [];
    this.historyIndex = -1;
    this.currentProcess = null;
    
    // Determine initial current working directory (CWD)
    try {
      if (typeof process !== 'undefined' && process.cwd) {
        this.cwd = process.cwd();
      } else {
        this.cwd = 'C:\\CoffeeBrowser';
      }
    } catch(e) {
      this.cwd = 'C:\\CoffeeBrowser';
    }
  }

  initDOM() {
    const input = document.getElementById('term-input');
    const container = document.getElementById('term-container');
    if (!input) return;

    this.updatePrompt();

    // Re-focus on container click unless text is being selected
    if (container) {
      container.onclick = (e) => {
        if (!window.getSelection || window.getSelection().toString().length === 0) {
          input.focus();
        }
      };
    }

    input.addEventListener('keydown', (e) => {
      // Ctrl + C to cancel running child process
      if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        if (this.currentProcess) {
          try {
            this.currentProcess.kill();
          } catch(err) {}
          this.currentProcess = null;
          this.appendOutput('^C (Comando cancelado)', 'warn');
        }
        input.value = '';
        return;
      }

      // Ctrl + L to clear screen
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        this.clearScreen();
        return;
      }

      if (e.key === 'Enter') {
        const cmd = input.value.trim();
        if (cmd) {
          this.history.push(cmd);
          this.historyIndex = this.history.length;
          input.value = '';
          this.execCommand(cmd);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          input.value = this.history[this.historyIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          input.value = this.history[this.historyIndex] || '';
        } else {
          this.historyIndex = this.history.length;
          input.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.handleTabCompletion(input);
      }
    });

    input.focus();
  }

  updatePrompt() {
    const promptSymbol = document.getElementById('term-prompt-symbol');
    if (promptSymbol) {
      promptSymbol.textContent = `${this.cwd} >`;
    }
  }

  clearScreen() {
    const log = document.getElementById('term-log');
    if (log) log.innerHTML = '';
  }

  appendOutput(content, type = 'output', isHtml = false) {
    const log = document.getElementById('term-log');
    if (!log) return;

    const div = document.createElement('div');
    div.className = `term-line ${type}`;
    if (isHtml) {
      div.innerHTML = content;
    } else {
      div.textContent = content;
    }
    log.appendChild(div);

    const container = document.getElementById('term-container');
    if (container) container.scrollTop = container.scrollHeight;
  }

  async execCommand(raw) {
    const log = document.getElementById('term-log');
    if (!log) return;

    // Echo prompt line
    const promptDiv = document.createElement('div');
    promptDiv.className = 'term-line prompt';
    promptDiv.textContent = `${this.cwd} > ${raw}`;
    log.appendChild(promptDiv);

    const trimmed = raw.trim();
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // 1. Built-in Coffee Browser CLI Commands
    if (cmd === 'clear' || cmd === 'cls') {
      this.clearScreen();
      return;
    }

    if (cmd === 'help' || cmd === '?') {
      const helpHtml = `
        <div class="term-line header">COFFEE BROWSER TERMINAL CLI & SHELL REAL DO SISTEMA:</div>
        <div class="term-line output" style="color:var(--amber); margin-bottom:6px;">  Comandos do Navegador:</div>
        <div class="term-line output">  <strong>search &lt;termo&gt;</strong>        Executa pesquisa na web</div>
        <div class="term-line output">  <strong>open &lt;url&gt;</strong>            Abre uma URL na aba ativa</div>
        <div class="term-line output">  <strong>newtab [url]</strong>          Abre uma nova aba no navegador</div>
        <div class="term-line output">  <strong>settings [seção]</strong>      Abre as configurações (shields, appearance, etc.)</div>
        <div class="term-line output">  <strong>roast &lt;torra&gt;</strong>          Altera tema (claro, medio, escuro, oculto)</div>
        <div class="term-line output">  <strong>shields</strong>                Exibe telemetria do bloqueador Coador</div>
        <div class="term-line output">  <strong>vitals</strong>                 Métricas de renderização, ping e RAM</div>
        <div class="term-line output">  <strong>clear / cls</strong>            Limpa a tela do terminal</div>
        <div class="term-line output">  <strong>exit</strong>                   Retorna à nova aba</div>
        <div class="term-line output" style="color:var(--green); margin-top:10px; margin-bottom:4px;">  Comandos Reais do Sistema (PowerShell / Windows CMD):</div>
        <div class="term-line output">  <strong>cd &lt;diretório&gt;</strong>          Navega entre pastas no computador</div>
        <div class="term-line output">  <strong>dir / ls</strong>               Lista arquivos e diretórios na pasta</div>
        <div class="term-line output">  <strong>ping &lt;host&gt;</strong>             Testa conexão e tempo de resposta</div>
        <div class="term-line output">  <strong>ipconfig / ifconfig</strong>    Exibe adaptadores de rede e IP</div>
        <div class="term-line output">  <strong>git / node / npm / python</strong> Executa programas e scripts do sistema</div>
        <div class="term-line output">  <strong>curl / wget / echo / mkdir / cat ...</strong> Todos os comandos do shell funcionam normalmente</div>
        <div class="term-line muted" style="margin-top:6px;">  * Pressione Ctrl+C para interromper um comando em execução ou Ctrl+L para limpar.</div>
      `;
      this.appendOutput(helpHtml, 'output', true);
      return;
    }

    if (cmd === 'exit') {
      window.CoffeeTabs.navigateActiveTab('cafe://newtab');
      return;
    }

    if (cmd === 'roast' || cmd === 'theme') {
      if (['claro', 'medio', 'escuro', 'oculto'].includes(args[0])) {
        window.BrowserState.setRoast(args[0]);
        this.appendOutput(`Tema de torra alterado para [${args[0]}].`, 'success');
      } else {
        this.appendOutput('Uso: roast <claro | medio | escuro | oculto>', 'warn');
      }
      return;
    }

    if (cmd === 'shields') {
      const s = window.BrowserState.shieldsStats || {};
      const statsHtml = `
        <div class="term-line header">TELEMETRIA DOS ESCUDOS (COADOR):</div>
        <div class="term-line success">  Rastreadores bloqueados: ${s.trackersBlocked || 0}</div>
        <div class="term-line success">  Banda economizada:       ${(s.bandwidthSavedMB || 0).toFixed(1)} MB</div>
        <div class="term-line success">  Tempo economizado:       ${(s.timeSavedMinutes || 0).toFixed(1)} min</div>
      `;
      this.appendOutput(statsHtml, 'output', true);
      return;
    }

    if (cmd === 'vitals') {
      const memElem = document.getElementById('status-memory-value');
      const latElem = document.getElementById('status-latency-value');
      const vitalsHtml = `
        <div class="term-line header">MÉTRICAS WEB & SISTEMA:</div>
        <div class="term-line success">  Status de Rede: [ONLINE]</div>
        <div class="term-line success">  Latência Real:  ${latElem ? latElem.textContent : '12ms'}</div>
        <div class="term-line success">  RAM Consumida:  ${memElem ? memElem.textContent : '120 MB'}</div>
        <div class="term-line success">  Motor:          Chromium + Electron Multi-Process</div>
      `;
      this.appendOutput(vitalsHtml, 'output', true);
      return;
    }

    if (cmd === 'search') {
      if (args.length > 0) {
        window.CoffeeTabs.navigateActiveTab(args.join(' '));
      } else {
        this.appendOutput('Uso: search <termo de pesquisa>', 'warn');
      }
      return;
    }

    if (cmd === 'open' || cmd === 'goto') {
      if (args[0]) {
        window.CoffeeTabs.navigateActiveTab(args[0]);
      } else {
        this.appendOutput('Uso: open <url>', 'warn');
      }
      return;
    }

    if (cmd === 'newtab') {
      window.CoffeeTabs.createTab(args[0] || 'cafe://newtab');
      return;
    }

    if (cmd === 'settings') {
      window.CoffeeTabs.openSettings(args[0] || '');
      return;
    }

    // 2. Handle 'cd' directory change command internally
    if (cmd === 'cd') {
      this.handleCdCommand(args.join(' '));
      return;
    }

    // 3. Execute Real System Command via child_process
    this.executeRealSystemCommand(trimmed);
  }

  handleCdCommand(targetDir) {
    if (!targetDir || targetDir.trim() === '') {
      this.appendOutput(this.cwd, 'output');
      return;
    }

    try {
      if (typeof require !== 'undefined') {
        const path = require('path');
        const fs = require('fs');
        const os = require('os');

        let resolved = targetDir.trim().replace(/^["']|["']$/g, '');
        if (resolved === '~') {
          resolved = os.homedir();
        } else if (resolved.startsWith('~/') || resolved.startsWith('~\\')) {
          resolved = path.join(os.homedir(), resolved.slice(2));
        } else {
          resolved = path.resolve(this.cwd, resolved);
        }

        if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
          this.cwd = resolved;
          this.updatePrompt();
        } else {
          this.appendOutput(`O sistema não pode encontrar o caminho especificado: "${targetDir}"`, 'error');
        }
      } else {
        this.appendOutput('Ambiente sem suporte a manipulação de sistema de arquivos.', 'warn');
      }
    } catch(err) {
      this.appendOutput(`Erro ao acessar diretório: ${err.message}`, 'error');
    }
  }

  executeRealSystemCommand(commandStr) {
    try {
      if (typeof require !== 'undefined') {
        const { exec } = require('child_process');

        // Execution in progress placeholder
        const runningIndicator = document.createElement('div');
        runningIndicator.className = 'term-line muted';
        runningIndicator.textContent = '... executando comando ...';
        const log = document.getElementById('term-log');
        if (log) log.appendChild(runningIndicator);

        const isWin = process.platform === 'win32';
        const options = {
          cwd: this.cwd,
          maxBuffer: 1024 * 1024 * 32,
          shell: isWin ? 'powershell.exe' : '/bin/bash',
          windowsHide: true,
          env: Object.assign({}, process.env)
        };

        const proc = exec(commandStr, options, (error, stdout, stderr) => {
          if (runningIndicator && runningIndicator.parentNode) {
            runningIndicator.parentNode.removeChild(runningIndicator);
          }
          this.currentProcess = null;

          if (stdout) {
            this.appendFormattedTerminalOutput(stdout, 'output');
          }
          if (stderr) {
            this.appendFormattedTerminalOutput(stderr, 'error');
          }
          if (error && !stderr && !stdout) {
            this.appendOutput(`Processo finalizou com erro (código ${error.code || 1}): ${error.message}`, 'error');
          }
        });

        this.currentProcess = proc;
      } else {
        this.appendOutput('Execução nativa não disponível no modo de visualização web.', 'warn');
      }
    } catch (err) {
      this.appendOutput(`Falha ao executar comando: ${err.message}`, 'error');
    }
  }

  appendFormattedTerminalOutput(text, type) {
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (line.trim() !== '' || lines.length === 1) {
        this.appendOutput(line, type);
      }
    }
  }

  handleTabCompletion(input) {
    try {
      if (typeof require !== 'undefined') {
        const fs = require('fs');
        const path = require('path');
        const currentText = input.value;
        const parts = currentText.split(/\s+/);
        const lastPart = parts[parts.length - 1] || '';

        const files = fs.readdirSync(this.cwd);
        const matches = files.filter(f => f.toLowerCase().startsWith(lastPart.toLowerCase()));

        if (matches.length === 1) {
          parts[parts.length - 1] = matches[0];
          input.value = parts.join(' ');
        } else if (matches.length > 1) {
          this.appendOutput(`Sugestões: ${matches.join('   ')}`, 'muted');
        }
      }
    } catch(e) {}
  }
}

window.CoffeeTerminal = new CoffeeTerminalEngine();
