/**
 * 管理者向けスプレッドシートの整備。
 * - 集計シート（依頼一覧・社員別・店舗別・月別）: 元データから毎朝作り直す（元データは変更しない）
 * - 入力ガード: 従業員データの管轄店舗・役職のプルダウン、店舗名の不一致を赤表示
 * - メニュー「To-Do管理」
 */
var SHEET_SETUP_VERSION_ = '10';
var ANALYSIS_SHEETS_ = {
  tasks: '集計_依頼一覧',
  people: '集計_社員別',
  stores: '集計_店舗別',
  monthly: '集計_月別'
};
var ROLE_OPTIONS_ = ['GMG', 'A-SMG', 'SMG', 'TMG', 'CMG', 'CL', 'CF', 'IR'];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('To-Do管理')
    .addItem('集計シートを今すぐ更新', 'menuRefreshAnalysisSheets')
    .addItem('シートの見た目・入力ガードを整える', 'menuFormatSheets')
    .addToUi();
}

function menuRefreshAnalysisSheets() {
  refreshAnalysisSheets_();
  SpreadsheetApp.getActiveSpreadsheet().toast('集計シートを更新しました', 'To-Do管理', 5);
}

function menuFormatSheets() {
  formatAdminSheets_();
  applyInputGuards_();
  SpreadsheetApp.getActiveSpreadsheet().toast('見た目と入力ガードを整えました', 'To-Do管理', 5);
}

/**
 * ページ表示から呼ぶ。重い整備はその場で行わず、約1分後に裏で動くジョブを予約するだけ
 * （利用者の表示を待たせない）。
 */
function scheduleSheetSetupIfNeeded_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('SHEET_SETUP_VERSION') === SHEET_SETUP_VERSION_) return;
  var cache = CacheService.getScriptCache();
  var key = 'sheetSetupScheduled_v' + SHEET_SETUP_VERSION_;
  if (cache.get(key)) return;
  cache.put(key, '1', 21600);
  var exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'runSheetSetupJob';
  });
  if (!exists) ScriptApp.newTrigger('runSheetSetupJob').timeBased().after(60 * 1000).create();
}

/** 時間主導トリガーから 1 回だけ実行される */
function runSheetSetupJob() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'runSheetSetupJob') ScriptApp.deleteTrigger(t);
  });
  autoRunSheetSetup_();
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('SHEET_SETUP_VERSION') !== SHEET_SETUP_VERSION_) {
    var cache = CacheService.getScriptCache();
    var tries = Number(cache.get('sheetSetupRetries') || 0);
    if (tries < 5) {
      cache.put('sheetSetupRetries', String(tries + 1), 21600);
      ScriptApp.newTrigger('runSheetSetupJob').timeBased().after(2 * 60 * 1000).create();
    }
  }
}

/** 未実施のバージョンなら 1 回だけ整備する。失敗しても再試行ループにせず、システムログに残す */
function autoRunSheetSetup_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(NEW_ORG_DONE_PROP_)) return;
  if (props.getProperty('SHEET_SETUP_VERSION') === SHEET_SETUP_VERSION_) return;
  var cache = CacheService.getScriptCache();
  if (cache.get('sheetSetupRunning')) return;
  var errors = [];
  var step = function (label, fn) {
    try {
      fn();
    } catch (err) {
      errors.push(label + ': ' + String(err && err.stack ? err.stack : err));
    }
  };
  // データを書き換える処理だけロックを持つ（書式や集計の間、利用者の完了操作を待たせない）
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;
  try {
    if (props.getProperty('SHEET_SETUP_VERSION') === SHEET_SETUP_VERSION_) return;
    cache.put('sheetSetupRunning', '1', 600);
    step('データ整理', runDataCleanupOnce_);
    step('アドレス統合', runEmailMergeOnce_);
    step('10月スタートの整理', runOctoberStartOnce_);
    step('エリア・テリトリー補正', healEmployeeAreaTerritory_);
    step('従業員データの並べ替え', sortEmployeeSheet_);
  } finally {
    lock.releaseLock();
  }
  step('不要シートの削除', deleteObsoleteSheetsOnce_);
  step('集計シート', refreshAnalysisSheets_);
  step('入力ガード', applyInputGuards_);
  step('シートの見た目', formatAdminSheets_);
  props.setProperty('SHEET_SETUP_VERSION', SHEET_SETUP_VERSION_);
  cache.remove('sheetSetupRunning');
  if (errors.length) {
    props.setProperty('SHEET_SETUP_ERROR', errors.join('\n').substring(0, 8000));
    writeSystemLog_('シート整備 v' + SHEET_SETUP_VERSION_, errors.join('\n'));
  } else {
    props.deleteProperty('SHEET_SETUP_ERROR');
    writeSystemLog_('シート整備 v' + SHEET_SETUP_VERSION_, 'OK');
  }
}

