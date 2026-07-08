var QUIZ_RESULT_CONFIG = {
  spreadsheetId: '1NvJrgfanwN8XMu9YQh5tFbrqDHxU7fuJYJteLzfKqbI',
  sheetName: 'テスト',
  questionCount: 6,
  headers: [
    '名前',
    'メールアドレス',
    '1問目',
    '2問目',
    '3問目',
    '4問目',
    '5問目',
    '6問目',
    '合格/不合格',
  ],
};

function doGet(e) {
  return handleQuizResultRequest_(e);
}

function doPost(e) {
  return handleQuizResultRequest_(e);
}

function handleQuizResultRequest_(e) {
  var params = getQuizParams_(e);
  var callback = String(params.callback || '');

  try {
    if (params.action === 'ping') {
      return createQuizOutput_({ ok: true, message: 'ready' }, callback);
    }

    var result = saveQuizResult_(params);
    return createQuizOutput_(result, callback);
  } catch (err) {
    return createQuizOutput_(
      {
        ok: false,
        message: err && err.message ? err.message : '記録できませんでした。',
      },
      callback
    );
  }
}

function saveQuizResult_(params) {
  var email = normalizeQuizEmail_(params.email);
  if (!email) {
    throw new Error('メールアドレスを入力してください。');
  }

  var answers = parseQuizAnswers_(params, QUIZ_RESULT_CONFIG.questionCount);
  var passed = answers.every(function (answer) {
    return answer === true;
  });
  var marks = answers.map(function (answer) {
    return answer ? '○' : '×';
  });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var ss = SpreadsheetApp.openById(QUIZ_RESULT_CONFIG.spreadsheetId);
    var sheet = ss.getSheetByName(QUIZ_RESULT_CONFIG.sheetName);
    if (!sheet) {
      throw new Error('シート「' + QUIZ_RESULT_CONFIG.sheetName + '」が見つかりません。');
    }

    ensureQuizHeaders_(sheet);
    var rowInfo = findQuizRowByEmail_(sheet, email);
    if (!rowInfo.row) {
      throw new Error('このメールアドレスは集計表に登録されていません。');
    }

    sheet
      .getRange(rowInfo.row, 3, 1, QUIZ_RESULT_CONFIG.questionCount + 1)
      .setValues([marks.concat([passed ? '合格' : '不合格'])]);

    return {
      ok: true,
      name: rowInfo.name,
      passed: passed,
      message: passed
        ? '合格として記録しました。'
        : '結果を記録しました。不合格です。もう一度確認してください。',
    };
  } finally {
    lock.releaseLock();
  }
}

function getQuizParams_(e) {
  var params = {};
  var source = e && e.parameter ? e.parameter : {};
  Object.keys(source).forEach(function (key) {
    params[key] = source[key];
  });

  if (e && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      Object.keys(body || {}).forEach(function (key) {
        params[key] = body[key];
      });
    } catch (err) {
      // Form or JSONP requests do not need JSON body parsing.
    }
  }

  return params;
}

function parseQuizAnswers_(params, count) {
  var answers = [];

  if (params.answers) {
    try {
      var parsed = JSON.parse(params.answers);
      if (Array.isArray(parsed)) {
        answers = parsed;
      }
    } catch (err) {
      throw new Error('回答データを読み取れませんでした。');
    }
  }

  if (!answers.length) {
    for (var i = 1; i <= count; i += 1) {
      answers.push(params['q' + i]);
    }
  }

  if (answers.length !== count) {
    throw new Error(count + '問すべて回答してください。');
  }

  return answers.map(function (answer) {
    return answer === true || answer === 'true' || answer === '1' || answer === 1 || answer === '○';
  });
}

function findQuizRowByEmail_(sheet, email) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { row: 0, name: '' };
  }

  var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = 0; i < values.length; i += 1) {
    var rowEmail = normalizeQuizEmail_(values[i][1]);
    if (rowEmail && rowEmail === email) {
      return {
        row: i + 2,
        name: String(values[i][0] || ''),
      };
    }
  }

  return { row: 0, name: '' };
}

function ensureQuizHeaders_(sheet) {
  var headers = QUIZ_RESULT_CONFIG.headers;
  var current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var changed = false;

  for (var i = 0; i < headers.length; i += 1) {
    if (!current[i]) {
      current[i] = headers[i];
      changed = true;
    }
  }

  if (changed) {
    sheet.getRange(1, 1, 1, headers.length).setValues([current]);
  }
}

function normalizeQuizEmail_(value) {
  return String(value || '').trim().toLowerCase();
}

function createQuizOutput_(payload, callback) {
  var json = JSON.stringify(payload);
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
