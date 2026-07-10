/**
 * ToDo List - Backend (本番運用・役職フィルター完全対応版)
 * ※ registerScheduledTask: skipInitialTask 対応・初回今月分タスク
 * ※ updateScheduledTask: 定期配信の内容更新（次回バッチから反映）
 * ※ getScheduledTasks: urls / images / targets を返す（編集画面用）
 * ※ processScheduledTasksBatch: 期限計算を共通関数に統一
 */

const CHAT_WEBHOOK_URL = 'https://chat.googleapis.com/v1/spaces/AAQAuU_-lwY/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=eiNsRAE6D3bsnatudJFW1kJdvoG75WpZBH0pfK11Iho';
const UPLOAD_FOLDER_NAME = 'TaskMaster_アップロード画像';

function doGet(e) {
  var page = e && e.parameter && e.parameter.page;
  var execBase = ScriptApp.getService().getUrl();
  var execBoot = '<script>window.__TM_EXEC_BASE__=' + JSON.stringify(execBase) + ';</script>';
  if (page === 'admin') {
    var adminHtml = HtmlService.createHtmlOutputFromFile('admin').getContent();
    adminHtml = adminHtml.indexOf('<head>') !== -1 ? adminHtml.replace('<head>', '<head>' + execBoot) : execBoot + adminHtml;
    return HtmlService.createHtmlOutput(adminHtml)
      .setTitle('ToDo 管理ダッシュボード')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if (page === 'progress') {
    var teamParam = e && e.parameter ? String(e.parameter.team || '').trim() : '';
    var progressHtml = HtmlService.createHtmlOutputFromFile('progress').getContent();
    var progressBoot = execBoot + '<script>window.__TM_PROGRESS_TEAM__=' + JSON.stringify(teamParam) + ';</script>';
    progressHtml = progressHtml.indexOf('<head>') !== -1
      ? progressHtml.replace('<head>', '<head>' + progressBoot)
      : progressBoot + progressHtml;
    return HtmlService.createHtmlOutput(progressHtml)
      .setTitle('チーム進捗ビュー')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  var title = page === 'checklist' ? 'リストチェック' : 'ToDo List';
  var html = HtmlService.createHtmlOutputFromFile('index').getContent();
  var boot = execBoot + (page === 'checklist' ? '<script>window.__TM_ENTRY_PAGE__="checklist";</script>' : '');
  html = html.indexOf('<head>') !== -1 ? html.replace('<head>', '<head>' + boot) : boot + html;
  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==============================================================
// 1. 画像アップロード処理
// ==============================================================
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    const folder = DriveApp.createFolder(folderName);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return folder;
  }
}

/** Drive ファイル名に使えない文字を除去・短縮 */
function sanitizeDriveFileName_(name) {
  var n = String(name || 'file').replace(/[/\\?*:|"<>]/g, '_').replace(/\s+/g, ' ').trim();
  if (n.length > 180) n = n.slice(0, 180);
  return n || 'file';
}

/** クライアントが data:URL ごと送った場合も base64 部分だけにする */
function normalizeBase64Payload_(b64) {
  var s = String(b64 || '').replace(/\s/g, '');
  var comma = s.indexOf(',');
  if (comma !== -1 && /base64/i.test(s.substring(0, comma))) {
    s = s.substring(comma + 1);
  }
  return s;
}

/** base64 → Blob（画像・PDF・ZIP ともバイナリを壊さない。失敗時は別方式を試す） */
function base64ToBlob_(b64, mime, fileName) {
  var clean = normalizeBase64Payload_(b64);
  if (!clean) throw new Error('base64が空です');
  var mt = mime || 'application/octet-stream';
  if ((!mime || String(mime).trim() === '') && /\.pdf$/i.test(fileName)) {
    mt = 'application/pdf';
  }
  if ((!mime || String(mime).trim() === '') && /\.zip$/i.test(fileName)) {
    mt = 'application/zip';
  }
  var baseName = sanitizeDriveFileName_(fileName);
  try {
    var dec = Utilities.base64Decode(clean, Utilities.Charset.ISO_8859_1);
    return Utilities.newBlob(dec, mt, baseName);
  } catch (e1) {
    try {
      var dec2 = Utilities.base64Decode(clean);
      return Utilities.newBlob(dec2, mt, baseName);
    } catch (e2) {
      throw new Error('デコード失敗: ' + e2.toString());
    }
  }
}

/**
 * 添付を Drive に保存。入力と同じ順序で URL を返す（失敗した枠は空文字）。
 * @return {{ urls: string[], errors: string[] }} errors は「ファイル名: 理由」形式
 */
function saveImagesToDrive(images, senderName) {
  var urls = [];
  var errors = [];
  if (!images || images.length === 0) {
    return { urls: urls, errors: errors };
  }
  var folder = getOrCreateFolder(UPLOAD_FOLDER_NAME);
  var dateStr = Utilities.formatDate(new Date(), 'JST', 'yyyyMMdd_HHmmss');
  var safeSender = sanitizeDriveFileName_(senderName || 'user').replace(/\./g, '_');

  images.forEach(function (img, idx) {
    var label = (img && img.name) ? img.name : ('添付' + (idx + 1));
    try {
      if (img && img.reuseUrl) {
        urls.push(String(img.reuseUrl).trim());
        return;
      }
      if (!img || !img.base64) {
        urls.push('');
        errors.push(label + ': 添付データがありません');
        return;
      }
      var blob = base64ToBlob_(img.base64, img.type, img.name);
      var uniqueFileName = dateStr + '_' + idx + '_' + safeSender + '_' + sanitizeDriveFileName_(img.name);
      var file = folder.createFile(blob).setName(uniqueFileName);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var mime = String((img && img.type) || '').toLowerCase();
      var nameLower = String((img && img.name) || '').toLowerCase();
      var isPdf = mime === 'application/pdf' || /\.pdf$/i.test(nameLower);
      var isZip = mime.indexOf('zip') >= 0 || /\.zip$/i.test(nameLower);
      var exportMode = isPdf || isZip ? 'download' : 'view';
      var kindFrag = isZip ? '#file.zip' : isPdf ? '#file.pdf' : '';
      var directUrl = 'https://drive.google.com/uc?export=' + exportMode + '&id=' + file.getId() + kindFrag;
      urls.push(directUrl);
    } catch (e) {
      urls.push('');
      errors.push(label + ': ' + e.toString());
    }
  });

  return { urls: urls, errors: errors };
}

// ==============================================================
// 2. ユーザー・店舗データの取得と登録（★役職列を追加）
// ==============================================================
/** 従業員シートの管轄店舗列: H列(7) から最大50店舗（H〜BE列） */
var EMPLOYEE_STORE_COL_START = 7;
var EMPLOYEE_STORE_COL_MAX = 50;
/** 店舗エリア外の本部（店舗依頼の配信対象外） */
var HQ_AREA = 'EAST本部';
var HQ_STORE = 'EAST本部';

function isHqStoreName_(name) {
  return String(name || '').trim() === HQ_STORE;
}
function isHqAreaName_(name) {
  return String(name || '').trim() === HQ_AREA;
}
function getFieldStores_(allStores) {
  return (allStores || []).filter(function (s) {
    return !isHqStoreName_(s.storeName) && !isHqAreaName_(s.area);
  });
}
function getFieldStoreNames_(allStores) {
  return getFieldStores_(allStores).map(function (s) {
    return s.storeName;
  });
}

function parseEmployeeStoresFromRow_(row) {
  var end = Math.min(row.length, EMPLOYEE_STORE_COL_START + EMPLOYEE_STORE_COL_MAX);
  var stores = [];
  for (var i = EMPLOYEE_STORE_COL_START; i < end; i++) {
    var s = String(row[i] || '').trim();
    if (s) stores.push(s);
  }
  return stores;
}

function getEmployees() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('従業員データ') || ss.getSheets()[0];
    const values = sheet.getDataRange().getValues();
    values.shift(); 
    return values.map(row => ({
      name: String(row[0] || "").trim(),
      email: String(row[1] || "").trim(),
      team: String(row[2] || "").trim(),
      brand: String(row[3] || "").trim(),
      area: String(row[4] || "").trim(), 
      territory: String(row[5] || "").trim(), 
      role: String(row[6] || "").trim(), // ★G列(6)を「役職」として取得
      stores: parseEmployeeStoresFromRow_(row)
    })).filter(emp => emp.email);
  } catch (e) { return []; }
}

function getStoreData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('店舗データ');
    if (!sheet) return [];
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];
    values.shift(); 
    return values.map(row => ({
      area: String(row[0] || "").trim(),
      territory: String(row[1] || "").trim(),
      storeName: String(row[2] || "").trim()
    })).filter(data => data.storeName);
  } catch (e) { return []; }
}

function buildEmployeeSheetRow_(empData) {
  let row = [
    empData.name,
    empData.email,
    empData.team,
    'なし',
    empData.area,
    empData.territory,
    empData.role
  ];
  var stores = (empData.stores || []).map(function (s) { return String(s).trim(); }).filter(Boolean);
  if (stores.length > EMPLOYEE_STORE_COL_MAX) {
    return { error: '管轄店舗は最大' + EMPLOYEE_STORE_COL_MAX + '件まで登録できます。' };
  }
  if (stores.length > 0) row = row.concat(stores);
  return { row: row };
}

function registerEmployee(empData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('従業員データ') || ss.insertSheet('従業員データ');
    var built = buildEmployeeSheetRow_(empData);
    if (built.error) return { status: 'error', message: built.error };
    sheet.appendRow(built.row);
    return { status: 'success' };
  } catch(e) { return { status: 'error', message: e.toString() }; }
}

/** 登録済みメールのプロフィール（チーム・エリア・管轄店舗・役職など）を更新 */
function updateEmployee(empData) {
  try {
    var emailNorm = normalizeTaskEmail(empData.email);
    if (!emailNorm) return { status: 'error', message: 'メールアドレスが無効です' };
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('従業員データ');
    if (!sheet) return { status: 'error', message: '従業員データがありません' };
    var built = buildEmployeeSheetRow_(empData);
    if (built.error) return { status: 'error', message: built.error };
    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (normalizeTaskEmail(values[i][1]) !== emailNorm) continue;
      var rowNum = i + 1;
      var oldRow = values[i];
      var oldStoreCols = 0;
      for (var c = 7; c < oldRow.length; c++) {
        if (String(oldRow[c] || '').trim()) oldStoreCols++;
      }
      sheet.getRange(rowNum, 1, 1, built.row.length).setValues([built.row]);
      var newStoreCols = Math.max(0, built.row.length - 7);
      if (oldStoreCols > newStoreCols) {
        sheet.getRange(rowNum, 8 + newStoreCols, 1, oldStoreCols - newStoreCols).clearContent();
      }
      return { status: 'success' };
    }
    return { status: 'error', message: '登録情報が見つかりません' };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

// ==============================================================
// 3. タスク取得と完了処理
// ==============================================================

/** メール比較用（大小文字・前後空白を統一） */
function normalizeTaskEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** N列「ターゲット一覧」の文字列をメール配列に（カンマ・読点対応） */
function parseTargetEmails(targetsStr) {
  return String(targetsStr || '')
    .split(/[,，]/)
    .map(function (e) { return normalizeTaskEmail(e); })
    .filter(Boolean);
}

/** 店舗データからエリア名一覧（ターゲットタグ解析用・本部エリアは除外） */
function getAreasListFromStores_(allStores) {
  var seen = {};
  var out = [];
  getFieldStores_(allStores).forEach(function (s) {
    var a = String(s.area || '').trim();
    if (a && !seen[a]) {
      seen[a] = true;
      out.push(a);
    }
  });
  return out;
}

/**
 * targetTags 文字列から「対象店舗名」の配列を復元（フロントの parseTargetTagsToSelection と同趣旨）
 */
function parseTargetStoresFromTags_(tagStr, allStores, areasList) {
  var fieldStores = getFieldStores_(allStores);
  var allStoreNames = getFieldStoreNames_(allStores);
  if (!tagStr || String(tagStr).trim() === '' || tagStr === '指定なし') {
    return allStoreNames.slice();
  }
  var s = String(tagStr).trim();
  var storePart = s;
  var roleBracket = s.match(/\s*\[([^\]]+)\]\s*$/);
  if (roleBracket) {
    storePart = s.slice(0, s.lastIndexOf('[')).trim();
  }
  if (!storePart || storePart === '全店') {
    return allStoreNames.slice();
  }
  var parts = storePart.split(/,\s*/).map(function (x) {
    return x.trim();
  }).filter(Boolean);
  var selected = [];
  parts.forEach(function (p) {
    if (isHqAreaName_(p) || isHqStoreName_(p)) return;
    if (areasList.indexOf(p) >= 0) {
      fieldStores.filter(function (st) {
        return st.area === p;
      }).forEach(function (st) {
        if (selected.indexOf(st.storeName) < 0) selected.push(st.storeName);
      });
    } else if (allStoreNames.indexOf(p) >= 0) {
      selected.push(p);
    }
  });
  return selected.length ? selected : allStoreNames.slice();
}

/** O列: 旧形式は配列。店舗依頼は {"v":2,"mode":"store","stores":{...}} */
function parseCompletionPayload_(str) {
  var s = String(str || '').trim();
  if (!s) return { people: [], stores: {} };
  try {
    var j = JSON.parse(s);
    if (Array.isArray(j)) {
      return { people: j, stores: {} };
    }
    if (j && j.v === 2 && j.mode === 'store' && j.stores) {
      return { people: [], stores: j.stores };
    }
  } catch (e) {}
  return { people: [], stores: {} };
}

