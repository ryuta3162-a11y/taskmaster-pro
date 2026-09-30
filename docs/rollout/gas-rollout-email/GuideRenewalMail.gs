/**
 * To Do List ヘルプセンター（使い方ガイド）リニューアルのお知らせ
 *
 * createGuideRenewalDraft を実行すると、Gmail に下書きが1件できます。
 * 宛先は To Do List の「従業員データ」に登録されている全員（Bcc）。店舗の共用アドレス（jf-）は除きます。
 * 送信はしません。Gmail の下書きで内容を確認してから送信してください。
 */

const GUIDE_RENEWAL_CONFIG = {
  subject: '【To Do List】使い方ガイドを新しくしました',
  guideUrl: 'https://todo-list-guide.vercel.app/',
  quizUrl: 'https://todo-list-guide.vercel.app/quiz',
  appUrl:
    'https://script.google.com/a/okamoto-group.co.jp/macros/s/AKfycbyUmHnVEEJbuntAayPBu5zEe_4iRVDjtq8LOHQ5pURXRgEQYpLX324-3SMxeX9_NllAuw/exec',
  employeeSpreadsheetId: '1-ww_0rDYxmA6Mlrl1GUJtG_agE2z760cdvQ7oMIQqkc',
  employeeSheetName: '従業員データ',
  contactDxTeam: 'DXチーム',
  contactPerson: '日下 竜太',
  contactEmail: 'r-kusaka@okamoto-group.co.jp',
};

function createGuideRenewalDraft() {
  const cfg = GUIDE_RENEWAL_CONFIG;
  const bcc = getGuideRenewalRecipients_(cfg);
  if (!bcc.length) throw new Error('従業員データからメールアドレスを読み取れませんでした。');

  GmailApp.createDraft(cfg.contactEmail, cfg.subject, buildGuideRenewalPlain_(cfg), {
    htmlBody: buildGuideRenewalHtml_(cfg),
    bcc: bcc.join(','),
  });
  Logger.log('下書きを作成しました。Bcc: ' + bcc.length + '名');
}

function getGuideRenewalRecipients_(cfg) {
  const sheet = SpreadsheetApp.openById(cfg.employeeSpreadsheetId).getSheetByName(cfg.employeeSheetName);
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const seen = {};
  const list = [];
  sheet.getRange(2, 2, last - 1, 1).getValues().forEach(function (r) {
    const email = String(r[0] || '').trim().toLowerCase();
    if (!email || email.indexOf('@okamoto-group.co.jp') < 0) return;
    if (email.split('@')[0].indexOf('jf-') === 0) return;
    if (email === cfg.contactEmail || seen[email]) return;
    seen[email] = true;
    list.push(email);
  });
  return list;
}

function buildGuideRenewalPlain_(cfg) {
  return [
    'お元気様です。DXチームです。',
    '',
    'To Do List の使い方ガイドを新しくしました。',
    '困ったことをキーワードで検索すると、答えがすぐ見つかります。',
    '',
    '■ 使い方ガイド',
    cfg.guideUrl,
    '',
    '例えばこんなときに',
    '・完了を間違えて押してしまった',
    '・管轄店舗を変えたい',
    '・まだの人だけに催促したい',
    '・Gmail で To Do List のメールにラベルを付けたい',
    '',
    '■ 理解度チェック（対象の方のみ・約2分）',
    cfg.quizUrl,
    '',
    '■ To Do List',
    cfg.appUrl,
    '',
    'ご不明点は ' + cfg.contactDxTeam + ' または ' + cfg.contactPerson + '（' + cfg.contactEmail + '）までご連絡ください。',
    '',
    'よろしくお願いいたします。',
  ].join('\n');
}

function buildGuideRenewalHtml_(cfg) {
  const p = 'margin:0 0 14px;font-size:14px;line-height:1.85;color:#334155;';
  const btn = function (url, label, primary) {
    return '<a href="' + escGuide_(url) + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;' +
      (primary ? 'background-color:#4f46e5;color:#ffffff;' : 'background-color:#ffffff;color:#4f46e5;border:1px solid #c7d2fe;') +
      'font-size:13px;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:8px;margin:0 8px 8px 0;">' + label + '</a>';
  };
  const examples = ['完了を間違えて押してしまった', '管轄店舗を変えたい', 'まだの人だけに催促したい', 'Gmail で To Do List のメールにラベルを付けたい']
    .map(function (t) { return '<li style="margin:2px 0;">' + t + '</li>'; }).join('');

  return (
    '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8" /></head>' +
    '<body style="margin:0;padding:0;background-color:#f2f2f7;font-family:\'Helvetica Neue\',Helvetica,\'Yu Gothic UI\',Meiryo,sans-serif;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f2f2f7;"><tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;background-color:#ffffff;border:1px solid #e8e8ed;border-radius:12px;overflow:hidden;">' +
    '<tr><td style="background-color:#312e81;padding:24px 22px;">' +
    '<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.06em;color:rgba(255,255,255,0.85);">DXチームからのお知らせ</p>' +
    '<h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.4;">使い方ガイドを新しくしました</h1>' +
    '</td></tr>' +
    '<tr><td style="padding:22px 22px 8px;">' +
    '<p style="' + p + '">お元気様です。DXチームです。</p>' +
    '<p style="' + p + '">To Do List の使い方ガイドを新しくしました。<br>困ったことを<strong style="color:#1e293b;">キーワードで検索</strong>すると、答えがすぐ見つかります。</p>' +
    '<p style="margin:0 0 18px;">' + btn(cfg.guideUrl, '使い方ガイドを開く', true) + '</p>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;margin-bottom:18px;"><tr><td style="padding:14px 18px;">' +
    '<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#312e81;">例えばこんなときに</p>' +
    '<ul style="margin:0;padding-left:1.2em;font-size:13px;line-height:1.7;color:#475569;">' + examples + '</ul>' +
    '</td></tr></table>' +
    '<p style="margin:0 0 8px;font-size:13px;line-height:1.75;color:#475569;">対象の方は、理解度チェック（約2分）へのご回答もお願いします。</p>' +
    '<p style="margin:0 0 18px;">' + btn(cfg.quizUrl, '理解度チェック', false) + btn(cfg.appUrl, 'To Do List を開く', false) + '</p>' +
    '<p style="' + p + '">ご不明点は ' + escGuide_(cfg.contactDxTeam) + ' または ' + escGuide_(cfg.contactPerson) +
    '（<a href="mailto:' + escGuide_(cfg.contactEmail) + '" style="color:#4f46e5;">' + escGuide_(cfg.contactEmail) + '</a>）までご連絡ください。</p>' +
    '<p style="margin:0 0 14px;font-size:14px;line-height:1.85;color:#334155;">よろしくお願いいたします。</p>' +
    '</td></tr></table>' +
    '<p style="margin:16px 0 0;font-size:11px;color:#94a3b8;text-align:center;">DXチームからのお知らせ</p>' +
    '</td></tr></table></body></html>'
  );
}

function escGuide_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