/**
 * 管轄店舗（H列〜）がエリア(E)・テリトリー(F)の範囲外の人は、E/F に不足分を足す（削らない）。
 * プロフィール編集の保存時に、範囲外の店舗が外れてしまうのを防ぐ。
 */
function healEmployeeAreaTerritory_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('従業員データ');
  if (!sh || sh.getLastRow() < 2) return [];
  var values = sh.getDataRange().getValues();
  var meta = {};
  getStoreData().forEach(function (s) { meta[s.storeName] = s; });
  var areaNum = function (a) { var m = String(a).match(/第(\d+)エリア/); return m ? parseInt(m[1], 10) : 99; };
  var fixed = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!String(row[1] || '').trim()) continue;
    var stores = parseEmployeeStoresFromRow_(row).filter(function (s) { return !isHqStoreName_(s); });
    if (!stores.length || isHqAreaName_(row[4])) continue;
    var areas = String(row[4] || '').split(/[,，]/).map(function (a) { return a.trim(); }).filter(Boolean);
    var terr = {};
    var terrOrder = [];
    String(row[5] || '').split(' / ').forEach(function (part) {
      var idx = part.indexOf(':');
      if (idx < 0) return;
      var a = part.slice(0, idx).trim();
      if (!a) return;
      if (!terr[a]) { terr[a] = []; terrOrder.push(a); }
      part.slice(idx + 1).split(/,\s*/).forEach(function (t) { t = t.trim(); if (t && terr[a].indexOf(t) < 0) terr[a].push(t); });
    });
    var changed = false;
    stores.forEach(function (s) {
      var m = meta[s];
      if (!m || !m.area || isHqAreaName_(m.area)) return;
      if (areas.indexOf(m.area) < 0) { areas.push(m.area); changed = true; }
      if (!terr[m.area]) { terr[m.area] = []; terrOrder.push(m.area); }
      if (m.territory && terr[m.area].indexOf(m.territory) < 0) { terr[m.area].push(m.territory); changed = true; }
    });
    if (!changed) continue;
    areas.sort(function (a, b) { return areaNum(a) - areaNum(b); });
    var newE = areas.join(', ');
    var newF = terrOrder.slice().sort(function (a, b) { return areaNum(a) - areaNum(b); })
      .filter(function (a) { return terr[a].length; })
      .map(function (a) { return a + ': ' + terr[a].slice().sort().join(','); }).join(' / ');
    sh.getRange(i + 1, 5, 1, 2).setValues([[newE, newF]]);
    fixed.push(String(row[0] || row[1]) + '：' + String(row[4] || '') + ' / ' + String(row[5] || '') + ' → ' + newE + ' / ' + newF);
  }
  if (fixed.length) writeSystemLog_('エリア・テリトリー補正', fixed.join('\n'));
  return fixed;
}

function areaRankOf_(areaText) {
  var s = String(areaText || '').trim();
  if (!s) return 999;
  if (isHqAreaName_(s)) return 0;
  var m = s.match(/第(\d+)エリア/);
  return m ? parseInt(m[1], 10) : 900;
}

function territoryRankOf_(t) {
  var m = String(t || '').match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 900;
}

/**
 * エリア(E)・テリトリー(F)の表記を 第1→第7エリア、テリトリー1→3 の順に並べ替える（中身は増減させない）。
 * エリアが1つだけの人の「テリトリー3」のようなエリア名なしの記載は、そのエリアに付け直す。
 */
