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
      text: '本部のチームが、全店で月1回の特別清掃をお願いしました。各店舗には担当者が2〜4人います。期限の時点で、清掃そのものは多くの店舗で終わっていたのに、To Do List 上の完了は約25%にとどまりました。',
      ask: '「やったのに完了率が低い」状態になった、いちばん大きな原因は？',
      options: [['a', '期限が短く、清掃そのものが期限までに終わらなかった店舗が多かった'], ['b', '店舗で1回やればよい作業なのに、担当者一人ひとりに完了が求められ、他の担当者の分が残った'], ['c', '報告方法が分かりにくく、どこに報告すればいいか迷った人が多かった']],
      explain: '社員への依頼は担当者一人ひとりに届きます。同じ店舗の誰かが清掃しても、他の担当者の分は未完了のままです。店舗で1回やればよい作業は、店舗への依頼で出します。',
      link: 'index.html#q-kinds',
    },
    {
      tag: '考え方を見直す',
      kase: { name: '例）一部のブランドの店舗だけが対象の確認作業', rows: [['種類', '社員への依頼（全店）'], ['本文', '「〇〇ブランドの店舗が対象です」'], ['期限内に完了', '約30%']] },
      text: '対象外のブランドを担当する人から「関係ないのに未完了が残っている」という声が出ました。依頼者は「対象外の人も、完了を押してくれれば実施率は上がるはず」と考えています。',
      ask: 'この考え方の問題点としていちばん近いものは？',
      options: [['a', '対象外の人に余計な作業を増やし、本当に終わっていない店舗が見えにくくなる。配信先で対象をしぼるべき'], ['b', '問題ない。対象外の人も完了を押せば実施率の数字は上がるので、目的は達成できる'], ['c', '本文の一番上に「対象外の方は無視してください」と書けば、未完了が残っても問題はない']],
      explain: '対象外の人に届いた依頼は、完了されずに残るか、意味のない完了が混ざります。どちらも「本当の未実施」が見えなくなります。最初から配信先でしぼるのがいちばん確実です。',
      link: 'index.html#q-exclude',
    },
    {
      tag: '次に出すなら',
      kase: { name: '例）アンケートのリマインド', rows: [['種類', 'リマインド（社員）'], ['新しい期限', '投稿の翌日'], ['期限内に完了', '約1割（最終的には8割以上が回答）']] },
      text: 'アンケートの期限が過ぎたので、まだの人にリマインドを送りました。新しい期限は翌日にしました。最終的には8割以上が回答しましたが、ほとんどは新しい期限の後でした。',
      ask: '次に同じ状況になったら、いちばん良い出し方は？',
      options: [['a', '全員に再投稿して、期限は翌日のまま。全員に届くので回答がそろいやすい'], ['b', 'リマインドは送らず、未回答の人一人ずつにチャットで催促する'], ['c', 'まだの人だけにリマインドし、新しい期限は回答にかかる時間を見て数日先にする']],
      explain: '回答する気はあっても、翌日の期限では間に合わない人が多くいました。リマインドでも、作業できる日数を見て期限を付け直します。',
      link: 'index.html#q-how-to-request',
    },
    {
      tag: '依頼の種類を選ぶ',
      kase: { name: '例）入力の依頼', rows: [['状況', '期限が過ぎた'], ['入力済み', '約8割'], ['追加', '入力欄が1つ増えた']] },
      text: '一度出した入力の依頼で、期限が過ぎました。約8割の人は入力済みです。ところが、あとから入力欄が1つ増えたので、入力済みの人も含めて全員に追記してもらう必要が出てきました。',
      ask: 'どれで出す？',
      options: [['a', 'リマインド'], ['b', '再投稿'], ['c', '新規投稿で、別の依頼として出す']],
      explain: 'リマインドはまだの人にしか届かず、入力済みの人に追記をお願いできません。新規投稿にすると同じ依頼を二重に管理することになります。期限切れの依頼を、前回と同じ全員にもう一度送るのが再投稿です。',
      link: 'index.html#q-which',
    },
    {
      tag: 'データを読む',
      kase: { name: '例）毎月の定例作業の依頼', rows: [['期限', '投稿から約2週間'], ['最終的に完了', '約9割'], ['期限内に完了', '約5割']] },
      text: 'あなたは定例作業を週ごとに少しずつ進め、To Do List の完了は月末にまとめて押しています。上司から「あなたの担当は期限超過が多い」と言われましたが、作業そのものは期限内に終わっています。',
      ask: '何が起きている？',
      options: [['a', '完了を押した時刻で記録されるため、作業が期限内でも押すのが遅いと期限超過になる'], ['b', 'システムの不具合で、完了の時刻が実際より遅く記録されている'], ['c', '上司が見ているのは古いデータで、最新の完了が反映されていない']],
      explain: 'To Do List は、完了を押した時刻で期限内かどうかを記録します。作業が終わったら、その場で完了を押すのがいちばん確実です。',
      link: 'index.html#q-complete-store',
    },
    {
      tag: '期限を決める',
      kase: { name: '例）キャンペーン準備の業務依頼', rows: [['内容', 'POP掲示とスタッフへの説明'], ['キャンペーン開始', '投稿から約2週間後'], ['参考', '期限3日以内の依頼は、期限内の完了が46%']] },
      text: '店舗でPOPを掲示し、スタッフに内容を説明してもらう準備の依頼を出します。キャンペーンは約2週間後に始まります。',
      ask: '期限はいつにするのがいちばん良い？',
      options: [['a', '早く終わらせたいので投稿の翌日。遅れた店舗にはすぐリマインドを送る'], ['b', 'キャンペーン開始日の前日。準備にいちばん長く時間をとれるので、もっとも確実'], ['c', '投稿から1週間ほど。準備の時間をとりつつ、開始前に確認やリマインドをする余裕を残す']],
      explain: '7〜9月の実績では、期限が3日以内だと期限内の完了は46%、1週間以上先だと約66%でした。ただし開始日ぎりぎりにすると、遅れた店舗を追いかける時間がありません。',
      link: 'index.html#q-how-to-request',
    },
    {
      tag: '依頼文を考える',
      kase: { name: '例）別メールの確認と注文をお願いする依頼', rows: [['本文', '「先日のメールをご確認ください」から始まる'], ['期限', '投稿から4日'], ['期限内に完了', '約30%']] },
      text: '依頼を開くと、まず「先日のメールをご確認ください」とあり、やることはそのメールと本文の後半に分かれて書かれていました。',
      ask: '依頼文をさらに良くするなら？',
      options: [['a', '本文は「詳しくはメール参照」だけにして、読む量を減らす'], ['b', '本文の最初に「何を・どこに・いつまでに」を箇条書きで書き、詳しい説明はその下に置く'], ['c', '見落とされないよう、同じ内容を別のメールでもう一度送る']],
      explain: '依頼を開いた瞬間に、やることが分かるのが大事です。別のメールを探す手間があると、後回しになりやすくなります。',
      link: 'index.html#q-how-to-request',
    },
    {
      tag: '仕組み',
      text: 'あなたと先輩は、同じ店舗Aを担当しています。あなたは店舗Bも担当しています。店舗への依頼が届き、店舗Aは先輩が先に作業して完了を押しました。店舗Bはまだです。',
      ask: 'あなたがやることは？',
      options: [['a', '店舗Aにも自分でチェックを入れてから、店舗Bの作業をする'], ['b', '店舗Bの作業をして、店舗Bの完了を押す'], ['c', '先輩に店舗Bもお願いして、自分は何もしない']],
      explain: '店舗への依頼は店舗ごとに1回の完了です。店舗Aは先輩の完了で終わっていて、完了した人と時刻が表示されます。あなたは残っている店舗Bを終わらせます。',
      link: 'index.html#q-complete-store',
    },
    {
      tag: '仕組み',
      text: '店舗スタッフに作業してもらうため、「店舗アドレスへ共有」で依頼の内容を店舗メールに送りました。翌日、スタッフから「終わりました」と連絡がありました。',
      ask: 'このあとは？',
      options: [['a', '作業が終わったことを確認して、自分で完了を押す'], ['b', '共有した時点で完了になっているので、あとは何もしなくてよい'], ['c', 'スタッフに伝えて、To Do List の完了を押してもらう']],
      explain: '共有は内容を伝えるだけの機能で、完了の記録はつきません。完了を押すのは、依頼を受けた担当者です。',
      link: 'index.html#q-store-share',
    },
    {
      tag: 'まとめ',
      text: 'あなたが依頼を出す側になりました。店舗ごとに1回やればよい作業で、対象は△△ブランドの店舗だけ。準備に数日かかります。',
      ask: '実施率がいちばん上がる出し方は？',
      options: [['a', '社員への依頼で全店に送り、期限は3日後。詳しい内容は別のメールで送り、本文は「メール参照」'], ['b', '店舗への依頼で全店に送り、期限は翌日。本文の最初に「対象外の店舗は無視してください」と書く'], ['c', '店舗への依頼で、配信先を△△ブランドの店舗だけにし、期限は1週間ほど先。本文の最初にやることを箇条書き']],
      explain: '実施率を上げるコツは「正しい種類で」「必要な相手だけに」「作業できる期限で」「ひと目で分かる本文で」出すことです。',
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
    return '<div class="case"><div class="case-name">' + esc(c.name) + '</div><table class="case-table">' +
      c.rows.map(function (r) {
        return '<tr><th>' + esc(r[0]) + '</th><td' + (r[0] === '期限内に完了' ? ' class="is-low"' : '') + '>' + esc(r[1]) + '</td></tr>';
      }).join('') + '</table></div>';
  }

  function render() {
    var html = QUESTIONS.map(function (q, qi) {
      var opts = q.options.map(function (o, oi) {
        var id = 'q' + qi + '_' + oi;
        return '<label class="opt" for="' + id + '">' +
          '<input type="radio" id="' + id + '" name="q' + qi + '" value="' + oi + '">' +
          '<span class="opt-key">' + 'ABC'.charAt(oi) + '</span>' +
          '<span class="opt-text">' + esc(o[1]) + '</span></label>';
      }).join('');
      var num = (qi + 1 < 10 ? '0' : '') + (qi + 1);
      return '<section class="q" id="q' + qi + '">' +
        '<div class="q-ctx">' +
        '<div class="q-head"><span class="q-num">Q' + num + '</span><span class="q-tag">' + esc(q.tag) + '</span></div>' +
        (q.kase ? caseHtml(q.kase) : '') +
        (q.text ? '<p class="q-scene">' + esc(q.text) + '</p>' : '') +
        '</div>' +
        '<fieldset class="q-main"><legend class="q-ask">' + esc(q.ask) + '</legend>' +
        '<div class="opts">' + opts + '</div>' +
        '<p class="explain" hidden></p></fieldset></section>';
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
    var bar = $('#progress-bar');
    if (bar) bar.style.width = (answeredCount() / QUESTIONS.length * 100) + '%';
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
  function confettiHtml() {
    var colors = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'];
    var out = '';
    for (var i = 0; i < 36; i++) {
      out += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + colors[i % colors.length] +
        ';animation-delay:' + (Math.random() * 0.6).toFixed(2) + 's;animation-duration:' + (1.6 + Math.random() * 1.2).toFixed(2) + 's"></i>';
    }
    return out;
  }

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
      box.className = 'result pass celebrate';
      box.innerHTML = '<div class="confetti" aria-hidden="true">' + confettiHtml() + '</div>' +
        '<p class="celebrate-badge">全問正解</p>' +
        '<h2>ご回答ありがとうございました</h2>' +
        '<p>' + (res.name ? esc(res.name) + ' さんの' : '') + '結果を合格として記録しました。<br>今日からの依頼づくり・完了報告に、ぜひ活かしてください。</p>';
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
