/**
 * 動画プレーヤー（MP4 自前ホスト / YouTube / Drive）
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

  function buildSource(video) {
    const mp4 = resolveMp4Src(video);
    if (mp4) {
      return { type: 'mp4', src: mp4, poster: String(video.poster || '').trim() };
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

  function renderNativePlayer(wrap, source, title, isDemo) {
    wrap.classList.add('video-native');
    wrap.innerHTML =
      '<video class="guide-video" playsinline preload="metadata"' +
      (source.poster ? ' poster="' + source.poster + '"' : '') +
      '>' +
      '<source src="' + source.src + '" type="video/mp4" />' +
      'お使いのブラウザは動画再生に対応していません。' +
      '</video>' +
      '<button type="button" class="video-play-overlay" aria-label="動画を再生">' +
      playIconSvg() +
      '<span class="play-label">再生</span>' +
      (isDemo ? '<span class="play-demo-badge">サンプル</span>' : '') +
      '</button>';

    const video = wrap.querySelector('video');
    const overlay = wrap.querySelector('.video-play-overlay');

    overlay.addEventListener('click', function () {
      overlay.classList.add('is-hidden');
      video.controls = true;
      video.play().catch(function () {
        overlay.classList.remove('is-hidden');
        video.controls = false;
      });
    });

    video.addEventListener('ended', function () {
      overlay.classList.remove('is-hidden');
      video.controls = false;
      video.currentTime = 0;
    });

    video.addEventListener('pause', function () {
      if (video.currentTime > 0 && !video.ended && video.readyState >= 2) {
        /* 一時停止時はオーバーレイは出さない（コントロールで再開） */
      }
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
      renderNativePlayer(wrap, source, video.title, !hasOwnMp4 && !!cfg.useDemoWhenEmpty);
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
            video.play().catch(function () {});
          }
          requestFs(video);
        } else {
          requestFs(iframe || wrap);
        }
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

    const launch = document.getElementById('launch-date');
    if (launch && cfg.launchDate) launch.textContent = cfg.launchDate + ' より本番運用';

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
    }

    const contact = document.getElementById('contact-block');
    if (contact && cfg.contactEmail) {
      contact.innerHTML =
        '<p>ご不明点は <a href="mailto:' +
        cfg.contactEmail +
        '">' +
        (cfg.contactLabel || 'お問い合わせ') +
        '</a> までご連絡ください。</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initConfig();
    initVideos();
    initNav();
    initMobileMenu();
  });
})();