function formatAreaTerritory_(areaText, territoryText) {
  var areas = [];
  String(areaText || '').split(/[,，、]/).forEach(function (a) {
    a = a.trim();
    if (a && areas.indexOf(a) < 0) areas.push(a);
  });
  var terr = {};
  var terrAreas = [];
  var loose = [];
  String(territoryText || '').split(/\s*\/\s*/).forEach(function (part) {
    part = part.trim();
    if (!part) return;
    var idx = part.indexOf(':');
    var a = idx < 0 ? '' : part.slice(0, idx).trim();
    var list = idx < 0 ? part : part.slice(idx + 1);
    if (!a) {
      if (areas.length === 1) a = areas[0];
      else { loose.push(part); return; }
    }
    if (!terr[a]) { terr[a] = []; terrAreas.push(a); }
    list.split(/[,，、]/).forEach(function (t) {
      t = t.trim();
      if (t && terr[a].indexOf(t) < 0) terr[a].push(t);
    });
  });
  var byArea = function (a, b) { return areaRankOf_(a) - areaRankOf_(b); };
  areas.sort(byArea);
  var parts = terrAreas.slice().sort(byArea)
    .filter(function (a) { return terr[a].length; })
    .map(function (a) {
      return a + ': ' + terr[a].slice().sort(function (x, y) { return territoryRankOf_(x) - territoryRankOf_(y); }).join(',');
    });
  return { area: areas.join(', '), territory: parts.concat(loose).join(' / ') };
}

/**
 * 従業員データの行を エリア→テリトリー→役職→名前 の順に並べ、E/F の表記も整える。
 * 行番号で書き込む処理と競合しないよう、呼び出し側でスクリプトロックを持つこと。
 */
function sortEmployeeSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('従業員データ');
  if (!sh || sh.getLastRow() < 3) return;
  var n = sh.getLastRow() - 1;
  var lastCol = sh.getLastColumn();
  var range = sh.getRange(2, 1, n, lastCol);
  var values = range.getValues();
  var bgs = range.getBackgrounds();
  var fcs = range.getFontColors();
  var fws = range.getFontWeights();
  var notes = range.getNotes();

  var textFixes = [];
  var items = values.map(function (row, i) {
    if (String(row[1] || '').trim()) {
      var f = formatAreaTerritory_(row[4], row[5]);
      if (f.area !== String(row[4] || '').trim() || f.territory !== String(row[5] || '').trim()) {
        textFixes.push(String(row[0] || row[1]) + '：' + row[4] + ' / ' + row[5] + ' → ' + f.area + ' / ' + f.territory);
        row[4] = f.area;
        row[5] = f.territory;
      }
    }
    var firstTerr = String(row[5] || '').split(' / ')[0];
    var ti = firstTerr.indexOf(':');
    var role = ROLE_OPTIONS_.indexOf(String(row[6] || '').trim());
    return {
      i: i,
      empty: !String(row[0] || '').trim() && !String(row[1] || '').trim(),
      area: areaRankOf_(String(row[4] || '').split(/[,，、]/)[0]),
      terr: ti < 0 ? 900 : territoryRankOf_(firstTerr.slice(ti + 1).split(',')[0]),
      role: role < 0 ? 99 : role,
      name: String(row[0] || '')
    };
  });
  var sorted = items.slice().sort(function (a, b) {
    if (a.empty !== b.empty) return a.empty ? 1 : -1;
    return (a.area - b.area) || (a.terr - b.terr) || (a.role - b.role) ||
      a.name.localeCompare(b.name, 'ja') || (a.i - b.i);
  });
  var moved = sorted.some(function (it, k) { return it.i !== k; });
  if (!moved && !textFixes.length) return;
  var pick = function (arr) { return sorted.map(function (it) { return arr[it.i]; }); };
  range.setValues(pick(values));
  if (moved) {
    range.setBackgrounds(pick(bgs));
    range.setFontColors(pick(fcs));
    range.setFontWeights(pick(fws));
    range.setNotes(pick(notes));
  }
  if (textFixes.length) writeSystemLog_('エリア・テリトリー表記の並べ替え', textFixes.join('\n'));
  if (moved) writeSystemLog_('従業員データの並べ替え', 'エリア→テリトリー→役職→名前の順に並べ替え（' + n + '行）');
}