/** 依頼単位列: employee | store | tf（tf は社員依頼と同様に個人完了） */
function normalizeRequestKind_(k) {
  var s = String(k || '').trim().toLowerCase();
  if (s === 'store') return 'store';
  if (s === 'tf') return 'tf';
  return 'employee';
}

function getRequestKindFromRow_(row) {
  return normalizeRequestKind_(row[15]);
}

function getRequestKindLabel_(kind) {
  if (kind === 'store') return '店舗依頼';
  if (kind === 'tf') return 'TFチーム依頼';
  return '社員依頼';
}

function isPersonRequestKind_(kind) {
  return kind === 'employee' || kind === 'tf';
}

function serializeEmployeeCompletion_(peopleArr) {
  return JSON.stringify(peopleArr || []);
}

function serializeStoreCompletion_(storesObj) {
  return JSON.stringify({ v: 2, mode: 'store', stores: storesObj || {} });
}

/**
 * 完了順位（rank）は「同一タスク行（同じID・同じ行）」の O列 JSON 配列の並び。
 * 店舗ごとに別の申請行になっている場合、各行でそれぞれ 1 番目から数える（＝両方 1 になり得る）。
 * 全社で 1→2 と出したい場合は、同一行の N列に複数メールをカンマ区切りで載せる。
 */
function getTasksForUser(userEmail) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('申請データ') || ss.insertSheet('申請データ');
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];
    values.shift();

    const allStores = getStoreData();
    const areasList = getAreasListFromStores_(allStores);
    const employees = getEmployees();
    var empByNorm = {};
    employees.forEach(function (e) {
      empByNorm[normalizeTaskEmail(e.email)] = e;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const userNorm = normalizeTaskEmail(userEmail);
    const myEmp = empByNorm[userNorm];
    const myStores = myEmp && myEmp.stores ? myEmp.stores : [];

    const tasks = [];
    const userEmailRaw = String(userEmail || '').trim().toLowerCase();
    values.forEach(function (row) {
      const targetsStr = String(row[13] || '');
      if (!targetsStr) return;
      const targetsQuick = targetsStr.toLowerCase();
      if (targetsQuick.indexOf(userNorm) < 0 && (!userEmailRaw || targetsQuick.indexOf(userEmailRaw) < 0)) {
        return;
      }
      const targetList = parseTargetEmails(targetsStr);
      var isTarget = targetList.indexOf(userNorm) >= 0;
      if (!isTarget && targetsStr) {
        isTarget = targetsStr.indexOf(String(userEmail || '').trim()) >= 0;
      }
      if (isTarget) {
        const completedDataStr = String(row[14] || '[]');
        const payload = parseCompletionPayload_(completedDataStr);
        const requestKind = getRequestKindFromRow_(row);

        var isCompleted = false;
        var taskStores = parseTargetStoresFromTags_(String(row[12] || ''), allStores, areasList);
        if (requestKind === 'store') {
          var relevant = myStores.filter(function (s) {
            return taskStores.indexOf(s) >= 0;
          });
          if (relevant.length === 0) {
            isCompleted = false;
          } else {
            isCompleted = relevant.every(function (s) {
              return payload.stores && payload.stores[s];
            });
          }
        } else {
          isCompleted = (payload.people || []).some(function (d) {
            return normalizeTaskEmail(d.email) === userNorm;
          });
        }

        let daysRemaining = null;
        let sortValue = 9999999999999;
        const deadlineVal = row[3];

        if (deadlineVal) {
          const deadlineDate = new Date(deadlineVal);
          deadlineDate.setHours(0, 0, 0, 0);
          const diffTime = deadlineDate.getTime() - today.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          sortValue = deadlineDate.getTime();
        }

        var taskRow = {
          id: String(row[0] || ''),
          type: String(row[2] || 'タスク'),
          deadline: deadlineVal ? Utilities.formatDate(new Date(deadlineVal), 'JST', 'yyyy-MM-dd') : '',
          daysRemaining: daysRemaining,
          sortValue: sortValue,
          sender: String(row[4] || '不明'),
          content: String(row[5] || ''),
          urls: [String(row[6] || ''), String(row[7] || ''), String(row[8] || '')].filter(Boolean),
          images: [String(row[9] || ''), String(row[10] || ''), String(row[11] || '')].filter(Boolean),
          targetTags: String(row[12] || ''),
          requestKind: requestKind,
          completed: isCompleted
        };
        if (requestKind === 'store') {
          taskRow.targetStoreNames = taskStores;
          taskRow.storeCompletions = payload.stores || {};
        } else {
          taskRow.employeeCompletions = (payload.people || []).map(function (p) {
            return { email: String(p.email || ''), time: String(p.time || '') };
          });
        }
        tasks.push(taskRow);
      }
    });

    tasks.sort(function (a, b) {
      return a.sortValue - b.sortValue;
    });
    return tasks;
  } catch (e) {
    return [];
  }
}

/** 初回表示用：リスト・再投稿・定期を1回の呼び出しで取得（往復を減らす） */
function getAppDataForUser(userEmail, senderName) {
  var name = String(senderName || '').trim();
  return {
    tasks: getTasksForUser(userEmail),
    sentTasks: getSentTasks(name),
    scheduledTasks: getScheduledTasks(name)
  };
}

/**
 * 店舗依頼: 1 回の呼び出しで完了するのは 1 店舗のみ（テンポ内の進捗を店舗単位で分ける）。
 * optStoreName: 管轄が複数店舗あるときは必須。1 店舗のみのときは省略可。
 */
function completeTask(taskId, userEmail, optStoreName) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const userNorm = normalizeTaskEmail(userEmail);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('申請データ');
    if (!sheet) return { success: false };
    const allStores = getStoreData();
    const areasList = getAreasListFromStores_(allStores);
    const employees = getEmployees();
    var myEmp = null;
    for (var ei = 0; ei < employees.length; ei++) {
      if (normalizeTaskEmail(employees[ei].email) === userNorm) {
        myEmp = employees[ei];
        break;
      }
    }
    const userStores = myEmp && myEmp.stores ? myEmp.stores : [];

    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(taskId)) {
        const rowNum = i + 1;
        const requestKind = getRequestKindFromRow_(values[i]);
        const completedDataStr = String(values[i][14] || '[]');
        const payload = parseCompletionPayload_(completedDataStr);

        if (requestKind === 'store') {
          var taskStores = parseTargetStoresFromTags_(String(values[i][12] || ''), allStores, areasList);
          var toMark = userStores.filter(function (s) {
            return taskStores.indexOf(s) >= 0;
          });
          if (toMark.length === 0) {
            return { success: false, message: '管轄店舗がこの依頼の対象外です' };
          }
          var stores = payload.stores || {};
          var timeStr = Utilities.formatDate(new Date(), 'JST', 'MM/dd HH:mm');
          var pick = null;
          if (toMark.length === 1) {
            pick = toMark[0];
          } else {
            var req = String(optStoreName || '').trim();
            if (!req || toMark.indexOf(req) < 0) {
              return {
                success: false,
                needStore: true,
                message: '完了する店舗を指定してください',
                stores: toMark
              };
            }
            pick = req;
          }
          if (stores[pick]) {
            return { success: true, rank: 1 };
          }
          stores[pick] = { at: timeStr, by: userNorm };
          sheet.getRange(rowNum, 15).setValue(serializeStoreCompletion_(stores));
          return { success: true, rank: 1 };
        }

        var completedData = payload.people || [];
        if (!Array.isArray(completedData)) completedData = [];
        const existingIndex = completedData.findIndex(function (d) {
          return normalizeTaskEmail(d.email) === userNorm;
        });
        if (existingIndex >= 0) {
          return { success: true, rank: existingIndex + 1 };
        }
        completedData.push({
          email: userNorm,
          time: Utilities.formatDate(new Date(), 'JST', 'MM/dd HH:mm')
        });
        sheet.getRange(rowNum, 15).setValue(serializeEmployeeCompletion_(completedData));
        return { success: true, rank: completedData.length };
      }
    }
    return { success: false };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 店舗依頼: 複数店舗を 1 回の呼び出しで完了（シート読み書き・ロックは 1 回のみ）。
 * storeNames: 完了にする店舗名の配列（管轄かつ依頼対象のみ反映、既完了はスキップ）。
 */
function completeTaskStoresBulk(taskId, userEmail, storeNames) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const userNorm = normalizeTaskEmail(userEmail);
    const namesIn = (storeNames || []).map(function (s) { return String(s).trim(); }).filter(Boolean);
    if (namesIn.length === 0) {
      return { success: false, message: '完了する店舗がありません' };
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('申請データ');
    if (!sheet) return { success: false, message: 'シートが見つかりません' };
    const allStores = getStoreData();
    const areasList = getAreasListFromStores_(allStores);
    const employees = getEmployees();
    var myEmp = null;
    for (var ei = 0; ei < employees.length; ei++) {
      if (normalizeTaskEmail(employees[ei].email) === userNorm) {
        myEmp = employees[ei];
        break;
      }
    }
    const userStores = myEmp && myEmp.stores ? myEmp.stores : [];
    const nameSet = {};
    namesIn.forEach(function (n) { nameSet[n] = true; });

    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) !== String(taskId)) continue;
      const rowNum = i + 1;
      const requestKind = getRequestKindFromRow_(values[i]);
      if (requestKind !== 'store') {
        return { success: false, message: '店舗依頼ではありません' };
      }
      var taskStores = parseTargetStoresFromTags_(String(values[i][12] || ''), allStores, areasList);
      var toMark = userStores.filter(function (s) {
        return taskStores.indexOf(s) >= 0 && nameSet[s];
      });
      if (toMark.length === 0) {
        return { success: false, message: '管轄店舗がこの依頼の対象外です' };
      }
      const payload = parseCompletionPayload_(String(values[i][14] || '[]'));
      var stores = payload.stores || {};
      var timeStr = Utilities.formatDate(new Date(), 'JST', 'MM/dd HH:mm');
      var completed = 0;
      var updated = {};
      toMark.forEach(function (pick) {
        if (stores[pick]) return;
        stores[pick] = { at: timeStr, by: userNorm };
        updated[pick] = stores[pick];
        completed++;
      });
      if (completed > 0) {
        sheet.getRange(rowNum, 15).setValue(serializeStoreCompletion_(stores));
      }
      return { success: true, completed: completed, skipped: toMark.length - completed, updated: updated };
    }
    return { success: false, message: 'タスクが見つかりません' };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 自分の完了記録だけを O列から削除（未実施に戻す）。他の人の記録はそのまま。
 * 店舗依頼: optStoreName でその店舗 1 件だけ取り消す（複数店舗を一括削除しない）。
 */
function uncompleteTask(taskId, userEmail, optStoreName) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const userNorm = normalizeTaskEmail(userEmail);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('申請データ');
    if (!sheet) return { success: false, message: 'シートが見つかりません' };
    const allStores = getStoreData();
    const areasList = getAreasListFromStores_(allStores);
    const employees = getEmployees();
    var myEmp = null;
    for (var ei = 0; ei < employees.length; ei++) {
      if (normalizeTaskEmail(employees[ei].email) === userNorm) {
        myEmp = employees[ei];
        break;
      }
    }
    const userStores = myEmp && myEmp.stores ? myEmp.stores : [];

    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(taskId)) {
        const rowNum = i + 1;
        const requestKind = getRequestKindFromRow_(values[i]);
        const payload = parseCompletionPayload_(String(values[i][14] || '[]'));

        if (requestKind === 'store') {
          var taskStores = parseTargetStoresFromTags_(String(values[i][12] || ''), allStores, areasList);
          var stores = payload.stores || {};
          var pick = String(optStoreName || '').trim();
          if (!pick) {
            return { success: false, message: '取り消す店舗を指定してください' };
          }
          if (taskStores.indexOf(pick) < 0 || userStores.indexOf(pick) < 0) {
            return { success: false, message: '対象店舗が無効です' };
          }
          if (!stores[pick] || normalizeTaskEmail(stores[pick].by) !== userNorm) {
            return { success: false, message: 'この店舗のあなたの完了記録がありません' };
          }
          delete stores[pick];
          sheet.getRange(rowNum, 15).setValue(serializeStoreCompletion_(stores));
          return { success: true };
        }

        var completedData = payload.people || [];
        if (!Array.isArray(completedData)) completedData = [];
        const idx = completedData.findIndex(function (d) {
          return normalizeTaskEmail(d.email) === userNorm;
        });
        if (idx < 0) {
          return { success: false, message: '完了記録が見つかりません' };
        }
        completedData.splice(idx, 1);
        sheet.getRange(rowNum, 15).setValue(serializeEmployeeCompletion_(completedData));
        return { success: true };
      }
    }
    return { success: false, message: 'タスクが見つかりません' };
  } finally {
    lock.releaseLock();
  }
}

// ==============================================================
// 4. 再投稿用・定期配信用の処理
// ==============================================================
function getSentTasks(userName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('申請データ');
    if (!sheet) return [];
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];
    values.shift();
    return values.map(row => ({
      id: String(row[0] || ""),
      createdAt: row[1] ? Utilities.formatDate(new Date(row[1]), "JST", "yyyy/MM/dd") : "",
      deadline: row[3] ? Utilities.formatDate(new Date(row[3]), "JST", "yyyy-MM-dd") : "",
      sender: String(row[4] || ""),
      content: String(row[5] || ""),
      urls: [String(row[6]||""), String(row[7]||""), String(row[8]||"")].filter(Boolean),
      images: [String(row[9]||""), String(row[10]||""), String(row[11]||"")].filter(Boolean),
      targetTags: String(row[12] || ""),
      /** 配信先メール（再投稿で役職・店舗を正確に復元するため） */
      targets: String(row[13] || "").split(",").map(function (e) { return e.trim(); }).filter(Boolean),
      requestKind: normalizeRequestKind_(row[15])
    })).filter(t => t.sender === userName).reverse();
  } catch(e) { return []; }
}

