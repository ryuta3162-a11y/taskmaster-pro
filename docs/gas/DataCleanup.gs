/**
 * 1 回だけ実行するデータ整理（実行前に対象シートを「_旧_日時」で非表示バックアップ）
 * - 従業員データ: メールアドレス打ち間違いの重複行を削除（チームは正しい行に統合）
 * - 申請データ: 対象者一覧・完了記録の打ち間違いアドレスを正しいアドレスへ寄せ、店舗アドレスの記録を削除
 * - リマインド送信履歴・訂正履歴: 店舗アドレス／打ち間違いアドレスの記録を削除
 * - 店舗共有ログ: 共有した人が店舗アドレスの行のみ削除（宛先の店舗アドレスは正規の共有なので残す）
 */
var DATA_CLEANUP_PROP_ = 'DATA_CLEANUP_V1';
var EMAIL_FIXES_ = {
  's-ma.chida@okamoto-group.co.jp': 's-machida@okamoto-group.co.jp',
  'k-odasima@okamoto-group.co.jp': 'k-odajima@okamoto-group.co.jp'
};

/** 本人申告でアドレスを変えた人：旧アドレスの記録を新アドレスへ寄せ、旧アドレスの行を削除（新アドレスの行の内容は本人入力のまま） */
var EMAIL_MERGE_PROP_ = 'EMAIL_MERGE_V2';
var EMAIL_MERGES_ = {
  'k-odajima@okamoto-group.co.jp': 'k-odasima@okamoto-group.co.jp'
};

var OBSOLETE_SHEETS_PROP_ = 'OBSOLETE_SHEETS_V1';
var OBSOLETE_SHEET_NAMES_ = ['26年度EAST10/1', '新店舗データ（新組織）'];

/** 移行が済んで不要になったシートを 1 回だけ削除 */
function deleteObsoleteSheetsOnce_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(OBSOLETE_SHEETS_PROP_)) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var deleted = [];
  ss.getSheets().forEach(function (sh) {
    var name = String(sh.getName()).trim();
    if (OBSOLETE_SHEET_NAMES_.indexOf(name) < 0) return;
    ss.deleteSheet(sh);
    deleted.push(name);
  });
  props.setProperty(OBSOLETE_SHEETS_PROP_, new Date().toISOString());
  writeSystemLog_('不要シートの削除', deleted.length ? deleted.join('、') + ' を削除' : '対象シートなし');
}

