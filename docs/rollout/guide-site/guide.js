/**
 * 動画プレーヤー（MP4 自前ホスト / YouTube / Drive）
 * 拡張章: 字幕（VTT）・章ジャンプ・所属タブ
 */
(function () {
  const cfg = window.GUIDE_CONFIG || {};
  const LESSON_KEYS = ['register', 'checklist', 'request', 'repost', 'scheduled'];
  const PROGRESS_STORAGE_KEY = 'todo-list-guide-progress-v2';
  const SPEECH_ON_LABEL = '音声ガイド ON';
  const SPEECH_STOP_LABEL = '音声ガイド停止';
  let activeSpeechButton = null;
  const GUIDE_NOTES = {
    register: [
      '店舗共用メールではなく、社員個人に発行されたメールアドレスでログインします。',
      '名前・役職・チームを登録します。店舗エリア所属の方はエリアと管轄店舗も選びます。',
      'EAST本部所属の方は、本部所属として登録すれば店舗選択は不要です。',
    ],
    checklist: [
      '依頼を受け取ったら、まずリストチェックを開いて未実施タブを確認します。',
      '店舗依頼は店舗ごとに完了します。担当店舗が複数ある場合は店舗名で絞り込めます。',
      '誤って完了した場合は、実施済みタブから取り消せます。',
    ],
    request: [
      '社員依頼、店舗依頼、TFチーム依頼の3種類から選びます。',
      '配信先は役職・店舗・チームで絞り込み、対象外にしたい人は個別に外せます。',
      '画像・PDF・ZIPを添付できます。画像が多い場合はZIPにまとめると見やすくなります。',
    ],
    repost: [
      '再投稿は、過去に新規投稿で送った依頼を再利用する機能です。',
      '内容・URL・添付・配信先は引き継がれますが、期限は毎回選び直します。',
      '毎月自動で送りたい依頼は、再投稿ではなく定期配信を使います。',
    ],
    scheduled: [
      '定期配信は、毎月決まった日に同じTo Doを自動で送る設定です。',
      '配信時刻は午前10時固定です。期限は月末または指定日から選べます。',
      '今月分を作成しない場合は、登録時のオプションを使います。',
    ],
  };

  function readProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function writeProgress(progress) {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      /* ignore */
    }
  }

  function setLessonComplete(key, done) {
    if (!LESSON_KEYS.includes(key)) return;
    const progress = readProgress();
    progress[key] = !!done;
    writeProgress(progress);
    updateLearningProgress();
    updateVideoCompletionState(key);
  }

  function isLessonComplete(key) {
    return !!readProgress()[key];
  }

  function updateLearningProgress() {
    const progress = readProgress();
    const doneCount = LESSON_KEYS.filter(function (key) {
      return progress[key];
    }).length;
    const total = LESSON_KEYS.length;
    const pct = total ? Math.round((doneCount / total) * 100) : 0;

    const countEl = document.getElementById('learning-progress-count');
    const textEl = document.getElementById('learning-progress-text');
    const ring = document.getElementById('learning-progress-ring');
    if (countEl) countEl.textContent = doneCount + '/' + total;
    if (ring) ring.style.setProperty('--learning-progress', pct + '%');
    if (textEl) {
      textEl.textContent =
        doneCount === total
          ? '基本動画はすべて確認済みです。必要に応じて復習してください。'
          : 'あと ' + (total - doneCount) + ' 本で基本操作をひと通り確認できます。';
    }

    document.querySelectorAll('[data-lesson-card]').forEach(function (card) {
      const key = card.getAttribute('data-lesson-card');
      const done = !!progress[key];
      card.classList.toggle('is-complete', done);
      const status = card.querySelector('.lesson-status');
      if (status) status.textContent = done ? '視聴済み' : '未視聴';
    });
  }

  function updateVideoCompletionState(key) {
    document.querySelectorAll('[data-video="' + key + '"]').forEach(function (container) {
      const done = isLessonComplete(key);
      container.classList.toggle('is-complete', done);
      const btn = container.querySelector('[data-complete-button]');
      if (btn) {
        btn.classList.toggle('is-complete', done);
        btn.textContent = done ? '視聴済みにしました' : '視聴済みにする';
        btn.setAttribute('aria-pressed', done ? 'true' : 'false');
      }
    });
  }

  function stopSpeech() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    document.querySelectorAll('.speech-button.is-speaking').forEach(function (btn) {
      btn.classList.remove('is-speaking');
      btn.textContent = SPEECH_ON_LABEL;
    });
    activeSpeechButton = null;
  }

  function speakGuideText(text, button, options) {
    const force = !!(options && options.force);
    if (!('speechSynthesis' in window)) {
      if (!force) alert('このブラウザでは読み上げ機能を利用できません。');
      return;
    }
    if (button && button.classList.contains('is-speaking') && !force) {
      stopSpeech();
      return;
    }
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = function () {
      if (activeSpeechButton === button) stopSpeech();
    };
    utterance.onerror = stopSpeech;
    if (button) {
      activeSpeechButton = button;
      button.classList.add('is-speaking');
      button.textContent = SPEECH_STOP_LABEL;
    }
    window.speechSynthesis.speak(utterance);
  }

  function extractYouTubeId(input) {
    if (!input) return '';
    const s = String(input).trim();
    const m = s.match(/(?:youtube\.com\/embed\/|youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    return '';
  }

  function extractDriveId(input) {
    if (!input) return '';
    const s = String(input).trim();
    const m = s.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s;
    return '';
  }

  function resolveMp4Src(video) {
    const mp4 = String(video.mp4 || '').trim();
    if (mp4) return mp4;
    if (cfg.useDemoWhenEmpty && cfg.demoMp4) return cfg.demoMp4;
    return '';
  }

  function resolveAssetUrl(path) {
    const p = String(path || '').trim();
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) return p;
    try {
      return new URL(p, window.location.href).href;
    } catch (e) {
      return p;
    }
  }

  function buildSource(video) {
    const mp4 = resolveMp4Src(video);
    if (mp4) {
      return {
        type: 'mp4',
        src: resolveAssetUrl(mp4),
        poster: resolveAssetUrl(String(video.poster || '').trim()),
        vtt: resolveAssetUrl(String(video.vtt || '').trim()),
      };
    }
    const yt = extractYouTubeId(video.youtube);
    if (yt) {
      return {
        type: 'youtube',
        src: 'https://www.youtube.com/embed/' + yt + '?rel=0&modestbranding=1',
      };
    }
    const dr = extractDriveId(video.drive);
    if (dr) {
      return {
        type: 'drive',
        src: 'https://drive.google.com/file/d/' + dr + '/preview',
      };
    }
    return null;
  }

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }

  function playIconSvg() {
    return (
      '<svg class="play-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M8 5v14l11-7z"/>' +
      '</svg>'
    );
  }

  function renderNativePlayer(wrap, source, video, isDemo, videoKey) {
    wrap.classList.add('video-native');
    const vtt = source.vtt || '';

    wrap.innerHTML =
      '<video class="guide-video" playsinline preload="metadata"' +
      (source.poster ? ' poster="' + source.poster + '"' : '') +
      '>' +
      '<source src="' +
      source.src +
      '" type="video/mp4" />' +
      'お使いのブラウザは動画再生に対応していません。' +
      '</video>' +
      '<button type="button" class="video-play-overlay" aria-label="動画を再生">' +
      playIconSvg() +
      '<span class="play-label">再生</span>' +
      (isDemo ? '<span class="play-demo-badge">サンプル</span>' : '') +
      (source.poster ? '<span class="play-poster-title">' + (video.title || '') + '</span>' : '') +
      '</button>';

    const videoEl = wrap.querySelector('video');
    const overlay = wrap.querySelector('.video-play-overlay');
    bindCustomCaptions(wrap, videoEl, vtt, videoKey);

    overlay.addEventListener('click', function () {
      overlay.classList.add('is-hidden');
      videoEl.controls = true;
      videoEl.muted = false;
      videoEl.volume = 1;
      videoEl.play().catch(function () {
        overlay.classList.remove('is-hidden');
        videoEl.controls = false;
      });
    });

    videoEl.addEventListener('play', function () {
      videoEl.muted = false;
      videoEl.volume = 1;
    });

    videoEl.addEventListener('pause', function () {
      stopSpeech();
    });

    videoEl.addEventListener('ended', function () {
      stopSpeech();
      overlay.classList.remove('is-hidden');
      videoEl.controls = false;
      videoEl.currentTime = 0;
      setLessonComplete(videoKey, true);
    });
  }

  function parseVttTime(raw) {
    const t = String(raw).trim().replace(',', '.');
    const parts = t.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return Number(t) || 0;
  }

  function parseVtt(text) {
    const cues = [];
    const normalized = String(text).replace(/\uFEFF/g, '').replace(/\r\n/g, '\n');
    const blocks = normalized.split(/\n\n+/);
    blocks.forEach(function (block) {
      const lines = block.trim().split('\n').filter(Boolean);
      if (!lines.length || lines[0] === 'WEBVTT') return;
      const timeLine = lines[0].match(
        /(\d{1,2}:\d{2}:\d{2}[.,]\d{3}|\d{1,2}:\d{2}[.,]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{3}|\d{1,2}:\d{2}[.,]\d{3})/
      );
      if (!timeLine) return;
      const body = lines.slice(1).join('\n').trim().replace(/。/g, '\n').replace(/\n+/g, '\n').trim();
      if (!body) return;
      cues.push({
        start: parseVttTime(timeLine[1]),
        end: parseVttTime(timeLine[2]),
        text: body,
      });
    });
    return cues;
  }

  function loadVttCues(url) {
    const resolved = resolveAssetUrl(url);
    if (!resolved) return Promise.resolve([]);
    return fetch(resolved, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('vtt fetch failed: ' + res.status);
        return res.text();
      })
      .then(parseVtt)
      .catch(function (err) {
        console.warn('[guide] VTT load failed:', resolved, err);
        return [];
      });
  }

  function formatCaptionHtml(text) {
    const escaped = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped.replace(/\n/g, '<br>').replace(/(<br>)+$/g, '');
  }

  function bindCustomCaptions(wrap, videoEl, vttUrl, videoKey) {
    if (!vttUrl) return;

    const cap = document.createElement('div');
    cap.className = 'video-caption';
    cap.setAttribute('aria-live', 'polite');
    wrap.appendChild(cap);

    let cues = [];
    let lastSpokenCueStart = null;

    function speakCue(active) {
      if (!active || active.start === lastSpokenCueStart) return;
      lastSpokenCueStart = active.start;
      const container = wrap.closest('.video-block');
      const button = container ? container.querySelector('.speech-button') : null;
      speakGuideText(active.text, button, { force: true });
    }

    function reloadCues() {
      return loadVttCues(vttUrl).then(function (list) {
        cues = list;
        renderLearningPanel(wrap.closest('.video-block'), cues, videoEl, videoKey);
        updateCaption();
        return list;
      });
    }

    reloadCues();

    function updateCaption() {
      if (!cues.length || videoEl.paused) {
        cap.innerHTML = '';
        cap.classList.remove('is-visible');
        return;
      }
      const t = videoEl.currentTime;
      const active = cues.find(function (c) {
        return t >= c.start && t < c.end;
      });
      if (active) {
        cap.innerHTML = formatCaptionHtml(active.text);
        cap.classList.add('is-visible');
        updateActiveChapter(wrap.closest('.video-block'), active.start);
        speakCue(active);
      } else {
        cap.innerHTML = '';
        cap.classList.remove('is-visible');
        updateActiveChapter(wrap.closest('.video-block'), null);
      }
    }

    videoEl.addEventListener('timeupdate', updateCaption);
    videoEl.addEventListener('seeked', function () {
      lastSpokenCueStart = null;
      updateCaption();
    });
    videoEl.addEventListener('play', function () {
      lastSpokenCueStart = null;
      if (!cues.length) {
        reloadCues().then(updateCaption);
      } else {
        updateCaption();
      }
    });
    videoEl.addEventListener('pause', function () {
      updateCaption();
      lastSpokenCueStart = null;
    });
  }

  function renderIframe(wrap, source, title) {
    wrap.classList.remove('video-native');
    const iframe = document.createElement('iframe');
    iframe.src = source.src;
    iframe.title = title || '解説動画';
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.setAttribute('allowfullscreen', '');
    wrap.appendChild(iframe);
  }

  function renderPlaceholder(wrap) {
    wrap.classList.remove('video-native');
    wrap.innerHTML =
      '<div class="video-placeholder">' +
      playIconSvg() +
      '<p>動画は準備中です。<br><code>videos/</code> に MP4 を置き、<code>guide-config.js</code> の <code>mp4</code> にパスを指定してください。</p>' +
      '</div>';
  }

  function ensureVideoChrome(container, videoKey, video) {
    if (container.querySelector('.video-toolbar')) return;
    const toolbar = document.createElement('div');
    toolbar.className = 'video-toolbar';
    const notes = GUIDE_NOTES[videoKey] || [];
    toolbar.innerHTML =
      '<div class="video-toolbar-left">' +
      '<span class="video-label">' +
      (video.title || '解説動画') +
      '</span>' +
      (video.duration ? '<span class="video-duration-hint">' + video.duration + '</span>' : '') +
      '</div>' +
      '<div class="video-toolbar-actions">' +
      '<button type="button" class="btn-tool speech-button">' +
      SPEECH_ON_LABEL +
      '</button>' +
      '<button type="button" class="btn-tool" data-complete-button aria-pressed="false">視聴済みにする</button>' +
      '</div>';

    const wrap = container.querySelector('.video-frame-wrap');
    if (wrap) container.insertBefore(toolbar, wrap);

    const completeBtn = toolbar.querySelector('[data-complete-button]');
    completeBtn?.addEventListener('click', function () {
      setLessonComplete(videoKey, !isLessonComplete(videoKey));
    });

    const speechBtn = toolbar.querySelector('.speech-button');
    speechBtn?.addEventListener('click', function () {
      const text = [video.title || '', notes.join('。')].filter(Boolean).join('。');
      speakGuideText(text, speechBtn);
    });

    updateVideoCompletionState(videoKey);
  }

  function renderLearningPanel(container, cues, videoEl, videoKey) {
    if (!container || !cues.length) return;
    let panel = container.querySelector('.video-learning-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'video-learning-panel';
      container.appendChild(panel);
    }

    const notes = GUIDE_NOTES[videoKey] || [];
    panel.innerHTML =
      '<div class="chapter-list">' +
      '<div class="chapter-list-header"><strong>字幕チャプター</strong><span>クリックで移動</span></div>' +
      '<div class="chapter-items"></div>' +
      '</div>' +
      '<div class="video-notes">' +
      '<div class="video-notes-header"><strong>この章の要点</strong><span>運用ルール</span></div>' +
      '<div class="video-notes-body">' +
      notes.map(function (note) {
        return '<div class="note-row">' + escapeHtml(note) + '</div>';
      }).join('') +
      '</div>' +
      '</div>';

    const chapterItems = panel.querySelector('.chapter-items');
    cues.forEach(function (cue) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chapter-button';
      button.dataset.start = String(cue.start);
      button.innerHTML =
        '<span class="chapter-time">' +
        formatTime(cue.start) +
        '</span><span class="chapter-text">' +
        escapeHtml(cue.text).replace(/\n/g, '<br>') +
        '</span>';
      button.addEventListener('click', function () {
        const overlay = container.querySelector('.video-play-overlay');
        if (overlay) overlay.classList.add('is-hidden');
        videoEl.controls = true;
        videoEl.currentTime = cue.start + 0.01;
        videoEl.play().catch(function () {
          /* playback may require direct user gesture on some browsers */
        });
      });
      chapterItems.appendChild(button);
    });
  }

  function updateActiveChapter(container, start) {
    if (!container) return;
    container.querySelectorAll('.chapter-button').forEach(function (btn) {
      btn.classList.toggle('is-active', start !== null && Number(btn.dataset.start) === start);
    });
  }

  function escapeHtml(raw) {
    return String(raw)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderVideo(container, videoKey) {
    const video = (cfg.videos || {})[videoKey];
    if (!video) return;

    const wrap = container.querySelector('.video-frame-wrap');
    if (!wrap) return;

    ensureVideoChrome(container, videoKey, video);
    wrap.innerHTML = '';
    wrap.dataset.videoKey = videoKey;

    const hasOwnMp4 = !!String(video.mp4 || '').trim();
    const source = buildSource(video);

    if (!source) {
      renderPlaceholder(wrap);
      return;
    }

    if (source.type === 'mp4') {
      renderNativePlayer(wrap, source, video, !hasOwnMp4 && !!cfg.useDemoWhenEmpty, videoKey);
      return;
    }

    renderIframe(wrap, source, video.title);
    renderLearningPanel(container, [], null, videoKey);
  }

  function initVideos() {
    document.querySelectorAll('[data-video]').forEach(function (el) {
      renderVideo(el, el.getAttribute('data-video'));
    });
  }

  function initPathTabs() {
    document.querySelectorAll('.path-tabs').forEach(function (tablist) {
      const tabs = tablist.querySelectorAll('.path-tab');
      const panels = tablist.parentElement?.querySelectorAll('.path-panel');
      if (!panels) return;

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          const target = tab.getAttribute('data-path');
          tabs.forEach(function (t) {
            const on = t === tab;
            t.classList.toggle('is-active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
          });
          panels.forEach(function (panel) {
            const isStore = panel.id === 'path-store';
            const isHq = panel.id === 'path-hq';
            const show =
              (target === 'store' && isStore) || (target === 'hq' && isHq);
            panel.classList.toggle('is-active', show);
            panel.hidden = !show;
          });
        });
      });
    });
  }

  function initNav() {
    const links = document.querySelectorAll('.nav-list a[href^="#"]');
    const sections = [];

    links.forEach(function (link) {
      const id = link.getAttribute('href').slice(1);
      const sec = document.getElementById(id);
      if (sec) sections.push({ id: id, link: link, el: sec });
    });

    function setActive() {
      let current = sections[0]?.id;
      const y = window.scrollY + 120;
      sections.forEach(function (s) {
        if (s.el.offsetTop <= y) current = s.id;
      });
      links.forEach(function (l) {
        l.classList.toggle('active', l.getAttribute('href') === '#' + current);
      });
    }

    window.addEventListener('scroll', setActive, { passive: true });
    setActive();

    links.forEach(function (link) {
      link.addEventListener('click', closeSidebar);
    });
  }

  function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      backdrop?.classList.toggle('open');
    });

    backdrop?.addEventListener('click', closeSidebar);
  }

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-backdrop')?.classList.remove('open');
  }

  function initConfig() {
    if (cfg.siteTitle) {
      document.title = cfg.siteTitle;
      const brand = document.querySelector('.site-brand span:last-child');
      if (brand) brand.textContent = cfg.siteTitle;
    }

    const appBtn = document.getElementById('btn-app');
    if (appBtn && cfg.appUrl) {
      appBtn.href = cfg.appUrl;
      appBtn.style.display = '';
    } else if (appBtn) {
      appBtn.style.display = 'none';
    }

    const checklistLink = document.getElementById('link-checklist');
    if (checklistLink && cfg.checklistUrl) {
      checklistLink.href = cfg.checklistUrl;
      checklistLink.textContent = cfg.checklistUrl;
    }

    const mailChecklistLink = document.getElementById('mail-checklist-link');
    if (mailChecklistLink && cfg.appUrl) {
      const mailUrl = cfg.appUrl + (cfg.appUrl.indexOf('?') >= 0 ? '&' : '?') + 'tab=checklist';
      mailChecklistLink.href = mailUrl;
      mailChecklistLink.textContent = mailUrl;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initConfig();
    updateLearningProgress();
    initVideos();
    initPathTabs();
    initNav();
    initMobileMenu();
  });
})();