/**
 * 定期配信の「期限（毎月〜まで）」から、基準日 now を起点にした期限日 (yyyy-MM-dd) を返す。
 * ・月末 → 当月の最終日
 * ・N日 → 当月の N 日がまだ来ていなければ当月、過ぎていれば翌月の N 日
 */
function computeDeadlineForScheduledOffset_(now, deadlineOffsetStr) {
  var today = new Date(now);
  today.setHours(0, 0, 0, 0);
  var deadlineDate;
  if (deadlineOffsetStr === '月末') {
    deadlineDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else {
    var targetDay = parseInt(String(deadlineOffsetStr).replace('日', ''), 10);
    deadlineDate = new Date(today.getFullYear(), today.getMonth(), targetDay);
    deadlineDate.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      deadlineDate = new Date(today.getFullYear(), today.getMonth() + 1, targetDay);
    }
  }
  return Utilities.formatDate(deadlineDate, 'JST', 'yyyy-MM-dd');
}

function registerScheduledTask(taskData) {
  try {
    var driveResult = saveImagesToDrive(taskData.images, taskData.sender);
    var uploadedUrls = driveResult.urls;
    const manualUrls = taskData.urls || [];

    const u1 = manualUrls[0] || '';
    const u2 = manualUrls[1] || '';
    const u3 = manualUrls[2] || '';
    const i1 = uploadedUrls[0] || '';
    const i2 = uploadedUrls[1] || '';
    const i3 = uploadedUrls[2] || '';

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('定期配信データ');
    if (!sheet) {
      sheet = ss.insertSheet('定期配信データ');
      sheet.appendRow(['ID', '作成日', '作成者', 'サイクル', '期限設定', '依頼内容', 'リンク1', 'リンク2', 'リンク3', '画像1', '画像2', '画像3', '配信先タグ', '配信先アドレス', '依頼単位']);
    }
    const newId = 's_' + new Date().getTime();
    var reqKind = normalizeRequestKind_(taskData.requestKind);

    const row = [
      newId, new Date(), taskData.sender, taskData.cycle, taskData.deadlineOffset,
      taskData.content, u1, u2, u3, i1, i2, i3, taskData.targetTags || '', taskData.targets.join(','), reqKind
    ];
    sheet.appendRow(row);

    // 初回の今月分：申請データに1行追加（フロントで「今月の初回分は作成しない」= skipInitialTask true のときはスキップ）
    if (taskData.skipInitialTask !== true) {
      const deadlineFormatted = computeDeadlineForScheduledOffset_(new Date(), taskData.deadlineOffset);
      let reqSheet = ss.getSheetByName('申請データ');
      if (!reqSheet) {
        reqSheet = ss.insertSheet('申請データ');
        reqSheet.appendRow(['ID', '日時', 'タスク種別', '期限', '申請者', '依頼内容', 'リンク1', 'リンク2', 'リンク3', '画像1', '画像2', '画像3', '対象エリア', 'ターゲット一覧', '完了データ', '依頼単位']);
      }
      const newTaskId = 't_' + new Date().getTime();
      const targetsArr = taskData.targets || [];
      var initialO = reqKind === 'store' ? '{"v":2,"mode":"store","stores":{}}' : '[]';
      reqSheet.appendRow([
        newTaskId, new Date(), '定期タスク（初回）', deadlineFormatted, taskData.sender, taskData.content,
        u1, u2, u3, i1, i2, i3,
        taskData.targetTags || '', targetsArr.join(','), initialO, reqKind
      ]);

      const appUrl = getTaskEmailLink_();
      const emailBody = buildTaskEmailBody_(
        taskData.sender,
        taskData.targetTags,
        deadlineFormatted,
        taskData.content,
        appUrl,
        '定期（初回）'
      );

      var emailHtml = buildTaskEmailHtml_(
        taskData.sender,
        taskData.targetTags,
        deadlineFormatted,
        taskData.content,
        appUrl,
        '定期（初回）'
      );
      targetsArr.forEach(function (email) {
        if (!email) return;
        try {
          sendBrandedEmail_(String(email).trim(), 'To-Do List', emailBody, emailHtml);
        } catch (e) {}
      });
      sendChatNotification({
        sender: taskData.sender,
        targetTags: taskData.targetTags,
        deadline: deadlineFormatted,
        content: taskData.content
      }, appUrl, true);
    }

    return { status: 'success', driveErrors: driveResult.errors };
  } catch(e) { return { status: 'error', message: e.toString() }; }
}

function getScheduledTasks(userName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('定期配信データ');
    if (!sheet) return [];
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];
    values.shift();
    return values.map(row => ({
      id: String(row[0]),
      createdAt: row[1] ? Utilities.formatDate(new Date(row[1]), "JST", "yyyy/MM/dd") : "",
      sender: String(row[2]),
      cycle: String(row[3]),
      deadlineOffset: String(row[4]),
      content: String(row[5]),
      urls: [String(row[6]||""), String(row[7]||""), String(row[8]||"")].filter(Boolean),
      images: [String(row[9]||""), String(row[10]||""), String(row[11]||"")].filter(Boolean),
      targetTags: String(row[12]),
      targets: String(row[13] || "").split(",").map(function (e) { return e.trim(); }).filter(Boolean),
      requestKind: normalizeRequestKind_(row[14])
    })).filter(t => t.sender === userName).reverse();
  } catch(e) { return []; }
}

/**
 * 定期配信の内容を更新（次回の processScheduledTasksBatch から反映）。初回タスクは再作成しない。
 */
function updateScheduledTask(id, taskData) {
  try {
    var driveResult = saveImagesToDrive(taskData.images, taskData.sender);
    var uploadedUrls = driveResult.urls;
    const manualUrls = taskData.urls || [];
    const u1 = manualUrls[0] || '';
    const u2 = manualUrls[1] || '';
    const u3 = manualUrls[2] || '';
    const i1 = uploadedUrls[0] || '';
    const i2 = uploadedUrls[1] || '';
    const i3 = uploadedUrls[2] || '';

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('定期配信データ');
    if (!sheet) return { status: 'error', message: 'sheet not found' };
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === id) {
        const rowNum = i + 1;
        var rk = normalizeRequestKind_(taskData.requestKind);
        sheet.getRange(rowNum, 4, rowNum, 15).setValues([[
          taskData.cycle,
          taskData.deadlineOffset,
          taskData.content,
          u1, u2, u3,
          i1, i2, i3,
          taskData.targetTags || '',
          taskData.targets.join(','),
          rk
        ]]);
        return { status: 'success', driveErrors: driveResult.errors };
      }
    }
    return { status: 'not found' };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

function deleteScheduledTask(id) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('定期配信データ');
    if (!sheet) return { status: 'error' };
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === id) {
        sheet.deleteRow(i + 1);
        return { status: 'success' };
      }
    }
    return { status: 'not found' };
  } catch(e) { return { status: 'error' }; }
}

// ==============================================================
// 5. タスク配信と通知処理
// ==============================================================

/**
 * 本番 Web アプリ URL（メール・リマインド用の既定値）。
 * トリガー実行時の ScriptApp.getService().getUrl() は別デプロイIDを返すことがあり、
 * 「ファイルを開くことができません」になるため、本番URLを優先する。
 * 上書き: スクリプトプロパティ TASK_WEB_APP_URL
 */
var DEFAULT_TASK_WEB_APP_URL_ =
  'https://script.google.com/a/macros/okamoto-group.co.jp/s/AKfycbyUmHnVEEJbuntAayPBu5zEe_4iRVDjtq8LOHQ5pURXRgEQYpLX324-3SMxeX9_NllAuw/exec';

/** デプロイした Web アプリの URL */
function getTaskWebAppUrl_() {
  var fromProp = PropertiesService.getScriptProperties().getProperty('TASK_WEB_APP_URL');
  if (fromProp && String(fromProp).trim()) {
    return String(fromProp).trim().replace(/\/$/, '');
  }
  if (DEFAULT_TASK_WEB_APP_URL_) {
    return String(DEFAULT_TASK_WEB_APP_URL_).replace(/\/$/, '');
  }
  try {
    return ScriptApp.getService().getUrl() || '';
  } catch (e) {
    return '';
  }
}

/** メール・Chat 用：本番 URL に tab=checklist を付与 */
function getTaskEmailLink_() {
  var u = getTaskWebAppUrl_();
  if (!u) return u;
  return u.indexOf('?') >= 0 ? u + '&tab=checklist' : u + '?tab=checklist';
}

/**
 * メール本文（プレーン）— 日々見る前提で短く
 * @param {string} senderLine 依頼者（定期の自動配信は末尾に「（自動配信）」など付与済み可）
 * @param {string} subtitle 見出し末尾（例: 新規依頼 / 定期（初回） / 定期タスク）
 */
function buildTaskEmailBody_(senderLine, targetTags, deadline, content, appUrl, subtitle) {
  var sub = subtitle || '新規依頼';
  return (
    'Task Force Team　To-Do List　' + sub + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    '◇名前: ' + senderLine + '\n' +
    '◇エリア: ' + (targetTags || '指定なし') + '\n' +
    '◇DL : ' + deadline + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    '[ 依頼内容 ]\n' +
    content +
    '\n\n' +
    appUrl
  );
}

function escapeHtmlEmail_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 改行（\r, \n, \r\n すべて）を <br> に置換した HTML を返す */
function escapeHtmlEmailMultiline_(s) {
  return escapeHtmlEmail_(s).replace(/\r\n|\r|\n/g, '<br>');
}

/** 配信・リマインド共通の HTML ラッパ（To-Do アプリ風） */
function buildTodoEmailShellHtml_(opts) {
  opts = opts || {};
  var accent = '#6366f1';
  var inner = '';
  if (opts.greeting) {
    inner += '<p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#0f172a;">' + opts.greeting + '</p>';
  }
  if (opts.intro) {
    inner += '<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569;">' + opts.intro + '</p>';
  }
  if (opts.taskItem) {
    var t = opts.taskItem;
    var overdue = t.overdue
      ? '<span style="display:inline-block;font-size:11px;font-weight:700;color:#be123c;background:#fff1f2;border:1px solid #fecaca;border-radius:6px;padding:2px 6px;margin-right:6px;">期限超過</span>'
      : '';
    var bodyHtml = escapeHtmlEmailMultiline_(t.contentFull || t.contentPreview || '');
    inner +=
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 18px;margin-bottom:16px;">' +
      overdue +
      '<p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0f172a;line-height:1.7;white-space:pre-wrap;word-break:break-word;">' +
      bodyHtml +
      '</p>' +
      '<p style="margin:0;font-size:12px;color:#0f172a;">' +
      '<span style="color:#64748b;">期限:</span> ' +
      '<strong style="color:#0f172a;">' + escapeHtmlEmail_(t.deadline || '—') + '</strong>' +
      ' &nbsp;·&nbsp; <span style="color:#64748b;">依頼者:</span> ' +
      '<strong style="color:#0f172a;">' + escapeHtmlEmail_(t.sender || '') + '</strong>' +
      '</p></div>';
  }
  if (opts.listTitle && opts.listHtml) {
    inner +=
      '<p style="margin:0 0 6px;font-size:12px;font-weight:700;color:' +
      accent +
      ';">' +
      escapeHtmlEmail_(opts.listTitle) +
      '</p>' +
      opts.listHtml;
  }
  if (opts.extraHtml) inner += opts.extraHtml;
  if (opts.ctaUrl) {
    inner +=
      '<p style="margin:20px 0 0;text-align:center;">' +
      '<a href="' +
      escapeHtmlEmail_(opts.ctaUrl) +
      '" style="display:inline-block;background:' +
      accent +
      ';color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 24px;border-radius:12px;">' +
      escapeHtmlEmail_(opts.ctaLabel || 'To-Do を開く') +
      '</a></p>';
  }
  return (
    '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '</head>' +
    '<body style="margin:0;padding:0;background:#f2f2f7;font-family:\'Noto Sans JP\',Helvetica,Arial,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:24px 12px;">' +
    '<table width="100%" style="max-width:960px;background:#fff;border-radius:16px;border:1px solid rgba(0,0,0,.06);box-shadow:0 1px 3px rgba(0,0,0,.08);" cellpadding="0" cellspacing="0" role="presentation">' +
    '<tr><td style="padding:20px 28px;border-bottom:1px solid #f1f5f9;">' +
    '<div style="font-size:8px;font-weight:600;letter-spacing:.18em;color:#64748b;">TASK FORCE TEAM</div>' +
    '<div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:2px;">To-Do List</div></td></tr>' +
    '<tr><td style="padding:24px 28px;">' +
    inner +
    '</td></tr></table></td></tr></table></body></html>'
  );
}

function sendBrandedEmail_(to, subject, plainBody, htmlBody, options) {
  var mail = { to: to, subject: subject, body: plainBody };
  if (htmlBody) mail.htmlBody = htmlBody;
  if (options && options.replyTo) mail.replyTo = options.replyTo;
  if (options && options.name) mail.name = options.name;
  MailApp.sendEmail(mail);
}

function sendChatNotification(taskData, appUrl, isScheduled = false) {
  if (!CHAT_WEBHOOK_URL) return;
  const title = isScheduled ? '定期タスク' : '新規依頼';

  const messageText =
    '*Task Force Team　To-Do List　' + title + '*\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    '◇名前: ' + taskData.sender + '\n' +
    '◇エリア: ' + (taskData.targetTags || '指定なし') + '\n' +
    '◇DL : ' + taskData.deadline + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    '[ 依頼内容 ]\n' + taskData.content + '\n\n' + appUrl;

  const options = {
    "method": "post",
    "headers": { "Content-Type": "application/json; charset=UTF-8" },
    "payload": JSON.stringify({ "text": messageText })
  };
  try { UrlFetchApp.fetch(CHAT_WEBHOOK_URL, options); } catch (e) {}
}

