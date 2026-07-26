/** 新規登録は社内メールのみ（従業員データに既にある人はドメイン不問でログイン可） */
export const CORP_EMAIL_DOMAIN = '@okamoto-group.co.jp';
export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}
export function isCorpEmail(email) {
  return normalizeEmail(email).endsWith(CORP_EMAIL_DOMAIN);
}

// --- 入力規則データ（★ 役職を追加） ---
export const ROLES = ['GMG', 'A-SMG', 'SMG', 'TMG', 'CMG', 'CL', 'CF', 'IR'];
export const TEAMS = ['QSC＆監査', '原価低減 JOYFIT', '原価低減 FIT365', '販促', 'DX', 'PT', 'オプション', 'CS・ES', '競合対策', 'スタジオPG', 'リテンション', 'オープン・リニューアル', 'リスクアセスメント', 'ヨガ＆ピラティスチーム'];
/** 従業員データに旧名称が残っている場合の照合用 */
export const TEAM_LEGACY_ALIASES = { ニュービジネス: 'ヨガ＆ピラティスチーム' };
export const AREAS = ['第1エリア', '第2エリア', '第3エリア', '第4エリア', '第5エリア', '第6エリア', '第7エリア'];
/** 店舗エリア外の本部所属（店舗依頼の配信対象外・社員/TF依頼は対象） */
export const HQ_AREA = 'EAST本部';
export const HQ_STORE = 'EAST本部';

/** 従業員シートの管轄店舗上限（H列〜、GAS の EMPLOYEE_STORE_COL_MAX と一致） */
export const MAX_EMPLOYEE_STORES = 50;

/** 添付の合計件数（JPEG / PNG / PDF / ZIP を混在しても 1 件として数える） */
export const MAX_ATTACHMENTS = 3;

/**
 * PDF・ZIP 1 ファイルあたりの上限（バイト）。
 * 大きくするとブラウザ→GAS の転送失敗・タイムアウトのリスクは上がる（目安は 25MB 前後まで）。
 */
export const MAX_BINARY_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const MAX_PDF_BYTES = MAX_BINARY_ATTACHMENT_BYTES;
export const ACCEPT_IMAGES_AND_PDF = 'image/*,.pdf,application/pdf';
export const ACCEPT_ZIP = '.zip,application/zip,application/x-zip-compressed';

/** GAS・列「依頼単位」と一致: employee=社員 / store=店舗単位 / tf=TFチーム（個人完了） */
export const REQUEST_KIND = { employee: 'employee', store: 'store', tf: 'tf' };

export const REQUEST_KIND_LABEL = {
  [REQUEST_KIND.employee]: '社員依頼',
  [REQUEST_KIND.store]: '店舗依頼',
  [REQUEST_KIND.tf]: 'TFチーム依頼',
};
