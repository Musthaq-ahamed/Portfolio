/* ==========================================================================
   MUSTHAQ — THE SERIES · vanilla JavaScript (no framework, no build step)
   All content comes from js/data.js (window.PORTFOLIO).
   ========================================================================== */
(() => {
  'use strict';

  const D = window.PORTFOLIO;
  const { profile, education, experience, projects, achievements, certifications, certCategories, skillCategories, skillEvidence, seasons, topPicks, introSlides, viewerProfiles } = D;
  /* photos dropped into assets/projects/<id>/ and assets/malaysia/ (see tools/sync-images.py) */
  const GAL = window.GALLERY || {};
  projects.forEach((p) => { const g = GAL.projects && GAL.projects[p.id]; if (g && g.length) p.images = [...new Set([...(p.images || []), ...g])]; });
  const malaysiaPhotos = (GAL.malaysia || []).slice();
  const certCount = certifications.filter((c) => c.kind !== 'letter').length;
  const letterCount = certifications.length - certCount;

  /* ---------- tiny helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const mq = (q) => window.matchMedia(q);
  const reducedMQ = mq('(prefers-reduced-motion: reduce)');
  const fineMQ = mq('(hover: hover) and (pointer: fine)');
  const desktopMQ = mq('(min-width: 1024px)');
  const reduced = () => reducedMQ.matches;
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* storage unavailable — profile just won't persist */ } },
  };
  const STORAGE_KEY = 'musthaq-series-profile';

  /* section meta (counts are computed so they never go stale) */
  const sectionMeta = {
    about: { nav: 'About', card: 'About Me', meta: 'The Pilot • Education & roles', palette: D.sectionMeta.about.palette },
    journey: { nav: 'Journey', card: 'My Journey', meta: `${seasons.length} Seasons • ${seasons.reduce((n, s) => n + s.episodes.length, 0)} Episodes`, palette: D.sectionMeta.journey.palette },
    originals: { nav: 'Originals', card: 'My Projects', meta: `${projects.length} Originals • Live sites`, palette: D.sectionMeta.originals.palette },
    picks: { nav: 'Top Picks', card: 'Top Picks', meta: 'Top 10 from the resume', palette: D.sectionMeta.picks.palette },
    skills: { nav: 'Skills', card: 'My Skills', meta: `${skillCategories.length} Categories`, palette: D.sectionMeta.skills.palette },
    moments: { nav: 'Moments', card: 'My Achievements', meta: `${achievements.length} Moments • ${certCount} Certifications`, palette: D.sectionMeta.moments.palette },
    story: { nav: 'Resume', card: 'The Full Story', meta: 'Resume • View & download', palette: D.sectionMeta.story.palette },
  };

  /* ---------- state ---------- */
  const state = { stage: 'opening', profileId: 'musthaq', cleanups: [], overlays: [], season: seasons.length - 2, skillCat: 0, certCat: 'all', certAll: false, resumeOpen: false };
  let uid = 0;

  /* ======================================================================
     Reusable fragments
     ====================================================================== */
  const brandMark = () => `<span class="brand-mark"><img class="brand-ma" src="assets/icons/ma-gold.png" alt="" width="20" height="24" />${esc(profile.firstName)}<i></i></span>`;

  function poster(p, inner = '') {
    return `<div class="poster" style="background:radial-gradient(120% 90% at 85% 10%, ${p.via} 0%, transparent 60%),radial-gradient(90% 80% at 0% 100%, ${p.from} 0%, transparent 70%),linear-gradient(160deg, ${p.from} 0%, ${p.to} 100%)">
      <div class="beam" style="background:linear-gradient(90deg, transparent, ${p.accent}55, transparent)"></div><div class="lines"></div>${inner}<div class="shade"></div></div>`;
  }

  const MOTIFS = {
    globe: (a) => `<g fill="none" stroke="${a}"><circle cx="296" cy="112" r="78" stroke-width="2" stroke-opacity=".85"/><ellipse cx="296" cy="112" rx="34" ry="78" stroke-width="1.2" stroke-opacity=".45"/><ellipse cx="296" cy="112" rx="66" ry="78" stroke-width="1" stroke-opacity=".25"/><path d="M218 112h156M228 80h136M228 144h136" stroke-width="1" stroke-opacity=".35"/><path d="M182 232C230 150 300 120 330 78" stroke-width="2.5" stroke-dasharray="6 7" stroke-linecap="round" stroke-opacity=".9"/><circle cx="182" cy="232" r="6" fill="${a}" stroke="none"/><circle cx="330" cy="78" r="9" fill="${a}" fill-opacity=".9" stroke="none"/><circle cx="330" cy="78" r="16" stroke-width="1.5" stroke-opacity=".5"/></g>`,
    invoice: (a) => `<g fill="none" stroke="${a}" transform="translate(236 34)"><path d="M0 0H110V150L94 140L78 150L62 140L46 150L30 140L14 150L0 140Z" stroke-width="2" stroke-opacity=".85"/>${[0, 1, 2, 3].map((i) => `<line x1="16" x2="64" y1="${30 + i * 20}" y2="${30 + i * 20}" stroke-width="3" stroke-linecap="round" stroke-opacity=".4"/><line x1="76" x2="94" y1="${30 + i * 20}" y2="${30 + i * 20}" stroke-width="3" stroke-linecap="round" stroke-opacity=".7"/>`).join('')}<line x1="16" x2="94" y1="114" y2="114" stroke-width="1.5" stroke-opacity=".5"/><rect x="60" y="118" width="34" height="12" rx="3" fill="${a}" fill-opacity=".55" stroke="none"/></g>`,
    browser: (a) => `<g fill="none" stroke="${a}"><rect x="196" y="40" width="170" height="122" rx="10" stroke-width="2" stroke-opacity=".85"/><path d="M196 62H366" stroke-width="1.2" stroke-opacity=".5"/><circle cx="210" cy="51" r="3" fill="${a}" stroke="none"/><circle cx="222" cy="51" r="3" fill="${a}" fill-opacity=".6" stroke="none"/><circle cx="234" cy="51" r="3" fill="${a}" fill-opacity=".35" stroke="none"/><rect x="210" y="74" width="80" height="12" rx="3" fill="${a}" fill-opacity=".5" stroke="none"/><line x1="210" x2="270" y1="100" y2="100" stroke-width="3" stroke-linecap="round" stroke-opacity=".35"/><line x1="210" x2="256" y1="112" y2="112" stroke-width="3" stroke-linecap="round" stroke-opacity=".25"/><rect x="304" y="74" width="48" height="64" rx="6" stroke-width="1.5" stroke-opacity=".55"/><rect x="210" y="130" width="38" height="16" rx="8" fill="${a}" fill-opacity=".8" stroke="none"/></g>`,
    nodes: (a) => `<g fill="none" stroke="${a}"><path d="M250 150L300 90L350 130M300 90L290 40M250 150L330 190L350 130M250 150L214 100L290 40" stroke-width="1.5" stroke-opacity=".45"/>${[[250, 150, 12], [300, 90, 16], [350, 130, 10], [290, 40, 9], [330, 190, 11], [214, 100, 8]].map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" stroke-width="2" stroke-opacity=".9" fill="${i === 1 ? a : 'none'}" fill-opacity=".5"/>`).join('')}</g>`,
    pulse: (a) => `<g fill="none" stroke="${a}" stroke-linecap="round" stroke-linejoin="round"><rect x="214" y="44" width="40" height="40" rx="10" stroke-width="2" stroke-opacity=".7"/><path d="M234 54v20M224 64h20" stroke-width="3"/><path d="M190 148H238L252 112L274 186L292 128L304 148H372" stroke-width="3" stroke-opacity=".95"/><path d="M190 164H372" stroke-width="1" stroke-opacity=".25" stroke-dasharray="3 6"/></g>`,
    design: (a) => `<g fill="none" stroke="${a}" stroke-linecap="round" stroke-linejoin="round"><rect x="206" y="48" width="150" height="110" rx="6" stroke-width="2" stroke-opacity=".85"/>${[[206, 48], [356, 48], [206, 158], [356, 158]].map(([x, y]) => `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="#07070a" stroke-width="1.5"/>`).join('')}<path d="M226 138C256 70 296 150 336 68" stroke-width="2.4"/><circle cx="226" cy="138" r="4" fill="${a}"/><circle cx="336" cy="68" r="4" fill="${a}"/></g>`,
    factory: (a) => `<g fill="none" stroke="${a}" stroke-linejoin="round"><path d="M196 170V110L240 130V96L284 116V70H304V116L348 136V170Z" stroke-width="2" stroke-opacity=".85"/>${[0, 1, 2, 3].map((i) => `<rect x="${208 + i * 34}" y="146" width="16" height="14" rx="2" stroke-width="1.5" stroke-opacity=".5"/>`).join('')}<path d="M294 62c0-10 12-10 12-22M308 62c0-10 12-10 12-22" stroke-width="2" stroke-opacity=".4" stroke-linecap="round"/><path d="M188 170H360" stroke-width="2" stroke-opacity=".6"/></g>`,
  };

  function projectArt(p, imgIndex = 0) {
    const src = p.cover || (p.images && p.images[imgIndex]);
    if (src) {
      return `<div class="poster has-img" style="background:${p.palette.from}"><img class="cover" src="${esc(src)}" alt="${esc(p.title)}" loading="lazy" /><div class="shade"></div></div>`;
    }
    const a = p.palette.accent;
    const id = `g-${p.id}-${++uid}`;
    return poster(p.palette, `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="${id}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${a}" stop-opacity=".55"/><stop offset="100%" stop-color="${a}" stop-opacity="0"/></radialGradient></defs><circle cx="290" cy="120" r="130" fill="url(#${id})"/>${(MOTIFS[p.motif] || MOTIFS.browser)(a)}</svg>`);
  }

  function avatar(id, size = 'lg') {
    const p = viewerProfiles.find((v) => v.id === id);
    if (id === 'musthaq') {
      return `<span class="avatar ${size}" style="background:radial-gradient(circle at 50% 30%, #7a5a06, #1a1403)"><img src="assets/avatar-320.webp" alt="" /></span>`;
    }
    const glyph = { recruiter: 'R', developer: '◎', creative: '✦' }[id];
    return `<span class="avatar ${size}" style="background:linear-gradient(145deg, ${p.color}, #0b0b10 120%)"><span class="glyph">${glyph}</span></span>`;
  }

  const words = (t) => t.split(' ').map((w, i) => `<span class="w"><span style="--i:${i}">${esc(w)}</span></span>`).join(' ');
  const secHead = (kicker, title, aside = '') =>
    `<div class="sec-head gutter"><div><div class="kicker reveal-x">${esc(kicker)}</div><h2 class="words" aria-label="${esc(title)}">${words(title)}</h2></div>${aside}</div>`;

  const railWrap = (cls, inner, extra = '') => `<div class="has-rail"><div class="rail ${cls}" ${extra}>${inner}</div></div>`;

  /* ======================================================================
     Stage 1 — opening titles
     ====================================================================== */
  const TIMELINE = [[300, 1], [1900, 2], [2700, 3], [3400, 4], [4300, 5], [5000, 6]];

  function runOpening() {
    state.stage = 'opening';
    state.finishing = false;
    const stage = $('#stage');
    stage.innerHTML = `
      <div class="opening" data-beat="0" role="dialog" aria-label="Opening titles">
        <div class="bar top"></div><div class="bar bot"></div>
        <div class="op-light" aria-hidden="true"></div>
        <div class="op-studio"><p>${esc(profile.originalLabel)}</p></div>
        <div class="op-portrait"><img src="${profile.portrait.src}" srcset="${profile.portrait.srcSet}" sizes="(max-width: 768px) 100vw, 900px" alt="${esc(profile.portrait.alt)}" /></div>
        <div class="op-vignette" aria-hidden="true"></div>
        <div class="op-title"><h1>${esc(profile.firstName)}</h1><p class="series">${esc(profile.seriesTag)}</p></div>
        <div class="op-bottom">
          <p class="op-role">${profile.tagline.map(esc).join('&nbsp;&nbsp;•&nbsp;&nbsp;')}</p>
          <button class="op-play" type="button" data-cursor="play" data-act="op-done" tabindex="-1"><span>▶</span> PLAY</button>
        </div>
        <button class="op-skip" type="button" data-act="op-done">SKIP INTRO</button>
      </div>`;
    const el = $('.opening', stage);
    document.body.classList.add('locked');
    window.scrollTo(0, 0);
    if (reduced()) { el.dataset.beat = '6'; $('.op-play', el).tabIndex = 0; return; }
    const timers = TIMELINE.map(([at, beat]) => setTimeout(() => { el.dataset.beat = String(beat); if (beat === 6) $('.op-play', el).tabIndex = 0; }, at));
    state.openingTimers = timers;
  }

  function finishOpening() {
    const el = $('.opening');
    if (!el || state.finishing) return;
    state.finishing = true;
    (state.openingTimers || []).forEach(clearTimeout);
    el.classList.add('leave');
    setTimeout(() => runProfiles(), 650);
  }

  /* ======================================================================
     Stage 2 — "Who's watching?"
     ====================================================================== */
  function runProfiles() {
    state.stage = 'profiles';
    $('#stage').innerHTML = `
      <div class="profiles" role="dialog" aria-label="Who's watching?">
        <h2>Who's watching?</h2>
        <ul class="profile-list">
          ${viewerProfiles.map((p) => `<li><button type="button" class="profile-btn" data-cursor="play" data-act="pick-profile" data-id="${p.id}">
            <span class="av-wrap">${avatar(p.id)}${p.id === 'musthaq' ? '<span class="main-badge">MAIN</span>' : ''}</span>
            <span class="name">${esc(p.name)}</span><span class="blurb">${esc(p.blurb)}</span></button></li>`).join('')}
        </ul>
        <p class="profiles-note">Every profile watches the same true story of ${esc(profile.displayName)} — it only changes what plays first.</p>
      </div>`;
    document.body.classList.add('locked');
    $('.profile-btn').focus({ preventScroll: true });
  }

  function pickProfile(id) {
    state.profileId = id;
    store.set(STORAGE_KEY, id);
    if (state.stage !== 'home') {
      const el = $('.profiles');
      if (state.entering) return;
      state.entering = true;
      if (el) el.classList.add('leave');
      setTimeout(() => enterHome(), el ? 500 : 0);
    } else {
      const p = viewerProfiles.find((v) => v.id === id);
      renderSite();
      window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
      toast(`Now watching as ${p.name} — ${p.blurb.toLowerCase()}`);
    }
  }

  function enterHome() {
    state.stage = 'home';
    state.entering = false;
    $('#stage').innerHTML = '';
    document.body.classList.remove('locked');
    $('#site').hidden = false;
    renderSite();
    window.scrollTo(0, 0);
  }

  /* ======================================================================
     Stage 3 — the site
     ====================================================================== */
  const order = () => viewerProfiles.find((p) => p.id === state.profileId).order;

  function renderSite() {
    state.cleanups.forEach((fn) => { try { fn(); } catch { /* noop */ } });
    state.cleanups = [];
    renderNav();
    renderHero();
    renderContinue();
    renderScenes();
    renderCTA();
    initScrollEffects();
  }

  /* ---------- navbar ---------- */
  function renderNav() {
    const links = ['top', ...order()];
    const label = (id) => (id === 'top' ? 'Home' : sectionMeta[id].nav);
    const cur = viewerProfiles.find((p) => p.id === state.profileId);
    $('#nav').innerHTML = `
      <div class="nav-bar gutter">
        <div class="nav-left">
          <button type="button" class="brand-btn" data-act="go" data-go="top" aria-label="Back to top">${brandMark()}</button>
          <nav class="nav-links" aria-label="Sections">${links.map((id) => `<button type="button" data-act="go" data-go="${id}" data-nav="${id}">${label(id)}</button>`).join('')}</nav>
        </div>
        <div class="nav-right">
          <button type="button" class="nav-cta" data-act="go" data-go="contact">LET'S BUILD</button>
          <div class="profile-menu-wrap">
            <button type="button" class="profile-trigger" data-act="profile-menu" aria-haspopup="menu" aria-expanded="false" aria-label="Viewing as ${esc(cur.name)}. Switch profile">${avatar(cur.id, 'sm')}<span class="caret">▼</span></button>
          </div>
          <button type="button" class="burger" data-act="mobile-nav" aria-label="Open menu" aria-expanded="false"><span></span><span></span></button>
        </div>
      </div>
      <nav class="mobile-nav gutter" aria-label="Sections">${[...links, 'contact'].map((id) => `<button type="button" data-act="go" data-go="${id}" data-nav="${id}">${id === 'contact' ? "Let's Build" : label(id)}</button>`).join('')}</nav>`;
    $('#nav').className = 'nav';
  }

  function toggleProfileMenu(force) {
    const wrap = $('.profile-menu-wrap');
    const btn = $('.profile-trigger', wrap);
    const existing = $('.profile-menu', wrap);
    const open = force ?? !existing;
    if (existing) existing.remove();
    btn.setAttribute('aria-expanded', String(open));
    if (!open) return;
    wrap.insertAdjacentHTML('beforeend', `<div class="profile-menu" role="menu"><p class="hd">WHO'S WATCHING?</p>${viewerProfiles.map((p) => `<button type="button" role="menuitem" class="${p.id === state.profileId ? 'cur' : ''}" data-act="pick-profile" data-id="${p.id}">${avatar(p.id, 'sm')}<span><span class="n">${esc(p.name)}</span><span class="b">${esc(p.blurb)}</span></span></button>`).join('')}</div>`);
  }

  function goTo(id) {
    $('#nav').classList.remove('open');
    $('.burger')?.setAttribute('aria-expanded', 'false');
    if (id === 'top') return window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    $('#' + id)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- hero ---------- */
  function renderHero() {
    const meta = ['JPR Exports', 'Founder · NanoFly InfoTech', `${projects.length} Originals`, '✈ Malaysia'];
    const chips = [
      { t: `${education[0].score} · B.Tech IT`, s: 'Sethu Institute', pos: 'left:2%;top:30%', depth: 1 },
      { t: '✈ Malaysia Business Trip', s: 'JPR Exports reward', pos: 'right:0;top:18%', depth: -1 },
      { t: 'Biller Bro · Live', s: 'jprexports.com/billerbro', pos: 'right:4%;bottom:24%', depth: 0.6 },
    ];
    $('#top').innerHTML = `
      <div class="hero-glow" aria-hidden="true"></div>
      <canvas class="particles" aria-hidden="true"></canvas>
      <div class="streaks" aria-hidden="true">
        <span class="light-streak" style="left:40%;top:22%;width:50vw;animation-delay:1.2s"></span>
        <span class="light-streak" style="left:30%;top:64%;width:40vw;animation-delay:3.6s"></span>
        <span class="light-streak" style="left:55%;top:44%;width:30vw;animation-delay:5.2s"></span>
      </div>
      <div class="hero-portrait" id="heroPortrait">
        <div class="hero-frame" id="heroFrame">
          <div class="hero-ring" aria-hidden="true"></div>
          <img class="hero-img" src="${profile.portrait.src}" srcset="${profile.portrait.srcSet}" sizes="(max-width: 1024px) 100vw, 54vw" alt="${esc(profile.portrait.alt)}" />
          <div class="hero-rim" aria-hidden="true"></div>
          ${chips.map((c, i) => `<div class="float-chip glass" data-depth="${c.depth}" style="${c.pos};animation-delay:${1.2 + i * 0.18}s"><div style="animation-duration:${5 + i}s"><b>${esc(c.t)}</b><small>${esc(c.s)}</small></div></div>`).join('')}
        </div>
      </div>
      <div class="hero-fade-m" aria-hidden="true"></div><div class="hero-fade-d" aria-hidden="true"></div><div class="hero-fade-b" aria-hidden="true"></div>
      <div class="hero-copy gutter" id="heroCopy">
        <h1 style="--i:1"><span class="shimmer">${esc(profile.firstName)}</span></h1>
        <p class="series-tag" style="--i:2">${esc(profile.seriesTag)}</p>
        <div class="hero-meta" style="--i:3"><span class="badge">${esc(profile.badge)}</span>${meta.map((m) => `<span style="display:flex;align-items:center;gap:12px"><span class="dot"></span>${esc(m)}</span>`).join('')}</div>
        <p class="hero-tag" style="--i:4">${profile.tagline.map(esc).join(' • ')}</p>
        <p class="hero-intro" style="--i:5">${esc(profile.intro)}</p>
        <div class="hero-actions" style="--i:6">
          <button type="button" class="btn" data-cursor="play" data-act="play-intro"><span style="font-size:18px">▶</span> Play Intro</button>
          ${state.profileId === 'recruiter'
            ? `<button type="button" class="btn ghost" data-act="view-resume"><span style="font-size:18px">⤓</span> View Resume</button>`
            : `<button type="button" class="btn ghost" data-act="go" data-go="originals"><span style="font-size:20px;line-height:1">＋</span> My Work</button>`}
          <button type="button" class="info-btn" data-act="go" data-go="about" aria-label="More info">ⓘ</button>
        </div>
      </div>
      <div class="hero-blackout" id="heroBlackout" aria-hidden="true"></div>`;
  }

  /* ---------- continue exploring ---------- */
  const GLYPHS = { about: 'S', journey: 'S01', originals: String(projects.length), picks: '10', skills: '{ }', moments: '★', story: 'CV' };
  function renderContinue() {
    $('#continue').innerHTML = `
      <div class="continue-head gutter"><h2 id="continue-title">Continue Exploring</h2><span>Progress shows what you've watched so far</span></div>
      <div class="has-rail"><div class="rail cw-rail gutter">
        ${order().map((id, i) => {
          const m = sectionMeta[id];
          return `<button type="button" class="cw-card" data-cursor="play" data-act="go" data-go="${id}">
            <div class="cw-art">${poster(m.palette, `<span class="cw-glyph">${GLYPHS[id]}</span>`)}
              <div class="cw-info"><span class="ep">Episode ${String(i + 1).padStart(2, '0')}</span><span class="t">${esc(m.card)}</span><span class="m">${esc(m.meta)}</span></div>
              <span class="cw-play">▶</span></div>
            <div class="cw-bar"><i data-progress="${id}"></i></div></button>`;
        }).join('')}
      </div></div>`;
  }

  /* ---------- scenes ---------- */
  function renderScenes() {
    $('#scenes').innerHTML = order().map((id) => `<section class="scene ${id === 'originals' ? 'originals-scene' : ''}" id="${id}" data-scene="${id}">${SCENES[id]()}</section>`).join('');
    bindScenes();
  }

  const SCENES = { about: sceneAbout, journey: sceneJourney, originals: sceneOriginals, picks: scenePicks, skills: sceneSkills, moments: sceneMoments, story: sceneStory };

  function sceneAbout() {
    const facts = [
      { k: 'Now', v: `${experience[0].role}, ${experience[0].company}`, s: experience[0].period },
      { k: 'Founder', v: `${experience[1].role.split(' / ')[1] || experience[1].role}, ${experience[1].company}`, s: experience[1].period },
      { k: 'Education', v: 'B.Tech, Information Technology', s: `${education[0].school} · ${education[0].score}` },
      { k: 'Based in', v: profile.location, s: profile.languages.join(' · ') },
    ];
    return `${secHead('The Pilot', 'About Me')}
      <div class="gutter about-grid">
        <div class="about-photo-wrap reveal"><div data-tilt="5" class="about-photo" style="border-radius:16px">
          <div class="bg"></div><div class="bg2"></div>
          <img src="${profile.portrait.src}" srcset="${profile.portrait.srcSet}" sizes="(max-width: 1024px) 90vw, 40vw" alt="${esc(profile.portrait.alt)}" loading="lazy" />
          <div class="shade"></div>
          <div class="cap"><div><small>STARRING</small><b>${esc(profile.displayName)}</b></div><em>S01–S0${seasons.length}</em></div>
        </div></div>
        <div>
          <p class="quote reveal">“${esc(profile.intro)}”</p>
          <p class="quote-by">— ${esc(profile.fullName)}</p>
          ${profile.leadership ? `<aside class="lead-card reveal"><p class="lead-k">${esc(profile.leadership.kicker)}</p><h3>${esc(profile.leadership.title)}</h3><p>${esc(profile.leadership.text)}</p>${profile.leadership.link ? `<a href="${esc(profile.leadership.link)}" target="_blank" rel="noreferrer" data-cursor="link">${esc(profile.leadership.linkLabel || 'Read more')} ↗</a>` : ''}</aside>` : ''}
          <dl class="facts reveal">${facts.map((f) => `<div><dt>${esc(f.k)}</dt><dd>${esc(f.v)}</dd><dd>${esc(f.s)}</dd></div>`).join('')}</dl>
          <p class="mini-label">Interests</p>
          <div class="pills">${profile.interests.map((i) => `<span class="pill glass">${esc(i)}</span>`).join('')}</div>
        </div>
      </div>`;
  }

  /* journey */
  function sceneJourney() {
    return `${secHead(`${seasons.length} Seasons`, 'My Journey', '<p class="aside">Every stage of the resume, told as a season — select one to see its episodes.</p>')}
      <div class="season-tabs rail gutter" role="tablist" aria-label="Seasons">${seasons.map((s, i) => seasonTab(s, i)).join('')}</div>
      <div id="seasonBody">${seasonBody()}</div>`;
  }
  const seasonTab = (s, i) => `<button type="button" role="tab" aria-selected="${i === state.season}" class="season-tab" data-act="season" data-i="${i}"><small>SEASON ${String(s.number).padStart(2, '0')}</small><span>${esc(s.title)}</span></button>`;
  function seasonBody() {
    const s = seasons[state.season];
    return `<div class="season-body">
      <div class="season-title gutter"><h3><span class="text-outline">S${String(s.number).padStart(2, '0')}</span>${esc(s.title)}</h3><span class="p">${esc(s.period)} · ${s.episodes.length} ${s.episodes.length === 1 ? 'Episode' : 'Episodes'}</span></div>
      <p class="season-syn gutter">${esc(s.synopsis)}</p>
      <div class="has-rail"><div class="rail ep-rail gutter">${s.episodes.map((e, i) => episodeCard(e, i)).join('')}</div></div></div>`;
  }
  function episodeCard(e, i) {
    const [sCode, ep] = e.code.split(' ');
    return `<article class="ep-card" style="--i:${i}"><div class="ep-inner" data-tilt="7">
      <div class="ep-art">${poster(e.palette, `<span class="ep-num">${ep}</span>`)}<div class="ep-code"><b>${sCode}</b><span>EPISODE ${ep.replace('E', '')}</span></div><h4>${esc(e.title)}</h4></div>
      <div class="ep-body"><div class="ep-row"><b>${esc(e.runtime)}</b><i>▶</i></div><p>${esc(e.description)}</p><div class="tags">${e.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div></div></div></article>`;
  }

  /* originals */
  const pinnedMode = () => desktopMQ.matches && !reduced();
  function projectCard(p) {
    return `<article class="pcard reveal-x"><div data-tilt="5"><div class="pcard-box" role="button" tabindex="0" data-cursor="view" data-act="open-project" data-id="${p.id}" aria-label="Open ${esc(p.title)}">
      ${projectArt(p)}
      <div class="pcard-top"><span>PROJECT</span></div><span class="pcard-year">${esc(p.year)}</span>
      <div class="pcard-bot"><p class="g">${esc(p.genre)}</p><h3>${esc(p.title)}</h3><p class="l">${esc(p.logline)}</p>
        <div class="stack">${p.stack.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        <div class="pcard-actions"><span class="btn sm">▶ View Project</span>
          ${p.link ? `<a class="btn sm ghost" href="${esc(p.link)}" target="_blank" rel="noreferrer" data-cursor="link" data-stop>Visit Live ↗</a>` : ''}
          ${p.github ? `<a class="btn sm ghost" href="${esc(p.github)}" target="_blank" rel="noreferrer" data-cursor="link" data-stop>GitHub ↗</a>` : ''}</div></div>
    </div></div></article>`;
  }
  const origIntro = () => `<div class="orig-intro"><p class="kicker">${projects.length} Originals · Live work</p><h2>ORIGINALS</h2>
    <p class="d">Billing software, export-brand websites and a healthcare platform — built for real businesses and live on the web. Open any title for the full story.</p><p class="s">SCROLL TO BROWSE →</p></div>`;
  const origOutro = () => `<a class="outro-card" href="${esc(profile.links.github)}" target="_blank" rel="noreferrer" data-cursor="link"><span class="ar">↗</span><b>More on GitHub</b><small>${esc(profile.links.github.replace('https://', ''))}</small></a>`;
  function sceneOriginals() {
    if (pinnedMode()) {
      return `<div class="orig-pin" id="origPin"><div class="orig-sticky"><div class="orig-track gutter" id="origTrack" data-cursor="drag">${origIntro()}${projects.map(projectCard).join('')}${origOutro()}</div>
        <div class="orig-bar gutter"><span>ORIGINALS</span><div><i id="origBar"></i></div></div></div></div>`;
    }
    return `<div class="orig-rail"><div class="gutter">${origIntro()}</div><div class="has-rail"><div class="rail rail-inner gutter">${projects.map(projectCard).join('')}${origOutro()}</div></div></div>`;
  }

  /* top picks */
  function scenePicks() {
    return `${secHead('Top 10 · from the resume', `${profile.firstName[0]}${profile.firstName.slice(1).toLowerCase()}'s Top Picks`)}
      <div class="has-rail"><div class="rail picks-rail gutter">${topPicks.map((p, i) => `<div class="pick reveal-x" style="--d:${Math.min(i, 5) * 0.06}s"><span class="num text-outline" aria-hidden="true">${i + 1}</span>
        <div class="pick-card">${poster(p.palette)}<div class="pick-in"><small>${esc(p.label)}</small><div><b>${esc(p.title)}</b><p>${esc(p.detail)}</p></div></div></div></div>`).join('')}</div></div>`;
  }

  /* skills */
  const HUES = ['#ffc83d', '#4cc9ff', '#46e3a8', '#ffb547', '#b98bff', '#ff9f45', '#7ee0ff'];
  function sceneSkills() {
    return `${secHead('Genres', 'My Skill Universe', '<p class="aside">Hover or tap a skill to see where it shows up across projects, roles and certifications.</p>')}
      <div class="gutter skills-grid">
        <div class="skill-tabs rail" role="tablist" aria-label="Skill categories">${skillCategories.map((c, i) => `<button type="button" role="tab" class="skill-tab" aria-selected="${i === state.skillCat}" style="--hue:${HUES[i % HUES.length]}" data-act="skill-tab" data-i="${i}"><b>${esc(c.title)}</b><small>${c.skills.length} skills · ${esc(c.subtitle)}</small></button>`).join('')}</div>
        <div class="skill-panel" id="skillPanel">${skillPanel()}</div>
      </div>`;
  }
  function skillPanel() {
    const c = skillCategories[state.skillCat];
    const hue = HUES[state.skillCat % HUES.length];
    return `<p><b>${esc(c.title)}</b> — ${esc(c.subtitle)}</p><div class="skill-cards" style="--hue:${hue}">${c.skills.map((s, i) => {
      const ev = skillEvidence[s.name];
      return `<button type="button" class="skill-card" style="--hue:${hue};--i:${i}" data-act="skill-toggle" aria-expanded="false"><span class="skill-mono" aria-hidden="true">${esc(s.mono)}</span>
        <span class="skill-name">${esc(s.name)}${s.note ? `<em>${esc(s.note)}</em>` : ''}</span>${ev ? `<span class="skill-ev">${ev.map(esc).join(' · ')}</span>` : ''}</button>`;
    }).join('')}</div>`;
  }

  /* achievements */
  const laurel = (side) => `<svg viewBox="0 0 30 64" class="laurel ${side}" aria-hidden="true"><path d="M26 62C10 52 4 36 8 4" fill="none" stroke="currentColor" stroke-width="1.4"/>${[10, 18, 26, 34, 42, 50].map((y, i) => `<ellipse cx="${i < 2 ? 9 : 8 + i * 1.6}" cy="${y}" rx="5" ry="2.2" fill="currentColor" opacity=".85" transform="rotate(-40 ${8 + i * 1.6} ${y})"/>`).join('')}</svg>`;
  /* certificates: filter chips + thumbnail cards, each linking to its file */
  const shortIssuer = (s) => s.replace(' Springboard', '').replace(/ ×.*$/, '').replace('K.L.N. College of Engineering', 'KLN');
  function certList() {
    const l = state.certCat === 'all' ? certifications : certifications.filter((c) => c.category === state.certCat);
    return [...l.filter((c) => c.kind !== 'letter'), ...l.filter((c) => c.kind === 'letter')];
  }
  function certFilterBtns() {
    const n = (id) => (id === 'all' ? certifications.length : certifications.filter((c) => c.category === id).length);
    return [{ id: 'all', title: 'All' }, ...certCategories].map((c) => `<button type="button" class="chip${state.certCat === c.id ? ' on' : ''}" data-act="cert-filter" data-cat="${c.id}" aria-pressed="${state.certCat === c.id}">${esc(c.title)} <small>${n(c.id)}</small></button>`).join('');
  }
  function certGrid() {
    const list = certList();
    return list.map((c, i) => `<button type="button" class="cert-card" data-act="cert-zoom" data-i="${i}" data-cursor="view" aria-label="Zoom in: ${esc(c.name)} — ${esc(c.issuer)}">
        <span class="cert-thumb"><img src="${esc(c.thumb)}" alt="${esc(c.name)} certificate from ${esc(c.issuer)}" loading="lazy" />${c.kind === 'letter' ? '<em class="cert-tag">Letter</em>' : ''}<span class="cert-zoom-hint" aria-hidden="true">⤢ Zoom</span></span>
        <span class="cert-body"><span class="r"><b>${esc(shortIssuer(c.issuer))}</b><small>${esc(c.date)}</small></span><span class="nm">${esc(c.name)}</span></span></button>`).join('');
  }

  /* certificate pop-up: large WebP, click to zoom, arrows / keys to move through the current filter */
  function openCertViewer(start) {
    const list = certList();
    if (!list.length || $('.cert-viewer')) return;
    let i = start, zoomed = false;
    const el = document.createElement('div');
    el.className = 'overlay lightbox cert-viewer';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Certificate viewer');
    el.innerHTML = `<button type="button" class="lb-x" aria-label="Close" data-cursor="close">✕</button>
      ${list.length > 1 ? '<button type="button" class="lb-nav l" aria-label="Previous certificate">‹</button><button type="button" class="lb-nav r" aria-label="Next certificate">›</button>' : ''}
      <div class="cv-stage"><img class="cv-img" alt="" draggable="false" /></div>
      <div class="cv-cap"><div><b class="cv-name"></b><span class="cv-meta"></span></div>
        <div class="cv-btns"><button type="button" class="btn ghost sm cv-zoom">Zoom +</button><a class="btn ghost sm cv-open" target="_blank" rel="noreferrer">Open original ↗</a></div></div>`;
    const img = $('.cv-img', el), stage = $('.cv-stage', el), zb = $('.cv-zoom', el);
    const setZoom = (z) => {
      zoomed = z; el.classList.toggle('zoomed', z); zb.textContent = z ? 'Zoom −' : 'Zoom +';
      stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2; stage.scrollTop = 0;
    };
    const paint = () => {
      const c = list[i];
      setZoom(false);
      img.src = c.image || c.thumb; img.alt = `${c.name} — ${c.issuer}`;
      $('.cv-name', el).textContent = c.name;
      $('.cv-meta', el).textContent = `${c.issuer} · ${c.date} · ${i + 1} / ${list.length}`;
      $('.cv-open', el).href = c.file;
    };
    const close = () => { el.remove(); popOverlay('lightbox'); };
    const go = (d) => { i = (i + d + list.length) % list.length; paint(); };
    img.addEventListener('click', () => setZoom(!zoomed));
    zb.addEventListener('click', () => setZoom(!zoomed));
    el.addEventListener('click', (e) => { if (e.target === el || e.target === stage || e.target.closest('.lb-x')) close(); });
    $('.lb-nav.l', el) && ($('.lb-nav.l', el).onclick = () => go(-1));
    $('.lb-nav.r', el) && ($('.lb-nav.r', el).onclick = () => go(1));
    el._keys = (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); if (e.key === '+' || e.key === '=' || e.key === 'z') setZoom(!zoomed); };
    let sx = null; // swipe to change certificate (when not zoomed)
    stage.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', (e) => { if (sx == null || zoomed) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); sx = null; }, { passive: true });
    overlays.appendChild(el);
    paint();
    pushOverlay('lightbox', close);
    $('.lb-x', el).focus({ preventScroll: true });
  }

  function sceneMoments() {
    const feat = achievements.find((a) => a.featured);
    const rest = achievements.filter((a) => !a.featured);
    const issuers = [...new Set(certifications.map((c) => shortIssuer(c.issuer)))];
    const issuerLine = issuers.slice(0, 7).join(' · ') + (issuers.length > 7 ? ` · +${issuers.length - 7} more` : '');
    return `${secHead('Awards season', 'Top Moments')}
      ${feat ? `<article class="spot gutter reveal"><div class="spot-box">
        <div class="spot-copy"><div class="laurel-row">${laurel('l')}<p>${esc(feat.laurel)}</p>${laurel('r')}</div>
          <h3>${esc(feat.title)}</h3><p class="by">Awarded by ${esc(feat.org)}</p><p class="d">${esc(feat.detail)}</p>
          ${malaysiaPhotos.length ? `<div class="spot-photos" aria-label="Photos from the Malaysia trip">${malaysiaPhotos.slice(0, 6).map((src, i) => `<button type="button" class="spot-photo" data-act="lightbox-malaysia" data-i="${i}" data-cursor="view" aria-label="View Malaysia photo ${i + 1} of ${malaysiaPhotos.length}"><img src="${esc(src)}" alt="Malaysia business trip — photo ${i + 1}" loading="lazy" />${i === 5 && malaysiaPhotos.length > 6 ? `<span class="more-n">+${malaysiaPhotos.length - 6}</span>` : ''}</button>`).join('')}</div>` : ''}
          <div class="spot-actions"><p class="spot-chip"><span aria-hidden="true">✈</span> Kalimark Exports Project · Malaysia market</p>
            ${feat.link ? `<a class="spot-link" href="${esc(feat.link)}" target="_blank" rel="noreferrer" data-cursor="link">${esc(feat.linkLabel || 'View post')} ↗</a>` : ''}</div></div>
        <div class="spot-map"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="#ffc83d" fill-opacity=".22"/></pattern><radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffc83d" stop-opacity=".35"/><stop offset="1" stop-color="#ffc83d" stop-opacity="0"/></radialGradient></defs>
          <rect width="400" height="300" fill="url(#dots)"/><circle cx="262" cy="196" r="90" fill="url(#glow)"/>
          <path class="route" d="M132 70C180 -10 240 40 262 190" fill="none" stroke="#ffc83d" stroke-width="2.4" stroke-linecap="round"/>
          <circle cx="132" cy="70" r="6" fill="#f4f1ec"/><circle cx="132" cy="70" r="14" fill="none" stroke="#f4f1ec" stroke-opacity=".35"/><circle cx="262" cy="190" r="8" fill="#ffc83d"/><circle cx="262" cy="190" r="20" fill="none" stroke="#ffc83d" stroke-opacity=".5"/>
          <text x="132" y="100" text-anchor="middle" font-family="Inter" font-size="11" font-weight="700" letter-spacing="3" fill="#f4f1ec">INDIA</text>
          <text x="262" y="228" text-anchor="middle" font-family="Inter" font-size="11" font-weight="700" letter-spacing="3" fill="#ffc83d">MALAYSIA</text>
          <text x="196" y="26" font-family="Inter" font-size="26" fill="#ffc83d" transform="rotate(28 188 26)">✈</text></svg></div>
      </div></article>` : ''}
      <div class="gutter ach-grid">${rest.map((a, i) => `<div class="reveal" style="--d:${i * 0.08}s"><article class="ach" data-tilt="8"><div class="laurel-row">${laurel('l')}<p>${esc(a.laurel)}</p>${laurel('r')}</div>
        <h3>${esc(a.title)}</h3><p class="org">${esc(a.org)}</p><p class="dt">${esc(a.detail)}</p>${a.photos && a.photos.length ? `<div class="ach-photos n${Math.min(a.photos.length, 2)}" aria-label="Photos: ${esc(a.title)}">${a.photos.slice(0, 2).map((src, k) => `<button type="button" class="ach-photo" data-act="lightbox-ach" data-id="${esc(a.id)}" data-i="${k}" data-cursor="view" aria-label="View photo ${k + 1} of ${a.photos.length}: ${esc(a.title)}"><img src="${esc(src)}" alt="${esc(a.title)} — photo ${k + 1}" loading="lazy" />${k === 1 && a.photos.length > 2 ? `<span class="more-n">+${a.photos.length - 2}</span>` : ''}</button>`).join('')}</div>` : ''}${a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noreferrer" style="margin-top:auto;padding-top:20px;font-size:12px;font-weight:600;text-decoration:underline;text-decoration-color:rgba(255,200,61,.6);text-underline-offset:4px">View certificate ↗</a>` : ''}</article></div>`).join('')}</div>
      <div class="certs-head gutter" id="certificates"><h3>Certified &amp; trained <span>· ${certCount} certificates${letterCount ? ` · ${letterCount} letters` : ''}</span></h3><p>${esc(issuerLine)}</p></div>
      <div class="cert-filters gutter" role="group" aria-label="Filter certificates">${certFilterBtns()}</div>
      <div class="cert-grid gutter" id="certGrid">${certGrid()}</div>`;
  }

  /* resume */
  function resumeSheet() {
    const iss = [...new Set(certifications.map((c) => c.issuer))];
    return `<article class="sheet"><header>
      <div><small>STARRING</small><h3>${esc(profile.fullName)}</h3></div>
      <div class="contact"><a class="blk" href="mailto:${esc(profile.email)}">${esc(profile.email)}</a><a class="blk" href="${esc(profile.phoneHref)}">${esc(profile.phone)}</a>
        <a href="${esc(profile.links.linkedin)}" target="_blank" rel="noreferrer">LinkedIn ↗</a> · <a href="${esc(profile.links.github)}" target="_blank" rel="noreferrer">GitHub ↗</a></div></header>
      <div class="sheet-cols"><div>
        <h4>Experience</h4>${experience.map((x) => `<div class="it"><div class="row"><b>${esc(x.company)} — ${esc(x.role)}</b><small>${esc(x.period)}</small></div><ul class="pts">${x.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>`).join('')}
        <h4>Projects</h4>${projects.map((p) => `<div class="it"><div class="row"><b>${esc(p.title)}</b><small>${esc(p.year)}</small></div><p class="sub">${esc(p.stack.join(', '))}${p.linkLabel ? ` · <em>${esc(p.linkLabel)}</em>` : ''}</p></div>`).join('')}
        <h4>Education</h4>${education.map((e) => `<div class="it"><div class="row"><b>${esc(e.school)}${e.place ? `, ${esc(e.place)}` : ''}</b><small>${esc(e.period)}</small></div><p class="sub">${esc(e.degree)} · <em>${esc(e.score)}</em></p></div>`).join('')}
      </div><div>
        <h4>Skills</h4><div class="sk">${skillCategories.map((c) => `<p><b>${esc(c.title)}: </b>${c.skills.map((s) => esc(s.name)).join(', ')}</p>`).join('')}</div>
        <h4>Achievements</h4><ul class="al">${achievements.map((a) => `<li><b>${esc(a.title)} — ${esc(a.org)}.</b> ${esc(a.detail)}</li>`).join('')}</ul>
        <h4>Certifications</h4><p class="cert-txt">${certCategories.map((cat) => `<b>${esc(cat.title)}:</b> ${certifications.filter((c) => c.category === cat.id && c.kind !== 'letter').map((c) => esc(c.name)).join('; ')}`).filter((s) => !/:<\/b> $/.test(s)).join('<br />')}</p>
      </div></div></article>`;
  }
  function sceneStory() {
    return `${secHead('The screenplay', 'The Full Story')}
      <div class="gutter resume-grid">
        <div class="reveal"><div class="sheet-wrap" id="sheetWrap"><div class="sheet-clip">${resumeSheet()}</div><div class="sheet-more"><button type="button" class="glass" data-act="sheet-more">Read the full story ↓</button></div></div></div>
        <div class="resume-side"><p class="big">Every episode, on one page.</p>
          <p class="sm">Experience, projects, achievements and ${certCount} certifications — view it here or take a copy with you.</p>
          <div class="btns"><button type="button" class="btn" data-cursor="view" data-act="view-resume">▶ View Resume</button>
            <a class="btn ghost" href="${esc(profile.resumePdf)}" download="${esc(profile.resumeFile)}" data-cursor="link">⤓ Download Resume</a></div>
          <dl class="stat-row">${[[education[0].score.replace('CGPA ', ''), 'CGPA'], [projects.length, 'Originals'], [experience.length, 'Roles']].map(([v, k]) => `<div><b>${v}</b><small>${k}</small></div>`).join('')}</dl></div>
      </div>`;
  }

  /* final CTA */
  function renderCTA() {
    const ctas = [
      { label: "Let's Build", href: `mailto:${profile.email}?subject=${encodeURIComponent("Let's build something")}`, primary: true, cursor: 'play' },
      { label: 'LinkedIn', href: profile.links.linkedin },
      { label: 'GitHub', href: profile.links.github },
      { label: 'Instagram', href: profile.links.instagram },
      { label: 'Call', href: profile.phoneHref },
    ];
    $('#contact').innerHTML = `
      <canvas class="particles" aria-hidden="true"></canvas>
      <p class="kicker-c reveal">The Next Episode</p>
      <h2 id="ctaTitle">TO BE CONTINUED…</h2>
      <div class="who reveal"><b>${esc(profile.displayName.toUpperCase())}</b><small>${esc(profile.role.toUpperCase())}</small></div>
      <div class="cta-btns">${ctas.map((c, i) => `<a class="cta-btn reveal ${c.primary ? 'primary' : ''}" style="--d:${0.3 + i * 0.08}s" href="${esc(c.href)}" ${c.href.startsWith('http') ? 'target="_blank" rel="noreferrer"' : ''} data-cursor="${c.cursor || 'link'}">${c.primary ? '<span style="color:inherit">▶</span>' : ''}${esc(c.label.toUpperCase())}${c.primary ? '' : '<span>↗</span>'}</a>`).join('')}</div>
      <div class="cta-links"><button type="button" data-act="go" data-go="top">↺ WATCH AGAIN</button><button type="button" data-act="replay">▶ REPLAY OPENING</button></div>
      <footer>${brandMark()}<p>© ${new Date().getFullYear()} ${esc(profile.displayName)}. A personal, streaming-inspired portfolio — not affiliated with any streaming service.<br /><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a> · <a href="${esc(profile.phoneHref)}">${esc(profile.phone)}</a></p></footer>`;
  }

  /* ======================================================================
     Behaviours bound after render
     ====================================================================== */
  function bindScenes() {
    initRails();
    initOriginals();
  }

  /* rail arrows (desktop hover) */
  function initRails(root = document) {
    $$('.has-rail', root).forEach((wrap) => {
      if (wrap.dataset.railed) return;
      const rail = $('.rail', wrap);
      if (!rail) return;
      wrap.dataset.railed = '1';
      const l = document.createElement('button');
      const r = document.createElement('button');
      l.className = 'rail-btn l'; r.className = 'rail-btn r';
      l.type = r.type = 'button'; l.textContent = '‹'; r.textContent = '›';
      l.setAttribute('aria-label', 'Scroll left'); r.setAttribute('aria-label', 'Scroll right');
      wrap.append(l, r);
      const page = (d) => rail.scrollBy({ left: d * rail.clientWidth * 0.8, behavior: 'smooth' });
      l.addEventListener('click', () => page(-1));
      r.addEventListener('click', () => page(1));
      const update = () => { l.hidden = rail.scrollLeft <= 8; r.hidden = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8; };
      update();
      rail.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
    });
  }

  /* pinned, horizontally-scrolling Originals (desktop) */
  function initOriginals() {
    const pin = $('#origPin');
    const track = $('#origTrack');
    if (!pin || !track) return;
    const bar = $('#origBar');
    let dist = 0;
    let x = 0;
    let raf = 0;
    let target = 0;
    const measure = () => {
      dist = Math.max(0, track.scrollWidth - window.innerWidth);
      pin.style.height = `calc(100vh + ${dist}px)`;
      update();
    };
    const update = () => {
      const r = pin.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, pin.offsetHeight - window.innerHeight));
      target = -p * dist;
      bar.style.transform = `scaleX(${p})`;
      if (!raf) raf = requestAnimationFrame(step);
    };
    const step = () => {
      x += (target - x) * 0.14;
      if (Math.abs(target - x) < 0.3) { x = target; raf = 0; } else raf = requestAnimationFrame(step);
      track.style.transform = `translate3d(${x}px,0,0)`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', measure);
    state.cleanups.push(() => { ro.disconnect(); window.removeEventListener('scroll', update); window.removeEventListener('resize', measure); cancelAnimationFrame(raf); });
  }

  /* ======================================================================
     Scroll-driven effects, observers, particles
     ====================================================================== */
  function initScrollEffects() {
    const nav = $('#nav');
    const cleanup = (fn) => state.cleanups.push(fn);

    /* reveal on scroll */
    const revealIO = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal, .reveal-x, .words').forEach((el) => revealIO.observe(el));
    cleanup(() => revealIO.disconnect());

    /* scenes fade up out of black */
    const sceneIO = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove('pre'); sceneIO.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
    $$('.scene:not(.originals-scene)').forEach((s) => { if (!reduced()) { s.classList.add('pre'); sceneIO.observe(s); } });
    cleanup(() => sceneIO.disconnect());

    /* active nav link */
    const ids = ['top', ...order(), 'contact'];
    const navIO = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      $$('[data-nav]', nav).forEach((b) => b.classList.toggle('active', b.dataset.nav === e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) navIO.observe(el); });
    cleanup(() => navIO.disconnect());

    /* particles */
    $$('canvas.particles').forEach((cv) => { const stop = particles(cv, cv.closest('.cta') ? 36 : 46); if (stop) cleanup(stop); });

    /* scroll loop: nav, hero parallax, watch progress, CTA title */
    const hero = $('#top');
    const portrait = $('#heroPortrait');
    const copy = $('#heroCopy');
    const black = $('#heroBlackout');
    const ctaTitle = $('#ctaTitle');
    const cta = $('#contact');
    const bars = $$('[data-progress]');
    const sceneEls = bars.map((b) => document.getElementById(b.dataset.progress));
    const seen = {};
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('solid', y > 40);
      nav.classList.toggle('hide', y > 400 && y > lastY && !nav.classList.contains('open') && !$('.profile-menu'));
      lastY = y;
      const vh = window.innerHeight;

      if (!reduced()) {
        const hp = clamp(y / Math.max(1, hero.offsetHeight));
        const fade = clamp(1 - hp / 0.75);
        portrait.style.transform = `translate3d(0,${hp * 18}%,0) scale(${1 + hp * 0.12})`;
        portrait.style.opacity = fade;
        copy.style.transform = `translate3d(0,${-hp * 30}%,0)`;
        copy.style.opacity = fade;
        black.style.opacity = clamp((hp - 0.35) / 0.65);
        if (ctaTitle) {
          const r = cta.getBoundingClientRect();
          const p = clamp((vh - r.top) / (vh * 0.8));
          const e = clamp((p - 0.1) / 0.8);
          ctaTitle.style.setProperty('--ls', `${0.6 - 0.58 * e}em`);
          ctaTitle.style.setProperty('--bl', `${16 * (1 - e)}px`);
          ctaTitle.style.setProperty('--op', e);
        }
      } else if (ctaTitle) {
        ctaTitle.style.cssText = '--ls:.02em;--bl:0px;--op:1';
      }

      bars.forEach((b, i) => {
        const el = sceneEls[i];
        if (!el) return;
        const r = el.getBoundingClientRect();
        const v = clamp((vh - r.top) / (r.height + vh * 0.25));
        if (v > (seen[b.dataset.progress] || 0)) {
          seen[b.dataset.progress] = v;
          b.style.transform = `scaleX(${Math.max(0.04, v)})`;
        }
      });
      ticking = false;
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    onScroll();
    cleanup(() => { window.removeEventListener('scroll', req); window.removeEventListener('resize', req); });

    /* pointer parallax on the hero portrait (desktop) */
    if (fineMQ.matches && !reduced()) {
      const frame = $('#heroFrame');
      const chips = $$('.float-chip', frame);
      let mx = 0, my = 0, px = 0, py = 0, raf = 0;
      const loop = () => {
        px += (mx - px) * 0.08; py += (my - py) * 0.08;
        frame.style.transform = `perspective(1200px) rotateY(${px * 4}deg) rotateX(${-py * 3}deg) translateX(${px * 10}px)`;
        chips.forEach((c) => { const d = parseFloat(c.dataset.depth); c.style.transform = `translate(${-px * 18 * d}px,${-py * 12 * d}px)`; });
        raf = Math.abs(mx - px) + Math.abs(my - py) > 0.002 ? requestAnimationFrame(loop) : 0;
      };
      const move = (e) => { mx = (e.clientX / window.innerWidth) * 2 - 1; my = (e.clientY / window.innerHeight) * 2 - 1; if (!raf) raf = requestAnimationFrame(loop); };
      hero.addEventListener('pointermove', move);
      cleanup(() => { hero.removeEventListener('pointermove', move); cancelAnimationFrame(raf); });
    }
  }

  /* drifting dust particles on a canvas — pauses off screen */
  function particles(canvas, count = 46, color = '255,90,110') {
    if (reduced()) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0, running = false, last = performance.now();
    const resize = () => { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const dots = Array.from({ length: count }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.3, vx: (Math.random() - 0.5) * 0.00012, vy: -Math.random() * 0.00028 - 0.00006, a: Math.random() * 0.6 + 0.15, tw: Math.random() * Math.PI * 2 }));
    const tick = (now) => {
      const dt = Math.min(50, now - last); last = now;
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx * dt; d.y += d.vy * dt; d.tw += dt * 0.002;
        if (d.y < -0.02) { d.y = 1.02; d.x = Math.random(); }
        if (d.x < -0.02) d.x = 1.02; if (d.x > 1.02) d.x = -0.02;
        ctx.beginPath(); ctx.fillStyle = `rgba(${color},${d.a * (0.6 + 0.4 * Math.sin(d.tw))})`; ctx.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(tick); }
      else if (!en.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
    });
    io.observe(canvas);
    return () => { io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf); };
  }

  /* ======================================================================
     Overlays: play intro, project modal, resume modal, toast
     ====================================================================== */
  const overlays = $('#overlays');
  const lock = (on) => document.body.classList.toggle('locked', on || state.overlays.length > 0 || state.stage !== 'home');

  function pushOverlay(name, close) { state.overlays.push({ name, close }); lock(true); }
  function popOverlay(name) { state.overlays = state.overlays.filter((o) => o.name !== name); lock(false); }

  /* --- play intro --- */
  const SLIDE_MS = 3600;
  function playIntro() {
    if ($('.intro')) return;
    const el = document.createElement('div');
    el.className = 'overlay intro';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Intro highlight reel');
    el.dataset.phase = reduced() ? 'reel' : 'zoom';
    el.innerHTML = `<div class="intro-zoom"><img src="${profile.portrait.src}" srcset="${profile.portrait.srcSet}" sizes="100vw" alt="" /></div><div class="intro-tint" aria-hidden="true"></div>
      <div class="intro-bars" id="introBars" hidden>${introSlides.map(() => '<div><i></i></div>').join('')}</div>
      <div class="intro-stage" id="introStage"></div><div class="intro-zones" id="introZones"></div>
      <div class="intro-ctrl"><div class="l"><button type="button" class="round-btn" id="introPause" aria-label="Pause" hidden>❚❚</button><span class="hint">SPACE · ← → · ESC</span></div><button type="button" class="pill-btn" data-cursor="close" id="introClose">BACK TO BROWSE</button></div>`;
    overlays.appendChild(el);
    let index = 0, paused = false, phase = el.dataset.phase, prog = 0, raf = 0, last = 0, endTimer = 0, zoomTimer = 0;
    const bars = $$('#introBars i', el);
    const stage = $('#introStage', el);

    const close = () => {
      cancelAnimationFrame(raf); clearTimeout(endTimer); clearTimeout(zoomTimer);
      el.classList.add('closing');
      setTimeout(() => { el.remove(); popOverlay('intro'); }, 550);
    };
    const paint = () => bars.forEach((b, i) => { b.style.transform = `scaleX(${i < index || phase === 'end' ? 1 : i === index ? prog : 0})`; });
    const show = () => {
      const s = introSlides[index];
      stage.innerHTML = `<div class="intro-slide" key="${index}"><p class="k">Episode ${String(index + 1).padStart(2, '0')} · ${esc(s.kicker)}</p><h2>${esc(s.title)}</h2>
        <div class="lines">${s.lines.map((l, i) => `<p style="--i:${i}">${esc(l)}</p>`).join('')}</div>
        ${s.chips ? `<div class="chips">${s.chips.map((c, i) => `<span class="glass" style="--i:${i}">${esc(c)}</span>`).join('')}</div>` : ''}</div>`;
      prog = 0; paint();
    };
    const next = () => {
      if (index >= introSlides.length - 1) return end();
      index++; show();
    };
    const prev = () => { index = Math.max(0, index - 1); show(); };
    const end = () => {
      phase = 'end'; el.dataset.phase = 'end'; cancelAnimationFrame(raf); paint();
      stage.innerHTML = `<div class="intro-end"><p class="b">NOW STREAMING</p><p class="s">${esc(profile.displayName.toUpperCase())}</p></div>`;
      $('#introZones', el).innerHTML = ''; $('#introPause', el).hidden = true;
      endTimer = setTimeout(close, 2200);
    };
    const tick = (now) => {
      if (phase !== 'reel') return;
      if (!paused) {
        prog += (now - last) / SLIDE_MS;
        if (prog >= 1) { last = now; next(); if (phase !== 'reel') return; } else paint();
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    const startReel = () => {
      phase = 'reel'; el.dataset.phase = 'reel';
      $('#introBars', el).hidden = false; $('#introPause', el).hidden = false;
      $('#introZones', el).innerHTML = '<button type="button" class="p" aria-label="Previous highlight"></button><button type="button" class="n" data-cursor="play" aria-label="Next highlight"></button>';
      $('.p', el).onclick = prev; $('.n', el).onclick = next;
      show(); last = performance.now(); raf = requestAnimationFrame(tick);
    };
    $('#introClose', el).onclick = close;
    $('#introPause', el).onclick = () => { paused = !paused; $('#introPause', el).textContent = paused ? '▶' : '❚❚'; $('#introPause', el).setAttribute('aria-label', paused ? 'Resume' : 'Pause'); };
    el._keys = (e) => {
      if (e.key === 'ArrowRight' && phase === 'reel') next();
      if (e.key === 'ArrowLeft' && phase === 'reel') prev();
      if (e.key === ' ' && phase === 'reel') { e.preventDefault(); $('#introPause', el).click(); }
    };
    pushOverlay('intro', close);
    if (phase === 'reel') startReel(); else zoomTimer = setTimeout(startReel, 1700);
  }

  /* --- project modal --- */
  function openProject(id) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    let el = $('.modal.project');
    const isNew = !el;
    if (isNew) {
      el = document.createElement('div');
      el.className = 'overlay modal project';
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
      state.prevFocus = document.activeElement;
      overlays.appendChild(el);
      pushOverlay('project', closeProject);
    }
    const more = projects.filter((x) => x.id !== p.id);
    el.setAttribute('aria-label', p.title);
    el.dataset.project = p.id;
    el.innerHTML = `<div class="modal-back" data-act="close-project"></div>
      <div class="modal-scroll" data-act="close-project"><div class="modal-card" data-stop-close style="--acc:${p.palette.accent}">
        <div class="modal-bill">${projectArt(p)}<div class="grad"></div>
          <button type="button" class="modal-close" data-cursor="close" data-act="close-project" aria-label="Close project">✕</button>
          <div class="modal-title"><p class="o">PROJECT</p><h2>${esc(p.title)}</h2></div></div>
        <div class="modal-body">
          <div class="modal-meta" style="--i:0"><b>${esc(p.year)}</b><span class="dot"></span><span>${esc(p.genre)}</span></div>
          <p class="modal-logline" style="--i:1">${esc(p.logline)}</p>
          ${p.link || p.github ? `<div class="modal-links" style="--i:2">${p.link ? `<a class="btn" href="${esc(p.link)}" target="_blank" rel="noreferrer" data-cursor="link">▶ Visit ${esc(p.linkLabel || 'Live Site')} ↗</a>` : ''}${p.github ? `<a class="btn ghost" href="${esc(p.github)}" target="_blank" rel="noreferrer" data-cursor="link">GitHub ↗</a>` : ''}</div>` : ''}
          ${p.images && p.images.length ? `<section class="gallery-sec" style="--i:3"><h3 class="modal-h">Gallery</h3><div class="gallery">${p.images.map((src, i) => `<button type="button" class="shot" data-act="lightbox" data-i="${i}" data-cursor="view" aria-label="View image ${i + 1} of ${esc(p.title)}"><img src="${esc(src)}" alt="${esc(p.title)} — image ${i + 1}" loading="lazy" /></button>`).join('')}</div></section>` : ''}
          <section class="metrics" style="--i:3"><h3 class="modal-h">Result / Impact</h3><div class="metrics-grid">${p.metrics.map((m, i) => `<div style="--i:${i}"><b ${i === 0 ? `style="color:${p.palette.accent}"` : ''}>${esc(m.value)}</b><small>${esc(m.label)}</small></div>`).join('')}</div></section>
          <div class="modal-cols" style="--i:4"><section><h3 class="modal-h">What I Did</h3><ul class="build-list">${p.build.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></section>
            <div class="modal-side"><section><h3 class="modal-h">Tech Stack</h3><div class="pills lg">${p.stack.map((t) => `<span class="pill glass">${esc(t)}</span>`).join('')}</div></section>
              <section><h3 class="modal-h">Key Features</h3><ul class="feat-list">${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></section></div></div>
          <section class="more" style="--i:5"><h3>More Originals</h3><div class="more-grid">${more.map((m) => `<button type="button" class="more-card" data-cursor="view" data-act="open-project" data-id="${m.id}">${projectArt(m)}<div class="t"><small>${esc(m.genre)}</small><b>${esc(m.title)}</b></div></button>`).join('')}</div></section>
        </div></div></div>`;
    $('.modal-scroll', el).scrollTop = 0;
    $('.modal-close', el).focus({ preventScroll: true });
  }
  function closeProject() {
    const el = $('.modal.project');
    if (!el) return;
    el.remove(); popOverlay('project');
    state.prevFocus?.focus?.({ preventScroll: true });
  }

  /* --- image lightbox (project gallery) --- */
  function openLightbox(title, images, start) {
    const p = { title, images };
    if (!images || !images.length) return;
    let i = start;
    const el = document.createElement('div');
    el.className = 'overlay lightbox';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', `${p.title} gallery`);
    const n = p.images.length;
    const paint = () => {
      $('img', el).src = p.images[i];
      $('img', el).alt = `${p.title} — image ${i + 1}`;
      $('.count', el).textContent = `${i + 1} / ${n}`;
    };
    el.innerHTML = `<button type="button" class="lb-x" aria-label="Close image" data-cursor="close">✕</button>
      ${n > 1 ? '<button type="button" class="lb-nav l" aria-label="Previous image">‹</button><button type="button" class="lb-nav r" aria-label="Next image">›</button>' : ''}
      <figure><img alt="" /><figcaption><b>${esc(p.title)}</b> <span class="count"></span></figcaption></figure>`;
    const close = () => { el.remove(); popOverlay('lightbox'); };
    const go = (d) => { i = (i + d + n) % n; paint(); };
    el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('.lb-x')) close(); });
    $('.lb-nav.l', el) && ($('.lb-nav.l', el).onclick = () => go(-1));
    $('.lb-nav.r', el) && ($('.lb-nav.r', el).onclick = () => go(1));
    el._keys = (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    overlays.appendChild(el);
    paint();
    pushOverlay('lightbox', close);
    $('.lb-x', el).focus({ preventScroll: true });
  }

  /* --- resume modal --- */
  function openResume() {
    if ($('.resume-modal')) return;
    const small = mq('(max-width: 767px)').matches;
    const el = document.createElement('div');
    el.className = 'overlay resume-modal';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Resume');
    el.innerHTML = `<div class="top gutter"><p>The Full Story</p><div class="r"><a class="dl" href="${esc(profile.resumePdf)}" download="${esc(profile.resumeFile)}">⤓ Download</a><button type="button" class="x" data-cursor="close" data-act="close-resume" aria-label="Close resume">✕</button></div></div>
      <div class="body gutter">${small
        ? `<div class="scroll">${resumeSheet()}<a class="glass" href="${esc(profile.resumePdf)}" target="_blank" rel="noreferrer">Open original PDF ↗</a></div>`
        : `<iframe title="${esc(profile.displayName)} resume (PDF)" src="${esc(profile.resumePdf)}#view=FitH"></iframe>`}</div>`;
    overlays.appendChild(el);
    pushOverlay('resume', closeResume);
    $('.x', el).focus({ preventScroll: true });
  }
  function closeResume() { $('.resume-modal')?.remove(); popOverlay('resume'); }

  /* --- toast --- */
  let toastTimer = 0;
  function toast(msg) {
    $('.toast')?.remove();
    const t = document.createElement('div');
    t.className = 'toast glass'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 3200);
  }

  /* ======================================================================
     Global interactions (event delegation)
     ====================================================================== */
  document.addEventListener('click', (e) => {
    const stop = e.target.closest('[data-stop]');
    if (stop) return; // inner live/GitHub links just navigate
    const t = e.target.closest('[data-act]');
    if (!t) {
      if (!e.target.closest('.profile-menu-wrap') && $('.profile-menu')) toggleProfileMenu(false);
      return;
    }
    const act = t.dataset.act;
    // clicking inside the modal card shouldn't close it
    if (act === 'close-project' && e.target.closest('.modal-card') && !e.target.closest('.modal-close')) return;
    switch (act) {
      case 'op-done': finishOpening(); break;
      case 'pick-profile': pickProfile(t.dataset.id); break;
      case 'go': goTo(t.dataset.go); break;
      case 'profile-menu': toggleProfileMenu(); break;
      case 'mobile-nav': {
        const open = $('#nav').classList.toggle('open');
        t.setAttribute('aria-expanded', String(open));
        t.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        break;
      }
      case 'play-intro': playIntro(); break;
      case 'view-resume': openResume(); break;
      case 'close-resume': closeResume(); break;
      case 'open-project': openProject(t.dataset.id); break;
      case 'close-project': closeProject(); break;
      case 'lightbox': { const pr = projects.find((x) => x.id === $('.modal.project')?.dataset.project); if (pr) openLightbox(pr.title, pr.images, +t.dataset.i); break; }
      case 'lightbox-ach': { const ac = achievements.find((x) => x.id === t.dataset.id); if (ac) openLightbox(`${ac.title} — ${ac.org}`, ac.photos, +t.dataset.i); break; }
      case 'lightbox-malaysia': openLightbox('Malaysia business trip', malaysiaPhotos, +t.dataset.i); break;
      case 'cert-filter': {
        state.certCat = t.dataset.cat;
        $$('.cert-filters .chip').forEach((b) => { const on = b.dataset.cat === state.certCat; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
        $('#certGrid').innerHTML = certGrid();
        break;
      }
      case 'cert-zoom': openCertViewer(+t.dataset.i); break;
      case 'season': {
        state.season = +t.dataset.i;
        $$('.season-tab').forEach((b, i) => b.setAttribute('aria-selected', String(i === state.season)));
        $('#seasonBody').innerHTML = seasonBody();
        initRails($('#seasonBody'));
        bindTilt($('#seasonBody'));
        break;
      }
      case 'skill-tab': {
        state.skillCat = +t.dataset.i;
        $$('.skill-tab').forEach((b, i) => b.setAttribute('aria-selected', String(i === state.skillCat)));
        $('#skillPanel').innerHTML = skillPanel();
        break;
      }
      case 'skill-toggle': {
        const open = !t.classList.contains('open');
        $$('.skill-card.open').forEach((c) => c.classList.remove('open'));
        t.classList.toggle('open', open);
        t.setAttribute('aria-expanded', String(open));
        break;
      }
      case 'sheet-more': $('#sheetWrap').classList.add('open'); break;
      case 'replay': window.scrollTo(0, 0); $('#site').hidden = true; runOpening(); break;
    }
  });

  // skill evidence on hover (fine pointers); tap toggles on touch
  document.addEventListener('pointerover', (e) => {
    if (!fineMQ.matches) return;
    const c = e.target.closest?.('.skill-card');
    if (c && !c.classList.contains('open')) { $$('.skill-card.open').forEach((x) => x.classList.remove('open')); c.classList.add('open'); }
  });
  document.addEventListener('pointerout', (e) => {
    if (!fineMQ.matches) return;
    const c = e.target.closest?.('.skill-card');
    if (c && !c.contains(e.relatedTarget)) c.classList.remove('open');
  });

  // project cards are role=button divs: keyboard activation
  document.addEventListener('keydown', (e) => {
    const card = e.target.closest?.('.pcard-box');
    if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openProject(card.dataset.id); }
  });

  // Escape / Enter / arrows
  document.addEventListener('keydown', (e) => {
    if (state.stage === 'opening' && (e.key === 'Escape' || e.key === 'Enter')) return finishOpening();
    if (state.stage === 'profiles' && e.key === 'Escape') return pickProfile('musthaq');
    const top = state.overlays[state.overlays.length - 1];
    if (top) {
      if (e.key === 'Escape') return top.close();
      if (top.name === 'intro') $('.intro')?._keys?.(e);
      if (top.name === 'lightbox') $('.lightbox')?._keys?.(e);
      return;
    }
    if (e.key === 'Escape' && $('.profile-menu')) toggleProfileMenu(false);
  });

  /* tilt on pointer move (fine pointers only) */
  function bindTilt(root = document) {
    if (!fineMQ.matches || reduced()) return;
    $$('[data-tilt]', root).forEach((el) => {
      if (el.dataset.tiltBound) return;
      el.dataset.tiltBound = '1';
      const max = parseFloat(el.dataset.tilt) || 6;
      el.style.transition = 'transform .35s var(--ease)';
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform .08s linear';
        el.style.transform = `perspective(1000px) rotateY(${x * max * 2}deg) rotateX(${-y * max * 2}deg)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transition = 'transform .5s var(--ease)'; el.style.transform = ''; });
    });
  }
  new MutationObserver(() => bindTilt()).observe(document.body, { childList: true, subtree: true });

  /* custom cursor (fine pointers, no reduced motion) */
  function initCursor() {
    if (!fineMQ.matches || reduced()) return;
    const c = $('#cursor');
    const LABELS = { view: 'VIEW', play: '▶', link: '↗', drag: '↔', close: '✕' };
    document.documentElement.classList.add('has-cursor');
    window.addEventListener('pointermove', (e) => {
      c.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
      c.classList.add('visible');
      const tagged = e.target.closest?.('[data-cursor]');
      const mode = tagged?.dataset.cursor;
      const link = !tagged && e.target.closest?.('a,button,[role="button"]');
      c.className = `cursor visible${mode && LABELS[mode] ? ' label' : link ? ' link' : ''}${mode === 'view' ? ' big' : ''}`;
      c.textContent = mode && LABELS[mode] ? LABELS[mode] : '';
    }, { passive: true });
    document.addEventListener('pointerleave', () => c.classList.remove('visible'));
  }

  /* ======================================================================
     Boot
     ====================================================================== */
  // re-render Originals when crossing the desktop breakpoint
  desktopMQ.addEventListener?.('change', () => {
    if (state.stage !== 'home') return;
    const scene = $('#originals');
    if (!scene) return;
    state.cleanups.forEach((fn) => { try { fn(); } catch { /* noop */ } });
    renderSite();
  });

  initCursor();
  const stored = store.get(STORAGE_KEY);
  if (stored && viewerProfiles.some((p) => p.id === stored)) {
    state.profileId = stored;
    enterHome();
  } else {
    runOpening();
  }
})();
