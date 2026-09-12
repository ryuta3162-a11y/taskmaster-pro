/**
 * 店舗名一括置換: イオノ松ヶ崎 → イオン松ヶ崎
 *
 * 使い方（どちらか）:
 * 1) エディタで renameIonoMatsugasakiToIon を実行
 * 2) 一時Web: ?action=renameIono&key=...（実行後ロック）
 *
 * 置換対象: 指定スプレッドシート内の全シート・文字列セル
 * （数式セルは上書きしない）
 * 例: FIT365イオノ松ヶ崎 → FIT365イオン松ヶ崎
 */
function renameIonoMatsugasakiToIon() {
  var OLD = 'イオノ松ヶ崎';
  var NEW = 'イオン松ヶ崎';
  var ids = [
    '1-ww_0rDYxmA6Mlrl1GUJtG_agE2z760cdvQ7oMIQqkc', // 新 TODOリスト
    '19KT_MNyv1yF1vVZGpeL7slPjLDIy721h216spLMsIFE', // 店舗メアド記入依頼
  ];
  var parts = [];
  for (var i = 0; i < ids.length; i++) {
    try {
      var ss = SpreadsheetApp.openById(ids[i]);
      parts.push('【' + ss.getName() + '】\n' + renameIonoInSpreadsheet_(ss, OLD, NEW));
    } catch (err) {
      parts.push('【ID ' + ids[i] + '】スキップ: ' + String(err && err.message ? err.message : err));
    }
  }
  var summary = parts.join('\n\n');
  Logger.log(summary);
  return summary;
}

function renameIonoInSpreadsheet_(ss, OLD, NEW) {
  var sheetReports = [];
  var totalCells = 0;
  var sheets = ss.getSheets();

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 1 || lastCol < 1) continue;

    var range = sheet.getRange(1, 1, lastRow, lastCol);
    var values = range.getValues();
    var formulas = range.getFormulas();
    var changed = 0;

    for (var r = 0; r < values.length; r++) {
      for (var c = 0; c < values[r].length; c++) {
        if (formulas[r][c]) continue;
        var v = values[r][c];
        if (typeof v !== 'string') continue;
        if (v.indexOf(OLD) < 0) continue;
        values[r][c] = v.split(OLD).join(NEW);
        changed++;
      }
    }

    if (changed > 0) {
      range.setValues(values);
      totalCells += changed;
      sheetReports.push(sheet.getName() + ': ' + changed + ' セル');
    }
  }

  return (
    '置換: 「' +
    OLD +
    '」→「' +
    NEW +
    '」 / 変更セル合計: ' +
    totalCells +
    '\n' +
    (sheetReports.length ? sheetReports.join('\n') : '（該当なし）')
  );
}

/** 実行前の件数確認のみ（書き込みなし） */
function previewRenameIonoMatsugasakiToIon() {
  var OLD = 'イオノ松ヶ崎';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    ss = SpreadsheetApp.openById('1-ww_0rDYxmA6Mlrl1GUJtG_agE2z760cdvQ7oMIQqkc');
  }

  var sheetReports = [];
  var totalCells = 0;
  var sheets = ss.getSheets();

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 1 || lastCol < 1) continue;

    var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var changed = 0;
    for (var r = 0; r < values.length; r++) {
      for (var c = 0; c < values[r].length; c++) {
        var v = values[r][c];
        if (typeof v === 'string' && v.indexOf(OLD) >= 0) changed++;
      }
    }
    if (changed > 0) {
      totalCells += changed;
      sheetReports.push(sheet.getName() + ': ' + changed + ' セル');
    }
  }

  var summary =
    'プレビュー（未書き込み）: 「' +
    OLD +
    '」を含むセル\n' +
    '合計: ' +
    totalCells +
    '\n' +
    (sheetReports.length ? sheetReports.join('\n') : '（該当なし）');
  Logger.log(summary);
  return summary;
}
