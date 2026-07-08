/**
 * 動画プレーヤー（MP4 自前ホスト / YouTube / Drive）
 * 拡張章: 字幕（VTT）・音声ガイド・所属タブ
 */
(function () {
  const cfg = window.GUIDE_CONFIG || {};

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
      videoEl.play().catch(function (err) {
        const message = String(err?.message || '');
        const interrupted = err?.name === 'AbortError' || /interrupted/i.test(message);
        if (videoEl.dataset.narrationMode === 'cue-audio' && interrupted) return;
        overlay.classList.remove('is-hidden');
        videoEl.controls = false;
      });
    });

    videoEl.addEventListener('play', function () {
      videoEl.volume = 1;
      if (videoEl.dataset.narrationMode !== 'cue-audio') {
        videoEl.muted = false;
      }
    });

    videoEl.addEventListener('ended', function () {
      overlay.classList.remove('is-hidden');
      videoEl.controls = false;
      videoEl.currentTime = 0;
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

  function padCueNumber(index) {
    return String(index + 1).padStart(3, '0');
  }

  function buildNarrationUrl(videoKey, index) {
    const key = String(videoKey || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!key) return '';
    return resolveAssetUrl('audio/' + key + '/' + padCueNumber(index) + '.wav');
  }

  function bindCustomCaptions(wrap, videoEl, vttUrl, videoKey) {
    if (!vttUrl) return;

    videoEl.dataset.narrationMode = 'cue-audio';

    const cap = document.createElement('div');
    cap.className = 'video-caption';
    cap.setAttribute('aria-live', 'polite');
    wrap.appendChild(cap);

    let cues = [];
    let currentCueId = '';
    let spokenCueId = '';
    let isNarrating = false;
    let narrationAvailable = true;
    const audioEl = document.createElement('audio');

    audioEl.className = 'guide-narration-audio';
    audioEl.preload = 'auto';
    audioEl.volume = 1;
    wrap.appendChild(audioEl);

    function reloadCues() {
      return loadVttCues(vttUrl).then(function (list) {
        cues = list.map(function (cue, index) {
          return Object.assign({}, cue, {
            cueId: videoKey + '-' + index + '-' + cue.start,
            narrationSrc: buildNarrationUrl(videoKey, index),
          });
        });
        if (cues[0]?.narrationSrc) {
          audioEl.src = cues[0].narrationSrc;
        }
        updateCaption();
        return list;
      });
    }

    reloadCues();

    function showCaption(cue) {
      if (!cue) {
        cap.innerHTML = '';
        cap.classList.remove('is-visible');
        currentCueId = '';
        return;
      }
      if (currentCueId !== cue.cueId) {
        cap.innerHTML = formatCaptionHtml(cue.text);
        currentCueId = cue.cueId;
      }
      cap.classList.add('is-visible');
    }

    function getActiveCue() {
      const t = videoEl.currentTime;
      return cues.find(function (c) {
        return t >= c.start && t < c.end;
      });
    }

    function stopNarration() {
      audioEl.pause();
      audioEl.removeAttribute('src');
      audioEl.load();
      isNarrating = false;
    }

    function finishNarration(shouldResume) {
      isNarrating = false;
      if (shouldResume && !videoEl.ended) {
        videoEl.play().catch(function () {});
      }
    }

    function fallbackToNativeAudio() {
      narrationAvailable = false;
      videoEl.dataset.narrationMode = 'native-audio';
      videoEl.muted = false;
      videoEl.volume = 1;
    }

    function playCueNarration(cue, forceResume) {
      if (!cue || !cue.narrationSrc || !narrationAvailable) return;
      if (isNarrating || spokenCueId === cue.cueId) return;

      const shouldResume = !!forceResume || (!videoEl.paused && !videoEl.ended);
      spokenCueId = cue.cueId;
      isNarrating = true;
      showCaption(cue);
      videoEl.volume = 1;

      function pauseForNarration() {
        if (!isNarrating || !narrationAvailable) return;
        videoEl.muted = true;
        if (!videoEl.paused) videoEl.pause();
      }

      audioEl.onended = function () {
        finishNarration(shouldResume);
      };
      audioEl.onerror = function () {
        fallbackToNativeAudio();
        finishNarration(shouldResume);
      };
      audioEl.onplaying = pauseForNarration;
      audioEl.src = cue.narrationSrc;
      audioEl.currentTime = 0;
      audioEl.play().then(pauseForNarration).catch(function (err) {
        console.warn('[guide] Narration audio failed:', cue.narrationSrc, err);
        fallbackToNativeAudio();
        finishNarration(shouldResume);
      });
      window.setTimeout(function () {
        if (isNarrating && audioEl.paused && audioEl.currentTime === 0) {
          fallbackToNativeAudio();
          finishNarration(shouldResume);
        }
      }, 1800);
    }

    function updateCaption() {
      if (!cues.length) {
        showCaption(null);
        return;
      }

      const active = getActiveCue();
      if (active) {
        showCaption(active);
        if (!videoEl.paused && !videoEl.ended) {
          playCueNarration(active);
        }
      } else {
        showCaption(null);
      }
    }

    videoEl.addEventListener('timeupdate', updateCaption);
    videoEl.addEventListener('seeked', function () {
      stopNarration();
      spokenCueId = '';
      updateCaption();
    });
    videoEl.addEventListener('play', function () {
      if (!cues.length) {
        reloadCues().then(updateCaption);
      } else {
        updateCaption();
      }
    });
    videoEl.addEventListener('pause', function () {
      updateCaption();
    });
    videoEl.addEventListener('ended', function () {
      stopNarration();
      showCaption(null);
      spokenCueId = '';
      if (narrationAvailable) videoEl.muted = true;
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
    toolbar.innerHTML =
      '<div class="video-toolbar-left">' +
      '<span class="video-label">' +
      (video.title || '解説動画') +
      '</span>' +
      (video.duration ? '<span class="video-duration-hint">' + video.duration + '</span>' : '') +
      '</div>';

    const wrap = container.querySelector('.video-frame-wrap');
    if (wrap) container.insertBefore(toolbar, wrap);
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

  function initQuiz() {
    const quiz = document.querySelector('[data-quiz]');
    if (!quiz) return;

    const items = Array.from(quiz.querySelectorAll('.quiz-item'));
    const result = quiz.querySelector('[data-quiz-result]');
    const complete = quiz.querySelector('[data-quiz-complete]');

    function updateScore() {
      const correct = items.filter(function (item) {
        return item.dataset.correct === 'true';
      }).length;
      const passed = correct === items.length;
      if (result) {
        result.textContent = correct + ' / ' + items.length;
        result.classList.toggle('is-complete', passed);
      }
      if (complete) {
        complete.hidden = !passed;
      }
    }

    items.forEach(function (item) {
      const buttons = Array.from(item.querySelectorAll('.quiz-options button'));
      const feedback = item.querySelector('.quiz-feedback');
      const answer = buttons.find(function (button) {
        return button.dataset.correct === 'true';
      });

      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          const ok = button.dataset.correct === 'true';
          buttons.forEach(function (b) {
            b.classList.remove('is-selected', 'is-correct', 'is-wrong');
          });
          button.classList.add('is-selected', ok ? 'is-correct' : 'is-wrong');
          if (!ok && answer) answer.classList.add('is-correct');
          item.dataset.correct = ok ? 'true' : 'false';
          if (feedback) {
            feedback.textContent = ok
              ? '正解です。'
              : '正解は「' + (answer?.textContent || '') + '」です。';
            feedback.classList.toggle('is-ok', ok);
          }
          updateScore();
        });
      });
    });

    updateScore();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initConfig();
    initVideos();
    initPathTabs();
    initQuiz();
    initNav();
    initMobileMenu();
  });
})();
