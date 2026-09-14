/* UNIT SPACE CITY v2 — общий JS (index + units/*). Логика шапки/меню/языка — как на БСО. */
(function () {
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ASSETS = document.documentElement.getAttribute('data-assets') || 'assets/';
  document.documentElement.className += ' js';

  /* ---------- header: is-solid после 40px (на внутренних страницах — всегда) ---------- */
  var header = document.getElementById('header');
  var alwaysSolid = document.body.classList.contains('page');
  function syncHeader() { if (header) header.classList.toggle('is-solid', alwaysSolid || window.scrollY > 40); }
  addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  /* ---------- burger → полноэкранный оверлей (inert/aria-hidden, как БСО) ---------- */
  var burger = document.getElementById('burger'), overlay = document.getElementById('menuOverlay'), menuClose = document.getElementById('menuClose');
  function setMenuOpen(open) {
    document.body.classList.toggle('menu-open', open);
    if (burger) burger.setAttribute('aria-expanded', String(open));
    if (overlay) { overlay.toggleAttribute('inert', !open); overlay.setAttribute('aria-hidden', String(!open)); }
    if (open && menuClose) menuClose.focus(); else if (!open && burger && document.activeElement && overlay && overlay.contains(document.activeElement)) burger.focus();
  }
  if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.addEventListener('click', function () { setMenuOpen(!document.body.classList.contains('menu-open')); }); }
  if (overlay) { overlay.setAttribute('aria-hidden', 'true'); overlay.setAttribute('inert', ''); overlay.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenuOpen(false); }); }); }
  if (menuClose) menuClose.addEventListener('click', function () { setMenuOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenuOpen(false); });

  /* ---------- язык (паттерн БСО): у каждого языка свой URL (/ и /en/), кнопка ведёт на
     hreflang-альтернативу; словарь применяется к JS-частям по <html lang> ---------- */
  var pageLang = document.documentElement.lang === 'en' ? 'en' : 'ru';
  function altHref(lang) { var l = document.querySelector('link[rel="alternate"][hreflang="' + lang + '"]'); return l ? l.getAttribute('href') : null; }
  var wanted = /[?&]lang=(ru|en)/.exec(location.search);
  if (wanted && wanted[1] !== pageLang && altHref(wanted[1])) { location.replace(altHref(wanted[1]) + location.hash); }
  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      var l = b.dataset.lang; if (l === pageLang) return;
      var href = altHref(l); if (href) location.href = href + location.hash; else if (window.setLang) window.setLang(l);
    });
  });
  if (window.setLang) window.setLang(pageLang);

  /* ---------- scrollspy: активный пункт меню ---------- */
  var navLinks = [].slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var secs = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var spy = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- reveal ---------- */
  setTimeout(function () { document.querySelectorAll('.rv:not(.in)').forEach(function (el) { el.classList.add('in'); }); }, 1200);
  if ('IntersectionObserver' in window && !rm) {
    var io = new IntersectionObserver(function (ents) { ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
    requestAnimationFrame(function () { document.querySelectorAll('.rv').forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }); });
  } else { document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- cookie-баннер → после него карточка карты в хиро ---------- */
  (function () {
    var KEY = 'usc_cookie_ok', bar = document.getElementById('consentBar'), card = document.getElementById('heroCard');
    var accepted = false; try { accepted = !!localStorage.getItem(KEY); } catch (e) {}
    function showCard(d) { setTimeout(function () { if (card) card.classList.add('in'); }, d); }
    if (accepted || !bar) { showCard(400); }
    else {
      setTimeout(function () { bar.classList.add('in'); showCard(600); }, 700);
      var ok = document.getElementById('consentOk');
      if (ok) ok.addEventListener('click', function () { try { localStorage.setItem(KEY, '1'); } catch (e) {} bar.classList.remove('in'); });
    }
  })();

  /* ---------- count-up ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count')); if (isNaN(target)) return;
    if (rm) { el.textContent = target; return; }
    var dur = 1100, t0 = performance.now(), dec = (String(target).split('.')[1] || '').length;
    (function tick(now) { var p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = (target * e).toFixed(dec); if (p < 1) requestAnimationFrame(tick); else el.textContent = target; })(performance.now());
  }
  if ('IntersectionObserver' in window) {
    var nio = new IntersectionObserver(function (ents) { ents.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); nio.unobserve(en.target); } }); }, { threshold: .6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { nio.observe(el); });
  }

  /* ---------- комплексы: слайдер, переключение кнопками U1/U2/U3 (+ свайп, стрелки, #cx-uN) ---------- */
  var cxNav = document.querySelector('.complex-nav'), cxTrack = document.querySelector('.complex-track');
  if (cxNav && cxTrack) {
    var tabs = [].slice.call(cxNav.querySelectorAll('button[data-cx]')), ink = document.getElementById('cxInk');
    var slides = tabs.map(function (t) { return document.getElementById(t.dataset.cx); });
    var cur = 0;
    function moveInk(t) { if (ink) { ink.style.left = t.offsetLeft + 'px'; ink.style.width = t.offsetWidth + 'px'; } }
    function go(i, focusTab) {
      i = Math.max(0, Math.min(slides.length - 1, i)); cur = i;
      slides.forEach(function (s, k) { s.setAttribute('data-state', k === i ? 'active' : (k < i ? 'prev' : 'next')); });
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      moveInk(tabs[i]);
      if (focusTab) tabs[i].focus();
    }
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { go(i); }); });
    cxNav.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(cur + 1, true); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(cur - 1, true); e.preventDefault(); }
    });
    addEventListener('resize', function () { moveInk(tabs[cur]); });
    var hash = (location.hash || '').replace('#', ''), start = slides.findIndex(function (s) { return s && s.id === hash; });
    go(start >= 0 ? start : 0);
    if (start >= 0) requestAnimationFrame(function () { cxNav.scrollIntoView({ block: 'start' }); });
    addEventListener('hashchange', function () { var h = location.hash.replace('#', ''), i = slides.findIndex(function (s) { return s.id === h; }); if (i >= 0) go(i); });
  }

  /* ---------- каталог: карточки-товары, ссылки на units/<slug>.html; перерисовка при смене языка ---------- */
  var uWrap = document.getElementById('units'), uCnt = document.getElementById('unitCount'), filters = document.getElementById('filters');
  var L = function () { return window.__uscLang || 'ru'; };
  window.__uscUnitCard = function (u, hrefBase) {
    var CX = window.USC_COMPLEX, lang = L(), ph = u.photos[0];
    return '<a class="product-card" href="' + hrefBase + u.slug + '.html">' +
      '<div class="product-card__media"><picture><source srcset="' + ASSETS + ph + '.webp" type="image/webp">' +
      '<img src="' + ASSETS + ph + '.jpg" alt="' + CX[u.q].code + ' — ' + u.name[lang] + '" width="480" height="360" loading="lazy"></picture></div>' +
      '<div class="product-card__row"><div><div class="product-card__name">' + u.name[lang] + ' <b>' + u.area + ' m²'.replace('m', lang === 'ru' ? 'м' : 'm') + '</b></div>' +
      '<div class="product-card__meta dim">' + CX[u.q].code + ' — ' + CX[u.q].name + ', ' + u.floor[lang] + '</div></div>' +
      '<span class="product-card__price">' + (window.USC_PRICE[lang][u.fmt] || '') + '</span></div></a>';
  };
  if (uWrap && window.USC_UNITS) {
    var st = { q: 'all', fmt: 'all' };
    function renderUnits() {
      var list = window.USC_UNITS.filter(function (u) { return (st.q === 'all' || u.q === st.q) && (st.fmt === 'all' || u.fmt === st.fmt); });
      if (uCnt) uCnt.textContent = list.length;
      if (!list.length) {
        var d = (window.I18N && window.I18N[L()]) || {};
        uWrap.innerHTML = '<div class="card empty"><h3 class="t-h3">' + (d['cat.empty_t'] || '') + '</h3><p>' + (d['cat.empty_p'] || '') + '</p>' +
          '<div class="cta-row"><a href="#lead" class="btn btn-primary">' + (d['cat.empty_cta'] || '') + '</a>' +
          '<button type="button" class="btn btn-outline" id="unitsReset">' + (d['cat.reset'] || '') + '</button></div></div>';
        var rb = document.getElementById('unitsReset');
        if (rb) rb.addEventListener('click', function () {
          st.q = 'all'; st.fmt = 'all';
          if (filters) filters.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.v === 'all' ? 'true' : 'false'); });
          renderUnits();
        });
        return;
      }
      uWrap.innerHTML = list.map(function (u) { return window.__uscUnitCard(u, 'units/'); }).join('');
    }
    if (filters) filters.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      var f = b.dataset.f;
      filters.querySelectorAll('.chip[data-f="' + f + '"]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      st[f] = b.dataset.v; renderUnits();
    });
    renderUnits();
    var prevHook = window.__uscRerender;
    window.__uscRerender = function (lang) { if (prevHook) prevHook(lang); renderUnits(); };
  }


  /* ---------- страница юнита: поля по языку + «другие форматы» ---------- */
  var unitSlug = document.body.getAttribute('data-unit');
  if (unitSlug && window.USC_UNITS) {
    var unit = window.USC_UNITS.filter(function (u) { return u.slug === unitSlug; })[0];
    var more = document.getElementById('moreUnits');
    function renderUnit(lang) {
      if (!unit) return;
      var cx = window.USC_COMPLEX[unit.q];
      var f = { name: unit.name[lang], floor: unit.floor[lang], price: window.USC_PRICE[lang][unit.fmt], where: cx.where[lang], status: cx.status[lang], desc: window.USC_FMT[unit.fmt].desc[lang], m2: lang === 'ru' ? 'м²' : 'm²' };
      document.querySelectorAll('[data-unit-field]').forEach(function (el) { var k = el.getAttribute('data-unit-field'); if (f[k] != null) el.textContent = f[k]; });
      document.title = f.name + ' ' + unit.area + ' ' + f.m2 + ', ' + cx.code + ' ' + cx.name + ' — Unit Space City';
      if (more) {
        var others = window.USC_UNITS.filter(function (u) { return u.slug !== unit.slug && u.q === unit.q; });
        if (others.length < 3) others = others.concat(window.USC_UNITS.filter(function (u) { return u.slug !== unit.slug && u.q !== unit.q; })).slice(0, 3);
        more.innerHTML = others.slice(0, 3).map(function (u) { return window.__uscUnitCard(u, ''); }).join('');
      }
    }
    renderUnit(window.__uscLang || 'ru');
    var prev2 = window.__uscRerender;
    window.__uscRerender = function (lang) { if (prev2) prev2(lang); renderUnit(lang); };
  }



  /* ---------- галерея-барабан на странице юнита: окно из 7 превью вокруг активного, шаг = сдвиг ленты ---------- */
  var ugal = document.getElementById('ugal');
  if (ugal) (function () {
    var photos = ugal.getAttribute('data-photos').split(','), n = photos.length, alt = ugal.getAttribute('data-alt') || '';
    var base = ASSETS, drum = ugal.querySelector('.ugal__drum'), track = ugal.querySelector('.ugal__track'), stage = ugal.querySelector('.ugal__stage');
    var count = ugal.querySelector('.ugal__count b'), cur = 0, busy = false, HALF = 3;
    function horizontal() { return matchMedia('(max-width:760px)').matches; }
    function slot(k) { return ((k % n) + n) % n; }
    function renderTrack() {
      var html = '';
      for (var o = -HALF; o <= HALF; o++) {
        var i = slot(cur + o);
        html += '<button type="button" class="ugal__thumb' + (o === 0 ? ' is-active' : '') + '" data-o="' + o + '" aria-label="' + (i + 1) + '/' + n + '"><img src="' + base + photos[i] + '.webp" alt="" width="160" height="120"></button>';
      }
      track.classList.remove('is-anim'); track.style.transform = ''; track.innerHTML = html;
    }
    function swapStage(i) {
      var old = stage.querySelector('img.is-in'), img = document.createElement('img');
      img.src = base + photos[i] + '.jpg'; img.alt = alt; img.width = 1200; img.height = 900;
      stage.insertBefore(img, stage.querySelector('.ugal__nav'));
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        img.classList.add('is-in');
        if (old) { old.classList.remove('is-in'); setTimeout(function () { old.remove(); }, 600); }
      }); });
      if (count) count.textContent = i + 1;
    }
    function go(delta) {
      if (busy || !delta) return; busy = true;
      var th = track.querySelector('.ugal__thumb'), gap = 8, step = (horizontal() ? th.offsetWidth : th.offsetHeight) + gap;
      track.classList.add('is-anim');
      track.style.transform = horizontal() ? 'translateX(calc(-50% - ' + (delta * step) + 'px))' : 'translateY(calc(-50% - ' + (delta * step) + 'px))';
      cur = slot(cur + delta); swapStage(cur);
      var done = false; function fin() { if (done) return; done = true; renderTrack(); busy = false; }
      track.addEventListener('transitionend', fin, { once: true }); setTimeout(fin, 520);
    }
    renderTrack(); if (count) count.textContent = 1;
    track.addEventListener('click', function (e) { var t = e.target.closest('.ugal__thumb'); if (t) go(+t.getAttribute('data-o')); });
    ugal.querySelectorAll('.ugal__btn').forEach(function (b) { b.addEventListener('click', function () { go(+b.getAttribute('data-dir')); }); });
    stage.addEventListener('click', function (e) { if (!e.target.closest('.ugal__nav')) go(1); });
    var wheelT = 0;
    drum.addEventListener('wheel', function (e) { e.preventDefault(); var now = Date.now(); if (now - wheelT < 350) return; wheelT = now; var d = horizontal() ? (e.deltaX || e.deltaY) : e.deltaY; go(d > 0 ? 1 : -1); }, { passive: false });
    var p0 = null;
    drum.addEventListener('pointerdown', function (e) { p0 = { x: e.clientX, y: e.clientY }; });
    addEventListener('pointerup', function (e) { if (!p0) return; var d = horizontal() ? e.clientX - p0.x : e.clientY - p0.y; p0 = null; if (Math.abs(d) > 24) go(d < 0 ? 1 : -1); });
    drum.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { go(1); e.preventDefault(); } if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { go(-1); e.preventDefault(); } });
    addEventListener('resize', renderTrack);
  })();

  /* ---------- калькулятор ---------- */
  var ids = ['c-price', 'c-rate', 'c-occ', 'c-mgmt'];
  if (document.getElementById('c-price')) {
    function money(n) { return '$' + Math.round(n).toLocaleString('ru-RU'); }
    function val(id) { return document.getElementById(id).value || 0; }
    function calc() {
      var price = +val('c-price'), rate = +val('c-rate'), occ = (+val('c-occ')) / 100, mgmt = (+val('c-mgmt')) / 100;
      var gross = rate * 365 * occ, net = gross * (1 - mgmt);
      document.getElementById('o-gross').textContent = money(gross);
      document.getElementById('o-net').textContent = money(net);
      document.getElementById('o-roi').textContent = price > 0 ? (net / price * 100).toFixed(1) + '%' : '—';
    }
    ids.forEach(function (id) { document.getElementById(id).addEventListener('input', calc); });
    calc();
  }
})();
