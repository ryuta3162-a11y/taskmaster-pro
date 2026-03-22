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

function saveImagesToDrive(images, senderName) {
  if (!images || images.length === 0) return [];
  const folder = getOrCreateFolder(UPLOAD_FOLDER_NAME);
  const imageUrls = [];
  
  images.forEach(img => {
    try {
      // 再投稿など：既存の Drive URL をそのまま使う（再アップロードしない）
      if (img && img.reuseUrl) {
        imageUrls.push(String(img.reuseUrl).trim());
        return;
      }
      if (!img || !img.base64) return;
      const decoded = Utilities.base64Decode(img.base64, Utilities.Charset.UTF_8);
      const blob = Utilities.newBlob(decoded, img.type, img.name);
      const dateStr = Utilities.formatDate(new Date(), "JST", "yyyyMMdd_HHmmss");
      const uniqueFileName = `${dateStr}_${senderName}_${img.name}`;
      const file = folder.createFile(blob).setName(uniqueFileName);
      
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const directUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();
      imageUrls.push(directUrl);
    } catch (e) {
      console.error('画像保存エラー', e.toString());
    }
  });
  
  return imageUrls;
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
function getTasksForUser(userEmail) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('申請データ') || ss.insertSheet('申請データ');
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];
    values.shift(); 
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = [];
    values.forEach(row => {
      const targetsStr = String(row[13] || "");
      if (targetsStr.includes(userEmail)) {
        const completedDataStr = String(row[14] || "[]");
        let completedData = [];
        try { completedData = JSON.parse(completedDataStr); } catch(e) {}
        const isCompleted = completedData.some(d => d.email === userEmail);
        
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

        tasks.push({
          id: String(row[0] || ""),
          type: String(row[2] || "タスク"),
          deadline: deadlineVal ? Utilities.formatDate(new Date(deadlineVal), "JST", "yyyy-MM-dd") : "",
          daysRemaining: daysRemaining,
          sortValue: sortValue,
          sender: String(row[4] || "不明"),
          content: String(row[5] || ""),
          urls: [String(row[6]||""), String(row[7]||""), String(row[8]||"")].filter(Boolean),
          images: [String(row[9]||""), String(row[10]||""), String(row[11]||"")].filter(Boolean),
          targetTags: String(row[12] || ""),
          completed: isCompleted
        });
      }
    });

    tasks.sort((a, b) => a.sortValue - b.sortValue);
    return tasks;
  } catch (e) { return []; }
}

