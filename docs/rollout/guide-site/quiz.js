(function () {
  'use strict';

  var cfg = window.GUIDE_CONFIG || {};
  var endpoint = String(cfg.quizResultEndpoint || '').trim();
  var STORAGE_KEY = 'todoGuideQuizEmail';

  var KIND = { store: '店舗への依頼', employee: '社員への依頼', team: 'TFチームの依頼' };
  var METHOD = { new: '新規投稿', repost: '再投稿', remind: 'リマインド' };

  /**
   * 採点は集計GAS（correctAnswers）で行う。選択肢は target / method の組み合わせを1つの答えとして見せる。
   * explain は不正解のときに表示するヒント（答えそのものは出さない）。
   */
  var QUESTIONS = [
    {
      text: '全店舗に、前月の売上・入会数・体験数の入力を依頼したい（今回だけ）',
      options: [['employee', 'new'], ['store', 'new'], ['store', 'remind']],
      explain: '店舗ごとの数値は、店舗単位で完了してもらう依頼です。はじめて送る依頼は新規投稿です。',
      link: 'index.html#q-kinds',
    },
    {
      text: '担当トレーナー本人に、今月分のPT売上実績を入力してもらいたい（今回だけ）',
      options: [['store', 'new'], ['team', 'new'], ['employee', 'new']],
      explain: '本人に入力してもらう依頼は、一人ひとりが完了する依頼です。',
      link: 'index.html#q-kinds',
    },
    {
      text: 'PTチームのメンバーだけに、Googleフォームへの回答を依頼したい',
      options: [['team', 'new'], ['employee', 'new'], ['store', 'new']],
      explain: '特定のTFチームのメンバーだけに送るときは、チームで配信先を選ぶ依頼です。',
      link: 'index.html#q-kinds',
    },
    {
      text: '先月送ったPOP掲示の依頼（期限切れ）を、各店舗にもう一度送りたい',
      options: [['store', 'remind'], ['store', 'new'], ['store', 'repost']],
      explain: '期限が過ぎた依頼を、前回と同じ宛先にもう一度送る方法を選びます。',
      link: 'index.html#q-which',
    },
    {
      text: '以前送った店舗依頼で、まだ完了していない店舗だけに催促したい',
      options: [['store', 'repost'], ['store', 'remind'], ['employee', 'remind']],
      explain: '未実施の人だけを宛先にして送り直す方法を選びます。',
      link: 'index.html#q-remind',
    },
    {
      text: '研修資料（ZIP）の確認・提出を、該当する社員だけに依頼したい（今回だけ）',
      options: [['team', 'new'], ['employee', 'new'], ['store', 'new']],
      explain: '役職で対象の社員を選び、一人ひとりに完了してもらう依頼です。ZIPは添付できます。',
      link: 'index.html#q-attach',
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
          '<span>' + esc(KIND[o[0]]) + ' を ' + esc(METHOD[o[1]]) + '</span></label>';
      }).join('');
      return '<div class="q" id="q' + qi + '"><fieldset>' +
        '<legend><span class="q-num">' + (qi + 1) + '</span><span>' + esc(q.text) + '</span></legend>' +
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
      var name = '__todoQuiz_' + Date.now() + '_' + Math.random().toString(36).slice(2);
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

  function onSubmit(e) {
    e.preventDefault();
    var emailInput = $('#email');
    var emailMsg = $('#email-msg');
    var submitMsg = $('#submit-msg');
    var email = emailInput.value.trim();

    if (!email || !emailInput.checkValidity()) {
      setMsg(emailMsg, 'メールアドレスを正しく入力してください。', 'error');
      emailInput.focus();
      return;
    }
    setMsg(emailMsg, '結果はこのメールアドレスで記録されます。');

    var missing = answers.indexOf(null);
    if (missing >= 0) {
      setMsg(submitMsg, (missing + 1) + '問目が未回答です。', 'error');
      document.getElementById('q' + missing).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try { localStorage.setItem(STORAGE_KEY, email); } catch (err) {}

    var details = answers.map(function (oi, qi) {
      var o = QUESTIONS[qi].options[oi];
      return { questionId: 'q' + (qi + 1), target: o[0], method: o[1] };
    });

    var btn = $('#submit');
    btn.disabled = true;
    btn.textContent = '送信中…';
    setMsg(submitMsg, '送信しています…');

    send({
      action: 'submit',
      email: email,
      answers: JSON.stringify(details),
      details: JSON.stringify(details),
      submittedAt: new Date().toISOString(),
    }).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.message) || '記録できませんでした。');
      setMsg(submitMsg, '');
      showResult(res);
    }).catch(function (err) {
      var msg = err && err.message ? err.message : '送信できませんでした。';
      if (/メールアドレス/.test(msg)) {
        setMsg(emailMsg, msg + ' 入力したアドレスを確認してください。', 'error');
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
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) $('#email').value = saved;
    } catch (err) {}
    $('#quiz-form').addEventListener('submit', onSubmit);
  });
})();
