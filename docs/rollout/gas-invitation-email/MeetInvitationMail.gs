/**
 * テストラン案内メール → Gmail 下書きを自動作成
 *
 * 1. INVITE_CONFIG を編集
 * 2. createMeetInvitationDraft を実行
 * 3. Gmail の下書き → 宛先を入れて送信
 */

/** ========== ここだけ編集 ========== */
const INVITE_CONFIG = {
  subject: '【ご案内】新 To-Do List テストラン（5月・Google Meet）',
  signatureName: '日下 竜太',
  signatureContact: 'r-kusaka@okamoto-group.co.jp',
  slots: [
    {
      id: 'A',
      label: '5月21日（木） 15:00〜16:00',
      meetUrl: 'https://meet.google.com/pmm-guay-vhm',
    },
    {
      id: 'B',
      label: '5月21日（木） 18:00〜19:00',
      meetUrl: 'https://meet.google.com/mxp-spmo-obk',
    },
    {
      id: 'C',
      label: '5月24日（日） 15:00〜16:00',
      meetUrl: 'https://meet.google.com/duw-srup-eaa',
    },
    {
      id: 'D',
      label: '5月28日（木） 16:00〜17:00',
      meetUrl: 'https://meet.google.com/qgp-mtpz-rap',
    },
  ],
};
/** ================================= */

function createMeetInvitationDraft() {
  const html = buildMeetInvitationHtml_(INVITE_CONFIG);
  const plain = '新 To-Do List テストランのご案内です。';

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
      const paddingBottom = i === cfg.slots.length - 1 ? '24px' : '12px';
      return (
        '<tr><td style="background-color:#ffffff;padding:0 28px ' +
        paddingBottom +
        ';border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0;border-radius:16px;">' +
        '<tr>' +
        '<td style="background-color:#f8fafc;padding:16px;width:56px;text-align:center;border-right:1px solid #e2e8f0;">' +
        '<p style="margin:0;font-size:20px;font-weight:800;color:#4f46e5;">' +
        escapeHtml_(slot.id) +
        '</p></td>' +
        '<td style="padding:16px 18px;">' +
        '<p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">' +
        escapeHtml_(slot.label) +
        '</p>' +
        '<a href="' +
        escapeHtmlAttr_(slot.meetUrl) +
        '" target="_blank" rel="noopener noreferrer" ' +
        'style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:11px 22px;border-radius:10px;">' +
        '参加する →</a>' +
        '</td></tr></table></td></tr>'
      );
    })
    .join('');

  return (
    '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8" /></head>' +
    '<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:\'Yu Gothic UI\',Meiryo,sans-serif;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f1f5f9;">' +
    '<tr><td align="center" style="padding:24px 12px 40px;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;">' +
    '<tr><td style="background:linear-gradient(135deg,#4f46e5,#6366f1);border-radius:16px 16px 0 0;padding:28px 24px;text-align:center;">' +
    '<h1 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#fff;">新 To-Do List</h1>' +
    '<p style="margin:0;font-size:16px;font-weight:700;color:rgba(255,255,255,0.95);">テストラン</p>' +
    '</td></tr>' +
    '<tr><td style="background:#fff;padding:24px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">' +
    '<p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#334155;">お元気様です。<br />日下より、新 To-Do List のご案内です。</p>' +
    '<p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#334155;">6月中の本番リリースを予定しており、テストランへのご協力をお願いいたします。</p>' +
    '<p style="margin:0 0 20px;font-size:15px;line-height:1.75;color:#334155;">当日は Google Meet で、テスト URL を用いて操作いただきます。ご都合のよい日程を選んでいただければ大丈夫です。見ているだけの参加でも構いません。ぜひお気軽にご参加ください。</p>' +
    '<p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#0f172a;text-align:center;">ご都合のよい日程をお選びください（' +
    cfg.slots.length +
    '択）</p>' +
    '</td></tr>' +
    slotBlocks +
    '<tr><td style="background:#fff;padding:0 24px 24px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-radius:0 0 16px 16px;">' +
    '<p style="margin:20px 0 0;font-size:14px;color:#0f172a;">' +
    escapeHtml_(cfg.signatureName) +
    '<br /><span style="color:#64748b;">' +
    escapeHtml_(cfg.signatureContact) +
    '</span></p></td></tr>' +
    '<tr><td style="padding:16px;text-align:center;">' +
    '<p style="margin:0;font-size:11px;color:#94a3b8;">本メールは新 To-Do List テストランに関するご案内です。</p>' +
    '</td></tr></table></td></tr></table></body></html>'
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