function completeTask(taskId, userEmail) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('申請データ');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === taskId) {
      const rowNum = i + 1;
      let completedData = [];
      try { completedData = JSON.parse(values[i][14] || "[]"); } catch(e) {}
      const existingIndex = completedData.findIndex(d => d.email === userEmail);
      if (existingIndex >= 0) return { success: true, rank: existingIndex + 1 };
      completedData.push({ email: userEmail, time: Utilities.formatDate(new Date(), "JST", "MM/dd HH:mm") });
      sheet.getRange(rowNum, 15).setValue(JSON.stringify(completedData));
      return { success: true, rank: completedData.length };
    }
  }
  return { success: false };
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
      targets: String(row[13] || "").split(",").map(function (e) { return e.trim(); }).filter(Boolean)
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
    const uploadedUrls = saveImagesToDrive(taskData.images, taskData.sender);
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
      sheet.appendRow(['ID', '作成日', '作成者', 'サイクル', '期限設定', '依頼内容', 'リンク1', 'リンク2', 'リンク3', '画像1', '画像2', '画像3', '配信先タグ', '配信先アドレス']);
    }
    const newId = 's_' + new Date().getTime();
    
    const row = [
      newId, new Date(), taskData.sender, taskData.cycle, taskData.deadlineOffset, 
      taskData.content, u1, u2, u3, i1, i2, i3, taskData.targetTags || '', taskData.targets.join(',')
    ];
    sheet.appendRow(row);

    // 初回の今月分：申請データに1行追加（フロントで「今月の初回分は作成しない」= skipInitialTask true のときはスキップ）
    if (taskData.skipInitialTask !== true) {
      const deadlineFormatted = computeDeadlineForScheduledOffset_(new Date(), taskData.deadlineOffset);
      let reqSheet = ss.getSheetByName('申請データ');
      if (!reqSheet) {
        reqSheet = ss.insertSheet('申請データ');
        reqSheet.appendRow(['ID', '日時', 'タスク種別', '期限', '申請者', '依頼内容', 'リンク1', 'リンク2', 'リンク3', '画像1', '画像2', '画像3', '対象エリア', 'ターゲット一覧', '完了データ']);
      }
      const newTaskId = 't_' + new Date().getTime();
      const targetsArr = taskData.targets || [];
      reqSheet.appendRow([
        newTaskId, new Date(), '定期タスク（初回）', deadlineFormatted, taskData.sender, taskData.content,
        u1, u2, u3, i1, i2, i3,
        taskData.targetTags || '', targetsArr.join(','), '[]'
      ]);

      const appUrl = ScriptApp.getService().getUrl() + "?tab=checklist";
      const emailBody = `[ ToDo List ] 定期タスク（初回・今月分）\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `■ 依頼者　　: ${taskData.sender}\n` +
                        `■ 対象エリア: ${taskData.targetTags || "指定なし"}\n` +
                        `■ 期限 (DL) : ${deadlineFormatted}\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `[ 依頼内容 ]\n${taskData.content}\n\n` +
                        `▼ 以下のリンクから確認・完了報告をしてください。\n${appUrl}`;

      targetsArr.forEach(function (email) {
        if (!email) return;
        try {
          MailApp.sendEmail({
            to: String(email).trim(),
            subject: "【TODOリスト】定期タスク（初回・今月分）が届きました",
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

    return { status: 'success' };
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
      targets: String(row[13] || "").split(",").map(function (e) { return e.trim(); }).filter(Boolean)
    })).filter(t => t.sender === userName).reverse();
  } catch(e) { return []; }
}

/**
 * 定期配信の内容を更新（次回の processScheduledTasksBatch から反映）。初回タスクは再作成しない。
 */
function updateScheduledTask(id, taskData) {
  try {
    const uploadedUrls = saveImagesToDrive(taskData.images, taskData.sender);
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
        sheet.getRange(rowNum, 4, rowNum, 14).setValues([[
          taskData.cycle,
          taskData.deadlineOffset,
          taskData.content,
          u1, u2, u3,
          i1, i2, i3,
          taskData.targetTags || '',
          taskData.targets.join(',')
        ]]);
        return { status: 'success' };
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
function sendChatNotification(taskData, appUrl, isScheduled = false) {
  if (!CHAT_WEBHOOK_URL) return;
  const title = isScheduled ? "定期タスクが自動配信されました" : "新しいタスクが届きました";
  
  const messageText = 
    "*[ ToDo List ] " + title + "*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━\n" +
    "■ 依頼者　　: " + taskData.sender + "\n" +
    "■ 対象エリア: " + (taskData.targetTags || "指定なし") + "\n" +
    "■ 期限 (DL) : " + taskData.deadline + "\n" +
    "━━━━━━━━━━━━━━━━━━━━━━\n" +
    "[ 依頼内容 ]\n" + taskData.content + "\n\n" +
    "▼ 詳細の確認・完了報告はこちら\n" + appUrl;

  const options = {
    "method": "post",
    "headers": { "Content-Type": "application/json; charset=UTF-8" },
    "payload": JSON.stringify({ "text": messageText })
  };
  try { UrlFetchApp.fetch(CHAT_WEBHOOK_URL, options); } catch (e) {}
}

function createNewTask(taskData) {
  const uploadedUrls = saveImagesToDrive(taskData.images, taskData.sender);
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
    sheet.appendRow(['ID', '日時', 'タスク種別', '期限', '申請者', '依頼内容', 'リンク1', 'リンク2', 'リンク3', '画像1', '画像2', '画像3', '対象エリア', 'ターゲット一覧', '完了データ']);
  }

  const newId = 't_' + new Date().getTime();
  const row = [
    newId, new Date(), taskData.type, taskData.deadline, taskData.sender, taskData.content, 
    u1, u2, u3, i1, i2, i3, 
    taskData.targetTags || '', taskData.targets.join(','), '[]'
  ];
  sheet.appendRow(row);

  const appUrl = ScriptApp.getService().getUrl() + "?tab=checklist";
  const emailBody = `[ ToDo List ] 新着タスク通知\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `■ 依頼者　　: ${taskData.sender}\n` +
                    `■ 対象エリア: ${taskData.targetTags || "指定なし"}\n` +
                    `■ 期限 (DL) : ${taskData.deadline}\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `[ 依頼内容 ]\n${taskData.content}\n\n` +
                    `▼ 以下のリンクから確認・完了報告をしてください。\n${appUrl}`;

  taskData.targets.forEach(email => {
    try {
      MailApp.sendEmail({
        to: email,
        subject: "【TODOリスト】新しいタスクが届きました",
        body: emailBody
      });
    } catch(e) {}
  });

  sendChatNotification(taskData, appUrl, false);
  return { id: newId, status: 'success' };
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
  const appUrl = ScriptApp.getService().getUrl() + "?tab=checklist";
  
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
      
      const reqSheet = ss.getSheetByName('申請データ') || ss.insertSheet('申請データ');
      const newId = 't_' + new Date().getTime() + Math.floor(Math.random()*1000);
      
      reqSheet.appendRow([
        newId, new Date(), '定期タスク', deadlineFormatted, sender, content, 
        u1, u2, u3, i1, i2, i3, 
        targetTags, targets.join(','), '[]'
      ]);
      
      const taskData = { sender, targetTags, deadline: deadlineFormatted, content, targets };
      const emailBody = `[ ToDo List ] 定期タスク自動配信\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `■ 依頼者　　: ${sender} (自動配信)\n` +
                        `■ 対象エリア: ${targetTags}\n` +
                        `■ 期限 (DL) : ${deadlineFormatted}\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `[ 依頼内容 ]\n${content}\n\n` +
                        `▼ 以下のリンクから確認・完了報告をしてください。\n${appUrl}`;

      targets.forEach(email => {
        if(!email) return;
        try {
          MailApp.sendEmail({
            to: email.trim(),
            subject: "【TODOリスト】定期タスクが届きました",
            body: emailBody
          });
        } catch(e) {}
      });
      sendChatNotification(taskData, appUrl, true);
    }
  });
}
