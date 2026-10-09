/**
 * ヘルプセンターの設定（URL・問い合わせ先はここだけ編集）
 */
window.GUIDE_CONFIG = {
  siteTitle: 'To Do List ヘルプセンター',
  updatedAt: '2026年9月30日',

  appUrl: 'https://script.google.com/a/okamoto-group.co.jp/macros/s/AKfycbyUmHnVEEJbuntAayPBu5zEe_4iRVDjtq8LOHQ5pURXRgEQYpLX324-3SMxeX9_NllAuw/exec',
  checklistUrl: 'https://script.google.com/a/okamoto-group.co.jp/macros/s/AKfycbyUmHnVEEJbuntAayPBu5zEe_4iRVDjtq8LOHQ5pURXRgEQYpLX324-3SMxeX9_NllAuw/exec?page=checklist',

  /** 理解度チェックの採点・記録（別GAS。正解は GAS 側 correctAnswers で判定） */
  quizResultEndpoint: 'https://script.google.com/macros/s/AKfycbwiKoOOlJKon_2LRP7ppUVahIFfrzuhQt0aJ_1rIt7kBzbDcgBCtb5yqi56Ov0jtzieSA/exec',

  /** 理解度チェック Vol.2 の採点・記録（quiz2-results-gas。正解は GAS の correctAnswers） */
  quiz2ResultEndpoint: 'https://script.google.com/macros/s/AKfycbwMrT4gtAl7snuPExS-2KNwBrnB5NetHhIIy64E21Gl2UC03bOAcijr64HHAQevh8M-4A/exec',

  contactLabel: 'DXチーム（日下）',
  senderEmail: 'r-kusaka@okamoto-group.co.jp',
};