/** 毎朝の処理から呼ぶ。E/F の不足補正と並べ替えをロック内で行う */
function tidyEmployeeSheet_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;
  try {
    healEmployeeAreaTerritory_();
    sortEmployeeSheet_();
  } finally {
    lock.releaseLock();
  }
}

/** 非表示シート「システムログ」に記録（自動処理のエラー確認用） */
function writeSystemLog_(where, message) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('システムログ');
    if (!sh) {
      sh = ss.insertSheet('システムログ');
      sh.appendRow(['日時', '処理', '内容']);
      sh.hideSheet();
    }
    sh.appendRow([new Date(), where, String(message || '').substring(0, 45000)]);
  } catch (e) {}
}

// ---------------------------------------------------------------
// 集計の計算（シートに書かない純粋な計算。テストしやすいよう分離）
// ---------------------------------------------------------------

function toDateOrNull_(v) {
  if (!v) return null;
  var d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function dayStart_(d) {
  var x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  return x;
}

function ratio_(done, total) {
  return total ? done / total : '';
}

function computeAnalysisData_(requestRows, employees, allStores, today) {
  var areasList = getAreasListFromStores_(allStores);
  var empMap = getEmployeesByEmailMap_(employees);
  var storeMeta = {};
  allStores.forEach(function (s) { storeMeta[s.storeName] = s; });
  var assignees = buildStoreAssigneesIndex_(employees);

  var taskRows = [];
  var people = {};
  var stores = {};
  var months = {};

  function personOf(email) {
    if (!people[email]) {
      var emp = empMap[email];
      people[email] = {
        email: email,
        name: emp ? emp.name : '',
        role: emp ? emp.role : '',
        team: emp ? emp.team : '',
        area: emp ? emp.area : '',
        registered: !!emp,
        personTargets: 0, personDone: 0, personOnTime: 0, personOverdueOpen: 0,
        storeDoneOps: 0, lastDoneAt: null
      };
    }
    return people[email];
  }
  function storeOf(name) {
    if (!stores[name]) {
      stores[name] = { name: name, targets: 0, done: 0, onTime: 0, overdueOpen: 0, lastDoneAt: null };
    }
    return stores[name];
  }
  function monthOf(key) {
    if (!months[key]) {
      months[key] = { key: key, tasks: 0, employeeTasks: 0, storeTasks: 0, tfTasks: 0, units: 0, done: 0, onTime: 0 };
    }
    return months[key];
  }
  function touchLast(obj, d) {
    if (d && (!obj.lastDoneAt || d.getTime() > obj.lastDoneAt.getTime())) obj.lastDoneAt = d;
  }

  requestRows.forEach(function (row) {
    var id = String(row[0] || '').trim();
    if (!id) return;
    var created = toDateOrNull_(row[1]);
    var deadline = toDateOrNull_(row[3]);
    var deadlineEnd = deadline ? new Date(dayStart_(deadline).getTime() + 24 * 60 * 60 * 1000 - 1) : null;
    var pastDeadline = deadline ? dayStart_(deadline).getTime() < today.getTime() : false;
    var kind = getRequestKindFromRow_(row);
    var progress = computeTaskProgressAdmin_(row, allStores, areasList);
    var payload = parseCompletionPayload_(String(row[14] || '[]'));
    var refDate = created || today;
    var onTimeCount = 0;

    var mKey = created ? Utilities.formatDate(created, 'JST', 'yyyy年MM月') : '不明';
    var mon = monthOf(mKey);
    mon.tasks++;
    if (kind === 'store') mon.storeTasks++;
    else if (kind === 'tf') mon.tfTasks++;
    else mon.employeeTasks++;

    if (kind === 'store') {
      var taskStores = getTaskStoresForRow_(row, allStores, areasList);
      var sc = payload.stores || {};
      taskStores.forEach(function (sn) {
        var st = storeOf(sn);
        st.targets++;
        var rec = sc[sn];
        if (rec) {
          var at = parseLooseCompletionDate_(rec.at || '', refDate);
          st.done++;
          touchLast(st, at);
          if (!deadlineEnd || (at && at.getTime() <= deadlineEnd.getTime())) { st.onTime++; onTimeCount++; }
          var by = normalizeTaskEmail(rec.by);
          if (by) {
            var p = personOf(by);
            p.storeDoneOps++;
            touchLast(p, at);
          }
        } else if (pastDeadline) {
          st.overdueOpen++;
        }
      });
    } else {
      var targets = parseTargetEmails(String(row[13] || ''));
      var doneMap = {};
      (payload.people || []).forEach(function (d) {
        doneMap[normalizeTaskEmail(d.email)] = parseLooseCompletionDate_(d.time || d.at || '', refDate) || true;
      });
      targets.forEach(function (em) {
        var p = personOf(em);
        p.personTargets++;
        var at = doneMap[em];
        if (at) {
          p.personDone++;
          var atDate = at instanceof Date ? at : null;
          touchLast(p, atDate);
          if (!deadlineEnd || (atDate && atDate.getTime() <= deadlineEnd.getTime())) { p.personOnTime++; onTimeCount++; }
        } else if (pastDeadline) {
          p.personOverdueOpen++;
        }
      });
    }
    mon.units += progress.total || 0;
    mon.done += progress.done || 0;
    mon.onTime += onTimeCount;

    var content = String(row[5] || '').replace(/\s+/g, ' ').trim();
    taskRows.push({
      id: id,
      created: created,
      deadline: deadline,
      status: progress.complete ? '完了' : pastDeadline ? '期限超過' : '進行中',
      kindLabel: getRequestKindLabel_(kind),
      type: String(row[2] || ''),
      sender: String(row[4] || ''),
      content: content.length > 120 ? content.substring(0, 120) + '…' : content,
      targetTags: String(row[12] || ''),
      total: progress.total || 0,
      done: progress.done || 0,
      onTime: onTimeCount,
      unit: kind === 'store' ? '店舗' : '名'
    });
  });

  // 現在の従業員・店舗は依頼が 0 件でも一覧に出す
  employees.forEach(function (e) { var n = normalizeTaskEmail(e.email); if (n) personOf(n); });
  getFieldStores_(allStores).forEach(function (s) { storeOf(s.storeName); });

  taskRows.sort(function (a, b) {
    return (b.created ? b.created.getTime() : 0) - (a.created ? a.created.getTime() : 0);
  });

  return {
    taskRows: taskRows,
    people: Object.keys(people).map(function (k) { return people[k]; }),
    stores: Object.keys(stores).map(function (k) {
      var s = stores[k];
      var m = storeMeta[s.name];
      s.area = m ? m.area : '（現在の店舗データに無し）';
      s.territory = m ? m.territory : '';
      s.assignees = (assignees[s.name] || []).map(function (a) { return a.name; }).join('、');
      return s;
    }),
    months: Object.keys(months).sort().reverse().map(function (k) { return months[k]; })
  };
}

// ---------------------------------------------------------------
// シートへの書き出し
// ---------------------------------------------------------------

function writeAnalysisSheet_(ss, name, note, headers, rows, widths, pctCols, dateCols) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  var f = sh.getFilter();
  if (f) f.remove();
  sh.getBandings().forEach(function (b) { b.remove(); });
  sh.clear();
  sh.clearConditionalFormatRules();
  sh.getRange(1, 1).setValue(note).setFontColor('#5f6368').setFontSize(9).setFontStyle('italic');
  sh.getRange(2, 1, 1, headers.length).setValues([headers])
    .setBackground(SHEET_HEADER_BG_).setFontColor('#ffffff').setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  sh.setRowHeight(2, 34);
  if (rows.length) {
    sh.getRange(3, 1, rows.length, headers.length).setValues(rows).setFontSize(10).setVerticalAlignment('middle');
    (pctCols || []).forEach(function (c) {
      var r = sh.getRange(3, c, rows.length, 1);
      r.setNumberFormat('0%').setHorizontalAlignment('center');
      var rules = sh.getConditionalFormatRules();
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .setGradientMinpointWithValue('#f4c7c3', SpreadsheetApp.InterpolationType.NUMBER, '0')
        .setGradientMidpointWithValue('#fce8b2', SpreadsheetApp.InterpolationType.NUMBER, '0.7')
        .setGradientMaxpointWithValue('#b7e1cd', SpreadsheetApp.InterpolationType.NUMBER, '1')
        .setRanges([r]).build());
      sh.setConditionalFormatRules(rules);
    });
    (dateCols || []).forEach(function (c) {
      sh.getRange(3, c, rows.length, 1).setNumberFormat('yyyy/mm/dd').setHorizontalAlignment('center');
    });
    sh.getRange(3, 1, rows.length, headers.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
  }
  sh.setFrozenRows(2);
  widths.forEach(function (w, i) { if (w) sh.setColumnWidth(i + 1, w); });
  sh.getRange(2, 1, Math.max(rows.length + 1, 2), headers.length).createFilter();
  return sh;
}

function refreshAnalysisSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var reqSheet = ss.getSheetByName('申請データ');
  if (!reqSheet) return;
  var values = reqSheet.getDataRange().getValues();
  values.shift();
  var today = dayStart_(new Date());
  var data = computeAnalysisData_(values, getEmployees(), getStoreData(), today);
  var stamp = '最終更新: ' + Utilities.formatDate(new Date(), 'JST', 'yyyy/MM/dd HH:mm') +
    '（毎朝8時に自動更新・メニュー「To-Do管理」から手動更新可）※このシートは自動生成です。直接編集しないでください。';

  var taskSheet = writeAnalysisSheet_(ss, ANALYSIS_SHEETS_.tasks, stamp,
    ['依頼日', '期限', '状態', '依頼単位', '種別', '依頼者', '依頼内容', '対象', '対象数', '完了数', '実施率', '期限内完了', '期限内実施率', 'ID'],
    data.taskRows.map(function (t) {
      return [t.created || '', t.deadline || '', t.status, t.kindLabel, t.type, t.sender, t.content, t.targetTags,
        t.total + t.unit, t.done, ratio_(t.done, t.total), t.onTime, ratio_(t.onTime, t.total), t.id];
    }),
    [90, 90, 80, 90, 80, 100, 360, 200, 70, 60, 70, 80, 90, 130], [11, 13], [1, 2]);
  if (data.taskRows.length) {
    var statusRange = taskSheet.getRange(3, 3, data.taskRows.length, 1);
    var rules = taskSheet.getConditionalFormatRules();
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('期限超過').setBackground('#f4c7c3').setFontColor('#a50e0e').setRanges([statusRange]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('完了').setBackground('#ceead6').setFontColor('#137333').setRanges([statusRange]).build());
    taskSheet.setConditionalFormatRules(rules);
  }

  var people = data.people.slice().sort(function (a, b) {
    if (a.registered !== b.registered) return a.registered ? -1 : 1;
    return String(a.area).localeCompare(String(b.area), 'ja') || String(a.name).localeCompare(String(b.name), 'ja');
  });
  writeAnalysisSheet_(ss, ANALYSIS_SHEETS_.people,
    stamp + ' 社員依頼・TF依頼は本人宛の件数。店舗依頼は本人が完了操作した店舗数。従業員データから外れた人も記録は残ります。',
    ['名前', 'メール', '役職', 'チーム', 'エリア', '社員・TF依頼 対象', '完了', '実施率', '期限内完了', '期限内実施率', '期限超過で未完了', '店舗依頼 完了操作（店舗数）', '最終完了日', '従業員データ'],
    people.map(function (p) {
      return [p.name || '（未登録）', p.email, p.role, p.team, p.area, p.personTargets, p.personDone, ratio_(p.personDone, p.personTargets),
        p.personOnTime, ratio_(p.personOnTime, p.personTargets), p.personOverdueOpen, p.storeDoneOps, p.lastDoneAt || '', p.registered ? '登録あり' : '登録なし'];
    }),
    [110, 230, 60, 80, 150, 90, 60, 70, 80, 90, 100, 120, 90, 90], [8, 10], [13]);

  var storesSorted = data.stores.slice().sort(function (a, b) {
    var ax = a.territory ? 0 : 1;
    var bx = b.territory ? 0 : 1;
    if (ax !== bx) return ax - bx;
    return String(a.area).localeCompare(String(b.area), 'ja') || String(a.territory).localeCompare(String(b.territory), 'ja') || String(a.name).localeCompare(String(b.name), 'ja');
  });
  writeAnalysisSheet_(ss, ANALYSIS_SHEETS_.stores,
    stamp + ' 店舗依頼のみ。エリア・テリトリー・担当者は現在の店舗データ／従業員データ基準。閉店・名称変更前の店舗も記録は残ります。',
    ['エリア', 'テリトリー', '店舗名', '店舗依頼 対象', '完了', '実施率', '期限内完了', '期限内実施率', '期限超過で未完了', '最終完了日', '現在の担当者'],
    storesSorted.map(function (s) {
      return [s.area, s.territory, s.name, s.targets, s.done, ratio_(s.done, s.targets), s.onTime, ratio_(s.onTime, s.targets), s.overdueOpen, s.lastDoneAt || '', s.assignees];
    }),
    [110, 90, 200, 90, 60, 70, 80, 90, 100, 90, 360], [6, 8], [10]);

  writeAnalysisSheet_(ss, ANALYSIS_SHEETS_.monthly, stamp + ' 依頼日の月で集計（対象数＝社員は人数・店舗は店舗数の合計）。',
    ['月', '依頼数', '社員依頼', '店舗依頼', 'TF依頼', '対象数', '完了数', '実施率', '期限内完了', '期限内実施率'],
    data.months.map(function (m) {
      return [m.key, m.tasks, m.employeeTasks, m.storeTasks, m.tfTasks, m.units, m.done, ratio_(m.done, m.units), m.onTime, ratio_(m.onTime, m.units)];
    }),
    [90, 70, 80, 80, 70, 80, 80, 80, 90, 100], [8, 10], []);
}

