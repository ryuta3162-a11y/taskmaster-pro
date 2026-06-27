/**
 * 動画プレーヤー（MP4 自前ホスト / YouTube / Drive）
 * 拡張章: 字幕（VTT）・章ジャンプ・所属タブ
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

  function renderNativePlayer(wrap, source, video, isDemo) {
    wrap.classList.add('video-native');
    const vtt = source.vtt || '';
    const trackHtml = vtt
      ? '<track kind="subtitles" src="' +
        vtt +
        '" srclang="ja" label="日本語" default />'
      : '';

    wrap.innerHTML =
      '<video class="guide-video" playsinline preload="metadata"' +
      (source.poster ? ' poster="' + source.poster + '"' : '') +
      '>' +
      '<source src="' +
      source.src +
      '" type="video/mp4" />' +
      trackHtml +
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
    const block = wrap.closest('[data-video]');
    const captions = bindCustomCaptions(wrap, videoEl, vtt);
    wrap._captions = captions;

    overlay.addEventListener('click', function () {
      overlay.classList.add('is-hidden');
      videoEl.controls = true;
      enableSubtitles(videoEl, true);
      captions.setVisible(true);
      videoEl.play().catch(function () {
        overlay.classList.remove('is-hidden');
        videoEl.controls = false;
      });
    });

    videoEl.addEventListener('ended', function () {
      overlay.classList.remove('is-hidden');
      videoEl.controls = false;
      videoEl.currentTime = 0;
      updateChapterActive(block, videoEl.currentTime, video.chapters);
    });

    videoEl.addEventListener('loadedmetadata', function () {
      const hint = block?.querySelector('[data-duration-hint]');
      if (hint && videoEl.duration && isFinite(videoEl.duration)) {
        hint.textContent = '（実尺 ' + formatTime(videoEl.duration) + '）';
      }
    });

    videoEl.addEventListener('timeupdate', function () {
      updateChapterActive(block, videoEl.currentTime, video.chapters);
    });

    bindChapterList(block, videoEl, video.chapters);
    bindCcToggle(block, videoEl, captions, !!vtt);
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
      const body = lines.slice(1).join(' ').trim();
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

  function bindCustomCaptions(wrap, videoEl, vttUrl) {
    if (!vttUrl) return { setVisible: function () {}, reload: function () {} };

    const cap = document.createElement('div');
    cap.className = 'video-caption';
    cap.setAttribute('aria-live', 'polite');
    wrap.appendChild(cap);

    let cues = [];
    let visible = true;

    function reloadCues() {
      return loadVttCues(vttUrl).then(function (list) {
        cues = list;
        updateCaption();
        return list;
      });
    }

    reloadCues();

    function updateCaption() {
      if (!visible || !cues.length) {
        cap.textContent = '';
        cap.classList.remove('is-visible');
        return;
      }
      const t = videoEl.currentTime;
      const active = cues.find(function (c) {
        return t >= c.start && t < c.end;
      });
      if (active) {
        cap.textContent = active.text;
        cap.classList.add('is-visible');
      } else {
        cap.textContent = '';
        cap.classList.remove('is-visible');
      }
    }

    videoEl.addEventListener('timeupdate', updateCaption);
    videoEl.addEventListener('seeked', updateCaption);
    videoEl.addEventListener('play', function () {
      if (!cues.length) reloadCues();
    });

    return {
      setVisible: function (on) {
        visible = on;
        updateCaption();
      },
      reload: reloadCues,
    };
  }

  function enableSubtitles(videoEl, on) {
    const tracks = videoEl.textTracks;
    if (!tracks || !tracks.length) return;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = on ? 'showing' : 'hidden';
    }
  }

  function bindCcToggle(block, videoEl, captions, hasVtt) {
    const btn = block?.querySelector('[data-cc-toggle]');
    if (!btn) return;
    if (!hasVtt) {
      btn.style.display = 'none';
      return;
    }
    btn.addEventListener('click', function () {
      const showing = btn.getAttribute('aria-pressed') === 'true';
      const next = !showing;
      enableSubtitles(videoEl, next);
      captions.setVisible(next);
      btn.setAttribute('aria-pressed', next ? 'true' : 'false');
      btn.classList.toggle('is-off', !next);
    });
  }

  function updateChapterActive(block, currentTime, chapters) {
    if (!block || !chapters || !chapters.length) return;
    const list = block.closest('[data-enhanced]')?.querySelector('[data-chapter-list]');
    if (!list) return;

    let activeIdx = 0;
    chapters.forEach(function (ch, i) {
      if (currentTime >= ch.time) activeIdx = i;
    });

    list.querySelectorAll('.chapter-item').forEach(function (item, i) {
      item.classList.toggle('is-active', i === activeIdx);
      item.classList.toggle('is-past', i < activeIdx);
    });
  }

  function bindChapterList(block, videoEl, chapters) {
    if (!chapters || !chapters.length) return;
    const section = block?.closest('[data-enhanced]');
    const list = section?.querySelector('[data-chapter-list]');
    if (!list) return;

    list.innerHTML = '';
    chapters.forEach(function (ch, i) {
      const li = document.createElement('li');
      li.className = 'chapter-item' + (i === 0 ? ' is-active' : '');
      li.innerHTML =
        '<button type="button" class="chapter-btn" data-time="' +
        ch.time +
        '">' +
        '<span class="chapter-time">' +
        formatTime(ch.time) +
        '</span>' +
        '<span class="chapter-text">' +
        '<strong>' +
        ch.label +
        '</strong>' +
        (ch.desc ? '<span>' + ch.desc + '</span>' : '') +
        '</span>' +
        '</button>';
      list.appendChild(li);
    });

    list.querySelectorAll('.chapter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const t = parseFloat(btn.getAttribute('data-time') || '0');
        const wrap = block.querySelector('.video-frame-wrap');
        const overlay = wrap?.querySelector('.video-play-overlay');
        videoEl.currentTime = t;
        overlay?.classList.add('is-hidden');
        videoEl.controls = true;
        enableSubtitles(videoEl, true);
        wrap._captions?.setVisible(true);
        videoEl.play().catch(function () {});
        wrap?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
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

  function renderVideo(container, videoKey) {
    const video = (cfg.videos || {})[videoKey];
    if (!video) return;

    const wrap = container.querySelector('.video-frame-wrap');
    if (!wrap) return;

    wrap.innerHTML = '';
    wrap.dataset.videoKey = videoKey;

    const hasOwnMp4 = !!String(video.mp4 || '').trim();
    const source = buildSource(video);

    if (!source) {
      renderPlaceholder(wrap);
      return;
    }

    if (source.type === 'mp4') {
      renderNativePlayer(wrap, source, video, !hasOwnMp4 && !!cfg.useDemoWhenEmpty);
      return;
    }

    renderIframe(wrap, source, video.title);
  }

  function requestFs(el) {
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  function initVideos() {
    document.querySelectorAll('[data-video]').forEach(function (el) {
      renderVideo(el, el.getAttribute('data-video'));
    });

    document.querySelectorAll('.btn-fs').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const wrap = btn.closest('.video-block')?.querySelector('.video-frame-wrap');
        if (!wrap) return;
        const video = wrap.querySelector('video');
        const iframe = wrap.querySelector('iframe');
        if (video) {
          if (video.paused) {
            wrap.querySelector('.video-play-overlay')?.classList.add('is-hidden');
            video.controls = true;
            enableSubtitles(video, true);
            wrap._captions?.setVisible(true);
            video.play().catch(function () {});
          }
          requestFs(video);
        } else {
          requestFs(iframe || wrap);
        }
      });
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
    initVideos();
    initPathTabs();
    initNav();
    initMobileMenu();
  });
})();
