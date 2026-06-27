/**
 * To Do List 本番運用案内メール → Gmail 下書きを自動作成
 *
 * 1. ROLLOUT_MAIL_CONFIG を編集
 * 2. createTodoListRolloutDraft を実行
 * 3. Gmail の下書き → 宛先（To / Bcc）を入れて送信
 *
 * 任意: スプレッドシートにメール一覧がある場合は
 *       createTodoListRolloutDraftsFromSheet も使えます（1人1下書き）
 */

/** ========== ここだけ編集 ========== */
const ROLLOUT_MAIL_CONFIG = {
  subject: '【To Do List】7月1日より本番運用開始のご案内',

  /** 登録済み人数（文面に表示） */
  registeredCount: 63,

  /** 本番運用開始日（表示用） */
  launchDateLabel: '7月1日',

  /** To Do List ログインURL */
  appUrl:
    'https://script.google.com/a/okamoto-group.co.jp/macros/s/AKfycbyUmHnVEEJbuntAayPBu5zEe_4iRVDjtq8LOHQ5pURXRgEQYpLX324-3SMxeX9_NllAuw/exec',

  /** 使い方ガイド（Vercel） */
  guideUrl: 'https://todo-list-guide.vercel.app/',

  /** 旧 To Do（スプレッドシート）— 7月より使用不可 */
  oldSheetUrl:
    'https://docs.google.com/spreadsheets/d/1vDBAmytbgs5BLi9x_SCnVeY9TNgWZejR5he77OLzoXU/edit?gid=1386834576#gid=1386834576',
  oldSheetEndLabel: '7月',

  /** 不具合連絡先（表示用） */
  contactDxTeam: 'DXチーム',
  contactPerson: '日下 竜太',
  contactEmail: 'r-kusaka@okamoto-group.co.jp',

  signatureName: '日下 竜太',
  signatureTeam: 'TFチーム / DX',
  signatureContact: 'r-kusaka@okamoto-group.co.jp',
};

/**
 * スプレッドシートから一括下書きする場合のみ編集
 * （シート名・メール列・開始行）
 */
const ROLLOUT_SHEET_CONFIG = {
  sheetName: 'ユーザーマスタ',
  emailColumn: 2,
  startRow: 2,
};
/** ================================= */

/** Gmail に HTML 下書きを1件作成（宛先は空 → 送信前に To / Bcc を入れる） */
function createTodoListRolloutDraft() {
  const cfg = ROLLOUT_MAIL_CONFIG;
  const html = buildTodoListRolloutHtml_(cfg);
  const plain = buildTodoListRolloutPlain_(cfg);

  GmailApp.createDraft('', cfg.subject, plain, { htmlBody: html });

  notifyDone_('Gmail の下書きを1件作成しました。\n宛先（To または Bcc）を入れて送信してください。');
}

/**
 * アクティブシートのメール列から、1アドレスにつき下書きを1件ずつ作成
 * （一斉送信で Bcc に全員を入れず、個別下書きにしたい場合用）
 */
function createTodoListRolloutDraftsFromSheet() {
  const cfg = ROLLOUT_MAIL_CONFIG;
  const scfg = ROLLOUT_SHEET_CONFIG;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(scfg.sheetName);
  if (!sheet) {
    throw new Error('シートが見つかりません: ' + scfg.sheetName);
  }

  const html = buildTodoListRolloutHtml_(cfg);
  const plain = buildTodoListRolloutPlain_(cfg);
  const lastRow = sheet.getLastRow();
  let count = 0;

  for (let row = scfg.startRow; row <= lastRow; row++) {
    const email = String(sheet.getRange(row, scfg.emailColumn).getValue() || '').trim();
    if (!email || email.indexOf('@') < 0) continue;
    GmailApp.createDraft(email, cfg.subject, plain, { htmlBody: html });
    count++;
  }

  notifyDone_('Gmail の下書きを ' + count + ' 件作成しました。');
}

