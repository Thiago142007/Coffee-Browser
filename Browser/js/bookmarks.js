/**
 * Coffee Browser Bookmarks Manager
 * Interactive dynamic bookmarks bar with modal editing, context menu,
 * disintegrate/collapse close animation, and drag & drop reordering.
 */

class CoffeeBookmarksManager {
  constructor() {
    this.container = document.getElementById('bookmarks-bar');
    this.modalOverlay = document.getElementById('bookmark-modal-overlay');
    this.modalTitleInput = document.getElementById('bookmark-modal-title');
    this.modalUrlInput = document.getElementById('bookmark-modal-url');
    this.modalHeaderTitle = document.getElementById('bookmark-modal-header-title');
    this.modalSaveBtn = document.getElementById('bookmark-modal-save-btn');
    this.modalCancelBtn = document.getElementById('bookmark-modal-cancel-btn');
    this.contextMenu = document.getElementById('bookmark-context-menu');

    this.editingBookmarkId = null;
    this.draggedIndex = null;

    this.init();
  }

  init() {
    this.renderBookmarks();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Star icon in Omnibox
    const starBtn = document.getElementById('bookmark-page-btn');
    if (starBtn) {
      starBtn.addEventListener('click', () => {
        this.openAddBookmarkModal();
      });
    }

    // Modal cancel button
    if (this.modalCancelBtn) {
      this.modalCancelBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    // Close modal on overlay click
    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) {
          this.closeModal();
        }
      });
    }

    // Modal submit/save button
    if (this.modalSaveBtn) {
      this.modalSaveBtn.addEventListener('click', () => {
        this.saveBookmarkFromModal();
      });
    }

    // Close context menu on document click
    document.addEventListener('click', (e) => {
      if (this.contextMenu && !this.contextMenu.contains(e.target)) {
        this.hideContextMenu();
      }
    });

    // Close context menu on scroll or resize
    window.addEventListener('resize', () => this.hideContextMenu());

    // Listen to tab changes to show bookmarks bar ONLY on newtab page
    if (window.BrowserState) {
      window.BrowserState.on('tabChanged', (tab) => this.updateVisibility(tab ? tab.url : ''));
      window.BrowserState.on('tabNavigated', (tab) => this.updateVisibility(tab ? tab.url : ''));
      const activeTab = window.BrowserState.getActiveTab();
      this.updateVisibility(activeTab ? activeTab.url : '');
    }
  }

  updateVisibility(url) {
    if (!this.container) return;
    const targetUrl = (url || '').trim().toLowerCase();
    const isNewTab = !targetUrl || targetUrl.startsWith('cafe://newtab') || targetUrl.startsWith('cafe://nova-aba') || targetUrl === 'about:blank';
    this.container.style.display = isNewTab ? 'flex' : 'none';
  }

  setupBookmarkDrag(item, bookmarkId) {
    item.onpointerdown = (e) => {
      if (e.button !== 0) return;
      this.draggedBookmarkId = bookmarkId;
      this.dragStartX = e.clientX;
      this.isLiveDraggingBm = false;
    };

    item.onpointermove = (e) => {
      if (!this.draggedBookmarkId || this.draggedBookmarkId !== bookmarkId) return;

      const dist = Math.abs(e.clientX - this.dragStartX);
      if (!this.isLiveDraggingBm && dist > 5) {
        this.isLiveDraggingBm = true;
        item.classList.add('is-live-dragging');
        try { item.setPointerCapture(e.pointerId); } catch(err) {}
      }

      if (this.isLiveDraggingBm) {
        const bookmarks = window.BrowserState.bookmarks;
        const currentIndex = bookmarks.findIndex(b => b.id === bookmarkId);
        if (currentIndex === -1) return;

        const allBmEls = Array.from(this.container.querySelectorAll('.bookmark-item'));
        for (let i = 0; i < allBmEls.length; i++) {
          const siblingEl = allBmEls[i];
          const sibId = siblingEl.getAttribute('data-id');
          if (!sibId || sibId === bookmarkId) continue;

          const rect = siblingEl.getBoundingClientRect();
          const midX = rect.left + rect.width / 2;

          const sibIndex = bookmarks.findIndex(b => b.id === sibId);
          if (sibIndex === -1) continue;

          if ((currentIndex < sibIndex && e.clientX > midX) || (currentIndex > sibIndex && e.clientX < midX)) {
            const [movedBm] = bookmarks.splice(currentIndex, 1);
            bookmarks.splice(sibIndex, 0, movedBm);
            window.BrowserState.saveState();
            this.renderBookmarks();

            const newEl = this.container.querySelector(`[data-id="${bookmarkId}"]`);
            if (newEl) {
              newEl.classList.add('is-live-dragging');
              try { newEl.setPointerCapture(e.pointerId); } catch(err) {}
            }
            break;
          }
        }
      }
    };

    const endBmDrag = (e) => {
      if (this.draggedBookmarkId === bookmarkId) {
        if (this.isLiveDraggingBm) {
          try { item.releasePointerCapture(e.pointerId); } catch(err) {}
        } else {
          const b = window.BrowserState.bookmarks.find(x => x.id === bookmarkId);
          if (b && !item.classList.contains('is-closing')) {
            window.CoffeeTabs.navigateActiveTab(b.url);
          }
        }
        item.classList.remove('is-live-dragging');
        this.draggedBookmarkId = null;
        this.isLiveDraggingBm = false;
      }
    };

    item.onpointerup = endBmDrag;
    item.onpointercancel = endBmDrag;
  }

  renderBookmarks() {
    if (!this.container) return;
    const bookmarks = window.BrowserState.bookmarks || [];

    this.container.innerHTML = bookmarks.map((b, index) => {
      const faviconHtml = this.getFaviconHtml(b);
      return `
        <div class="bookmark-item"
             data-id="${b.id}"
             data-index="${index}"
             title="${b.url}">
          <span class="fav">${faviconHtml}</span>
          <span class="bookmark-title-text">${b.title}</span>
        </div>
      `;
    }).join('');

    // Attach event handlers to bookmark items
    const items = this.container.querySelectorAll('.bookmark-item');
    items.forEach((item) => {
      const id = item.getAttribute('data-id');
      const index = parseInt(item.getAttribute('data-index'), 10);
      const bookmark = bookmarks[index];

      if (bookmark) {
        this.setupBookmarkDrag(item, bookmark.id);
      }

      // Right click for Context Menu
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (bookmark) {
          this.showContextMenu(e.clientX, e.clientY, bookmark);
        }
      });
    });
  }

  reorderBookmarks(fromIndex, toIndex) {
    const bookmarks = window.BrowserState.bookmarks;
    if (fromIndex < 0 || fromIndex >= bookmarks.length || toIndex < 0 || toIndex >= bookmarks.length) return;

    const [movedItem] = bookmarks.splice(fromIndex, 1);
    bookmarks.splice(toIndex, 0, movedItem);

    window.BrowserState.saveState();
    this.renderBookmarks();
  }

  clearDragOverStyles() {
    if (!this.container) return;
    this.container.querySelectorAll('.bookmark-item').forEach(el => {
      el.classList.remove('drag-over');
      el.classList.remove('is-dragging');
    });
  }

  getFaviconHtml(b) {
    if (b.iconType === 'shield') {
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    }
    if (b.iconType === 'settings') {
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
    }
    if (b.iconType === 'terminal' || b.iconType === 'zap') {
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`;
    }

    const faviconUrl = window.CoffeeTabs ? window.CoffeeTabs.getFaviconUrl(b.url) : null;
    if (faviconUrl) {
      return `<img src="${faviconUrl}" style="width:14px; height:14px; border-radius:2px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" /><span style="display:none;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg></span>`;
    }

    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
  }

  openAddBookmarkModal() {
    const activeTab = window.BrowserState.getActiveTab();
    if (!activeTab) return;

    const t = (k, fb) => window.CoffeeI18n ? window.CoffeeI18n.t(k, fb) : fb;
    const currentUrl = activeTab.url || 'cafe://newtab';
    const existing = window.BrowserState.bookmarks.find(b => b.url === currentUrl);

    this.editingBookmarkId = existing ? existing.id : null;

    if (this.modalHeaderTitle) {
      this.modalHeaderTitle.textContent = existing ? t('bookmarks_edit_title', 'Editar Favorito') : t('bookmarks_add_title', 'Adicionar aos Favoritos');
    }
    if (this.modalTitleInput) {
      this.modalTitleInput.value = existing ? existing.title : (activeTab.title || t('new_tab', 'Nova Aba'));
      this.modalTitleInput.placeholder = t('bookmarks_name_placeholder', 'Nome do favorito...');
    }
    if (this.modalUrlInput) {
      this.modalUrlInput.value = currentUrl;
    }
    if (this.modalSaveBtn) {
      this.modalSaveBtn.textContent = existing ? t('bookmarks_edit_save_btn', 'Salvar') : t('bookmarks_save_btn', 'Adicionar');
    }
    if (this.modalCancelBtn) {
      this.modalCancelBtn.textContent = t('bookmarks_cancel_btn', 'Cancelar');
    }

    if (this.modalOverlay) {
      this.modalOverlay.style.display = 'flex';
      setTimeout(() => this.modalTitleInput && this.modalTitleInput.focus(), 50);
    }
  }

  openEditBookmarkModal(bookmark) {
    if (!bookmark) return;
    const t = (k, fb) => window.CoffeeI18n ? window.CoffeeI18n.t(k, fb) : fb;
    this.editingBookmarkId = bookmark.id;

    if (this.modalHeaderTitle) {
      this.modalHeaderTitle.textContent = t('bookmarks_edit_title', 'Editar Favorito');
    }
    if (this.modalTitleInput) {
      this.modalTitleInput.value = bookmark.title;
      this.modalTitleInput.placeholder = t('bookmarks_name_placeholder', 'Nome do favorito...');
    }
    if (this.modalUrlInput) {
      this.modalUrlInput.value = bookmark.url;
    }
    if (this.modalSaveBtn) {
      this.modalSaveBtn.textContent = t('bookmarks_edit_save_btn', 'Salvar');
    }
    if (this.modalCancelBtn) {
      this.modalCancelBtn.textContent = t('bookmarks_cancel_btn', 'Cancelar');
    }

    if (this.modalOverlay) {
      this.modalOverlay.style.display = 'flex';
      setTimeout(() => this.modalTitleInput && this.modalTitleInput.focus(), 50);
    }
  }

  closeModal() {
    if (this.modalOverlay) {
      this.modalOverlay.style.display = 'none';
    }
    this.editingBookmarkId = null;
  }

  saveBookmarkFromModal() {
    const title = this.modalTitleInput ? this.modalTitleInput.value.trim() : '';
    const url = this.modalUrlInput ? this.modalUrlInput.value.trim() : '';

    if (!title || !url) {
      if (window.showToastNotification) window.showToastNotification('Por favor, informe o título e a URL.');
      return;
    }

    const bookmarks = window.BrowserState.bookmarks;

    if (this.editingBookmarkId) {
      // Edit existing
      const existing = bookmarks.find(b => b.id === this.editingBookmarkId);
      if (existing) {
        existing.title = title;
        existing.url = url;
      }
    } else {
      // Add new
      const newBookmark = {
        id: 'b-' + Date.now(),
        title: title,
        url: url,
        iconType: 'globe'
      };
      bookmarks.push(newBookmark);
    }

    window.BrowserState.saveState();
    this.renderBookmarks();
    this.closeModal();
  }

  showContextMenu(x, y, bookmark) {
    if (!this.contextMenu) return;
    const t = (k, fb) => window.CoffeeI18n ? window.CoffeeI18n.t(k, fb) : fb;

    // Boundary check so context menu stays within viewport
    const menuWidth = 140;
    const menuHeight = 80;
    const clickX = Math.min(x, window.innerWidth - menuWidth - 10);
    const clickY = Math.min(y, window.innerHeight - menuHeight - 10);

    this.contextMenu.style.left = `${clickX}px`;
    this.contextMenu.style.top = `${clickY}px`;
    this.contextMenu.style.display = 'block';

    this.contextMenu.innerHTML = `
      <div class="context-menu-item" id="ctx-edit-bm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        <span>${t('bookmarks_edit_title', 'Editar')}</span>
      </div>
      <div class="context-menu-item danger" id="ctx-delete-bm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        <span>${t('bookmarks_delete_btn', 'Remover')}</span>
      </div>
    `;
      </div>
    `;

    const editBtn = this.contextMenu.querySelector('#ctx-edit-bm');
    if (editBtn) {
      editBtn.onclick = () => {
        this.hideContextMenu();
        this.openEditBookmarkModal(bookmark);
      };
    }

    const deleteBtn = this.contextMenu.querySelector('#ctx-delete-bm');
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        this.hideContextMenu();
        this.removeBookmarkAnimated(bookmark.id);
      };
    }
  }

  hideContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.style.display = 'none';
    }
  }

  removeBookmarkAnimated(bookmarkId) {
    if (!this.container) return;
    const itemEl = this.container.querySelector(`[data-id="${bookmarkId}"]`);

    if (itemEl && !itemEl.classList.contains('is-closing')) {
      itemEl.classList.add('is-closing');
      setTimeout(() => {
        this._executeRemoveBookmark(bookmarkId);
      }, 180);
    } else {
      this._executeRemoveBookmark(bookmarkId);
    }
  }

  _executeRemoveBookmark(bookmarkId) {
    const bookmarks = window.BrowserState.bookmarks;
    const index = bookmarks.findIndex(b => b.id === bookmarkId);
    if (index !== -1) {
      bookmarks.splice(index, 1);
      window.BrowserState.saveState();
      this.renderBookmarks();
      if (window.showToastNotification) window.showToastNotification('Favorito removido com sucesso.');
    }
  }
}
