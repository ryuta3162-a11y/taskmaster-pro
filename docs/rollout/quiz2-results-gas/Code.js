var QUIZ2_CONFIG = {
  spreadsheetId: '1NvJrgfanwN8XMu9YQh5tFbrqDHxU7fuJYJteLzfKqbI',
  rosterSheetName: 'Vol.2',
  resultSheetName: 'Vol.2',
  /** 問題の順番どおり。選択肢の id は quiz2.js と同じ */
  correctAnswers: ['b', 'a', 'c', 'b', 'a', 'c', 'a', 'b', 'c', 'c'],
};

function doGet(e) {
  return handleQuiz2Request_(e);
}

function doPost(e) {
  return handleQuiz2Request_(e);
}

function handleQuiz2Request_(e) {
  var params = (e && e.parameter) || {};
  var callback = String(params.callback || '');
  var action = String(params.action || 'submit').toLowerCase();
  try {
    if (action === 'ping') return quiz2Output_({ ok: true, message: 'ready', rosterCount: countQuiz2Roster_() }, callback);
    if (action === 'verify') return quiz2Output_(verifyQuiz2Email_(params), callback);
    return quiz2Output_(saveQuiz2Result_(params), callback);
  } catch (err) {
    return quiz2Output_({ ok: false, message: err && err.message ? err.message : '処理できませんでした。' }, callback);
  }
}

function verifyQuiz2Email_(params) {
  var email = normalizeQuiz2Email_(params.email);
  if (!email) throw new Error('メールアドレスを入力してください。');
  var person = resolveQuiz2Person_(email);
  if (!person) return { ok: false, message: '社内メールアドレス（@okamoto-group.co.jp）を入力してください。' };
  return { ok: true, name: person.name, message: '確認できました。' };
}

function saveQuiz2Result_(params) {
  var email = normalizeQuiz2Email_(params.email);
  if (!email) throw new Error('メールアドレスを入力してください。');
  var person = resolveQuiz2Person_(email);
  if (!person) throw new Error('社内メールアドレス（@okamoto-group.co.jp）を入力してください。');

  var answers;
  try {
    answers = JSON.parse(String(params.answers || '[]'));
  } catch (err) {
    throw new Error('回答データを読み取れませんでした。');
  }
  var count = QUIZ2_CONFIG.correctAnswers.length;
  if (!Array.isArray(answers) || answers.length !== count) throw new Error(count + '問すべて回答してください。');

  var score = 0;
  var marks = answers.map(function (a, i) {
    var ok = String(a || '') === QUIZ2_CONFIG.correctAnswers[i];
    if (ok) score++;
    return ok ? '○' : '×';
  });
  var passed = score === count;

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getQuiz2ResultSheet_();
    var row = findQuiz2ResultRow_(sheet, email);
    var result = marks.concat([passed ? '合格' : '不合格', new Date()]);
    if (row) {
      sheet.getRange(row, 3, 1, result.length).setValues([result]);
    } else {
      sheet.appendRow([person.name, person.email].concat(result));
    }
  } finally {
    lock.releaseLock();
  }

  return {
    ok: true,
    name: person.name,
    score: score,
    total: count,
    passed: passed,
    marks: marks,
    message: passed ? '合格として記録しました。' : '結果を記録しました。×の問題を見直して、もう一度回答してください。',
  };
}

function quiz2Spreadsheet_() {
  return SpreadsheetApp.openById(QUIZ2_CONFIG.spreadsheetId);
}

function findQuiz2Roster_(email) {
  var sheet = quiz2Spreadsheet_().getSheetByName(QUIZ2_CONFIG.rosterSheetName);
  if (!sheet || sheet.getLastRow() < 2) return null;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  for (var i = 0; i < values.length; i++) {
    if (normalizeQuiz2Email_(values[i][1]) === email) {
      return { name: String(values[i][0] || ''), email: String(values[i][1] || '').trim() };
    }
  }
  return null;
}

/** 名簿にいれば名簿の名前、いなければ社内ドメインのアドレスなら名前空欄で受け付ける */
function resolveQuiz2Person_(email) {
  var person = findQuiz2Roster_(email);
  if (person) return person;
  if (!/@okamoto-group\.co\.jp$/.test(email)) return null;
  return { name: '', email: email };
}

function countQuiz2Roster_() {
  var sheet = quiz2Spreadsheet_().getSheetByName(QUIZ2_CONFIG.rosterSheetName);
  if (!sheet || sheet.getLastRow() < 2) return 0;
  return sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues()
    .filter(function (r) { return normalizeQuiz2Email_(r[0]); }).length;
}

function getQuiz2ResultSheet_() {
  var ss = quiz2Spreadsheet_();
  var sheet = ss.getSheetByName(QUIZ2_CONFIG.resultSheetName);
  if (!sheet) {
    sheet = ss.insertSheet(QUIZ2_CONFIG.resultSheetName);
    sheet.getRange(1, 1, 1, 2).setValues([['名前', 'メールアドレス']]).setFontWeight('bold').setBackground('#f1f5f9');
    sheet.setFrozenRows(1);
  }
  if (!String(sheet.getRange(1, 3).getValue() || '').trim()) {
    var headers = [];
    for (var i = 1; i <= QUIZ2_CONFIG.correctAnswers.length; i++) headers.push(i + '問目');
    headers.push('合格/不合格', '最終回答日時');
    var range = sheet.getRange(1, 3, 1, headers.length);
    sheet.getRange(1, 2).copyTo(range, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    range.setValues([headers]);
  }
  return sheet;
}

function findQuiz2ResultRow_(sheet, email) {
  if (sheet.getLastRow() < 2) return 0;
  var values = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (normalizeQuiz2Email_(values[i][0]) === email) return i + 2;
  }
  return 0;
}

function normalizeQuiz2Email_(value) {
  var text = String(value || '');
  if (text.normalize) text = text.normalize('NFKC');
  return text.replace(/[\s\u00A0\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase();
}

function quiz2Output_(payload, callback) {
  var json = JSON.stringify(payload);
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
