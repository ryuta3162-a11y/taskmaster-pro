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
      tag: '原因を考える',
      kase: { name: '例）店舗の清掃をお願いする依頼', rows: [['種類', '社員への依頼（全店）'], ['期限', '投稿から約2週間'], ['期限内に完了', '約25%']] },
      ask: '期限まで十分あったのに、期限内の完了は約25%。いちばん大きな原因は？',
      options: [['a', '期限が短すぎた'], ['b', '店舗で1回やればよい作業を、社員への依頼で出した'], ['c', '清掃の内容が難しすぎた']],
      explain: '社員への依頼は担当者一人ひとりに届くので、同じ店舗の誰かが清掃しても、他の担当者の分が未完了のまま残ります。店舗でやる作業は店舗への依頼で出します。',
      link: 'index.html#q-kinds',
    },
    {
      tag: '原因を考える',
      kase: { name: '例）一部のブランドの店舗だけが対象の確認作業', rows: [['種類', '社員への依頼（全店）'], ['本文', '「〇〇ブランドの店舗が対象です」'], ['期限内に完了', '約30%']] },
      ask: '期限内の完了が約30%にとどまった。まず直すべき点は？',
      options: [['a', '一部の店舗だけの作業なのに、全店に送った'], ['b', '本文が長すぎた'], ['c', '投稿した曜日が悪かった']],
      explain: '対象外の人にも届くと、その人の分は完了されずに残り、実施率を下げます。配信先で対象の店舗・人だけにしぼります。',
      link: 'index.html#q-exclude',
    },
    {
      tag: '原因を考える',
      kase: { name: '例）アンケートのリマインド', rows: [['種類', 'リマインド（社員）'], ['期限', '投稿の翌日'], ['期限内に完了', '約1割（最終的には8割以上が完了）']] },
      ask: '最終的には8割以上が回答したのに、期限内は約1割。何が問題だった？',
      options: [['a', '対象が全店で多すぎた'], ['b', 'リマインドは読まれないから'], ['c', '新しい期限が投稿の翌日しかなかった']],
      explain: 'やる気はあっても、翌日の期限では間に合いません。リマインドでも、作業できる日数を見て期限を付け直します。',
      link: 'index.html#q-how-to-request',
    },
    {
      tag: '次に出すなら',
      kase: { name: '例）入力が終わっていない人への再依頼', rows: [['出し方', '新規投稿で、チーム全員に再送'], ['期限', '投稿した当日'], ['期限内に完了', '約15%']] },
      ask: '前の依頼で入力していない人がいたとき、どう出せばよかった？',
      options: [['a', '今回と同じく、新規投稿で全員に送り直す'], ['b', '前の依頼をリマインドして、まだの人だけに数日先の期限で送る'], ['c', '期限を付けずに送る']],
      explain: '新規投稿で全員に送ると、もう終えた人にも未完了が増えます。まだの人だけに届くのはリマインドです。当日の期限では、ほとんどの人が間に合いません。',
      link: 'index.html#q-which',
    },
    {
      tag: 'データを読む',
      kase: { name: '例）毎月の定例作業の依頼', rows: [['期限', '投稿から約2週間'], ['最終的に完了', '約9割'], ['期限内に完了', '約5割（完了した人の4割以上が期限の後）']] },
      ask: '作業はしているのに、完了の記録が期限の後になっている人が多い。受け取った側にできることは？',
      options: [['a', '作業が終わったら、その場で完了を押す'], ['b', '月末にまとめて完了を押す'], ['c', '期限の後でも完了は付くので、急がなくてよい']],
      explain: '完了を押した時刻で、期限内かどうかが記録されます。やったのに押し忘れると「期限超過」になります。',
      link: 'index.html#q-complete-store',
    },
    {
      tag: '次に出すなら',
      kase: { name: '例）キャンペーン準備の業務依頼', rows: [['内容', '店舗での準備が必要'], ['期限', '投稿から3日'], ['期限内に完了', '約35%']] },
      ask: '同じような依頼を次に出すなら、期限はいつにする？',
      options: [['a', '投稿の翌日〜3日後'], ['b', '4〜6日後'], ['c', '1週間以上先']],
      explain: '7〜9月の実績では、期限が3日以内の依頼は期限内の完了が46%、1週間以上先だと約66%でした。準備の時間がとれる期限にします。',
      link: 'index.html#q-how-to-request',
    },
    {
      tag: '次に出すなら',
      kase: { name: '例）別メールの確認と注文をお願いする依頼', rows: [['本文', '「先日のメールをご確認ください」から始まる'], ['期限', '投稿から4日'], ['期限内に完了', '約30%']] },
      ask: '依頼文をさらに良くするなら？',
      options: [['a', '「何を・どこに・いつまでに」を本文に箇条書きで書く'], ['b', '本文は「メール参照」だけにして短くする'], ['c', '同じ内容を別のメールでもう一度送る']],
      explain: '依頼を開いた瞬間に、やることが分かるのが大事です。別のメールを探しに行く手間があると、後回しになりやすくなります。',
      link: 'index.html#q-how-to-request',
    },
    {
      tag: '仕組み',
      text: '店舗依頼で、自分の担当店舗のひとつを、同じ店舗の別の担当者が先に完了にした。',
      ask: 'あなたは？',
      options: [['a', '自分も同じ店舗にチェックを入れる'], ['b', '何もしなくてよい'], ['c', '依頼者に連絡して、自分の分を消してもらう']],
      explain: '店舗依頼は店舗ごとに1回の完了です。誰か1人が完了すれば、その店舗は完了になり、完了した人と時刻が表示されます。',
      link: 'index.html#q-complete-store',
    },
    {
      tag: '仕組み',
      text: '「店舗アドレスへ共有」で、依頼の内容を店舗メールに送った。',
      ask: 'このあとは？',
      options: [['a', '共有した時点で完了なので、何もしない'], ['b', '店舗スタッフに完了を押してもらう'], ['c', '作業が終わったら、自分で完了を押す']],
      explain: '共有は内容を伝えるだけの機能です。完了の記録はつきません。',
      link: 'index.html#q-store-share',
    },
    {
      tag: 'まとめ',
      text: '7〜9月に、期限内の完了率が低かった依頼をふり返ります。',
      ask: '共通していたことは？',
      options: [['a', '期限が投稿から3日以内と短い'], ['b', '店舗の作業を社員への依頼で出したり、対象外の人にも送ったりしている'], ['c', '上の2つのどちらも']],
      explain: '実施率を上げるコツは「作業できる期限」と「必要な人だけに、正しい種類で届ける」の2つです。',
      link: 'index.html#q-how-to-request',
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

  function caseHtml(c) {
    return '<span class="case"><span class="case-name">' + esc(c.name) + '</span>' +
      c.rows.map(function (r) {
        return '<span class="case-row"><span class="case-k">' + esc(r[0]) + '</span><span class="case-v' +
          (r[0] === '期限内に完了' ? ' is-low' : '') + '">' + esc(r[1]) + '</span></span>';
      }).join('') + '</span>';
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
        (q.kase ? caseHtml(q.kase) : '<span class="q-scene">' + esc(q.text) + '</span>') +
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