function createNewTask(taskData) {
  var driveResult = saveImagesToDrive(taskData.images, taskData.sender);
  var uploadedUrls = driveResult.urls;
  const manualUrls = taskData.urls || [];
  
  const u1 = manualUrls[0] || '';
  const u2 = manualUrls[1] || '';
  const u3 = manualUrls[2] || '';
  const i1 = uploadedUrls[0] || '';
  const i2 = uploadedUrls[1] || '';
  const i3 = uploadedUrls[2] || '';

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('申請データ');
  if (!sheet) {
    sheet = ss.insertSheet('申請データ');
    sheet.appendRow(['ID', '日時', 'タスク種別', '期限', '申請者', '依頼内容', 'リンク1', 'リンク2', 'リンク3', '画像1', '画像2', '画像3', '対象エリア', 'ターゲット一覧', '完了データ', '依頼単位']);
  }

  var reqKind = normalizeRequestKind_(taskData.requestKind);
  var initialO = reqKind === 'store' ? '{"v":2,"mode":"store","stores":{}}' : '[]';

  const newId = 't_' + new Date().getTime();
  const row = [
    newId, new Date(), taskData.type, taskData.deadline, taskData.sender, taskData.content,
    u1, u2, u3, i1, i2, i3,
    taskData.targetTags || '', taskData.targets.join(','), initialO, reqKind
  ];
  sheet.appendRow(row);

  const appUrl = getTaskEmailLink_();
  const emailBody = buildTaskEmailBody_(
    taskData.sender,
    taskData.targetTags,
    taskData.deadline,
    taskData.content,
    appUrl,
    '新規依頼'
  );

  var emailHtml = buildTaskEmailHtml_(
    taskData.sender,
    taskData.targetTags,
    taskData.deadline,
    taskData.content,
    appUrl,
    '新規依頼'
  );
  taskData.targets.forEach(function (email) {
    try {
      sendBrandedEmail_(email, 'To-Do List', emailBody, emailHtml);
    } catch (e) {}
  });

  sendChatNotification(taskData, appUrl, false);
  return { id: newId, status: 'success', driveErrors: driveResult.errors };
}

// ==============================================================
// 6. 定期配信の自動実行バッチ処理
// ==============================================================
function processScheduledTasksBatch() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('定期配信データ');
  if (!sheet) return;
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return;
  values.shift();
  
  const today = new Date();
  const currentDate = today.getDate(); 
  const currentHour = today.getHours(); 
  const appUrl = getTaskEmailLink_();

  values.forEach(row => {
    const cycle = String(row[3]); 
    let shouldRun = false;
    
    const match = cycle.match(/毎月\s+(\d+)日\s+(\d{1,2}):\d{2}/);
    if (match) {
      const targetDate = parseInt(match[1], 10);
      const targetHour = parseInt(match[2], 10);
      
      if (currentDate === targetDate && currentHour === targetHour) {
        shouldRun = true;
      }
    }
    
    if (shouldRun) {
      const sender = String(row[2]);
      const deadlineOffsetStr = String(row[4]); 
      
      const deadlineFormatted = computeDeadlineForScheduledOffset_(today, deadlineOffsetStr);
      
      const content = String(row[5]);
      const u1 = String(row[6]); const u2 = String(row[7]); const u3 = String(row[8]);
      const i1 = String(row[9]); const i2 = String(row[10]); const i3 = String(row[11]);
      const targetTags = String(row[12]);
      const targets = String(row[13]).split(',');
      var requestKind = normalizeRequestKind_(row[14]);
      var initialO = requestKind === 'store' ? '{"v":2,"mode":"store","stores":{}}' : '[]';

      const reqSheet = ss.getSheetByName('申請データ') || ss.insertSheet('申請データ');
      const newId = 't_' + new Date().getTime() + Math.floor(Math.random()*1000);

      reqSheet.appendRow([
        newId, new Date(), '定期タスク', deadlineFormatted, sender, content,
        u1, u2, u3, i1, i2, i3,
        targetTags, targets.join(','), initialO, requestKind
      ]);
      
      const taskData = { sender, targetTags, deadline: deadlineFormatted, content, targets };
      const emailBody = buildTaskEmailBody_(
        sender + '（自動配信）',
        targetTags,
        deadlineFormatted,
        content,
        appUrl,
        '定期タスク'
      );

      var emailHtml = buildTaskEmailHtml_(
        sender + '（自動配信）',
        targetTags,
        deadlineFormatted,
        content,
        appUrl,
        '定期タスク'
      );
      targets.forEach(function (email) {
        if (!email) return;
        try {
          sendBrandedEmail_(email.trim(), 'To-Do List', emailBody, emailHtml);
        } catch (e) {}
      });
      sendChatNotification(taskData, appUrl, true);
    }
  });
}

// ==============================================================
// 6b. 期限リマインド自動送信（2日前・前日・当日 8:00 / 未実施者のみ）
// 完了レポートは日下のみ（DEADLINE_REMINDER_REPORT_EMAIL 未設定時は下記既定）。
// ADMIN_DASHBOARD_EMAILS には送らない。
// 初回: setupDeadlineReminderTrigger() を GAS エディタで1回実行してトリガー登録。
// ==============================================================

var DEADLINE_REMINDER_LOG_SHEET_NAME_ = 'リマインド送信履歴';

/** 完了レポートの既定宛先（あなたのみ） */
var DEFAULT_DEADLINE_REMINDER_REPORT_EMAIL_ = 'r-kusaka@okamoto-group.co.jp';

function calcDaysUntilDeadline_(deadlineVal, today) {
  if (!deadlineVal) return null;
  var d = new Date(deadlineVal);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  var t = new Date(today.getTime());
  t.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
}

function getDeadlineReminderType_(daysRemaining) {
  if (daysRemaining === 2) return '2d';
  if (daysRemaining === 1) return '1d';
  if (daysRemaining === 0) return '0d';
  return null;
}

function getDeadlineReminderTypeLabel_(reminderType) {
  if (reminderType === '2d') return '2日前';
  if (reminderType === '1d') return '前日';
  if (reminderType === '0d') return '当日';
  return reminderType || '';
}

function buildAutomatedDeadlineReminderLead_(reminderType) {
  if (reminderType === '2d') {
    return '期限まであと2日のTo-Do が未完了です。ご確認・ご対応をお願いいたします。';
  }
  if (reminderType === '1d') {
    return '明日が期限のTo-Do が未完了です。ご確認・ご対応をお願いいたします。';
  }
  return '本日が期限のTo-Do が未完了です。ご確認・ご対応をお願いいたします。';
}

function buildAutomatedDeadlineReminderBodies_(recipientName, reminderType, taskItem, checklistUrl, storeNames) {
  var lead = buildAutomatedDeadlineReminderLead_(reminderType);
  var preview = String(taskItem.contentPreview || '').replace(/\n/g, ' ');
  var kindLabel = String(taskItem.requestKindLabel || '');
  var deadline = String(taskItem.deadline || '—');
  var sender = String(taskItem.sender || '—');
  var stores = storeNames || [];

  var lines = [];
  lines.push('お元気様です。');
  lines.push(lead);
  if (checklistUrl) {
    lines.push('▼ リストチェック');
    lines.push(String(checklistUrl));
  }
  lines.push('▼ 対象の依頼');
  lines.push('[' + kindLabel + '] ' + preview);
  lines.push('期限: ' + deadline + ' / 依頼者: ' + sender);
  if (stores.length) {
    lines.push('未実施の店舗（' + stores.length + '）:');
    stores.forEach(function (s, i) {
      lines.push('  ' + (i + 1) + '. ' + s);
    });
  }

  var introHtml =
    'お元気様です。<br>' +
    escapeHtmlEmail_(lead);
  if (checklistUrl) {
    introHtml +=
      '<br><br><span style="font-size:12px;font-weight:700;color:#6366f1;">▼ リストチェック</span><br>' +
      '<a href="' +
      escapeHtmlEmail_(checklistUrl) +
      '" style="color:#6366f1;font-weight:600;word-break:break-all;">' +
      escapeHtmlEmail_(checklistUrl) +
      '</a>';
  }
  introHtml +=
    '<br><br><span style="font-size:12px;font-weight:700;color:#6366f1;">▼ 対象の依頼</span>';

  var listHtml = '';
  if (stores.length) {
    listHtml = '<ul style="margin:8px 0 0;padding-left:20px;">';
    stores.forEach(function (s) {
      listHtml +=
        '<li style="margin:4px 0;font-size:14px;font-weight:600;color:#0f172a;">' + escapeHtmlEmail_(s) + '</li>';
    });
    listHtml += '</ul>';
  }

  var html = buildTodoEmailShellHtml_({
    greeting: '',
    intro: introHtml,
    taskItem: {
      requestKindLabel: kindLabel,
      contentPreview: preview,
      contentFull: '[' + kindLabel + '] ' + String(taskItem.contentFull || preview),
      deadline: deadline,
      sender: sender,
      overdue: !!taskItem.overdue
    },
    listTitle: stores.length ? '未実施の店舗（' + stores.length + '）' : '',
    listHtml: listHtml
  });

  return { plain: lines.join('\n'), html: html };
}

function buildAutomatedDeadlineReminderSubject_(reminderType) {
  if (reminderType === '2d') return '【To-Do List】期限まであと2日です';
  if (reminderType === '1d') return '【To-Do List】明日が期限です';
  return '【To-Do List】本日が期限です';
}

function getDeadlineReminderReportEmails_() {
  var raw = PropertiesService.getScriptProperties().getProperty('DEADLINE_REMINDER_REPORT_EMAIL');
  if (raw && String(raw).trim()) {
    return String(raw)
      .split(/[,，]/)
      .map(function (e) {
        return String(e).trim();
      })
      .filter(Boolean);
  }
  // ADMIN_DASHBOARD_EMAILS には送らない（DXメンバー全員に届いてしまうため）
  if (DEFAULT_DEADLINE_REMINDER_REPORT_EMAIL_) {
    return [DEFAULT_DEADLINE_REMINDER_REPORT_EMAIL_];
  }
  try {
    return [SpreadsheetApp.getActiveSpreadsheet().getOwner().getEmail()];
  } catch (err) {
    return [];
  }
}

function getDeadlineReminderLogSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DEADLINE_REMINDER_LOG_SHEET_NAME_);
  if (sheet) return sheet;
  sheet = ss.insertSheet(DEADLINE_REMINDER_LOG_SHEET_NAME_);
  sheet.appendRow(['taskId', 'recipientEmail', 'reminderType', 'sentAt']);
  sheet.setFrozenRows(1);
  return sheet;
}

function hasDeadlineReminderBeenSent_(taskId, recipientEmail, reminderType) {
  var sheet = getDeadlineReminderLogSheet_();
  var normEmail = normalizeTaskEmail(recipientEmail);
  if (!normEmail) return false;
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (
      String(values[i][0] || '').trim() === String(taskId) &&
      normalizeTaskEmail(values[i][1]) === normEmail &&
      String(values[i][2] || '').trim() === String(reminderType)
    ) {
      return true;
    }
  }
  return false;
}

function logDeadlineReminderSend_(taskId, recipientEmail, reminderType) {
  var sheet = getDeadlineReminderLogSheet_();
  sheet.appendRow([
    String(taskId),
    String(recipientEmail).trim(),
    String(reminderType),
    new Date()
  ]);
}

function collectIncompleteReminderTargets_(recipients, mode) {
  var emailsToSend = [];
  var emailMap = {};
  if (mode === 'store') {
    recipients.forEach(function (r) {
      if (r.done) return;
      var sn = String(r.storeName || r.label || r.key || '').trim();
      if (!sn) return;
      (r.assignees || []).forEach(function (a) {
        var em = normalizeTaskEmail(a.email);
        if (!em) return;
        if (!emailMap[em]) {
          emailMap[em] = {
            email: String(a.email).trim(),
            name: a.name || a.email,
            stores: []
          };
        }
        if (emailMap[em].stores.indexOf(sn) < 0) {
          emailMap[em].stores.push(sn);
        }
      });
    });
    Object.keys(emailMap).forEach(function (em) {
      emailsToSend.push(emailMap[em]);
    });
  } else {
    var seen = {};
    recipients.forEach(function (r) {
      if (r.done) return;
      var em = normalizeTaskEmail(r.email);
      if (!em || seen[em]) return;
      seen[em] = true;
      emailsToSend.push({ email: String(r.email).trim(), name: r.name || r.email });
    });
  }
  return emailsToSend;
}

function sendAutomatedDeadlineReminderToTarget_(
  target,
  mode,
  taskItem,
  reminderType,
  checklistUrl,
  fromLabel
) {
  var subject = buildAutomatedDeadlineReminderSubject_(reminderType);
  var storeList = mode === 'store' && target.stores ? target.stores : [];
  var bodies = buildAutomatedDeadlineReminderBodies_(
    target.name,
    reminderType,
    taskItem,
    checklistUrl,
    storeList
  );
  var plain = bodies.plain;
  var html = bodies.html;
  // 返信先は付けない（From は実行アカウント＝日下のまま）
  sendBrandedEmail_(target.email, subject, plain, html, {
    name: fromLabel
  });
}