/** スプレッドシートにメニューを追加（任意） */
function onOpenTodoListRolloutMenu() {
  SpreadsheetApp.getUi()
    .createMenu('To Do List 案内')
    .addItem('案内メールを下書き作成（1件）', 'createTodoListRolloutDraft')
    .addItem('案内メールを下書き一括作成（シート参照）', 'createTodoListRolloutDraftsFromSheet')
    .addToUi();
}

function buildTodoListRolloutPlain_(cfg) {
  return (
    'DXチームからのお知らせ\n\n' +
    'To Do List — ' +
    cfg.launchDateLabel +
    'より本番運用開始\n\n' +
    'お元気様です。\n\n' +
    '新 To Do List についてご案内いたします。\n' +
    '現在' +
    cfg.registeredCount +
    '名の方にご登録いただいております。ありがとうございます。\n\n' +
    '本番運用は' +
    cfg.launchDateLabel +
    'より開始いたします。\n' +
    '今後の依頼の受け取り・配信は、新 To Do List をご利用ください。\n\n' +
    'こちらのTodoは' +
    cfg.oldSheetEndLabel +
    'より使用不可になります。\n' +
    cfg.oldSheetUrl +
    '\n\n' +
    'ログイン（未登録の方もこちらから）:\n' +
    cfg.appUrl +
    '\n\n' +
    '使い方ガイド（試験公開・随時更新）:\n' +
    cfg.guideUrl +
    '\n\n' +
    '不具合・エラーは ' +
    cfg.contactDxTeam +
    ' または ' +
    cfg.contactPerson +
    '（' +
    cfg.contactEmail +
    '）までご連絡ください。\n\n' +
    'よろしくお願いいたします。'
  );
}

