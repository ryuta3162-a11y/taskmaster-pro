import React, { useState, useEffect, Fragment, useMemo, useRef, useCallback } from 'react';
import { ACCENT_THEMES, applyAccentTheme, readStoredAccentId } from './accentThemes.js';

// --- デザイン用定数（スマホアプリ風・内容は従来どおり） ---
const appCard = "bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-black/[0.05] p-5 md:p-6 transition-all w-full";
const appInput = "bg-slate-100/90 border-0 rounded-xl px-4 py-3.5 font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--acc-500)]/35 transition-all w-full text-sm";
/** タイポグラフィ階層（index 全画面・admin.css と同じ 16/14/12/11px 想定） */
const appText = {
  title: 'text-base font-bold text-slate-900 leading-snug',
  section: 'text-sm font-semibold text-[var(--acc-600)]',
  body: 'text-sm font-medium text-slate-700',
  meta: 'text-xs font-medium text-slate-500',
  caption: 'text-xs font-semibold text-slate-500',
  badge: 'text-xs font-bold',
  badgeNum: 'text-[11px] font-bold tabular-nums leading-none',
  tab: 'text-sm font-bold',
  btn: 'text-sm font-bold',
  /** 配信人数など、強調したい数字のみ */
  stat: 'text-2xl font-bold text-[var(--acc-600)] tabular-nums tracking-tight',
};
const appLabel = `${appText.section} mb-3 block tracking-wide border-b border-slate-200/80 pb-2`;
/** リストチェック等のタスクカード（appCard と同じ枠・角丸） */
const appTaskCard = `${appCard} flex flex-col xl:flex-row gap-4 xl:gap-5 w-full animate-fade-in`;
const appTagPill = `${appText.badge} inline-flex items-center px-2.5 py-1 rounded-lg border border-black/[0.06]`;
const appTagOnAccent = `${appText.badge} inline-flex items-center px-2.5 py-1 rounded-lg text-white shadow-sm`;
const appSurfaceInset = 'rounded-xl border border-slate-200/80 bg-slate-50/90';
const appDivider = 'border-t border-slate-200/80';
const appFormSubmitRow = `${appDivider} pt-6 w-full mt-2`;
const appBtnPrimary = `bg-[var(--acc-500)] text-white rounded-2xl shadow-lg shadow-[var(--acc-500)]/25 transition-all hover:bg-[var(--acc-600)] active:scale-[0.98] flex items-center justify-center gap-3 py-3.5 w-full ${appText.btn}`;
const appBtnSecondary = `bg-white text-slate-700 rounded-2xl border border-black/[0.06] shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] flex items-center justify-center gap-2 py-3 ${appText.btn}`;
const appLinkBtn = `${appBtnSecondary} w-full max-w-md py-3 gap-2`;
const appLabelKind = `${appText.section} mb-4 block tracking-wide border-b border-slate-200/80 pb-2`;
const appKindRadio = (on) =>
  `flex items-center gap-3 flex-1 p-4 rounded-xl border cursor-pointer transition-colors ${
    on ? 'border-[var(--acc-500)] bg-[var(--acc-50)] ring-1 ring-[var(--acc-200)]/40' : 'border-slate-200 bg-white hover:border-slate-300'
  }`;
/** 定期配信：スケジュール直下のオプション（黄色ではなくアクセント系の控えめボックス） */
const appScheduleOption = 'flex items-start gap-3 mt-5 p-4 rounded-xl border border-[var(--acc-200)]/55 bg-[var(--acc-50)]/50 cursor-pointer hover:bg-[var(--acc-50)]/80 transition-colors ring-1 ring-black/[0.03]';
const appMenuTile = "w-full text-left bg-white rounded-2xl p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-black/[0.04] active:scale-[0.99] transition-all flex items-center gap-4";
/** ダッシュボード（ホーム）の4メニュー用・やや大きめ */
const dashboardMenuTile = "w-full text-left bg-white rounded-2xl p-5 md:p-7 min-h-[5.25rem] md:min-h-[6.25rem] shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-black/[0.05] active:scale-[0.99] transition-all flex items-center gap-4 md:gap-5";
const dashboardMenuIcon = "w-14 h-14 md:w-16 md:h-16 rounded-2xl shrink-0 flex items-center justify-center bg-[var(--acc-50)] text-[var(--acc-700)] [&>svg]:scale-100";
const appSection = "relative rounded-2xl w-full overflow-hidden border border-[var(--acc-200)]/45 bg-white/95 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.08)] ring-1 ring-[var(--acc-100)]/40 p-5 md:p-6";
const appMenuIcon = "w-12 h-12 rounded-xl shrink-0 flex items-center justify-center bg-[var(--acc-50)] text-[var(--acc-700)] [&>svg]:scale-[0.85]";
const appChipBase = "inline-flex items-center justify-center min-h-[2.5rem] px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none text-center leading-snug";
const appChipOn = "bg-gradient-to-br from-[var(--acc-500)] to-[var(--acc-700)] text-white shadow-md shadow-[var(--acc-500)]/30 ring-1 ring-white/25";
const appChipOff = "bg-white/90 text-slate-700 border border-[var(--acc-200)]/60 hover:border-[var(--acc-400)] hover:bg-[var(--acc-50)]/60";
const appChipArena = "rounded-xl border border-[var(--acc-200)]/45 bg-gradient-to-b from-slate-900/[0.03] via-white to-[var(--acc-50)]/25 p-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]";

/** 新規登録は社内メールのみ（従業員データに既にある人はドメイン不問でログイン可） */
const CORP_EMAIL_DOMAIN = '@okamoto-group.co.jp';
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}
function isCorpEmail(email) {
  return normalizeEmail(email).endsWith(CORP_EMAIL_DOMAIN);
}

/** クエリ文字列から起動モードを解釈（GAS iframe 用に複数経路で呼ぶ） */
function parseAppEntryFromQueryString(queryString) {
  if (!queryString) return null;
  const raw = String(queryString).replace(/^\?/, '').replace(/^#/, '');
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const page = String(params.get('page') || '').toLowerCase();
  if (page === 'checklist') {
    return { checklistOnlyMode: true, initialTab: 'checklist' };
  }
  const tab = params.get('tab');
  const allowed = ['home', 'request', 'repost', 'scheduled', 'checklist'];
  if (tab && allowed.includes(tab)) {
    return { checklistOnlyMode: false, initialTab: tab };
  }
  return null;
}

/** URL から起動モード（?page=checklist = リストチェック専用） */
function readAppEntryFromUrl() {
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

function applyAppEntry(entry, setChecklistOnlyMode, setActiveTab) {
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
function fetchAppEntryFromGas(callback) {
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
      const allowed = ['home', 'request', 'repost', 'scheduled', 'checklist'];
      if (tab && allowed.includes(tab)) {
        callback({ checklistOnlyMode: false, initialTab: tab });
      }
    });
  } catch {
    /* ignore */
  }
}
// 既存クラス名との互換（置換漏れ防止）
const brutalCard = appCard;
const brutalInput = appInput;
const brutalBtnPrimary = appBtnPrimary;
const brutalBtnSecondary = appBtnSecondary;

// --- アイコン部品 ---
const Icon = ({ name }) => {
  const icons = {
    home: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
    calendar: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    list: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>,
    loader: <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
    user: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    x: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    chevronLeft: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
    chevronDown: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
    link: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    send: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    check: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
    alertTriangle: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
    history: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
    repeat: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>,
    trend: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13 16 9 12 2 19"/><polyline points="16 7 22 7 22 13"/></svg>,
    plusCircle: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    trash: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
    image: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    filePdf: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h6"/><path d="M9 11h6"/></svg>,
    fileZip: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 12v6"/><path d="M9.5 14.5 12 12l2.5 2.5"/></svg>
  };
  return icons[name] || null;
};

// --- 入力規則データ（★ 役職を追加） ---
const ROLES = ['GMG', 'A-SMG', 'SMG', 'TMG', 'CMG', 'CL', 'CF', 'IR'];
const TEAMS = ['QSC＆監査', '原価低減 JOYFIT', '原価低減 FIT365', '販促', 'DX', 'PT', 'オプション', 'CS・ES', '競合対策', 'スタジオPG', 'リテンション', 'オープン・リニューアル', 'リスクアセスメント', 'ヨガ＆ピラティスチーム'];
/** 従業員データに旧名称が残っている場合の照合用 */
const TEAM_LEGACY_ALIASES = { ニュービジネス: 'ヨガ＆ピラティスチーム' };
const AREAS = ['第1エリア', '第2エリア', '第3エリア', '第4エリア', '第5エリア', '第6エリア', '第7エリア'];
/** 店舗エリア外の本部所属（店舗依頼の配信対象外・社員/TF依頼は対象） */
const HQ_AREA = 'EAST本部';
const HQ_STORE = 'EAST本部';

function isHqStoreName(name) {
  return String(name || '').trim() === HQ_STORE;
}
function isHqAreaName(name) {
  return String(name || '').trim() === HQ_AREA;
}
/** 第1〜7エリアの店舗のみ（本部行を除く） */
function getFieldStores(allStores) {
  return (allStores || []).filter((s) => !isHqStoreName(s.storeName) && !isHqAreaName(s.area));
}
function getFieldStoreNames(allStores) {
  return getFieldStores(allStores).map((s) => s.storeName);
}

/** 従業員シートの管轄店舗上限（H列〜、GAS の EMPLOYEE_STORE_COL_MAX と一致） */
const MAX_EMPLOYEE_STORES = 50;

/** 定期配信の実行時刻（GAS の processScheduledTasksBatch と一致させる） */
const SCHEDULE_DELIVERY_TIME = '10:00';

/** 「毎月 N日 10:00」形式から日だけ取り出す */
function parseCycleDayFromString(cycleStr) {
  const m = String(cycleStr || '').match(/毎月\s+(\d{1,2})日/);
  return m ? m[1] : '1';
}

/** 従業員データのチーム列（カンマ区切り可）を配列に */
function parseEmployeeTeams(teamStr) {
  return String(teamStr || '')
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => TEAM_LEGACY_ALIASES[t] || t);
}

/** 未選択または全チーム選択時は true。それ以外は所属チームとの交差 */
function employeeMatchesTeams(emp, selectedTeams, teamsList) {
  if (!selectedTeams?.length || selectedTeams.length === teamsList.length) return true;
  const empTeams = parseEmployeeTeams(emp.team);
  if (empTeams.length === 0) return true;
  return empTeams.some((t) => selectedTeams.includes(t));
}

/**
 * スプレッドシートに保存された targetTags 文字列から、配信先の店舗・役職・チームを復元（再投稿用）
 * チームは 〈DX, 販促〉 形式（無ければ全チーム）
 */
function parseTargetTagsToSelection(tagStr, allStores, areasList, rolesList, teamsList) {
  const fieldStores = getFieldStores(allStores);
  const allStoreNames = fieldStores.map((s) => s.storeName);
  const fieldAreasList = areasList.filter((a) => !isHqAreaName(a));
  if (!tagStr || String(tagStr).trim() === '' || tagStr === '指定なし') {
    return { stores: [...allStoreNames], roles: [...rolesList], teams: [...teamsList] };
  }
  let s = String(tagStr).trim();
  let roles = [...rolesList];
  let teams = [...teamsList];

  const teamBracket = s.match(/\s*〈([^〉]+)〉\s*/);
  if (teamBracket) {
    const teamNames = teamBracket[1].split(/,\s*/).map((t) => TEAM_LEGACY_ALIASES[t.trim()] || t.trim()).filter(Boolean);
    const matched = teamsList.filter((t) => teamNames.includes(t));
    if (matched.length > 0) teams = matched;
    s = s.replace(teamBracket[0], '').trim();
  }

  let storePart = s;
  const roleBracket = s.match(/\s*\[([^\]]+)\]\s*$/);
  if (roleBracket) {
    const roleNames = roleBracket[1].split(/,\s*/).map((r) => r.trim()).filter(Boolean);
    const matched = rolesList.filter((r) => roleNames.includes(r));
    if (matched.length > 0) roles = matched;
    storePart = s.slice(0, s.lastIndexOf('[')).trim();
  }
  if (!storePart || storePart === '全店') {
    return { stores: [...allStoreNames], roles, teams };
  }
  const parts = storePart.split(/,\s*/).map((x) => x.trim()).filter(Boolean);
  const selected = new Set();
  parts.forEach((p) => {
    if (isHqAreaName(p) || isHqStoreName(p)) return;
    if (fieldAreasList.includes(p)) {
      fieldStores.filter((st) => st.area === p).forEach((st) => selected.add(st.storeName));
    } else if (allStoreNames.includes(p)) {
      selected.add(p);
    }
  });
  const stores = Array.from(selected);
  if (stores.length === 0) {
    return { stores: [...allStoreNames], roles, teams };
  }
  return { stores, roles, teams };
}

/** 配信先メール一覧から店舗・役職・チームを復元（定期編集用・targetTags より正確な場合がある） */
function deriveStoresAndRolesFromTargets(targetEmails, allEmployees, allStoreNamesList, rolesList, teamsList) {
  const emails = new Set((targetEmails || []).map((e) => String(e).trim()).filter(Boolean));
  if (emails.size === 0) return null;
  const storeSet = new Set();
  const roleSet = new Set();
  const teamSet = new Set();
  allEmployees.forEach((emp) => {
    if (emails.has(emp.email)) {
      (emp.stores || []).forEach((s) => storeSet.add(s));
      if (emp.role) roleSet.add(emp.role);
      parseEmployeeTeams(emp.team).forEach((t) => teamSet.add(t));
    }
  });
  const stores = allStoreNamesList.filter((s) => storeSet.has(s));
  const roles = rolesList.filter((r) => roleSet.has(r));
  const teams = teamsList.filter((t) => teamSet.has(t));
  if (stores.length === 0 && roleSet.size === 0 && teamSet.size === 0) return null;
  return {
    stores: stores.length ? stores : allStoreNamesList,
    roles: roles.length ? roles : rolesList,
    teams: teams.length ? teams : teamsList,
  };
}

function normalizeRecipientEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** 配信先候補の一致判定（社員=役職 / 店舗=管轄店舗 / TF=所属チーム） */
function employeeMatchesTargetFilters(
  emp,
  { requestKind, selectedStores, selectedRoles, selectedTeams, rolesList, teamsList }
) {
  const kind = normalizeRequestKind(requestKind);
  if (!emp.email) return false;
  if (kind === REQUEST_KIND.employee) {
    return (
      (!emp.role && selectedRoles.length === rolesList.length) || selectedRoles.includes(emp.role)
    );
  }
  if (kind === REQUEST_KIND.store) {
    const empStores = (emp.stores || []).filter((s) => !isHqStoreName(s));
    const fieldSelected = selectedStores.filter((s) => !isHqStoreName(s));
    if (fieldSelected.length === 0) return false;
    return empStores.some((s) => fieldSelected.includes(s));
  }
  return employeeMatchesTeams(emp, selectedTeams, teamsList);
}

/** 配信先候補一覧（名前・役職など付き） */
function computeTargetRecipientsList({
  requestKind,
  selectedStores,
  selectedRoles,
  selectedTeams,
  allEmployees,
  rolesList,
  teamsList,
}) {
  const params = {
    requestKind,
    selectedStores,
    selectedRoles,
    selectedTeams,
    rolesList,
    teamsList,
  };
  return allEmployees
    .filter((emp) => employeeMatchesTargetFilters(emp, params))
    .map((emp) => {
      const email = String(emp.email).trim();
      const stores =
        requestKind === REQUEST_KIND.store
          ? (emp.stores || []).filter((s) => selectedStores.includes(s))
          : emp.stores || [];
      return {
        email,
        name: emp.name || email,
        role: emp.role || '—',
        team: emp.team || '—',
        storesLabel: stores.length ? stores.join('、') : '—',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

/** 依頼・定期の配信先メール集合（役職・チーム・店舗条件） */
function computeTargetRecipientEmails(params) {
  return new Set(computeTargetRecipientsList(params).map((r) => r.email));
}

function filterRecipientsByExclusions(recipients, excludedEmails) {
  const excluded = new Set((excludedEmails || []).map(normalizeRecipientEmail));
  return recipients.filter((r) => !excluded.has(normalizeRecipientEmail(r.email)));
}

/** 保存済み targets（メール配列）から、候補一覧に対する除外リストを作る */
function excludedEmailsFromSavedTargets(candidates, savedTargetEmails) {
  if (!Array.isArray(savedTargetEmails) || savedTargetEmails.length === 0) return [];
  const saved = new Set(savedTargetEmails.map(normalizeRecipientEmail));
  return candidates
    .filter((r) => !saved.has(normalizeRecipientEmail(r.email)))
    .map((r) => normalizeRecipientEmail(r.email));
}

/**
 * チェックリストの店舗タブ・件数バッジ用。
 * targetTags が「全店 [CL]」のように店名を列挙しない場合でも一致させる（従来は includes(店名) のみで 0 件になっていた）。
 * requestKind が employee のとき「全店」系タグは個別店舗フィルタに一致しない（社員依頼は全店チップのみで絞る）。
 */
function taskMatchesStoreFilter(targetTagsStr, filterKey, allStores, requestKind, targetStoreNames) {
  if (filterKey === 'ALL') return true;
  const tg = String(targetTagsStr || '').trim();
  if (requestKind === 'store' && Array.isArray(targetStoreNames) && targetStoreNames.length) {
    if (targetStoreNames.indexOf(filterKey) >= 0) return true;
  }
  if (!tg || tg === '指定なし') return true;
  const rk = normalizeRequestKind(requestKind);
  if (rk !== REQUEST_KIND.store && (tg === '全店' || /^\s*全店(\s|\[)/.test(tg))) return false;
  if (tg === '全店' || /^\s*全店(\s|\[)/.test(tg)) return true;
  if (tg.includes(filterKey)) return true;
  const storeRow = allStores.find((st) => st.storeName === filterKey);
  if (storeRow && tg.indexOf(storeRow.area) >= 0) return true;
  return false;
}

function resolveEmployeeName(email, allEmployees) {
  if (email == null || email === '') return '—';
  const norm = String(email).trim().toLowerCase();
  const found = allEmployees.find((emp) => String(emp.email || '').trim().toLowerCase() === norm);
  return found?.name || String(email);
}

function emailsMatch(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

/** 店舗データからエリア別テリトリー一覧（スプレッドシート「店舗データ」と同期） */
function getTerritoriesForArea(area, allStores) {
  const fromData = [...new Set(
    (allStores || [])
      .filter((s) => s.area === area && String(s.territory || '').trim())
      .map((s) => String(s.territory).trim())
      .filter(Boolean),
  )].sort((a, b) => {
    const na = parseInt(String(a).replace(/\D/g, ''), 10) || 0;
    const nb = parseInt(String(b).replace(/\D/g, ''), 10) || 0;
    return na - nb || a.localeCompare(b, 'ja');
  });
  if (fromData.length) return fromData;
  if (area === '第1エリア') return ['テリトリー1', 'テリトリー2'];
  return ['テリトリー1', 'テリトリー2', 'テリトリー3'];
}

// --- API層 ---
const isGAS = typeof google !== 'undefined' && google.script && google.script.run;
const api = {
  fetchEmployees: () => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res([]), 600);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).getEmployees();
  }),
  fetchStoreData: () => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res([]), 600);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).getStoreData();
  }),
  registerEmployee: (data) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({status:'success'}), 1000);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).registerEmployee(data);
  }),
  updateEmployee: (data) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({ status: 'success' }), 1000);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).updateEmployee(data);
  }),
  fetchTasksForUser: (email) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res([]), 800);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).getTasksForUser(email);
  }),
  fetchAppDataForUser: (email, senderName) => new Promise((res, rej) => {
    if (!isGAS) {
      return setTimeout(
        () => res({ tasks: [], sentTasks: [], scheduledTasks: [] }),
        800
      );
    }
    google.script.run
      .withSuccessHandler(res)
      .withFailureHandler(rej)
      .getAppDataForUser(email, senderName);
  }),
  createTask: (data) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({ status: 'success', id: 'mock', driveErrors: [] }), 1000);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).createNewTask(data);
  }),
  completeTask: (id, email, storeName) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({ success: true }), 1500);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).completeTask(id, email, storeName);
  }),
  completeTaskStoresBulk: (id, email, storeNames) => new Promise((res, rej) => {
    if (!isGAS) {
      const updated = {};
      (storeNames || []).forEach((n) => { updated[n] = { at: 'mock', by: email }; });
      return setTimeout(() => res({ success: true, completed: storeNames.length, updated }), 400);
    }
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).completeTaskStoresBulk(id, email, storeNames);
  }),
  uncompleteTask: (id, email, storeName) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({ success: true }), 400);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).uncompleteTask(id, email, storeName);
  }),
  getSentTasks: (name) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res([]), 800);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).getSentTasks(name);
  }),
  getScheduledTasks: (name) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res([]), 800);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).getScheduledTasks(name);
  }),
  registerScheduledTask: (data) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({ status: 'success', driveErrors: [] }), 1000);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).registerScheduledTask(data);
  }),
  deleteScheduledTask: (id) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({status:'success'}), 1000);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).deleteScheduledTask(id);
  }),
  updateScheduledTask: (id, data) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({ status: 'success', driveErrors: [] }), 1000);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).updateScheduledTask(id, data);
  })
};

