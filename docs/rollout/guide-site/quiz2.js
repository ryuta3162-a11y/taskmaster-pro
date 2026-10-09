(function () {
  'use strict';

  var cfg = window.GUIDE_CONFIG || {};
  var endpoint = String(cfg.quiz2ResultEndpoint || '').trim();
  var STORAGE_KEY = 'todoGuideQuizEmail';


  /**
   * 採点は集計GAS（quiz2-results-gas の correctAnswers）で行う。選択肢の id（a/b/c）は GAS と同じ。
   * explain は不正解のときに表示するヒント（答えそのものは出さない）。
   */
  var QUESTIONS = [
    {
      tag: '依頼の種類',
      text: 'QSCチーム：10月の特別清掃を全店舗で実施してほしい（1店舗1回でOK）',
      ask: 'どれで出す？',
      options: [['a', '社員への依頼を新規投稿'], ['b', '店舗への依頼を新規投稿'], ['c', 'TFチームの依頼を新規投稿']],
      explain: '店舗で行う作業かどうかで選びます。社員への依頼にすると担当者一人ひとりに届き、同じ店舗の誰かが終えても他の人の分が残ります。',
      link: 'index.html#q-kinds',
    },
    {
      tag: '依頼の種類',
      text: 'オプションチーム：8・9月のプロテイン経費を、対象の社員それぞれに回答してほしい',
      ask: 'どれで出す？',
      options: [['a', '社員への依頼を新規投稿'], ['b', '店舗への依頼を新規投稿'], ['c', '社員への依頼をリマインド']],
      explain: '一人ひとりに答えてもらう依頼で、はじめて送るものです。',
      link: 'index.html#q-kinds',
    },
    {
      tag: '出し直し',
      text: '「水素水の利用促進」の期限が過ぎた。まだ終わっていない店舗だけにもう一度お願いしたい',
      ask: 'どうする？',
      options: [['a', '再投稿する'], ['b', '未実施の店舗を選び直して新規投稿する'], ['c', 'リマインドする']],
      explain: '再投稿は前回と同じ全員に届きます。新規投稿にすると、別の依頼として二重に管理することになります。',
      link: 'index.html#q-which',
    },
    {
      tag: '出し直し',
      text: 'FIT365の投稿用写真に間違いがあった。期限はまだ先',
      ask: '正しい写真を伝えるには？',
      options: [['a', '修正する'], ['b', '再投稿する'], ['c', '新規投稿で別の依頼として送る']],
      explain: '期限内に内容を直すときの方法です。【訂正】として同じ宛先に届き、完了済みの記録も消えません。',
      link: 'index.html#q-edit',
    },
    {
      tag: '出し直し',
      text: 'SMG以下アンケートの期限が切れた。前回と同じ全員にもう一度案内したい',
      ask: 'どうする？',
      options: [['a', 'リマインドする'], ['b', '再投稿する'], ['c', '修正する']],
      explain: '期限切れの依頼を、前回と同じ全員にもう一度送る方法です。まだの人だけに送るときはリマインドです。',
      link: 'index.html#q-which',
    },
    {
      tag: '配信先',
      text: 'サーキュレーター導入の依頼を、FIT365の店舗だけに出したい',
      ask: 'どうする？',
      options: [['a', '店舗への依頼で、FIT365の店舗だけを配信先に選ぶ'], ['b', '社員への依頼で全員に送り、本文に「FIT365のみ」と書く'], ['c', '全店舗に送り、関係ない店舗は完了を押してもらう']],
      explain: '関係ない人に届くと、未実施のまま残ったりリマインドが届いたりします。配信先で対象をしぼります。',
      link: 'index.html#q-exclude',
    },
    {
      tag: '期限',
      text: '全店舗に入力をお願いする依頼を出す',
      ask: '期限内に終わりやすい期限は？（7〜9月の実績）',
      options: [['a', '投稿の翌日〜3日後'], ['b', '4〜6日後'], ['c', '1週間以上先']],
      explain: '期限が3日以内の依頼は、期限内に終わったのが半分以下でした。準備の時間がとれる期限ほど、期限内に終わっています。',
      link: 'index.html#q-how-to-request',
    },
    {
      tag: '完了',
      text: '自分の担当店舗を、同じ店舗の別の担当者が先に完了にした',
      ask: 'あなたは？',
      options: [['a', '自分も同じ店舗にチェックを入れる'], ['b', '何もしなくてよい'], ['c', '依頼者に連絡して、自分の分を消してもらう']],
      explain: '店舗依頼は店舗ごとに1回の完了です。誰か1人が完了すれば、その店舗は完了になり、完了した人と時刻が表示されます。',
      link: 'index.html#q-complete-store',
    },
    {
      tag: '完了',
      text: '「店舗アドレスへ共有」で店舗メールに送った',
      ask: 'このあとは？',
      options: [['a', '共有した時点で完了なので、何もしない'], ['b', '店舗スタッフに完了を押してもらう'], ['c', '作業が終わったら、自分で完了を押す']],
      explain: '共有は内容を伝えるだけの機能です。完了の記録はつきません。',
      link: 'index.html#q-store-share',
    },
    {
      tag: '登録',
      text: '10月の組織変更で、担当店舗が変わった',
      ask: '新しい店舗の依頼が届くようにするには？',
      options: [['a', 'ログアウト →「ログイン情報を変更」で管轄店舗を直す'], ['b', '依頼者に伝えて、送り直してもらう'], ['c', '届かないので、店舗メールで確認する']],
      explain: '依頼は、登録している管轄店舗・役職・チームをもとに届きます。右上の丸いアイコン → ログアウト →「ログイン情報を変更」で自分で直せます。',
      link: 'index.html#q-change-profile',
    },
  ];

  var answers = QUESTIONS.map(function () { return null; });

  function $(sel) { return document.querySelector(sel); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function setMsg(el, text, status) {
    el.textContent = text || '';
    el.classList.toggle('is-error', status === 'error');
    el.classList.toggle('is-ok', status === 'ok');
  }

  function render() {
    var html = QUESTIONS.map(function (q, qi) {
      var opts = q.options.map(function (o, oi) {
        var id = 'q' + qi + '_' + oi;
        return '<label class="opt" for="' + id + '">' +
          '<input type="radio" id="' + id + '" name="q' + qi + '" value="' + oi + '">' +
          '<span>' + esc(o[1]) + '</span></label>';
      }).join('');
      return '<div class="q" id="q' + qi + '"><fieldset>' +
        '<legend><span class="q-num">' + (qi + 1) + '</span><span class="q-body">' +
        '<span class="q-tag">' + esc(q.tag) + '</span>' +
        '<span class="q-scene">' + esc(q.text) + '</span>' +
        '<span class="q-ask">' + esc(q.ask) + '</span></span></legend>' +
        '<div class="opts">' + opts + '</div></fieldset>' +
        '<p class="explain" hidden></p></div>';
    }).join('');
    $('#questions').innerHTML = html;

    $('#questions').addEventListener('change', function (e) {
      var input = e.target;
      if (!input || input.type !== 'radio') return;
      var qi = Number(input.name.slice(1));
      answers[qi] = Number(input.value);
      var box = document.getElementById('q' + qi);
      box.classList.remove('is-wrong', 'is-right');
      box.querySelector('.explain').hidden = true;
      updateProgress();
    });
  }

  function answeredCount() {
    return answers.filter(function (a) { return a !== null; }).length;
  }

  function updateProgress() {
    $('#progress').textContent = answeredCount() + ' / ' + QUESTIONS.length + ' 問回答';
  }

  // ---------- 送信（GAS は JSONP を優先） ----------
  function buildUrl(params, callbackName) {
    var query = new URLSearchParams();
    Object.keys(params).forEach(function (k) { query.set(k, String(params[k])); });
    if (callbackName) query.set('callback', callbackName);
    query.set('source', 'todo-list-guide');
    return endpoint + (endpoint.indexOf('?') >= 0 ? '&' : '?') + query.toString();
  }

  function jsonp(params) {
    return new Promise(function (resolve, reject) {
      var name = '__todoQuiz2_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      var script = document.createElement('script');
      var timer = setTimeout(function () { cleanup(); reject(new Error('送信がタイムアウトしました。通信状況を確認して、もう一度お試しください。')); }, 30000);
      function cleanup() {
        clearTimeout(timer);
        delete window[name];
        if (script.parentNode) script.parentNode.removeChild(script);
      }
      window[name] = function (res) { cleanup(); resolve(res || {}); };
      script.async = true;
      script.src = buildUrl(params, name);
      script.onerror = function () { cleanup(); reject(new Error('送信できませんでした。通信状況を確認して、もう一度お試しください。')); };
      document.head.appendChild(script);
    });
  }

  function viaFetch(params) {
    return fetch(buildUrl(params), { method: 'GET', cache: 'no-store', redirect: 'follow' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function send(params) {
    if (!endpoint) return Promise.reject(new Error('集計先が設定されていません。'));
    return jsonp(params).catch(function (err) {
      return viaFetch(params).catch(function () { throw err; });
    });
  }

  // ---------- 結果 ----------
  function showResult(res) {
    var box = $('#result');
    var marks = Array.isArray(res.marks) ? res.marks : [];
    var score = typeof res.score === 'number' ? res.score : marks.filter(function (m) { return m === '○'; }).length;

    marks.forEach(function (m, qi) {
      var q = document.getElementById('q' + qi);
      if (!q) return;
      var ex = q.querySelector('.explain');
      if (m === '○') {
        q.classList.add('is-right');
        q.classList.remove('is-wrong');
        ex.className = 'explain ok';
        ex.textContent = '正解です。';
      } else {
        q.classList.add('is-wrong');
        q.classList.remove('is-right');
        ex.className = 'explain ng';
        ex.innerHTML = '不正解です。' + esc(QUESTIONS[qi].explain) +
          ' <a href="' + QUESTIONS[qi].link + '" target="_blank" rel="noopener">解説を見る</a>';
      }
      ex.hidden = false;
    });

    box.hidden = false;
    if (res.passed) {
      box.className = 'result pass';
      box.innerHTML = '<h2>合格です（' + QUESTIONS.length + ' / ' + QUESTIONS.length + '）</h2>' +
        '<p>' + esc(res.message || '合格として記録しました。') + '</p>' +
        '<a class="btn btn-primary" href="index.html">ヘルプセンターへ戻る</a>';
    } else {
      box.className = 'result fail';
      box.innerHTML = '<h2>あと少しです（' + score + ' / ' + QUESTIONS.length + '）</h2>' +
        '<p>不正解の問題にヒントを表示しました。選び直して、もう一度「結果を送信」を押してください。</p>';
    }
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  var verifiedEmail = '';

  function notListedMessage() {
    return '社内メールアドレス（名前@okamoto-group.co.jp）を入力してください。';
  }

  function lockQuestions(locked) {
    $('#questions').classList.toggle('is-locked', locked);
    Array.prototype.forEach.call(document.querySelectorAll('#questions input'), function (el) { el.disabled = locked; });
  }

  function verifyEmail() {
    var emailInput = $('#email');
    var emailMsg = $('#email-msg');
    var btn = $('#verify');
    var email = emailInput.value.trim();

    if (!email || !emailInput.checkValidity()) {
      setMsg(emailMsg, 'メールアドレスを正しく入力してください。', 'error');
      emailInput.focus();
      return Promise.resolve(false);
    }
    if (email.toLowerCase() === verifiedEmail) return Promise.resolve(true);

    btn.disabled = true;
    btn.textContent = '確認中…';
    setMsg(emailMsg, 'メールアドレスを確認しています…');
    return send({ action: 'verify', email: email }).then(function (res) {
      if (!res || !res.ok) {
        verifiedEmail = '';
        lockQuestions(true);
        setMsg(emailMsg, /登録されていません/.test((res && res.message) || '') ? notListedMessage() : ((res && res.message) || '確認できませんでした。'), 'error');
        return false;
      }
      verifiedEmail = email.toLowerCase();
      try { localStorage.setItem(STORAGE_KEY, email); } catch (err) {}
      lockQuestions(false);
      setMsg(emailMsg, (res.name ? res.name + ' さんとして' : 'このメールアドレスで') + '結果を記録します。問題に進んでください。', 'ok');
      return true;
    }).catch(function (err) {
      setMsg(emailMsg, (err && err.message) || '確認できませんでした。', 'error');
      return false;
    }).then(function (ok) {
      btn.disabled = false;
      btn.textContent = '確認';
      return ok;
    });
  }

  function onSubmit(e) {
    e.preventDefault();
    var emailInput = $('#email');
    var emailMsg = $('#email-msg');
    var submitMsg = $('#submit-msg');
    var email = emailInput.value.trim();

    if (!verifiedEmail || email.toLowerCase() !== verifiedEmail) {
      setMsg(submitMsg, '先にメールアドレスの「確認」を押してください。', 'error');
      emailInput.focus();
      return;
    }

    var missing = answers.indexOf(null);
    if (missing >= 0) {
      setMsg(submitMsg, (missing + 1) + '問目が未回答です。', 'error');
      document.getElementById('q' + missing).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    var picked = answers.map(function (oi, qi) { return QUESTIONS[qi].options[oi][0]; });

    var btn = $('#submit');
    btn.disabled = true;
    btn.textContent = '送信中…';
    setMsg(submitMsg, '送信しています…');

    send({
      action: 'submit',
      email: email,
      answers: JSON.stringify(picked),
      submittedAt: new Date().toISOString(),
    }).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.message) || '記録できませんでした。');
      setMsg(submitMsg, '');
      showResult(res);
    }).catch(function (err) {
      var msg = err && err.message ? err.message : '送信できませんでした。';
      if (/登録されていません/.test(msg)) {
        verifiedEmail = '';
        setMsg(emailMsg, notListedMessage(), 'error');
        emailInput.focus();
        setMsg(submitMsg, '');
      } else {
        setMsg(submitMsg, msg, 'error');
      }
    }).then(function () {
      btn.disabled = false;
      btn.textContent = '結果を送信';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    render();
    updateProgress();
    lockQuestions(true);
    var emailInput = $('#email');
    $('#verify').addEventListener('click', verifyEmail);
    emailInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); verifyEmail(); }
    });
    emailInput.addEventListener('input', function () {
      if (verifiedEmail && emailInput.value.trim().toLowerCase() !== verifiedEmail) {
        verifiedEmail = '';
        lockQuestions(true);
        setMsg($('#email-msg'), 'メールアドレスが変わりました。もう一度「確認」を押してください。');
      }
    });
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        emailInput.value = saved;
        verifyEmail();
      }
    } catch (err) {}
    $('#quiz-form').addEventListener('submit', onSubmit);
  });
})();
