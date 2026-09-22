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

  /* ---------- язык (паттерн БСО): у каждого языка свой URL (EN — корень /, RU — /ru/; Босс 15.09: основной язык EN),
     кнопка ведёт на hreflang-альтернативу; словарь применяется к JS-частям по <html lang> ---------- */
  var pageLang = document.documentElement.lang === 'ru' ? 'ru' : 'en';
  /* альтернатива берётся из hreflang, но переводится на текущий origin/путь — с превью или своего домена не уводит на GitHub Pages */
  function altHref(lang) {
    var l = document.querySelector('link[rel="alternate"][hreflang="' + lang + '"]'); if (!l) return null;
    var me = document.querySelector('link[rel="canonical"]'), href = l.getAttribute('href');
    if (!me) return href;
    var tail = /(?:ru\/)?(?:units\/[^/]*\.html|privacy\.html|index\.html)?$/;
    var base = me.getAttribute('href').replace(tail, '');
    if (href.indexOf(base) !== 0) return href;
    return location.pathname.replace(tail, '') + href.slice(base.length);
  }
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
  if ('IntersectionObserver' in window && !rm) {
    /* страховка: если observer не сработал (скрытая вкладка) — видимое показываем через 4 с; ниже экрана — только по скроллу */
    setTimeout(function () { document.querySelectorAll('.rv:not(.in)').forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }); }, 4000);
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
    /* свайп влево/вправо по контенту комплекса — переключает U1/U2/U3, не только кнопки табов (Босс 22.09) */
    var cxSlider = document.getElementById('complexSlider');
    if (cxSlider) {
      var sp0 = null;
      /* не перехватываем свайп, начатый в собственных горизонтальных лентах (коллаж/полоса фото) — иначе он листал бы комплекс вместо фото */
      cxSlider.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' || e.target.closest('.complex__gallery, .strip__track')) { sp0 = null; return; }
        sp0 = { x: e.clientX, y: e.clientY };
      });
      cxSlider.addEventListener('pointerup', function (e) {
        if (!sp0) return;
        var dx = e.clientX - sp0.x, dy = e.clientY - sp0.y; sp0 = null;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) go(cur + (dx < 0 ? 1 : -1));
      });
    }
    var hash = (location.hash || '').replace('#', ''), start = slides.findIndex(function (s) { return s && s.id === hash; });
    go(start >= 0 ? start : 0);
    if (start >= 0) requestAnimationFrame(function () { cxNav.scrollIntoView({ block: 'start' }); });
    addEventListener('hashchange', function () { var h = location.hash.replace('#', ''), i = slides.findIndex(function (s) { return s.id === h; }); if (i >= 0) go(i); });
  }

  /* ---------- каталог: карточки-товары, ссылки на units/<slug>.html; перерисовка при смене языка ---------- */
  var uWrap = document.getElementById('units'), uCnt = document.getElementById('unitCount'), filters = document.getElementById('filters');
  var L = function () { return window.__uscLang || pageLang; };
  var D = function () { return (window.I18N && window.I18N[L()]) || {}; };
  /* карточка формата (как в блоке «Форматы вилл» на главной) — для «Других форматов» на странице юнита (Босс 15.09:
     там стоял старый product-card). Строки — из словаря по ключам fmt.<fmt>_r/_w (+ f_out/villa_o у виллы) */
  window.__uscFmtCard = function (u, hrefBase) {
    var CX = window.USC_COMPLEX, lang = L(), d = D(), ph = u.photos[0], m2 = lang === 'ru' ? 'м²' : 'm²';
    var row = function (k, v) { return '<div><span>' + (d[k] || '') + '</span><b>' + (d[v] || '') + '</b></div>'; };
    var rows = row('fmt.f_rooms', 'fmt.' + u.fmt + '_r') + row('fmt.f_where', 'fmt.' + u.fmt + '_w') +
      (u.fmt === 'villa' ? row('fmt.f_out', 'fmt.villa_o') : row('fmt.f_fit', 'fmt.f_full')) + row('fmt.f_yield', 'fmt.f_uk');
    return '<a class="card fmt-card" href="' + hrefBase + u.slug + '.html">' +
      '<div class="fmt-card__media"><picture><source srcset="' + ASSETS + ph + '.webp" type="image/webp">' +
      '<img src="' + ASSETS + ph + '.jpg" alt="' + CX[u.q].code + ' — ' + u.name[lang] + '" width="720" height="450" loading="lazy"></picture>' +
      '<span class="product-card__area">' + u.area + ' ' + m2 + '</span></div>' +
      '<div class="fmt-card__body"><div class="fmt-card__head"><div><div class="fmt-card__name">' + u.name[lang] + '</div>' +
      '<div class="product-card__meta dim">' + CX[u.q].code + ', ' + u.floor[lang] + '</div></div></div>' +
      '<div class="leaders fmt-card__rows">' + rows + '</div>' +
      '<div class="fmt-card__foot"><span class="fmt-card__plan" aria-hidden="true">' + (d['fmt.plan'] || '') + '</span>' +
      '<span class="product-card__price">' + (window.USC_PRICE[lang][u.fmt] || '') + '</span></div>' +
      '<span class="btn btn-primary fmt-card__more">' + (d['fmt.more'] || '') + '</span></div></a>';
  };
  window.__uscUnitCard = function (u, hrefBase) {
    var CX = window.USC_COMPLEX, lang = L(), ph = u.photos[0];
    return '<a class="product-card" href="' + hrefBase + u.slug + '.html">' +
      '<div class="product-card__media"><picture><source srcset="' + ASSETS + ph + '.webp" type="image/webp">' +
      '<img src="' + ASSETS + ph + '.jpg" alt="' + CX[u.q].code + ' — ' + u.name[lang] + '" width="480" height="360" loading="lazy"></picture>' +
      '<span class="product-card__area">' + u.area + ' m²'.replace('m', lang === 'ru' ? 'м' : 'm') + '</span></div>' +
      '<div class="product-card__row"><div><div class="product-card__name">' + u.name[lang] + '</div>' +
      '<div class="product-card__meta dim">' + CX[u.q].code + ', ' + u.floor[lang] + '</div></div>' +
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
        more.innerHTML = others.slice(0, 3).map(function (u) { return window.__uscFmtCard(u, ''); }).join('');
      }
    }
    renderUnit(window.__uscLang || pageLang);
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
    /* окно превью: до 7 вокруг активного, но не больше n — без дублей при коротких наборах (U3: 4 рендера);
       при асимметричном окне (-1..2) лента сдвигается на base, чтобы активное осталось по центру */
    var LO = -Math.min(HALF, Math.floor((n - 1) / 2)), HI = Math.min(HALF, n - 1 + LO);
    function step() { var th = track.querySelector('.ugal__thumb'); return (horizontal() ? th.offsetWidth : th.offsetHeight) + 8; }
    function shift(px) { return horizontal() ? 'translateX(calc(-50% - ' + px + 'px))' : 'translateY(calc(-50% - ' + px + 'px))'; }
    function centerFix() { return (HI + LO) / 2 * step(); }
    function renderTrack() {
      var html = '';
      for (var o = LO; o <= HI; o++) {
        var i = slot(cur + o);
        /* превью — из photos/t/ (320×240, ~8 KB), а не полноразмерный webp 1800px (Босс 15.09: «фото плохо грузятся») */
        html += '<button type="button" class="ugal__thumb' + (o === 0 ? ' is-active' : '') + '" data-o="' + o + '" aria-label="' + (i + 1) + '/' + n + '"><img src="' + base + 't/' + photos[i] + '.webp" alt="" width="160" height="120" decoding="async"></button>';
      }
      track.classList.remove('is-anim'); track.innerHTML = html; track.style.transform = shift(centerFix());
    }
    /* большой кадр — webp через <picture> (jpg только как фолбэк), соседние кадры подгружаем заранее */
    var pre = {};
    function preload(i) { i = slot(i); if (pre[i]) return; pre[i] = true; var im = new Image(); im.src = base + photos[i] + '.webp'; }
    function swapStage(i) {
      var old = stage.querySelector('picture.is-in, img.is-in'), pic = document.createElement('picture');
      pic.innerHTML = '<source srcset="' + base + photos[i] + '.webp" type="image/webp"><img src="' + base + photos[i] + '.jpg" alt="" width="1200" height="900" decoding="async">';
      pic.querySelector('img').alt = alt;
      stage.insertBefore(pic, stage.querySelector('.ugal__nav'));
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        pic.classList.add('is-in');
        if (old) { old.classList.remove('is-in'); setTimeout(function () { old.remove(); }, 600); }
      }); });
      if (count) count.textContent = i + 1;
      preload(i + 1); preload(i - 1);
    }
    addEventListener('load', function () { preload(1); preload(n - 1); }, { once: true });
    function go(delta) {
      if (busy || !delta) return; busy = true;
      track.classList.add('is-anim');
      track.style.transform = shift(centerFix() + delta * step());
      cur = slot(cur + delta); swapStage(cur);
      var done = false; function fin() { if (done) return; done = true; renderTrack(); busy = false; }
      track.addEventListener('transitionend', function onEnd(e) { if (e.target !== track || e.propertyName !== 'transform') return; track.removeEventListener('transitionend', onEnd); fin(); }); setTimeout(fin, 520);
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

  /* ---------- лайтбокс «галерея проекта»: клик по любому фото в коллаже или ленте комплекса
     открывает оверлей на полный набор фото этого комплекса (Босс 21.09) ---------- */
  var lightbox = document.getElementById('lightbox');
  if (lightbox) (function () {
    var img = document.getElementById('lightboxImg'), curEl = document.getElementById('lightboxCur'), totalEl = document.getElementById('lightboxTotal');
    var list = [], idx = 0, lastFocus = null;
    function show(i) {
      idx = ((i % list.length) + list.length) % list.length;
      var p = list[idx];
      img.src = p.jpg; img.alt = p.alt || '';
      curEl.textContent = idx + 1; totalEl.textContent = list.length;
    }
    function open(items, startIdx) {
      list = items; if (!list.length) return;
      lastFocus = document.activeElement;
      lightbox.hidden = false;
      document.body.classList.add('lightbox-open');
      requestAnimationFrame(function () { lightbox.classList.add('in'); });
      show(startIdx);
      lightbox.querySelector('.lightbox__close').focus();
    }
    function close() {
      lightbox.classList.remove('in');
      document.body.classList.remove('lightbox-open');
      setTimeout(function () { lightbox.hidden = true; }, 250);
      if (lastFocus) lastFocus.focus();
    }
    function collect(article) {
      var imgs = article.querySelectorAll('.complex__gallery img, .strip__track img'), out = [], seen = {};
      imgs.forEach(function (im) {
        if (seen[im.src]) return; seen[im.src] = true;
        out.push({ jpg: im.src, alt: im.alt });
      });
      return out;
    }
    document.querySelectorAll('.complex').forEach(function (article) {
      article.querySelectorAll('.complex__gallery figure, .strip__track figure').forEach(function (fig) {
        fig.style.cursor = 'zoom-in';
        fig.addEventListener('click', function () {
          var items = collect(article), im = fig.querySelector('img');
          var start = items.findIndex(function (p) { return p.jpg === im.src; });
          open(items, start < 0 ? 0 : start);
        });
      });
    });
    lightbox.querySelector('.lightbox__close').addEventListener('click', close);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
    lightbox.querySelectorAll('.lightbox__btn').forEach(function (b) { b.addEventListener('click', function () { show(idx + (+b.getAttribute('data-dir'))); }); });
    addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
  })();

  /* ---------- кастомные выпадающие списки в форме: нативный <select> остаётся источником значения.
     Код страны (#f-cc): полный справочник USC_COUNTRIES, поиск, тонкий индикатор прокрутки, автоформат
     номера по маске — функционально как на БСО (Босс 15.09) ---------- */
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  function fillCountrySelect(select) {
    var rows = window.USC_COUNTRIES; if (!select || !rows) return;
    var lg = L(), prevIso = select.selectedOptions[0] && select.selectedOptions[0].getAttribute('data-iso');
    var sorted = rows.slice().sort(function (a, b) { return (lg === 'ru' ? a[1] : a[2]).localeCompare(lg === 'ru' ? b[1] : b[2], lg); });
    select.innerHTML = '';
    sorted.forEach(function (r) {
      var o = document.createElement('option');
      o.value = r[3]; o.textContent = r[0] + ' +' + r[3];
      o.setAttribute('data-iso', r[0]); o.setAttribute('data-format', r[4] || '');
      o.setAttribute('data-label', (lg === 'ru' ? r[1] : r[2]) + '  +' + r[3]);
      o.setAttribute('data-search', (r[1] + ' ' + r[2] + ' ' + r[0] + ' ' + r[3]).toLowerCase());
      select.appendChild(o);
    });
    var pick = select.querySelector('option[data-iso="' + (prevIso || 'ID') + '"]') || select.options[0];
    if (pick) pick.selected = true;
  }
  var csels = [];
  document.querySelectorAll('.lead-form select').forEach(function (select) {
    var searchable = select.id === 'f-cc';
    if (searchable) fillCountrySelect(select);
    var wrap = document.createElement('div'); wrap.className = 'csel';
    select.parentNode.insertBefore(wrap, select); wrap.appendChild(select);
    select.classList.add('csel-native'); select.tabIndex = -1;
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'csel-btn';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    var lab = select.id && document.querySelector('label[for="' + select.id + '"]');
    if (lab) { lab.id = lab.id || select.id + '-label'; btn.setAttribute('aria-labelledby', lab.id); }
    if (select.getAttribute('aria-label')) btn.setAttribute('aria-label', select.getAttribute('aria-label'));
    btn.innerHTML = '<span class="csel-val"></span>' + CHEV;
    var pop = document.createElement('div'); pop.className = 'csel-pop'; pop.hidden = true;
    var search = null;
    if (searchable) {
      search = document.createElement('input'); search.type = 'text'; search.className = 'csel-search';
      search.autocomplete = 'off'; search.spellcheck = false; pop.appendChild(search);
    }
    var list = document.createElement('ul'); list.className = 'csel-list'; list.setAttribute('role', 'listbox');
    pop.appendChild(list);
    var sb = document.createElement('div'); sb.className = 'csel-sb'; sb.innerHTML = '<div class="csel-sb-thumb"></div>'; pop.appendChild(sb);
    wrap.appendChild(btn); wrap.appendChild(pop);
    var active = -1;
    function vis() { return Array.prototype.filter.call(list.children, function (li) { return !li.hidden; }); }
    function syncSb() {
      requestAnimationFrame(function () {
        var over = list.scrollHeight - list.clientHeight;
        if (over <= 2) { sb.classList.remove('on'); return; }
        sb.classList.add('on');
        var th = Math.max(24, sb.clientHeight * (list.clientHeight / list.scrollHeight));
        sb.firstChild.style.height = th + 'px';
        sb.firstChild.style.transform = 'translateY(' + ((sb.clientHeight - th) * (list.scrollTop / over)) + 'px)';
      });
    }
    list.addEventListener('scroll', syncSb, { passive: true });
    function render() {
      list.innerHTML = '';
      Array.prototype.forEach.call(select.options, function (o, i) {
        var li = document.createElement('li'); li.className = 'csel-opt' + (i === select.selectedIndex ? ' is-sel' : '');
        li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === select.selectedIndex)); li.dataset.i = i;
        if (o.getAttribute('data-search')) li.dataset.search = o.getAttribute('data-search');
        li.textContent = o.getAttribute('data-label') || o.textContent;
        list.appendChild(li);
      });
      btn.querySelector('.csel-val').textContent = select.selectedIndex >= 0 ? select.options[select.selectedIndex].textContent : '';
      if (search) { search.placeholder = D()['form.cc_search'] || 'Search'; search.setAttribute('aria-label', search.placeholder); }
    }
    function mark(i) {
      active = i; var v = vis();
      Array.prototype.forEach.call(list.children, function (li) { li.classList.remove('is-active'); });
      if (v[i]) { v[i].classList.add('is-active'); v[i].scrollIntoView({ block: 'nearest' }); }
    }
    function applyFilter() {
      var q = (search ? search.value : '').trim().toLowerCase().replace(/^\+/, '');
      Array.prototype.forEach.call(list.children, function (li) { li.hidden = q ? (li.dataset.search || li.textContent.toLowerCase()).indexOf(q) === -1 : false; });
      list.scrollTop = 0; mark(vis().length ? 0 : -1); syncSb();
    }
    function open() {
      if (wrap.classList.contains('is-open')) return;
      csels.forEach(function (c) { c.close(); });
      render(); pop.hidden = false; wrap.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
      if (search) { search.value = ''; applyFilter(); setTimeout(function () { search.focus(); }, 0); }   // список с поиском — всегда сверху
      else { var sel = list.querySelector('.is-sel'); mark(sel ? Array.prototype.indexOf.call(list.children, sel) : 0); }
      syncSb();
    }
    function close() { if (!wrap.classList.contains('is-open')) return; pop.hidden = true; wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); active = -1; }
    function pick(li) {
      if (!li) return;
      select.selectedIndex = +li.dataset.i; select.dispatchEvent(new Event('change', { bubbles: true })); render(); close(); btn.focus();
    }
    btn.addEventListener('click', function () { wrap.classList.contains('is-open') ? close() : open(); });
    btn.addEventListener('keydown', function (e) {
      var isOpen = wrap.classList.contains('is-open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!isOpen) open(); else if (!search) { var n = vis().length; mark((active + (e.key === 'ArrowDown' ? 1 : n - 1)) % n); } }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!isOpen) open(); else if (active >= 0) pick(vis()[active]); }
      else if (e.key === 'Escape' || e.key === 'Tab') { close(); }
    });
    if (search) {
      search.addEventListener('input', applyFilter);
      search.addEventListener('keydown', function (e) {
        var v = vis();
        if (e.key === 'ArrowDown') { e.preventDefault(); mark(Math.min(active + 1, v.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); mark(Math.max(active - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); pick(v[active]); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); btn.focus(); }
      });
    }
    list.addEventListener('click', function (e) { var li = e.target.closest('.csel-opt'); if (li) pick(li); });
    list.addEventListener('mousemove', function (e) { var li = e.target.closest('.csel-opt'); if (li && !li.hidden) mark(vis().indexOf(li)); });
    render();
    csels.push({ wrap: wrap, render: render, close: close, refill: searchable ? function () { fillCountrySelect(select); render(); } : null });
  });
  /* автоформат номера по маске выбранной страны (как на БСО main.js formatPhoneDigits) */
  document.querySelectorAll('.lead-form__phone').forEach(function (row) {
    var cc = row.querySelector('select'), tel = row.querySelector('input[type="tel"]'); if (!cc || !tel) return;
    function fmt(digits, pattern) {
      if (!pattern) return digits;
      var out = [], i = 0;
      pattern.split('-').map(Number).forEach(function (g) { if (i < digits.length) { out.push(digits.slice(i, i + g)); i += g; } });
      if (i < digits.length) out.push(digits.slice(i));
      return out.filter(Boolean).join(' ');
    }
    function reformat() { var o = cc.selectedOptions[0]; tel.value = fmt(tel.value.replace(/\D+/g, ''), o && o.getAttribute('data-format')); }
    tel.addEventListener('input', reformat); cc.addEventListener('change', reformat);
  });
  if (csels.length) {
    document.addEventListener('click', function (e) { csels.forEach(function (c) { if (!c.wrap.contains(e.target)) c.close(); }); });
    var prevCsel = window.__uscRerender;
    window.__uscRerender = function (lang) { if (prevCsel) prevCsel(lang); csels.forEach(function (c) { if (c.refill) c.refill(); else c.render(); }); };
  }

  /* ---------- живая строка футера: время на Бали (WITA) + температура (Open-Meteo, без ключа; если фетч не прошёл — прячем только температуру) ---------- */
  var baliTime = document.getElementById('baliTime');
  if (baliTime) {
    var tf = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit' });
    var syncBali = function () { baliTime.textContent = tf.format(new Date()); };
    syncBali(); setInterval(syncBali, 30000);
  }
  var baliTemp = document.getElementById('baliTemp'), baliWrap = document.getElementById('baliWeatherWrap');
  if (baliTemp && baliWrap) {
    baliWrap.hidden = true;
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-8.57&longitude=115.08&current=temperature_2m&timezone=Asia%2FMakassar')
      .then(function (r) { if (!r.ok) throw new Error('weather ' + r.status); return r.json(); })
      .then(function (d) { var t = d && d.current && d.current.temperature_2m; if (typeof t !== 'number') throw new Error('no temp'); var n = Math.round(t); baliTemp.textContent = (n >= 0 ? '+' : '') + n + '°C'; baliWrap.hidden = false; })
      .catch(function () { baliWrap.hidden = true; });
  }

  /* ---------- хиро: кроссфейд кадров каждые 6 с (без reduced-motion) ---------- */
  var heroMedia = document.getElementById('heroMedia');
  if (heroMedia && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var heroSlides = heroMedia.querySelectorAll('.hero__slide'), hi = 0; // не «slides» — var общий со слайдером комплексов
    /* кадры 2–4 отложены (data-src): грузим после load, следующий — за 1.5 с до смены, чтобы старт не тянул ~900 KB */
    function loadSlide(k) {
      var pic = heroSlides[k]; if (!pic || pic.dataset.ready) return; pic.dataset.ready = '1';
      pic.querySelectorAll('source[data-srcset]').forEach(function (s) { s.srcset = s.dataset.srcset; });
      var img = pic.querySelector('img[data-src]'); if (img) img.src = img.dataset.src;
    }
    if (heroSlides.length > 1) {
      addEventListener('load', function () { setTimeout(function () { loadSlide(1); }, 1500); }, { once: true });
      setInterval(function () {
        loadSlide((hi + 2) % heroSlides.length);
        heroSlides[hi].classList.remove('is-in'); hi = (hi + 1) % heroSlides.length; loadSlide(hi); heroSlides[hi].classList.add('is-in');
      }, 6000);
    }
  }

  /* ---------- фото-полосы: кроссфейд с подписью на кадр, авто 5 с, стрелки, пауза при наведении ---------- */
  document.querySelectorAll('.photo-band[data-band]').forEach(function (band) {
    var bs = band.querySelectorAll('.photo-band__slide'), cnt = band.querySelector('.ugal__count b'), bi = 0, timer;
    if (bs.length < 2) return;
    function show(i) { bs[bi].classList.remove('is-in'); bi = (i + bs.length) % bs.length; bs[bi].classList.add('is-in'); if (cnt) cnt.textContent = bi + 1; }
    function arm() { clearInterval(timer); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(function () { show(bi + 1); }, 5000); }
    band.querySelectorAll('.ugal__btn').forEach(function (b) { b.addEventListener('click', function () { show(bi + (+b.getAttribute('data-dir'))); arm(); }); });
    band.addEventListener('mouseenter', function () { clearInterval(timer); }); band.addEventListener('mouseleave', arm);
    arm();
  });

  /* ---------- лента фото комплекса: стрелки листают на ширину видимой области, счётчик — по первому видимому кадру ---------- */
  document.querySelectorAll('.strip[data-strip]').forEach(function (strip) {
    var track = strip.querySelector('.strip__track'), figs = track.querySelectorAll('figure'), cnt = strip.querySelector('.ugal__count b');
    strip.querySelectorAll('.ugal__btn').forEach(function (b) { b.addEventListener('click', function () { track.scrollBy({ left: (+b.getAttribute('data-dir')) * track.clientWidth * .8, behavior: 'smooth' }); }); });
    var t; track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(function () {
      var x = track.scrollLeft + 8, i = 0; figs.forEach(function (f, k) { if (f.offsetLeft <= x) i = k; }); if (cnt) cnt.textContent = i + 1;
    }, 80); }, { passive: true });
  });

  /* ---------- FAQ-аккордеон (как на БСО): один открыт, остальные закрываются ---------- */
  var faqList = document.getElementById('faqList');
  if (faqList) faqList.addEventListener('click', function (e) {
    var btn = e.target.closest('.faq-q'); if (!btn) return;
    var item = btn.parentElement, open = item.classList.contains('is-open');
    faqList.querySelectorAll('.faq-item.is-open').forEach(function (it) { it.classList.remove('is-open'); it.querySelector('.faq-q').setAttribute('aria-expanded', 'false'); });
    if (!open) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
  });

  /* ---------- email в кругляшах: mailto может ничего не открыть — копируем адрес и показываем подсказку ---------- */
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var mail = a.getAttribute('href').replace('mailto:', '');
      function tipShow(ok) {
        var tip = document.createElement('span'); tip.className = 'copied';
        tip.textContent = ok ? mail + ' — ' + (document.documentElement.lang === 'en' ? 'copied' : 'скопировано') : mail;
        document.body.appendChild(tip); setTimeout(function () { tip.classList.add('in'); }, 10); setTimeout(function () { tip.remove(); }, 2600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(mail).then(function () { tipShow(true); }, function () { tipShow(false); });
      else tipShow(false);
    });
  });

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
    /* «Выбрать тип виллы» — подставляет цену формата в калькулятор (Босс 22.09) */
    var pickerBtn = document.getElementById('calcPickerBtn'), pickerPanel = document.getElementById('calcPickerPanel');
    if (pickerBtn && pickerPanel) {
      pickerBtn.addEventListener('click', function () {
        var open = pickerPanel.hidden;
        pickerPanel.hidden = !open;
        pickerBtn.setAttribute('aria-expanded', String(open));
      });
      pickerPanel.querySelectorAll('.calc__pick-card').forEach(function (btn) {
        btn.addEventListener('click', function () {
          document.getElementById('c-price').value = btn.getAttribute('data-price');
          var rate = btn.getAttribute('data-rate');
          if (rate) document.getElementById('c-rate').value = rate;
          calc();
          pickerPanel.querySelectorAll('.calc__pick-card').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
          pickerPanel.hidden = true;
          pickerBtn.setAttribute('aria-expanded', 'false');
        });
      });
      document.addEventListener('click', function (e) {
        if (!pickerPanel.hidden && !e.target.closest('.calc__picker')) { pickerPanel.hidden = true; pickerBtn.setAttribute('aria-expanded', 'false'); }
      });
    }
  }
})();