function formatGasError(err) {
  if (err == null) return '不明なエラー';
  if (typeof err === 'string') return err;
  if (typeof err.message === 'string') return err.message;
  try {
    return String(err);
  } catch (e) {
    return '不明なエラー';
  }
}

const formatContent = (text) => {
  if (!text) return null;
  return text.split('。').map((sentence, index, array) => (
    <React.Fragment key={index}>
      {sentence}
      {index < array.length - 1 && '。'}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));
};

/** 添付の合計件数（JPEG / PNG / PDF / ZIP を混在しても 1 件として数える） */
const MAX_ATTACHMENTS = 3;

/**
 * PDF・ZIP 1 ファイルあたりの上限（バイト）。
 * 大きくするとブラウザ→GAS の転送失敗・タイムアウトのリスクは上がる（目安は 25MB 前後まで）。
 */
const MAX_BINARY_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const MAX_PDF_BYTES = MAX_BINARY_ATTACHMENT_BYTES;
const ACCEPT_IMAGES_AND_PDF = 'image/*,.pdf,application/pdf';
const ACCEPT_ZIP = '.zip,application/zip,application/x-zip-compressed';

/** GAS・列「依頼単位」と一致: employee=社員 / store=店舗単位 / tf=TFチーム（個人完了） */
const REQUEST_KIND = { employee: 'employee', store: 'store', tf: 'tf' };

const REQUEST_KIND_LABEL = {
  [REQUEST_KIND.employee]: '社員依頼',
  [REQUEST_KIND.store]: '店舗依頼',
  [REQUEST_KIND.tf]: 'TFチーム依頼',
};

function normalizeRequestKind(raw) {
  const k = String(raw || '').trim().toLowerCase();
  if (k === REQUEST_KIND.store) return REQUEST_KIND.store;
  if (k === REQUEST_KIND.tf) return REQUEST_KIND.tf;
  return REQUEST_KIND.employee;
}

function isStoreRequestKind(kind) {
  return normalizeRequestKind(kind) === REQUEST_KIND.store;
}

