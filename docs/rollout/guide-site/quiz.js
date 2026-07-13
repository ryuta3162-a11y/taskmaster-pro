(function () {
  const cfg = window.GUIDE_CONFIG || {};
  const endpoint = String(cfg.quizResultEndpoint || '').trim();
  const STORAGE_KEY = 'todoGuideQuizEmail';

  const TARGET_CHOICES = [
    { id: 'store', label: '店舗への依頼', hint: '店舗単位で完了' },
    { id: 'employee', label: '社員への依頼', hint: '個人が完了' },
    { id: 'team', label: 'TFチームの依頼', hint: 'チームメンバーが完了' },
  ];

  const METHOD_CHOICES = [
    { id: 'new', label: '新規投稿', hint: '今回だけ送る' },
    { id: 'repost', label: '再投稿', hint: '過去の依頼を再利用' },
    { id: 'scheduled', label: '定期配信', hint: '毎月・毎週など自動' },
  ];

  const QUESTIONS = [
    {
      id: 'q1',
      text: '毎月初め、全店舗へ前月の売上・入会数・体験数の入力依頼（毎月繰り返し）',
    },
    {
      id: 'q2',
      text: '担当トレーナー本人に、今月分のPT売上実績を入力してもらう（今回だけ）',
    },
    {
      id: 'q3',
      text: 'PTチームのメンバーだけに、Googleフォームの回答依頼（全店舗ではない）',
    },
    {
      id: 'q4',
      text: '先月送ったPOP掲示の内容を差し替えて、各店舗へもう一度送る',
    },
    {
      id: 'q5',
      text: '全店のイベント契約件数を、毎週月曜に入力してもらう（毎週繰り返し）',
    },
    {
      id: 'q6',
      text: '研修資料（ZIP）の確認・提出を、該当社員だけに今回だけ依頼',
    },
  ];

  const state = {
    email: '',
    name: '',
    answers: {},
    lastMarks: null,
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

  function renderChoiceButton(question, kind, choice) {
    const hint = choice.hint
      ? '<span class="test-choice-hint">' + escapeHtml(choice.hint) + '</span>'
      : '';
    return (
      '<button type="button" class="test-choice" data-question-id="' +
      question.id +
      '" data-choice-kind="' +
      kind +
      '" data-answer-id="' +
      choice.id +
      '">' +
      '<span class="test-choice-label">' +
      escapeHtml(choice.label) +
      '</span>' +
      hint +
      '</button>'
    );
  }

  function renderChoiceGroup(question, kind, label, choices) {
    const buttons = choices.map(function (choice) {
      return renderChoiceButton(question, kind, choice);
    }).join('');

    return (
      '<div class="test-choice-group" data-choice-group="' +
      kind +
      '">' +
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
        '<section class="test-question" data-question-id="' +
        question.id +
        '">' +
        '<h3><span>' +
        String(index + 1).padStart(2, '0') +
        '</span>' +
        escapeHtml(question.text) +
        '</h3>' +
        '<div class="test-choice-pair">' +
        renderChoiceGroup(question, 'target', '① 依頼の種類', TARGET_CHOICES) +
        renderChoiceGroup(question, 'method', '② 配信方法', METHOD_CHOICES) +
        '</div>' +
        '<p class="test-question-feedback" data-question-feedback hidden aria-live="polite"></p>' +
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

  function getUnansweredQuestions() {
    return QUESTIONS.filter(function (question) {
      return !isQuestionAnswered(question);
    });
  }

  function updateProgress() {
    const progress = document.querySelector('[data-test-progress]');
    const submit = document.querySelector('[data-test-submit]');
    const message = document.querySelector('[data-test-submit-message]');
    const answered = getAnsweredCount();
    const unanswered = getUnansweredQuestions();

    if (progress) progress.textContent = answered + ' / ' + QUESTIONS.length;
    if (submit) submit.disabled = answered !== QUESTIONS.length;

    QUESTIONS.forEach(function (question, index) {
      const section = document.querySelector(
        '.test-question[data-question-id="' + question.id + '"]'
      );
      const feedback = section?.querySelector('[data-question-feedback]');
      if (!feedback) return;

      const missingTarget = !state.answers[question.id]?.target;
      const missingMethod = !state.answers[question.id]?.method;
      if (missingTarget || missingMethod) {
        const parts = [];
        if (missingTarget) parts.push('① 依頼の種類');
        if (missingMethod) parts.push('② 配信方法');
        feedback.hidden = false;
        feedback.textContent = parts.join('と') + 'を選んでください';
        feedback.classList.add('is-missing');
      } else {
        feedback.hidden = true;
        feedback.textContent = '';
        feedback.classList.remove('is-missing');
      }
    });

    if (answered === QUESTIONS.length) {
      setMessage(message, '送信できます。', 'ok');
      return;
    }

    if (unanswered.length === 1) {
      const index = QUESTIONS.indexOf(unanswered[0]) + 1;
      setMessage(message, index + '問目で①②の両方を選んでください。', 'error');
      return;
    }

    setMessage(
      message,
      '各問題で①依頼の種類と②配信方法の両方を選ぶと送信できます。',
      ''
    );
  }

  function restoreSelectedChoices(container) {
    QUESTIONS.forEach(function (question) {
      const selected = state.answers[question.id] || {};
      ['target', 'method'].forEach(function (kind) {
        const answerId = selected[kind];
        if (!answerId) return;
        const button = container.querySelector(
          '.test-choice[data-question-id="' +
            question.id +
            '"][data-choice-kind="' +
            kind +
            '"][data-answer-id="' +
            answerId +
            '"]'
        );
        if (button) button.classList.add('is-selected');
      });
    });
  }

  function restoreSelectedChoices(container) {
    if (!Array.isArray(marks)) return;

    marks.forEach(function (mark, index) {
      const question = QUESTIONS[index];
      if (!question || mark === '○') return;

      const section = document.querySelector(
        '.test-question[data-question-id="' + question.id + '"]'
      );
      if (!section) return;

      section.classList.add('is-wrong');
      const feedback = section.querySelector('[data-question-feedback]');
      if (feedback) {
        feedback.hidden = false;
        feedback.textContent = '不正解です。①②を見直してください';
        feedback.classList.add('is-wrong');
        feedback.classList.remove('is-missing');
      }
    });
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

      const section = container.querySelector(
        '.test-question[data-question-id="' + questionId + '"]'
      );
      if (section) section.classList.remove('is-wrong');

      updateProgress();
    });
  }

  function showIntro() {
    const intro = document.querySelector('[data-test-intro]');
    const quizBody = document.querySelector('[data-test-quiz-body]');
    if (intro) intro.hidden = false;
    if (quizBody) quizBody.hidden = true;
  }

  function showQuizBody() {
    const intro = document.querySelector('[data-test-intro]');
    const quizBody = document.querySelector('[data-test-quiz-body]');
    if (intro) intro.hidden = true;
    if (quizBody) quizBody.hidden = false;
  }

  function showQuiz(response) {
    const authPanel = document.querySelector('[data-test-auth]');
    const quizPanel = document.querySelector('[data-test-quiz]');
    const result = document.querySelector('[data-test-result]');
    const user = document.querySelector('[data-test-user]');
    const questions = document.querySelector('[data-test-questions]');

    state.name = response.name || '';
    if (authPanel) authPanel.hidden = true;
    if (quizPanel) quizPanel.hidden = false;
    if (result) result.hidden = true;
    if (user) user.textContent = state.name ? state.name + ' さん' : state.email;

    if (questions && !questions.dataset.rendered) {
      renderQuestions(questions);
      bindChoices(questions);
      questions.dataset.rendered = 'true';
    }

    if (state.lastMarks) {
      showQuizBody();
      restoreSelectedChoices(questions);
      applyWrongQuestionMarks(state.lastMarks);
      const firstWrong = QUESTIONS.findIndex(function (_question, index) {
        return state.lastMarks[index] === '×';
      });
      if (firstWrong >= 0) {
        const section = questions.querySelectorAll('.test-question')[firstWrong];
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      showIntro();
    }

    updateProgress();
  }

  function buildResultBreakdown(marks) {
    if (!Array.isArray(marks) || !marks.length) return '';

    const items = marks.map(function (mark, index) {
      const cls = mark === '○' ? 'is-ok' : 'is-ng';
      return (
        '<li class="test-result-item ' +
        cls +
        '"><span>' +
        String(index + 1) +
        '問目</span><strong>' +
        mark +
        '</strong></li>'
      );
    });

    return '<ul class="test-result-breakdown">' + items.join('') + '</ul>';
  }

  function showResult(response) {
    const result = document.querySelector('[data-test-result]');
    const quizPanel = document.querySelector('[data-test-quiz]');
    const submit = document.querySelector('[data-test-submit]');
    const passed = !!response.passed;
    const score = typeof response.score === 'number' ? response.score : null;
    const total = typeof response.total === 'number' ? response.total : QUESTIONS.length;
    const marks = Array.isArray(response.marks) ? response.marks : null;

    state.lastMarks = passed ? null : marks;

    if (quizPanel) quizPanel.hidden = true;
    if (!result) return;

    result.hidden = false;
    result.classList.toggle('is-pass', passed);
    result.classList.toggle('is-fail', !passed);

    if (passed) {
      result.innerHTML =
        '<strong>確認完了</strong>' +
        '<span>' +
        escapeHtml(response.message || '合格として記録しました。') +
        '</span>' +
        '<a class="btn btn-secondary" href="index.html#quiz">ガイドへ戻る</a>';
      return;
    }

    const wrongCount = marks ? marks.filter(function (mark) {
      return mark === '×';
    }).length : null;

    result.innerHTML =
      '<strong>未合格（' +
      (score === null ? '—' : score) +
      ' / ' +
      total +
      '）</strong>' +
      '<span>' +
      escapeHtml(
        response.message ||
          (wrongCount
            ? wrongCount + '問が不正解です。下の結果を確認して、もう一度回答してください。'
            : '結果を記録しました。もう一度回答してください。')
      ) +
      '</span>' +
      buildResultBreakdown(marks) +
      '<p class="test-result-hint">よくあるミス：①②のどちらか一方だけ選んでいる／依頼の種類と配信方法を取り違えている</p>' +
      '<button type="button" class="btn btn-secondary" data-test-retry>もう一度回答する</button>';

    const retry = result.querySelector('[data-test-retry]');
    if (retry) {
      retry.addEventListener('click', function () {
        if (submit) {
          submit.disabled = getAnsweredCount() !== QUESTIONS.length;
          submit.textContent = '結果を送信';
        }
        showQuiz({ ok: true, name: state.name });
      });
    }
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
      state.lastMarks = null;
      try {
        window.localStorage.setItem(STORAGE_KEY, email);
      } catch (err) {
        // The quiz can still proceed without remembering the email.
      }
      setMessage(message, '開始します。', 'ok');
      showQuiz({ ok: true });
    });
  }

  function initIntro() {
    const start = document.querySelector('[data-test-start]');
    if (!start) return;

    start.addEventListener('click', function () {
      showQuizBody();
      const questions = document.querySelector('[data-test-questions]');
      if (questions) {
        const first = questions.querySelector('.test-question');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
        setMessage(message, '各問題で①依頼の種類と②配信方法の両方を選んでください。', 'error');
        updateProgress();
        const firstMissing = getUnansweredQuestions()[0];
        if (firstMissing) {
          const section = document.querySelector(
            '.test-question[data-question-id="' + firstMissing.id + '"]'
          );
          if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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
    initIntro();
    initSubmit();
  });
})();
