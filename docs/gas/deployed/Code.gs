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
  if (page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('admin')
      .setTitle('ToDo 管理ダッシュボード')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ToDo List')
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

/** base64 → Blob（画像・PDF ともバイナリを壊さない。失敗時は別方式を試す） */
function base64ToBlob_(b64, mime, fileName) {
  var clean = normalizeBase64Payload_(b64);
  if (!clean) throw new Error('base64が空です');
  var mt = mime || 'application/octet-stream';
  if ((!mime || String(mime).trim() === '') && /\.pdf$/i.test(fileName)) {
    mt = 'application/pdf';
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
      var directUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
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
      stores: row.slice(7, 17).filter(Boolean).map(s => String(s).trim()) // ★店舗はH列(7)以降にずれる
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

function registerEmployee(empData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('従業員データ') || ss.insertSheet('従業員データ');
    // ★役職(role)を挿入する
    let row = [
      empData.name, empData.email, empData.team, 'なし', empData.area, empData.territory, empData.role
    ];
    if (empData.stores && empData.stores.length > 0) row = row.concat(empData.stores);
    sheet.appendRow(row);
    return { status: 'success' };
  } catch(e) { return { status: 'error', message: e.toString() }; }
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

/** 店舗データからエリア名一覧（ターゲットタグ解析用） */
function getAreasListFromStores_(allStores) {
  var seen = {};
  var out = [];
  (allStores || []).forEach(function (s) {
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
  var allStoreNames = (allStores || []).map(function (s) {
    return s.storeName;
  });
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
    if (areasList.indexOf(p) >= 0) {
      allStores.filter(function (st) {
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

function getRequestKindFromRow_(row) {
  var k = String(row[15] || '').trim().toLowerCase();
  if (k === 'store') return 'store';
  return 'employee';
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
    values.forEach(function (row) {
      const targetsStr = String(row[13] || '');
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
      requestKind: String(row[15] || '').toLowerCase() === 'store' ? 'store' : 'employee'
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
    var reqKind = taskData.requestKind === 'store' ? 'store' : 'employee';

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

      targetsArr.forEach(function (email) {
        if (!email) return;
        try {
          MailApp.sendEmail({
            to: String(email).trim(),
            subject: 'To-Do List',
            body: emailBody
          });
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
      requestKind: String(row[14] || '').toLowerCase() === 'store' ? 'store' : 'employee'
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
        var rk = taskData.requestKind === 'store' ? 'store' : 'employee';
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

/** デプロイした Web アプリの URL（実行中のスクリプトに紐づく。Workspace では /a/macros/ドメイン/s/... の形式になる） */
function getTaskWebAppUrl_() {
  return ScriptApp.getService().getUrl();
}

/** メール・Chat 用：デプロイ URL（Workspace では /a/macros/ドメイン/s/... が返る）に tab=checklist を付与 */
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

  var reqKind = taskData.requestKind === 'store' ? 'store' : 'employee';
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

  taskData.targets.forEach(email => {
    try {
      MailApp.sendEmail({
        to: email,
        subject: 'To-Do List',
        body: emailBody
      });
    } catch(e) {}
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
      var requestKind = String(row[14] || 'employee').toLowerCase() === 'store' ? 'store' : 'employee';
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

      targets.forEach(email => {
        if(!email) return;
        try {
          MailApp.sendEmail({
            to: email.trim(),
            subject: 'To-Do List',
            body: emailBody
          });
        } catch(e) {}
      });
      sendChatNotification(taskData, appUrl, true);
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
      requestKind: requestKind === 'store' ? 'store' : 'employee',
      requestKindLabel: requestKind === 'store' ? '店舗依頼' : '社員依頼',
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
    kind: 'employee'
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

    values.forEach(function (row) {
      var id = String(row[0] || '').trim();
      if (!id) return;

      var progress = computeTaskProgressAdmin_(row, allStores, areasList);
      var deadlineVal = row[3];
      var overdue = false;
      if (deadlineVal && !progress.complete) {
        var d = new Date(deadlineVal);
        d.setHours(0, 0, 0, 0);
        if (d.getTime() < today.getTime()) overdue = true;
      }

      summary.totalTasks++;
      if (progress.complete) {
        summary.completed++;
      } else {
        summary.open++;
        if (overdue) summary.overdueOpen++;
        if (progress.kind === 'employee') summary.employeeOpen++;
        else summary.storeOpen++;
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

      var statusLabel = progress.complete ? '完了' : overdue ? '期限超過' : '進行中';

      tasks.push({
        id: id,
        requestKind: progress.kind,
        requestKindLabel: progress.kind === 'store' ? '店舗依頼' : '社員依頼',
        type: String(row[2] || ''),
        sender: String(row[4] || ''),
        contentPreview: preview,
        deadline: deadlineStr,
        targetTags: String(row[12] || ''),
        progressLabel: progress.label,
        progressPct: progress.progressPct,
        complete: progress.complete,
        overdue: overdue,
        statusLabel: statusLabel
      });
    });

    tasks.sort(function (a, b) {
      if (a.complete !== b.complete) return a.complete ? 1 : -1;
      if (a.overdue !== b.overdue) return b.overdue ? 1 : -1;
      return String(a.deadline).localeCompare(String(b.deadline));
    });

    var employees = getEmployees();
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

    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      spreadsheetUrl: ss.getUrl(),
      appUrl: appUrlBase,
      checklistUrl: checklistUrlBase,
      viewerEmail: email,
      summary: summary,
      tasks: tasks,
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
    MailApp.sendEmail({
      to: String(emp.email).trim(),
      subject: '【To-Do List】未完了タスクのリマインド（管理者からの送信）',
      body: body
    });
    return { ok: true, message: 'リマインドメールを送信しました。', count: incomplete.length };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}
