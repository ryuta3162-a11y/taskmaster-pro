// --- デザイン用定数（スマホアプリ風・内容は従来どおり） ---
export const appCard = "bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-black/[0.05] p-5 md:p-6 transition-all w-full";
export const appInput = "bg-slate-100/90 border-0 rounded-xl px-4 py-3.5 font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--acc-500)]/35 transition-all w-full text-sm";
/** タイポグラフィ階層（index 全画面・admin.css と同じ 16/14/12/11px 想定） */
export const appText = {
  title: 'text-base font-bold text-slate-900 leading-snug',
  section: 'text-sm font-semibold text-[var(--acc-600)]',
  body: 'text-sm font-medium text-slate-700',
  meta: 'text-xs font-medium text-slate-500',
  caption: 'text-xs font-semibold text-slate-500',
  badge: 'text-xs font-bold',
  badgeNum: 'text-[11px] font-bold tabular-nums leading-none',
  tab: 'text-sm font-bold',
  btn: 'text-sm font-bold',
  /** 配信人数など、強調したい数字のみ */
  stat: 'text-2xl font-bold text-[var(--acc-600)] tabular-nums tracking-tight',
};
export const appLabel = `${appText.section} mb-3 block tracking-wide border-b border-slate-200/80 pb-2`;
/** リストチェック等のタスクカード（appCard と同じ枠・角丸） */
export const appTaskCard = `${appCard} flex flex-col xl:flex-row gap-4 xl:gap-5 w-full animate-fade-in`;
export const appTagPill = `${appText.badge} inline-flex items-center px-2.5 py-1 rounded-lg border border-black/[0.06]`;
export const appTagOnAccent = `${appText.badge} inline-flex items-center px-2.5 py-1 rounded-lg text-white shadow-sm`;
export const appSurfaceInset = 'rounded-xl border border-slate-200/80 bg-slate-50/90';
export const appDivider = 'border-t border-slate-200/80';
export const appFormSubmitRow = `${appDivider} pt-6 w-full mt-2`;
export const appBtnPrimary = `bg-[var(--acc-500)] text-white rounded-2xl shadow-lg shadow-[var(--acc-500)]/25 transition-all hover:bg-[var(--acc-600)] active:scale-[0.98] flex items-center justify-center gap-3 py-3.5 w-full ${appText.btn}`;
export const appBtnSecondary = `bg-white text-slate-700 rounded-2xl border border-black/[0.06] shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] flex items-center justify-center gap-2 py-3 ${appText.btn}`;
export const appLinkBtn = `${appBtnSecondary} w-full max-w-md py-3 gap-2`;
export const appLabelKind = `${appText.section} mb-4 block tracking-wide border-b border-slate-200/80 pb-2`;
export const appKindRadio = (on) =>
  `flex items-center gap-3 flex-1 p-4 rounded-xl border cursor-pointer transition-colors ${
    on ? 'border-[var(--acc-500)] bg-[var(--acc-50)] ring-1 ring-[var(--acc-200)]/40' : 'border-slate-200 bg-white hover:border-slate-300'
  }`;
export const appMenuTile = "w-full text-left bg-white rounded-2xl p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-black/[0.04] active:scale-[0.99] transition-all flex items-center gap-4";
/** ダッシュボード（ホーム）の4メニュー用・やや大きめ */
export const dashboardMenuTile = "w-full text-left bg-white rounded-2xl p-5 md:p-7 min-h-[5.25rem] md:min-h-[6.25rem] shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-black/[0.05] active:scale-[0.99] transition-all flex items-center gap-4 md:gap-5";
export const dashboardMenuIcon = "w-14 h-14 md:w-16 md:h-16 rounded-2xl shrink-0 flex items-center justify-center bg-[var(--acc-50)] text-[var(--acc-700)] [&>svg]:scale-100";
export const appSection = "relative rounded-2xl w-full overflow-hidden border border-[var(--acc-200)]/45 bg-white/95 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.08)] ring-1 ring-[var(--acc-100)]/40 p-5 md:p-6";
export const appMenuIcon = "w-12 h-12 rounded-xl shrink-0 flex items-center justify-center bg-[var(--acc-50)] text-[var(--acc-700)] [&>svg]:scale-[0.85]";
export const appChipBase = "inline-flex items-center justify-center min-h-[2.5rem] px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none text-center leading-snug";
export const appChipOn = "bg-gradient-to-br from-[var(--acc-500)] to-[var(--acc-700)] text-white shadow-md shadow-[var(--acc-500)]/30 ring-1 ring-white/25";
export const appChipOff = "bg-white/90 text-slate-700 border border-[var(--acc-200)]/60 hover:border-[var(--acc-400)] hover:bg-[var(--acc-50)]/60";
export const appChipArena = "rounded-xl border border-[var(--acc-200)]/45 bg-gradient-to-b from-slate-900/[0.03] via-white to-[var(--acc-50)]/25 p-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]";

// 既存クラス名との互換（置換漏れ防止）
export const brutalCard = appCard;
export const brutalInput = appInput;
export const brutalBtnPrimary = appBtnPrimary;
export const brutalBtnSecondary = appBtnSecondary;
