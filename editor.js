/* ============================================================
   頁面錬成モード ─ ノーコード編集エンジン
   - .e   : クリックで直接テキスト編集（contenteditable）
   - .e-img : クリックで画像差し替え（ローカルファイル → dataURL）
   - 選択中テキストにフローティングツールバー（太字/色/サイズ）
   - アクセント色・書体の変更
   - Undo / Redo
   - localStorage 自動保存・復元
   - 編集後のページを単一HTMLとして書き出し
   ============================================================ */
(function () {
  const STORAGE_KEY = 'ryo5-edits';
  const editFab = document.getElementById('edit-fab');
  const toolbar = document.getElementById('text-toolbar');
  const imgPicker = document.getElementById('img-picker');

  // 編集対象に安定IDを付与（DOM順）
  const editables = [...document.querySelectorAll('.e')];
  const editImages = [...document.querySelectorAll('.e-img')];
  editables.forEach((el, i) => el.dataset.eid = 't' + i);
  editImages.forEach((el, i) => el.dataset.eid = 'i' + i);

  // ============ 状態管理（Undo/Redo） ============
  let undoStack = [];
  let redoStack = [];
  const MAX_HISTORY = 60;

  function snapshot() {
    const state = { texts: {}, images: {}, accent: getAccent(), font: document.body.dataset.font || '' };
    editables.forEach(el => state.texts[el.dataset.eid] = el.innerHTML);
    editImages.forEach(el => state.images[el.dataset.eid] = el.src);
    return JSON.stringify(state);
  }

  function applyState(json) {
    const state = JSON.parse(json);
    editables.forEach(el => {
      if (state.texts[el.dataset.eid] !== undefined) el.innerHTML = state.texts[el.dataset.eid];
    });
    editImages.forEach(el => {
      if (state.images[el.dataset.eid] !== undefined) el.src = state.images[el.dataset.eid];
    });
    if (state.accent) setAccent(state.accent, false);
    setFont(state.font || '', false);
  }

  function pushHistory() {
    undoStack.push(snapshot());
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = [];
    updateHistoryButtons();
    save();
  }

  function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(snapshot());
    applyState(undoStack.pop());
    updateHistoryButtons();
    save();
    toast('時を巻き戻した。');
  }

  function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(snapshot());
    applyState(redoStack.pop());
    updateHistoryButtons();
    save();
    toast('運命を再演した。');
  }

  function updateHistoryButtons() {
    document.getElementById('edit-undo').disabled = undoStack.length === 0;
    document.getElementById('edit-redo').disabled = redoStack.length === 0;
  }

  // ============ 永続化 ============
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, snapshot());
    } catch (e) {
      toast('保存容量の限界だ……画像が重すぎるのかもしれん。');
    }
  }

  function restore() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      applyState(saved);
    } catch (e) { /* 壊れたデータは無視 */ }
  }

  // ============ アクセント色 / 書体 ============
  const accentInput = document.getElementById('edit-accent');

  function getAccent() {
    return accentInput.value;
  }
  function setAccent(hex, record = true) {
    document.documentElement.style.setProperty('--primary', hex);
    accentInput.value = hex;
    if (record) pushHistory();
  }
  accentInput.addEventListener('input', () => {
    document.documentElement.style.setProperty('--primary', accentInput.value);
  });
  accentInput.addEventListener('change', () => pushHistory());

  const fontSelect = document.getElementById('edit-font');
  function setFont(key, record = true) {
    document.body.classList.remove('font-zen', 'font-serif', 'font-mono');
    if (key) document.body.classList.add('font-' + key);
    document.body.dataset.font = key;
    fontSelect.value = key;
    if (record) pushHistory();
  }
  fontSelect.addEventListener('change', () => setFont(fontSelect.value));

  // ============ 編集モード切替 ============
  let editMode = false;

  editFab.addEventListener('click', () => {
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);
    editables.forEach(el => {
      el.contentEditable = editMode ? 'true' : 'false';
      el.spellcheck = false;
    });
    if (editMode) {
      toast('頁面錬成モード起動 ── この世界はもう、君のものだ。');
      pushHistoryBaseline();
    } else {
      hideToolbar();
      save();
      toast('錬成完了。変化は刻まれた。');
    }
  });

  // 編集モード開始時の基準点（最初のUndo先）
  let baselineTaken = false;
  function pushHistoryBaseline() {
    if (!baselineTaken) {
      undoStack.push(snapshot());
      updateHistoryButtons();
      baselineTaken = true;
    }
  }

  // ============ テキスト編集イベント ============
  let inputDebounce = null;
  editables.forEach(el => {
    // 編集開始時にスナップショット
    el.addEventListener('focus', () => {
      if (!editMode) return;
      el._beforeEdit = el.innerHTML;
    });
    el.addEventListener('blur', () => {
      if (!editMode) return;
      if (el._beforeEdit !== el.innerHTML) pushHistory();
    });
    el.addEventListener('input', () => {
      if (!editMode) return;
      clearTimeout(inputDebounce);
      inputDebounce = setTimeout(save, 800);
    });
    // 編集モード中はリンク遷移などを抑制
    el.addEventListener('click', (e) => {
      if (editMode) { e.preventDefault(); e.stopPropagation(); }
    });
  });

  // Enterで改行（divではなくbr）
  document.addEventListener('keydown', (e) => {
    if (!editMode) return;
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('e')) {
      e.preventDefault();
      document.execCommand('insertLineBreak');
    }
    // ショートカット
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); }
  });

  // ============ フローティングツールバー ============
  function showToolbar() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { hideToolbar(); return; }
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const host = container.nodeType === 3 ? container.parentElement : container;
    if (!host || !host.closest('.e')) { hideToolbar(); return; }

    const rect = range.getBoundingClientRect();
    toolbar.classList.add('visible');
    const tw = toolbar.offsetWidth;
    let left = rect.left + rect.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, innerWidth - tw - 8));
    let top = rect.top - toolbar.offsetHeight - 10;
    if (top < 8) top = rect.bottom + 10;
    toolbar.style.left = left + 'px';
    toolbar.style.top = top + 'px';
  }

  function hideToolbar() {
    toolbar.classList.remove('visible');
  }

  document.addEventListener('selectionchange', () => {
    if (!editMode) return;
    clearTimeout(toolbar._t);
    toolbar._t = setTimeout(showToolbar, 120);
  });
  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#text-toolbar') && !e.target.closest('.e')) hideToolbar();
  });

  // ツールバー操作（mousedownでpreventDefaultし選択を維持）
  toolbar.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', () => {
      const { cmd, color, size } = btn.dataset;
      if (cmd) {
        document.execCommand(cmd);
      } else if (color !== undefined) {
        if (color === '') {
          document.execCommand('removeFormat');
        } else {
          document.execCommand('foreColor', false, color);
        }
      } else if (size) {
        resizeSelection(size === 'up' ? 1.18 : 0.85);
      }
      pushHistory();
    });
  });

  function resizeSelection(factor) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    const host = range.commonAncestorContainer.nodeType === 3
      ? range.commonAncestorContainer.parentElement
      : range.commonAncestorContainer;
    const base = parseFloat(getComputedStyle(host).fontSize) || 16;
    span.style.fontSize = (base * factor).toFixed(1) + 'px';
    try {
      range.surroundContents(span);
    } catch (e) {
      // 複数要素にまたがる選択はexecCommandにフォールバック
      document.execCommand('fontSize', false, factor > 1 ? '5' : '2');
    }
  }

  // ============ 画像差し替え ============
  let pendingImg = null;

  editImages.forEach(img => {
    img.addEventListener('click', (e) => {
      if (!editMode) return;
      e.preventDefault(); e.stopPropagation();
      pendingImg = img;
      imgPicker.click();
    });
  });

  imgPicker.addEventListener('change', () => {
    const file = imgPicker.files[0];
    imgPicker.value = '';
    if (!file || !pendingImg) return;
    const reader = new FileReader();
    reader.onload = () => {
      // localStorage節約のため縮小してJPEG化
      const tmp = new Image();
      tmp.onload = () => {
        const MAX = 1200;
        const scale = Math.min(1, MAX / Math.max(tmp.width, tmp.height));
        const c = document.createElement('canvas');
        c.width = Math.round(tmp.width * scale);
        c.height = Math.round(tmp.height * scale);
        c.getContext('2d').drawImage(tmp, 0, 0, c.width, c.height);
        pendingImg.src = c.toDataURL('image/jpeg', 0.82);
        pendingImg = null;
        pushHistory();
        toast('画像、上書き錬成完了。');
      };
      tmp.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  // ============ HTML書き出し ============
  document.getElementById('edit-export').addEventListener('click', () => {
    const clone = document.documentElement.cloneNode(true);
    const cloneBody = clone.querySelector('body');
    cloneBody.classList.remove('edit-mode', 'loading');

    // 一時UI・キャンバス類を除去
    ['#loader', '#cursor', '#cursor-follower', '#text-toolbar', '#toast', '#img-picker',
     '#matrix-canvas', '#fx-canvas', '#cmd-palette'].forEach(sel => {
      const el = clone.querySelector(sel);
      if (el) el.remove();
    });
    // contenteditable属性を除去
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    // インラインでアクセント色を焼き込み
    const styleTag = document.createElement('style');
    styleTag.textContent = `:root { --primary: ${getAccent()}; }`;
    clone.querySelector('head').appendChild(styleTag);

    const html = '<!DOCTYPE html>\n' + clone.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ryo-awakened-edited.html';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('この世界を一枚のHTMLに封印した。');
  });

  // ============ リセット ============
  document.getElementById('edit-reset').addEventListener('click', () => {
    if (!confirm('全ての編集を無に還す。本当にいいか？（この操作は戻せない）')) return;
    localStorage.removeItem(STORAGE_KEY);
    toast('世界は初期状態に還る……');
    setTimeout(() => location.reload(), 900);
  });

  // ============ Undo/Redoボタン ============
  document.getElementById('edit-undo').addEventListener('click', undo);
  document.getElementById('edit-redo').addEventListener('click', redo);
  updateHistoryButtons();

  // ============ 起動時に復元 ============
  restore();
})();
