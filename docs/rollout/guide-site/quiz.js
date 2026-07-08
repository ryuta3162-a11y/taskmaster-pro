(function () {
  const cfg = window.GUIDE_CONFIG || {};
  const endpoint = String(cfg.quizResultEndpoint || '').trim();
  const QUESTIONS = [
    {
      id: 'q1',
      text: '月初作業の店舗別数値入力を依頼する場合',
      choices: [
        { id: 'store', label: '店舗への依頼' },
        { id: 'employee', label: '社員への依頼' },
        { id: 'team', label: 'TFチームの依頼' },
      ],
    },
    {
      id: 'q2',
      text: 'パーソナルトレーニング売上の金額を、担当者ごとに入力してもらう場合',
      choices: [
        { id: 'store', label: '店舗への依頼' },
        { id: 'employee', label: '社員への依頼' },
        { id: 'team', label: 'TFチームの依頼' },
      ],
    },
    {
      id: 'q3',
      text: 'PTチームだけにGoogleフォームの回答を依頼する場合',
      choices: [
        { id: 'store', label: '店舗への依頼' },
        { id: 'employee', label: '社員への依頼' },
        { id: 'team', label: 'TFチームの依頼' },
      ],
    },
    {
      id: 'q4',
      text: '初回登録で使うメールアドレス',
      choices: [
        { id: 'store-mail', label: '店舗共用メール' },
        { id: 'personal-mail', label: '社員個人の社内メール' },
        { id: 'either', label: 'どちらでもよい' },
      ],
    },
    {
      id: 'q5',
      text: '過去と似た依頼を少し変更して、もう一度送りたい場合',
      choices: [
        { id: 'new', label: '新規投稿' },
        { id: 'repost', label: '再投稿' },
        { id: 'scheduled', label: '定期配信' },
      ],
    },
    {
      id: 'q6',
      text: '毎月同じ依頼を自動で送りたい場合',
      choices: [
        { id: 'repost', label: '再投稿' },
        { id: 'scheduled', label: '定期配信' },
        { id: 'logout', label: 'ログアウト' },
      ],
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
    if (callbackName) {
      query.set('callback', callbackName);
    }
    query.set('source', 'todo-list-guide');
    return endpoint + (endpoint.indexOf('?') >= 0 ? '&' : '?') + query.toString();
  }

  function callQuizEndpointWithJson(params) {
    if (!window.fetch) {
      return Promise.reject(new Error('fetch unavailable'));
    }

    return fetch(buildEndpointUrl(params), {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
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
    if (!endpoint) {
      return Promise.reject(new Error('集計URLが未設定です。'));
    }

    return callQuizEndpointWithJson(params).catch(function () {
      return callQuizEndpointWithJsonp(params);
    });
  }

  function renderQuestions(container) {
    container.innerHTML = QUESTIONS.map(function (question, index) {
      const choices = question.choices.map(function (choice) {
        return (
          '<button type="button" class="test-choice" data-question-id="' +
          question.id +
          '" data-answer-id="' +
          choice.id +
          '">' +
          escapeHtml(choice.label) +
          '</button>'
        );
      }).join('');

      return (
        '<section class="test-question">' +
        '<h3><span>' +
        String(index + 1).padStart(2, '0') +
        '</span>' +
        escapeHtml(question.text) +
        '</h3>' +
        '<div class="test-choice-grid">' +
        choices +
        '</div>' +
        '</section>'
      );
    }).join('');
  }

  function getAnsweredCount() {
    return QUESTIONS.filter(function (question) {
      return !!state.answers[question.id];
    }).length;
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
      answered === QUESTIONS.length ? '送信できます。' : 'すべて回答すると送信できます。',
      answered === QUESTIONS.length ? 'ok' : ''
    );
  }

  function bindChoices(container) {
    container.addEventListener('click', function (event) {
      const button = event.target.closest('.test-choice');
      if (!button) return;

      const questionId = button.dataset.questionId;
      const answerId = button.dataset.answerId;
      state.answers[questionId] = answerId;

      container.querySelectorAll('.test-choice[data-question-id="' + questionId + '"]').forEach(function (choice) {
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
    if (user) {
      user.textContent = state.name ? state.name + ' さん' : state.email;
    }
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
    const button = document.querySelector('[data-test-auth-button]');
    const message = document.querySelector('[data-test-auth-message]');

    if (!form || !emailInput) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const email = emailInput.value.trim();

      if (!email || !emailInput.checkValidity()) {
        setMessage(message, 'メールアドレスを確認してください。', 'error');
        emailInput.focus();
        return;
      }

      state.email = email;
      if (button) {
        button.disabled = true;
        button.textContent = '確認中';
      }
      setMessage(message, '確認しています。', '');

      callQuizEndpoint({ action: 'verify', email: email })
        .then(function (response) {
          if (!response.ok) {
            throw new Error(response.message || 'メールアドレスを確認できませんでした。');
          }
          setMessage(message, '確認できました。', 'ok');
          showQuiz(response);
        })
        .catch(function (error) {
          setMessage(message, error.message || 'メールアドレスを確認できませんでした。', 'error');
        })
        .finally(function () {
          if (button) {
            button.disabled = false;
            button.textContent = '開始';
          }
        });
    });
  }

  function initSubmit() {
    const form = document.querySelector('[data-test-form]');
    const submit = document.querySelector('[data-test-submit]');
    const message = document.querySelector('[data-test-submit-message]');

    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const answered = getAnsweredCount();
      if (answered !== QUESTIONS.length) {
        setMessage(message, 'すべて回答してください。', 'error');
        return;
      }

      const details = QUESTIONS.map(function (question) {
        return {
          questionId: question.id,
          answerId: state.answers[question.id],
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
        answers: JSON.stringify(details.map(function (answer) {
          return answer.answerId;
        })),
        details: JSON.stringify(details),
        submittedAt: new Date().toISOString(),
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error(response.message || '記録できませんでした。');
          }
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
