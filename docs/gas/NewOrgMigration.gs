/**
 * 新組織（26年度EAST10/1）への一括移行。
 * ?page=neworg で内容確認、?page=neworg&run=1 で実行（管理者のみ・1 回限り）。
 * 1. 店舗データ・従業員データをバックアップ（_旧_日時 シート）
 * 2. 店舗データ ← 新店舗データ（新組織）
 * 3. 従業員データ E/F/H列〜 を NEW_ORG_EMPLOYEE_STORES_ の内容に更新し、変わったセルを緑で塗る
 *    新組織に載っていない人はそのまま残し、A列をオレンジで塗る（要確認）
 */
var NEW_ORG_DONE_PROP_ = 'NEW_ORG_MIGRATED_AT';
var NEW_ORG_CHANGED_BG_ = '#b7e1cd';
var NEW_ORG_REVIEW_BG_ = '#fce5cd';

function trimCell_(v) {
  return String(v == null ? '' : v).trim();
}

function computeNewOrgEmployeeChanges_(empValues) {
  var rows = [];
  for (var i = 1; i < empValues.length; i++) {
    var row = empValues[i];
    var email = normalizeTaskEmail(row[1]);
    if (!email) continue;
    var oldStores = row.slice(7).map(trimCell_).filter(Boolean);
    var m = NEW_ORG_EMPLOYEE_STORES_[email];
    if (!m) {
      rows.push({
        rowIndex: i, name: trimCell_(row[0]), email: email, role: trimCell_(row[6]),
        kind: 'review', oldStores: oldStores, newStores: oldStores, added: [], removed: []
      });
      continue;
    }
    var added = m.stores.filter(function (s) { return oldStores.indexOf(s) < 0; });
    var removed = oldStores.filter(function (s) { return m.stores.indexOf(s) < 0; });
    var sameOrder = oldStores.join('|') === m.stores.join('|');
    var efChanged = trimCell_(row[4]) !== m.area || trimCell_(row[5]) !== m.territory;
    rows.push({
      rowIndex: i, name: trimCell_(row[0]), email: email, role: trimCell_(row[6]),
      kind: added.length || removed.length ? 'changed' : (sameOrder && !efChanged ? 'same' : 'reorder'),
      oldStores: oldStores, newStores: m.stores, added: added, removed: removed,
      area: m.area, territory: m.territory
    });
  }
  return rows;
}

function applyNewOrgMigration_(execute) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var storeSheet = ss.getSheetByName('店舗データ');
  var newStoreSheet = ss.getSheetByName('新店舗データ（新組織）');
  var empSheet = ss.getSheetByName('従業員データ');
  if (!storeSheet || !newStoreSheet || !empSheet) throw new Error('店舗データ / 新店舗データ（新組織） / 従業員データ のいずれかがありません');

  var newStoreRows = newStoreSheet.getDataRange().getValues().slice(1)
    .map(function (r) { return [trimCell_(r[0]), trimCell_(r[1]), trimCell_(r[2]), trimCell_(r[3])]; })
    .filter(function (r) { return r[0] || r[1] || r[2] || r[3]; });

  var empValues = empSheet.getDataRange().getValues();
  var changes = computeNewOrgEmployeeChanges_(empValues);
  var result = { executed: false, newStoreCount: newStoreRows.length, changes: changes, backups: [] };
  if (!execute) return result;

  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(NEW_ORG_DONE_PROP_)) {
    throw new Error('新組織への移行は実行済みです（' + props.getProperty(NEW_ORG_DONE_PROP_) + '）');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var stamp = Utilities.formatDate(new Date(), 'JST', 'yyyyMMdd_HHmm');
    [storeSheet, empSheet].forEach(function (sh) {
      var name = sh.getName() + '_旧_' + stamp;
      sh.copyTo(ss).setName(name);
      result.backups.push(name);
    });

    var lastStoreRow = storeSheet.getLastRow();
    if (lastStoreRow >= 2) {
      storeSheet.getRange(2, 1, lastStoreRow - 1, Math.max(4, storeSheet.getLastColumn())).clearContent();
    }
    if (newStoreRows.length) storeSheet.getRange(2, 1, newStoreRows.length, 4).setValues(newStoreRows);

    var width = Math.max(empSheet.getLastColumn(), 7 + EMPLOYEE_STORE_COL_MAX) - 7;
    changes.forEach(function (c) {
      var rowNum = c.rowIndex + 1;
      if (c.kind === 'review') {
        empSheet.getRange(rowNum, 1).setBackground(NEW_ORG_REVIEW_BG_);
        return;
      }
      if (c.kind === 'same') return;
      var oldRow = empValues[c.rowIndex];
      var vals = [];
      var bgs = [];
      for (var k = 0; k < width; k++) {
        var nv = c.newStores[k] || '';
        var ov = trimCell_(oldRow[7 + k]);
        vals.push(nv);
        bgs.push(nv !== ov ? NEW_ORG_CHANGED_BG_ : null);
      }
      empSheet.getRange(rowNum, 8, 1, width).setValues([vals]).setBackgrounds([bgs]);
      if (trimCell_(oldRow[4]) !== c.area) empSheet.getRange(rowNum, 5).setValue(c.area).setBackground(NEW_ORG_CHANGED_BG_);
      if (trimCell_(oldRow[5]) !== c.territory) empSheet.getRange(rowNum, 6).setValue(c.territory).setBackground(NEW_ORG_CHANGED_BG_);
    });

    var logName = '新組織移行ログ';
    var log = ss.getSheetByName(logName) || ss.insertSheet(logName);
    log.clear();
    var logRows = [['区分', '名前', 'メール', '役職', '変更前の管轄店舗', '変更後の管轄店舗', '追加', '外れる']];
    var label = { changed: '変更', reorder: '並び・エリア表記のみ', same: '変更なし', review: '要確認（新組織に記載なし・未変更）' };
    changes.forEach(function (c) {
      logRows.push([label[c.kind], c.name, c.email, c.role, c.oldStores.join('、'), c.newStores.join('、'), c.added.join('、'), c.removed.join('、')]);
    });
    log.getRange(1, 1, logRows.length, logRows[0].length).setValues(logRows);
    log.setFrozenRows(1);

    props.setProperty(NEW_ORG_DONE_PROP_, Utilities.formatDate(new Date(), 'JST', 'yyyy/MM/dd HH:mm'));
    result.executed = true;
    return result;
  } finally {
    lock.releaseLock();
  }
}