/** 管轄店舗リストを常に配列に正規化（スプレッドシート由来の不正値で落ちないように） */
function asUserStoreList(stores) {
  if (Array.isArray(stores)) return stores.map((s) => String(s || '').trim()).filter(Boolean);
  if (stores != null && typeof stores === 'string') {
    return stores.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function isHqEmployee(emp) {
  if (isHqAreaName(emp?.area)) return true;
  return asUserStoreList(emp?.stores).some(isHqStoreName);
}

/** スプレッドシートの従業員行 → 登録フォーム用 regData */
function parseEmployeeToRegData(emp, allStores = []) {
  const teams = parseEmployeeTeams(emp?.team);
  const rawAreas = String(emp?.area || '')
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (isHqEmployee(emp) || rawAreas.some(isHqAreaName)) {
    return {
      name: emp?.name || '',
      role: emp?.role || '',
      team: teams,
      area: [],
      territory: {},
      stores: [HQ_STORE],
      hqAffiliation: true,
    };
  }
  const areas = rawAreas.filter((a) => AREAS.includes(a));
  const territory = {};
  String(emp?.territory || '')
    .split(' / ')
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((part) => {
      const idx = part.indexOf(':');
      if (idx < 0) return;
      const areaName = part.slice(0, idx).trim();
      const terrPart = part.slice(idx + 1).trim();
      if (!areaName) return;
      territory[areaName] = terrPart
        .split(/,\s*/)
        .map((t) => t.trim())
        .filter(Boolean);
    });
  areas.forEach((areaName) => {
    if (!territory[areaName]?.length) territory[areaName] = [...getTerritoriesForArea(areaName, allStores)];
  });
  return {
    name: emp?.name || '',
    role: emp?.role || '',
    team: teams,
    area: areas,
    territory,
    stores: asUserStoreList(emp?.stores),
    hqAffiliation: false,
  };
}

const emptyRegData = () => ({ name: '', role: '', team: [], area: [], territory: {}, stores: [], hqAffiliation: false });

function getTaskTargetStoreNames(task) {
  if (Array.isArray(task?.targetStoreNames) && task.targetStoreNames.length) {
    return task.targetStoreNames.map((s) => String(s || '').trim()).filter(Boolean);
  }
  return Object.keys(task?.storeCompletions || {});
}

function taskMatchesChecklistStoreSelection(task, selectedStores, allStores, myStores) {
  if (!selectedStores || !selectedStores.length) return true;
  const rk = normalizeRequestKind(task?.requestKind);
  const safeMyStores = asUserStoreList(myStores);
  return selectedStores.some((filterKey) => {
    if (!taskMatchesStoreFilter(task?.targetTags, filterKey, allStores, rk, task?.targetStoreNames)) return false;
    if (rk === 'store') {
      const targets = getTaskTargetStoreNames(task);
      return safeMyStores.indexOf(filterKey) >= 0 && targets.indexOf(filterKey) >= 0;
    }
    return true;
  });
}

/** 店舗依頼: 自分の管轄店舗のうち、この依頼に含まれる店舗名 */
function getMyRelevantStoreNamesForTask(task, myStores) {
  const safeMyStores = asUserStoreList(myStores);
  const targets = getTaskTargetStoreNames(task);
  return targets.filter((s) => safeMyStores.indexOf(s) >= 0);
}

/** 店舗依頼: 自分の担当分がすべて完了済みか（リストの未実施/実施済み判定用） */
function isUserDoneWithStoreTask(task, myStores) {
  const relevant = getMyRelevantStoreNamesForTask(task, myStores);
  if (relevant.length === 0) return false;
  const sc = task?.storeCompletions || {};
  return relevant.every((s) => !!sc[s]);
}

/** チェックリスト上で「実施済み」タブに出すか */
function isUserDoneWithTask(task, myStores) {
  if (isStoreRequestKind(task?.requestKind)) return isUserDoneWithStoreTask(task, myStores);
  return !!task?.completed;
}

/** 店舗依頼: 未実施タブに表示する担当店舗（店舗チップ絞り込み後） */
function getMyPendingStoreNamesForChecklist(task, myStores, selectedStores) {
  if (!isStoreRequestKind(task?.requestKind)) return [];
  let names = getMyRelevantStoreNamesForTask(task, myStores);
  if (!names.length) return [];
  const sel = asUserStoreList(selectedStores);
  if (sel.length) names = names.filter((s) => sel.indexOf(s) >= 0);
  const sc = task?.storeCompletions || {};
  return names.filter((s) => !sc[s]);
}

/** 店舗依頼: 実施済みタブに表示する担当店舗（店舗チップ絞り込み後） */
function getMyCompletedStoreNamesForChecklist(task, myStores, selectedStores) {
  if (!isStoreRequestKind(task?.requestKind)) return [];
  let names = getMyRelevantStoreNamesForTask(task, myStores);
  if (!names.length) return [];
  const sel = asUserStoreList(selectedStores);
  if (sel.length) names = names.filter((s) => sel.indexOf(s) >= 0);
  const sc = task?.storeCompletions || {};
  return names.filter((s) => !!sc[s]);
}

/** 店舗チップで絞っているか */
function hasChecklistStoreFilter(selectedStores) {
  return asUserStoreList(selectedStores).length > 0;
}

/**
 * チェックリストの未実施/実施済みタブに載せるか（空カードを出さない）
 * 店舗チップ選択時: その店舗が自分の担当に含まれる依頼は、完了済み行も表示（取り消し可）
 */
function shouldIncludeTaskInChecklistTab(task, taskTab, myStores, selectedStores) {
  if (isStoreRequestKind(task?.requestKind)) {
    const relevant = getMyRelevantStoreNamesForTask(task, myStores);
    if (relevant.length === 0) return false;
    const sel = asUserStoreList(selectedStores);
    if (sel.length) {
      return relevant.some((s) => sel.indexOf(s) >= 0);
    }
    if (taskTab === 'active') {
      return getMyPendingStoreNamesForChecklist(task, myStores, []).length > 0;
    }
    if (!isUserDoneWithStoreTask(task, myStores)) return false;
    return getMyCompletedStoreNamesForChecklist(task, myStores, []).length > 0;
  }
  return taskTab === 'active' ? !isUserDoneWithTask(task, myStores) : isUserDoneWithTask(task, myStores);
}

/** 店舗チップの件数バッジ（未実施＝その店舗にやることが残っている依頼のみ） */
function taskHasPendingWorkForStoreChip(task, storeName, myStores) {
  if (!isStoreRequestKind(task?.requestKind)) return false;
  return getMyPendingStoreNamesForChecklist(task, myStores, [storeName]).length > 0;
}

/** 店舗チップの件数（実施済みタブ＝その店舗で完了済みの担当がある依頼） */
function taskHasCompletedWorkForStoreChip(task, storeName, myStores) {
  if (!isStoreRequestKind(task?.requestKind)) return false;
  return getMyCompletedStoreNamesForChecklist(task, myStores, [storeName]).length > 0;
}

/** 店舗チップに表示する件数（現在の未実施/実施済みタブに合わせる） */
function countChecklistTasksForStoreChip(tasks, storeName, taskTab, myStores) {
  const list = Array.isArray(tasks) ? tasks : [];
  if (taskTab === 'completed') {
    return list.filter((t) => taskHasCompletedWorkForStoreChip(t, storeName, myStores)).length;
  }
  return list.filter((t) => taskHasPendingWorkForStoreChip(t, storeName, myStores)).length;
}

function applyStoreCompletionToTask(task, storeCompletions, myStores) {
  const next = { ...task, storeCompletions };
  if (isStoreRequestKind(task?.requestKind)) {
    next.completed = isUserDoneWithStoreTask(next, myStores);
  }
  return next;
}

function isPdfFile(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function isZipFile(file) {
  const type = String(file?.type || '').toLowerCase();
  return (
    type === 'application/zip' ||
    type === 'application/x-zip-compressed' ||
    /\.zip$/i.test(file?.name || '')
  );
}

function isPdfAttachmentUrl(url) {
  const u = String(url || '').toLowerCase();
  return /\.pdf(\?|#|$)/.test(u) || u.includes('#file.pdf');
}

function isZipAttachmentUrl(url) {
  const u = String(url || '').toLowerCase();
  return /\.zip(\?|#|$)/.test(u) || u.includes('#file.zip');
}

function attachmentKindFromUrl(url) {
  if (isPdfAttachmentUrl(url)) return 'pdf';
  if (isZipAttachmentUrl(url)) return 'zip';
  return 'image';
}

function extractDriveFileId_(url) {
  const m = String(url || '').match(/[?&]id=([^&]+)/);
  return m ? m[1] : null;
}

/** Drive 保存 URL を一覧サムネ用に変換（失敗時は元 URL） */
function attachmentPreviewSrc_(url) {
  const id = extractDriveFileId_(url);
  if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w256`;
  return url;
}

function attachmentFromStoredUrl_(url, idx) {
  const u = String(url || '').trim();
  if (!u) return null;
  const kind = attachmentKindFromUrl(u);
  return {
    name: kind === 'pdf' ? `参考PDF${idx + 1}.pdf` : kind === 'zip' ? `参考ZIP${idx + 1}.zip` : `参考画像${idx + 1}.jpg`,
    type: kind === 'pdf' ? 'application/pdf' : kind === 'zip' ? 'application/zip' : 'image/jpeg',
    preview: kind === 'image' ? u : null,
    reuseUrl: u,
    isPdf: kind === 'pdf',
    isZip: kind === 'zip',
  };
}

/** 再投稿・定期一覧：保存済み添付の小さなサムネ（クリックで新しいタブで開く） */
function SavedAttachmentStrip({ urls, className = '' }) {
  const list = (Array.isArray(urls) ? urls : []).map((u) => String(u || '').trim()).filter(Boolean);
  if (list.length === 0) return null;

  return (
    <div className={`mt-4 ${className}`}>
      <p className="text-xs font-bold text-slate-500 mb-2">添付（タップで拡大・確認）</p>
      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
        {list.map((url, i) => (
          <SavedAttachmentMini key={`${url}-${i}`} url={url} index={i} />
        ))}
      </div>
    </div>
  );
}

function SavedAttachmentMini({ url, index }) {
  const [imgError, setImgError] = useState(false);
  const kind = attachmentKindFromUrl(url);
  const openUrl = url;
  const thumbSrc = attachmentPreviewSrc_(url);

  return (
    <a
      href={openUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="添付を開く"
      className="block w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-300 bg-slate-50 hover:border-[var(--acc-400)] hover:shadow-md transition-all shrink-0"
    >
      {kind !== 'image' || imgError ? (
        <span className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
          <span className={`inline-flex scale-90 ${kind === 'zip' ? 'text-sky-600' : 'text-rose-600'}`}>
            <Icon name={kind === 'zip' ? 'fileZip' : 'filePdf'} />
          </span>
          <span className="text-[9px] font-bold text-slate-600 mt-1">
            {kind === 'zip' ? 'ZIP' : 'PDF'} {index + 1}
          </span>
        </span>
      ) : (
        <img
          src={thumbSrc}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </a>
  );
}

function AttachmentThumb({ img, onRemove, removeBtnClass, sizeClass = 'w-32 h-32' }) {
  const [imgError, setImgError] = useState(false);
  const isZip =
    img.isZip ||
    (img.type && String(img.type).toLowerCase().includes('zip')) ||
    (img.reuseUrl && isZipAttachmentUrl(img.reuseUrl));
  const isPdf =
    img.isPdf ||
    (img.type && String(img.type).toLowerCase() === 'application/pdf') ||
    (img.reuseUrl && isPdfAttachmentUrl(img.reuseUrl));
  const showFileCard = isZip || isPdf || (img.reuseUrl && imgError);

  return (
    <div className={`relative ${sizeClass} rounded-xl overflow-hidden border-2 border-slate-300 shadow-sm bg-slate-50 flex flex-col`}>
      {showFileCard ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center min-h-0">
          <span className={`inline-flex ${isZip ? 'text-sky-600' : 'text-rose-600'}`}>
            <Icon name={isZip ? 'fileZip' : 'filePdf'} />
          </span>
          <span className="text-[10px] font-bold text-slate-600 truncate w-full mt-1 leading-tight" title={img.name}>
            {img.name || (isZip ? 'ZIP' : 'PDF')}
          </span>
          <span className="text-[9px] font-semibold text-slate-400 mt-0.5">{isZip ? 'ZIP' : 'PDF'}</span>
        </div>
      ) : (
        <img
          src={img.preview}
          alt=""
          className="w-full h-full object-cover min-h-0 flex-1"
          onError={() => setImgError(true)}
        />
      )}
      <button type="button" onClick={onRemove} className={removeBtnClass}>
        <Icon name="x" />
      </button>
    </div>
  );
}

function AttachmentUploadPanel({
  images,
  formType,
  onImageChange,
  onZipChange,
  onRemove,
  thumbSizeClass = 'w-32 h-32',
  removeBtnClass = 'absolute top-2 right-2 bg-rose-500 text-white border-2 border-slate-300 p-2 rounded-full hover:scale-110 transition-transform z-20',
  imageAreaClass = 'p-8',
  imagePromptClass = 'text-base font-black',
}) {
  const slotsLeft = MAX_ATTACHMENTS - images.length;

  return (
    <div className={appSection}>
      <label className={appLabel}>
        4. 参考画像・PDF・ZIP (任意 / 合計{MAX_ATTACHMENTS}つまで)
      </label>
      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
        画像が4枚以上ある場合はZIPにまとめて添付できます（例: 画像2枚＋ZIP1個）。合計{MAX_ATTACHMENTS}ファイルまでです。
      </p>
      {slotsLeft > 0 && (
        <>
          <div className={`bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl ${imageAreaClass} text-center hover:bg-slate-100 transition-colors relative cursor-pointer group`}>
            <input
              type="file"
              multiple
              accept={ACCEPT_IMAGES_AND_PDF}
              onChange={(e) => onImageChange(e, formType)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`flex flex-col items-center gap-4 text-black group-hover:scale-110 transition-transform ${imagePromptClass === 'text-sm font-bold' ? 'gap-3 text-slate-700' : ''}`}>
              <div className={`${imagePromptClass === 'text-sm font-bold' ? 'w-14 h-14' : 'w-16 h-16'} bg-white border-2 border-slate-300 rounded-full flex items-center justify-center shadow-sm`}>
                <Icon name="image" />
              </div>
              <span className={imagePromptClass}>
                タップして画像またはPDFを選択
                {imagePromptClass !== 'text-sm font-bold' && (
                  <>
                    <br />
                    <span className="text-xs text-gray-500">（自動でDriveに保存されます）</span>
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="mt-3 bg-sky-50 border-2 border-dashed border-sky-200 rounded-xl p-4 text-center hover:bg-sky-100/80 transition-colors relative cursor-pointer group">
            <input
              type="file"
              accept={ACCEPT_ZIP}
              onChange={(e) => onZipChange(e, formType)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center gap-2 text-sky-900 group-hover:scale-105 transition-transform">
              <span className="inline-flex text-sky-600">
                <Icon name="fileZip" />
              </span>
              <span className="text-sm font-bold">ZIPを追加</span>
              <span className="text-[11px] text-sky-700/80">複数画像を1つのZIPにまとめて添付（1ZIP＝1枠）</span>
            </div>
          </div>
        </>
      )}
      {images.length > 0 && (
        <div className={`flex flex-wrap gap-4 ${slotsLeft > 0 ? 'mt-6' : ''} ${thumbSizeClass === 'w-28 h-28' ? 'gap-3 mt-4' : ''}`}>
          {images.map((img, i) => (
            <AttachmentThumb
              key={i}
              img={img}
              sizeClass={thumbSizeClass}
              onRemove={() => onRemove(i, formType)}
              removeBtnClass={removeBtnClass}
            />
          ))}
        </div>
      )}
      {slotsLeft > 0 && slotsLeft < MAX_ATTACHMENTS && (
        <p className="text-[11px] text-slate-500 mt-3">残り {slotsLeft} 枠</p>
      )}
    </div>
  );
}

/** フィットネスクラブ × DX トーンのパネル枠 */
function PanelFrame({ children, className = '' }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden border border-[var(--acc-300)]/40 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--acc-50)]/75 via-white to-slate-50/90 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(90deg, var(--acc-500) 1px, transparent 1px), linear-gradient(var(--acc-500) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400/90 via-[var(--acc-500)] to-[var(--acc-700)]" />
      <div className="relative pl-4 pr-4 py-4 md:pl-5 md:pr-5">{children}</div>
    </div>
  );
}

/** タスク完了などの短いフィードバック（画面下部・数秒で消える） */
function ActionToast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className="fixed bottom-6 left-0 right-0 z-[110] flex justify-center px-4 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div className="action-toast flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full bg-slate-900/92 text-white text-sm font-bold shadow-[0_8px_28px_rgba(0,0,0,0.2)] ring-1 ring-white/15 max-w-[min(92vw,22rem)]">
        <span className="w-7 h-7 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center text-white [&>svg]:scale-[0.6]">
          <Icon name="check" />
        </span>
        <span className="truncate">{toast.message}</span>
      </div>
    </div>
  );
}

/** 新規登録フォーム用チップ */
function RegChip({ selected, onClick, children, compact }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${appChipBase} ${compact ? '!min-h-[2rem] !text-xs !px-2.5 !py-1.5' : ''} ${selected ? appChipOn : appChipOff}`}
    >
      {children}
    </button>
  );
}

/** 配信直前：条件に一致した社員一覧（個別に配信対象から外せる） */
function RecipientRosterPanel({ num, recipients, excludedEmails, onToggle, onSetAllIncluded }) {
  const [query, setQuery] = useState('');
  const excluded = new Set((excludedEmails || []).map(normalizeRecipientEmail));
  const includedCount = recipients.filter((r) => !excluded.has(normalizeRecipientEmail(r.email))).length;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? recipients.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          String(r.role).toLowerCase().includes(q) ||
          String(r.team).toLowerCase().includes(q) ||
          String(r.storesLabel).toLowerCase().includes(q)
      )
    : recipients;

  return (
    <PanelFrame className="ring-1 ring-[var(--acc-200)]/50">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h4 className={`${appLabel} !mb-1 !pb-2`}>{num}. 配信先の最終確認</h4>
          <p className={`${appText.meta} leading-relaxed`}>
            条件に一致した方を一覧表示しています。タップで配信対象から外せます（再度タップで戻せます）。
          </p>
        </div>
        <span className={`shrink-0 ${appText.badgeNum} font-semibold text-[var(--acc-700)] bg-[var(--acc-50)] border border-[var(--acc-200)]/60 px-2.5 py-1 rounded-full`}>
          {includedCount}/{recipients.length}
        </span>
      </div>

      {recipients.length === 0 ? (
        <p className={`${appText.meta} text-rose-600 text-center py-4 leading-relaxed`}>
          条件に一致する社員がいません。役職・チーム・店舗を見直してください。
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => onSetAllIncluded(true)}
              className={`${appChipBase} !min-h-[2rem] !text-xs ${appChipOn}`}
            >
              すべて配信に含める
            </button>
            <button
              type="button"
              onClick={() => onSetAllIncluded(false)}
              className={`${appChipBase} !min-h-[2rem] !text-xs ${appChipOff}`}
            >
              すべて外す
            </button>
          </div>
          {recipients.length > 8 && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="名前・メール・役職で絞り込み"
              className={`${brutalInput} py-2.5 mb-3 text-sm`}
            />
          )}
          <ul className="max-h-72 overflow-y-auto overscroll-contain space-y-2 pr-0.5 border-t border-slate-100 pt-3">
            {filtered.length === 0 ? (
              <li className={`${appText.meta} text-center py-6 text-slate-500`}>検索に一致する方がいません</li>
            ) : (
              filtered.map((r) => {
                const key = normalizeRecipientEmail(r.email);
                const on = !excluded.has(key);
                return (
                  <li key={r.email}>
                    <button
                      type="button"
                      onClick={() => onToggle(r.email)}
                      className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
                        on
                          ? 'border-[var(--acc-300)] bg-[var(--acc-50)]/80'
                          : 'border-slate-200 bg-slate-100 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p
                            className={`${appText.body} font-bold truncate ${
                              on ? 'text-slate-900' : 'text-slate-500 line-through decoration-slate-400'
                            }`}
                          >
                            {r.name}
                          </p>
                          <p className={`${appText.meta} mt-0.5 truncate ${on ? 'text-slate-600' : 'text-slate-400'}`}>
                            {r.role}
                            {r.team && r.team !== '—' ? ` · ${r.team}` : ''}
                            {r.storesLabel !== '—' ? ` · ${r.storesLabel}` : ''}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-md ${
                            on ? 'bg-[var(--acc-500)] text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {on ? '配信' : '除外'}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {includedCount === 0 && (
            <p className={`${appText.meta} text-rose-600 text-center mt-3 leading-relaxed`}>
              配信対象が0名です。1名以上「配信」にしてください。
            </p>
          )}
        </>
      )}
    </PanelFrame>
  );
}

/** 役職・チームなどの複数選択（チップ＋トグル） */
function SelectionBlock({ num, title, hint, allLabel, items, selected, onChangeSelected }) {
  const allSelected = items.length > 0 && selected.length === items.length;
  const count = selected.length;

  const setAll = (on) => onChangeSelected(on ? [...items] : []);

  const toggle = (item) => {
    if (selected.includes(item)) onChangeSelected(selected.filter((x) => x !== item));
    else onChangeSelected([...selected, item]);
  };

  return (
    <PanelFrame>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h4 className={`${appLabel} !mb-1 !pb-2`}>{num}. {title}</h4>
          {hint && <p className={`${appText.meta} leading-relaxed`}>{hint}</p>}
        </div>
        <span className={`shrink-0 ${appText.badgeNum} font-semibold text-[var(--acc-700)] bg-[var(--acc-50)] border border-[var(--acc-200)]/60 px-2.5 py-1 rounded-full`}>
          {count}/{items.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setAll(!allSelected)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl mb-3 transition-all duration-200 ${
          allSelected
            ? 'bg-[var(--acc-500)] text-white shadow-md shadow-[var(--acc-500)]/25'
            : 'bg-slate-100/80 text-slate-800 border border-black/[0.04]'
        }`}
      >
        <span className={appText.btn}>{allLabel}</span>
        <span
          className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${allSelected ? 'bg-white/25' : 'bg-slate-300/70'}`}
          aria-hidden
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${allSelected ? 'left-[22px]' : 'left-0.5'}`}
          />
        </span>
      </button>

      <div className={`${appChipArena} border border-black/[0.06]`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {items.map((item) => {
            const on = selected.includes(item);
            return (
              <label
                key={item}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                  on
                    ? 'bg-[var(--acc-50)] border-[var(--acc-300)] text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(item)}
                  className="w-4.5 h-4.5 accent-[var(--acc-600)] shrink-0"
                />
                <span className="flex-1 text-sm font-bold leading-5">{item}</span>
              </label>
            );
          })}
        </div>
      </div>
    </PanelFrame>
  );
}

export default function App() {
  const [authStep, setAuthStep] = useState('loading'); 
  const [inputEmail, setInputEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tempUser, setTempUser] = useState(null); 
  const [currentUser, setCurrentUser] = useState(null);
  
  const [allEmployees, setAllEmployees] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [regData, setRegData] = useState(emptyRegData);
  /** create=新規登録 / edit=ログイン情報の変更 */
  const [regMode, setRegMode] = useState('create');

  const [appEntry] = useState(() => readAppEntryFromUrl());
  const [checklistOnlyMode, setChecklistOnlyMode] = useState(() => appEntry.checklistOnlyMode);
  const [activeTab, setActiveTab] = useState(() => appEntry.initialTab);
  const [screenTransition, setScreenTransition] = useState('fade');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const navigateTab = (tab) => {
    if (checklistOnlyMode && tab !== 'checklist') return;
    setScreenTransition(tab === 'home' ? 'back' : activeTab === 'home' ? 'forward' : 'fade');
    setActiveTab(tab);
    setIsAccountMenuOpen(false);
  };

  const screenAnimClass =
    screenTransition === 'forward' ? 'app-screen-forward' : screenTransition === 'back' ? 'app-screen-back' : 'app-screen-fade';

  const accountInitial = (currentUser?.name || '?').trim().charAt(0) || '?';
  const [accentId, setAccentId] = useState('indigo');

  useEffect(() => {
    const id = readStoredAccentId();
    setAccentId(id);
    applyAccentTheme(id);
  }, []);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  /** リストチェック: 選択中の店舗（空＝全店。複数タップで OR 絞り込み） */
  const [selectedChecklistStores, setSelectedChecklistStores] = useState([]);
  const [taskTab, setTaskTab] = useState('active');
  /** リストチェック: すべて / 社員依頼 / 店舗依頼 / TFチーム依頼 */
  const [checklistKindFilter, setChecklistKindFilter] = useState('all');

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, task: null, step: 'confirm' });
  /** 店舗依頼: 担当店舗をまとめて完了する確認 */
  const [storeBulkModal, setStoreBulkModal] = useState({ isOpen: false, task: null, step: 'confirm', bulkCount: 0 });
  const [completingStoreKey, setCompletingStoreKey] = useState(null);
  const [actionToast, setActionToast] = useState(null);
  const actionToastTimerRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showActionToast = useCallback((message) => {
    if (!message) return;
    if (actionToastTimerRef.current) clearTimeout(actionToastTimerRef.current);
    const id = Date.now();
    setActionToast({ id, message });
    actionToastTimerRef.current = setTimeout(() => {
      setActionToast((cur) => (cur && cur.id === id ? null : cur));
    }, 2600);
  }, []);

  useEffect(() => () => {
    if (actionToastTimerRef.current) clearTimeout(actionToastTimerRef.current);
  }, []);

  const [requestSelectedStores, setRequestSelectedStores] = useState([]);
  const [requestSelectedRoles, setRequestSelectedRoles] = useState(ROLES);
  const [requestSelectedTeams, setRequestSelectedTeams] = useState(TEAMS);
  /** 新規投稿：配信先一覧で除外したメール（小文字） */
  const [requestRecipientExcluded, setRequestRecipientExcluded] = useState([]);
  const [requestForm, setRequestForm] = useState({ content: '', deadline: '', urls: [''] });
  const [requestImages, setRequestImages] = useState([]);
  const [requestKind, setRequestKind] = useState(REQUEST_KIND.employee);

  const [sentTasks, setSentTasks] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  
  const [scheduleDate, setScheduleDate] = useState('1');
  const [scheduleForm, setScheduleForm] = useState({ deadlineOffset: '月末', content: '', urls: [''] });
  /** チェック時は初回の今月分タスクを作らず、翌月の定期配信からのみ開始 */
  const [scheduleSkipInitialMonth, setScheduleSkipInitialMonth] = useState(false);
  /** 編集中の定期配信ID（null なら新規登録） */
  const [scheduleEditingId, setScheduleEditingId] = useState(null);
  const [scheduleImages, setScheduleImages] = useState([]); 
  const [scheduleSelectedStores, setScheduleSelectedStores] = useState([]);
  const [scheduleSelectedRoles, setScheduleSelectedRoles] = useState(ROLES);
  const [scheduleSelectedTeams, setScheduleSelectedTeams] = useState(TEAMS);
  /** 定期配信：配信先一覧で除外したメール（小文字） */
  const [scheduleRecipientExcluded, setScheduleRecipientExcluded] = useState([]);
  const [scheduleRequestKind, setScheduleRequestKind] = useState(REQUEST_KIND.employee);

  const targetListParams = useMemo(
    () => ({ allEmployees, rolesList: ROLES, teamsList: TEAMS }),
    [allEmployees]
  );

  const requestRecipientCandidates = useMemo(
    () =>
      computeTargetRecipientsList({
        requestKind,
        selectedStores: requestSelectedStores,
        selectedRoles: requestSelectedRoles,
        selectedTeams: requestSelectedTeams,
        ...targetListParams,
      }),
    [
      requestKind,
      requestSelectedStores,
      requestSelectedRoles,
      requestSelectedTeams,
      targetListParams,
    ]
  );

  const scheduleRecipientCandidates = useMemo(
    () =>
      computeTargetRecipientsList({
        requestKind: scheduleRequestKind,
        selectedStores: scheduleSelectedStores,
        selectedRoles: scheduleSelectedRoles,
        selectedTeams: scheduleSelectedTeams,
        ...targetListParams,
      }),
    [
      scheduleRequestKind,
      scheduleSelectedStores,
      scheduleSelectedRoles,
      scheduleSelectedTeams,
      targetListParams,
    ]
  );

  useEffect(() => {
    const valid = new Set(requestRecipientCandidates.map((r) => normalizeRecipientEmail(r.email)));
    setRequestRecipientExcluded((prev) => prev.filter((e) => valid.has(e)));
  }, [requestRecipientCandidates]);

  useEffect(() => {
    const valid = new Set(scheduleRecipientCandidates.map((r) => normalizeRecipientEmail(r.email)));
    setScheduleRecipientExcluded((prev) => prev.filter((e) => valid.has(e)));
  }, [scheduleRecipientCandidates]);

  const todayForMin = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

  useEffect(() => {
    applyAppEntry(readAppEntryFromUrl(), setChecklistOnlyMode, setActiveTab);
    fetchAppEntryFromGas((entry) => applyAppEntry(entry, setChecklistOnlyMode, setActiveTab));
  }, []);

  useEffect(() => {
    Promise.all([api.fetchEmployees(), api.fetchStoreData()]).then(([employees, stores]) => {
      const emps = Array.isArray(employees) ? employees : [];
      setAllEmployees(emps);
      const strData = Array.isArray(stores) ? stores : [];
      setAllStores(strData);
      
      const allStoreNames = getFieldStoreNames(strData);
      setRequestSelectedStores(allStoreNames);
      setScheduleSelectedStores(allStoreNames);

      const savedEmail = localStorage.getItem('taskmaster_user_email');
      const user = emps.find(e => e.email === savedEmail);
      if (user) { setCurrentUser(user); setAuthStep('ready'); } else { setAuthStep('login'); }
    }).catch(() => setAuthStep('login'));
  }, []);

  const refreshChecklistTasks = useCallback(
    (opts = {}) => {
      const { silent = false } = opts;
      if (!currentUser?.email) return;
      if (!silent) setTasksLoading(true);
      api
        .fetchTasksForUser(currentUser.email)
        .then((data) => {
          setTasks(Array.isArray(data) ? data : []);
          if (!silent) setTasksLoading(false);
        })
        .catch(() => {
          if (!silent) setTasksLoading(false);
        });
    },
    [currentUser?.email]
  );

  const refreshSentTasks = useCallback(() => {
    if (!currentUser?.name) return;
    api.getSentTasks(currentUser.name).then((res) => setSentTasks(Array.isArray(res) ? res : []));
  }, [currentUser?.name]);

  const refreshScheduledTasks = useCallback(() => {
    if (!currentUser?.name) return;
    api.getScheduledTasks(currentUser.name).then((res) => setScheduledTasks(Array.isArray(res) ? res : []));
  }, [currentUser?.name]);

  const refreshAllAppData = useCallback(() => {
    if (!currentUser?.email) return;
    setTasksLoading(true);
    api
      .fetchAppDataForUser(currentUser.email, currentUser.name)
      .then((data) => {
        setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
        setSentTasks(Array.isArray(data?.sentTasks) ? data.sentTasks : []);
        setScheduledTasks(Array.isArray(data?.scheduledTasks) ? data.scheduledTasks : []);
        setTasksLoading(false);
      })
      .catch(() => setTasksLoading(false));
  }, [currentUser?.email, currentUser?.name]);

  useEffect(() => {
    if (authStep === 'ready' && currentUser) refreshAllAppData();
  }, [authStep, currentUser, refreshAllAppData]);

  useEffect(() => {
    if (authStep !== 'ready' || !currentUser) return;
    if (activeTab === 'repost') refreshSentTasks();
  }, [activeTab, authStep, currentUser, refreshSentTasks]);

  useEffect(() => {
    if (authStep !== 'ready' || !currentUser) return;
    if (activeTab === 'scheduled') refreshScheduledTasks();
  }, [activeTab, authStep, currentUser, refreshScheduledTasks]);

  useEffect(() => {
    if (checklistKindFilter === 'employee') setSelectedChecklistStores([]);
  }, [checklistKindFilter]);

  const checklistUserStores = useMemo(() => asUserStoreList(currentUser?.stores), [currentUser?.stores]);

  const activeTasksCount = tasks.filter((t) =>
    shouldIncludeTaskInChecklistTab(t, 'active', checklistUserStores, [])
  ).length;
  const completedTasksCount = tasks.filter((t) =>
    shouldIncludeTaskInChecklistTab(t, 'completed', checklistUserStores, [])
  ).length;
  const requestedTasksProgress = tasks.length === 0 ? 0 : Math.round((completedTasksCount / tasks.length) * 100);
  const userTeams = useMemo(() => parseEmployeeTeams(currentUser?.team), [currentUser?.team]);
  const teamProgressBanners = useMemo(() => {
    if (!userTeams.length) return [];
    const uniq = [...new Set(userTeams)];
    return uniq.map((name) => ({ key: name, label: name + 'チーム進捗管理ダッシュボード' }));
  }, [userTeams]);
  const isDxAdmin = useMemo(() => userTeams.includes('DX'), [userTeams]);

  const openProgressPage = useCallback((teamName) => {
    const baseUrl = (typeof window !== 'undefined' && window.__TM_EXEC_BASE__)
      ? String(window.__TM_EXEC_BASE__)
      : (window.location.href || '').split('#')[0].split('?')[0];
    const qs = new URLSearchParams({ page: 'progress' });
    if (teamName) qs.set('team', teamName);
    window.open(`${baseUrl}?${qs.toString()}`, '_blank', 'noopener,noreferrer');
  }, []);
  const openAdminPage = useCallback(() => {
    const baseUrl = (typeof window !== 'undefined' && window.__TM_EXEC_BASE__)
      ? String(window.__TM_EXEC_BASE__)
      : (window.location.href || '').split('#')[0].split('?')[0];
    const qs = new URLSearchParams({ page: 'admin' });
    window.open(`${baseUrl}?${qs.toString()}`, '_blank', 'noopener,noreferrer');
  }, []);

  const toggleChecklistStore = (storeName) => {
    setSelectedChecklistStores((prev) =>
      prev.includes(storeName) ? prev.filter((s) => s !== storeName) : [...prev, storeName]
    );
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const rk = normalizeRequestKind(t.requestKind);
      const storeMatch = taskMatchesChecklistStoreSelection(t, selectedChecklistStores, allStores, checklistUserStores);
      const tabMatch = shouldIncludeTaskInChecklistTab(t, taskTab, checklistUserStores, selectedChecklistStores);
      const kindMatch = checklistKindFilter === 'all' || checklistKindFilter === rk;
      return storeMatch && tabMatch && kindMatch;
    });
  }, [tasks, selectedChecklistStores, taskTab, allStores, checklistKindFilter, checklistUserStores]);

  const checklistTabTasks = useMemo(() => {
    return tasks.filter((t) => shouldIncludeTaskInChecklistTab(t, taskTab, checklistUserStores, selectedChecklistStores));
  }, [tasks, taskTab, checklistUserStores, selectedChecklistStores]);

  const checklistKindCounts = useMemo(() => {
    const all = checklistTabTasks.length;
    const emp = checklistTabTasks.filter((t) => normalizeRequestKind(t.requestKind) === REQUEST_KIND.employee).length;
    const sto = checklistTabTasks.filter((t) => normalizeRequestKind(t.requestKind) === REQUEST_KIND.store).length;
    const tf = checklistTabTasks.filter((t) => normalizeRequestKind(t.requestKind) === REQUEST_KIND.tf).length;
    return { all, employee: emp, store: sto, tf };
  }, [checklistTabTasks]);

  /** 未実施/実施済みタブ + 依頼種別フィルタまで反映したタスク（店舗チップの件数用） */
  const tasksMatchingChecklistKind = useMemo(() => {
    return tasks.filter((t) => {
      if (!shouldIncludeTaskInChecklistTab(t, taskTab, checklistUserStores, selectedChecklistStores)) return false;
      const rk = normalizeRequestKind(t.requestKind);
      return checklistKindFilter === 'all' || checklistKindFilter === rk;
    });
  }, [tasks, taskTab, checklistKindFilter, checklistUserStores, selectedChecklistStores]);

  /** 件数0の店舗チップは選択解除（タップ不可店舗を残さない） */
  useEffect(() => {
    if (checklistKindFilter === 'employee' || checklistKindFilter === 'tf') return;
    setSelectedChecklistStores((prev) => {
      const next = prev.filter(
        (s) => countChecklistTasksForStoreChip(tasksMatchingChecklistKind, s, taskTab, checklistUserStores) > 0
      );
      return next.length === prev.length ? prev : next;
    });
  }, [tasks, taskTab, checklistKindFilter, checklistUserStores, tasksMatchingChecklistKind]);

  const handleLoginSearch = (e) => {
    e.preventDefault();
    setLoginError('');
    const email = normalizeEmail(inputEmail);
    if (!email) {
      setLoginError('メールアドレスを入力してください。');
      return;
    }
    const user = allEmployees.find((emp) => normalizeEmail(emp.email) === email);
    if (user) {
      setTempUser(user);
      setAuthStep('confirm');
    } else {
      if (!isCorpEmail(email)) {
        setLoginError(`新規登録は社内メール（${CORP_EMAIL_DOMAIN}）のみご利用いただけます。`);
        return;
      }
      setRegMode('create');
      setRegData(emptyRegData());
      setTempUser({ email });
      setAuthStep('register');
    }
  };

  const handleStartEditProfile = () => {
    setLoginError('');
    const email = normalizeEmail(inputEmail);
    if (!email) {
      setLoginError('メールアドレスを入力してください。');
      return;
    }
    const user = allEmployees.find((emp) => normalizeEmail(emp.email) === email);
    if (!user) {
      setLoginError('このメールは未登録です。「ログイン / 新規登録」から登録してください。');
      return;
    }
    setRegMode('edit');
    setRegData(parseEmployeeToRegData(user, allStores));
    setTempUser(user);
    setAuthStep('register');
  };

  const handleConfirmLogin = () => {
    localStorage.setItem('taskmaster_user_email', tempUser.email);
    setCurrentUser(tempUser);
    setAuthStep('ready');
  };

  const toggleTeam = (teamName) => setRegData(p => ({ ...p, team: p.team.includes(teamName) ? p.team.filter(t => t !== teamName) : [...p.team, teamName] }));

  const mergeRegStores = (base, added) => {
    const merged = [...new Set([...base, ...added])];
    if (merged.length > MAX_EMPLOYEE_STORES) {
      alert(`管轄店舗は最大${MAX_EMPLOYEE_STORES}店舗まで選択できます。テリトリー単位で絞るか、不要な店舗を外してください。`);
      return null;
    }
    return merged;
  };

  const toggleRegStore = (storeName) => {
    setRegData((prev) => {
      const isSelected = prev.stores.includes(storeName);
      if (!isSelected && prev.stores.length >= MAX_EMPLOYEE_STORES) {
        alert(`管轄店舗は最大${MAX_EMPLOYEE_STORES}店舗まで選択できます。`);
        return prev;
      }
      return {
        ...prev,
        stores: isSelected ? prev.stores.filter((s) => s !== storeName) : [...prev.stores, storeName],
      };
    });
  };

  const toggleArea = (areaName) => setRegData(prev => {
    const isSelected = prev.area.includes(areaName);
    const newArea = isSelected ? prev.area.filter(a => a !== areaName) : [...prev.area, areaName];
    const newTerritory = { ...prev.territory };
    
    let newStores = [...prev.stores];
    if (isSelected) { 
      delete newTerritory[areaName]; 
      const areaStores = getFieldStores(allStores).filter(s => s.area === areaName).map(s => s.storeName);
      newStores = newStores.filter(s => !areaStores.includes(s));
    } else { 
      newTerritory[areaName] = getTerritoriesForArea(areaName, allStores); 
      const addedStores = getFieldStores(allStores).filter(s => s.area === areaName && newTerritory[areaName].includes(s.territory)).map(s => s.storeName);
      const merged = mergeRegStores(newStores, addedStores);
      if (!merged) return prev;
      newStores = merged;
    }
    return { ...prev, hqAffiliation: false, area: newArea, territory: newTerritory, stores: newStores };
  });

  const toggleHqAffiliation = () => setRegData((prev) => {
    if (prev.hqAffiliation) {
      return { ...prev, hqAffiliation: false, area: [], territory: {}, stores: [] };
    }
    return { ...prev, hqAffiliation: true, area: [], territory: {}, stores: [HQ_STORE] };
  });

  const toggleTerritory = (areaName, terrName) => setRegData(prev => {
    const terrs = prev.territory[areaName] || [];
    const isSelected = terrs.includes(terrName);
    const newTerrs = isSelected ? terrs.filter(t => t !== terrName) : [...terrs, terrName].sort();
    
    let newStores = [...prev.stores];
    if (isSelected) {
      const removedStores = allStores.filter(s => s.area === areaName && s.territory === terrName).map(s => s.storeName);
      newStores = newStores.filter(s => !removedStores.includes(s));
    } else {
      const addedStores = allStores.filter(s => s.area === areaName && s.territory === terrName).map(s => s.storeName);
      const merged = mergeRegStores(newStores, addedStores);
      if (!merged) return prev;
      newStores = merged;
    }

    return { ...prev, territory: { ...prev.territory, [areaName]: newTerrs }, stores: newStores };
  });

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const newEmail = normalizeEmail(tempUser?.email || inputEmail);
    if (!isCorpEmail(newEmail)) {
      alert(`新規登録は社内メール（${CORP_EMAIL_DOMAIN}）のみご利用いただけます。`);
      return;
    }
    if (!regData.role) return alert('役職を選択してください。');
    if (regData.team.length === 0) return alert('チーム名は選択必須です。');
    if (!regData.hqAffiliation && regData.area.length === 0) {
      return alert('エリアを選択するか、EAST本部所属を選んでください。');
    }
    setIsSubmitting(true);
    const formattedTeam = regData.team.join(', ');
    let formattedArea;
    let formattedTerritory;
    let finalStores;
    if (regData.hqAffiliation) {
      formattedArea = HQ_AREA;
      formattedTerritory = '';
      finalStores = [HQ_STORE];
    } else {
      formattedArea = regData.area.join(', ');
      formattedTerritory = Object.entries(regData.territory).filter(([_, ts]) => ts.length > 0).map(([a, ts]) => `${a}: ${ts.join(',')}`).join(' / ');
      const validStoreNames = getFieldStores(allStores).filter(s => regData.area.includes(s.area) && (regData.territory[s.area] || []).includes(s.territory)).map(s => s.storeName);
      finalStores = regData.stores.filter(s => validStoreNames.includes(s));
    }
    if (finalStores.length > MAX_EMPLOYEE_STORES) {
      alert(`管轄店舗は最大${MAX_EMPLOYEE_STORES}店舗まで登録できます。担当範囲をご確認ください。`);
      setIsSubmitting(false);
      return;
    }

    const newEmployee = { ...regData, team: formattedTeam, area: formattedArea, territory: formattedTerritory, email: newEmail, stores: finalStores, role: regData.role };

    try {
      if (regMode === 'edit') {
        const res = await api.updateEmployee(newEmployee);
        if (res?.status === 'error') {
          alert(res.message || '保存に失敗しました');
          return;
        }
        setAllEmployees((prev) =>
          prev.map((e) => (normalizeEmail(e.email) === newEmail ? newEmployee : e))
        );
        setTempUser(newEmployee);
        if (currentUser && normalizeEmail(currentUser.email) === newEmail) {
          setCurrentUser(newEmployee);
        }
        alert('ログイン情報を更新しました！');
        setAuthStep('confirm');
      } else {
        const res = await api.registerEmployee(newEmployee);
        if (res?.status === 'error') {
          alert(res.message || '登録に失敗しました');
          return;
        }
        alert('登録が完了しました！');
        setAllEmployees((prev) => [...prev, newEmployee]);
        setCurrentUser(newEmployee);
        localStorage.setItem('taskmaster_user_email', newEmployee.email);
        setAuthStep('ready');
      }
    } catch (err) {
      alert(regMode === 'edit' ? '保存に失敗しました' : '登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('ログアウトしますか？')) {
      localStorage.removeItem('taskmaster_user_email');
      setAuthStep('login');
      setInputEmail('');
    }
  };

  const handleRequestUrlChange = (index, value) => {
    const newUrls = [...requestForm.urls];
    newUrls[index] = value;
    setRequestForm({ ...requestForm, urls: newUrls });
  };
  const handleScheduleUrlChange = (index, value) => {
    const newUrls = [...scheduleForm.urls];
    newUrls[index] = value;
    setScheduleForm({ ...scheduleForm, urls: newUrls });
  };

  const handleImageChange = (e, formType) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';

    const append = (item) => {
      if (formType === 'request') {
        setRequestImages((prev) => (prev.length < MAX_ATTACHMENTS ? [...prev, item] : prev));
      } else {
        setScheduleImages((prev) => (prev.length < MAX_ATTACHMENTS ? [...prev, item] : prev));
      }
    };

    files.forEach((file) => {
      if (!file) return;

      if (isZipFile(file)) {
        alert('ZIPファイルは下の「ZIPを追加」から添付してください。');
        return;
      }

      if (isPdfFile(file)) {
        if (file.size > MAX_BINARY_ATTACHMENT_BYTES) {
          alert(`PDFは${MAX_BINARY_ATTACHMENT_BYTES / (1024 * 1024)}MB以下にしてください: ${file.name}`);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          if (typeof dataUrl !== 'string') return;
          const parts = dataUrl.split(',');
          const base64 = parts[1];
          if (!base64) return;
          append({
            name: file.name,
            type: 'application/pdf',
            base64,
            preview: dataUrl,
            isPdf: true
          });
        };
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const el = new Image();
        el.onload = () => {
          let canvas = document.createElement('canvas');
          let width = el.width;
          let height = el.height;
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(el, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          append({
            name: file.name,
            type: 'image/jpeg',
            base64: dataUrl.split(',')[1],
            preview: dataUrl
          });
        };
        el.onerror = () => alert(`画像として読み込めませんでした: ${file.name}`);
        el.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleZipChange = (e, formType) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';

    const append = (item) => {
      if (formType === 'request') {
        setRequestImages((prev) => (prev.length < MAX_ATTACHMENTS ? [...prev, item] : prev));
      } else {
        setScheduleImages((prev) => (prev.length < MAX_ATTACHMENTS ? [...prev, item] : prev));
      }
    };

    files.forEach((file) => {
      if (!file) return;
      if (!isZipFile(file)) {
        alert('ZIPファイルを選択してください。');
        return;
      }
      if (file.size > MAX_BINARY_ATTACHMENT_BYTES) {
        alert(`ZIPは${MAX_BINARY_ATTACHMENT_BYTES / (1024 * 1024)}MB以下にしてください: ${file.name}`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== 'string') return;
        const base64 = dataUrl.split(',')[1];
        if (!base64) return;
        append({
          name: file.name,
          type: 'application/zip',
          base64,
          preview: null,
          isZip: true,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index, formType) => {
    if (formType === 'request') setRequestImages(prev => prev.filter((_, i) => i !== index));
    else setScheduleImages(prev => prev.filter((_, i) => i !== index));
  };

  const buildTeamTag = (selectedTeams) => {
    if (!selectedTeams?.length || selectedTeams.length >= TEAMS.length) return '';
    return `〈${selectedTeams.join(', ')}〉`;
  };

  const generateTargetTags = (kind, selectedStoreNames, selectedRoles, selectedTeams) => {
    const teamTag = buildTeamTag(selectedTeams);
    const rk = normalizeRequestKind(kind);

    if (rk === REQUEST_KIND.tf) {
      if (!teamTag) return 'TFチーム（全チーム）';
      return `TF${teamTag}`;
    }

    if (rk === REQUEST_KIND.employee) {
      const roleTag =
        selectedRoles.length < ROLES.length ? `[${selectedRoles.join(', ')}]` : '';
      return roleTag ? `全店 ${roleTag}`.trim() : '全店';
    }

    if (selectedStoreNames.length === 0) return '指定なし';
    const fieldStoreNames = getFieldStoreNames(allStores);
    if (selectedStoreNames.length === fieldStoreNames.length && fieldStoreNames.length > 0) return '全店';
    const tags = [];
    AREAS.forEach((area) => {
      const storesInArea = getFieldStores(allStores).filter((s) => s.area === area).map((s) => s.storeName);
      if (storesInArea.length === 0) return;
      const selectedInArea = storesInArea.filter((s) => selectedStoreNames.includes(s));
      if (selectedInArea.length > 0) {
        if (selectedInArea.length === storesInArea.length) tags.push(area);
        else tags.push(...selectedInArea);
      }
    });
    return tags.length ? tags.join(', ') : '指定なし';
  };

  const validateTargetSelection = (kind, { roles, teams, stores }) => {
    const rk = normalizeRequestKind(kind);
    if (rk === REQUEST_KIND.employee) {
      if (!roles.length) return '配信先の役職を少なくとも1つ選択してください。';
      return null;
    }
    if (rk === REQUEST_KIND.tf && !teams.length) {
      return '配信先のチームを少なくとも1つ選択してください。';
    }
    if (rk === REQUEST_KIND.store && !stores.length) {
      return '配信先の店舗を少なくとも1つ選択してください。';
    }
    return null;
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    const targetErr = validateTargetSelection(requestKind, {
      roles: requestSelectedRoles,
      teams: requestSelectedTeams,
      stores: requestSelectedStores,
    });
    if (targetErr) return alert(targetErr);

    const includedRecipients = filterRecipientsByExclusions(
      requestRecipientCandidates,
      requestRecipientExcluded
    );
    if (requestRecipientCandidates.length === 0) {
      const rkEmpty = normalizeRequestKind(requestKind);
      const emptyMsg =
        rkEmpty === REQUEST_KIND.employee
          ? '配信先となる社員がいません。役職の選択を見直してください。'
          : rkEmpty === REQUEST_KIND.store
            ? '配信先となる社員がいません。店舗の選択を見直してください。'
            : '配信先となる社員がいません。チームの選択を見直してください。';
      return alert(emptyMsg);
    }
    if (includedRecipients.length === 0) {
      return alert('配信対象が0名です。配信先の最終確認で1名以上を「配信」にしてください。');
    }

    setIsSubmitting(true);
    const targetEmails = includedRecipients.map((r) => r.email);

    const validUrls = requestForm.urls.filter(u => u.trim() !== '');
    const finalTagsStr = generateTargetTags(
      requestKind,
      requestKind === REQUEST_KIND.store ? requestSelectedStores : getFieldStoreNames(allStores),
      requestSelectedRoles,
      requestSelectedTeams
    );

    try {
      const result = await api.createTask({
        type: '新規投稿',
        content: requestForm.content,
        deadline: requestForm.deadline,
        urls: validUrls, 
        sender: currentUser ? currentUser.name : "管理者",
        targets: targetEmails,
        targetTags: finalTagsStr,
        requestKind,
        images: requestImages.map((img) =>
          img.reuseUrl
            ? { name: img.name, type: img.type || 'image/jpeg', reuseUrl: img.reuseUrl }
            : { name: img.name, type: img.type, base64: img.base64 }
        )
      });
      let okMsg = 'タスクを配信しました！対象者に通知されます。';
      if (result.driveErrors && result.driveErrors.length) {
        okMsg += '\n\n【添付ファイルの保存に失敗したものがあります】\n' + result.driveErrors.join('\n');
      }
      alert(okMsg);
      setRequestForm({ content: '', deadline: '', urls: [''] });
      setRequestImages([]);
      setRequestKind(REQUEST_KIND.employee);
      setRequestSelectedStores(getFieldStoreNames(allStores));
      setRequestSelectedRoles(ROLES);
      setRequestRecipientExcluded([]);
      setActiveTab('home');
      refreshChecklistTasks({ silent: true });
      refreshSentTasks();
    } catch (error) { alert('送信失敗: ' + formatGasError(error)); } finally { setIsSubmitting(false); }
  };

  const handleRepostClick = (task) => {
    let storedUrls = [''];
    if (Array.isArray(task.urls) && task.urls.length > 0) {
      storedUrls = [...task.urls];
    } else if (typeof task.url === 'string' && task.url) {
      storedUrls = task.url.split('\n').filter(Boolean);
    }
    if (storedUrls.length === 0) storedUrls = [''];

    const repostImages = [];
    if (Array.isArray(task.images)) {
      task.images.forEach((url, idx) => {
        const item = attachmentFromStoredUrl_(url, idx);
        if (item) repostImages.push(item);
      });
    }

    const derived =
      Array.isArray(task.targets) && task.targets.length > 0
        ? deriveStoresAndRolesFromTargets(task.targets, allEmployees, getFieldStoreNames(allStores), ROLES, TEAMS)
        : null;
    const { stores, roles, teams } = derived || parseTargetTagsToSelection(task.targetTags, allStores, AREAS, ROLES, TEAMS);

    const deadlineInput =
      task.deadline && /^\d{4}-\d{2}-\d{2}$/.test(String(task.deadline).trim())
        ? String(task.deadline).trim()
        : '';

    setRequestForm({ content: task.content, deadline: deadlineInput, urls: storedUrls });
    setRequestImages(repostImages);
    const rk = normalizeRequestKind(task.requestKind);
    setRequestKind(rk);
    setRequestSelectedStores(stores);
    setRequestSelectedRoles(roles);
    setRequestSelectedTeams(teams);
    const candidates = computeTargetRecipientsList({
      requestKind: rk,
      selectedStores: stores,
      selectedRoles: roles,
      selectedTeams: teams,
      allEmployees,
      rolesList: ROLES,
      teamsList: TEAMS,
    });
    setRequestRecipientExcluded(excludedEmailsFromSavedTargets(candidates, task.targets));
    setActiveTab('request');
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    const targetErr = validateTargetSelection(scheduleRequestKind, {
      roles: scheduleSelectedRoles,
      teams: scheduleSelectedTeams,
      stores: scheduleSelectedStores,
    });
    if (targetErr) return alert(targetErr);

    const includedRecipients = filterRecipientsByExclusions(
      scheduleRecipientCandidates,
      scheduleRecipientExcluded
    );
    if (scheduleRecipientCandidates.length === 0) {
      const rkEmpty = normalizeRequestKind(scheduleRequestKind);
      const emptyMsg =
        rkEmpty === REQUEST_KIND.employee
          ? '配信先となる社員がいません。役職の選択を見直してください。'
          : rkEmpty === REQUEST_KIND.store
            ? '配信先となる社員がいません。店舗の選択を見直してください。'
            : '配信先となる社員がいません。チームの選択を見直してください。';
      return alert(emptyMsg);
    }
    if (includedRecipients.length === 0) {
      return alert('配信対象が0名です。配信先の最終確認で1名以上を「配信」にしてください。');
    }

    setIsSubmitting(true);
    const targetEmails = includedRecipients.map((r) => r.email);

    const validUrls = scheduleForm.urls.filter(u => u.trim() !== '');
    const finalTagsStr = generateTargetTags(
      scheduleRequestKind,
      scheduleRequestKind === REQUEST_KIND.store ? scheduleSelectedStores : getFieldStoreNames(allStores),
      scheduleSelectedRoles,
      scheduleSelectedTeams
    );
    const cycleString = `毎月 ${scheduleDate}日 ${SCHEDULE_DELIVERY_TIME}`;
    const scheduleImagePayload = scheduleImages.map((img) =>
      img.reuseUrl
        ? { name: img.name, type: img.type || 'image/jpeg', reuseUrl: img.reuseUrl }
        : { name: img.name, type: img.type, base64: img.base64 }
    );

    try {
      if (scheduleEditingId) {
        const upd = await api.updateScheduledTask(scheduleEditingId, {
          sender: currentUser.name,
          cycle: cycleString,
          deadlineOffset: scheduleForm.deadlineOffset,
          content: scheduleForm.content,
          urls: validUrls,
          targetTags: finalTagsStr,
          targets: targetEmails,
          requestKind: scheduleRequestKind,
          images: scheduleImagePayload
        });
        let msg = '保存しました。次回の定期配信からこの内容で送信されます。';
        if (upd.driveErrors && upd.driveErrors.length) {
          msg += '\n\n【添付ファイルの保存に失敗したものがあります】\n' + upd.driveErrors.join('\n');
        }
        alert(msg);
      } else {
        const reg = await api.registerScheduledTask({
          sender: currentUser.name,
          cycle: cycleString,
          deadlineOffset: scheduleForm.deadlineOffset,
          content: scheduleForm.content,
          urls: validUrls,
          targetTags: finalTagsStr,
          targets: targetEmails,
          requestKind: scheduleRequestKind,
          images: scheduleImagePayload,
          skipInitialTask: scheduleSkipInitialMonth
        });
        let msg = 'スケジュールを登録しました！';
        if (reg.driveErrors && reg.driveErrors.length) {
          msg += '\n\n【添付ファイルの保存に失敗したものがあります】\n' + reg.driveErrors.join('\n');
        }
        alert(msg);
      }
      setScheduleEditingId(null);
      setScheduleForm({ deadlineOffset: '月末', content: '', urls: [''] });
      setScheduleSkipInitialMonth(false);
      setScheduleDate('1');
      setScheduleImages([]);
      setScheduleRequestKind(REQUEST_KIND.employee);
      setScheduleSelectedStores(getFieldStoreNames(allStores));
      setScheduleSelectedRoles(ROLES);
      setScheduleSelectedTeams(TEAMS);
      setScheduleRecipientExcluded([]);
      refreshScheduledTasks();
      refreshChecklistTasks({ silent: true });
    } catch (error) {
      alert((scheduleEditingId ? '保存に失敗しました: ' : '登録失敗: ') + formatGasError(error));
    } finally { setIsSubmitting(false); }
  };

  const handleEditScheduleClick = (task) => {
    setScheduleEditingId(task.id);
    setScheduleDate(parseCycleDayFromString(task.cycle));
    const urls = task.urls && task.urls.length > 0 ? [...task.urls] : [''];
    setScheduleForm({
      deadlineOffset: task.deadlineOffset || '月末',
      content: task.content || '',
      urls
    });
    const imgs = [];
    if (Array.isArray(task.images)) {
      task.images.forEach((url, idx) => {
        const item = attachmentFromStoredUrl_(url, idx);
        if (item) imgs.push(item);
      });
    }
    setScheduleImages(imgs);
    const derived =
      Array.isArray(task.targets) && task.targets.length > 0
        ? deriveStoresAndRolesFromTargets(task.targets, allEmployees, getFieldStoreNames(allStores), ROLES, TEAMS)
        : null;
    const { stores, roles, teams } = derived || parseTargetTagsToSelection(task.targetTags, allStores, AREAS, ROLES, TEAMS);
    const rk = normalizeRequestKind(task.requestKind);
    setScheduleSelectedStores(stores);
    setScheduleSelectedRoles(roles);
    setScheduleSelectedTeams(teams);
    setScheduleRequestKind(rk);
    const candidates = computeTargetRecipientsList({
      requestKind: rk,
      selectedStores: stores,
      selectedRoles: roles,
      selectedTeams: teams,
      allEmployees,
      rolesList: ROLES,
      teamsList: TEAMS,
    });
    setScheduleRecipientExcluded(excludedEmailsFromSavedTargets(candidates, task.targets));
    setScheduleSkipInitialMonth(false);
    setActiveTab('scheduled');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelScheduleEdit = () => {
    setScheduleEditingId(null);
    setScheduleForm({ deadlineOffset: '月末', content: '', urls: [''] });
    setScheduleSkipInitialMonth(false);
    setScheduleDate('1');
    setScheduleImages([]);
    setScheduleRequestKind(REQUEST_KIND.employee);
    setScheduleSelectedStores(getFieldStoreNames(allStores));
    setScheduleSelectedRoles(ROLES);
    setScheduleSelectedTeams(TEAMS);
    setScheduleRecipientExcluded([]);
  };

  const handleDeleteSchedule = async (id) => {
    if (window.confirm('この定期配信を削除（停止）しますか？')) {
      await api.deleteScheduledTask(id);
      refreshScheduledTasks();
    }
  };

  const openConfirmModal = (task) => {
    setConfirmModal({ isOpen: true, task: task, step: 'confirm' });
  };

  /** 店舗依頼: チェックリストに出す店舗 = 依頼対象 ∩ 自分の管轄のみ（他店舗は非表示） */
  const getMyStoreRowsForTask = (task) => {
    if (!isStoreRequestKind(task.requestKind)) return [];
    const full = getTaskTargetStoreNames(task).sort();
    const myStores = checklistUserStores;
    return full.filter((s) => myStores.indexOf(s) >= 0);
  };

  /** 未実施タブ: 担当店舗をすべて表示（完了分はグレー＋実施者・時刻）。実施済みタブ: 完了店舗のみ */
  const getVisibleStoreRowsForTask = (task) => {
    if (!isStoreRequestKind(task.requestKind)) return [];
    let names = getMyRelevantStoreNamesForTask(task, checklistUserStores);
    const sel = asUserStoreList(selectedChecklistStores);
    if (sel.length) names = names.filter((s) => sel.indexOf(s) >= 0);
    const sc = task.storeCompletions || {};
    if (taskTab === 'completed') {
      names = names.filter((s) => !!sc[s]);
    } else {
      names = [...names].sort((a, b) => {
        const ad = !!sc[a];
        const bd = !!sc[b];
        if (ad === bd) return a.localeCompare(b, 'ja');
        return ad ? 1 : -1;
      });
    }
    return names;
  };

  /** 店舗依頼: 自分がまだ完了していない担当店舗名（一覧・一括完了用） */
  const getMyIncompleteStoreNames = (task) =>
    getMyPendingStoreNamesForChecklist(task, checklistUserStores, selectedChecklistStores);

  const handleCompleteStoreCheckpoint = async (task, storeName) => {
    if (!currentUser?.email) return;
    const key = `${task.id}:${storeName}`;
    setCompletingStoreKey(key);
    try {
      const result = await api.completeTask(task.id, currentUser.email, storeName);
      if (result && result.success === false) {
        alert(result.message || '完了に失敗しました');
        return;
      }
      const userNorm = normalizeEmail(currentUser.email);
      const now = new Date();
      const pad2 = (n) => String(n).padStart(2, '0');
      const timeStr = `${pad2(now.getMonth() + 1)}/${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
      const nextCompletions = { ...(task.storeCompletions || {}), [storeName]: { at: timeStr, by: userNorm } };
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== task.id) return t;
          return applyStoreCompletionToTask(t, nextCompletions, checklistUserStores);
        })
      );
      showActionToast('完了しました');
    } catch (e) {
      alert(formatGasError(e));
    } finally {
      setCompletingStoreKey((k) => (k === key ? null : k));
    }
  };

  const executeCompleteTask = async () => {
    const taskId = confirmModal.task?.id;
    setConfirmModal((prev) => ({ ...prev, step: 'loading' }));
    try {
      await api.completeTask(taskId, currentUser.email);
      if (taskId) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t)));
      }
      setConfirmModal({ isOpen: false, task: null, step: 'confirm' });
      showActionToast('完了しました');
    } catch (e) {
      setConfirmModal({ isOpen: false, task: null, step: 'confirm' });
    }
  };

  const executeStoreBulkComplete = async () => {
    const task = storeBulkModal.task;
    if (!task || !currentUser?.email) return;
    const names = getMyIncompleteStoreNames(task);
    if (names.length === 0) {
      setStoreBulkModal({ isOpen: false, task: null, step: 'confirm', bulkCount: 0 });
      return;
    }
    setStoreBulkModal((prev) => ({ ...prev, step: 'loading', bulkCount: names.length }));
    try {
      const result = await api.completeTaskStoresBulk(task.id, currentUser.email, names);
      if (result && result.success === false) {
        alert(result.message || '完了に失敗しました');
        setStoreBulkModal({ isOpen: false, task: null, step: 'confirm', bulkCount: 0 });
        return;
      }
      const updated = result?.updated || {};
      if (Object.keys(updated).length > 0) {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== task.id) return t;
            const nextCompletions = { ...(t.storeCompletions || {}), ...updated };
            return applyStoreCompletionToTask(t, nextCompletions, checklistUserStores);
          })
        );
      }
      setStoreBulkModal({ isOpen: false, task: null, step: 'confirm', bulkCount: 0 });
      const doneCount = result?.completed ?? Object.keys(updated).length;
      showActionToast(doneCount > 1 ? `${doneCount}件完了しました` : '完了しました');
    } catch (e) {
      alert(formatGasError(e));
      setStoreBulkModal({ isOpen: false, task: null, step: 'confirm', bulkCount: 0 });
    }
  };

  /** 社員依頼: 自分の完了を 1 件取り消し */
  const handleUncompleteEmployeeTask = async (task) => {
    if (!currentUser?.email) return;
    if (!window.confirm('このタスクを「未実施」に戻しますか？\n（あなたの完了記録だけが削除されます。他の方の記録は変わりません。）')) return;
    try {
      const res = await api.uncompleteTask(task.id, currentUser.email);
      if (res && res.success === false) {
        alert(res.message || '取り消しに失敗しました');
        return;
      }
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: false } : t)));
    } catch (e) {
      alert('取り消しに失敗しました');
    }
  };

  /** 店舗依頼: 指定店舗の自分の完了だけ取り消し */
  const handleUncompleteStoreTask = async (task, storeName) => {
    if (!currentUser?.email) return;
    const key = `${task.id}:${storeName}`;
    setCompletingStoreKey(key);
    try {
      const res = await api.uncompleteTask(task.id, currentUser.email, storeName);
      if (res && res.success === false) {
        alert(res.message || '取り消しに失敗しました');
        return;
      }
      const nextCompletions = { ...(task.storeCompletions || {}) };
      delete nextCompletions[storeName];
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? applyStoreCompletionToTask(t, nextCompletions, checklistUserStores) : t))
      );
    } catch (e) {
      alert(formatGasError(e));
    } finally {
      setCompletingStoreKey((k) => (k === key ? null : k));
    }
  };

  const toggleRecipientExcluded = useCallback((excluded, setExcluded, email) => {
    const key = normalizeRecipientEmail(email);
    setExcluded((prev) => (prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]));
  }, []);

  const setAllRecipientsIncluded = useCallback((setExcluded, recipients, included) => {
    if (included) setExcluded([]);
    else setExcluded(recipients.map((r) => normalizeRecipientEmail(r.email)));
  }, []);

  const renderTargetSelector = (
    selectedStores,
    setSelectedStores,
    selectedRoles,
    setSelectedRoles,
    selectedTeams,
    setSelectedTeams,
    recipients,
    excludedEmails,
    setExcludedEmails,
    startNum = 5,
    mode = REQUEST_KIND.store
  ) => {
    const isAllStoresSelected = selectedStores.length === allStores.length && allStores.length > 0;
    const rosterStep = startNum + 1;

    const blockRecipientRoster = () => (
      <RecipientRosterPanel
        num={rosterStep}
        recipients={recipients}
        excludedEmails={excludedEmails}
        onToggle={(email) => toggleRecipientExcluded(excludedEmails, setExcludedEmails, email)}
        onSetAllIncluded={(on) => setAllRecipientsIncluded(setExcludedEmails, recipients, on)}
      />
    );

    const blockTeams = (num) => (
      <SelectionBlock
        num={num}
        title={mode === REQUEST_KIND.tf ? '配信するTFチーム' : '配信するチーム'}
        hint={
          mode === REQUEST_KIND.tf
            ? 'TFチーム向けの依頼です。所属チームで配信先を絞り込みます。'
            : 'タップで個別に切り替え。初期状態は全チームが選択されています。'
        }
        allLabel="全チームを選択"
        items={TEAMS}
        selected={selectedTeams}
        onChangeSelected={setSelectedTeams}
      />
    );

    const blockRoles = (num) => (
      <SelectionBlock
        num={num}
        title="配信する役職"
        hint="タップで個別に切り替え。初期状態は全役職が選択されています。"
        allLabel="全役職を選択"
        items={ROLES}
        selected={selectedRoles}
        onChangeSelected={setSelectedRoles}
      />
    );

    const blockStores = (num) => {
      const allStoreNames = getFieldStoreNames(allStores);
      const storeCount = selectedStores.length;
      return (
      <PanelFrame>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h4 className={`${appLabel} !mb-1 !pb-2`}>{num}. 配信するエリア・店舗</h4>
            <p className="text-xs text-slate-500 leading-relaxed">エリア単位で開いて店舗を選択できます。</p>
          </div>
          <span className={`shrink-0 ${appText.badgeNum} font-semibold text-[var(--acc-700)] bg-[var(--acc-50)] border border-[var(--acc-200)]/60 px-2.5 py-1 rounded-full`}>
            {storeCount}/{allStoreNames.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSelectedStores(isAllStoresSelected ? [] : allStoreNames)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl mb-3 transition-all duration-200 ${
            isAllStoresSelected
              ? 'bg-[var(--acc-500)] text-white shadow-md shadow-[var(--acc-500)]/25'
              : 'bg-slate-100/80 text-slate-800 border border-black/[0.04]'
          }`}
        >
          <span className="font-semibold text-sm">全店舗を選択</span>
          <span className={`relative w-11 h-6 rounded-full shrink-0 ${isAllStoresSelected ? 'bg-white/25' : 'bg-slate-300/70'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${isAllStoresSelected ? 'left-[22px]' : 'left-0.5'}`} />
          </span>
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          {AREAS.map((area) => {
            const storesInArea = getFieldStores(allStores).filter((s) => s.area === area);
            if (storesInArea.length === 0) return null;
            const isAllAreaSelected = storesInArea.every((s) => selectedStores.includes(s.storeName));
            const areaSelectedCount = storesInArea.filter((s) => selectedStores.includes(s.storeName)).length;
            return (
              <details key={area} className="group bg-white border border-black/[0.06] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <summary className="flex items-center justify-between gap-2 p-3 font-semibold text-sm cursor-pointer hover:bg-slate-50/80 transition-colors list-none select-none">
                  <span className="truncate">{area}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium tabular-nums text-slate-500">{areaSelectedCount}/{storesInArea.length}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const areaStoreNames = storesInArea.map((s) => s.storeName);
                        if (isAllAreaSelected) setSelectedStores((prev) => prev.filter((s) => !areaStoreNames.includes(s)));
                        else setSelectedStores((prev) => Array.from(new Set([...prev, ...areaStoreNames])));
                      }}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${isAllAreaSelected ? 'bg-[var(--acc-500)] text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {isAllAreaSelected ? '解除' : '全選択'}
                    </button>
                    <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center group-open:rotate-180 transition-transform [&>svg]:scale-75">
                      <Icon name="chevronDown" />
                    </span>
                  </span>
                </summary>
                <div className={`p-3 border-t border-slate-100/80 ${appChipArena} grid grid-cols-2 gap-1.5`}>
                  {storesInArea.map((store) => {
                    const on = selectedStores.includes(store.storeName);
                    return (
                      <button
                        key={store.storeName}
                        type="button"
                        onClick={() => {
                          if (on) setSelectedStores((prev) => prev.filter((s) => s !== store.storeName));
                          else setSelectedStores((prev) => [...prev, store.storeName]);
                        }}
                        className={`${appChipBase} !min-h-[2rem] !text-xs ${on ? appChipOn : appChipOff}`}
                      >
                        {store.storeName}
                      </button>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </PanelFrame>
      );
    };

    if (mode === REQUEST_KIND.employee) {
      return (
        <div className="w-full flex flex-col gap-6">
          {blockRoles(startNum)}
          {blockRecipientRoster()}
        </div>
      );
    }

    if (mode === REQUEST_KIND.tf) {
      return (
        <div className="w-full flex flex-col gap-6">
          {blockTeams(startNum)}
          {blockRecipientRoster()}
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col gap-6">
        {blockStores(startNum)}
        {blockRecipientRoster()}
      </div>
    );
  };


  if (authStep === 'loading') return (
    <div className="h-screen flex items-center justify-center bg-slate-50 flex-col gap-4 text-black">
      <div className="text-[var(--acc-600)] scale-150"><Icon name="loader" /></div>
      <p className="font-black tracking-widest text-sm uppercase animate-pulse mt-4">システムを起動しています...</p>
    </div>
  );

  return (
    <Fragment>
      <ActionToast toast={actionToast} />
      {/* --- モーダル群 --- */}
      {confirmModal.isOpen && confirmModal.task && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => confirmModal.step === 'confirm' && setConfirmModal({ isOpen: false, task: null, step: 'confirm' })}></div>
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-300 p-8 md:p-12 max-w-xl w-full relative z-10 shadow-xl animate-fade-in overflow-hidden">
            {confirmModal.step === 'confirm' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-50 border-2 border-slate-300 text-rose-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-sm"><Icon name="alertTriangle" /></div>
                <h3 className="text-2xl font-black text-black mb-8 tracking-tighter">完了しますか？</h3>
                <div className="flex gap-4">
                  <button onClick={() => setConfirmModal({ isOpen: false, task: null, step: 'confirm' })} className={brutalBtnSecondary + " flex-1"}>キャンセル</button>
                  <button onClick={executeCompleteTask} className={brutalBtnPrimary + " flex-[2]"}>完了する</button>
                </div>
              </div>
            )}
            {confirmModal.step === 'loading' && (
              <div className="text-center py-12">
                <div className="text-[var(--acc-600)] mb-8 flex justify-center scale-150"><Icon name="loader" /></div>
                <h3 className="text-3xl font-black text-black tracking-tighter animate-pulse">記録中...</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {storeBulkModal.isOpen && storeBulkModal.task && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => storeBulkModal.step === 'confirm' && setStoreBulkModal({ isOpen: false, task: null, step: 'confirm' })}
          ></div>
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-300 p-6 sm:p-8 max-w-lg w-full max-h-[min(92dvh,40rem)] relative z-10 shadow-xl animate-fade-in overflow-hidden flex flex-col">
            {storeBulkModal.step === 'confirm' && (
              <div className="flex flex-col min-h-0 flex-1">
                <h3 className="text-2xl font-black text-black mb-2 tracking-tighter text-center shrink-0">担当店舗をまとめて完了</h3>
                <p className="text-sm font-bold text-slate-600 mb-4 text-center leading-relaxed">
                  以下の店舗を、あなたの担当として完了にします。記録はテンポ内の全員に同じように表示されます。
                </p>
                <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 mb-4 flex flex-col min-h-0">
                  <p className="text-xs font-bold text-slate-500 mb-2 shrink-0">
                    完了にする店舗 <span className="tabular-nums">（{getMyIncompleteStoreNames(storeBulkModal.task).length}件）</span>
                  </p>
                  <ul className="space-y-2 text-sm font-bold text-slate-900 overflow-y-auto overscroll-contain max-h-[min(38vh,14rem)] pr-1">
                    {getMyIncompleteStoreNames(storeBulkModal.task).map((name) => (
                      <li key={name} className="flex items-start gap-2 border-b border-slate-200 last:border-0 pb-2 last:pb-0">
                        <span className="text-slate-400 shrink-0">・</span>
                        <span className="break-words">{name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="shrink-0 mt-auto pt-1 border-t border-slate-200/80">
                  <p className="text-sm font-black text-center text-slate-800 mb-4">この内容で全店舗（上記の担当分）を完了してよろしいですか？</p>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStoreBulkModal({ isOpen: false, task: null, step: 'confirm' })}
                      className={brutalBtnSecondary + ' flex-1'}
                    >
                      キャンセル
                    </button>
                    <button type="button" onClick={executeStoreBulkComplete} className={brutalBtnPrimary + ' flex-[2]'}>
                      完了する
                    </button>
                  </div>
                </div>
              </div>
            )}
            {storeBulkModal.step === 'loading' && (
              <div className="text-center py-12">
                <div className="text-[var(--acc-600)] mb-8 flex justify-center scale-150"><Icon name="loader" /></div>
                <h3 className="text-3xl font-black text-black tracking-tighter animate-pulse">記録中...</h3>
                {storeBulkModal.bulkCount > 0 && (
                  <p className="text-sm font-bold text-slate-600 mt-4">
                    {storeBulkModal.bulkCount}件の店舗をまとめて記録しています（通常は数秒〜十数秒）
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ログイン・登録画面 --- */}
      {authStep === 'login' && (
        <div className="login-screen min-h-[100dvh] bg-[#f2f2f7] flex items-center justify-center p-6 sm:p-10 relative overflow-hidden w-full">
          <div className="login-orb login-orb-a pointer-events-none" aria-hidden="true" />
          <div className="login-orb login-orb-b pointer-events-none" aria-hidden="true" />
          <div className="login-orb login-orb-c pointer-events-none" aria-hidden="true" />
          <div
            className={
              appCard +
              ' login-card max-w-2xl w-full relative z-10 !p-10 sm:!p-12 md:!p-14 border border-[var(--acc-200)]/40 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.18)] ring-1 ring-white/80'
            }
          >
            <div className="login-pop login-delay-1 w-[5.25rem] h-[5.25rem] bg-gradient-to-br from-[var(--acc-400)] to-[var(--acc-700)] rounded-[1.15rem] mx-auto flex items-center justify-center text-white mb-7 shadow-xl shadow-[var(--acc-500)]/35 ring-4 ring-white/90 [&>svg]:scale-125">
              <Icon name="check" />
            </div>
            <div className="login-pop login-delay-2 text-center mb-8">
              <p className="text-[11px] sm:text-xs font-semibold tracking-[0.28em] text-slate-500 uppercase mb-2.5">Task Force Team</p>
              <h2 className="text-4xl sm:text-[2.75rem] font-bold text-slate-900 tracking-tight leading-none">To-Do List</h2>
            </div>
            <p className="login-pop login-delay-3 text-slate-700 text-lg sm:text-xl font-bold mb-7 text-center leading-relaxed">
              {checklistOnlyMode ? '未完了タスクの確認・完了用です' : 'TFチームのタスクを一元管理'}
            </p>
            <div className="login-pop login-delay-4 rounded-2xl bg-gradient-to-b from-[var(--acc-50)]/80 to-white border border-[var(--acc-200)]/50 px-5 sm:px-6 py-4 mb-9 text-center space-y-2">
              <p className="text-sm sm:text-[0.95rem] text-slate-600 leading-relaxed sm:whitespace-nowrap">
                必ず
                <span className="font-bold text-[var(--acc-700)] mx-0.5">{CORP_EMAIL_DOMAIN}</span>
                のメールで登録してください。
              </p>
              <p className="text-sm sm:text-[0.95rem] text-slate-600 leading-relaxed sm:whitespace-nowrap">
                登録済みの方は同じメールアドレスで再ログインできます。
              </p>
            </div>
            <form onSubmit={handleLoginSearch} className="login-pop login-delay-5 space-y-6">
              <input
                type="email"
                required
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className={brutalInput + ' text-center !py-4 !text-lg login-input-focus'}
                placeholder={`name${CORP_EMAIL_DOMAIN}`}
              />
              {loginError && <p className="text-rose-500 text-sm font-bold text-center animate-bounce">{loginError}</p>}
              <button type="submit" className={brutalBtnPrimary + ' w-full py-5 sm:py-6 text-lg sm:text-xl login-btn-shine'}>
                ログイン / 新規登録
              </button>
              <button
                type="button"
                onClick={handleStartEditProfile}
                className={brutalBtnSecondary + ' w-full py-4 text-base sm:text-lg font-bold'}
              >
                ログイン情報を変更
              </button>
            </form>
          </div>
        </div>
      )}

      {authStep === 'register' && (
        <div className="min-h-[100dvh] bg-[#f2f2f7] flex flex-col p-6 relative overflow-y-auto w-full">
          <div className={appCard + " max-w-3xl w-full relative z-10 mx-auto my-auto animate-fade-in !p-8 md:!p-12"}>
            <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center tracking-tight">
              {regMode === 'edit' ? 'ログイン情報の変更' : 'アカウント作成'}
            </h2>
            <p className="text-gray-600 text-lg font-bold mb-10 text-center leading-relaxed">
              {regMode === 'edit' ? (
                <>チーム・エリア・管轄店舗・役職を更新できます。<br />保存後、内容を確認してログインしてください。</>
              ) : (
                <>初めてのログインですね。<br />プロフィールを登録して開始してください。</>
              )}
            </p>
            <form onSubmit={handleRegisterSubmit} className="space-y-10">
              <div>
                <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">メールアドレス (固定)</label>
                <input type="email" value={tempUser?.email || inputEmail || ''} disabled className="w-full px-6 py-5 bg-gray-100 border-2 border-slate-300 rounded-2xl text-gray-500 font-bold cursor-not-allowed text-lg shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)]" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">お名前 <span className="text-rose-500">*</span></label>
                  <input type="text" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className={brutalInput} placeholder="例: 岡本太郎" />
                </div>
                
                <div>
                  <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">あなたの役職 <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <select required value={regData.role} onChange={e => setRegData({...regData, role: e.target.value})} className={brutalInput + " appearance-none"}>
                      <option value="" disabled>選択してください</option>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black font-black">▼</div>
                  </div>
                </div>
              </div>

              <div>
                <label className={appLabel}>チーム名（複数選択可） <span className="text-rose-500">*</span></label>
                <PanelFrame className="mt-2">
                <div className={`flex flex-wrap gap-2 ${appChipArena}`}>
                  {TEAMS.map(t => (
                    <RegChip key={t} selected={regData.team.includes(t)} onClick={() => toggleTeam(t)}>{t}</RegChip>
                  ))}
                </div>
                </PanelFrame>
              </div>
              {!regData.hqAffiliation && (
              <div>
                <label className={appLabel}>エリア（複数選択可） <span className="text-rose-500">*</span></label>
                <PanelFrame className="mt-2">
                <div className={`flex flex-wrap gap-2 ${appChipArena}`}>
                  {AREAS.map(a => (
                    <RegChip key={a} selected={regData.area.includes(a)} onClick={() => toggleArea(a)}>{a}</RegChip>
                  ))}
                </div>
                </PanelFrame>
              </div>
              )}
              {!regData.hqAffiliation && regData.area.length > 0 && (
                <div>
                  <label className={appLabel}>テリトリー（不要なものはタップして外す） <span className="text-rose-500">*</span></label>
                  <PanelFrame className="mt-2 space-y-6">
                    {regData.area.map(areaName => (
                      <div key={areaName} className="border-b border-[var(--acc-200)]/40 pb-5 last:border-0 last:pb-0">
                        <p className="text-sm font-semibold text-[var(--acc-700)] mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-[var(--acc-500)]"></span>{areaName}</p>
                        <div className={`flex flex-wrap gap-2 ${appChipArena}`}>
                          {getTerritoriesForArea(areaName, allStores).map(terr => {
                             const isSelected = regData.territory[areaName]?.includes(terr);
                             return (
                              <RegChip key={terr} selected={isSelected} onClick={() => toggleTerritory(areaName, terr)}>{terr}</RegChip>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </PanelFrame>
                </div>
              )}
              {!regData.hqAffiliation && regData.area.length > 0 && (
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <label className={`${appLabel} !mb-0`}>
                      管轄店舗 <span className="text-xs font-bold text-gray-500 ml-2">※管轄外の店舗のみタップして外す</span>
                    </label>
                    <span className={`shrink-0 ${appText.badgeNum} font-semibold text-[var(--acc-700)] bg-[var(--acc-50)] border border-[var(--acc-200)]/60 px-2.5 py-1 rounded-full`}>
                      {regData.stores.length}/{MAX_EMPLOYEE_STORES}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 leading-relaxed">店舗が多い場合はエリアごとに開いて選択できます（一覧はスクロール）。</p>
                  <PanelFrame className="mt-2 space-y-3">
                    {regData.area.map(areaName => {
                      const selectedTerrs = regData.territory[areaName] || [];
                      const storesInArea = getFieldStores(allStores).filter(s => s.area === areaName && selectedTerrs.includes(s.territory));
                      if (storesInArea.length === 0) return null;
                      const areaSelectedCount = storesInArea.filter((s) => regData.stores.includes(s.storeName)).length;
                      return (
                        <details key={areaName} className="group bg-white border border-black/[0.06] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                          <summary className="flex items-center justify-between gap-2 p-3 font-semibold text-sm cursor-pointer hover:bg-slate-50/80 transition-colors list-none select-none">
                            <span className="truncate">{areaName} の店舗</span>
                            <span className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-medium tabular-nums text-slate-500">{areaSelectedCount}/{storesInArea.length}</span>
                              <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center group-open:rotate-180 transition-transform [&>svg]:scale-75">
                                <Icon name="chevronDown" />
                              </span>
                            </span>
                          </summary>
                          <div className={`p-3 border-t border-slate-100/80 max-h-64 overflow-y-auto overscroll-contain ${appChipArena} grid grid-cols-2 sm:grid-cols-3 gap-1.5`}>
                            {storesInArea.map((store) => (
                              <RegChip
                                key={store.storeName}
                                compact
                                selected={regData.stores.includes(store.storeName)}
                                onClick={() => toggleRegStore(store.storeName)}
                              >
                                {store.storeName}
                              </RegChip>
                            ))}
                          </div>
                        </details>
                      );
                    })}
                  </PanelFrame>
                </div>
              )}
              <div>
                <label className={appLabel}>本部所属 <span className="text-xs font-normal text-slate-500 ml-1">（店舗エリアに所属しない方）</span></label>
                <PanelFrame className="mt-2">
                  <div className={`flex flex-wrap gap-2 ${appChipArena}`}>
                    <RegChip selected={regData.hqAffiliation} onClick={toggleHqAffiliation}>{HQ_AREA}</RegChip>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    {regData.hqAffiliation
                      ? 'エリア・店舗の選択は不要です。社員依頼・TF依頼は役職・チームで配信されます。店舗依頼のエリア配信には含まれません。'
                      : '第1〜7エリアに所属しない方はこちらを選択してください（エリア選択と同時には選べません）。'}
                  </p>
                </PanelFrame>
              </div>
              <div className="pt-8 flex gap-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthStep('login');
                    setRegMode('create');
                    setRegData(emptyRegData());
                  }}
                  className={brutalBtnSecondary + ' w-1/3'}
                >
                  戻る
                </button>
                <button type="submit" disabled={isSubmitting} className={brutalBtnPrimary + ' w-2/3'}>
                  {isSubmitting ? (
                    <span className="animate-spin">
                      <Icon name="loader" />
                    </span>
                  ) : regMode === 'edit' ? (
                    '変更を保存'
                  ) : (
                    '登録して開始'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {authStep === 'confirm' && (
        <div className="h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden w-full">
          <div className="bg-white border-2 border-slate-300 rounded-[2.5rem] p-12 max-w-lg w-full text-center shadow-xl relative z-10">
            <div className="w-32 h-32 bg-gray-100 border-2 border-slate-300 rounded-full mx-auto flex items-center justify-center text-black mb-8 shadow-sm">
              <div className="scale-150"><Icon name="user" /></div>
            </div>
            <p className="text-[var(--acc-600)] font-black text-sm uppercase tracking-widest mb-3">{tempUser?.role || tempUser?.team}</p>
            <h2 className="text-5xl font-black text-black mb-8 tracking-tighter">{tempUser?.name}</h2>
            <div className="bg-gray-50 border-2 border-slate-300 rounded-2xl p-6 mb-10 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)]">
              <p className="text-xs text-gray-500 font-black uppercase mb-4 tracking-widest">担当エリア</p>
              {tempUser?.territory ? (
                <div className="space-y-2">
                  {String(tempUser.territory).split(' / ').map((t, i) => (
                    <p key={i} className="text-lg font-bold text-black">{t}</p>
                  ))}
                </div>
              ) : (
                <p className="text-lg font-bold text-black">{tempUser?.area}</p>
              )}
            </div>
            <div className="space-y-6">
              <button onClick={handleConfirmLogin} className={brutalBtnPrimary + " w-full py-5"}>このアカウントで開始</button>
              <button onClick={() => setAuthStep('login')} className="w-full text-gray-500 font-black text-base uppercase tracking-widest pt-4 hover:text-black transition-colors">別のアカウントにする</button>
            </div>
          </div>
        </div>
      )}

      {/* --- メイン画面 --- */}
      {authStep === 'ready' && (
        <div className="flex flex-col h-[100dvh] bg-[#f2f2f7] font-sans text-slate-900 overflow-hidden w-full max-w-lg mx-auto md:max-w-none">
          
          <header className="h-14 md:h-16 bg-white/90 backdrop-blur-xl border-b border-black/[0.06] flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-40 w-full sticky top-0">
            <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
               <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                 <div className="w-9 h-9 bg-[var(--acc-500)] text-white flex items-center justify-center rounded-[10px] shadow-sm shrink-0">
                    <Icon name="check" />
                 </div>
                 <div className="flex flex-col leading-tight gap-0 min-w-0 hidden sm:flex">
                    <span className="text-[7px] sm:text-[8px] font-semibold tracking-[0.18em] text-slate-500 uppercase truncate">Task Force Team</span>
                    <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                      {checklistOnlyMode ? 'リストチェック' : 'To-Do List'}
                    </h1>
                 </div>
               </div>
               
               {checklistOnlyMode ? (
                 <h2 className="font-bold text-slate-900 tracking-tight text-sm md:text-base ml-1 truncate min-w-0 sm:hidden">
                   リストチェック
                 </h2>
               ) : activeTab !== 'home' ? (
                 <>
                   <button onClick={() => navigateTab('home')} className="flex items-center gap-1 text-sm font-semibold text-[var(--acc-600)] hover:opacity-80 transition-opacity shrink-0 ml-1">
                     <Icon name="chevronLeft" /> 戻る
                   </button>
                   <h2 className="font-bold text-slate-900 tracking-tight text-sm md:text-base ml-1 truncate min-w-0">
                     {activeTab === 'request' ? 'タスク配信' : activeTab === 'repost' ? '再投稿' : activeTab === 'scheduled' ? '定期配信' : 'リストチェック'}
                   </h2>
                 </>
               ) : (
                 <h2 className="font-semibold text-slate-500 tracking-tight text-sm ml-1 hidden sm:block">Dashboard</h2>
               )}
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="relative z-50 w-9 h-9 rounded-full bg-gradient-to-br from-[var(--acc-500)] to-[var(--acc-700)] text-white text-sm font-bold flex items-center justify-center ring-2 ring-white shadow-md active:scale-95 transition-transform"
                aria-label="アカウント"
              >
                {accountInitial}
              </button>
              
              {isAccountMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={() => setIsAccountMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-[min(18rem,92vw)] max-h-[min(88vh,36rem)] flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-black/[0.06] z-50 overflow-hidden animate-fade-in">
                    <div className="p-4 border-b border-slate-100 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--acc-500)] to-[var(--acc-700)] text-white font-bold flex items-center justify-center shrink-0">
                          {accountInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{currentUser?.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-3.5 py-3 space-y-3 bg-white overflow-y-auto overscroll-contain min-h-0 max-h-[min(42vh,220px)] border-b border-slate-100">
                      {currentUser?.role && (
                        <div>
                          <p className="text-[9px] font-black text-[var(--acc-600)] uppercase tracking-widest mb-0.5">役職</p>
                          <p className="text-xs font-black text-black bg-[var(--acc-50)] border border-[var(--acc-200)] px-2 py-0.5 rounded-md w-max">{currentUser?.role}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[9px] font-black text-[var(--acc-600)] uppercase tracking-widest mb-0.5">
                          {isHqEmployee(currentUser) ? '所属' : '担当エリア'}
                        </p>
                        <p className="text-xs font-bold text-slate-900">{currentUser?.area}</p>
                        {!isHqEmployee(currentUser) && currentUser?.territory && (
                          <p className="text-[11px] font-semibold text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{String(currentUser.territory).split(' / ').join('\n')}</p>
                        )}
                      </div>
                      {!isHqEmployee(currentUser) && (
                      <div>
                        <p className="text-[9px] font-black text-[var(--acc-600)] uppercase tracking-widest mb-0.5">管轄店舗</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {currentUser?.stores?.length > 0 ? currentUser.stores.map((s, i) => <span key={i} className="bg-gray-100 border border-slate-400 text-slate-900 text-[9px] px-1.5 py-0.5 rounded font-bold">{s}</span>) : <span className="text-[11px] text-slate-500">店舗なし</span>}
                        </div>
                      </div>
                      )}
                      <div>
                        <p className="text-[9px] font-black text-[var(--acc-600)] uppercase tracking-widest mb-0.5">所属チーム</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {userTeams.length > 0
                            ? userTeams.map((t, i) => (
                                <span key={i} className="bg-indigo-50 border border-indigo-200 text-indigo-900 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  {t}
                                </span>
                              ))
                            : <span className="text-[11px] text-slate-500">未設定</span>}
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-2.5 border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white shrink-0">
                      <p className="text-[9px] font-black text-[var(--acc-600)] uppercase tracking-widest mb-2">アクセントカラー</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {ACCENT_THEMES.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            title={t.label}
                            onClick={() => {
                              applyAccentTheme(t.id);
                              setAccentId(t.id);
                            }}
                            className={`h-8 rounded-lg border-2 transition-all shadow-sm flex items-center justify-center ${
                              accentId === t.id
                                ? 'border-black ring-2 ring-black/25 ring-offset-1 scale-[1.02]'
                                : 'border-slate-200 hover:border-slate-400 hover:scale-105 active:scale-95'
                            }`}
                            style={{ background: t['500'] }}
                          >
                            {accentId === t.id && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm border border-white/80" />
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold text-center mt-2">
                        現在: <span className="text-[var(--acc-700)]">{ACCENT_THEMES.find((x) => x.id === accentId)?.label ?? '—'}</span>
                      </p>
                    </div>
                    <div className="p-2.5 border-t border-slate-100 bg-slate-50/80 shrink-0">
                      <button onClick={() => { setIsAccountMenuOpen(false); handleLogout(); }} className="w-full bg-rose-50 text-rose-600 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs">
                        <Icon name="logout" /> ログアウト
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 bg-[#f2f2f7] w-full">
            <div className="max-w-[1920px] mx-auto w-full px-1 md:px-4 pb-24">
              <div key={activeTab} className={screenAnimClass}>
              
              {/* === HOME === */}
              {!checklistOnlyMode && activeTab === 'home' && (
                <div className="space-y-5 mt-1 w-full max-w-5xl mx-auto">
                  <div className="bg-white rounded-2xl px-5 py-4 md:px-6 md:py-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-black/[0.04]">
                    <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 text-sm md:text-base text-slate-600">
                      <span>
                        未完了{' '}
                        <strong className={`text-slate-900 tabular-nums ${appText.stat}`}>{activeTasksCount}</strong>
                        <span className="font-bold text-slate-500"> 件</span>
                      </span>
                      <span className="hidden sm:inline text-slate-300 select-none">/</span>
                      <span>
                        完了率{' '}
                        <strong className={`text-slate-900 tabular-nums ${appText.stat}`}>{requestedTasksProgress}</strong>
                        <span className="font-bold text-slate-500"> %</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full md:grid md:grid-cols-2 md:gap-4 xl:gap-5">
                    <button type="button" onClick={() => navigateTab('request')} className={dashboardMenuTile}>
                      <div className={dashboardMenuIcon}><Icon name="plus" /></div>
                      <h4 className="text-lg md:text-xl font-bold text-slate-900 flex-1">新規投稿</h4>
                      <span className="text-slate-300 shrink-0 scale-90 rotate-180 inline-block"><Icon name="chevronLeft" /></span>
                    </button>
                    <button type="button" onClick={() => navigateTab('repost')} className={dashboardMenuTile}>
                      <div className={dashboardMenuIcon}><Icon name="history" /></div>
                      <h4 className="text-lg md:text-xl font-bold text-slate-900 flex-1">再投稿</h4>
                      <span className="text-slate-300 shrink-0 scale-90 rotate-180 inline-block"><Icon name="chevronLeft" /></span>
                    </button>
                    <button type="button" onClick={() => navigateTab('scheduled')} className={dashboardMenuTile}>
                      <div className={dashboardMenuIcon}><Icon name="repeat" /></div>
                      <h4 className="text-lg md:text-xl font-bold text-slate-900 flex-1">定期配信</h4>
                      <span className="text-slate-300 shrink-0 scale-90 rotate-180 inline-block"><Icon name="chevronLeft" /></span>
                    </button>
                    <button type="button" onClick={() => navigateTab('checklist')} className={dashboardMenuTile + ' relative'}>
                      <div className={dashboardMenuIcon}><Icon name="list" /></div>
                      <h4 className="text-lg md:text-xl font-bold text-slate-900 flex-1">リストチェック</h4>
                      {activeTasksCount > 0 && (
                        <span className="bg-[var(--acc-600)] text-white text-xs font-bold px-2.5 py-1 rounded-full shrink-0">{activeTasksCount}</span>
                      )}
                      <span className="text-slate-300 shrink-0 scale-90 rotate-180 inline-block"><Icon name="chevronLeft" /></span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 w-full">
                    {teamProgressBanners.length > 0 ? teamProgressBanners.map((team) => (
                      <button
                        key={team.key}
                        type="button"
                        onClick={() => openProgressPage(team.key)}
                        className={dashboardMenuTile}
                      >
                        <div className={dashboardMenuIcon}><Icon name="trend" /></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg md:text-xl font-bold text-slate-900">{team.label}</h4>
                        </div>
                        <span className="text-slate-300 shrink-0 scale-90 rotate-180 inline-block"><Icon name="chevronLeft" /></span>
                      </button>
                    )) : (
                      <button
                        type="button"
                        onClick={() => alert('所属チームが未設定のため、進捗を開けません。')}
                        className={dashboardMenuTile}
                      >
                        <div className={dashboardMenuIcon}><Icon name="trend" /></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg md:text-xl font-bold text-slate-900">TFチームタスク管理</h4>
                          <p className="text-xs md:text-sm font-semibold text-slate-500 mt-1">所属チーム未設定</p>
                        </div>
                        <span className="text-slate-300 shrink-0 scale-90 rotate-180 inline-block"><Icon name="chevronLeft" /></span>
                      </button>
                    )}
                    {isDxAdmin && (
                      <button type="button" onClick={openAdminPage} className={dashboardMenuTile}>
                        <div className={dashboardMenuIcon}><Icon name="calendar" /></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg md:text-xl font-bold text-slate-900">進捗管理admin</h4>
                          <p className="text-xs md:text-sm font-semibold text-slate-500 mt-1">管理者向けダッシュボード</p>
                        </div>
                        <span className="text-slate-300 shrink-0 scale-90 rotate-180 inline-block"><Icon name="chevronLeft" /></span>
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* === タスク配信 === */}
              {!checklistOnlyMode && activeTab === 'request' && (
                <div className="w-full mt-4">
                  <form onSubmit={handleTaskSubmit} className="flex flex-col gap-6 w-full">
                    {/* 入力フロー：1→2→3→4｜5→6→7（店舗依頼時）の見える区切り */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-0 w-full">
                      {/* 左列：入力内容 (1〜4) */}
                      <div className="flex flex-col gap-5 w-full xl:pr-8 xl:border-r xl:border-slate-200/80">
                        <div className={appSection}>
                          <label className={appLabelKind}>依頼の種類 <span className="text-rose-500">*</span></label>
                          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                            <label className={appKindRadio(requestKind === REQUEST_KIND.employee)}>
                              <input type="radio" name="requestKind" className="w-4 h-4 accent-[var(--acc-600)] shrink-0" checked={requestKind === REQUEST_KIND.employee} onChange={() => setRequestKind(REQUEST_KIND.employee)} />
                              <span className={`${appText.body} font-bold text-slate-900`}>社員への依頼</span>
                            </label>
                            <label className={appKindRadio(requestKind === REQUEST_KIND.store)}>
                              <input type="radio" name="requestKind" className="w-4 h-4 accent-[var(--acc-600)] shrink-0" checked={requestKind === REQUEST_KIND.store} onChange={() => setRequestKind(REQUEST_KIND.store)} />
                              <span className={`${appText.body} font-bold text-slate-900`}>店舗への依頼</span>
                            </label>
                            <label className={appKindRadio(requestKind === REQUEST_KIND.tf)}>
                              <input type="radio" name="requestKind" className="w-4 h-4 accent-[var(--acc-600)] shrink-0" checked={requestKind === REQUEST_KIND.tf} onChange={() => setRequestKind(REQUEST_KIND.tf)} />
                              <span className={`${appText.body} font-bold text-slate-900`}>TFチームの依頼</span>
                            </label>
                          </div>
                        </div>
                        <div className={appSection}>
                          <label className={appLabel}>1. 依頼内容 <span className="text-rose-500">*</span></label>
                          <textarea value={requestForm.content} onChange={e => setRequestForm({...requestForm, content: e.target.value})} required rows="5" className={`${brutalInput} min-h-[160px]`} placeholder="具体的な指示内容を入力してください"></textarea>
                        </div>
                        
                        <div className={appSection}>
                          <label className={appLabel}>2. 期限 (DL) <span className="text-rose-500">*</span></label>
                          <input type="date" min={todayForMin} value={requestForm.deadline} onChange={e => setRequestForm({...requestForm, deadline: e.target.value})} required className={brutalInput} />
                        </div>
                        
                        <div className={appSection}>
                          <label className={appLabel}>3. URL (任意 / 最大3つ)</label>
                          <div className="space-y-3">
                            {requestForm.urls.map((url, i) => (
                              <div key={i} className="flex gap-3">
                                <input type="url" value={url} onChange={e => handleRequestUrlChange(i, e.target.value)} className={brutalInput + " py-3"} placeholder="https://..." />
                                {requestForm.urls.length > 1 && (
                                  <button type="button" onClick={() => {
                                    const newUrls = requestForm.urls.filter((_, index) => index !== i);
                                    setRequestForm({ ...requestForm, urls: newUrls });
                                  }} className="w-16 bg-rose-500 text-white border-2 border-slate-300 shadow-sm rounded-xl flex items-center justify-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"><Icon name="trash" /></button>
                                )}
                              </div>
                            ))}
                            {requestForm.urls.length < 3 && (
                              <button type="button" onClick={() => setRequestForm({ ...requestForm, urls: [...requestForm.urls, ''] })} className={brutalBtnSecondary + " w-full py-3 text-base"}>
                                <Icon name="plusCircle" /> URLを追加
                              </button>
                            )}
                          </div>
                        </div>

                        <AttachmentUploadPanel
                          images={requestImages}
                          formType="request"
                          onImageChange={handleImageChange}
                          onZipChange={handleZipChange}
                          onRemove={removeImage}
                        />
                      </div>

                      {/* 右列：配信先 (5〜6) */}
                      <div className="w-full flex flex-col gap-5 xl:pl-8">
                        {renderTargetSelector(
                          requestSelectedStores,
                          setRequestSelectedStores,
                          requestSelectedRoles,
                          setRequestSelectedRoles,
                          requestSelectedTeams,
                          setRequestSelectedTeams,
                          requestRecipientCandidates,
                          requestRecipientExcluded,
                          setRequestRecipientExcluded,
                          5,
                          requestKind
                        )}
                      </div>
                    </div>

                    <div className={appFormSubmitRow}>
                      <button type="submit" disabled={isSubmitting} className={appBtnPrimary}>
                        {isSubmitting ? <span className="animate-spin scale-150"><Icon name="loader" /></span> : <Icon name="send" />}
                        <span className="ml-3">{isSubmitting ? '処理中...' : 'この内容で配信する'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* === 再投稿 (履歴) === */}
              {!checklistOnlyMode && activeTab === 'repost' && (
                <div className="animate-fade-in w-full mt-4">
                  <p className="text-base font-bold text-slate-600 mb-8 text-center border-b-2 border-slate-300 pb-6 leading-relaxed">
                    <strong className="text-slate-800">新規投稿</strong>で過去に配信した内容だけが一覧に出ます（定期配信の一覧とは別です）。
                    <br />
                    <span className="text-sm font-semibold text-slate-500 mt-2 block">依頼内容・URL・添付・配信先を引き継ぎます。添付はサムネイルをタップすると開けます。期限だけ選び直してください。</span>
                  </p>
                  
                  <div className="space-y-6 w-full">
                    {sentTasks.length === 0 ? (
                      <p className="text-center text-slate-500 font-bold py-20 text-lg">送信履歴がありません</p>
                    ) : sentTasks.map(task => (
                      <div key={task.id} className="bg-white p-6 rounded-2xl border-2 border-slate-300 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-[var(--acc-200)] hover:shadow-md transition-all shadow-sm w-full">
                         <div className="flex-1 text-center md:text-left w-full">
                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                             <span className="bg-[var(--acc-500)] text-white text-xs font-bold px-3 py-1.5 rounded-lg tracking-widest">過去の配信</span>
                             <span className="text-sm text-slate-600 font-bold">{task.createdAt}</span>
                             {task.targetTags && <span className="text-xs font-bold text-slate-700 bg-slate-50 border-2 border-slate-300 px-3 py-1 rounded-lg">宛先: {task.targetTags}</span>}
                           </div>
                           <p className="text-slate-800 text-lg font-bold leading-relaxed">{formatContent(task.content)}</p>
                           <SavedAttachmentStrip urls={task.images} />
                         </div>
                         <button onClick={() => handleRepostClick(task)} className={brutalBtnSecondary + " w-full md:w-auto px-8 flex-shrink-0"}>
                           再利用して作成
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* === 定期配信 === */}
              {!checklistOnlyMode && activeTab === 'scheduled' && (
                <div className="w-full space-y-10 animate-fade-in mt-4">
                  {scheduleEditingId && (
                    <div className="rounded-2xl border border-[var(--acc-200)]/60 bg-[var(--acc-50)]/60 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <p className={`${appText.body} font-bold text-slate-800`}>
                        編集中：保存すると<strong>次回の定期配信から</strong>この内容で送信されます（今日のタスクは増えません）。
                      </p>
                      <button type="button" onClick={handleCancelScheduleEdit} className={brutalBtnSecondary + " whitespace-nowrap py-3 px-5"}>
                        編集をやめる
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleScheduleSubmit} className="flex flex-col gap-6 w-full">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-0 w-full">
                      {/* 左列：1〜4 */}
                      <div className="flex flex-col gap-5 w-full xl:pr-8 xl:border-r xl:border-slate-200/80">
                        <div className={appSection}>
                          <label className={appLabelKind}>依頼の種類 <span className="text-rose-500">*</span></label>
                          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                            <label className={appKindRadio(scheduleRequestKind === REQUEST_KIND.employee)}>
                              <input type="radio" name="scheduleRequestKind" className="w-4 h-4 accent-[var(--acc-600)] shrink-0" checked={scheduleRequestKind === REQUEST_KIND.employee} onChange={() => setScheduleRequestKind(REQUEST_KIND.employee)} />
                              <span className={`${appText.body} font-bold text-slate-900`}>社員への依頼</span>
                            </label>
                            <label className={appKindRadio(scheduleRequestKind === REQUEST_KIND.store)}>
                              <input type="radio" name="scheduleRequestKind" className="w-4 h-4 accent-[var(--acc-600)] shrink-0" checked={scheduleRequestKind === REQUEST_KIND.store} onChange={() => setScheduleRequestKind(REQUEST_KIND.store)} />
                              <span className={`${appText.body} font-bold text-slate-900`}>店舗への依頼</span>
                            </label>
                            <label className={appKindRadio(scheduleRequestKind === REQUEST_KIND.tf)}>
                              <input type="radio" name="scheduleRequestKind" className="w-4 h-4 accent-[var(--acc-600)] shrink-0" checked={scheduleRequestKind === REQUEST_KIND.tf} onChange={() => setScheduleRequestKind(REQUEST_KIND.tf)} />
                              <span className={`${appText.body} font-bold text-slate-900`}>TFチームの依頼</span>
                            </label>
                          </div>
                        </div>
                        <div className={appSection}>
                          <label className={appLabel}>1. 配信スケジュール <span className="text-rose-500">*</span></label>
                          <p className={`${appText.meta} mb-4`}>配信時刻は<strong className="text-slate-700">午前10:00</strong>固定です。</p>
                          <div className="flex flex-col sm:flex-row gap-4 mt-2">
                            <div className="flex-1">
                              <label className="text-xs font-bold text-slate-600 mb-2 block">毎月何日に配信するか</label>
                              <div className="relative">
                                <select value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className={brutalInput + " appearance-none text-center"}>
                                  {Array.from({length: 31}, (_, i) => <option key={i+1} value={i+1}>{i+1}日</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold">▼</div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="text-xs font-bold text-slate-600 mb-2 block">タスクの期限（毎月〜まで）</label>
                              <div className="relative">
                                <select value={scheduleForm.deadlineOffset} onChange={e => setScheduleForm({...scheduleForm, deadlineOffset: e.target.value})} className={brutalInput + " appearance-none text-center"}>
                                  <option value="月末">月末</option>
                                  {Array.from({length: 31}, (_, i) => <option key={i+1} value={`${i+1}日`}>{i+1}日</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold">▼</div>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-4">登録日: {todayForMin} ／ 保存される配信時刻: {SCHEDULE_DELIVERY_TIME}</p>

                          {!scheduleEditingId && (
                            <label className={appScheduleOption}>
                              <input
                                type="checkbox"
                                checked={scheduleSkipInitialMonth}
                                onChange={(e) => setScheduleSkipInitialMonth(e.target.checked)}
                                className="mt-0.5 w-5 h-5 shrink-0 rounded border border-slate-300 text-[var(--acc-600)] accent-[var(--acc-600)] focus:ring-[var(--acc-500)]"
                              />
                              <span className="min-w-0 leading-relaxed">
                                <span className={`${appText.body} font-bold text-slate-900 block`}>今月の初回分は作成しない</span>
                                <span className={`${appText.meta} block mt-1.5`}>
                                  チェックすると、上の「毎月何日に配信するか」（現在：
                                  <strong className="text-[var(--acc-700)]">{scheduleDate}日</strong>
                                  ）の<strong className="text-[var(--acc-700)]">翌月{scheduleDate}日</strong>
                                  から配信が始まります。
                                </span>
                              </span>
                            </label>
                          )}
                        </div>

                        <div className={appSection}>
                          <label className={appLabel}>2. 依頼内容 <span className="text-rose-500">*</span></label>
                          <textarea required value={scheduleForm.content} onChange={e => setScheduleForm({...scheduleForm, content: e.target.value})} rows="5" className={`${brutalInput} min-h-[160px]`} placeholder="例: 月末の棚卸し報告をお願いします"></textarea>
                        </div>

                        <div className={appSection}>
                          <label className={appLabel}>3. URL (任意 / 最大3つ)</label>
                          <div className="space-y-3">
                            {scheduleForm.urls.map((url, i) => (
                              <div key={i} className="flex gap-3">
                                <input type="url" value={url} onChange={e => handleScheduleUrlChange(i, e.target.value)} className={brutalInput + " py-3"} placeholder="https://..." />
                                {scheduleForm.urls.length > 1 && (
                                  <button type="button" onClick={() => {
                                    const newUrls = scheduleForm.urls.filter((_, index) => index !== i);
                                    setScheduleForm({ ...scheduleForm, urls: newUrls });
                                  }} className="w-14 bg-rose-500 text-white border-2 border-slate-300 shadow-sm rounded-xl flex items-center justify-center hover:opacity-90 transition-all"><Icon name="trash" /></button>
                                )}
                              </div>
                            ))}
                            {scheduleForm.urls.length < 3 && (
                              <button type="button" onClick={() => setScheduleForm({ ...scheduleForm, urls: [...scheduleForm.urls, ''] })} className={brutalBtnSecondary + " w-full py-2 text-sm"}>
                                <Icon name="plusCircle" /> URLを追加
                              </button>
                            )}
                          </div>
                        </div>

                        <AttachmentUploadPanel
                          images={scheduleImages}
                          formType="schedule"
                          onImageChange={handleImageChange}
                          onZipChange={handleZipChange}
                          onRemove={removeImage}
                          thumbSizeClass="w-28 h-28"
                          removeBtnClass="absolute top-1 right-1 bg-rose-500 text-white border-2 border-slate-300 p-1.5 rounded-full hover:scale-110 transition-transform z-20"
                          imageAreaClass="p-6"
                          imagePromptClass="text-sm font-bold"
                        />
                      </div>

                      {/* 右列：5〜6 */}
                      <div className="w-full flex flex-col gap-5 xl:pl-8">
                        {renderTargetSelector(
                          scheduleSelectedStores,
                          setScheduleSelectedStores,
                          scheduleSelectedRoles,
                          setScheduleSelectedRoles,
                          scheduleSelectedTeams,
                          setScheduleSelectedTeams,
                          scheduleRecipientCandidates,
                          scheduleRecipientExcluded,
                          setScheduleRecipientExcluded,
                          5,
                          scheduleRequestKind
                        )}
                      </div>
                    </div>

                    <div className={`${appFormSubmitRow} flex flex-col gap-4`}>
                      <button type="submit" disabled={isSubmitting} className={appBtnPrimary}>
                        {isSubmitting ? <span className="animate-spin scale-150"><Icon name="loader" /></span> : <Icon name="repeat" />}
                        <span className="ml-3">
                          {isSubmitting ? '処理中...' : scheduleEditingId ? '変更を保存する' : 'スケジュールを登録する'}
                        </span>
                      </button>
                    </div>
                  </form>

                  <div className="mt-10">
                    <h3 className={`${appLabel} mb-6`}>稼働中の定期配信</h3>
                    <div className="space-y-6 w-full">
                      {scheduledTasks.length === 0 ? (
                        <p className={`text-center text-slate-500 py-10 ${appText.body}`}>登録されている定期配信はありません</p>
                      ) : scheduledTasks.map(task => (
                        <div key={task.id} className={`${appCard} flex flex-col md:flex-row justify-between items-stretch md:items-center gap-5`}>
                           <div className="flex-1 text-center md:text-left w-full">
                             <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                               <span className={`${appTagOnAccent} bg-[var(--acc-500)] gap-1.5`}><Icon name="repeat"/> {task.cycle}</span>
                               <span className={`${appTagPill} text-slate-700 bg-slate-50`}>期限: 毎月 {task.deadlineOffset}</span>
                               {task.targetTags && <span className={`${appTagPill} text-slate-700 bg-slate-50`}>宛先: {task.targetTags}</span>}
                             </div>
                             <p className={`${appText.title} text-slate-800 leading-relaxed`}>{formatContent(task.content)}</p>
                             <SavedAttachmentStrip urls={task.images} />
                           </div>
                           <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
                             <button type="button" onClick={() => handleEditScheduleClick(task)} className={`${appBtnSecondary} w-full md:w-auto px-5`}>
                               <Icon name="calendar" /> 内容を編集
                             </button>
                             <button type="button" onClick={() => handleDeleteSchedule(task.id)} className={`${appBtnSecondary} w-full md:w-auto px-5 hover:bg-rose-500 hover:text-white hover:border-rose-300`}>
                               <Icon name="trash" /> 停止
                             </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* === リストチェック画面 === */}
              {activeTab === 'checklist' && (
                <div className="animate-fade-in w-full mt-4">
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-6 w-full max-w-2xl">
                    <button onClick={() => setTaskTab('active')} className={`flex-1 py-3 px-4 ${appText.tab} rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${taskTab === 'active' ? 'bg-[var(--acc-600)] text-white border-[var(--acc-600)]' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                      未実施 <span className={`px-2 py-0.5 rounded-full ${appText.badgeNum} ${taskTab === 'active' ? 'bg-white text-[var(--acc-600)]' : 'bg-slate-600 text-white'}`}>{activeTasksCount}</span>
                    </button>
                    <button onClick={() => setTaskTab('completed')} className={`flex-1 py-3 px-4 ${appText.tab} rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${taskTab === 'completed' ? 'bg-white text-slate-800 border-slate-400' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}>
                      実施済み <span className={`px-2 py-0.5 rounded-full ${appText.badgeNum} ${taskTab === 'completed' ? 'bg-slate-600 text-white' : 'bg-slate-400 text-white'}`}>{completedTasksCount}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6 w-full max-w-2xl">
                    <button
                      type="button"
                      onClick={() => setChecklistKindFilter('all')}
                      className={`px-4 py-2 rounded-xl ${appText.tab} border-2 transition-all flex items-center gap-2 shadow-sm ${checklistKindFilter === 'all' ? 'bg-[var(--acc-700)] text-white border-[var(--acc-700)] ring-1 ring-[var(--acc-400)]/40' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      すべて
                      <span className={`${appText.badgeNum} px-2 py-0.5 rounded-full ${checklistKindFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>{checklistKindCounts.all}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecklistKindFilter('employee')}
                      className={`px-4 py-2 rounded-xl ${appText.tab} border-2 transition-all flex items-center gap-2 shadow-sm ${checklistKindFilter === 'employee' ? 'bg-[var(--acc-600)] text-white border-[var(--acc-600)] ring-1 ring-[var(--acc-400)]/35' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      社員依頼
                      <span className={`${appText.badgeNum} px-2 py-0.5 rounded-full ${checklistKindFilter === 'employee' ? 'bg-white/20 text-white' : 'bg-[var(--acc-100)] text-[var(--acc-900)]'}`}>{checklistKindCounts.employee}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecklistKindFilter('store')}
                      className={`px-4 py-2 rounded-xl ${appText.tab} border-2 transition-all flex items-center gap-2 shadow-sm ${checklistKindFilter === 'store' ? 'bg-[var(--acc-900)] text-white border-[var(--acc-900)] ring-1 ring-[var(--acc-500)]/30' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      店舗依頼
                      <span className={`${appText.badgeNum} px-2 py-0.5 rounded-full ${checklistKindFilter === 'store' ? 'bg-white/20 text-white' : 'bg-[var(--acc-100)] text-[var(--acc-900)]'}`}>{checklistKindCounts.store}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecklistKindFilter('tf')}
                      className={`px-4 py-2 rounded-xl ${appText.tab} border-2 transition-all flex items-center gap-2 shadow-sm ${checklistKindFilter === 'tf' ? 'bg-violet-700 text-white border-violet-700 ring-1 ring-violet-400/35' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      TFチーム依頼
                      <span className={`${appText.badgeNum} px-2 py-0.5 rounded-full ${checklistKindFilter === 'tf' ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-900'}`}>{checklistKindCounts.tf}</span>
                    </button>
                  </div>

                  {checklistKindFilter === 'store' && (
                    <div className="mb-2">
                      <p className={appText.caption}>
                        店舗で絞り込み
                        <span className="font-medium text-slate-400 ml-1">（グレーは該当なし・選択不可。タップで選択・複数可）</span>
                      </p>
                      {selectedChecklistStores.length > 0 && (
                        <p className={`${appText.caption} text-[var(--acc-700)] mt-1`}>
                          選択中: {selectedChecklistStores.join('、')}
                        </p>
                      )}
                    </div>
                  )}
                  {checklistKindFilter === 'store' && (
                  <div className="flex gap-3 overflow-x-auto pb-4 mb-6 no-scrollbar w-full border-b-2 border-slate-300">
                    <button type="button" onClick={() => setSelectedChecklistStores([])} className={`flex-shrink-0 px-4 py-2 rounded-xl ${appText.tab} border-2 border-slate-300 transition-all flex items-center gap-2 ${selectedChecklistStores.length === 0 ? 'bg-[var(--acc-600)] text-white border-[var(--acc-600)]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>
                      全店
                      {tasksMatchingChecklistKind.length > 0 && (
                        <span className={`${appText.badgeNum} px-2 py-0.5 rounded-full ${taskTab === 'active' ? 'bg-[var(--acc-500)] text-white' : 'bg-slate-500 text-white'}`}>{tasksMatchingChecklistKind.length}</span>
                      )}
                    </button>
                    {checklistUserStores.map((s) => {
                        const storeTaskCount = countChecklistTasksForStoreChip(
                          tasksMatchingChecklistKind,
                          s,
                          taskTab,
                          checklistUserStores
                        );
                        const isOn = selectedChecklistStores.includes(s);
                        const chipInactive = storeTaskCount === 0;
                        const chipClass = chipInactive
                          ? isOn
                            ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-pointer'
                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-55'
                          : isOn
                            ? 'bg-[var(--acc-600)] text-white border-[var(--acc-600)] ring-2 ring-[var(--acc-400)]/40'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300';
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={chipInactive && !isOn}
                            aria-disabled={chipInactive && !isOn}
                            title={
                              chipInactive && !isOn
                                ? taskTab === 'active'
                                  ? 'この店舗の未実施タスクはありません'
                                  : 'この店舗の実施済みタスクはありません'
                                : undefined
                            }
                            onClick={() => {
                              if (chipInactive && !isOn) return;
                              toggleChecklistStore(s);
                            }}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl ${appText.tab} border-2 transition-all flex items-center gap-2 ${chipClass}`}
                          >
                            {s}
                            {storeTaskCount > 0 && (
                              <span className={`${appText.badgeNum} px-2 py-0.5 rounded-full ${isOn ? 'bg-white/25 text-white' : 'bg-[var(--acc-500)] text-white'}`}>
                                {storeTaskCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                  )}
                  
                  <div className="space-y-6 pb-24 w-full">
                    {tasksLoading ? (
                      <div className="space-y-6 animate-pulse"><div className={`h-32 ${appCard}`}></div></div>
                    ) : filteredTasks.length === 0 ? (
                      <div className="py-24 text-center flex flex-col items-center gap-6 text-gray-400 font-black uppercase tracking-[0.2em] w-full">
                        <div className="w-24 h-24 border-4 border-gray-300 rounded-full flex items-center justify-center [&>svg]:scale-125"><Icon name="check" /></div>
                        <p className={`${appText.body} normal-case tracking-normal`}>
                          {selectedChecklistStores.length > 0
                            ? taskTab === 'active'
                              ? '選択した店舗の未実施タスクはありません（他店舗が未完了の依頼は「全店」で確認できます）'
                              : '選択した店舗の実施済みタスクはありません'
                            : 'タスクはありません'}
                        </p>
                      </div>
                    ) : filteredTasks.map((task) => {
                      const userDone = isUserDoneWithTask(task, checklistUserStores);
                      const taskKind = normalizeRequestKind(task.requestKind);
                      const kindBadge =
                        taskKind === REQUEST_KIND.store
                          ? { label: REQUEST_KIND_LABEL.store, cls: 'bg-[var(--acc-900)]' }
                          : taskKind === REQUEST_KIND.tf
                            ? { label: REQUEST_KIND_LABEL.tf, cls: 'bg-violet-700' }
                            : { label: REQUEST_KIND_LABEL.employee, cls: 'bg-[var(--acc-600)]' };
                      return (
                      <div key={task.id} className={`${appTaskCard} items-stretch xl:items-center`}>
                        <div className="flex-1 w-full min-w-0">
                          
                          <div className="flex flex-wrap gap-2 mb-3 items-center">
                            <span className={`${appTagOnAccent} ${kindBadge.cls}`}>{kindBadge.label}</span>
                            {task.targetTags && <span className={`${appTagOnAccent} bg-[var(--acc-500)]`}>{task.targetTags}</span>}
                            <span className={`${appTagPill} bg-slate-100 text-slate-700`}>{task.type}</span>
                            <span className={`${appText.meta} ml-1`}>from {task.sender}</span>
                          </div>
                          
                          <h3 className={`${appText.title} mb-4 break-words ${userDone ? 'line-through opacity-40' : ''}`}>
                            {formatContent(task.content)}
                          </h3>

                          {isStoreRequestKind(task.requestKind) &&
                            (() => {
                              const sc = task.storeCompletions || {};
                              const names = getVisibleStoreRowsForTask(task);
                              if (!names.length) return null;
                              const myStores = checklistUserStores;
                              return (
                                <div className="mb-4 space-y-2">
                                  {names.length > 6 && (
                                    <p className={appText.caption}>担当店舗 {names.length}件（スクロールで確認）</p>
                                  )}
                                  <ul className="space-y-2 max-h-64 overflow-y-auto overscroll-contain pr-0.5">
                                    {names.map((storeName) => {
                                      const done = sc[storeName];
                                      const mine = myStores.indexOf(storeName) >= 0;
                                      const rowKey = `${task.id}:${storeName}`;
                                      const busy = completingStoreKey === rowKey;
                                      const canComplete = mine && !done && !userDone;
                                      const canUndo =
                                        mine && done && emailsMatch(done.by, currentUser?.email);
                                      const interactive = canComplete || canUndo;
                                      const doneOnActiveTab = !!done && taskTab === 'active';
                                      return (
                                        <li
                                          key={storeName}
                                          className={`flex flex-wrap items-center gap-3 ${appText.body} border rounded-xl px-3 py-2.5 ${
                                            doneOnActiveTab
                                              ? 'border-slate-200 bg-slate-100 text-slate-500'
                                              : 'border-slate-300 bg-white'
                                          }`}
                                        >
                                          <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                            <span
                                              className={`font-bold min-w-0 break-words ${
                                                doneOnActiveTab ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-900'
                                              }`}
                                            >
                                              {storeName}
                                            </span>
                                            {done ? (
                                              <span className={`text-xs ${doneOnActiveTab ? 'text-slate-500' : 'text-slate-600'}`}>
                                                <span className={`font-bold ${doneOnActiveTab ? 'text-slate-600' : 'text-slate-900'}`}>完了</span>
                                                {' · '}
                                                {resolveEmployeeName(done.by, allEmployees)}
                                                {done.at && <span className="text-slate-400">（{done.at}）</span>}
                                              </span>
                                            ) : (
                                              <span className="text-xs font-bold text-slate-500">未完了</span>
                                            )}
                                          </div>
                                          {mine && (
                                            <input
                                              type="checkbox"
                                              title={
                                                canUndo
                                                  ? 'チェックを外すと完了を取り消します'
                                                  : done
                                                    ? '他の方が完了済み'
                                                    : 'この店舗を完了にする'
                                              }
                                              className="h-5 w-5 shrink-0 rounded border-2 border-slate-900 bg-white accent-black disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                              checked={!!done}
                                              disabled={busy || !interactive}
                                              onChange={(e) => {
                                                if (busy) return;
                                                if (canComplete && e.target.checked) {
                                                  handleCompleteStoreCheckpoint(task, storeName);
                                                } else if (canUndo && !e.target.checked) {
                                                  if (
                                                    window.confirm('この店舗の完了を取り消しますか？\n（あなたの記録だけが削除されます。）')
                                                  ) {
                                                    handleUncompleteStoreTask(task, storeName);
                                                  }
                                                }
                                              }}
                                            />
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              );
                            })()}

                          {userDone &&
                            !isStoreRequestKind(task.requestKind) &&
                            task.employeeCompletions &&
                            task.employeeCompletions.length > 0 && (
                              <div className={`mb-4 ${appText.meta} text-slate-700 ${appSurfaceInset} px-3 py-2`}>
                                <span className="font-bold text-slate-800">実施済み: </span>
                                {task.employeeCompletions.map((p, i) => (
                                  <span key={`${p.email}-${i}`}>
                                    {resolveEmployeeName(p.email, allEmployees)}
                                    {p.time && <span className="text-slate-500">（{p.time}）</span>}
                                    {i < task.employeeCompletions.length - 1 ? '、' : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          
                          {!userDone && (
                            <div className={`flex flex-col gap-4 ${appDivider} pt-4`}>
                              
                              <div className="flex flex-wrap gap-3 items-center">
                                <div className={`flex items-center gap-3 ${appSurfaceInset} px-4 py-2`}>
                                  <span className={`${appText.caption} text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200`}>提出期限</span>
                                  <span className={`${appText.body} font-bold text-slate-800`}>{task.deadline ? task.deadline.replace(/-/g, '/') + ' まで' : '期限なし'}</span>
                                </div>

                                {task.daysRemaining !== null && task.daysRemaining !== undefined && (
                                  <>
                                    {task.daysRemaining < 0 && (
                                      <div className="flex items-center justify-center px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold animate-pulse">⚠ 超過</div>
                                    )}
                                    {task.daysRemaining === 0 && (
                                      <div className="flex items-center justify-center px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold">今日まで</div>
                                    )}
                                    {task.daysRemaining === 1 && (
                                      <div className="flex items-center justify-center px-4 py-2 bg-orange-400 text-white rounded-lg text-xs font-bold">明日まで</div>
                                    )}
                                    {task.daysRemaining === 2 && (
                                      <div className="flex items-center justify-center px-4 py-2 bg-amber-300 text-slate-800 rounded-lg text-xs font-bold">残り2日</div>
                                    )}
                                  </>
                                )}
                              </div>

                              <div className="flex flex-col gap-4 w-full mt-4">
                                {task.urls && task.urls.map((u, i) => u && typeof u === 'string' && u.trim() !== '' && (
                                  <a key={i} href={u} target="_blank" rel="noreferrer" className={appLinkBtn}>
                                    <Icon name="link" /> リンクを開く
                                  </a>
                                ))}
                                {task.images && task.images.map((imgUrl, i) => {
                                  if (!imgUrl || typeof imgUrl !== 'string' || !imgUrl.trim()) return null;
                                  const kind = attachmentKindFromUrl(imgUrl);
                                  const attachLabel = kind === 'zip' ? 'ZIPを開く' : kind === 'pdf' ? 'PDFを開く' : '添付を開く';
                                  const attachIcon = kind === 'zip' ? 'fileZip' : kind === 'pdf' ? 'filePdf' : 'image';
                                  return (
                                    <a key={`img-${i}`} href={imgUrl} target="_blank" rel="noreferrer" className={`${appLinkBtn} bg-amber-50 hover:bg-amber-100 border-amber-200/60`}>
                                      <Icon name={attachIcon} /> {attachLabel}
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0 border-t xl:border-t-0 border-l-0 xl:border-l border-slate-200/80 pt-4 xl:pt-0 xl:pl-6 flex items-center justify-center w-full xl:w-auto mt-4 xl:mt-0">
                          {!userDone ? (
                            isStoreRequestKind(task.requestKind) ? (
                              <button
                                type="button"
                                onClick={() => setStoreBulkModal({ isOpen: true, task, step: 'confirm' })}
                                className={`${appBtnSecondary} px-4 py-3 max-w-[11rem] text-center leading-snug border-slate-900/20 hover:bg-slate-900 hover:text-white hover:border-slate-900`}
                              >
                                全て完了にする
                              </button>
                            ) : (
                              <button
                                onClick={() => openConfirmModal(task)}
                                className="w-14 h-14 rounded-xl border border-slate-900 bg-white text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center shadow-sm group"
                              >
                                <span className="group-hover:scale-110 transition-transform inline-flex"><Icon name="check" /></span>
                              </button>
                            )
                          ) : isStoreRequestKind(task.requestKind) ? (
                            <div className="flex flex-col items-center gap-2 max-w-[10rem] text-center">
                              <div className="w-14 h-14 rounded-xl border border-[var(--acc-200)] bg-[var(--acc-50)] text-[var(--acc-700)] flex items-center justify-center">
                                <span className="inline-flex"><Icon name="check" /></span>
                              </div>
                              <p className={`${appText.badgeNum} text-slate-500 leading-snug`}>
                                取り消しは左の店舗のチェックを外してください
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 flex items-center justify-center">
                                <span className="inline-flex"><Icon name="check" /></span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUncompleteEmployeeTask(task)}
                                className={`${appText.badgeNum} text-slate-500 hover:text-rose-600 underline underline-offset-2 whitespace-nowrap`}
                              >
                                完了を取り消す
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                </div>
              )}
              </div>
            </div>
          </main>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        /* ViteのデフォルトCSSを完全リセットし、幅の制限を破壊する */
        html, body, #root { 
          margin: 0 !important; 
          padding: 0 !important; 
          max-width: none !important; 
          width: 100% !important; 
          height: 100% !important; 
          text-align: left !important; 
        }
        body { background: #f2f2f7; font-family: 'Noto Sans JP', sans-serif; -webkit-font-smoothing: antialiased; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes screenForward { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes screenBack { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .app-screen-forward { animation: screenForward 0.32s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .app-screen-back { animation: screenBack 0.32s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .app-screen-fade { animation: fadeIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
@keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        @keyframes loginOrb { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(12px, -18px) scale(1.06); } }
        @keyframes loginPop { 0% { opacity: 0; transform: translateY(18px) scale(0.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes loginCardIn { 0% { opacity: 0; transform: translateY(24px) scale(0.97); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes loginShine { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        @keyframes actionToastIn { from { opacity: 0; transform: translateY(10px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .action-toast { animation: actionToastIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .login-screen .login-orb { position: absolute; border-radius: 9999px; filter: blur(48px); opacity: 0.45; }
        .login-orb-a { width: 280px; height: 280px; top: 8%; left: -8%; background: var(--acc-300); animation: loginOrb 9s ease-in-out infinite; }
        .login-orb-b { width: 220px; height: 220px; bottom: 10%; right: -6%; background: var(--acc-400); animation: loginOrb 11s ease-in-out infinite reverse; }
        .login-orb-c { width: 160px; height: 160px; top: 42%; right: 18%; background: var(--acc-200); animation: loginOrb 13s ease-in-out infinite; opacity: 0.35; }
        .login-card { animation: loginCardIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .login-pop { opacity: 0; animation: loginPop 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .login-delay-1 { animation-delay: 0.08s; }
        .login-delay-2 { animation-delay: 0.16s; }
        .login-delay-3 { animation-delay: 0.24s; }
        .login-delay-4 { animation-delay: 0.32s; }
        .login-delay-5 { animation-delay: 0.4s; }
        .login-input-focus:focus { box-shadow: 0 0 0 4px color-mix(in oklch, var(--acc-500) 22%, transparent); }
        .login-btn-shine { background-size: 220% auto; background-image: linear-gradient(105deg, var(--acc-500) 0%, var(--acc-400) 40%, var(--acc-600) 60%, var(--acc-500) 100%); animation: loginShine 4s linear infinite; }

        .text-center-last { text-align-last: center; }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
      `}} />
    </Fragment>
  );
}