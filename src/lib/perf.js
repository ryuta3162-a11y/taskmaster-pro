/** 起動時間の計測（?perf=1 のときだけ画面に表示。通常は記録のみ） */
const marks = {};
const listeners = new Set();

export const perfEnabled = () => typeof window !== 'undefined' && !!window.__TM_PERF__;

export function perfMark(key, extra) {
  if (typeof performance === 'undefined' || marks[key]) return;
  marks[key] = { at: Math.round(performance.now()), extra: extra || null };
  listeners.forEach((fn) => fn({ ...marks }));
}

export function perfTime(key, promise) {
  const start = typeof performance !== 'undefined' ? performance.now() : 0;
  return promise.then((v) => {
    perfMark(key, { ms: Math.round(performance.now() - start) });
    return v;
  });
}

export function subscribePerf(fn) {
  listeners.add(fn);
  fn({ ...marks });
  return () => listeners.delete(fn);
}