function renderNewOrgMigrationPage_(e) {
  var email = Session.getActiveUser().getEmail();
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
    });
  };
  var body;
  if (!isAdminUser_(email)) {
    body = '<p>このページを開く権限がありません。</p>';
  } else {
    var run = e && e.parameter && e.parameter.run === '1';
    var res;
    try {
      res = applyNewOrgMigration_(run);
    } catch (err) {
      res = { error: String(err && err.message ? err.message : err) };
    }
    if (res.error) {
      body = '<p style="color:#b00020;font-weight:bold">' + esc(res.error) + '</p>';
    } else {
      var counts = { changed: 0, reorder: 0, same: 0, review: 0 };
      res.changes.forEach(function (c) { counts[c.kind]++; });
      var head = res.executed
        ? '<h2 style="color:#137333">移行を実行しました</h2><p>バックアップ: ' + esc(res.backups.join(' / ')) + '<br>変更内容はシート「新組織移行ログ」にも保存しました。</p>'
        : '<h2>新組織への移行（確認画面・まだ何も変更していません）</h2>' +
          '<p><a target="_top" style="display:inline-block;background:#1a73e8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold" href="' +
          esc(ScriptApp.getService().getUrl() + '?page=neworg&run=1') + '">この内容で移行を実行する</a></p>';
      var rows = res.changes.filter(function (c) { return c.kind !== 'same'; }).map(function (c) {
        var bg = c.kind === 'review' ? NEW_ORG_REVIEW_BG_ : c.kind === 'changed' ? '#e6f4ea' : '#fff';
        return '<tr style="background:' + bg + '"><td>' + esc(c.kind === 'review' ? '要確認' : c.kind === 'changed' ? '変更' : '表記のみ') +
          '</td><td>' + esc(c.name) + '<br><small>' + esc(c.email) + '</small></td><td>' + esc(c.role) +
          '</td><td>' + esc(c.added.join('、')) + '</td><td>' + esc(c.removed.join('、')) + '</td><td>' + esc(c.newStores.join('、')) + '</td></tr>';
      }).join('');
      body = head +
        '<p>店舗データ → 新店舗データ（新組織） ' + res.newStoreCount + ' 行に置き換え<br>' +
        '従業員データ：変更 ' + counts.changed + ' 名 / 表記のみ ' + counts.reorder + ' 名 / 変更なし ' + counts.same + ' 名 / 要確認（未変更） ' + counts.review + ' 名</p>' +
        '<table border="1" cellpadding="6" style="border-collapse:collapse;font-size:13px"><tr style="background:#f1f3f4"><th>区分</th><th>名前</th><th>役職</th><th>追加</th><th>外れる</th><th>移行後の管轄店舗</th></tr>' +
        rows + '</table>';
    }
  }
  return HtmlService.createHtmlOutput('<div style="font-family:sans-serif;padding:16px">' + body + '</div>')
    .setTitle('新組織への移行')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