function sendDeadlineReminderReportEmail_(report) {
  var recipients = getDeadlineReminderReportEmails_();
  if (!recipients.length) return;

  var runAtStr = Utilities.formatDate(report.runAt || new Date(), 'JST', 'yyyy/MM/dd HH:mm:ss');
  var lines = [];
  lines.push('期限リマインドの自動送信バッチが完了しました。');
  lines.push('');
  lines.push('実行日時: ' + runAtStr);
  lines.push('送信成功: ' + (report.sentCount || 0) + ' 件');
  if (report.skippedAlreadySent) lines.push('送信済みスキップ: ' + report.skippedAlreadySent + ' 件');
  if (report.errors && report.errors.length) {
    lines.push('送信失敗: ' + report.errors.length + ' 件');
  }
  lines.push('');

  if (report.tasksInWindow > 0) {
    lines.push('対象タスク（2日前・前日・当日）: ' + report.tasksInWindow + ' 件');
    if (report.taskSummaries && report.taskSummaries.length) {
      report.taskSummaries.forEach(function (t) {
        lines.push(
          '  - [' +
            getDeadlineReminderTypeLabel_(t.reminderType) +
            '] ' +
            t.taskId +
            ' / ' +
            t.requestKindLabel +
            ' / 期限 ' +
            (t.deadline || '—')
        );
      });
    }
    lines.push('');
  } else {
    lines.push('本日の期限リマインド対象タスクはありませんでした。');
    lines.push('');
  }

  if (report.sentEmails && report.sentEmails.length) {
    lines.push('送信先メールアドレス（' + report.sentEmails.length + '）:');
    report.sentEmails.forEach(function (em) {
      lines.push(em);
    });
    lines.push('');
  }

  if (report.errors && report.errors.length) {
    lines.push('エラー詳細:');
    report.errors.forEach(function (err) {
      lines.push(err);
    });
  }

  var plain = lines.join('\n');
  var subject = 'リマインドメール送信完了のお知らせ';
  recipients.forEach(function (to) {
    try {
      sendBrandedEmail_(to, subject, plain, null, { name: 'To-Do List（自動リマインド）' });
    } catch (mailErr) {
      Logger.log('完了レポート送信失敗: ' + to + ' / ' + mailErr);
    }
  });
}

/**
 * 毎朝8時に実行。期限2日前・前日・当日のみ、未実施者へ最大3回（超過後は送らない）。
 */
function processDeadlineRemindersBatch() {
  var report = {
    runAt: new Date(),
    sentCount: 0,
    skippedAlreadySent: 0,
    tasksInWindow: 0,
    taskSummaries: [],
    sentEmails: [],
    errors: []
  };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('申請データ');
  if (!sheet) {
    report.errors.push('申請データシートがありません');
    sendDeadlineReminderReportEmail_(report);
    return;
  }

  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    sendDeadlineReminderReportEmail_(report);
    return;
  }
  values.shift();

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var allStores = getStoreData();
  var areasList = getAreasListFromStores_(allStores);
  var employees = getEmployees();
  var checklistUrl = getTaskEmailLink_() || getTaskWebAppUrl_();
  var fromLabel = 'To-Do List（自動リマインド）';

  values.forEach(function (row) {
    var taskId = String(row[0] || '').trim();
    if (!taskId) return;

    var progress = computeTaskProgressAdmin_(row, allStores, areasList);
    if (progress.complete) return;

    var daysRemaining = calcDaysUntilDeadline_(row[3], today);
    if (daysRemaining === null) return;
    var reminderType = getDeadlineReminderType_(daysRemaining);
    if (!reminderType) return;

    report.tasksInWindow++;
    var requestKind = getRequestKindFromRow_(row);
    var mode = requestKind === 'store' ? 'store' : 'employee';
    var recipients = buildAdminTaskRecipients_(row, requestKind, employees, allStores, areasList);
    var emailsToSend = collectIncompleteReminderTargets_(recipients, mode);
    if (!emailsToSend.length) return;

    var taskItem = buildIncompleteTaskItemForEmail_(row, allStores, areasList);
    report.taskSummaries.push({
      taskId: taskId,
      reminderType: reminderType,
      requestKindLabel: getRequestKindLabel_(requestKind),
      deadline: taskItem.deadline || ''
    });

    emailsToSend.forEach(function (target) {
      var em = String(target.email || '').trim();
      if (!em) return;
      if (hasDeadlineReminderBeenSent_(taskId, em, reminderType)) {
        report.skippedAlreadySent++;
        return;
      }
      try {
        sendAutomatedDeadlineReminderToTarget_(
          target,
          mode,
          taskItem,
          reminderType,
          checklistUrl,
          fromLabel
        );
        logDeadlineReminderSend_(taskId, em, reminderType);
        report.sentCount++;
        report.sentEmails.push(em);
      } catch (mailErr) {
        report.errors.push(taskId + ' / ' + em + ': ' + String(mailErr));
      }
    });
  });

  if (report.sentCount > 0 || report.errors.length > 0 || report.tasksInWindow > 0) {
    sendDeadlineReminderReportEmail_(report);
  }
}

/** GAS エディタで1回実行して、毎日8:00（JST）の時間主導トリガーを登録 */
function setupDeadlineReminderTrigger() {
  removeDeadlineReminderTriggers_();
  ScriptApp.newTrigger('processDeadlineRemindersBatch')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .inTimezone('Asia/Tokyo')
    .create();
  return '期限リマインドトリガーを登録しました（毎日 8:00 JST）。';
}

function removeDeadlineReminderTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'processDeadlineRemindersBatch') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

// ==============================================================
// 管理ダッシュボード（DX 等・スプレッドシート共有者向け）
// スクリプトプロパティ ADMIN_DASHBOARD_EMAILS にカンマ区切りでメールを登録。
// 未設定時はスプレッドシートの所有者のみ許可。
// ==============================================================

function getAdminEmailWhitelist_() {
  var raw = PropertiesService.getScriptProperties().getProperty('ADMIN_DASHBOARD_EMAILS');
  if (!raw || !String(raw).trim()) {
    return [];
  }
  return String(raw)
    .split(/[,，]/)
    .map(function (e) {
      return normalizeTaskEmail(e);
    })
    .filter(Boolean);
}

function isAdminUser_(email) {
  var norm = normalizeTaskEmail(email);
  if (!norm) return false;
  var list = getAdminEmailWhitelist_();
  if (list.length === 0) {
    try {
      var owner = SpreadsheetApp.getActiveSpreadsheet().getOwner().getEmail();
      return normalizeTaskEmail(owner) === norm;
    } catch (err) {
      return false;
    }
  }
  return list.indexOf(norm) >= 0;
}

/**
 * ユーザーがターゲットの行のうち、当該ユーザー視点で未完了のタスク一覧（管理者用）
 */
function getIncompleteTasksForUserRows_(values, userNorm, userEmailRaw, userStores, allStores, areasList) {
  var out = [];
  values.forEach(function (row) {
    var id = String(row[0] || '').trim();
    if (!id) return;
    var targetsStr = String(row[13] || '');
    var targetList = parseTargetEmails(targetsStr);
    var isTarget =
      targetList.indexOf(userNorm) >= 0 || targetsStr.indexOf(String(userEmailRaw || '').trim()) >= 0;
    if (!isTarget) return;

    var payload = parseCompletionPayload_(String(row[14] || '[]'));
    var requestKind = getRequestKindFromRow_(row);
    var taskStores = parseTargetStoresFromTags_(String(row[12] || ''), allStores, areasList);

    var incomplete = false;
    if (requestKind === 'store') {
      var relevant = (userStores || []).filter(function (s) {
        return taskStores.indexOf(s) >= 0;
      });
      if (relevant.length === 0) return;
      incomplete = !relevant.every(function (s) {
        return payload.stores && payload.stores[s];
      });
    } else {
      var done = (payload.people || []).some(function (d) {
        return normalizeTaskEmail(d.email) === userNorm;
      });
      incomplete = !done;
    }
    if (!incomplete) return;

    var deadlineVal = row[3];
    var deadlineStr = '';
    if (deadlineVal) {
      try {
        deadlineStr = Utilities.formatDate(new Date(deadlineVal), 'JST', 'yyyy-MM-dd');
      } catch (e1) {
        deadlineStr = String(deadlineVal);
      }
    }
    var overdue = false;
    if (deadlineVal) {
      var d = new Date(deadlineVal);
      d.setHours(0, 0, 0, 0);
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d.getTime() < today.getTime()) overdue = true;
    }
    out.push({
      id: id,
      sender: String(row[4] || ''),
      contentPreview:
        String(row[5] || '').length > 80 ? String(row[5]).substring(0, 80) + '…' : String(row[5] || ''),
      deadline: deadlineStr,
      requestKind: requestKind,
      requestKindLabel: getRequestKindLabel_(requestKind),
      overdue: overdue
    });
  });
  return out;
}

function countAssignedTasksForUser_(values, userNorm, userEmailRaw) {
  var n = 0;
  values.forEach(function (row) {
    var targetsStr = String(row[13] || '');
    var targetList = parseTargetEmails(targetsStr);
    var isTarget =
      targetList.indexOf(userNorm) >= 0 || targetsStr.indexOf(String(userEmailRaw || '').trim()) >= 0;
    if (isTarget) n++;
  });
  return n;
}

function buildAdminReminderBody_(displayName, incompleteTasks, checklistUrl) {
  var lines = [];
  lines.push(displayName + ' 様');
  lines.push('');
  lines.push('未完了の To-Do が ' + incompleteTasks.length + ' 件あります。リストチェックからご対応をお願いします。');
  lines.push('');
  incompleteTasks.forEach(function (t, i) {
    var mark = t.overdue ? '【期限超過】' : '';
    lines.push(
      i + 1 + '. ' + mark + '[' + t.requestKindLabel + '] 期限:' + (t.deadline || '—') + ' / ' + t.sender
    );
    lines.push('   ' + String(t.contentPreview || '').replace(/\n/g, ' '));
    lines.push('');
  });
  lines.push('▼ リストチェックを開く');
  lines.push(checklistUrl || '');
  return lines.join('\n');
}

function buildAdminReminderHtml_(displayName, incompleteTasks, checklistUrl) {
  var listHtml = '<ul style="margin:8px 0 0;padding-left:20px;">';
  incompleteTasks.forEach(function (t) {
    var mark = t.overdue ? '【期限超過】' : '';
    listHtml +=
      '<li style="margin:6px 0;font-size:13px;color:#334155;line-height:1.5;"><strong style="color:#0f172a;">' +
      escapeHtmlEmail_(mark + '[' + t.requestKindLabel + '] ' + (t.contentPreview || '')) +
      '</strong><br><span style="font-size:12px;color:#64748b;">期限: ' +
      escapeHtmlEmail_(t.deadline || '—') +
      ' / ' +
      escapeHtmlEmail_(t.sender) +
      '</span></li>';
  });
  listHtml += '</ul>';
  return buildTodoEmailShellHtml_({
    greeting: escapeHtmlEmail_(displayName) + ' 様',
    intro:
      '未完了の To-Do が <strong>' +
      incompleteTasks.length +
      '</strong> 件あります。リストチェックからご対応をお願いします。',
    listTitle: '未完了の依頼',
    listHtml: listHtml,
    ctaUrl: checklistUrl,
    ctaLabel: 'リストチェックを開く',
  });
}

/** 店舗依頼リマインド：担当者1人あたり1通・未実施店舗名を列挙 */
function buildAdminStoreTaskReminderBodies_(displayName, taskItem, storeNames, checklistUrl) {
  var lines = [];
  lines.push(displayName + ' 様');
  lines.push('');
  lines.push('以下の店舗が、当該 To-Do の未実施です。リストチェックからご対応をお願いします。');
  lines.push('');
  lines.push('【依頼】' + String(taskItem.contentPreview || '').replace(/\n/g, ' '));
  lines.push('期限: ' + (taskItem.deadline || '—') + ' / 依頼者: ' + (taskItem.sender || ''));
  if (taskItem.overdue) lines.push('※期限超過');
  lines.push('');
  lines.push('未実施の店舗（' + storeNames.length + '）:');
  storeNames.forEach(function (s, i) {
    lines.push('  ' + (i + 1) + '. ' + s);
  });
  lines.push('');
  lines.push('▼ リストチェックを開く');
  lines.push(checklistUrl || '');

  var listHtml = '<ul style="margin:8px 0 0;padding-left:20px;">';
  storeNames.forEach(function (s) {
    listHtml += '<li style="margin:4px 0;font-size:14px;font-weight:600;color:#0f172a;">' + escapeHtmlEmail_(s) + '</li>';
  });
  listHtml += '</ul>';

  var html = buildTodoEmailShellHtml_({
    greeting: escapeHtmlEmail_(displayName) + ' 様',
    intro: '以下の店舗が、当該 To-Do の<strong>未実施</strong>です。リストチェックからご対応ください。',
    taskItem: taskItem,
    listTitle: '未実施の店舗（' + storeNames.length + '）',
    listHtml: listHtml,
    ctaUrl: checklistUrl,
    ctaLabel: 'リストチェックを開く',
  });
  return { plain: lines.join('\n'), html: html };
}

function buildTaskEmailHtml_(senderLine, targetTags, deadline, content, appUrl, subtitle) {
  var sub = subtitle || '新規依頼';
  var safeContent = escapeHtmlEmailMultiline_(content);
  return buildTodoEmailShellHtml_({
    intro:
      '<strong style="color:#0f172a;font-size:15px;">' +
      escapeHtmlEmail_(sub) +
      '</strong><br><br>' +
      '<table style="width:100%;font-size:13px;" cellpadding="0" cellspacing="0">' +
      '<tr><td style="padding:4px 0;width:4.5em;font-weight:600;color:#64748b;">名前</td><td style="color:#0f172a;font-weight:600;">' +
      escapeHtmlEmail_(senderLine) +
      '</td></tr>' +
      '<tr><td style="padding:4px 0;font-weight:600;color:#64748b;">エリア</td><td style="color:#0f172a;font-weight:600;">' +
      escapeHtmlEmail_(targetTags || '指定なし') +
      '</td></tr>' +
      '<tr><td style="padding:4px 0;font-weight:600;color:#64748b;">期限</td><td style="color:#0f172a;font-weight:600;">' +
      escapeHtmlEmail_(deadline) +
      '</td></tr></table>',
    extraHtml:
      '<p style="margin:16px 0 8px;font-size:12px;font-weight:700;color:#6366f1;">依頼内容</p>' +
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 18px;font-size:13px;line-height:1.7;color:#0f172a;white-space:pre-wrap;word-break:break-word;">' +
      safeContent +
      '</div>',
    ctaUrl: appUrl,
    ctaLabel: 'To-Do を開く',
  });
}