function buildTodoListRolloutHtml_(cfg) {
  const appUrl = escapeHtmlAttr_(cfg.appUrl);
  const guideUrl = escapeHtmlAttr_(cfg.guideUrl);
  const oldSheetUrl = escapeHtmlAttr_(cfg.oldSheetUrl);

  return (
    '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8" /></head>' +
    '<body style="margin:0;padding:0;background-color:#f2f2f7;font-family:\'Helvetica Neue\',Helvetica,\'Yu Gothic UI\',Meiryo,sans-serif;-webkit-font-smoothing:antialiased;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f2f2f7;">' +
    '<tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border:1px solid #e8e8ed;border-radius:12px;overflow:hidden;">' +

    /* Header */
    '<tr><td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:28px 24px;">' +
    '<p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;color:rgba(255,255,255,0.9);">DXチームからのお知らせ</p>' +
    '<h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.4;">To Do List</h1>' +
    '<p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.9);">' +
    escapeHtml_(cfg.launchDateLabel) +
    'より本番運用開始</p>' +
    '</td></tr>' +

    /* Body */
    '<tr><td style="padding:24px 24px 8px;">' +
    '<p style="margin:0 0 16px;font-size:14px;line-height:1.85;color:#334155;">お元気様です。</p>' +
    '<p style="margin:0 0 16px;font-size:14px;line-height:1.85;color:#334155;">' +
    '新 <strong style="color:#1e293b;">To Do List</strong> についてご案内いたします。' +
    '現在 <strong style="color:#4f46e5;">' +
    escapeHtml_(String(cfg.registeredCount)) +
    '名</strong> の方にご登録いただいております。ありがとうございます。' +
    '</p>' +
    '<p style="margin:0 0 16px;font-size:14px;line-height:1.85;color:#334155;">' +
    '本番運用は <strong style="color:#1e293b;">' +
    escapeHtml_(cfg.launchDateLabel) +
    '</strong> より開始いたします。<br>' +
    '今後の依頼の受け取り・配信は、<strong style="color:#1e293b;">新 To Do List</strong> をご利用ください。' +
    '</p>' +

    /* Old sheet notice */
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:10px;margin-bottom:16px;">' +
    '<tr><td style="padding:16px 18px;">' +
    '<p style="margin:0 0 10px;font-size:13px;line-height:1.75;color:#9a3412;">' +
    'こちらのTodoは <strong>' +
    escapeHtml_(cfg.oldSheetEndLabel) +
    'より使用不可</strong> になります。' +
    '</p>' +
    '<a href="' +
    oldSheetUrl +
    '" target="_blank" rel="noopener noreferrer" style="font-size:12px;line-height:1.6;color:#c2410c;word-break:break-all;">' +
    escapeHtml_(cfg.oldSheetUrl) +
    '</a>' +
    '</td></tr></table>' +

    /* Login box */
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;margin-bottom:16px;">' +
    '<tr><td style="padding:16px 18px;">' +
    '<p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#4338ca;">ログイン画面</p>' +
    '<p style="margin:0 0 14px;font-size:13px;line-height:1.7;color:#475569;">' +
    '社内メール（@okamoto-group.co.jp）でログインしてください。<br>' +
    '<strong style="color:#1e293b;">まだ登録されていない方</strong>は下記URLからご登録をお願いいたします。' +
    '</p>' +
    '<a href="' +
    appUrl +
    '" target="_blank" rel="noopener noreferrer" ' +
    'style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:11px 22px;border-radius:8px;">' +
    'To Do List を開く</a>' +
    '<p style="margin:12px 0 0;font-size:11px;line-height:1.6;color:#64748b;word-break:break-all;">' +
    escapeHtml_(cfg.appUrl) +
    '</p>' +
    '</td></tr></table>' +

    /* Guide box */
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:16px;">' +
    '<tr><td style="padding:16px 18px;">' +
    '<p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#334155;">使い方ガイド（動画付き）</p>' +
    '<p style="margin:0 0 14px;font-size:13px;line-height:1.7;color:#475569;">' +
    '操作方法は、こちらのガイドサイトをご参照ください。<br>' +
    'こちらのサイトは試験的なものですので、随時更新されます。' +
    '</p>' +
    '<a href="' +
    guideUrl +
    '" target="_blank" rel="noopener noreferrer" ' +
    'style="display:inline-block;background-color:#ffffff;color:#4f46e5;font-size:13px;font-weight:700;text-decoration:none;padding:10px 20px;border-radius:8px;border:1px solid #c7d2fe;">' +
    '使い方ガイドを見る</a>' +
    '<p style="margin:12px 0 0;font-size:11px;line-height:1.6;color:#64748b;word-break:break-all;">' +
    escapeHtml_(cfg.guideUrl) +
    '</p>' +
    '</td></tr></table>' +

    /* Support */
    '<p style="margin:0 0 16px;font-size:14px;line-height:1.85;color:#334155;">' +
    '操作中に<strong style="color:#1e293b;">不具合やエラー</strong>がありましたら、' +
    escapeHtml_(cfg.contactDxTeam) +
    ' または ' +
    escapeHtml_(cfg.contactPerson) +
    '（<a href="mailto:' +
    escapeHtmlAttr_(cfg.contactEmail) +
    '" style="color:#4f46e5;">' +
    escapeHtml_(cfg.contactEmail) +
    '</a>）までご連絡ください。' +
    '</p>' +
    '<p style="margin:0;font-size:14px;line-height:1.85;color:#334155;">よろしくお願いいたします。</p>' +
    '</td></tr>' +

    '</table>' +
    '<p style="margin:16px 0 0;font-size:11px;color:#94a3b8;text-align:center;">DXチームからのお知らせ</p>' +
    '</td></tr></table></body></html>'
  );
}

function notifyDone_(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (e) {
    // スクリプトエディタから直接実行した場合など UI が使えない
    Logger.log(message);
  }
}

function escapeHtml_(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeHtmlAttr_(s) {
  return escapeHtml_(s).replace(/'/g, '&#39;');
}