function runEmailMergeOnce_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(EMAIL_MERGE_PROP_)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var mapEmail = function (em) {
    var n = normalizeTaskEmail(em);
    return EMAIL_MERGES_[n] || n;
  };
  var nm = function (s) { return String(s || '').replace(/[\s\u3000]+/g, ''); };
  var report = [];

  // ---- 検証（ここで失敗したら何も変更しない） ----
  var emp = ss.getSheetByName('従業員データ');
  var req = ss.getSheetByName('申請データ');
  if (!emp || !req) throw new Error('従業員データ または 申請データ がありません');
  var ev = emp.getDataRange().getValues();
  var delRows = [];
  Object.keys(EMAIL_MERGES_).forEach(function (oldEm) {
    var newEm = EMAIL_MERGES_[oldEm];
    var oi = -1, ni = -1;
    for (var i = 1; i < ev.length; i++) {
      var n = normalizeTaskEmail(ev[i][1]);
      if (n === oldEm) oi = i;
      if (n === newEm) ni = i;
    }
    if (oi < 0) return;
    if (ni < 0) throw new Error('新しいアドレスの行が見つかりません: ' + newEm);
    if (nm(ev[oi][0]) !== nm(ev[ni][0])) throw new Error('名前が一致しません: ' + ev[oi][0] + ' / ' + ev[ni][0]);
    delRows.push(oi + 1);
    report.push('従業員データ: ' + ev[ni][0] + ' の旧アドレスの行（' + oldEm + '）を削除。' + newEm + ' の行は本人入力のまま');
  });

  // ---- バックアップ ----
  var stamp = Utilities.formatDate(new Date(), 'JST', 'yyyyMMdd_HHmm');
  ['申請データ', '従業員データ', 'リマインド送信履歴', '訂正履歴', '店舗共有ログ'].forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) return;
    var copy = sh.copyTo(ss);
    copy.setName(name + '_旧_' + stamp);
    copy.hideSheet();
  });

  // ---- 従業員データ ----
  delRows.sort(function (a, b) { return b - a; }).forEach(function (r) { emp.deleteRow(r); });

  // ---- 申請データ（N: 対象者一覧 / O: 完了記録） ----
  var last = req.getLastRow();
  if (last >= 2) {
    var block = req.getRange(2, 14, last - 1, 2).getValues();
    var changedRows = 0, remappedTargets = 0, remappedDone = 0;
    block.forEach(function (cells) {
      var rowChanged = false;
      var before = parseTargetEmails(cells[0]);
      var after = [];
      before.forEach(function (em) {
        var m = mapEmail(em);
        if (m !== em) remappedTargets++;
        if (after.indexOf(m) < 0) after.push(m);
      });
      if (after.join(',') !== before.join(',')) { cells[0] = after.join(','); rowChanged = true; }

      var rawO = String(cells[1] || '').trim();
      var j = null;
      try { j = rawO ? JSON.parse(rawO) : null; } catch (e) { j = null; }
      if (Array.isArray(j)) {
        var seen = {};
        var arr = [];
        var oChanged = false;
        j.forEach(function (d) {
          var orig = normalizeTaskEmail(d && d.email);
          var m = mapEmail(orig);
          if (seen[m]) { oChanged = true; return; }
          seen[m] = true;
          var c = {};
          Object.keys(d).forEach(function (k) { c[k] = d[k]; });
          if (m !== orig) { c.email = m; oChanged = true; remappedDone++; }
          arr.push(c);
        });
        if (oChanged) { cells[1] = serializeEmployeeCompletion_(arr); rowChanged = true; }
      } else if (j && j.v === 2 && j.mode === 'store' && j.stores) {
        var sChanged = false;
        Object.keys(j.stores).forEach(function (s) {
          var rec = j.stores[s] || {};
          var by = normalizeTaskEmail(rec.by);
          if (EMAIL_MERGES_[by]) { rec.by = EMAIL_MERGES_[by]; sChanged = true; remappedDone++; }
        });
        if (sChanged) { cells[1] = JSON.stringify(j); rowChanged = true; }
      }
      if (rowChanged) changedRows++;
    });
    req.getRange(2, 14, last - 1, 2).setValues(block);
    report.push('申請データ: ' + changedRows + '件の依頼で旧アドレスを新アドレスへ（対象 ' + remappedTargets + '件・完了記録 ' + remappedDone + '件）');
  }

  // ---- ログ系シート（行は消さずにアドレスだけ置き換え） ----
  var listRe = /^[^\s,]+@[^\s,]+(\s*,\s*[^\s,]+@[^\s,]+)*$/;
  ['リマインド送信履歴', '訂正履歴', '店舗共有ログ'].forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return;
    var range = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn());
    var vals = range.getValues();
    var edited = 0;
    vals.forEach(function (r) {
      var hit = false;
      for (var c = 0; c < r.length; c++) {
        var s = String(r[c] || '').trim();
        if (!s || !listRe.test(s)) continue;
        var list = parseTargetEmails(s);
        var out = [];
        list.forEach(function (em) { var m = mapEmail(em); if (out.indexOf(m) < 0) out.push(m); });
        if (out.join(',') !== list.join(',')) { r[c] = out.join(','); hit = true; }
      }
      if (hit) edited++;
    });
    if (!edited) return;
    range.setValues(vals);
    report.push(name + ': ' + edited + '行のアドレスを置き換え');
  });

  props.setProperty(EMAIL_MERGE_PROP_, new Date().toISOString());
  writeSystemLog_('アドレス統合（本人申告）', report.join('\n') + '\nバックアップ: 各シート名_旧_' + stamp);
  return report;
}