function getEmployeesByEmailMap_(employees) {
  var map = {};
  (employees || []).forEach(function (emp) {
    var n = normalizeTaskEmail(emp.email);
    if (n) map[n] = emp;
  });
  return map;
}

/** 社員依頼：対象者ごとの実施状況 */
function buildEmployeeRecipientsAdmin_(row, employees) {
  var empMap = getEmployeesByEmailMap_(employees);
  var targets = parseTargetEmails(String(row[13] || ''));
  var payload = parseCompletionPayload_(String(row[14] || '[]'));
  var doneSet = {};
  (payload.people || []).forEach(function (p) {
    doneSet[normalizeTaskEmail(p.email)] = true;
  });
  return targets.map(function (email) {
    var emp = empMap[email];
    var raw = emp ? String(emp.email || '').trim() : email;
    var name = emp ? String(emp.name || '').trim() || raw : email;
    return {
      key: email,
      email: raw,
      name: name,
      label: name,
      done: !!doneSet[email],
      itemType: 'person'
    };
  });
}

/** 店舗依頼：店舗ごとの実施状況＋担当者 */
function buildStoreRecipientsAdmin_(row, employees, allStores, areasList) {
  var taskStores = parseTargetStoresFromTags_(String(row[12] || ''), allStores, areasList);
  var payload = parseCompletionPayload_(String(row[14] || '[]'));
  return taskStores.map(function (storeName) {
    var done = !!(payload.stores && payload.stores[storeName]);
    var assignees = [];
    (employees || []).forEach(function (emp) {
      if ((emp.stores || []).indexOf(storeName) >= 0) {
        assignees.push({
          email: String(emp.email || '').trim(),
          name: String(emp.name || '').trim() || String(emp.email || '').trim()
        });
      }
    });
    return {
      key: storeName,
      storeName: storeName,
      label: storeName,
      done: done,
      assignees: assignees,
      itemType: 'store'
    };
  });
}

function buildAdminTaskRecipients_(row, kind, employees, allStores, areasList) {
  if (kind === 'store') {
    return buildStoreRecipientsAdmin_(row, employees, allStores, areasList);
  }
  return buildEmployeeRecipientsAdmin_(row, employees);
}

function buildAdminTaskSummaryFromRow_(row, allStores, areasList, today) {
  var progress = computeTaskProgressAdmin_(row, allStores, areasList);
  var deadlineVal = row[3];
  var overdue = false;
  if (deadlineVal && !progress.complete) {
    var d = new Date(deadlineVal);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() < today.getTime()) overdue = true;
  }
  var content = String(row[5] || '');
  var preview = content.length > 100 ? content.substring(0, 100) + '…' : content;
  var deadlineStr = '';
  if (deadlineVal) {
    try {
      deadlineStr = Utilities.formatDate(new Date(deadlineVal), 'JST', 'yyyy-MM-dd');
    } catch (e1) {
      deadlineStr = String(deadlineVal);
    }
  }
  return {
    id: String(row[0] || '').trim(),
    requestKind: progress.kind,
    requestKindLabel: getRequestKindLabel_(progress.kind),
    type: String(row[2] || ''),
    sender: String(row[4] || ''),
    contentPreview: preview,
    contentFull: content,
    deadline: deadlineStr,
    targetTags: String(row[12] || ''),
    progressLabel: progress.label,
    progressPct: progress.progressPct,
    complete: progress.complete,
    overdue: overdue,
    statusLabel: progress.complete ? '完了' : overdue ? '期限超過' : '進行中'
  };
}

function getAdminScheduledRows_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('定期配信データ');
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  values.shift();
  return values
    .map(function (row) {
      var id = String(row[0] || '').trim();
      if (!id) return null;
      var rk = normalizeRequestKind_(row[14]);
      var targets = String(row[13] || '')
        .split(',')
        .map(function (e) {
          return e.trim();
        })
        .filter(Boolean);
      return {
        id: id,
        createdAt: row[1] ? Utilities.formatDate(new Date(row[1]), 'JST', 'yyyy/MM/dd') : '',
        sender: String(row[2] || ''),
        cycle: String(row[3] || ''),
        deadlineOffset: String(row[4] || ''),
        contentPreview:
          String(row[5] || '').length > 100 ? String(row[5] || '').substring(0, 100) + '…' : String(row[5] || ''),
        targetTags: String(row[12] || ''),
        targetCount: targets.length,
        requestKind: rk,
        requestKindLabel: getRequestKindLabel_(rk)
      };
    })
    .filter(Boolean)
    .reverse();
}

function findTaskRowById_(values, taskId) {
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === String(taskId)) return values[i];
  }
  return null;
}

function buildIncompleteTaskItemForEmail_(row, allStores, areasList) {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var summary = buildAdminTaskSummaryFromRow_(row, allStores, areasList, today);
  return {
    id: summary.id,
    requestKindLabel: summary.requestKindLabel,
    deadline: summary.deadline,
    sender: summary.sender,
    contentPreview: summary.contentPreview,
    contentFull: String(row[5] || ''),
    overdue: summary.overdue
  };
}

/**
 * 依頼1件の未実施者へリマインド（社員＝メール、店舗＝店舗名→担当者メール）
 * @param {string} taskId
 * @param {string[]} keys
 * @param {string} mode 'employee' | 'store'
 */
