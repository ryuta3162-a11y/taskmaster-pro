/**
 * 管理者向けスプレッドシートの整備。
 * - 集計シート（依頼一覧・社員別・店舗別・月別）: 元データから毎朝作り直す（元データは変更しない）
 * - 入力ガード: 従業員データの管轄店舗・役職のプルダウン、店舗名の不一致を赤表示
 * - メニュー「To-Do管理」
 */
var SHEET_SETUP_VERSION_ = '2';
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

/** 未実施のバージョンなら 1 回だけ整備する（ページ表示・毎朝の処理から呼ぶ） */
function autoRunSheetSetup_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(NEW_ORG_DONE_PROP_)) return;
  if (props.getProperty('SHEET_SETUP_VERSION') === SHEET_SETUP_VERSION_) return;
  var cache = CacheService.getScriptCache();
  if (cache.get('sheetSetupBackoff')) return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    if (props.getProperty('SHEET_SETUP_VERSION') === SHEET_SETUP_VERSION_) return;
    refreshAnalysisSheets_();
    applyInputGuards_();
    formatAdminSheets_();
    props.setProperty('SHEET_SETUP_VERSION', SHEET_SETUP_VERSION_);
    props.deleteProperty('SHEET_SETUP_ERROR');
  } catch (err) {
    props.setProperty('SHEET_SETUP_ERROR', Utilities.formatDate(new Date(), 'JST', 'yyyy/MM/dd HH:mm') + ' ' + String(err && err.stack ? err.stack : err));
    cache.put('sheetSetupBackoff', '1', 600);
  } finally {
    lock.releaseLock();
  }
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

    var mKey = created ? Utilities.formatDate(created, 'JST', 'yyyy-MM') : '不明';
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