/**
 * 10月の本番開始に合わせた整理（1回だけ）
 * - 従業員データ: 新組織移行で付けた色（変更＝緑・要確認＝オレンジ）を外す
 * - 申請データ: 期限が今日以降の店舗依頼から、店舗データに無くなった店舗（未完了分のみ）を対象から外す
 */
var OCTOBER_START_PROP_ = 'OCTOBER_START_V1';

function runOctoberStartOnce_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(OCTOBER_START_PROP_)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var report = [];

  var emp = ss.getSheetByName('従業員データ');
  if (emp && emp.getLastRow() >= 2) {
    var migrationColors = [NEW_ORG_CHANGED_BG_, NEW_ORG_REVIEW_BG_].map(function (c) { return c.toLowerCase(); });
    var range = emp.getRange(2, 1, emp.getLastRow() - 1, emp.getLastColumn());
    var bgs = range.getBackgrounds();
    var cleared = 0;
    bgs.forEach(function (row) {
      for (var c = 0; c < row.length; c++) {
        if (migrationColors.indexOf(String(row[c]).toLowerCase()) >= 0) { row[c] = null; cleared++; }
      }
    });
    if (cleared) range.setBackgrounds(bgs);
    report.push('従業員データ: 移行時の色分けを ' + cleared + 'セル解除');
  }

  var req = ss.getSheetByName('申請データ');
  if (req && req.getLastRow() >= 2) {
    var storeNames = {};
    getStoreData().forEach(function (s) { storeNames[s.storeName] = true; });
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var last = req.getLastRow();
    var vals = req.getRange(2, 1, last - 1, TASK_STORE_SNAPSHOT_COL_).getValues();
    var outQ = vals.map(function (r) { return [r[TASK_STORE_SNAPSHOT_COL_ - 1]]; });
    var touched = [];
    vals.forEach(function (r, i) {
      if (!String(r[0] || '').trim() || getRequestKindFromRow_(r) !== 'store') return;
      if (!isDeadlineTodayOrLater_(r[3], today)) return;
      var snap = parseTaskStoreSnapshot_(r[TASK_STORE_SNAPSHOT_COL_ - 1]);
      if (!snap) return;
      var done = parseCompletionPayload_(String(r[14] || '')).stores || {};
      var removed = snap.filter(function (s) { return !storeNames[s] && !done[s]; });
      if (!removed.length) return;
      outQ[i][0] = JSON.stringify(snap.filter(function (s) { return removed.indexOf(s) < 0; }));
      touched.push(String(r[0]) + '（' + removed.join('、') + '）');
    });
    if (touched.length) {
      var stamp = Utilities.formatDate(new Date(), 'JST', 'yyyyMMdd_HHmm');
      var copy = req.copyTo(ss);
      copy.setName('申請データ_旧_' + stamp);
      copy.hideSheet();
      req.getRange(2, TASK_STORE_SNAPSHOT_COL_, last - 1, 1).setValues(outQ);
      report.push('申請データ: 店舗データに無い店舗を対象から外した依頼 ' + touched.length + '件 ' + touched.join(' / ') + '\nバックアップ: 申請データ_旧_' + stamp);
    } else {
      report.push('申請データ: 対象なし');
    }
  }

  props.setProperty(OCTOBER_START_PROP_, new Date().toISOString());
  writeSystemLog_('10月スタートの整理', report.join('\n'));
  return report;
}