function sendAdminTaskReminder(taskId, keys, mode, customIntro) {
  try {
    var adminEmail = Session.getActiveUser().getEmail();
    if (!adminEmail) {
      return { ok: false, message: 'Google アカウントでログインした状態で実行してください。' };
    }
    if (!isAdminUser_(adminEmail)) {
      return { ok: false, message: '権限がありません。' };
    }
    if (!taskId || !keys || !keys.length) {
      return { ok: false, message: '送信対象が選択されていません。' };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('申請データ');
    if (!sheet) return { ok: false, message: '申請データシートがありません。' };
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) return { ok: false, message: 'タスクがありません。' };
    values.shift();

    var row = findTaskRowById_(values, taskId);
    if (!row) return { ok: false, message: 'タスクが見つかりません。' };

    var allStores = getStoreData();
    var areasList = getAreasListFromStores_(allStores);
    var employees = getEmployees();
    var recipients = buildAdminTaskRecipients_(row, mode === 'store' ? 'store' : 'employee', employees, allStores, areasList);
    var keySet = {};
    keys.forEach(function (k) {
      var nk = normalizeTaskEmail(k);
      if (nk) keySet[nk] = true;
      keySet[String(k)] = true;
    });

    var emailsToSend = [];
    var emailMap = {};

    if (mode === 'store') {
      recipients.forEach(function (r) {
        if (r.done) return;
        var sn = String(r.storeName || r.label || r.key || '').trim();
        if (!sn || (!keySet[sn] && !keySet[r.key])) return;
        (r.assignees || []).forEach(function (a) {
          var em = normalizeTaskEmail(a.email);
          if (!em) return;
          if (!emailMap[em]) {
            emailMap[em] = {
              email: String(a.email).trim(),
              name: a.name || a.email,
              stores: [],
            };
          }
          if (emailMap[em].stores.indexOf(sn) < 0) {
            emailMap[em].stores.push(sn);
          }
        });
      });
      Object.keys(emailMap).forEach(function (em) {
        emailsToSend.push(emailMap[em]);
      });
  } else {
    var emailSeen = {};
    recipients.forEach(function (r) {
      if (!keySet[r.key] || r.done) return;
      var em = normalizeTaskEmail(r.email);
      if (em && !emailSeen[em]) {
        emailSeen[em] = true;
        emailsToSend.push({ email: String(r.email).trim(), name: r.name || r.email });
      }
    });
  }

  if (emailsToSend.length === 0) {
    return { ok: false, message: '送信できる対象がありません（既に完了済みの可能性があります）。' };
  }

  var checklistUrl = getTaskEmailLink_() || getTaskWebAppUrl_();
  var taskItem = buildIncompleteTaskItemForEmail_(row, allStores, areasList);
  var sent = 0;
  var errors = [];

  var employeesByEmail = getEmployeesByEmailMap_(employees);
  var adminEmp = employeesByEmail[normalizeTaskEmail(adminEmail)] || null;
  var adminName = adminEmp ? String(adminEmp.name || '').trim() : '';
  if (!adminName) adminName = String(adminEmail).split('@')[0];
  var adminTeam = adminEmp ? String(adminEmp.team || '').trim() : '';
  var fromLabel = adminTeam
    ? adminName + '（' + adminTeam + ' チーム）'
    : adminName + '（管理者）';
  var subject = '【To-Do List】' + (adminTeam ? adminTeam + 'チーム ' : '管理者 ') + 'からのリマインド';
  var introText = String(customIntro || '').trim();
  if (!introText) introText = buildDefaultTeamReminderIntro_(adminName, adminTeam);

  emailsToSend.forEach(function (target) {
    try {
      var plain;
      var html;
      if (mode === 'store' && target.stores && target.stores.length) {
        var bodies = buildTeamProgressStoreReminderBodies_(
          target.name, introText, taskItem, target.stores, checklistUrl, fromLabel, adminEmail
        );
        plain = bodies.plain;
        html = bodies.html;
      } else {
        plain = buildTeamProgressReminderBody_(
          target.name, introText, taskItem, checklistUrl, fromLabel, adminEmail
        );
        html = buildTeamProgressReminderHtml_(
          target.name, introText, taskItem, checklistUrl, fromLabel, adminEmail
        );
      }
      sendBrandedEmail_(target.email, subject, plain, html, {
        name: fromLabel,
        replyTo: adminEmail
      });
      sent++;
    } catch (mailErr) {
      errors.push(target.email + ': ' + String(mailErr));
    }
  });

    if (sent === 0) {
      return { ok: false, message: '送信に失敗しました。\n' + errors.join('\n') };
    }
    var msg = sent + ' 名にリマインドを送信しました。';
    if (errors.length) msg += '\n（失敗: ' + errors.length + ' 件）';
    return { ok: true, message: msg, sent: sent, failed: errors.length };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}

/**
 * 依頼行ごとの進捗（管理者集計用）
 */
function computeTaskProgressAdmin_(row, allStores, areasList) {
  var requestKind = getRequestKindFromRow_(row);
  var payload = parseCompletionPayload_(String(row[14] || '[]'));
  var targetEmails = parseTargetEmails(String(row[13] || ''));
  var taskStores = parseTargetStoresFromTags_(String(row[12] || ''), allStores, areasList);

  if (requestKind === 'store') {
    var total = taskStores.length;
    var done = 0;
    for (var i = 0; i < taskStores.length; i++) {
      var s = taskStores[i];
      if (payload.stores && payload.stores[s]) done++;
    }
    var pct = total ? Math.round((done / total) * 100) : 0;
    var complete = total > 0 && done === total;
    return {
      complete: complete,
      progressPct: pct,
      done: done,
      total: total,
      label: done + '/' + total + '店舗',
      kind: 'store'
    };
  }
  var totalP = targetEmails.length;
  var doneP = (payload.people || []).length;
  var pctP = totalP ? Math.round((doneP / totalP) * 100) : doneP > 0 ? 100 : 0;
  var completeP = totalP ? doneP >= totalP : doneP > 0;
  return {
    complete: completeP,
    progressPct: pctP,
    done: doneP,
    total: totalP,
    label: totalP ? doneP + '/' + totalP + '名' : doneP + '名',
    kind: requestKind
  };
}

/**
 * 管理用ダッシュボードデータ（一覧・集計）
 * @return {{ ok: boolean, message?: string, generatedAt?: string, spreadsheetUrl?: string, viewerEmail?: string, summary?: object, tasks?: object[] }}
 */
function getAdminDashboardData() {
  try {
    var email = Session.getActiveUser().getEmail();
    if (!email) {
      return {
        ok: false,
        message: 'Google アカウントでログインした状態で開いてください。'
      };
    }
    if (!isAdminUser_(email)) {
      return {
        ok: false,
        message: 'このダッシュボードを閲覧する権限がありません。管理者に依頼してください。'
      };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('申請データ');
    var appUrlBase = getTaskWebAppUrl_() || '';
    var checklistUrlBase = getTaskEmailLink_() || appUrlBase;
    var emptyUserProgress = {
      userRows: [],
      usersWithIncomplete: [],
      usersAllClear: [],
      usersNoAssignments: [],
      stats: { totalRegistered: 0, withIncomplete: 0, allClearCount: 0, noAssignmentsCount: 0 }
    };
    if (!sheet) {
      return {
        ok: true,
        generatedAt: new Date().toISOString(),
        spreadsheetUrl: ss.getUrl(),
        appUrl: appUrlBase,
        checklistUrl: checklistUrlBase,
        viewerEmail: email,
        summary: {
          totalTasks: 0,
          completed: 0,
          open: 0,
          overdueOpen: 0,
          employeeOpen: 0,
          storeOpen: 0
        },
        tasks: [],
        employeeTasks: [],
        storeTasks: [],
        scheduledTasks: getAdminScheduledRows_(),
        userProgress: emptyUserProgress
      };
    }

    var allStores = getStoreData();
    var areasList = getAreasListFromStores_(allStores);
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return {
        ok: true,
        generatedAt: new Date().toISOString(),
        spreadsheetUrl: ss.getUrl(),
        appUrl: appUrlBase,
        checklistUrl: checklistUrlBase,
        viewerEmail: email,
        summary: {
          totalTasks: 0,
          completed: 0,
          open: 0,
          overdueOpen: 0,
          employeeOpen: 0,
          storeOpen: 0
        },
        tasks: [],
        employeeTasks: [],
        storeTasks: [],
        scheduledTasks: getAdminScheduledRows_(),
        userProgress: emptyUserProgress
      };
    }
    values.shift();

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var summary = {
      totalTasks: 0,
      completed: 0,
      open: 0,
      overdueOpen: 0,
      employeeOpen: 0,
      storeOpen: 0
    };

    var tasks = [];
    var employees = getEmployees();

    values.forEach(function (row) {
      var id = String(row[0] || '').trim();
      if (!id) return;

      var progress = computeTaskProgressAdmin_(row, allStores, areasList);
      var taskObj = buildAdminTaskSummaryFromRow_(row, allStores, areasList, today);

      summary.totalTasks++;
      if (progress.complete) {
        summary.completed++;
      } else {
        summary.open++;
        if (taskObj.overdue) summary.overdueOpen++;
        if (progress.kind === 'store') summary.storeOpen++;
        else if (progress.kind === 'tf') summary.tfOpen = (summary.tfOpen || 0) + 1;
        else summary.employeeOpen++;
      }

      taskObj.recipients = buildAdminTaskRecipients_(row, progress.kind, employees, allStores, areasList);
      tasks.push(taskObj);
    });

    tasks.sort(function (a, b) {
      if (a.complete !== b.complete) return a.complete ? 1 : -1;
      if (a.overdue !== b.overdue) return b.overdue ? 1 : -1;
      return String(a.deadline).localeCompare(String(b.deadline));
    });

    var employeeTasks = tasks.filter(function (t) {
      return t.requestKind === 'employee';
    });
    var storeTasks = tasks.filter(function (t) {
      return t.requestKind === 'store';
    });
    var tfTasks = tasks.filter(function (t) {
      return t.requestKind === 'tf';
    });
    var scheduledTasks = getAdminScheduledRows_();

    var userRows = [];
    employees.forEach(function (emp) {
      var userNorm = normalizeTaskEmail(emp.email);
      if (!userNorm) return;
      var inc = getIncompleteTasksForUserRows_(values, userNorm, emp.email, emp.stores || [], allStores, areasList);
      var assigned = countAssignedTasksForUser_(values, userNorm, emp.email);
      userRows.push({
        name: String(emp.name || '').trim() || userNorm,
        email: String(emp.email || '').trim(),
        assignedCount: assigned,
        incompleteCount: inc.length,
        incompleteTasks: inc,
        allClear: assigned > 0 && inc.length === 0
      });
    });
    userRows.sort(function (a, b) {
      if (b.incompleteCount !== a.incompleteCount) return b.incompleteCount - a.incompleteCount;
      return String(a.name).localeCompare(String(b.name), 'ja');
    });

    var usersWithIncomplete = userRows.filter(function (u) {
      return u.incompleteCount > 0;
    });
    var usersAllClear = userRows.filter(function (u) {
      return u.allClear;
    });
    var usersNoAssignments = userRows.filter(function (u) {
      return u.assignedCount === 0;
    });

    var viewerEmp = null;
    var viewerNorm = normalizeTaskEmail(email);
    for (var vi = 0; vi < employees.length; vi++) {
      if (normalizeTaskEmail(employees[vi].email) === viewerNorm) {
        viewerEmp = employees[vi];
        break;
      }
    }
    var viewerName = viewerEmp ? String(viewerEmp.name || '').trim() : '';
    var viewerTeam = viewerEmp ? String(viewerEmp.team || '').trim() : '';

    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      spreadsheetUrl: ss.getUrl(),
      appUrl: appUrlBase,
      checklistUrl: checklistUrlBase,
      viewerEmail: email,
      viewerName: viewerName,
      viewerTeam: viewerTeam,
      summary: summary,
      tasks: tasks,
      employeeTasks: employeeTasks,
      storeTasks: storeTasks,
      tfTasks: tfTasks,
      scheduledTasks: scheduledTasks,
      userProgress: {
        userRows: userRows,
        usersWithIncomplete: usersWithIncomplete,
        usersAllClear: usersAllClear,
        usersNoAssignments: usersNoAssignments,
        stats: {
          totalRegistered: userRows.length,
          withIncomplete: usersWithIncomplete.length,
          allClearCount: usersAllClear.length,
          noAssignmentsCount: usersNoAssignments.length
        }
      }
    };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}

/**
 * 管理者：指定ユーザーの未完了タスク一覧をメール送信
 */
function sendAdminReminderEmail(targetEmail) {
  try {
    var adminEmail = Session.getActiveUser().getEmail();
    if (!adminEmail) {
      return { ok: false, message: 'Google アカウントでログインした状態で実行してください。' };
    }
    if (!isAdminUser_(adminEmail)) {
      return { ok: false, message: '権限がありません。' };
    }
    var norm = normalizeTaskEmail(targetEmail);
    if (!norm) {
      return { ok: false, message: 'メールアドレスが不正です。' };
    }
    var employees = getEmployees();
    var emp = null;
    for (var ei = 0; ei < employees.length; ei++) {
      if (normalizeTaskEmail(employees[ei].email) === norm) {
        emp = employees[ei];
        break;
      }
    }
    if (!emp) {
      return { ok: false, message: '従業員データに該当するメールがありません。' };
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('申請データ');
    if (!sheet) {
      return { ok: false, message: '申請データシートがありません。' };
    }
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return { ok: true, message: '未完了タスクはありません。', skipped: true, count: 0 };
    }
    values.shift();
    var allStores = getStoreData();
    var areasList = getAreasListFromStores_(allStores);
    var incomplete = getIncompleteTasksForUserRows_(values, norm, emp.email, emp.stores || [], allStores, areasList);
    if (incomplete.length === 0) {
      return { ok: true, message: '未完了タスクはありません（送信しませんでした）。', skipped: true, count: 0 };
    }
    var checklistUrl = getTaskEmailLink_() || getTaskWebAppUrl_();
    var displayName = String(emp.name || '').trim() || norm;
    var body = buildAdminReminderBody_(displayName, incomplete, checklistUrl);
    var html = buildAdminReminderHtml_(displayName, incomplete, checklistUrl);
    sendBrandedEmail_(
      String(emp.email).trim(),
      '【To-Do List】未完了タスクのリマインド（管理者からの送信）',
      body,
      html
    );
    return { ok: true, message: 'リマインドメールを送信しました。', count: incomplete.length };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}

/** 進捗画面のチーム別URL用（App.jsx の TEAMS と揃える） */
var TM_PROGRESS_TEAMS_ = [
  'QSC＆監査', '原価低減 JOYFIT', '原価低減 FIT365', '販促', 'DX', 'PT', 'オプション',
  'CS・ES', '競合対策', 'スタジオPG', 'リテンション', 'オープン・リニューアル',
  'リスクアセスメント', 'ヨガ＆ピラティスチーム'
];

function buildTeamProgressUrl_(teamName) {
  var base = getTaskWebAppUrl_() || '';
  if (!base) return '';
  var q = base.indexOf('?') >= 0 ? '&' : '?';
  if (!String(teamName || '').trim()) {
    return base + q + 'page=progress';
  }
  return base + q + 'page=progress&team=' + encodeURIComponent(String(teamName).trim());
}

function getTeamProgressUrlBook_() {
  var allUrl = buildTeamProgressUrl_('');
  var teams = TM_PROGRESS_TEAMS_.slice();
  var teamUrls = teams.map(function (name) {
    return { team: name, url: buildTeamProgressUrl_(name) };
  });
  return { progressUrlAll: allUrl, teamUrls: teamUrls, teams: teams };
}

function getTeamProgressAccessMap_() {
  var raw = PropertiesService.getScriptProperties().getProperty('TEAM_PROGRESS_ACCESS');
  if (!raw || !String(raw).trim()) return {};
  try {
    var parsed = JSON.parse(raw);
    var out = {};
    Object.keys(parsed || {}).forEach(function (k) {
      var arr = Array.isArray(parsed[k]) ? parsed[k] : [];
      out[String(k).trim()] = arr.map(function (email) { return normalizeTaskEmail(email); }).filter(Boolean);
    });
    return out;
  } catch (e) {
    return {};
  }
}

function parseEmployeeTeams_(teamStr) {
  return String(teamStr || '')
    .split(/[,，]/)
    .map(function (s) { return String(s || '').trim(); })
    .filter(Boolean);
}

function getViewerTeams_(viewerEmail, employees) {
  var norm = normalizeTaskEmail(viewerEmail);
  if (!norm) return [];
  var emps = Array.isArray(employees) ? employees : [];
  for (var i = 0; i < emps.length; i++) {
    if (normalizeTaskEmail(emps[i].email) === norm) {
      return parseEmployeeTeams_(emps[i].team);
    }
  }
  return [];
}

function extractTfTeamsFromTargetTags_(tags) {
  var src = String(tags || '');
  var teams = [];
  var seen = {};
  var regex = /TF[〈<【\[\(（]([^〉>】\]\)）]+)[〉>】\]\)）]/g;
  var m;
  while ((m = regex.exec(src)) !== null) {
    var name = String(m[1] || '').trim();
    if (!name || seen[name]) continue;
    seen[name] = true;
    teams.push(name);
  }
  return teams;
}

/** 進捗画面に載せる TF 系依頼か（P列が tf、または宛先タグが TF… 形式） */
function isTfProgressTaskRow_(row, taskSummary) {
  if (getRequestKindFromRow_(row) === 'tf') return true;
  var tags = String((taskSummary && taskSummary.targetTags) || row[12] || '').trim();
  if (!tags) return false;
  if (/^TF/i.test(tags)) return true;
  if (tags.indexOf('TF〈') >= 0 || tags.indexOf('TF<') >= 0) return true;
  if (tags.indexOf('TFチーム') >= 0) return true;
  return false;
}

function taskMatchesTeam_(task, team) {
  var teamName = String(team || '').trim();
  if (!teamName) return true;
  var tfTeams = task && task.tfTeams;
  if (tfTeams && tfTeams.length) {
    return tfTeams.indexOf(teamName) >= 0;
  }
  var tags = String((task && task.targetTags) || '');
  if (tags.indexOf('全チーム') >= 0 || tags.indexOf('TFチーム（全') >= 0) return true;
  var sender = String((task && task.sender) || '');
  var norm = teamName.toLowerCase();
  return tags.toLowerCase().indexOf(norm) >= 0 || sender.toLowerCase().indexOf(norm) >= 0;
}

function isTeamProgressViewer_(viewerEmail, teamName, viewerTeams) {
  var norm = normalizeTaskEmail(viewerEmail);
  if (!norm) return false;
  if (isAdminUser_(norm)) return true;
  var accessMap = getTeamProgressAccessMap_();
  var team = String(teamName || '').trim();
  var teams = Array.isArray(viewerTeams) ? viewerTeams : [];
  if (team && teams.indexOf(team) >= 0) return true;
  var allowed = [];
  if (team && accessMap[team]) allowed = allowed.concat(accessMap[team]);
  if (accessMap['*']) allowed = allowed.concat(accessMap['*']);
  return allowed.indexOf(norm) >= 0;
}

