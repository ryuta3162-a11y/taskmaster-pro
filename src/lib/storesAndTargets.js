import {
  AREAS,
  HQ_AREA,
  HQ_STORE,
  REQUEST_KIND,
  TEAM_LEGACY_ALIASES,
} from './orgConstants.js';

export function isHqStoreName(name) {
  return String(name || '').trim() === HQ_STORE;
}
export function isHqAreaName(name) {
  return String(name || '').trim() === HQ_AREA;
}
/** 第1〜7エリアの店舗のみ（本部行を除く） */
export function getFieldStores(allStores) {
  return (allStores || []).filter((s) => !isHqStoreName(s.storeName) && !isHqAreaName(s.area));
}
export function getFieldStoreNames(allStores) {
  return getFieldStores(allStores).map((s) => s.storeName);
}

/** 従業員データのチーム列（カンマ区切り可）を配列に */
export function parseEmployeeTeams(teamStr) {
  return String(teamStr || '')
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => TEAM_LEGACY_ALIASES[t] || t);
}

/** 未選択または全チーム選択時は true。それ以外は所属チームとの交差 */
export function employeeMatchesTeams(emp, selectedTeams, teamsList) {
  if (!selectedTeams?.length || selectedTeams.length === teamsList.length) return true;
  const empTeams = parseEmployeeTeams(emp.team);
  if (empTeams.length === 0) return true;
  return empTeams.some((t) => selectedTeams.includes(t));
}

/**
 * スプレッドシートに保存された targetTags 文字列から、配信先の店舗・役職・チームを復元（再投稿用）
 * チームは 〈DX, 販促〉 形式（無ければ全チーム）
 */
