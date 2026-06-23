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
  siteTitle: 'To Do List 活用ガイド',
  launchDate: '2025年7月1日',

  appUrl: '',
  checklistUrl: '',

  contactLabel: 'お問い合わせ',
  contactEmail: '',

  /** true = mp4 未設定の章にサンプル動画を表示（本番公開前に false 推奨） */
  useDemoWhenEmpty: true,

  /** useDemoWhenEmpty 用の短いサンプル（差し替え可） */
  demoMp4: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',

  videos: {
    overview: {
      title: '全体の流れ（はじめに）',
      duration: '約3分',
      mp4: '', // 例: 'videos/overview.mp4'
      poster: '', // 任意: 'videos/overview-poster.jpg'
      youtube: '',
      drive: '',
    },
    register: {
      title: 'ログイン・初回登録',
      duration: '約2分',
      mp4: 'videos/register.mp4',
      poster: '',
      youtube: '',
      drive: '',
    },
    request: {
      title: '新規投稿（To Do 申請）',
      duration: '約4分',
      mp4: 'videos/request.mp4',
      poster: '',
      youtube: '',
      drive: '',
    },
    repost: {
      title: '再投稿',
      duration: '約2分',
      mp4: '',
      poster: '',
      youtube: '',
      drive: '',
    },
    scheduled: {
      title: '定期配信',
      duration: '約3分',
      mp4: '',
      poster: '',
      youtube: '',
      drive: '',
    },
    checklist: {
      title: 'リストチェック',
      duration: '約4分',
      mp4: 'videos/checklist.mp4',
      poster: '',
      youtube: '',
      drive: '',
    },
    progress: {
      title: 'チーム進捗管理ダッシュボード',
      duration: '約2分',
      mp4: '',
      poster: '',
      youtube: '',
      drive: '',
    },
    admin: {
      title: '進捗管理admin（管理者向け）',
      duration: '約2分',
      mp4: '',
      poster: '',
      youtube: '',
      drive: '',
    },
  },
};