function getTeamProgressData(teamName) {
  try {
    var email = Session.getActiveUser().getEmail();
    if (!email) {
      return { ok: false, message: 'Google アカウントでログインした状態で開いてください。' };
    }
    var employees = getEmployees();
    var viewerTeams = getViewerTeams_(email, employees);
    var isAdmin = isAdminUser_(email);
    var requestedTeam = String(teamName || '').trim();
    if (!requestedTeam && !isAdmin) {
      requestedTeam = viewerTeams.length ? viewerTeams[0] : '';
    }
    if (!isTeamProgressViewer_(email, requestedTeam, viewerTeams)) {
      return { ok: false, message: 'この進捗画面を閲覧する権限がありません。' };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('申請データ');
    var appUrlBase = getTaskWebAppUrl_() || '';
    var urlBook = getTeamProgressUrlBook_();
    if (!sheet) {
      return {
        ok: true,
        generatedAt: new Date().toISOString(),
        viewerEmail: email,
        spreadsheetUrl: ss.getUrl(),
        appUrl: appUrlBase,
        selectedTeam: requestedTeam,
        availableTeams: urlBook.teams.slice(),
        progressUrlAll: urlBook.progressUrlAll,
        teamUrls: urlBook.teamUrls,
        tfTasks: [],
        summary: { total: 0, open: 0, overdueOpen: 0, completed: 0 }
      };
    }

    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return {
        ok: true,
        generatedAt: new Date().toISOString(),
        viewerEmail: email,
        spreadsheetUrl: ss.getUrl(),
        appUrl: appUrlBase,
        selectedTeam: requestedTeam,
        availableTeams: urlBook.teams.slice(),
        progressUrlAll: urlBook.progressUrlAll,
        teamUrls: urlBook.teamUrls,
        tfTasks: [],
        summary: { total: 0, open: 0, overdueOpen: 0, completed: 0 }
      };
    }
    values.shift();

    var allStores = getStoreData();
    var areasList = getAreasListFromStores_(allStores);
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var tfTasks = [];
    var teamSet = {};
    values.forEach(function (row) {
      var id = String(row[0] || '').trim();
      if (!id) return;
      var task = buildAdminTaskSummaryFromRow_(row, allStores, areasList, today);
      if (!isTfProgressTaskRow_(row, task)) return;
      var progress = computeTaskProgressAdmin_(row, allStores, areasList);
      task.recipients = buildAdminTaskRecipients_(row, progress.kind, employees, allStores, areasList);
      var teams = extractTfTeamsFromTargetTags_(task.targetTags || '');
      teams.forEach(function (t) { teamSet[t] = true; });
      task.tfTeams = teams;
      if (!taskMatchesTeam_(task, requestedTeam)) return;
      tfTasks.push(task);
    });

    tfTasks.sort(function (a, b) {
      if (a.complete !== b.complete) return a.complete ? 1 : -1;
      if (a.overdue !== b.overdue) return b.overdue ? 1 : -1;
      return String(a.deadline).localeCompare(String(b.deadline));
    });

    var summary = { total: tfTasks.length, open: 0, overdueOpen: 0, completed: 0 };
    tfTasks.forEach(function (t) {
      if (t.complete) summary.completed++;
      else {
        summary.open++;
        if (t.overdue) summary.overdueOpen++;
      }
    });

    var fromData = Object.keys(teamSet);
    var availableTeams = TM_PROGRESS_TEAMS_.slice();
    fromData.forEach(function (t) {
      if (availableTeams.indexOf(t) < 0) availableTeams.push(t);
    });
    if (!isAdmin) {
      var allowedTeams = viewerTeams.slice();
      if (allowedTeams.length) {
        availableTeams = allowedTeams.filter(function (t) { return availableTeams.indexOf(t) >= 0 || fromData.indexOf(t) >= 0; });
        if (!availableTeams.length) availableTeams = allowedTeams;
      } else {
        availableTeams = [];
      }
    }
    if (requestedTeam && availableTeams.indexOf(requestedTeam) < 0) {
      return { ok: false, message: '指定されたチームを閲覧する権限がありません。' };
    }
    var viewerEmployee = null;
    var employeesAll = employees;
    var viewerNorm = normalizeTaskEmail(email);
    for (var ev = 0; ev < employeesAll.length; ev++) {
      if (normalizeTaskEmail(employeesAll[ev].email) === viewerNorm) {
        viewerEmployee = employeesAll[ev];
        break;
      }
    }
    var viewerName = viewerEmployee ? String(viewerEmployee.name || '').trim() : '';
    var viewerTeam = viewerEmployee ? String(viewerEmployee.team || '').trim() : '';
    var viewerRole = viewerEmployee ? String(viewerEmployee.role || '').trim() : '';
    var viewerArea = viewerEmployee ? String(viewerEmployee.area || '').trim() : '';
    var viewerTerritory = viewerEmployee ? String(viewerEmployee.territory || '').trim() : '';
    var viewerStores = viewerEmployee && Array.isArray(viewerEmployee.stores) ? viewerEmployee.stores : [];

    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      viewerEmail: email,
      viewerName: viewerName,
      viewerTeam: viewerTeam,
      viewerRole: viewerRole,
      viewerArea: viewerArea,
      viewerTerritory: viewerTerritory,
      viewerStores: viewerStores,
      viewerTeams: viewerTeams,
      canViewAllTeams: isAdmin,
      spreadsheetUrl: ss.getUrl(),
      appUrl: appUrlBase,
      selectedTeam: requestedTeam,
      availableTeams: availableTeams,
      progressUrlAll: urlBook.progressUrlAll,
      teamUrls: urlBook.teamUrls,
      tfTasks: tfTasks,
      summary: summary
    };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}

/** チーム進捗リマインド用の既定本文（リーダー名・チーム名を差し込み） */
function buildDefaultTeamReminderIntro_(viewerName, viewerTeam) {
  var teamLabel = viewerTeam ? viewerTeam + 'チーム' : 'TFチーム';
  var nameLabel = viewerName || '担当';
  return [
    'お元気様です。',
    teamLabel + '　の' + nameLabel + 'です。',
    '',
    '下記、未完了の依頼がありましたので、ご確認・ご対応のほどよろしくお願いいたします。'
  ].join('\n');
}

function buildTeamProgressReminderBody_(recipientName, intro, taskItem, checklistUrl, fromLabel, viewerEmail) {
  var lines = [];
  lines.push(recipientName + ' 様');
  lines.push('');
  String(intro || '').split('\n').forEach(function (line) { lines.push(line); });
  lines.push('');
  lines.push('▼ 対象の依頼');
  var mark = taskItem.overdue ? '【期限超過】' : '';
  lines.push(mark + '[' + taskItem.requestKindLabel + '] ' + (taskItem.contentPreview || '').replace(/\n/g, ' '));
  lines.push('期限: ' + (taskItem.deadline || '—') + ' / 依頼者: ' + (taskItem.sender || '—'));
  lines.push('');
  lines.push('▼ リストチェックを開く');
  lines.push(checklistUrl || '');
  lines.push('');
  lines.push('— 送信者: ' + fromLabel);
  lines.push('   返信先: ' + viewerEmail);
  return lines.join('\n');
}

function buildTeamProgressReminderHtml_(recipientName, intro, taskItem, checklistUrl, fromLabel, viewerEmail) {
  var introHtml = String(intro || '')
    .split('\n')
    .map(function (line) { return escapeHtmlEmail_(line); })
    .join('<br>');
  var footer =
    '<p style="margin:20px 0 0;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:12px;">' +
    '— 送信者: <strong style="color:#475569;">' + escapeHtmlEmail_(fromLabel) + '</strong><br>' +
    '返信先: ' + escapeHtmlEmail_(viewerEmail) +
    '</p>';
  return buildTodoEmailShellHtml_({
    greeting: escapeHtmlEmail_(recipientName) + ' 様',
    intro: introHtml,
    taskItem: taskItem,
    ctaUrl: checklistUrl,
    ctaLabel: 'リストチェックを開く',
    extraHtml: footer
  });
}

function buildTeamProgressStoreReminderBodies_(recipientName, intro, taskItem, storeNames, checklistUrl, fromLabel, viewerEmail) {
  var lines = [];
  lines.push(recipientName + ' 様');
  lines.push('');
  String(intro || '').split('\n').forEach(function (line) { lines.push(line); });
  lines.push('');
  lines.push('▼ 対象の依頼');
  lines.push(String(taskItem.contentPreview || '').replace(/\n/g, ' '));
  lines.push('期限: ' + (taskItem.deadline || '—') + ' / 依頼者: ' + (taskItem.sender || '—'));
  if (taskItem.overdue) lines.push('※期限超過');
  lines.push('');
  lines.push('未実施の店舗（' + storeNames.length + '）:');
  storeNames.forEach(function (s, i) { lines.push('  ' + (i + 1) + '. ' + s); });
  lines.push('');
  lines.push('▼ リストチェックを開く');
  lines.push(checklistUrl || '');
  lines.push('');
  lines.push('— 送信者: ' + fromLabel);
  lines.push('   返信先: ' + viewerEmail);

  var introHtml = String(intro || '')
    .split('\n')
    .map(function (line) { return escapeHtmlEmail_(line); })
    .join('<br>');
  var listHtml = '<ul style="margin:8px 0 0;padding-left:20px;">';
  storeNames.forEach(function (s) {
    listHtml += '<li style="margin:4px 0;font-size:14px;font-weight:600;color:#0f172a;">' + escapeHtmlEmail_(s) + '</li>';
  });
  listHtml += '</ul>';
  var footer =
    '<p style="margin:20px 0 0;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:12px;">' +
    '— 送信者: <strong style="color:#475569;">' + escapeHtmlEmail_(fromLabel) + '</strong><br>' +
    '返信先: ' + escapeHtmlEmail_(viewerEmail) +
    '</p>';
  var html = buildTodoEmailShellHtml_({
    greeting: escapeHtmlEmail_(recipientName) + ' 様',
    intro: introHtml,
    taskItem: taskItem,
    listTitle: '未実施の店舗（' + storeNames.length + '）',
    listHtml: listHtml,
    ctaUrl: checklistUrl,
    ctaLabel: 'リストチェックを開く',
    extraHtml: footer
  });
  return { plain: lines.join('\n'), html: html };
}

/**
 * チーム進捗ビュー用：依頼1件のリマインドを未実施者へ送信。
 * - 認可: 該当チームの閲覧者（または管理者）であること
 * - 送信元(From): スクリプトの実行アカウント（GAS の制約で変更不可）
 * - 表示名: 「○○（チームリーダー）」 — リーダー本人として見える
 * - 返信先(Reply-To): リーダーのメールに自動で返るよう設定
 * - 本文: リーダー名の署名つき
 */
function sendTeamProgressReminder(taskId, keys, mode, teamName, customIntro) {
  try {
    return { ok: false, message: 'この画面は閲覧専用のため、リマインド送信はできません。' };
    var viewerEmail = Session.getActiveUser().getEmail();
    if (!viewerEmail) {
      return { ok: false, message: 'Google アカウントでログインした状態で実行してください。' };
    }
    var requestedTeam = String(teamName || '').trim();
    if (!isTeamProgressViewer_(viewerEmail, requestedTeam)) {
      return { ok: false, message: 'リマインドを送信する権限がありません。' };
    }
    if (!taskId || !keys || !keys.length) {
      return { ok: false, message: '送信対象が選択されていません。' };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('申請データ');
    if (!sheet) return { ok: false, message: '申請データシートがありません。' };
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) return { ok: false, message: 'タスクがありません。' };
    values.shift();

    var row = findTaskRowById_(values, taskId);
    if (!row) return { ok: false, message: 'タスクが見つかりません。' };

    var allStores = getStoreData();
    var areasList = getAreasListFromStores_(allStores);
    var employees = getEmployees();
    var progress = computeTaskProgressAdmin_(row, allStores, areasList);
    var resolvedMode = mode === 'store' ? 'store' : (progress.kind === 'store' ? 'store' : 'employee');
    var recipients = buildAdminTaskRecipients_(row, resolvedMode, employees, allStores, areasList);

    var keySet = {};
    keys.forEach(function (k) {
      var nk = normalizeTaskEmail(k);
      if (nk) keySet[nk] = true;
      keySet[String(k)] = true;
    });

    var emailsToSend = [];
    var emailMap = {};
    if (resolvedMode === 'store') {
      recipients.forEach(function (r) {
        if (r.done) return;
        var sn = String(r.storeName || r.label || r.key || '').trim();
        if (!sn || (!keySet[sn] && !keySet[r.key])) return;
        (r.assignees || []).forEach(function (a) {
          var em = normalizeTaskEmail(a.email);
          if (!em) return;
          if (!emailMap[em]) {
            emailMap[em] = { email: String(a.email).trim(), name: a.name || a.email, stores: [] };
          }
          if (emailMap[em].stores.indexOf(sn) < 0) emailMap[em].stores.push(sn);
        });
      });
      Object.keys(emailMap).forEach(function (em) { emailsToSend.push(emailMap[em]); });
    } else {
      var seen = {};
      recipients.forEach(function (r) {
        if (!keySet[r.key] || r.done) return;
        var em = normalizeTaskEmail(r.email);
        if (em && !seen[em]) {
          seen[em] = true;
          emailsToSend.push({ email: String(r.email).trim(), name: r.name || r.email });
        }
      });
    }

    if (emailsToSend.length === 0) {
      return { ok: false, message: '送信できる対象がありません（既に完了済みの可能性があります）。' };
    }

    var employeesByEmail = getEmployeesByEmailMap_(employees);
    var viewerEmp = employeesByEmail[normalizeTaskEmail(viewerEmail)] || null;
    var viewerName = viewerEmp ? String(viewerEmp.name || '').trim() : '';
    if (!viewerName) viewerName = String(viewerEmail).split('@')[0];
    var viewerTeam = viewerEmp ? String(viewerEmp.team || '').trim() : '';
    var fromLabel = viewerTeam
      ? viewerName + '（' + viewerTeam + ' チーム）'
      : viewerName + '（チームリーダー）';

    var checklistUrl = getTaskEmailLink_() || getTaskWebAppUrl_();
    var taskItem = buildIncompleteTaskItemForEmail_(row, allStores, areasList);
    var subject = '【To-Do List】' + (viewerTeam ? viewerTeam + 'チーム ' : '') + 'からのリマインド';

    var introText = String(customIntro || '').trim();
    if (!introText) introText = buildDefaultTeamReminderIntro_(viewerName, viewerTeam);

    var sent = 0;
    var errors = [];
    emailsToSend.forEach(function (target) {
      try {
        var plain;
        var html;
        if (resolvedMode === 'store' && target.stores && target.stores.length) {
          var bodies = buildTeamProgressStoreReminderBodies_(
            target.name, introText, taskItem, target.stores, checklistUrl, fromLabel, viewerEmail
          );
          plain = bodies.plain;
          html = bodies.html;
        } else {
          plain = buildTeamProgressReminderBody_(
            target.name, introText, taskItem, checklistUrl, fromLabel, viewerEmail
          );
          html = buildTeamProgressReminderHtml_(
            target.name, introText, taskItem, checklistUrl, fromLabel, viewerEmail
          );
        }
        sendBrandedEmail_(target.email, subject, plain, html, {
          name: fromLabel,
          replyTo: viewerEmail
        });
        sent++;
      } catch (mailErr) {
        errors.push(target.email + ': ' + String(mailErr));
      }
    });

    if (sent === 0) {
      return { ok: false, message: '送信に失敗しました。\n' + errors.join('\n') };
    }
    var msg = sent + ' 名にリマインドを送信しました。\n（送信者表示: ' + fromLabel + ' / 返信先: ' + viewerEmail + '）';
    if (errors.length) msg += '\n失敗: ' + errors.length + ' 件';
    return { ok: true, message: msg, sent: sent, failed: errors.length, fromLabel: fromLabel };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}