function runDataCleanupOnce_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(DATA_CLEANUP_PROP_)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var storeMails = {};
  getStoreData().forEach(function (s) { if (s.email) storeMails[normalizeTaskEmail(s.email)] = true; });
  var isStoreMail = function (em) { return isStoreMailboxEmail_(em) || !!storeMails[em]; };
  var isRemoved = function (em) { var n = normalizeTaskEmail(em); return !!n && (isStoreMail(n) || !!EMAIL_FIXES_[n]); };
  var mapEmail = function (em) {
    var n = normalizeTaskEmail(em);
    if (!n || isStoreMail(n)) return null;
    return EMAIL_FIXES_[n] || n;
  };
  var nm = function (s) { return String(s || '').replace(/[\s\u3000]+/g, ''); };
  var splitTeams = function (s) { return String(s || '').split(/[,，、]/).map(function (t) { return t.trim(); }).filter(Boolean); };
  var report = [];

  // ---- 検証（ここで失敗したら何も変更しない） ----
  var emp = ss.getSheetByName('従業員データ');
  var req = ss.getSheetByName('申請データ');
  if (!emp || !req) throw new Error('従業員データ または 申請データ がありません');
  var ev = emp.getDataRange().getValues();
  var empPlan = [];
  Object.keys(EMAIL_FIXES_).forEach(function (bad) {
    var good = EMAIL_FIXES_[bad];
    var bi = -1, gi = -1;
    for (var i = 1; i < ev.length; i++) {
      var n = normalizeTaskEmail(ev[i][1]);
      if (n === bad) bi = i;
      if (n === good) gi = i;
    }
    if (bi < 0) return;
    if (gi < 0) throw new Error('正しいアドレスの行が見つかりません: ' + good);
    if (nm(ev[bi][0]) !== nm(ev[gi][0])) throw new Error('名前が一致しません: ' + ev[bi][0] + ' / ' + ev[gi][0]);
    var teams = splitTeams(ev[gi][2]);
    var added = splitTeams(ev[bi][2]).filter(function (t) { return teams.indexOf(t) < 0; });
    empPlan.push({ badRow: bi + 1, goodRow: gi + 1, name: String(ev[gi][0]), bad: bad, good: good, teams: teams.concat(added), added: added });
  });

  // ---- バックアップ ----
  var stamp = Utilities.formatDate(new Date(), 'JST', 'yyyyMMdd_HHmm');
  ['申請データ', '従業員データ', 'リマインド送信履歴', '訂正履歴', '店舗共有ログ'].forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) return;
    var copy = sh.copyTo(ss);
    copy.setName(name + '_旧_' + stamp);
    copy.hideSheet();
  });

  // ---- 従業員データ ----
  empPlan.forEach(function (p) {
    if (p.added.length) emp.getRange(p.goodRow, 3).setValue(p.teams.join(', '));
    report.push('従業員データ: ' + p.name + ' の重複行（' + p.bad + '）を削除' + (p.added.length ? '、チームに「' + p.added.join('、') + '」を追加' : ''));
  });
  empPlan.map(function (p) { return p.badRow; }).sort(function (a, b) { return b - a; }).forEach(function (r) { emp.deleteRow(r); });

  // ---- 申請データ（N: 対象者一覧 / O: 完了記録） ----
  var last = req.getLastRow();
  if (last >= 2) {
    var block = req.getRange(2, 14, last - 1, 2).getValues();
    var changedRows = 0, droppedTargets = 0, droppedDone = 0, droppedStoreDone = 0, remapped = 0;
    block.forEach(function (cells) {
      var before = parseTargetEmails(cells[0]);
      var seen = {};
      var after = [];
      before.forEach(function (em) {
        var m = mapEmail(em);
        if (!m) { droppedTargets++; return; }
        if (m !== em) remapped++;
        if (seen[m]) return;
        seen[m] = true;
        after.push(m);
      });
      var rowChanged = false;
      if (after.join(',') !== before.join(',')) { cells[0] = after.join(','); rowChanged = true; }

      var rawO = String(cells[1] || '').trim();
      var j = null;
      try { j = rawO ? JSON.parse(rawO) : null; } catch (e) { j = null; }
      if (Array.isArray(j)) {
        var seenDone = {};
        var arr = [];
        var oChanged = false;
        j.forEach(function (d) {
          var orig = normalizeTaskEmail(d && d.email);
          var m = mapEmail(orig);
          if (!m) { droppedDone++; oChanged = true; return; }
          if (seenDone[m]) { oChanged = true; return; }
          seenDone[m] = true;
          var c = {};
          Object.keys(d).forEach(function (k) { c[k] = d[k]; });
          if (m !== orig) { c.email = m; oChanged = true; }
          arr.push(c);
        });
        if (oChanged) { cells[1] = serializeEmployeeCompletion_(arr); rowChanged = true; }
      } else if (j && j.v === 2 && j.mode === 'store' && j.stores) {
        var sChanged = false;
        Object.keys(j.stores).forEach(function (s) {
          var rec = j.stores[s] || {};
          var by = normalizeTaskEmail(rec.by);
          if (by && isStoreMail(by)) { delete j.stores[s]; droppedStoreDone++; sChanged = true; }
          else if (EMAIL_FIXES_[by]) { rec.by = EMAIL_FIXES_[by]; sChanged = true; }
        });
        if (sChanged) { cells[1] = JSON.stringify(j); rowChanged = true; }
      }
      if (rowChanged) changedRows++;
    });
    req.getRange(2, 14, last - 1, 2).setValues(block);
    report.push('申請データ: ' + changedRows + '件の依頼を整理（対象から店舗アドレス ' + droppedTargets + '件削除・打ち間違い ' + remapped + '件を正しいアドレスへ、社員完了記録の店舗アドレス ' + droppedDone + '件削除、店舗完了記録（店舗アドレスで操作）' + droppedStoreDone + '件削除）');
  }

  // ---- ログ系シート ----
  var rewrite = function (name, keepFn, cellFn) {
    var sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return;
    var lr = sh.getLastRow(), lc = sh.getLastColumn();
    var vals = sh.getRange(2, 1, lr - 1, lc).getValues();
    var kept = vals.filter(keepFn);
    var edited = 0;
    if (cellFn) kept.forEach(function (r) { if (cellFn(r)) edited++; });
    var removed = vals.length - kept.length;
    if (!removed && !edited) return;
    sh.getRange(2, 1, lr - 1, lc).clearContent();
    if (kept.length) sh.getRange(2, 1, kept.length, lc).setValues(kept);
    report.push(name + ': ' + removed + '行削除' + (edited ? '・' + edited + '行の宛先一覧から店舗/打ち間違いアドレスを除去' : ''));
  };
  rewrite('リマインド送信履歴', function (r) { return !isRemoved(r[1]); });
  rewrite('店舗共有ログ', function (r) { return !isStoreMail(normalizeTaskEmail(r[2])); });
  var listRe = /^[^\s,]+@[^\s,]+(\s*,\s*[^\s,]+@[^\s,]+)*$/;
  rewrite('訂正履歴', function () { return true; }, function (r) {
    var hit = false;
    for (var c = 0; c < r.length; c++) {
      var s = String(r[c] || '').trim();
      if (!s || !listRe.test(s)) continue;
      var list = parseTargetEmails(s);
      var out = [];
      list.forEach(function (em) { var m = mapEmail(em); if (m && out.indexOf(m) < 0) out.push(m); });
      if (out.join(',') !== list.join(',')) { r[c] = out.join(','); hit = true; }
    }
    return hit;
  });

  props.setProperty(DATA_CLEANUP_PROP_, new Date().toISOString());
  writeSystemLog_('データ整理（店舗アドレス・打ち間違いアドレス）', report.join('\n') + '\nバックアップ: 各シート名_旧_' + stamp);
  return report;
}
