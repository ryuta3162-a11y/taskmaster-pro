/**
 * To Do List 未登録者向け — 登録依頼メール
 *
 * 1. REGISTRATION_REMINDER_CONFIG を確認
 * 2. createRegistrationReminderDraft を実行
 * 3. Gmail の下書きを確認して送信
 */

/** ========== ここだけ編集 ========== */
const REGISTRATION_REMINDER_CONFIG = {
  subject: '【To Do List】ご登録のお願い（7月1日本番運用）',

  launchDateLabel: '7月1日',

  appUrl:
    'https://script.google.com/a/okamoto-group.co.jp/macros/s/AKfycbyUmHnVEEJbuntAayPBu5zEe_4iRVDjtq8LOHQ5pURXRgEQYpLX324-3SMxeX9_NllAuw/exec',

  guideUrl: 'https://todo-list-guide.vercel.app/',

  contactDxTeam: 'DXチーム',
  contactPerson: '日下 竜太',
  contactEmail: 'r-kusaka@okamoto-group.co.jp',

  /** CC（メンバーへの共有用） */
  ccRecipients: [
    { name: '笠原', email: 'h-kasahara@okamoto-group.co.jp' },
    { name: '後藤智哉', email: 't-goto@okamoto-group.co.jp' },
    { name: '初谷和帆', email: 'k-hatsugai@okamoto-group.co.jp' },
    { name: '渡邊将樹', email: 'masaki-watanabe@okamoto-group.co.jp' },
  ],

  /** 未登録の方（To に一括） */
  recipients: [
    { name: '奥村凜花', email: 'r-okumura@okamoto-group.co.jp' },
    { name: '久高勝巳', email: 'k-kudaka@okamoto-group.co.jp' },
    { name: '小林千夏', email: 'chi-kobayashi@okamoto-group.co.jp' },
    { name: '小暮宏武', email: 'h-kogure@okamoto-group.co.jp' },
    { name: '安井悠太', email: 'y-yasui@okamoto-group.co.jp' },
    { name: '鈴木洋介', email: 'yousuke-suzuki@okamoto-group.co.jp' },
    { name: '秩父瀧', email: 'r-chichibu@okamoto-group.co.jp' },
    { name: '髙木直輝', email: 'n-takagi@okamoto-group.co.jp' },
    { name: '鈴木貴秀', email: 'takahide-suzuki@okamoto-group.co.jp' },
    { name: '小嶋道', email: 'w-kojima@okamoto-group.co.jp' },
    { name: '飯塚陸王', email: 'r-iizuka@okamoto-group.co.jp' },
    { name: '長利雅也', email: 'm-osari@okamoto-group.co.jp' },
  ],
};
/** ================================= */

/** Gmail に下書き1件（To: 未登録者全員 / CC: メンバー） */
function createRegistrationReminderDraft() {
  const cfg = REGISTRATION_REMINDER_CONFIG;
  const html = buildRegistrationReminderHtml_(cfg);
  const plain = buildRegistrationReminderPlain_(cfg);
  const to = getRecipientEmails_(cfg);
  const cc = getCcString_(cfg);

  const options = { htmlBody: html };
  if (cc) options.cc = cc;

  GmailApp.createDraft(to, cfg.subject, plain, options);

  notifyDone_(
    'Gmail の下書きを1件作成しました。\n' +
      'To: ' +
      cfg.recipients.length +
      '名 / CC: ' +
      cfg.ccRecipients.length +
      '名\n内容を確認して送信してください。'
  );
}

function getRecipientEmails_(cfg) {
  return cfg.recipients
    .map(function (r) {
      return String(r.email || '').trim();
    })
    .filter(function (email) {
      return email && email.indexOf('@') >= 0;
    })
    .join(',');
}

function getCcString_(cfg) {
  if (!cfg.ccRecipients || !cfg.ccRecipients.length) return '';
  return cfg.ccRecipients
    .map(function (r) {
      return String(r.email || '').trim();
    })
    .filter(function (email) {
      return email && email.indexOf('@') >= 0;
    })
    .join(',');
}

