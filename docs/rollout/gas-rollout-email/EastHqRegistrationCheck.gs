/**
 * EAST本部メール一覧 vs 従業員データ（To Do 登録済み）の突合
 *
 * 1. このファイルを GAS に貼る
 * 2. listEastHqUnregisteredInTodo を実行
 * 3. 実行ログで「未登録」を確認
 */

var EAST_HQ_EMAILS = [
  'm-sakano@okamoto-group.co.jp',
  'sh-kawashima@okamoto-group.co.jp',
  'rin-watanabe@okamoto-group.co.jp',
  'n-musya@okamoto-group.co.jp',
  's-omata@okamoto-group.co.jp',
  'r-shinomoto@okamoto-group.co.jp',
  'ta-yada@okamoto-group.co.jp',
  'r-okumura@okamoto-group.co.jp',
  'k-odajima@okamoto-group.co.jp',
  'm-arikawa@okamoto-group.co.jp',
  'f-saito@okamoto-group.co.jp',
  't-higasiya@okamoto-group.co.jp',
  'r-naito@okamoto-group.co.jp',
  'saki-nakano@okamoto-group.co.jp',
  'h-taniguchi@okamoto-group.co.jp',
  'yuka-hachiya@okamoto-group.co.jp',
  'm-yokohama@okamoto-group.co.jp',
  'c-ookawa@okamoto-group.co.jp',
  'shinya-kojima@okamoto-group.co.jp',
  'ayaka-sato@okamoto-group.co.jp',
  'c-onoduka@okamoto-group.co.jp',
  't-kosuda@okamoto-group.co.jp',
  'n-ninagawa@okamoto-group.co.jp',
  's-kenmisaki@okamoto-group.co.jp',
  's-kurokawa@okamoto-group.co.jp',
  'r-horikawa@okamoto-group.co.jp',
  'h-nakata@okamoto-group.co.jp',
  'ka-yoshida@okamoto-group.co.jp',
  'n-kaneko@okamoto-group.co.jp',
  'h-wada@okamoto-group.co.jp',
  's-kakuta@okamoto-group.co.jp',
  's-takaesu@okamoto-group.co.jp',
  'k-ichikawa@okamoto-group.co.jp',
  'h-kasahara@okamoto-group.co.jp',
  's-kobayashi@okamoto-group.co.jp',
  'seima-kikuchi@okamoto-group.co.jp',
  'rurie-sato@okamoto-group.co.jp',
  'w-kojima@okamoto-group.co.jp',
];

function normEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function getRegisteredEmailSet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('従業員データ');
  if (!sheet) throw new Error('従業員データ シートがありません');
  var values = sheet.getDataRange().getValues();
  var set = {};
  for (var i = 1; i < values.length; i++) {
    var em = normEmail_(values[i][1]);
    if (em) set[em] = String(values[i][0] || '').trim();
  }
  return set;
}

/** 未登録の EAST 本部メールをログ出力 */
function listEastHqUnregisteredInTodo() {
  var registered = getRegisteredEmailSet_();
  var missing = [];
  var done = [];
  EAST_HQ_EMAILS.forEach(function (email) {
    var n = normEmail_(email);
    if (registered[n]) {
      done.push(n + ' （登録済: ' + registered[n] + '）');
    } else {
      missing.push(n);
    }
  });
  Logger.log('=== EAST本部 To Do 未登録 (' + missing.length + '名) ===');
  missing.forEach(function (e) {
    Logger.log(e);
  });
  Logger.log('=== EAST本部 To Do 登録済 (' + done.length + '名) ===');
  done.forEach(function (line) {
    Logger.log(line);
  });
}
