/**
 * 紹介サイトの設定（動画URL・リンクはここだけ編集）
 *
 * 【おすすめ】サイト内 MP4（YouTube 不要）
 *   1. 収録した動画を docs/rollout/guide-site/videos/ に置く
 *   2. 各章の mp4 にパスを指定（例: "videos/checklist.mp4"）
 *   3. ページ上の再生ボタンをタップすると動画が流れます（全画面も可）
 *
 * 優先順位: mp4 → youtube → drive
 *
 * 本番前の動作確認だけしたい場合:
 *   useDemoWhenEmpty: true にすると、mp4 未設定の章にデモ用サンプル動画を表示します。
 */
window.GUIDE_CONFIG = {
  siteTitle: 'To Do List',
  launchDate: '',

  appUrl: 'https://script.google.com/a/okamoto-group.co.jp/macros/s/AKfycbyUmHnVEEJbuntAayPBu5zEe_4iRVDjtq8LOHQ5pURXRgEQYpLX324-3SMxeX9_NllAuw/exec',
  checklistUrl: 'https://script.google.com/a/okamoto-group.co.jp/macros/s/AKfycbyUmHnVEEJbuntAayPBu5zEe_4iRVDjtq8LOHQ5pURXRgEQYpLX324-3SMxeX9_NllAuw/exec?page=checklist',
  quizResultEndpoint: 'https://script.google.com/macros/s/AKfycbwiKoOOlJKon_2LRP7ppUVahIFfrzuhQt0aJ_1rIt7kBzbDcgBCtb5yqi56Ov0jtzieSA/exec',

  /** true = mp4 未設定の章にサンプル動画を表示（本番公開前に false 推奨） */
  useDemoWhenEmpty: false,

  /** useDemoWhenEmpty 用の短いサンプル（差し替え可） */
  demoMp4: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',

  videos: {
    register: {
      title: 'ログイン・初回登録',
      duration: '約30秒',
      mp4: 'videos/register.mp4',
      poster: 'images/register-poster.png',
      vtt: 'videos/register.vtt',
      youtube: '',
      drive: '',
    },
    request: {
      title: '新規投稿（To Do 申請）',
      duration: '約1分',
      mp4: 'videos/request.mp4',
      poster: 'images/request-poster.png',
      vtt: 'videos/request.vtt',
      youtube: '',
      drive: '',
    },
    repost: {
      title: '再投稿・リマインド',
      duration: '約30秒',
      mp4: 'videos/repost.mp4',
      poster: 'images/repost-poster.png',
      vtt: 'videos/repost.vtt',
      youtube: '',
      drive: '',
    },
    checklist: {
      title: 'リストチェック',
      duration: '約50秒',
      mp4: 'videos/checklist.mp4',
      poster: 'images/checklist-poster.png',
      vtt: 'videos/checklist.vtt',
      youtube: '',
      drive: '',
    },
    // progress.mp4 未配置のため動画枠は出さない（本文のみ）
  },
};
