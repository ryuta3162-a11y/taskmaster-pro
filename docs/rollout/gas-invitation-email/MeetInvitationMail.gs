/**
 * テストラン案内メール → Gmail 下書きを自動作成
 *
 * 1. INVITE_CONFIG を編集
 * 2. createMeetInvitationDraft を実行
 * 3. Gmail の下書き → 宛先を入れて送信
 */

/** ========== ここだけ編集 ========== */
const INVITE_CONFIG = {
  subject: '【ご案内】新 To-Do List 操作体験（Google Meet）',
  signatureName: '日下 竜太',
  signatureContact: 'r-kusaka@okamoto-group.co.jp',
  slots: [
    {
      id: 'A',
      label: '5月22日（金） 15:00〜16:00',
      meetUrl: 'https://meet.google.com/dtv-jvfz-cwf',
    },
    {
      id: 'B',
      label: '5月24日（日） 15:00〜16:00',
      meetUrl: 'https://meet.google.com/smg-iwuv-ajj',
    },
    {
      id: 'C',
      label: '5月25日（月） 18:00〜19:00',
      meetUrl: 'https://meet.google.com/edc-dkcm-gzb',
    },
  ],
};
/** ================================= */

function createMeetInvitationDraft() {
  const html = buildMeetInvitationHtml_(INVITE_CONFIG);
  const plain = '新 To-Do List 操作体験のご案内です。';

  GmailApp.createDraft('', INVITE_CONFIG.subject, plain, { htmlBody: html });

  const ui = SpreadsheetApp.getUi();
  if (ui) {
    ui.alert('Gmail の下書きを作成しました。');
  }
}

function onOpenMeetInvitationMenu() {
  SpreadsheetApp.getUi()
    .createMenu('案内メール')
    .addItem('説明会メールを下書き作成', 'createMeetInvitationDraft')
    .addToUi();
}

function buildMeetInvitationHtml_(cfg) {
  const slotBlocks = cfg.slots
    .map(function (slot, i) {
      const borderTop = i === 0 ? '' : 'border-top:1px solid #e5e5e5;';
      return (
        '<tr><td style="padding:20px 0;' +
        borderTop +
        '">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
        '<tr>' +
        '<td style="width:40px;vertical-align:top;padding-top:2px;">' +
        '<p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.12em;color:#a3a3a3;">' +
        escapeHtml_(slot.id) +
        '</p></td>' +
        '<td style="vertical-align:top;">' +
        '<p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#171717;letter-spacing:0.02em;">' +
        escapeHtml_(slot.label) +
        '</p>' +
        '<a href="' +
        escapeHtmlAttr_(slot.meetUrl) +
        '" target="_blank" rel="noopener noreferrer" ' +
        'style="display:inline-block;background-color:#171717;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:2px;letter-spacing:0.04em;">' +
        '参加する</a>' +
        '</td></tr></table></td></tr>'
      );
    })
    .join('');

  return (
    '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8" /></head>' +
    '<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:\'Helvetica Neue\',Helvetica,\'Yu Gothic UI\',Meiryo,sans-serif;-webkit-font-smoothing:antialiased;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;">' +
    '<tr><td align="center" style="padding:40px 16px;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;background-color:#ffffff;border:1px solid #e5e5e5;">' +
    '<tr><td style="background-color:#171717;padding:32px 28px;">' +
    '<h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:0.02em;line-height:1.45;">新 To-Do List</h1>' +
    '<p style="margin:10px 0 0;font-size:14px;font-weight:400;color:#d4d4d4;letter-spacing:0.04em;">操作体験のご案内</p>' +
    '</td></tr>' +
    '<tr><td style="padding:28px 28px 8px;">' +
    '<p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#525252;">お元気様です。</p>' +
    '<p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#525252;">6月中の本番リリースに向け、新 To-Do List の<strong style="color:#171717;">お試し操作</strong>へのご協力をお願いいたします。現在お使いの To-Do リストに関する不満や、追加のご要望をお聞きするために実施しております。ぜひお気軽にご参加ください。</p>' +
    '<p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#525252;">当日は Google Meet にて、サンプルを実際に触りながら操作方法をご説明します。ご都合のよい日程をお選びください。見ているだけのご参加でも構いません。</p>' +
    '<p style="margin:0;font-size:13px;line-height:1.75;color:#737373;">※ 開始から5分を過ぎても参加者がおられない場合は、日程を変更させていただくことがあります。</p>' +
    '</td></tr>' +
    '<tr><td style="padding:8px 28px 28px;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
    slotBlocks +
    '</table></td></tr>' +
    '<tr><td style="padding:0 28px 28px;border-top:1px solid #e5e5e5;">' +
    '<p style="margin:20px 0 12px;font-size:14px;line-height:1.7;color:#525252;">よろしくお願いいたします。</p>' +
    '<p style="margin:0;font-size:13px;color:#171717;">' +
    escapeHtml_(cfg.signatureName) +
    '</p>' +
    '<p style="margin:4px 0 0;font-size:12px;color:#a3a3a3;">' +
    escapeHtml_(cfg.signatureContact) +
    '</p></td></tr>' +
    '</table>' +
    '<p style="margin:20px 0 0;font-size:11px;color:#a3a3a3;text-align:center;">新 To-Do List 操作体験に関するご案内</p>' +
    '</td></tr></table></body></html>'
  );
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
