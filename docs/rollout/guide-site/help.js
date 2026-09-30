(function () {
  'use strict';

  var cfg = window.GUIDE_CONFIG || {};

  /** 旧マニュアルのリンク（#register など）を新しい質問へ */
  var LEGACY_HASH = {
    register: 'q-login',
    checklist: 'q-where',
    request: 'q-how-to-request',
    'mail-notify': 'q-mails',
    'gmail-label': 'q-gmail-label',
    repost: 'q-which',
    progress: 'q-progress-open',
    logout: 'q-change-profile',
    quiz: 'top',
    'q-what': 'top',
    'q-store-mail': 'q-login',
    'q-filter-store': 'q-where',
    'q-search-done': 'q-where',
    'q-card': 'q-where',
    'q-deadline': 'q-how-to-request',
    'q-who-not-done': 'q-remind',
    'q-auto-remind': 'q-mails',
    'q-my-profile': 'q-change-profile',
    'q-accent': 'q-change-profile',
    'q-progress-what': 'q-progress-open',
    'q-glossary': 'top',
    'c-progress': 'q-progress-open',
    'c-glossary': 'top',
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function copyText(text, button) {
    function done() {
      if (!button) return;
      var label = button.textContent;
      button.textContent = 'コピーしました';
      button.classList.add('is-done');
      setTimeout(function () {
        button.textContent = label;
        button.classList.remove('is-done');
      }, 1600);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else {
      fallback();
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { window.prompt('コピーしてください', text); }
      document.body.removeChild(ta);
    }
  }

  // ---------- 設定値の反映 ----------
  function applyConfig() {
    $all('[data-app-link]').forEach(function (a) { if (cfg.appUrl) a.href = cfg.appUrl; });
    $all('[data-checklist-link]').forEach(function (a) {
      if (!cfg.checklistUrl) return;
      a.href = cfg.checklistUrl;
      a.textContent = cfg.checklistUrl;
    });
    $all('[data-contact]').forEach(function (el) { if (cfg.contactLabel) el.textContent = cfg.contactLabel; });
    $all('[data-sender-email]').forEach(function (el) { if (cfg.senderEmail) el.textContent = cfg.senderEmail; });
    $all('[data-updated]').forEach(function (el) { el.textContent = cfg.updatedAt || ''; });
  }

  // ---------- Q&A の補助（リンクコピー・表のラベル） ----------
  function enhanceQa() {
    $all('.qa').forEach(function (qa) {
      var answer = $('.answer', qa);
      if (!answer || !qa.id) return;
      var foot = document.createElement('div');
      foot.className = 'answer-foot';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-copy';
      btn.textContent = 'この質問のリンクをコピー';
      btn.addEventListener('click', function () {
        copyText(location.origin + location.pathname + '#' + qa.id, btn);
      });
      foot.appendChild(btn);
      answer.appendChild(foot);
      qa.addEventListener('toggle', function () {
        if (qa.open && history.replaceState) history.replaceState(null, '', '#' + qa.id);
      });
    });

    $all('.table-compare').forEach(function (table) {
      var heads = $all('thead th', table).map(function (th) { return th.textContent.trim(); });
      $all('tbody tr', table).forEach(function (tr) {
        $all('td', tr).forEach(function (td, i) { td.setAttribute('data-label', heads[i + 1] || ''); });
      });
    });

    $all('.cat').forEach(function (cat) {
      var n = $all('.qa', cat).length;
      var el = $('[data-count-for="' + cat.id + '"]');
      if (el) el.textContent = n + '件の質問';
    });
  }

  // ---------- 検索 ----------
  function norm(s) {
    s = String(s || '');
    if (s.normalize) s = s.normalize('NFKC');
    s = s.toLowerCase().replace(/[\u3041-\u3096]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) + 0x60);
    });
    return s.replace(/[\s\u3000・「」『』（）()【】、。,.!?！？:：〜~]/g, '');
  }

  /** 言い換え（左の語が入力されたら右の語でも探す） */
  var SYNONYMS = {
    '開かない': ['開けない', '表示されない', 'エラー'],
    '見れない': ['開けない', '表示されない'],
    '見られない': ['開けない', '表示されない'],
    '使えない': ['開けない', 'エラー'],
    '入れない': ['ログイン', '開けない'],
    '来ない': ['届かない'],
    '届かない': ['来ない', '表示されない'],
    '出てこない': ['表示されない'],
    '消したい': ['取り消し'],
    '消す': ['取り消し'],
    '戻したい': ['取り消し', '戻す'],
    '戻す': ['取り消し'],
    'ミス': ['間違えた', '誤って'],
    '間違い': ['間違えた', '修正'],
    '変えたい': ['変更'],
    'かえたい': ['変更'],
    'はずしたい': ['外す'],
    '変える': ['変更'],
    '直したい': ['修正'],
    '追加': ['増やす', '変更'],
    '増やしたい': ['増やす'],
    '減らしたい': ['減らす'],
    '異動': ['変更', '担当が変わった'],
    '催促': ['リマインド'],
    '督促': ['リマインド'],
    '締め切り': ['期限'],
    '締切': ['期限'],
    '〆切': ['期限'],
    'dl': ['期限'],
    '送りたい': ['依頼を出す', '新規投稿'],
    'お願い': ['依頼'],
    'やり方': ['しかた', '方法'],
    '方法': ['しかた'],
    '写真': ['画像', '添付'],
    'ファイル': ['添付'],
    'フィルター': ['フィルタ'],
    '迷惑': ['迷惑メール'],
    'スマートフォン': ['スマホ'],
    'アイフォン': ['iPhone'],
    '遅い': ['時間がかかる'],
    '固まる': ['時間がかかる', '重い'],
    '進捗': ['ダッシュボード', '未完了'],
  };

  /** 入力された語の末尾を落として語幹にする（「届かない」→「届か」など） */
  var ENDINGS = ['できません', 'できない', 'られない', 'されない', 'したいです', 'したい', 'ません', 'ない', 'たい', 'です', 'ます', 'には', 'とは', 'のしかた', 'のやり方', 'のかた', 'かた', 'は', 'が', 'を', 'に', 'で', 'の', 'と', 'も', 'へ'];
  var ENDINGS_N = ENDINGS.map(norm);

  function stemOf(t) {
    var cur = t;
    for (var round = 0; round < 2; round++) {
      for (var i = 0; i < ENDINGS_N.length; i++) {
        var e = ENDINGS_N[i];
        if (cur.length > e.length + 1 && cur.slice(-e.length) === e) {
          cur = cur.slice(0, -e.length);
          break;
        }
      }
    }
    return cur === t ? '' : cur;
  }

  /** 「メールが届かない」のような文を「メール」「届かない」に分ける */
  function splitQuery(q) {
    var parts = [];
    q.split(/[\s\u3000、,]+/).forEach(function (w) {
      if (!w) return;
      w.split(/(?:が|を|は|に|で|と|へ|も|の)(?=[^\u3041-\u3096])/).forEach(function (p) {
        var sub = /^[\u3041-\u3096ー]{6,}$/.test(p) ? p.split(/(?<=[\u3041-\u3096ー]{2})[をが](?=[\u3041-\u3096ー]{2})/) : [p];
        sub.forEach(function (x) { if (norm(x)) parts.push(x); });
      });
    });
    return parts;
  }

  function variantsOf(word) {
    var n = norm(word);
    var list = [{ t: n, w: 1 }];
    var stem = stemOf(n);
    if (stem) list.push({ t: stem, w: 0.5 });
    Object.keys(SYNONYMS).forEach(function (k) {
      var kn = norm(k);
      if (n.indexOf(kn) >= 0) SYNONYMS[k].forEach(function (s) { list.push({ t: norm(s), w: 0.6 }); });
    });
    return list;
  }

  var index = [];
  function buildIndex() {
    index = $all('.qa').map(function (qa, order) {
      var summary = $('summary', qa);
      var cat = qa.closest('.cat');
      var catTitle = cat ? $('.cat-title', cat) : null;
      return {
        el: qa,
        summary: summary,
        title: summary.textContent,
        catName: catTitle ? catTitle.textContent.trim() : '',
        nTitle: norm(summary.textContent),
        nKeys: norm(qa.getAttribute('data-keywords') || ''),
        nBody: norm($('.answer', qa).textContent),
        order: order,
        home: null,
      };
    });
  }

  function scoreItem(it, words) {
    var total = 0;
    var matched = 0;
    words.forEach(function (vars) {
      var best = 0;
      vars.forEach(function (v) {
        if (!v.t) return;
        var s = 0;
        if (it.nTitle.indexOf(v.t) >= 0) s = 10;
        else if (it.nKeys.indexOf(v.t) >= 0) s = 7;
        else if (it.nBody.indexOf(v.t) >= 0) s = 2;
        s *= v.w;
        if (s > best) best = s;
      });
      if (best > 0) matched++;
      total += best;
    });
    return { score: total, coverage: words.length ? matched / words.length : 0 };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function highlight(title, words) {
    var html = escapeHtml(title);
    var terms = [];
    words.forEach(function (w) { terms.push(w); var s = stemOf(norm(w)); if (s) terms.push(s); });
    terms.sort(function (a, b) { return b.length - a.length; });
    terms.forEach(function (t) {
      if (!t || t.length < 1) return;
      var alt = [t];
      var hira = t.replace(/[\u30a1-\u30f6]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) - 0x60); });
      if (hira !== t) alt.push(hira);
      var re = new RegExp('(' + alt.map(function (a) { return escapeHtml(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')(?![^<]*>)', 'gi');
      html = html.replace(re, '<mark>$1</mark>');
    });
    return html;
  }

  var resultsBox = null;
  function ensureResultsBox() {
    if (resultsBox) return resultsBox;
    resultsBox = document.createElement('section');
    resultsBox.className = 'cat';
    resultsBox.id = 'results';
    resultsBox.hidden = true;
    resultsBox.innerHTML = '<div class="results-head"><h2 class="cat-title" style="flex:1">検索結果</h2></div><p class="results-note" id="results-note"></p><div id="results-list"></div>';
    var content = $('.content');
    content.insertBefore(resultsBox, content.firstChild);
    index.forEach(function (it) {
      var mark = document.createComment('qa:' + it.el.id);
      it.el.parentNode.insertBefore(mark, it.el);
      it.home = mark;
    });
    return resultsBox;
  }

  function restoreAll() {
    index.forEach(function (it) {
      if (it.home && it.el.previousSibling !== it.home) it.home.parentNode.insertBefore(it.el, it.home.nextSibling);
      it.el.hidden = false;
      it.summary.textContent = it.title;
    });
  }

  var searchInput;
  function runSearch(raw) {
    var q = String(raw || '').trim();
    var status = $('#search-status');
    var empty = $('#empty');
    var box = ensureResultsBox();
    var words = splitQuery(q);

    if (!words.length) {
      document.body.classList.remove('is-searching');
      restoreAll();
      box.hidden = true;
      $all('.cat').forEach(function (c) { if (c !== box) c.hidden = false; });
      $('.notice') && ($('.notice').hidden = false);
      empty.hidden = true;
      status.textContent = '';
      return;
    }

    document.body.classList.add('is-searching');
    var wordVars = words.map(variantsOf);
    var scored = index.map(function (it) {
      var r = scoreItem(it, wordVars);
      return { it: it, score: r.score, coverage: r.coverage };
    });

    var exactCount = scored.filter(function (r) { return r.coverage === 1; }).length;
    var hits = scored.filter(function (r) {
      return r.coverage === 1 || (words.length > 1 && r.coverage >= 0.5 && r.score >= 5);
    });
    var fuzzy = hits.length > 0 && exactCount === 0;
    hits.sort(function (a, b) { return b.score - a.score || a.it.order - b.it.order; });
    hits = hits.slice(0, 12);

    var list = $('#results-list');
    var shown = {};
    hits.forEach(function (r) {
      shown[r.it.el.id] = true;
      r.it.el.hidden = false;
      r.it.summary.innerHTML = '<span class="qa-cat">' + escapeHtml(r.it.catName) + '</span>' + highlight(r.it.title, words);
      list.appendChild(r.it.el);
    });
    index.forEach(function (it) {
      if (!shown[it.el.id]) {
        it.el.hidden = true;
        it.summary.textContent = it.title;
      }
    });

    $all('.cat').forEach(function (c) { if (c !== box) c.hidden = true; });
    $('.notice') && ($('.notice').hidden = true);
    box.hidden = !hits.length;
    $('#results-note').textContent = fuzzy
      ? 'すべての言葉に一致する質問はありませんでした。近い質問を表示しています。'
      : '関連が高い順に表示しています。';
    empty.hidden = hits.length > 0;
    $('#empty-q').textContent = q;
    status.textContent = hits.length ? hits.length + '件の質問が見つかりました' : '';
    if (hits.length === 1) hits[0].it.el.open = true;
  }

  function initSearch() {
    searchInput = $('#search');
    if (!searchInput) return;
    var timer = null;
    searchInput.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { runSearch(searchInput.value); }, 120);
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        runSearch(searchInput.value);
        var first = $('#results-list .qa');
        if (first) first.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (e.key === 'Escape') {
        searchInput.value = '';
        runSearch('');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      searchInput.focus();
    });
    $all('[data-clear-search]').forEach(function (a) {
      a.addEventListener('click', function () {
        searchInput.value = '';
        runSearch('');
      });
    });
    var params = new URLSearchParams(location.search);
    if (params.get('q')) {
      searchInput.value = params.get('q');
      runSearch(searchInput.value);
    }
  }

  // ---------- ハッシュで質問を開く ----------
  function openFromHash() {
    var id = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (!id) return;
    if (LEGACY_HASH[id]) {
      id = LEGACY_HASH[id];
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    }
    var el = document.getElementById(id);
    if (!el) return;
    if (document.body.classList.contains('is-searching') && el.hidden) {
      searchInput.value = '';
      runSearch('');
    }
    if (el.tagName === 'DETAILS') el.open = true;
    requestAnimationFrame(function () { el.scrollIntoView({ block: 'start' }); });
    setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 150);
  }

  function initLinks() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      var el = id && document.getElementById(LEGACY_HASH[id] || id);
      if (!el) return;
      e.preventDefault();
      if (el.hidden || (el.closest('.cat') && el.closest('.cat').hidden)) {
        searchInput.value = '';
        runSearch('');
      }
      if (el.tagName === 'DETAILS') el.open = true;
      if (history.pushState) history.pushState(null, '', '#' + el.id);
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    window.addEventListener('hashchange', openFromHash);

    $all('[data-copy-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById(btn.getAttribute('data-copy-target'));
        if (target) copyText(target.textContent.trim(), btn);
      });
    });
    $all('[data-copy-checklist]').forEach(function (btn) {
      btn.addEventListener('click', function () { copyText(cfg.checklistUrl || '', btn); });
    });
  }

  // ---------- 目次のハイライト・トップへ戻る ----------
  function initScrollUi() {
    var tocLinks = $all('.toc a[href^="#c-"]');
    var toTop = $('#to-top');
    var cats = $all('.cat');
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY + 120;
      var current = null;
      cats.forEach(function (c) { if (!c.hidden && c.offsetTop <= y) current = c.id; });
      tocLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + current); });
      if (toTop) toTop.hidden = window.scrollY < 600;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyConfig();
    buildIndex();
    enhanceQa();
    initSearch();
    initLinks();
    initScrollUi();
    openFromHash();
  });
})();
