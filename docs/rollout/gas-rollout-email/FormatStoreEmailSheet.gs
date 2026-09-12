/**
 * 店舗メール記入シートの見た目を整える（1回実行用）
 *
 * 1. このスプレッドシート → 拡張機能 → Apps Script
 * 2. 下記をすべて貼り付けて保存
 * 3. formatStoreEmailSheet を実行（初回は権限許可）
 *
 * データ内容は変えません（書式・見出し・シート名のみ）。
 */
function formatStoreEmailSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();

  ss.rename('【記入依頼】店舗メールマスタ');
  sheet.setName('店舗メール');

  // すでに案内行がある場合は二重に足さない
  var a1 = String(sheet.getRange('A1').getValue() || '');
  if (a1.indexOf('記入案内') < 0) {
    sheet.insertRowsBefore(1, 2);

    sheet.getRange('A1:D1').merge();
    sheet.getRange('A1')
      .setValue('【記入案内】D列（青い列）に、各店舗の正しい店舗用メールを1つずつ入れてください。例: jf-xxxxx@okamoto-group.co.jp ／ 個人メールは不可')
      .setBackground('#dbeafe')
      .setFontColor('#1e3a5f')
      .setFontWeight('bold')
      .setFontSize(10)
      .setFontFamily('Meiryo')
      .setWrap(true)
      .setVerticalAlignment('middle');
    sheet.setRowHeight(1, 52);

    sheet.getRange('A2:D2').merge();
    sheet.getRange('A2')
      .setValue('DXチーム ｜ To Do List「店舗へメール共有」機能のためのマスタ整備')
      .setBackground('#f8fafc')
      .setFontColor('#64748b')
      .setFontSize(9)
      .setFontFamily('Meiryo')
      .setVerticalAlignment('middle');
    sheet.setRowHeight(2, 26);
  }

  var headerRow = 3;
  if (String(sheet.getRange('A1').getValue() || '').indexOf('記入案内') < 0) {
    headerRow = 1;
  }

  sheet.getRange(headerRow, 1, 1, 4)
    .setValues([['エリア', 'テリトリー', '店舗名', '店舗メール ← ここへ記入']]);

  var lastRow = Math.max(sheet.getLastRow(), headerRow);
  var dataStart = headerRow + 1;
  var dataCount = Math.max(0, lastRow - headerRow);

  sheet.setColumnWidth(1, 110);
  sheet.setColumnWidth(2, 110);
  sheet.setColumnWidth(3, 210);
  sheet.setColumnWidth(4, 340);
  sheet.setFrozenRows(headerRow);
  sheet.setRowHeight(headerRow, 34);

  // ヘッダー
  sheet.getRange(headerRow, 1, 1, 3)
    .setBackground('#1e3a5f')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setFontFamily('Meiryo')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.getRange(headerRow, 4)
    .setBackground('#2563eb')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setFontFamily('Meiryo')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  if (dataCount > 0) {
    var allData = sheet.getRange(dataStart, 1, dataCount, 4);
    allData
      .setFontFamily('Meiryo')
      .setFontSize(10)
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);

    // A〜C: 参照用
    for (var r = 0; r < dataCount; r++) {
      var row = dataStart + r;
      var bg = r % 2 === 0 ? '#f8fafc' : '#f1f5f9';
      sheet.getRange(row, 1, 1, 3)
        .setBackground(bg)
        .setFontColor('#334155');
    }

    // D列: 入力欄
    sheet.getRange(dataStart, 4, dataCount, 1)
      .setBackground('#eff6ff')
      .setFontColor('#0f172a')
      .setBorder(true, true, true, true, false, false, '#60a5fa', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  }

  // ヘッダーにも罫線
  sheet.getRange(headerRow, 1, 1, 4)
    .setBorder(true, true, true, true, true, true, '#1e3a5f', SpreadsheetApp.BorderStyle.SOLID);

  try {
    SpreadsheetApp.getUi().alert(
      '整形完了しました。\n\n・ファイル名: 【記入依頼】店舗メールマスタ\n・シート名: 店舗メール\n・青い D列 にメールを記入してもらってください。'
    );
  } catch (e) {
    Logger.log('formatStoreEmailSheet: done');
  }
}
