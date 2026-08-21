/**
 * Coffee Browser — Integrated Download Manager Controller
 * Manages active/recent downloads, speed calculation, popover panel UI,
 * file deletion status tracking (red text + line-through), and IPC commands.
 */

let ipcRenderer = null;
try {
  if (typeof require !== 'undefined') {
    const electron = require('electron');
    ipcRenderer = electron.ipcRenderer;
  }
} catch(e) {}

class CoffeeDownloadManager {
  constructor() {
    this.downloads = [];
    this.isPopoverOpen = false;
    this.pollTimer = null;
  }

  init() {
    this.initListeners();
    this.refreshDownloads();
  }

  initListeners() {
    if (ipcRenderer) {
      ipcRenderer.on('download-progress-update', (event, data) => {
        this.onDownloadProgress(data);
      });

      ipcRenderer.on('download-completed', (event, data) => {
        this.onDownloadCompleted(data);
      });
    }

    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
      const popover = document.getElementById('downloads-popover');
      const btn = document.getElementById('downloads-btn');
      if (popover && this.isPopoverOpen) {
        if (!popover.contains(e.target) && !btn.contains(e.target)) {
          this.closePopover();
        }
      }
    });
  }

  togglePopover() {
    if (this.isPopoverOpen) {
      this.closePopover();
    } else {
      this.openPopover();
    }
  }

  async openPopover() {
    const popover = document.getElementById('downloads-popover');
    if (!popover) return;
    this.isPopoverOpen = true;
    popover.style.display = 'flex';
    await this.refreshDownloads();
  }

  closePopover() {
    const popover = document.getElementById('downloads-popover');
    if (popover) popover.style.display = 'none';
    this.isPopoverOpen = false;
  }

  async refreshDownloads() {
    if (ipcRenderer && typeof ipcRenderer.invoke === 'function') {
      try {
        this.downloads = await ipcRenderer.invoke('get-downloads-list');
      } catch(e) {
        this.downloads = [];
      }
    }
    this.updateUI();
  }

  onDownloadProgress(data) {
    if (!data || !data.id) return;
    const idx = this.downloads.findIndex(d => d.id === data.id);
    if (idx !== -1) {
      this.downloads[idx] = Object.assign({}, this.downloads[idx], data);
    } else {
      this.downloads.unshift(data);
    }
    this.updateUI();
  }

  onDownloadCompleted(data) {
    if (!data || !data.id) return;
    const idx = this.downloads.findIndex(d => d.id === data.id);
    if (idx !== -1) {
      this.downloads[idx] = Object.assign({}, this.downloads[idx], data);
    } else {
      this.downloads.unshift(data);
    }
    this.updateUI();
  }

  updateUI() {
    this.updateBadge();
    this.renderPopoverList();
    
    // Update settings downloads view if open
    if (window.CoffeePagesRenderer && typeof window.CoffeePagesRenderer.updateDownloadsSettingsView === 'function') {
      window.CoffeePagesRenderer.updateDownloadsSettingsView(this.downloads);
    }
  }

  updateBadge() {
    const badge = document.getElementById('downloads-badge');
    if (!badge) return;
    const activeCount = this.downloads.filter(d => d.state === 'progressing').length;
    if (activeCount > 0) {
      badge.textContent = activeCount;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  renderPopoverList() {
    const container = document.getElementById('downloads-popover-list');
    if (!container) return;

    if (!this.downloads || this.downloads.length === 0) {
      container.innerHTML = `
        <div style="padding:24px; text-align:center; color:var(--mut); font-size:12px;">
          Nenhum download recente.
        </div>
      `;
      return;
    }

    // Display top 6 most recent
    const itemsHtml = this.downloads.slice(0, 6).map(item => this.renderItemHtml(item, true)).join('');
    container.innerHTML = itemsHtml;
  }

  renderItemHtml(item, compact = false) {
    const isProgressing = item.state === 'progressing';
    const isPaused = item.state === 'paused' || item.isPaused;
    const isCompleted = item.state === 'completed';
    const isDeleted = item.fileDeleted === true && isCompleted;
    const isCancelled = item.state === 'cancelled';
    const isInterrupted = item.state === 'interrupted';

    const percent = item.totalBytes > 0 ? Math.min(100, Math.round((item.receivedBytes / item.totalBytes) * 100)) : 0;
    const sizeText = `${this.formatBytes(item.receivedBytes)} / ${this.formatBytes(item.totalBytes)}`;
    const speedText = item.speed > 0 ? `⚡ ${this.formatSpeed(item.speed)}` : '';

    // File title class (red strike-through if deleted from PC)
    let titleStyle = "font-weight:600; font-size:12.5px; word-break:break-all;";
    if (isDeleted) {
      titleStyle += " color: var(--red) !important; text-decoration: line-through !important;";
    } else {
      titleStyle += " color: var(--crema);";
    }

    let statusText = '';
    let statusClass = 'muted';

    if (isProgressing) {
      statusText = isPaused ? 'Pausado' : `Baixando (${percent}%) ${speedText}`;
      statusClass = 'warn';
    } else if (isCompleted) {
      if (isDeleted) {
        statusText = '⚠️ Arquivo Excluído do PC';
        statusClass = 'error';
      } else {
        statusText = `✔ Concluído (${this.formatBytes(item.totalBytes)})`;
        statusClass = 'success';
      }
    } else if (isCancelled) {
      statusText = 'Cancelado';
      statusClass = 'error';
    } else if (isInterrupted) {
      statusText = 'Interrompido';
      statusClass = 'warn';
    }

    return `
      <div class="download-card-item ${isDeleted ? 'deleted' : ''}">
        <div class="dl-icon-col">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isDeleted ? 'var(--red)' : 'var(--caramel)'}" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            ${isDeleted ? '<line x1="4" y1="4" x2="20" y2="20" stroke="var(--red)" stroke-width="2"/>' : ''}
          </svg>
        </div>
        <div class="dl-info-col">
          <div style="${titleStyle}">${this.escapeHtml(item.filename || 'Arquivo')}</div>
          <div class="dl-status-line ${statusClass}">${statusText}</div>
          ${isProgressing ? `
            <div class="dl-progress-bg">
              <div class="dl-progress-fill" style="width:${percent}%"></div>
            </div>
            <div style="font-size:10px; color:var(--mut); margin-top:2px;">${sizeText}</div>
          ` : ''}
        </div>
        <div class="dl-actions-col">
          ${isProgressing ? (
            isPaused ? `
              <button class="dl-btn" onclick="window.CoffeeDownloads.resume('${item.id}')" title="Retomar">▶</button>
              <button class="dl-btn cancel" onclick="window.CoffeeDownloads.cancel('${item.id}')" title="Cancelar">✕</button>
            ` : `
              <button class="dl-btn" onclick="window.CoffeeDownloads.pause('${item.id}')" title="Pausar">⏸</button>
              <button class="dl-btn cancel" onclick="window.CoffeeDownloads.cancel('${item.id}')" title="Cancelar">✕</button>
            `
          ) : ''}
          
          ${isCompleted && !isDeleted ? `
            <button class="dl-btn" onclick="window.CoffeeDownloads.openFile('${item.savePath.replace(/\\/g, '\\\\')}')" title="Abrir Arquivo">🚀</button>
            <button class="dl-btn" onclick="window.CoffeeDownloads.openFolder('${item.savePath.replace(/\\/g, '\\\\')}')" title="Mostrar na Pasta">📁</button>
          ` : ''}

          ${(isDeleted || isCancelled || isInterrupted) ? `
            <button class="dl-btn retry" onclick="window.CoffeeDownloads.retry('${item.url.replace(/'/g, "\\'")}')" title="Repetir / Baixar Novamente">🔄</button>
          ` : ''}
        </div>
      </div>
    `;
  }

  async pause(id) {
    if (ipcRenderer) await ipcRenderer.invoke('pause-download', id);
    this.refreshDownloads();
  }

  async resume(id) {
    if (ipcRenderer) await ipcRenderer.invoke('resume-download', id);
    this.refreshDownloads();
  }

  async cancel(id) {
    if (ipcRenderer) await ipcRenderer.invoke('cancel-download', id);
    this.refreshDownloads();
  }

  async retry(url) {
    if (ipcRenderer) await ipcRenderer.invoke('retry-download', url);
    this.refreshDownloads();
  }

  async openFile(savePath) {
    if (ipcRenderer) await ipcRenderer.invoke('open-download-file', savePath);
  }

  async openFolder(savePath) {
    if (ipcRenderer) await ipcRenderer.invoke('open-download-folder', savePath);
  }

  formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatSpeed(bytesPerSec) {
    if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s';
    if (bytesPerSec >= 1024 * 1024) {
      return (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s';
    }
    return (bytesPerSec / 1024).toFixed(0) + ' KB/s';
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.CoffeeDownloads = new CoffeeDownloadManager();
  window.CoffeeDownloads.init();
});
