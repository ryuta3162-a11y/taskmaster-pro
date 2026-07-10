(function () {
  const cfg = window.GUIDE_CONFIG || {};
  const endpoint = String(cfg.quizResultEndpoint || '').trim();
  const STORAGE_KEY = 'todoGuideQuizEmail';

  const TARGET_CHOICES = [
    { id: 'store', label: '店舗への依頼' },
    { id: 'employee', label: '社員への依頼' },
    { id: 'team', label: 'タスクフォースへの依頼' },
  ];

  const METHOD_CHOICES = [
    { id: 'new', label: '新規投稿' },
    { id: 'repost', label: '再投稿' },
    { id: 'scheduled', label: '定期配信' },
  ];

  const QUESTIONS = [
    {
      id: 'q1',
      text: '毎月の月初に、各店舗へ前月のオプション売上・入会数・体験数を指定のスプレッドシートへ入力してもらいたい。',
    },
    {
      id: 'q2',
      text: 'パーソナルトレーニング売上の実績数値を、担当トレーナー本人に今月分だけ入力してもらいたい。',
    },
    {
      id: 'q3',
      text: '全店舗ではなく、PTチームのメンバーのみへGoogleフォームの回答を依頼したい。',
    },
    {
      id: 'q4',
      text: '先月、各店舗へ依頼したPOP掲示の内容を差し替えて、もう一度送りたい。',
    },
    {
      id: 'q5',
      text: '全店で行っているイベントの契約件数を、毎週月曜日に指定のスプレッドシートへ入力してもらいたい。',
    },
    {
      id: 'q6',
      text: 'ZIPにまとめた研修資料や画像を確認し、提出物を出してもらうため、該当社員のみへ今回だけ依頼したい。',
    },
  ];

  const state = {
    email: '',
    name: '',
    answers: {},
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setMessage(el, text, status) {
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('is-ok', status === 'ok');
    el.classList.toggle('is-error', status === 'error');
  }

  function buildEndpointUrl(params, callbackName) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(function (key) {
      if (params[key] !== undefined && params[key] !== null) {
        query.set(key, String(params[key]));
      }
    });
    if (callbackName) query.set('callback', callbackName);
    query.set('source', 'todo-list-guide');
    return endpoint + (endpoint.indexOf('?') >= 0 ? '&' : '?') + query.toString();
  }

  function callQuizEndpointWithJson(params) {
    if (!window.fetch) return Promise.reject(new Error('fetch unavailable'));

    return fetch(buildEndpointUrl(params), {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
    }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    });
  }

  function callQuizEndpointWithJsonp(params) {
    return new Promise(function (resolve, reject) {
      const callbackName = '__todoQuiz_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      let timer = null;

      function cleanup() {
        if (timer) window.clearTimeout(timer);
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callbackName] = function (response) {
        cleanup();
        resolve(response || {});
      };

      script.async = true;
      script.src = buildEndpointUrl(params, callbackName);
      script.onerror = function () {
        cleanup();
        reject(new Error('送信できませんでした。'));
      };
      timer = window.setTimeout(function () {
        cleanup();
        reject(new Error('送信がタイムアウトしました。'));
      }, 30000);

      document.head.appendChild(script);
    });
  }

  function callQuizEndpoint(params) {
    if (!endpoint) return Promise.reject(new Error('集計URLが未設定です。'));
    if (endpoint.indexOf('script.google.com/') >= 0) {
      return callQuizEndpointWithJsonp(params).catch(function () {
        return callQuizEndpointWithJson(params);
      });
    }
    return callQuizEndpointWithJson(params).catch(function () {
      return callQuizEndpointWithJsonp(params);
    });
  }

  function renderChoiceGroup(question, kind, label, choices) {
    const buttons = choices.map(function (choice) {
      return (
        '<button type="button" class="test-choice" data-question-id="' +
        question.id +
        '" data-choice-kind="' +
        kind +
        '" data-answer-id="' +
        choice.id +
        '">' +
        escapeHtml(choice.label) +
        '</button>'
      );
    }).join('');

    return (
      '<div class="test-choice-group">' +
      '<p>' +
      escapeHtml(label) +
      '</p>' +
      '<div class="test-choice-grid">' +
      buttons +
      '</div>' +
      '</div>'
    );
  }

  function renderQuestions(container) {
    container.innerHTML = QUESTIONS.map(function (question, index) {
      return (
        '<section class="test-question">' +
        '<h3><span>' +
        String(index + 1).padStart(2, '0') +
        '</span>' +
        escapeHtml(question.text) +
        '</h3>' +
        '<div class="test-choice-pair">' +
        renderChoiceGroup(question, 'target', '誰に送るか', TARGET_CHOICES) +
        renderChoiceGroup(question, 'method', 'どう送るか', METHOD_CHOICES) +
        '</div>' +
        '</section>'
      );
    }).join('');
  }

  function isQuestionAnswered(question) {
    return !!(state.answers[question.id]?.target && state.answers[question.id]?.method);
  }

  function getAnsweredCount() {
    return QUESTIONS.filter(isQuestionAnswered).length;
  }

  function updateProgress() {
    const progress = document.querySelector('[data-test-progress]');
    const submit = document.querySelector('[data-test-submit]');
    const message = document.querySelector('[data-test-submit-message]');
    const answered = getAnsweredCount();

    if (progress) progress.textContent = answered + ' / ' + QUESTIONS.length;
    if (submit) submit.disabled = answered !== QUESTIONS.length;
    setMessage(
      message,
      answered === QUESTIONS.length ? '送信できます。' : '各問題で「誰に送るか」「どう送るか」を選ぶと送信できます。',
      answered === QUESTIONS.length ? 'ok' : ''
    );
  }

  function bindChoices(container) {
    container.addEventListener('click', function (event) {
      const button = event.target.closest('.test-choice');
      if (!button) return;

      const questionId = button.dataset.questionId;
      const kind = button.dataset.choiceKind;
      const answerId = button.dataset.answerId;

      if (!state.answers[questionId]) state.answers[questionId] = {};
      state.answers[questionId][kind] = answerId;

      container.querySelectorAll(
        '.test-choice[data-question-id="' +
          questionId +
          '"][data-choice-kind="' +
          kind +
          '"]'
      ).forEach(function (choice) {
        choice.classList.toggle('is-selected', choice === button);
      });
      updateProgress();
    });
  }

  function showQuiz(response) {
    const authPanel = document.querySelector('[data-test-auth]');
    const quizPanel = document.querySelector('[data-test-quiz]');
    const user = document.querySelector('[data-test-user]');
    const questions = document.querySelector('[data-test-questions]');

    state.name = response.name || '';
    if (authPanel) authPanel.hidden = true;
    if (quizPanel) quizPanel.hidden = false;
    if (user) user.textContent = state.name ? state.name + ' さん' : state.email;
    if (questions && !questions.dataset.rendered) {
      renderQuestions(questions);
      bindChoices(questions);
      questions.dataset.rendered = 'true';
    }
    updateProgress();
  }

  function showResult(response) {
    const result = document.querySelector('[data-test-result]');
    const quizPanel = document.querySelector('[data-test-quiz]');
    const passed = !!response.passed;
    const score = typeof response.score === 'number' ? response.score : null;
    const total = typeof response.total === 'number' ? response.total : QUESTIONS.length;

    if (quizPanel) quizPanel.hidden = true;
    if (!result) return;

    result.hidden = false;
    result.classList.toggle('is-pass', passed);
    result.classList.toggle('is-fail', !passed);
    result.innerHTML =
      '<strong>' +
      (passed ? '確認完了' : '未合格') +
      '</strong>' +
      '<span>' +
      (score === null ? '' : score + ' / ' + total + '　') +
      escapeHtml(response.message || (passed ? '合格として記録しました。' : '結果を記録しました。')) +
      '</span>' +
      '<a class="btn btn-secondary" href="quiz.html">もう一度受ける</a>';
  }

  function initAuth() {
    const form = document.querySelector('[data-test-auth-form]');
    const emailInput = document.querySelector('[data-test-email]');
    const message = document.querySelector('[data-test-auth-message]');

    if (!form || !emailInput) return;

    try {
      const savedEmail = window.localStorage.getItem(STORAGE_KEY);
      if (savedEmail && !emailInput.value) emailInput.value = savedEmail;
    } catch (err) {
      // Local storage is only a convenience for faster repeat access.
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const email = emailInput.value.trim();

      if (!email || !emailInput.checkValidity()) {
        setMessage(message, 'メールアドレスを確認してください。', 'error');
        emailInput.focus();
        return;
      }

      state.email = email;
      try {
        window.localStorage.setItem(STORAGE_KEY, email);
      } catch (err) {
        // The quiz can still proceed without remembering the email.
      }
      setMessage(message, '開始します。', 'ok');
      showQuiz({ ok: true });
    });
  }

  function initSubmit() {
    const form = document.querySelector('[data-test-form]');
    const submit = document.querySelector('[data-test-submit]');
    const message = document.querySelector('[data-test-submit-message]');

    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (getAnsweredCount() !== QUESTIONS.length) {
        setMessage(message, '各問題で「誰に送るか」と「どう送るか」を選んでください。', 'error');
        return;
      }

      const details = QUESTIONS.map(function (question) {
        return {
          questionId: question.id,
          target: state.answers[question.id].target,
          method: state.answers[question.id].method,
        };
      });

      if (submit) {
        submit.disabled = true;
        submit.textContent = '送信中';
      }
      setMessage(message, '送信しています。', '');

      callQuizEndpoint({
        action: 'submit',
        email: state.email,
        answers: JSON.stringify(details),
        details: JSON.stringify(details),
        submittedAt: new Date().toISOString(),
      })
        .then(function (response) {
          if (!response.ok) throw new Error(response.message || '記録できませんでした。');
          showResult(response);
        })
        .catch(function (error) {
          setMessage(message, error.message || '送信できませんでした。', 'error');
          if (submit) {
            submit.disabled = false;
            submit.textContent = '結果を送信';
          }
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAuth();
    initSubmit();
  });
})();