function buildRegistrationReminderPlain_(cfg) {
  return (
    'DXチームからのお知らせ\n\n' +
    'To Do List — ご登録のお願い\n\n' +
    'お元気様です。\n\n' +
    '新 To Do List は' +
    cfg.launchDateLabel +
    'より本番運用を開始します。\n' +
    'お手元の登録状況を確認したところ、まだご登録がお済みでないようです。\n' +
    'お忙しいところ恐れ入りますが、下記URLよりご登録をお願いいたします。\n\n' +
    '社内メール（@okamoto-group.co.jp）でログインしてください。\n\n' +
    cfg.appUrl +
    '\n\n' +
    '使い方ガイド: ' +
    cfg.guideUrl +
    '\n\n' +
    'ご不明点は ' +
    cfg.contactDxTeam +
    ' または ' +
    cfg.contactPerson +
    '（' +
    cfg.contactEmail +
    '）までご連絡ください。\n\n' +
    'よろしくお願いいたします。'
  );
}

function buildRegistrationReminderHtml_(cfg) {
  const appUrl = escapeHtmlAttr_(cfg.appUrl);
  const guideUrl = escapeHtmlAttr_(cfg.guideUrl);

  return (
    '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8" /></head>' +
    '<body style="margin:0;padding:0;background-color:#f2f2f7;font-family:\'Helvetica Neue\',Helvetica,\'Yu Gothic UI\',Meiryo,sans-serif;-webkit-font-smoothing:antialiased;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f2f2f7;">' +
    '<tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;background-color:#ffffff;border:1px solid #e8e8ed;border-radius:12px;overflow:hidden;">' +

    '<tr><td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:24px 22px;">' +
    '<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.06em;color:rgba(255,255,255,0.9);">DXチームからのお知らせ</p>' +
    '<h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.4;">To Do List</h1>' +
    '<p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.9);">ご登録のお願い</p>' +
    '</td></tr>' +

    '<tr><td style="padding:22px 22px 8px;">' +
    '<p style="margin:0 0 14px;font-size:14px;line-height:1.85;color:#334155;">お元気様です。</p>' +
    '<p style="margin:0 0 14px;font-size:14px;line-height:1.85;color:#334155;">' +
    '新 <strong style="color:#1e293b;">To Do List</strong> は <strong>' +
    escapeHtml_(cfg.launchDateLabel) +
    '</strong> より本番運用を開始します。' +
    '</p>' +
    '<p style="margin:0 0 18px;font-size:14px;line-height:1.85;color:#334155;">' +
    '登録状況を確認したところ、まだご登録がお済みでないようです。<br>' +
    'お忙しいところ恐れ入りますが、下記よりご登録をお願いいたします。' +
    '</p>' +

    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;margin-bottom:14px;">' +
    '<tr><td style="padding:16px 18px;">' +
    '<p style="margin:0 0 12px;font-size:13px;line-height:1.7;color:#475569;">' +
    '社内メール（@okamoto-group.co.jp）でログインしてください。' +
    '</p>' +
    '<a href="' +
    appUrl +
    '" target="_blank" rel="noopener noreferrer" ' +
    'style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:11px 22px;border-radius:8px;">' +
    'To Do List を開く（登録）</a>' +
    '<p style="margin:12px 0 0;font-size:11px;line-height:1.6;color:#64748b;word-break:break-all;">' +
    escapeHtml_(cfg.appUrl) +
    '</p>' +
    '</td></tr></table>' +

    '<p style="margin:0 0 16px;font-size:13px;line-height:1.75;color:#475569;">' +
    '操作方法は <a href="' +
    guideUrl +
    '" target="_blank" rel="noopener noreferrer" style="color:#4f46e5;">使い方ガイド</a> をご参照ください。' +
    '</p>' +

    '<p style="margin:0 0 14px;font-size:14px;line-height:1.85;color:#334155;">' +
    'ご不明点は ' +
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