export function parseTargetTagsToSelection(tagStr, allStores, areasList, rolesList, teamsList) {
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
export function deriveStoresAndRolesFromTargets(targetEmails, allEmployees, allStoreNamesList, rolesList, teamsList) {
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

export function normalizeRecipientEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** 配信先候補の一致判定（社員=役職 / 店舗=管轄店舗 / TF=所属チーム） */
export function employeeMatchesTargetFilters(
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
export function computeTargetRecipientsList({
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
export function computeTargetRecipientEmails(params) {
  return new Set(computeTargetRecipientsList(params).map((r) => r.email));
}

export function filterRecipientsByExclusions(recipients, excludedEmails) {
  const excluded = new Set((excludedEmails || []).map(normalizeRecipientEmail));
  return recipients.filter((r) => !excluded.has(normalizeRecipientEmail(r.email)));
}

/** 保存済み targets（メール配列）から、候補一覧に対する除外リストを作る */
export function excludedEmailsFromSavedTargets(candidates, savedTargetEmails) {
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
export function taskMatchesStoreFilter(targetTagsStr, filterKey, allStores, requestKind, targetStoreNames) {
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

export function resolveEmployeeName(email, allEmployees) {
  if (email == null || email === '') return '—';
  const norm = String(email).trim().toLowerCase();
  const found = allEmployees.find((emp) => String(emp.email || '').trim().toLowerCase() === norm);
  return found?.name || String(email);
}

export function emailsMatch(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

/** 店舗データからエリア別テリトリー一覧（スプレッドシート「店舗データ」と同期） */
export function getTerritoriesForArea(area, allStores) {
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

export function normalizeRequestKind(raw) {
  const k = String(raw || '').trim().toLowerCase();
  if (k === REQUEST_KIND.store) return REQUEST_KIND.store;
  if (k === REQUEST_KIND.tf) return REQUEST_KIND.tf;
  return REQUEST_KIND.employee;
}

export function isStoreRequestKind(kind) {
  return normalizeRequestKind(kind) === REQUEST_KIND.store;
}

/** 管轄店舗リストを常に配列に正規化（スプレッドシート由来の不正値で落ちないように） */
export function asUserStoreList(stores) {
  if (Array.isArray(stores)) return stores.map((s) => String(s || '').trim()).filter(Boolean);
  if (stores != null && typeof stores === 'string') {
    return stores.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function isHqEmployee(emp) {
  if (isHqAreaName(emp?.area)) return true;
  return asUserStoreList(emp?.stores).some(isHqStoreName);
}

/** スプレッドシートの従業員行 → 登録フォーム用 regData */
export function parseEmployeeToRegData(emp, allStores = []) {
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

export const emptyRegData = () => ({ name: '', role: '', team: [], area: [], territory: {}, stores: [], hqAffiliation: false });

export function getTaskTargetStoreNames(task) {
  if (Array.isArray(task?.targetStoreNames) && task.targetStoreNames.length) {
    return task.targetStoreNames.map((s) => String(s || '').trim()).filter(Boolean);
  }
  return Object.keys(task?.storeCompletions || {});
}

export function taskMatchesChecklistStoreSelection(task, selectedStores, allStores, myStores) {
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
export function getMyRelevantStoreNamesForTask(task, myStores) {
  const safeMyStores = asUserStoreList(myStores);
  const targets = getTaskTargetStoreNames(task);
  return targets.filter((s) => safeMyStores.indexOf(s) >= 0);
}

/** 店舗依頼: 自分の担当分がすべて完了済みか（リストの未実施/実施済み判定用） */
export function isUserDoneWithStoreTask(task, myStores) {
  const relevant = getMyRelevantStoreNamesForTask(task, myStores);
  if (relevant.length === 0) return false;
  const sc = task?.storeCompletions || {};
  return relevant.every((s) => !!sc[s]);
}

/** チェックリスト上で「実施済み」タブに出すか */
export function isUserDoneWithTask(task, myStores) {
  if (isStoreRequestKind(task?.requestKind)) return isUserDoneWithStoreTask(task, myStores);
  return !!task?.completed;
}

/** 店舗依頼: 未実施タブに表示する担当店舗（店舗チップ絞り込み後） */
export function getMyPendingStoreNamesForChecklist(task, myStores, selectedStores) {
  if (!isStoreRequestKind(task?.requestKind)) return [];
  let names = getMyRelevantStoreNamesForTask(task, myStores);
  if (!names.length) return [];
  const sel = asUserStoreList(selectedStores);
  if (sel.length) names = names.filter((s) => sel.indexOf(s) >= 0);
  const sc = task?.storeCompletions || {};
  return names.filter((s) => !sc[s]);
}

/** 店舗依頼: 実施済みタブに表示する担当店舗（店舗チップ絞り込み後） */
export function getMyCompletedStoreNamesForChecklist(task, myStores, selectedStores) {
  if (!isStoreRequestKind(task?.requestKind)) return [];
  let names = getMyRelevantStoreNamesForTask(task, myStores);
  if (!names.length) return [];
  const sel = asUserStoreList(selectedStores);
  if (sel.length) names = names.filter((s) => sel.indexOf(s) >= 0);
  const sc = task?.storeCompletions || {};
  return names.filter((s) => !!sc[s]);
}

/** 店舗チップで絞っているか */
export function hasChecklistStoreFilter(selectedStores) {
  return asUserStoreList(selectedStores).length > 0;
}

/**
 * チェックリストの未実施/実施済みタブに載せるか（空カードを出さない）
 * 店舗チップ選択時: その店舗が自分の担当に含まれる依頼は、完了済み行も表示（取り消し可）
 */
export function shouldIncludeTaskInChecklistTab(task, taskTab, myStores, selectedStores) {
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
export function taskHasPendingWorkForStoreChip(task, storeName, myStores) {
  if (!isStoreRequestKind(task?.requestKind)) return false;
  return getMyPendingStoreNamesForChecklist(task, myStores, [storeName]).length > 0;
}

/** 店舗チップの件数（実施済みタブ＝その店舗で完了済みの担当がある依頼） */
export function taskHasCompletedWorkForStoreChip(task, storeName, myStores) {
  if (!isStoreRequestKind(task?.requestKind)) return false;
  return getMyCompletedStoreNamesForChecklist(task, myStores, [storeName]).length > 0;
}

/** 店舗チップに表示する件数（現在の未実施/実施済みタブに合わせる） */
export function countChecklistTasksForStoreChip(tasks, storeName, taskTab, myStores) {
  const list = Array.isArray(tasks) ? tasks : [];
  if (taskTab === 'completed') {
    return list.filter((t) => taskHasCompletedWorkForStoreChip(t, storeName, myStores)).length;
  }
  return list.filter((t) => taskHasPendingWorkForStoreChip(t, storeName, myStores)).length;
}

export function applyStoreCompletionToTask(task, storeCompletions, myStores) {
  const next = { ...task, storeCompletions };
  if (isStoreRequestKind(task?.requestKind)) {
    next.completed = isUserDoneWithStoreTask(next, myStores);
  }
  return next;
}
