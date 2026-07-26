/** クエリ文字列から起動モードを解釈（GAS iframe 用に複数経路で呼ぶ） */
export function parseAppEntryFromQueryString(queryString) {
  if (!queryString) return null;
  const raw = String(queryString).replace(/^\?/, '').replace(/^#/, '');
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const page = String(params.get('page') || '').toLowerCase();
  if (page === 'checklist') {
    return { checklistOnlyMode: true, initialTab: 'checklist' };
  }
  const tab = params.get('tab');
  const allowed = ['home', 'request', 'repost', 'checklist'];
  if (tab && allowed.includes(tab)) {
    return { checklistOnlyMode: false, initialTab: tab };
  }
  return null;
}

/** URL から起動モード（?page=checklist = リストチェック専用） */
export function readAppEntryFromUrl() {
  if (typeof window !== 'undefined' && window.__TM_ENTRY_PAGE__ === 'checklist') {
    return { checklistOnlyMode: true, initialTab: 'checklist' };
  }

  const candidates = [];
  if (typeof window !== 'undefined') {
    if (window.location.search) candidates.push(window.location.search);
    const hash = window.location.hash || '';
    if (hash) {
      candidates.push(hash);
      const qInHash = hash.indexOf('?');
      if (qInHash >= 0) candidates.push(hash.slice(qInHash));
    }
    try {
      if (window.top && window.top !== window && window.top.location.search) {
        candidates.push(window.top.location.search);
      }
    } catch {
      /* GAS サンドボックスは親 URL を読めないことがある */
    }
    try {
      if (window.parent && window.parent !== window && window.parent.location.search) {
        candidates.push(window.parent.location.search);
      }
    } catch {
      /* ignore */
    }
  }

  for (const q of candidates) {
    const entry = parseAppEntryFromQueryString(q);
    if (entry) return entry;
  }
  return { checklistOnlyMode: false, initialTab: 'home' };
}

export function applyAppEntry(entry, setChecklistOnlyMode, setActiveTab) {
  if (!entry) return;
  if (entry.checklistOnlyMode) {
    setChecklistOnlyMode(true);
    setActiveTab('checklist');
    document.title = 'リストチェック - ToDo List';
  } else if (entry.initialTab) {
    setActiveTab(entry.initialTab);
  }
}

/** GAS HtmlService: doGet で渡した page パラメータをサーバーから取得 */
export function fetchAppEntryFromGas(callback) {
  if (typeof google === 'undefined' || !google.script || !google.script.url || typeof google.script.url.getLocation !== 'function') {
    return;
  }
  try {
    google.script.url.getLocation((loc) => {
      const page = loc && loc.parameter && String(loc.parameter.page || '').toLowerCase();
      if (page === 'checklist') {
        callback({ checklistOnlyMode: true, initialTab: 'checklist' });
        return;
      }
      const tab = loc && loc.parameter && loc.parameter.tab;
      const allowed = ['home', 'request', 'repost', 'checklist'];
      if (tab && allowed.includes(tab)) {
        callback({ checklistOnlyMode: false, initialTab: tab });
      }
    });
  } catch {
    /* ignore */
  }
}