// ---------------------------------------------------------------
// 入力ガード（従業員データ・店舗データ）
// ---------------------------------------------------------------

function applyInputGuards_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var emp = ss.getSheetByName('従業員データ');
  var store = ss.getSheetByName('店舗データ');
  if (!emp || !store) return;
  var maxRows = Math.max(emp.getMaxRows() - 1, 1);
  var storeCols = EMPLOYEE_STORE_COL_MAX;

  var storeList = store.getRange('C2:C');
  var storeRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(storeList, true)
    .setAllowInvalid(true)
    .setHelpText('店舗データ（C列）の店舗名から選んでください。一致しない名前はアプリで読み取れません。')
    .build();
  emp.getRange(2, EMPLOYEE_STORE_COL_START + 1, maxRows, storeCols).setDataValidation(storeRule);

  var roleRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(ROLE_OPTIONS_, true)
    .setAllowInvalid(true)
    .build();
  emp.getRange(2, 7, maxRows, 1).setDataValidation(roleRule);

  var storeRange = emp.getRange(2, EMPLOYEE_STORE_COL_START + 1, maxRows, storeCols);
  var empRules = emp.getConditionalFormatRules().filter(function (r) {
    return !r.getRanges().some(function (rg) { return rg.getColumn() === EMPLOYEE_STORE_COL_START + 1 && rg.getRow() === 2; });
  });
  empRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(H2<>"",H2<>"' + HQ_STORE + '",COUNTIF(INDIRECT("店舗データ!C:C"),H2)=0)')
    .setBackground('#ea4335').setFontColor('#ffffff').setBold(true)
    .setRanges([storeRange]).build());
  emp.setConditionalFormatRules(empRules);

  var sMax = Math.max(store.getMaxRows() - 1, 1);
  var nameRange = store.getRange(2, 3, sMax, 1);
  var mailRange = store.getRange(2, 4, sMax, 1);
  var sRules = [];
  sRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(C2<>"",COUNTIF($C:$C,C2)>1)')
    .setBackground('#ea4335').setFontColor('#ffffff').setRanges([nameRange]).build());
  sRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(C2<>"",C2<>"' + HQ_STORE + '",D2="")')
    .setBackground('#fce8b2').setRanges([mailRange]).build());
  store.setConditionalFormatRules(sRules);
  store.getRange(1, 4).setNote('黄色＝店舗メール未登録（店舗への共有メールが送れません）。赤の店舗名＝重複。');
  emp.getRange(1, EMPLOYEE_STORE_COL_START + 1).setNote('管轄店舗は店舗データの店舗名から選択。赤いセル＝店舗データに無い名前（アプリで読み取れません）。');
}
