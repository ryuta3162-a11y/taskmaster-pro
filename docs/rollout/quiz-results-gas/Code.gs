var QUIZ_RESULT_CONFIG = {
  spreadsheetId: '1NvJrgfanwN8XMu9YQh5tFbrqDHxU7fuJYJteLzfKqbI',
  sheetName: 'テスト',
  questionCount: 6,
  correctAnswers: [
    { target: 'store', method: 'scheduled' },
    { target: 'employee', method: 'new' },
    { target: 'team', method: 'new' },
    { target: 'store', method: 'repost' },
    { target: 'store', method: 'scheduled' },
    { target: 'employee', method: 'new' },
  ],
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
  var action = String(params.action || 'submit').toLowerCase();

  try {
    if (action === 'ping') {
      return createQuizOutput_({ ok: true, message: 'ready' }, callback);
    }
    if (action === 'verify') {
      return createQuizOutput_(verifyQuizEmail_(params), callback);
    }
    return createQuizOutput_(saveQuizResult_(params), callback);
  } catch (err) {
    return createQuizOutput_(
      {
        ok: false,
        message: err && err.message ? err.message : '処理できませんでした。',
      },
      callback
    );
  }
}

function verifyQuizEmail_(params) {
  var email = normalizeQuizEmail_(params.email);
  if (!email) {
    throw new Error('メールアドレスを入力してください。');
  }

  var sheet = getQuizSheet_();
  ensureQuizHeaders_(sheet);
  var rowInfo = findQuizRowByEmail_(sheet, email);
  if (!rowInfo.row) {
    return {
      ok: false,
      message: 'このメールアドレスは集計表に登録されていません。',
    };
  }

  return {
    ok: true,
    name: rowInfo.name,
    message: '確認できました。',
  };
}

function saveQuizResult_(params) {
  var email = normalizeQuizEmail_(params.email);
  if (!email) {
    throw new Error('メールアドレスを入力してください。');
  }

  var selectedAnswers = parseSelectedAnswers_(params, QUIZ_RESULT_CONFIG.questionCount);
  var scored = scoreQuizAnswers_(selectedAnswers);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = getQuizSheet_();
    ensureQuizHeaders_(sheet);
    var rowInfo = findQuizRowByEmail_(sheet, email);
    if (!rowInfo.row) {
      throw new Error('このメールアドレスは集計表に登録されていません。');
    }

    sheet
      .getRange(rowInfo.row, 3, 1, QUIZ_RESULT_CONFIG.questionCount + 1)
      .setValues([scored.marks.concat([scored.passed ? '合格' : '不合格'])]);

    return {
      ok: true,
      name: rowInfo.name,
      score: scored.score,
      total: QUIZ_RESULT_CONFIG.questionCount,
      passed: scored.passed,
      marks: scored.marks,
      message: scored.passed
        ? '合格として記録しました。'
        : '結果を記録しました。×の問題を見直して、もう一度回答してください。',
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
      // Form, query, and JSONP requests do not need JSON body parsing.
    }
  }

  return params;
}

function getQuizSheet_() {
  var ss = SpreadsheetApp.openById(QUIZ_RESULT_CONFIG.spreadsheetId);
  var sheet = ss.getSheetByName(QUIZ_RESULT_CONFIG.sheetName);
  if (!sheet) {
    var sheets = ss.getSheets();
    sheet = sheets && sheets.length ? sheets[0] : null;
  }
  if (!sheet) {
    throw new Error('集計シートが見つかりません。');
  }
  return sheet;
}

function parseSelectedAnswers_(params, count) {
  var answers = [];

  if (params.details) {
    try {
      var details = JSON.parse(params.details);
      if (Array.isArray(details)) {
        answers = details.map(function (item) {
          return normalizeSelectedAnswer_(item);
        });
      }
    } catch (err) {
      throw new Error('回答データを読み取れませんでした。');
    }
  }

  if (!answers.length && params.answers) {
    try {
      var parsed = JSON.parse(params.answers);
      if (Array.isArray(parsed)) {
        answers = parsed.map(function (item) {
          return normalizeSelectedAnswer_(item);
        });
      }
    } catch (err2) {
      throw new Error('回答データを読み取れませんでした。');
    }
  }

  if (!answers.length) {
    for (var i = 1; i <= count; i += 1) {
      answers.push(
        normalizeSelectedAnswer_({
          target: params['q' + i + 'Target'],
          method: params['q' + i + 'Method'],
        })
      );
    }
  }

  if (answers.length !== count) {
    throw new Error(count + '問すべて回答してください。');
  }

  return answers;
}

function normalizeSelectedAnswer_(item) {
  if (item && typeof item === 'object') {
    return {
      target: String(item.target || '').trim(),
      method: String(item.method || '').trim(),
    };
  }
  return {
    target: '',
    method: String(item || '').trim(),
  };
}

function scoreQuizAnswers_(answers) {
  var score = 0;
  var marks = answers.map(function (answer, index) {
    var ok = isQuizAnswerCorrect_(answer, index);
    if (ok) score += 1;
    return ok ? '○' : '×';
  });

  return {
    marks: marks,
    passed: score === QUIZ_RESULT_CONFIG.questionCount,
    score: score,
  };
}

function isQuizAnswerCorrect_(answer, index) {
  var correct = QUIZ_RESULT_CONFIG.correctAnswers[index] || {};
  return answer &&
    String(answer.target || '') === String(correct.target || '') &&
    String(answer.method || '') === String(correct.method || '');
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
  var text = String(value || '');
  if (text.normalize) {
    text = text.normalize('NFKC');
  }
  return text
    .replace(/[\s\u00A0\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase();
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
