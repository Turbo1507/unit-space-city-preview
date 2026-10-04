/* UNIT SPACE CITY v2 — общий JS (index + units/*). Логика шапки/меню/языка — как на БСО. */
(function () {
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ASSETS = document.documentElement.getAttribute('data-assets') || 'assets/';
  document.documentElement.className += ' js';

  /* прогрузка фото — shine-скелет, пока фото не в кеше, снимаем по load/error */
  document.querySelectorAll('picture img').forEach(function (img) {
    if (img.complete) return;
    img.classList.add('is-loading');
    var done = function () { img.classList.remove('is-loading'); };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

  /* header: is-solid после 40px (на внутренних страницах — всегда) */
  var header = document.getElementById('header');
  var alwaysSolid = document.body.classList.contains('page');
  function syncHeader() { if (header) header.classList.toggle('is-solid', alwaysSolid || window.scrollY > 40); }
  addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  /* burger → полноэкранный оверлей (inert/aria-hidden, как БСО) */
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

  /* язык (паттерн БСО): у каждого языка свой URL (EN — корень /, RU — /ru/, основной язык EN),
     кнопка ведёт на hreflang-альтернативу; словарь применяется к JS-частям по <html lang> */
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

  /* дропдауны языка/валюты в шапке (4 инлайн-кнопки в ряд — глупо, свели к 2 выпадающим) */
  document.querySelectorAll('.hd-sel').forEach(function (sel) {
    var btn = sel.querySelector('.hd-sel__btn'), pop = sel.querySelector('.hd-sel__pop');
    function setOpen(open) { sel.classList.toggle('is-open', open); pop.hidden = !open; btn.setAttribute('aria-expanded', String(open)); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = pop.hidden;
      if (willOpen) document.querySelectorAll('.hd-sel.is-open').forEach(function (s) { if (s !== sel) s._close(); });
      setOpen(willOpen);
    });
    pop.querySelectorAll('li').forEach(function (li) { li.addEventListener('click', function () { setOpen(false); }); });
    sel._close = function () { setOpen(false); };
    sel._setVal = function (text) { var v = sel.querySelector('.hd-sel__val'); if (v) v.textContent = text; };
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.hd-sel.is-open').forEach(function (sel) { if (!sel.contains(e.target)) sel._close(); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.hd-sel.is-open').forEach(function (sel) { sel._close(); });
  });
  function syncSel(attr, value) {
    document.querySelectorAll('.hd-sel[data-sel="' + attr + '"]').forEach(function (sel) {
      sel.querySelectorAll('li').forEach(function (li) { li.setAttribute('aria-selected', String(li.getAttribute('data-' + attr) === value)); });
      sel._setVal(value.toUpperCase());
    });
  }
  syncSel('lang', pageLang);

  /* валюта USD/IDR: закон Индонезии (PBI 17/3/PBI/2015) требует показывать цену в рупиях, не только в $.
     Живой курс через open.er-api.com (без ключа, CORS открыт), кэш 12ч в localStorage, фолбэк — константа */
  var CCY_KEY = 'usc_ccy', FX_KEY = 'usc_fx', FX_FALLBACK = 16300;
  function getCcy() { try { return localStorage.getItem(CCY_KEY) === 'idr' ? 'idr' : 'usd'; } catch (e) { return 'usd'; } }
  function saveCcy(c) { try { localStorage.setItem(CCY_KEY, c); } catch (e) { } }
  window.__uscCcy = getCcy();
  window.__uscFx = FX_FALLBACK;
  (function loadFx() {
    try {
      var cached = JSON.parse(localStorage.getItem(FX_KEY) || 'null');
      if (cached && Date.now() - cached.t < 12 * 3600 * 1000) { window.__uscFx = cached.v; return; }
    } catch (e) { }
    fetch('https://open.er-api.com/v6/latest/USD').then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.rates && j.rates.IDR) {
        window.__uscFx = j.rates.IDR;
        try { localStorage.setItem(FX_KEY, JSON.stringify({ v: j.rates.IDR, t: Date.now() })); } catch (e) { }
        if (window.__uscCcy === 'idr') refreshMoney();
      }
    }).catch(function () { });
  })();
  var PRICE_ELS = [
    { sel: '[data-i18n="calc.pick_studio"]', fmt: 'studio' }, { sel: '[data-i18n="calc.pick_1bd"]', fmt: '1bd' },
    { sel: '[data-i18n="calc.pick_2bd"]', fmt: '2bd' }, { sel: '[data-i18n="calc.pick_villa"]', fmt: 'villa' },
    { sel: '[data-i18n="price.studio"]', fmt: 'studio' }, { sel: '[data-i18n="price.1bd"]', fmt: '1bd' },
    { sel: '[data-i18n="price.2bd"]', fmt: '2bd' }, { sel: '[data-i18n="price.villa"]', fmt: 'villa' },
    { sel: '[data-i18n="buy.1p"]', usd: 1500 }
  ];
  function fmtUsd(n, lang) { return '$' + Math.round(n).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US'); }
  /* компактная запись IDR («Rp2.185.454.000» тяжело читать) — млрд/млн с суффиксами B/M */
  window.__uscFmtIdrNum = function (n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    return Math.round(n).toLocaleString('id-ID');
  };
  function fmtIdr(n) { return 'Rp' + window.__uscFmtIdrNum(n * window.__uscFx); }
  window.__uscMoney = function (usd, lang, exact) {
    return (exact ? '' : (lang === 'ru' ? 'от ' : 'from ')) + (window.__uscCcy === 'idr' ? fmtIdr(usd) : fmtUsd(usd, lang));
  };
  var CALC_LABELS = [{ sel: '[data-i18n="calc.price"]' }, { sel: '[data-i18n="calc.rate"]' }, { sel: '[data-i18n="form.budget"]' }];
  function refreshMoney() {
    var lang = document.documentElement.lang === 'ru' ? 'ru' : 'en';
    if (window.__uscCcy === 'idr') {
      PRICE_ELS.forEach(function (p) {
        document.querySelectorAll(p.sel).forEach(function (el) {
          var usd = p.usd != null ? p.usd : (window.USC_PRICE_USD && window.USC_PRICE_USD[p.fmt]); if (usd == null) return;
          el.textContent = el.textContent.replace(/\$\d(?:[\d.,  ]*\d)?|Rp\d(?:[\d.,]*\d)?[BM]?/, fmtIdr(usd));
        });
      });
      CALC_LABELS.forEach(function (p) {
        document.querySelectorAll(p.sel).forEach(function (el) { el.textContent = el.textContent.replace(/\$\s*$/, 'Rp'); });
      });
    }
    if (window.__uscRerender) window.__uscRerender(lang);
    if (window.__uscCalcRefresh) window.__uscCalcRefresh();
  }
  syncSel('ccy', window.__uscCcy);
  document.querySelectorAll('.hd-sel[data-sel="ccy"] li').forEach(function (li) {
    li.addEventListener('click', function () {
      var c = li.getAttribute('data-ccy'); if (!c || c === window.__uscCcy) return;
      window.__uscCcy = c; saveCcy(c); syncSel('ccy', c);
      window.setLang(document.documentElement.lang === 'ru' ? 'ru' : 'en');
    });
  });
  var prevSetLang = window.setLang;
  window.setLang = function (lang) { if (prevSetLang) prevSetLang(lang); refreshMoney(); };
  refreshMoney();

  /* scrollspy: активный пункт меню */
  var navLinks = [].slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var secs = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var spy = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
          return;
        }
        /* прокрутили назад выше активной секции (к хиро) — снять подсветку, иначе залипает */
        if (en.boundingClientRect.top > 0) {
          var link = navLinks.filter(function (a) { return a.getAttribute('href') === '#' + en.target.id; })[0];
          if (link && link.classList.contains('is-active')) navLinks.forEach(function (a) { a.classList.remove('is-active'); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { spy.observe(s); });
  }

  /* reveal */
  if ('IntersectionObserver' in window && !rm) {
    /* страховка: если observer не сработал (скрытая вкладка) — видимое показываем через 4 с; ниже экрана — только по скроллу */
    setTimeout(function () { document.querySelectorAll('.rv:not(.in)').forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }); }, 4000);
    var io = new IntersectionObserver(function (ents) { ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
    requestAnimationFrame(function () { document.querySelectorAll('.rv').forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }); });
  } else { document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); }); }

  /* cookie-баннер → после него карточка карты в хиро */
  (function () {
    var KEY = 'usc_cookie_ok', bar = document.getElementById('consentBar'), card = document.getElementById('heroCard');
    var accepted = false; try { accepted = !!localStorage.getItem(KEY); } catch (e) {}
    function showCard(d) { setTimeout(function () { if (card) card.classList.add('in'); }, d); }
    if (accepted || !bar) { showCard(400); }
    else {
      setTimeout(function () { bar.classList.add('in'); }, 700);
      var ok = document.getElementById('consentOk');
      /* карточка карты в углу перекрывалась баннером cookie (тоже в углу) — стрелка вела на клик по «OK» вместо перехода к карте;
         теперь карточка появляется только после закрытия баннера, плюс страховка на 6с если баннер проигнорировали */
      if (ok) ok.addEventListener('click', function () { try { localStorage.setItem(KEY, '1'); } catch (e) {} bar.classList.remove('in'); showCard(200); });
      showCard(6000);
    }
  })();

  /* count-up */
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

  /* комплексы: слайдер, переключение кнопками U1/U2/U3 (+ свайп, стрелки, #cx-uN) */
  var cxNav = document.querySelector('.complex-nav'), cxTrack = document.querySelector('.complex-track');
  if (cxNav && cxTrack) {
    var tabs = [].slice.call(cxNav.querySelectorAll('button[data-cx]')), ink = document.getElementById('cxInk');
    var slides = tabs.map(function (t) { return document.getElementById(t.dataset.cx); });
    var cur = 0;
    function moveInk(t) { if (ink) { ink.style.left = t.offsetLeft + 'px'; ink.style.width = t.offsetWidth + 'px'; } }
    function go(i, focusTab, init) {
      i = Math.max(0, Math.min(slides.length - 1, i)); cur = i;
      slides.forEach(function (s, k) { s.setAttribute('data-state', k === i ? 'active' : (k < i ? 'prev' : 'next')); });
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      moveInk(tabs[i]);
      if (focusTab) tabs[i].focus();
      /* выбор комплекса тут — подхватывается фильтром каталога «доступные юниты» ниже */
      fitTrack();
      // при загрузке страницу не трогаем: иначе через 700 мс её утаскивало к комплексам, если уже пролистали ниже (восстановление позиции, быстрый скролл)
      if (init) return;
      cxNav.classList.add('is-touched');
      // если с раскрытого длинного коллажа перешли на короткий комплекс и его низ оказался выше экрана — показать его начало
      toStart(slides[i], 'smooth');
      // плавную прокрутку может сбить одновременное сжатие секции (transition height .6s) — после анимации добиваем без анимации
      clearTimeout(go.t); go.t = setTimeout(function () { toStart(slides[cur], 'auto'); }, 700);
    }
    function toStart(s, behavior) {
      var r = s.getBoundingClientRect(), navB = cxNav.getBoundingClientRect().bottom;
      if (r.bottom < navB + 120) scrollTo({ top: scrollY + r.top - navB, behavior: behavior });
    }
    /* панели стоят друг на друге в одной ячейке сетки — высота секции = высота активной панели,
       а не самой длинной (раскрытый коллаж U1 не должен оставлять пустоту на U2) */
    function fitTrack() {
      if (slides[cur]) cxTrack.style.height = slides[cur].offsetHeight + 'px';
      // нативный переход по якорю #cx-uN (при загрузке по ссылке) останавливается под шапкой и табами, а не за ними
      var m = (parseFloat(getComputedStyle(cxNav).top) || 0) + cxNav.offsetHeight + 'px';
      slides.forEach(function (s) { s.style.scrollMarginTop = m; });
    }
    if (window.ResizeObserver) { var cxRO = new ResizeObserver(fitTrack); slides.forEach(function (s) { cxRO.observe(s); }); }
    addEventListener('resize', fitTrack);
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { go(i); }); });
    cxNav.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(cur + 1, true); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(cur - 1, true); e.preventDefault(); }
    });
    addEventListener('resize', function () { moveInk(tabs[cur]); });
    /* свайп влево/вправо по контенту комплекса — переключает U1/U2/U3, не только кнопки табов */
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
    go(start >= 0 ? start : 0, false, true);
    function toBlock(behavior) {
      var stick = parseFloat(getComputedStyle(cxNav).top) || 0;
      scrollTo({ top: scrollY + cxTrack.getBoundingClientRect().top - stick - cxNav.offsetHeight, behavior: behavior });
    }
    if (start >= 0) requestAnimationFrame(function () { toBlock('auto'); });
    addEventListener('hashchange', function () { var h = location.hash.replace('#', ''), i = slides.findIndex(function (s) { return s.id === h; }); if (i >= 0) go(i); });
    /* ссылки на #cx-uN (чипы блока 2, футер): открыть комплекс и подвести страницу к началу блока сами —
       нативный переход по якорю на сдвинутую панель прокручивал слайдер вбок, и блок был пустым */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#cx-"]'); if (!a) return;
      var i = slides.findIndex(function (s) { return s && '#' + s.id === a.getAttribute('href'); }); if (i < 0) return;
      e.preventDefault();
      go(i);
      if (history.replaceState) history.replaceState(null, '', a.getAttribute('href'));
      toBlock('smooth');
    });
    if (cxSlider) cxSlider.addEventListener('scroll', function () { cxSlider.scrollLeft = 0; });
  }

  /* карточка формата (каталога на главной больше нет, его заменил блок «Наличие» на страницах форматов) */
  var L = function () { return window.__uscLang || pageLang; };
  var D = function () { return (window.I18N && window.I18N[L()]) || {}; };
  /* карточка формата (как в блоке «Форматы вилл» на главной) — для «Других форматов» на странице юнита
     (раньше там был старый product-card). Строки — из словаря по ключам fmt.<fmt>_r/_w (+ f_out/villa_o у виллы) */
  /* прогресс-точки (вместо «1/3», как на БСО): рисует n точек, возвращает set(i) */
  function dots(box, n) {
    if (!box) return function () {};
    box.innerHTML = new Array(n + 1).join('<span></span>');
    var d = box.children;
    return function (i) { for (var k = 0; k < d.length; k++) d[k].classList.toggle('on', k === i); };
  }
  /* число вилл и этажи по лотам таблицы (assets/lots.js): «Доступно: N вилл», «Этаж 1, 2» */
  window.__uscVillas = function (n, lang) {
    var d = (window.I18N && window.I18N[lang]) || {}, k = n % 10, h = n % 100;
    var w = lang === 'ru' ? (k === 1 && h !== 11 ? d['avail.v1'] : k >= 2 && k <= 4 && (h < 12 || h > 14) ? d['avail.v2'] : d['avail.v5']) : (n === 1 ? d['avail.v1'] : d['avail.v2']);
    return n + '&nbsp;' + (w || '');
  };
  window.__uscFloors = function (ls) {
    var f = []; ls.forEach(function (l) { if (l.lvl && f.indexOf(l.lvl) < 0) f.push(l.lvl); });
    return f.sort().join(', ');
  };
  window.__uscFmtCard = function (u, hrefBase) {
    var CX = window.USC_COMPLEX, lang = L(), d = D(), ph = u.photos[0], m2 = lang === 'ru' ? 'м²' : 'm²';
    var row = function (k, v) { return '<div><span>' + (d[k] || '') + '</span><b>' + (d[v] || '') + '</b></div>'; };
    var rows = row('fmt.f_rooms', 'fmt.' + u.fmt + '_r') + row('fmt.f_where', 'fmt.' + u.fmt + '_w') +
      (u.fmt === 'villa' ? row('fmt.f_out', 'fmt.villa_o') : row('fmt.f_fit', 'fmt.f_full')) + row('fmt.f_yield', 'fmt.f_uk');
    var href = hrefBase + u.slug + '.html';
    return '<div class="card fmt-card">' +
      '<a class="fmt-card__media" href="' + href + '" tabindex="-1" aria-hidden="true"><picture><source srcset="' + ASSETS + ph + '.webp" type="image/webp">' +
      '<img src="' + ASSETS + ph + '.jpg" alt="' + CX[u.q].code + ' — ' + u.name[lang] + '" width="720" height="450" loading="lazy"></picture>' +
      '<span class="product-card__area">' + window.USC_AREA_TXT(u, lang) + '&nbsp;' + m2 + '</span></a>' +
      '<div class="fmt-card__body"><div class="fmt-card__head"><div><div class="fmt-card__name">' + u.name[lang] + '</div>' +
      '<div class="product-card__meta dim">' + CX[u.q].code + ', ' + u.floor[lang] + '</div></div></div>' +
      '<div class="leaders fmt-card__rows">' + rows + '</div>' +
      '<div class="fmt-card__foot">' +
      '<span class="product-card__price">' + (window.__uscMoney(window.USC_PRICE_USD[u.fmt], lang) || '') + '</span></div>' +
      '<div class="fmt-card__actions">' +
      /* одна синяя кнопка, без второй «Получить презентацию»: две кнопки рядом лишние */
      '<a class="btn btn-primary fmt-card__more" href="' + href + '">' + (d['fmt.more'] || '') + '</a>' +
      '</div></div></div>';
  };
  /* страница юнита: поля по языку + «другие форматы» */
  var unitSlug = document.body.getAttribute('data-unit');
  if (unitSlug && window.USC_UNITS) {
    var unit = window.USC_UNITS.filter(function (u) { return u.slug === unitSlug; })[0];
    var more = document.getElementById('moreUnits');
    function renderUnit(lang) {
      if (!unit) return;
      var cx = window.USC_COMPLEX[unit.q];
      var f = { name: unit.name[lang], floor: unit.floor[lang], price: window.__uscMoney(window.USC_PRICE_USD[unit.fmt], lang), where: cx.where[lang], status: cx.status[lang], desc: window.USC_FMT[unit.fmt].desc[lang], m2: lang === 'ru' ? 'м²' : 'm²' };
      document.querySelectorAll('[data-unit-field]').forEach(function (el) { var k = el.getAttribute('data-unit-field'); if (f[k] != null) el.textContent = f[k]; });
      document.title = f.name + ' ' + window.USC_AREA_TXT(unit, lang) + ' ' + f.m2 + ', ' + cx.code + ' ' + cx.name + ' — UNIT. SPACE CITY';
      if (more) {
        var others = window.USC_UNITS.filter(function (u) { return u.slug !== unit.slug && u.q === unit.q; });
        if (others.length < 3) others = others.concat(window.USC_UNITS.filter(function (u) { return u.slug !== unit.slug && u.q !== unit.q; })).slice(0, 3);
        more.innerHTML = others.slice(0, 3).map(function (u) { return window.__uscFmtCard(u, ''); }).join('');
      }
    }
    /* «Наличие»: лоты этого формата из таблицы наличия (assets/lots.js), вкладки — комплексы, где формат есть;
       одна карточка на комплекс + метраж, цена «от» минимальной, чип «свободно N» */
    var avTabs = document.querySelector('.avail__tabs'), avGrid = document.querySelector('.avail__grid'), avQ = null, avPick = null;
    function renderAvail(lang) {
      if (!unit || !avTabs || !avGrid) return;
      var d = (window.I18N && window.I18N[lang]) || {}, CX = window.USC_COMPLEX, m2 = lang === 'ru' ? 'м²' : 'm²';
      /* 1+1 и 1+1 с бассейном — разные продукты: вариант с бассейном показывает только свои лоты */
      var pool = function (s) { return /-pool$/.test(s); }, mine = pool(unit.slug);
      var lots = (window.USC_LOTS || []).filter(function (l) { return l.fmt === unit.fmt && pool(l.slug) === mine; });
      var qs = ['u1', 'u2', 'u3'].filter(function (q) { return lots.some(function (l) { return l.q === q; }) || window.USC_UNITS.some(function (u) { return u.q === q && u.fmt === unit.fmt && pool(u.slug) === mine; }); });
      if (!avQ) avQ = lots.some(function (l) { return l.q === unit.q; }) ? unit.q : (qs.filter(function (q) { return lots.some(function (l) { return l.q === q; }); })[0] || unit.q);
      avTabs.innerHTML = qs.map(function (q) {
        return '<button type="button" class="chip" data-q="' + q + '" aria-pressed="' + (q === avQ) + '"><b>' + CX[q].code + '</b><span>&nbsp;' + CX[q].name + '</span></button>';
      }).join('');
      var groups = {};
      lots.filter(function (l) { return l.q === avQ; }).forEach(function (l) {
        var g = groups[l.area] || (groups[l.area] = { area: l.area, n: 0, min: Infinity, max: 0, lots: [] }); g.n++; g.min = Math.min(g.min, l.price); g.max = Math.max(g.max, l.price); g.lots.push(l);
      });
      var list = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) { return a.area - b.area; });
      var num = function (a) { return lang === 'ru' ? String(a).replace('.', ',') : String(a); };
      /* фото комплекса в этом формате; кнопка сразу к заявке с комплексом, форматом и метражом
         (выпадающий список вилл не нужен); виллы с купелью — строкой лидеров */
      var ph = (window.USC_UNITS.filter(function (x) { return x.q === avQ && x.fmt === unit.fmt && pool(x.slug) === mine; })[0] || window.USC_UNITS.filter(function (x) { return x.q === avQ; })[0] || unit).photos[0];
      avGrid.innerHTML = list.length ? list.map(function (g) {
        var pick = CX[avQ].code + ' ' + CX[avQ].name + ', ' + unit.name[lang].charAt(0).toLowerCase() + unit.name[lang].slice(1) + ' ' + num(g.area) + ' ' + m2;
        var bath = g.lots.filter(function (l) { return l.bath; }).length, fl = window.__uscFloors(g.lots);
        var row = function (k, v) { return '<div><span>' + (d[k] || '') + '</span><b>' + v + '</b></div>'; };
        return '<div class="card avail-card">' +
          '<div class="fmt-card__media"><picture><source srcset="' + ASSETS + ph + '.webp" type="image/webp"><img src="' + ASSETS + ph + '.jpg" alt="" width="720" height="450" loading="lazy"></picture>' +
          '<span class="product-card__area">' + num(g.area) + '&nbsp;' + m2 + '</span>' +
          '<span class="product-card__area product-card__area--n">' + (d['avail.chip'] || '').replace('{n}', window.__uscVillas(g.n, lang)) + '</span></div>' +
          '<div class="fmt-card__name">' + CX[avQ].code + '&nbsp;' + CX[avQ].name + '</div>' +
          '<div class="leaders fmt-card__rows">' + row('avail.f_st', CX[avQ].status[lang]) + row('avail.f_n', '<span class="tnum">' + window.__uscVillas(g.n, lang) + '</span>') + (fl ? row('avail.f_fl', '<span class="tnum">' + fl + '</span>') : '') + (bath ? row('avail.f_bath', '<span class="tnum">' + bath + '</span>') : '') + '</div>' +
          '<div class="avail-card__price tnum">' + window.__uscMoney(g.min, lang, g.min === g.max) + '</div>' +
          '<a class="btn btn-primary avail-card__more" href="#lead" data-pick="' + pick + '">' + (d['avail.cta'] || '') + '</a></div>';
      }).join('') : '<p class="avail__none t-lead">' + (d['avail.none'] || '').replace('{q}', CX[avQ].code) + '</p>';
      if (window.__uscNbsp) window.__uscNbsp(avGrid);
      if (window.__uscFit) window.__uscFit();
    }
    if (avTabs) avTabs.addEventListener('click', function (e) { var b = e.target.closest('[data-q]'); if (b) { avQ = b.getAttribute('data-q'); renderAvail(window.__uscLang || pageLang); } });
    if (avGrid) avGrid.addEventListener('click', function (e) {
      var a = e.target.closest('[data-pick]'); if (!a) return;
      avPick = a.getAttribute('data-pick'); window.__uscPick = avPick;
      var p = document.getElementById('leadPick'); if (p) { p.querySelector('b').textContent = avPick; p.hidden = false; }
    });
    renderUnit(window.__uscLang || pageLang); renderAvail(window.__uscLang || pageLang);
    var prev2 = window.__uscRerender;
    window.__uscRerender = function (lang) { if (prev2) prev2(lang); renderUnit(lang); renderAvail(lang); };
  }



  /* галерея-барабан на странице юнита: окно из 7 превью вокруг активного, шаг = сдвиг ленты */
  var ugal = document.getElementById('ugal');
  if (ugal) (function () {
    var photos = ugal.getAttribute('data-photos').split(','), n = photos.length, alt = ugal.getAttribute('data-alt') || '';
    var base = ASSETS, drum = ugal.querySelector('.ugal__drum'), track = ugal.querySelector('.ugal__track'), stage = ugal.querySelector('.ugal__stage');
    var setDot = dots(ugal.querySelector('.dots'), n), cur = 0, busy = false, HALF = 3;
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
        /* превью — из photos/t/ (320×240, ~8 KB), а не полноразмерный webp 1800px, иначе фото грузятся долго */
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
      stage.insertBefore(pic, stage.querySelector('.ugal__arrow'));
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        pic.classList.add('is-in');
        if (old) { old.classList.remove('is-in'); setTimeout(function () { old.remove(); }, 600); }
      }); });
      setDot(i);
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
    renderTrack(); setDot(0);
    track.addEventListener('click', function (e) { var t = e.target.closest('.ugal__thumb'); if (t) go(+t.getAttribute('data-o')); });
    var arrowPrev = stage.querySelector('.ugal__arrow--prev'), arrowNext = stage.querySelector('.ugal__arrow--next');
    if (arrowPrev) arrowPrev.addEventListener('click', function (e) { e.stopPropagation(); go(-1); });
    if (arrowNext) arrowNext.addEventListener('click', function (e) { e.stopPropagation(); go(1); });
    var swiped = false;
    stage.addEventListener('click', function (e) {
      if (swiped) { swiped = false; return; }
      if (e.target.closest('.ugal__arrow')) return;
      if (window.USC_LB) window.USC_LB.open(photos.map(function (p) { return { jpg: base + p + '.jpg', alt: alt }; }), cur);
    });
    var sp0 = null;
    stage.addEventListener('pointerdown', function (e) { sp0 = { x: e.clientX, y: e.clientY }; });
    stage.addEventListener('pointerup', function (e) {
      if (!sp0) return;
      var dx = e.clientX - sp0.x, dy = e.clientY - sp0.y; sp0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped = true; go(dx < 0 ? 1 : -1); }
    });
    var wheelT = 0;
    drum.addEventListener('wheel', function (e) { e.preventDefault(); var now = Date.now(); if (now - wheelT < 350) return; wheelT = now; var d = horizontal() ? (e.deltaX || e.deltaY) : e.deltaY; go(d > 0 ? 1 : -1); }, { passive: false });
    var p0 = null;
    drum.addEventListener('pointerdown', function (e) { p0 = { x: e.clientX, y: e.clientY }; });
    addEventListener('pointerup', function (e) { if (!p0) return; var d = horizontal() ? e.clientX - p0.x : e.clientY - p0.y; p0 = null; if (Math.abs(d) > 24) go(d < 0 ? 1 : -1); });
    drum.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { go(1); e.preventDefault(); } if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { go(-1); e.preventDefault(); } });
    addEventListener('resize', renderTrack);
  })();

  /* лайтбокс «галерея проекта»: клик по любому фото в коллаже или ленте комплекса
     открывает оверлей на полный набор фото этого комплекса */
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
    window.USC_LB = { open: open, show: show };
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
    var lbPrev = document.getElementById('lightboxPrev'), lbNext = document.getElementById('lightboxNext');
    if (lbPrev) lbPrev.addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
    if (lbNext) lbNext.addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
    /* свайп + клик по левой/правой половине кадра листает вперёд/назад, стрелки — доп. способ */
    var stage = lightbox.querySelector('.lightbox__stage'), lp0 = null, lSwiped = false;
    stage.addEventListener('click', function (e) {
      if (lSwiped) { lSwiped = false; return; }
      var r = stage.getBoundingClientRect();
      show(idx + (e.clientX - r.left < r.width / 2 ? -1 : 1));
    });
    stage.addEventListener('pointerdown', function (e) { lp0 = { x: e.clientX, y: e.clientY }; });
    stage.addEventListener('pointerup', function (e) {
      if (!lp0) return;
      var dx = e.clientX - lp0.x, dy = e.clientY - lp0.y; lp0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { lSwiped = true; show(idx + (dx < 0 ? 1 : -1)); }
    });
    addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
  })();

  /* кастомные выпадающие списки в форме: нативный <select> остаётся источником значения.
     Код страны (#f-cc): полный справочник USC_COUNTRIES, поиск, тонкий индикатор прокрутки, автоформат
     номера по маске — функционально как на БСО */
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

  /* форма заявки: проверка полей, затем отправка в @leadunit_bot через unitdeveloper.com/wp-json/unit/v1/space-lead
     (токен бота лежит на сервере). Имя обязательно, из телефона и email хватит одного; ошибка под полем, фокус на первое неверное */
  var leadForm = document.getElementById('leadForm');
  if (leadForm) {
    var fName = document.getElementById('f-name'), fPhone = document.getElementById('f-phone'), fEmail = document.getElementById('f-email');
    var tried = false;
    function setErr(input, key) {
      var field = input.closest('.field'), id = input.id + '-err', p = document.getElementById(id);
      if (!key) { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); if (p) p.remove(); return; }
      if (!p) { p = document.createElement('p'); p.id = id; p.className = 'field__err'; p.setAttribute('aria-live', 'polite'); field.appendChild(p); }
      p.setAttribute('data-i18n', key); p.textContent = D()[key] || '';
      input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', id);
    }
    function check() {
      var name = fName.value.trim(), digits = fPhone.value.replace(/\D+/g, ''), mail = fEmail.value.trim(), bad = [];
      var eName = name.length < 2 ? 'form.err_name' : '';
      var ePhone = digits && digits.length < 6 ? 'form.err_phone' : '';
      var eMail = mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail) ? 'form.err_email' : '';
      if (!digits && !mail) ePhone = 'form.err_contact';
      setErr(fName, eName); setErr(fPhone, ePhone); setErr(fEmail, eMail);
      if (eName) bad.push(fName); if (ePhone) bad.push(fPhone); if (eMail) bad.push(fEmail);
      return bad;
    }
    var LEAD_URL = 'https://unitdeveloper.com/wp-json/unit/v1/space-lead', sending = false;
    var lfBtn = leadForm.querySelector('[type="submit"]');
    function lfFail() {
      sending = false; lfBtn.disabled = false; lfBtn.removeAttribute('aria-busy'); lfBtn.textContent = D()['form.submit'] || lfBtn.textContent;
      var p = document.getElementById('lf-fail');
      if (!p) { p = document.createElement('p'); p.id = 'lf-fail'; p.className = 'field__err'; p.setAttribute('aria-live', 'polite'); lfBtn.insertAdjacentElement('afterend', p); }
      p.setAttribute('data-i18n', 'form.fail'); p.textContent = D()['form.fail'] || '';
    }
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault(); tried = true;
      var bad = check(); if (bad.length) { bad[0].focus(); return; }
      if (sending) return; sending = true;
      var cc = document.getElementById('f-cc'), goal = document.getElementById('f-goal'), budget = document.getElementById('f-budget'), hp = leadForm.querySelector('[name="website"]');
      var fd = new FormData(), ph = fPhone.value.trim();
      fd.append('name', fName.value.trim());
      fd.append('phone', ph.replace(/\D+/g, '') ? '+' + (cc ? cc.value : '') + ' ' + ph : '');
      fd.append('email', fEmail.value.trim());
      fd.append('goal', goal ? goal.options[goal.selectedIndex].text : '');
      fd.append('budget', budget ? budget.value.trim() : '');
      fd.append('page', (location.pathname + (window.__uscPick ? ' · ' + window.__uscPick : '')).slice(0, 200));
      fd.append('lang', document.documentElement.lang || 'ru');
      fd.append('website', hp ? hp.value : '');
      lfBtn.disabled = true; lfBtn.setAttribute('aria-busy', 'true'); lfBtn.textContent = D()['form.sending'] || '…';
      var old = document.getElementById('lf-fail'); if (old) old.remove();
      fetch(LEAD_URL, { method: 'POST', body: fd })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j || !j.ok) throw new Error('lead ' + r.status); }); })
        .then(function () {
          leadForm.classList.add('lead-form--done');
          leadForm.innerHTML = '<h3 class="t-h3" data-i18n="form.done_t"></h3><p data-i18n="form.done_p"></p>';
          leadForm.querySelector('h3').innerHTML = D()['form.done_t']; leadForm.querySelector('p').innerHTML = D()['form.done_p'];
        })
        .catch(lfFail);
    });
    /* до первой попытки не ругаемся; после — ошибка снимается сразу, как только поле исправлено */
    [fName, fPhone, fEmail].forEach(function (el) { el.addEventListener('input', function () { if (tried) check(); }); });
  }
  if (csels.length) {
    document.addEventListener('click', function (e) { csels.forEach(function (c) { if (!c.wrap.contains(e.target)) c.close(); }); });
    var prevCsel = window.__uscRerender;
    window.__uscRerender = function (lang) { if (prevCsel) prevCsel(lang); csels.forEach(function (c) { if (c.refill) c.refill(); else c.render(); }); };
  }

  /* живая строка футера: время на Бали (WITA) + температура (Open-Meteo, без ключа; если фетч не прошёл — прячем только температуру) */
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

  /* хиро: кроссфейд кадров каждые 6 с (без reduced-motion) */
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

  /* фото-полосы: кроссфейд с подписью на кадр, авто 5 с, стрелки, пауза при наведении */
  document.querySelectorAll('.photo-band[data-band]').forEach(function (band) {
    var bs = band.querySelectorAll('.photo-band__slide'), bi = 0, timer;
    if (bs.length < 2) return;
    var setDot = dots(band.querySelector('.dots'), bs.length); setDot(0);
    function show(i) { bs[bi].classList.remove('is-in'); bi = (i + bs.length) % bs.length; bs[bi].classList.add('is-in'); setDot(bi); }
    band.querySelectorAll('.ugal__arrow').forEach(function (a) {
      a.addEventListener('click', function (e) { e.stopPropagation(); show(bi + (a.classList.contains('ugal__arrow--prev') ? -1 : 1)); arm(); });
    });
    function arm() { clearInterval(timer); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(function () { show(bi + 1); }, 5000); }
    band.addEventListener('mouseenter', function () { clearInterval(timer); }); band.addEventListener('mouseleave', arm);
    var bp0 = null, bSwiped = false;
    band.addEventListener('pointerdown', function (e) { bp0 = e.target.closest('.ugal__arrow') ? null : { x: e.clientX, y: e.clientY }; });
    band.addEventListener('pointerup', function (e) {
      if (!bp0) return;
      var dx = e.clientX - bp0.x, dy = e.clientY - bp0.y; bp0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { bSwiped = true; show(bi + (dx < 0 ? 1 : -1)); arm(); }
    });
    band.addEventListener('click', function (e) {
      if (bSwiped) { bSwiped = false; return; }
      if (e.target.closest('.ugal__arrow')) return;
      var r = band.getBoundingClientRect();
      show(bi + (e.clientX - r.left < r.width / 2 ? -1 : 1)); arm();
    });
    arm();
  });

  /* мини-галерея в карточках «Форматы вилл»: 5 кадров формата, стрелки-эталон, точки, свайп;
     клик по кадру ведёт на страницу формата. Кадры создаются при первом показе карточки, соседний грузится заранее */
  document.querySelectorAll('.fmt-card__gal[data-mg]').forEach(function (gal) {
    var u = (window.USC_UNITS || []).filter(function (x) { return x.slug === gal.getAttribute('data-mg'); })[0];
    var link = gal.querySelector('.fmt-card__media'), cover = link && link.querySelector('picture');
    if (!u || !cover) return;
    var src0 = (cover.querySelector('img').getAttribute('src').match(/([\w-]+)\.jpg$/) || [])[1];
    var list = [src0].concat(u.photos.filter(function (p) { return p !== src0; })).slice(0, 5), n = list.length, i = 0, pics = [cover];
    var alt = cover.querySelector('img').getAttribute('alt') || '', setDot = dots(gal.querySelector('.dots'), n); setDot(0);
    function pic(k) {
      if (pics[k]) return pics[k];
      var p = document.createElement('picture');
      p.innerHTML = '<source srcset="' + ASSETS + list[k] + '.webp" type="image/webp"><img src="' + ASSETS + list[k] + '.jpg" alt="" width="720" height="450" decoding="async">';
      p.querySelector('img').alt = alt;
      link.insertBefore(p, link.querySelector('.product-card__area'));
      return (pics[k] = p);
    }
    function show(k) {
      i = (k + n) % n;
      var p = pic(i); pic((i + 1) % n);
      requestAnimationFrame(function () { pics.forEach(function (q, m) { if (q && m) q.classList.toggle('is-in', m === i); }); });
      setDot(i);
    }
    gal.querySelectorAll('.ugal__arrow').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); show(i + (a.classList.contains('ugal__arrow--prev') ? -1 : 1)); });
    });
    var p0 = null, swiped = false;
    link.addEventListener('pointerdown', function (e) { p0 = { x: e.clientX, y: e.clientY }; });
    link.addEventListener('pointerup', function (e) {
      if (!p0) return; var dx = e.clientX - p0.x, dy = e.clientY - p0.y; p0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped = true; show(i + (dx < 0 ? 1 : -1)); }
    });
    link.addEventListener('click', function (e) { if (swiped) { swiped = false; e.preventDefault(); } });
    /* второй кадр — заранее, когда карточка подъезжает к экрану */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { pic(1); io.disconnect(); } }, { rootMargin: '200px' });
      io.observe(gal);
    } else pic(1);
  });

  /* концепция: фото U1/U2/U3 в синей панели, стрелки + клик по ряду */
  var ccPanel = document.getElementById('ccPanel');
  if (ccPanel) (function () {
    var slides = [].slice.call(ccPanel.querySelectorAll('.cc-slide')), i = 0;
    if (slides.length < 2) return;
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-in', k === i); });
    }
    /* сам листается раз в 7 с: только пока панель на экране, пауза при фокусе с клавиатуры,
       при prefers-reduced-motion не листается; нажатие стрелки начинает отсчёт заново */
    var timer = 0, seen = false, hold = false, calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function tick() { clearTimeout(timer); if (!calm && seen && !hold) timer = setTimeout(function () { show(i + 1); tick(); }, 7000); }
    ccPanel.querySelectorAll('.cc-arrow').forEach(function (b) {
      b.addEventListener('click', function () { show(i + (+b.getAttribute('data-cc'))); tick(); });
    });
    ccPanel.addEventListener('focusin', function () { hold = true; tick(); });
    ccPanel.addEventListener('focusout', function () { hold = false; tick(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; tick(); }, { threshold: 0.3 }).observe(ccPanel);
    else { seen = true; tick(); }
    show(0);
  })();

  /* «Показать ещё» под коллажем комплекса: докладывает скрытые тайлы в ту же сетку */
  /* Бенто-ритм 4×2 (крупный + широкий + мелкие), блоками по 2 ряда, раскрытые тайлы продолжают его — не сетка
     одинаковых квадратов. Схема каждого блока и место каждого фото подбираются по пропорциям фото
     (data-ar) и реальным размерам плиток на текущей ширине: вертикальные — в высокие плитки, панорамы — в широкие,
     чтобы кадр не резался до непонятного. Только десктоп: на ≤800 коллаж — лента-слайдер. */
  var UNITS = {                                  // [сдвиг колонки, ширина, ряд, высота, тип]
    T:   { w: 1, s: [[0,1,0,2,'T']] },
    SS:  { w: 1, s: [[0,1,0,1,'S'],[0,1,1,1,'S']] },
    B:   { w: 2, s: [[0,2,0,2,'B']] },
    WW:  { w: 2, s: [[0,2,0,1,'W'],[0,2,1,1,'W']] },
    WSS: { w: 2, s: [[0,2,0,1,'W'],[0,1,1,1,'S'],[1,1,1,1,'S']] },
    SSW: { w: 2, s: [[0,1,0,1,'S'],[1,1,0,1,'S'],[0,2,1,1,'W']] }
  };
  var COMBOS = (function () {                    // все раскладки блока 4 колонки × 2 ряда
    var out = [];
    (function rec(seq, cols) {
      if (cols === 4) { out.push(seq); return; }
      Object.keys(UNITS).forEach(function (u) { if (cols + UNITS[u].w <= 4) rec(seq.concat(u), cols + UNITS[u].w); });
    })([], 0);
    return out.map(function (seq) {
      var slots = [], col = 1;
      seq.forEach(function (u) { UNITS[u].s.forEach(function (s) { slots.push([col + s[0], s[1], s[2], s[3], s[4]]); }); col += UNITS[u].w; });
      return { key: seq.join('+'), slots: slots, kinds: slots.reduce(function (a, s) { if (a.indexOf(s[4]) < 0) a.push(s[4]); return a; }, []).length };
    });
  })();
  // высота ряда = доля ширины колонки, чтобы форма плиток не зависела от ширины экрана
  // (раньше clamp по vw: на 820 плитки вытягивались, на 1680+ сплющивались)
  var ROW_K = 1;
  function tileAr(g) {
    var gap = parseFloat(getComputedStyle(g).columnGap) || 0;
    // коллаж в скрытом табе имеет ширину 0 — берём ширину видимого соседа (контейнер у всех один)
    var w = g.clientWidth || Math.max.apply(null, galleries.map(function (x) { return x.clientWidth; }));
    var c = (w - 3 * gap) / 4, r = Math.round(c * ROW_K);
    g.style.gridAutoRows = r + 'px';
    return { T: c / (2 * r + gap), S: c / r, W: (2 * c + gap) / r, B: (2 * c + gap) / (2 * r + gap) };
  }
  function figAr(f) {
    var a = parseFloat(f.getAttribute('data-ar')), img = f.querySelector('img');
    if (!a && img && img.naturalWidth) a = img.naturalWidth / img.naturalHeight;
    return a || 1.5;
  }
  // сортированное сопоставление пропорций (оптимально для 1D): доля кадра, которая остаётся видна
  function fitBlock(combo, ars, AR) {
    var sl = combo.slots.map(function (s, i) { return { i: i, a: AR[s[4]] }; }).sort(function (x, y) { return x.a - y.a; });
    var ph = ars.map(function (a, i) { return { i: i, a: a }; }).sort(function (x, y) { return x.a - y.a; });
    var map = [], vis = [];
    sl.forEach(function (s, k) { map[s.i] = ph[k].i; vis.push(Math.min(s.a, ph[k].a) / Math.max(s.a, ph[k].a)); });
    var min = Math.min.apply(null, vis), mean = vis.reduce(function (a, v) { return a + v; }, 0) / vis.length;
    return { map: map, score: min * 0.6 + mean * 0.4 };
  }
  function layoutGallery(g) {
    var figs = [].slice.call(g.children).filter(function (f) { return f.tagName === 'FIGURE'; });
    if (window.innerWidth <= 800) { figs.forEach(function (f) { f.style.gridColumn = f.style.gridRow = ''; }); g.style.gridAutoRows = ''; return; }
    var AR = tileAr(g), first = figs.filter(function (f) { return !f.classList.contains('tile-more'); }).length;
    var i = 0, row = 1, prev = '';
    function bestFor(part) {
      var ars = part.map(figAr), k = part.length, best = null;
      COMBOS.forEach(function (c) {
        if (c.slots.length !== k || c.kinds < (k > 4 ? 3 : 2)) return;
        var fit = fitBlock(c, ars, AR), sc = fit.score - (c.key === prev ? 0.05 : 0);
        if (!best || sc > best.sc) best = { c: c, fit: fit, sc: sc };
      });
      return best;
    }
    while (i < figs.length) {
      // первый блок — видимые без «Показать все фото»; дальше блок берёт 3–6 фото, как лучше ложатся
      // (хвост в 1–2 фото не оставляем)
      var left = figs.length - i, pick = null;
      (i === 0 ? [first] : [6, 5, 4, 3]).forEach(function (k) {
        if (k > left || (i > 0 && left - k > 0 && left - k < 3)) return;
        var b = bestFor(figs.slice(i, i + k));
        if (b && (!pick || b.sc + 0.015 * k > pick.b.sc + 0.015 * pick.k)) pick = { k: k, b: b };
      });
      if (!pick && left <= 2) pick = { k: left, b: bestFor(figs.slice(i)) };
      if (!pick || !pick.b) break;
      var part = figs.slice(i, i + pick.k);
      pick.b.c.slots.forEach(function (s, si) {
        var f = part[pick.b.fit.map[si]];
        f.style.gridColumn = s[0] + ' / span ' + s[1];
        f.style.gridRow = (row + s[2]) + ' / span ' + s[3];
      });
      prev = pick.b.c.key; i += pick.k; row += 2;
    }
  }
  var galleries = [].slice.call(document.querySelectorAll('.complex__gallery'));
  galleries.forEach(layoutGallery);
  var galT;
  window.addEventListener('resize', function () { clearTimeout(galT); galT = setTimeout(function () { galleries.forEach(layoutGallery); }, 150); });
  document.querySelectorAll('.gal-more').forEach(function (btn) {
    var gallery = btn.closest('.container').querySelector('.complex__gallery');
    if (!gallery) return;
    /* «Показать все фото» ↔ «Свернуть фото». data-i18n меняем вместе с текстом, чтобы смена языка не сбрасывала подпись */
    btn.addEventListener('click', function () {
      var open = gallery.classList.toggle('is-expanded'), k = open ? 'cx.less' : 'cx.more';
      var dict = (window.I18N && window.I18N[window.__uscLang || document.documentElement.lang]) || {};
      btn.setAttribute('data-i18n', k); if (dict[k]) btn.textContent = dict[k];
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      /* после сворачивания начало коллажа могло уехать выше экрана — возвращаем его под шапку и табы */
      if (!open) { var hdr = document.getElementById('header'), nav = document.querySelector('.complex-nav');
        var off = (hdr ? hdr.offsetHeight : 0) + (nav ? nav.offsetHeight : 0) + 16, top = gallery.getBoundingClientRect().top;
        if (top < off) window.scrollBy(0, top - off); }
    });
  });

  /* FAQ-аккордеон (как на БСО): один открыт, остальные закрываются */
  var faqList = document.getElementById('faqList');
  if (faqList) faqList.addEventListener('click', function (e) {
    var btn = e.target.closest('.faq-q'); if (!btn) return;
    var item = btn.parentElement, open = item.classList.contains('is-open');
    faqList.querySelectorAll('.faq-item.is-open').forEach(function (it) { it.classList.remove('is-open'); it.querySelector('.faq-q').setAttribute('aria-expanded', 'false'); });
    if (!open) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
  });

  /* email в кругляшах: mailto может ничего не открыть — копируем адрес и показываем подсказку */
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

  /* калькулятор */
  if (document.getElementById('c-price')) {
    function money(n) {
      if (window.__uscCcy === 'idr') return 'Rp' + window.__uscFmtIdrNum(n * window.__uscFx);
      return '$' + Math.round(n).toLocaleString(document.documentElement.lang === 'ru' ? 'ru-RU' : 'en-US');
    }
    /* цена/ставка — «рабочие» поля модели, всегда хранятся в USD (data-usd); .value показывает
       текущую валюту (в IDR-режиме поля молчком оставались в $) */
    var priceEl = document.getElementById('c-price'), rateEl = document.getElementById('c-rate');
    var MIN_PRICE = 50000; /* USD; самый дешёвый лот в таблице сейчас $95 000 */
    priceEl.dataset.usd = priceEl.value;
    rateEl.dataset.usd = rateEl.value;
    function val(id) {
      if (id === 'c-price') return +priceEl.dataset.usd || 0;
      if (id === 'c-rate') return +rateEl.dataset.usd || 0;
      return +document.getElementById(id).value || 0;
    }
    function syncCcyDisplay() {
      var idr = window.__uscCcy === 'idr', fx = window.__uscFx;
      var pUsd = +priceEl.dataset.usd, rUsd = +rateEl.dataset.usd;
      priceEl.value = idr ? Math.round(pUsd * fx / 1000) * 1000 : pUsd;
      rateEl.value = idr ? Math.round(rUsd * fx / 1000) * 1000 : rUsd;
      priceEl.step = idr ? 1000000 : 1000;
    }
    function calc() {
      var price = val('c-price'), rate = val('c-rate'), occ = (+val('c-occ')) / 100, mgmt = (+val('c-mgmt')) / 100;
      var gross = rate * 365 * occ, net = gross * (1 - mgmt);
      document.getElementById('o-gross').textContent = money(gross);
      document.getElementById('o-net').textContent = money(net);
      /* цена ниже порога даёт бессмысленные тысячи процентов: показываем подсказку, доходность не считаем */
      var low = price < MIN_PRICE, err = document.getElementById('c-price-err');
      if (low && !err) { err = document.createElement('p'); err.id = 'c-price-err'; err.className = 'field__err'; err.setAttribute('aria-live', 'polite'); priceEl.closest('.field').appendChild(err); }
      if (low) { err.textContent = (D()['calc.err_price'] || '%s').replace('%s', money(MIN_PRICE)); priceEl.setAttribute('aria-invalid', 'true'); priceEl.setAttribute('aria-describedby', 'c-price-err'); }
      else if (err) { err.remove(); priceEl.removeAttribute('aria-invalid'); priceEl.removeAttribute('aria-describedby'); }
      document.getElementById('o-roi').textContent = !low ? (net / price * 100).toFixed(1) + '%' : '—';
    }
    priceEl.addEventListener('input', function () {
      priceEl.dataset.usd = window.__uscCcy === 'idr' ? (+priceEl.value / window.__uscFx) : priceEl.value;
      calc();
    });
    ['c-occ', 'c-mgmt'].forEach(function (id) { document.getElementById(id).addEventListener('input', calc); });
    window.__uscCalcRefresh = function () { syncCcyDisplay(); calc(); };
    syncCcyDisplay();
    calc();
    /* «Выбрать тип виллы» — подставляет цену формата в калькулятор */
    var pickerBtn = document.getElementById('calcPickerBtn'), pickerPanel = document.getElementById('calcPickerPanel');
    if (pickerBtn && pickerPanel) {
      pickerBtn.addEventListener('click', function () {
        var open = pickerPanel.hidden;
        pickerPanel.hidden = !open;
        pickerBtn.setAttribute('aria-expanded', String(open));
      });
      pickerPanel.querySelectorAll('.calc__pick-card').forEach(function (btn) {
        btn.addEventListener('click', function () {
          priceEl.dataset.usd = btn.getAttribute('data-price');
          var rate = btn.getAttribute('data-rate');
          if (rate) rateEl.dataset.usd = rate;
          var occ = btn.getAttribute('data-occ');
          if (occ) document.getElementById('c-occ').value = occ;
          var mgmt = btn.getAttribute('data-mgmt');
          if (mgmt) document.getElementById('c-mgmt').value = mgmt;
          syncCcyDisplay();
          calc();
          pickerPanel.querySelectorAll('.calc__pick-card').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
          /* кнопка показывает выбранный формат; data-i18n меняем, чтобы смена языка не вернула старое имя */
          var cur = pickerBtn.querySelector('b'), src = btn.querySelector('b');
          if (cur && src) { cur.setAttribute('data-i18n', src.getAttribute('data-i18n')); cur.innerHTML = src.innerHTML; }
          pickerPanel.hidden = true;
          pickerBtn.setAttribute('aria-expanded', 'false');
        });
      });
      document.addEventListener('click', function (e) {
        if (!pickerPanel.hidden && !e.target.closest('.calc__picker')) { pickerPanel.hidden = true; pickerBtn.setAttribute('aria-expanded', 'false'); }
      });
    }
  }
  /* липкая кнопка заявки ≤1000px 
     видна, когда хиро ушёл вверх, а форма и футер ещё не на экране; не спорит с баннером cookie */
  (function () {
    var btn = document.getElementById('mCta'), hero = document.querySelector('.hero'),
        lead = document.getElementById('lead'), foot = document.querySelector('.site-footer'),
        bar = document.getElementById('consentBar');
    if (!btn || !hero || !('IntersectionObserver' in window)) return;
    var seen = { hero: true, lead: false, foot: false };
    function sync() {
      var on = !seen.hero && !seen.lead && !seen.foot && !(bar && bar.classList.contains('in'));
      btn.classList.toggle('in', on);
      btn.setAttribute('aria-hidden', on ? 'false' : 'true');
      btn.tabIndex = on ? 0 : -1;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { seen[e.target === hero ? 'hero' : e.target === lead ? 'lead' : 'foot'] = e.isIntersecting; });
      sync();
    });
    [hero, lead, foot].forEach(function (el) { if (el) io.observe(el); });
    if (bar && 'MutationObserver' in window) new MutationObserver(sync).observe(bar, { attributes: true, attributeFilter: ['class'] });
  })();

  /* карта локации: OpenFreeMap + MapLibre, грузится у экрана (чистая карта, одна точка) */
  (function () {
    var box = document.getElementById('locMap');
    if (!box || !('IntersectionObserver' in window)) return;
    var LIB = 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.';
    var HIDE = /label_village|label_town|label_city|label_state|poi|building|housenumber|aeroway|airport|railway|boundary|shield|label_other|highway_path|highway-name-(path|minor)|waterway_line_label|park|landcover|landuse/;
    function start() {
      var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = LIB + 'css'; document.head.appendChild(css);
      var js = document.createElement('script'); js.src = LIB + 'js'; js.onload = build; document.head.appendChild(js);
    }
    /* точки из чипов расстояний + Nuanu; координаты из OSM: пляж и Tanah Lot — по привязке locmap.svg,
       Nuanu — центр контура way 1349928560, Canggu — точка района в Nominatim. side — куда смотрит подпись */
    var POI = [
      { k: 'loc.m_nuanu', ll: [115.097499, -8.628463], side: 'l' },
      { k: 'loc.m_tanah', ll: [115.086886, -8.621204], side: 'l' },
      { k: 'loc.m_canggu', ll: [115.143605, -8.639903], side: 'r', far: true, up: true }
    ];
    /* фото для попапа чипа (4–5 фото места, только без АП — источники в photos/CREDITS-places.md).
       Пусто — чип без попапа: свободных фото Nuanu нет */
    var PLACES = {
      pin: ['u1-11', 'u3-01', 'u2-2bd-14', 'u1-15', 'u2-villa-13'],
      'loc.m_nuanu': [],
      'loc.m_tanah': ['place-tanah-1', 'place-tanah-2', 'place-tanah-3', 'place-tanah-4', 'place-tanah-5'],
      'loc.m_canggu': ['place-canggu-1', 'place-canggu-2', 'place-canggu-3', 'place-canggu-4', 'place-canggu-5']
    };
    // узкий экран: дальний Canggu (20 минут на машине) не влезает без каши из чипов — кадр по ближним точкам
    var narrow = function () { return box.clientWidth < 600; };
    function bounds() {
      var pts = POI.filter(function (p) { return !(p.far && narrow()); });
      var xs = pts.map(function (p) { return p.ll[0]; }).concat(+box.dataset.lng), ys = pts.map(function (p) { return p.ll[1]; }).concat(+box.dataset.lat);
      return [[Math.min.apply(null, xs) - 0.006, Math.min.apply(null, ys) - 0.004], [Math.max.apply(null, xs) + 0.006, Math.max.apply(null, ys) + 0.004]];
    }
    function build() {
      if (!window.maplibregl) return;
      var ll = [parseFloat(box.dataset.lng), parseFloat(box.dataset.lat)];
      var live = document.createElement('div'); live.className = 'location-map__live'; live.setAttribute('aria-hidden', 'true');
      box.appendChild(live);
      var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
      var map = new maplibregl.Map({
        container: live, style: 'https://tiles.openfreemap.org/styles/positron',
        bounds: bounds(), fitBoundsOptions: { padding: narrow() ? { top: 40, bottom: 40, left: 96, right: 124 } : { top: 48, bottom: 48, left: 150, right: 140 } },
        interactive: fine, scrollZoom: false, boxZoom: false, doubleClickZoom: false, keyboard: false,
        dragRotate: false, touchZoomRotate: false, touchPitch: false, pitchWithRotate: false,
        attributionControl: false, fadeDuration: 0
      });
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
      /* попап чипа: карточка поверх чипа, заголовок на месте текста чипа; edge 'l' — растёт вправо от левого края чипа,
         'r' — влево от правого. Наведение (мышь) или тап (палец); не вылезает за края карты */
      var openPop = null, pops = [], ARW = function (dir) { return '<button type="button" class="ugal__arrow ugal__arrow--' + dir + '" aria-label=""><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="' + (dir === 'prev' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6') + '" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'; };
      function popup(mk, lbl, ph, edge, up) {
        if (!ph || !ph.length) return;
        mk.classList.add('has-pop');
        var card = document.createElement('div'); card.className = 'map-pop map-pop--' + edge; card.setAttribute('aria-hidden', 'true');
        card.innerHTML = '<div class="map-pop__t"></div><div class="map-pop__gal"></div>';
        mk.appendChild(card);
        var gal = card.querySelector('.map-pop__gal'), k = 0, set = null, t = 0, self;
        function fill() {
          if (gal.children.length) return;
          gal.innerHTML = ph.map(function (n, x) { return '<picture' + (x ? '' : ' class="is-in"') + '><source srcset="' + ASSETS + n + '.webp" type="image/webp"><img src="' + ASSETS + n + '.jpg" alt="" width="800" height="600"></picture>'; }).join('') +
            (ph.length > 1 ? ARW('prev') + ARW('next') + '<span class="dots" aria-hidden="true"></span>' : '');
          set = dots(gal.querySelector('.dots'), ph.length); set(0);
          gal.addEventListener('click', function (e) {
            var b = e.target.closest('.ugal__arrow'); if (!b) return; e.stopPropagation();
            var pics = gal.querySelectorAll('picture'); pics[k].classList.remove('is-in');
            k = (k + (b.classList.contains('ugal__arrow--prev') ? -1 : 1) + pics.length) % pics.length; pics[k].classList.add('is-in'); set(k);
          });
        }
        /* карточка раскрывается из самого чипа: если в свою сторону не влезает в карту — растёт в другую (не сдвигаем,
           иначе стартовый кадр не совпадает с чипом и выходит рывок); сдвиг — только если не влезает никуда */
        function place() {
          var t2 = card.querySelector('.map-pop__t'), cs = getComputedStyle(lbl);
          t2.innerHTML = lbl.innerHTML; t2.style.padding = cs.padding;
          card.style.left = card.style.top = '0px';
          var W = card.offsetWidth, H = card.offsetHeight, lw = lbl.offsetWidth, lh = lbl.offsetHeight;
          var bx = live.getBoundingClientRect(), mr = mk.getBoundingClientRect(), gap = 8;
          var X = function (e) { return lbl.offsetLeft + (e === 'r' ? lw - W : 0); };
          var fits = function (e) { var ax = mr.left + X(e); return ax >= bx.left + gap && ax + W <= bx.right - gap; };
          var e = edge; if (!fits(e) && fits(e === 'l' ? 'r' : 'l')) e = e === 'l' ? 'r' : 'l';
          card.classList.toggle('map-pop--r', e === 'r'); card.classList.toggle('map-pop--l', e === 'l');
          // up (про Чангу): заголовок остаётся на месте чипа, галерея растёт вверх; не влезает — в другую сторону
          var Y = function (u) { return u ? lbl.offsetTop + lh - H : lbl.offsetTop; };
          var fitsY = function (u) { var ay = mr.top + Y(u); return ay >= bx.top + gap && ay + H <= bx.bottom - gap; };
          var u = !!up; if (!fitsY(u) && fitsY(!u)) u = !u;
          card.classList.toggle('map-pop--up', u);
          var x = X(e), y = Y(u);
          if (mr.left + x + W > bx.right - gap) x -= mr.left + x + W - (bx.right - gap);
          if (mr.left + x < bx.left + gap) x += bx.left + gap - (mr.left + x);
          if (mr.top + y + H > bx.bottom - gap) y -= mr.top + y + H - (bx.bottom - gap);
          if (mr.top + y < bx.top + gap) y += bx.top + gap - (mr.top + y);
          card.style.left = x + 'px'; card.style.top = y + 'px';
          // закрытое состояние = прямоугольник чипа внутри карточки
          var cx = lbl.offsetLeft - x, cy = lbl.offsetTop - y;
          card.style.setProperty('--cl', cx + 'px'); card.style.setProperty('--ct', cy + 'px');
          card.style.setProperty('--cr', (W - cx - lw) + 'px'); card.style.setProperty('--cb', (H - cy - lh) + 'px');
        }
        function open() {
          clearTimeout(t); if (openPop && openPop !== self) openPop.close(); if (mk.classList.contains('is-open')) return;
          fill(); place(); openPop = self;
          // стартовый кадр (размер чипа) отрисовывается до раскрытия — иначе браузер склеивает оба состояния и прыгает
          requestAnimationFrame(function () { requestAnimationFrame(function () { if (openPop === self) mk.classList.add('is-open'); }); });
        }
        function close() { clearTimeout(t); mk.classList.remove('is-open'); if (openPop === self) openPop = null; }
        self = { close: close }; pops.push(fill);
        ['mousedown', 'touchstart', 'pointerdown', 'wheel', 'dblclick'].forEach(function (ev) { card.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
        if (fine) {
          mk.addEventListener('mouseover', open);
          mk.addEventListener('mouseout', function (e) { if (!mk.contains(e.relatedTarget)) { clearTimeout(t); t = setTimeout(close, 180); } });
        } else {
          lbl.addEventListener('click', function (e) { e.stopPropagation(); if (mk.classList.contains('is-open')) close(); else open(); });
          card.addEventListener('click', function (e) { e.stopPropagation(); if (!e.target.closest('.ugal__arrow')) close(); });
        }
      }
      if (!fine) document.addEventListener('click', function () { if (openPop) openPop.close(); });
      map.on('load', function () {
        map.getStyle().layers.forEach(function (l) { if (HIDE.test(l.id)) map.setLayoutProperty(l.id, 'visibility', 'none'); });
        map.setPaintProperty('background', 'background-color', '#ECECEA');
        map.setPaintProperty('water', 'fill-color', '#D6E0EA');
        var pin = document.createElement('div'); pin.className = 'map-pin';
        pin.innerHTML = '<span class="map-pin__dot"></span><span class="map-pin__lbl"><i class="u5">UNIT.</i><i class="ul">&nbsp;SPACE CITY</i></span>';
        new maplibregl.Marker({ element: pin, anchor: 'left', offset: [-10, 0] }).setLngLat(ll).addTo(map);
        popup(pin, pin.querySelector('.map-pin__lbl'), PLACES.pin, 'l');
        var poiEls = POI.filter(function (p) { return !(p.far && narrow()); }).map(function (p) {
          var el = document.createElement('div'); el.className = 'map-poi map-poi--' + p.side;
          el.innerHTML = '<span class="map-poi__dot"></span><span class="map-poi__lbl"></span>';
          new maplibregl.Marker({ element: el, anchor: p.side === 'l' ? 'right' : 'left', offset: [p.side === 'l' ? 6 : -6, 0] }).setLngLat(p.ll).addTo(map);
          popup(el, el.querySelector('.map-poi__lbl'), PLACES[p.k], p.side === 'l' ? 'r' : 'l', p.up);
          return { el: el.querySelector('.map-poi__lbl'), k: p.k };
        });
        var poiText = function () { var d = D(); poiEls.forEach(function (x) { x.el.textContent = d[x.k] || ''; }); };
        poiText();
        var prevHook = window.__uscRerender;
        window.__uscRerender = function (lang) { if (prevHook) prevHook(lang); poiText(); if (openPop) openPop.close(); };
        /* подпись не должна уходить за правый край (узкий экран): сдвигаем карту */
        var over = map.project(ll).x - 10 + pin.offsetWidth + 16 - live.clientWidth;
        if (over > 0) map.panBy([over, 0], { animate: false });
        map.setMaxBounds(map.getBounds());
        var at = live.querySelector('.maplibregl-ctrl-attrib'); if (at) at.classList.remove('maplibregl-compact-show');
        var shown = function () { box.classList.add('is-live'); };
        map.once('idle', shown); setTimeout(shown, 2500);
        map.once('idle', function () { setTimeout(function () { pops.forEach(function (f) { f(); }); }, 800); });
      });
    }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); start(); } }, { rootMargin: '600px 0px' });
    io.observe(box);
  })();
})();

/* мастерплан на мобиле листается вбок: стартуем так, чтобы квартал UNIT. SPACE CITY был в кадре */
(function () {
  var pan = document.querySelector('.plan-pan'); if (!pan) return;
  var go = function () { var b = pan.querySelector('.plan-badge'); if (!b || pan.scrollWidth <= pan.clientWidth) return;
    pan.scrollLeft = Math.max(0, b.offsetLeft + 80 - pan.clientWidth * 0.75); };
  go(); window.addEventListener('load', go);
  /* чипы у краёв кадра гаснут, въезжающие в кадр появляются; плашка «Листайте» уходит после первого касания */
  var fig = pan.parentNode, hint = fig.querySelector('.plan-hint'), raf = 0,
    items = [].slice.call(pan.querySelectorAll('.plan-pin, .plan-badge'));
  var upd = function () { raf = 0; var on = pan.scrollWidth > pan.clientWidth + 1; fig.classList.toggle('is-pan', on);
    var l = pan.scrollLeft, w = pan.clientWidth, m = 8;
    /* чип виден целиком или спрятан: край подписи ближе 8px к краю кадра — прячем */
    items.forEach(function (e) { var ew = e.offsetWidth, x0 = e.offsetLeft - l - (e.classList.contains('plan-badge') ? 20 : ew / 2);
      e.classList.toggle('is-off', on && (x0 < m || x0 + ew > w - m)); }); };
  var tick = function () { if (!raf) raf = requestAnimationFrame(upd); };
  pan.addEventListener('scroll', tick, { passive: true }); window.addEventListener('resize', tick); window.addEventListener('load', tick); upd();
  var used = function () { if (hint) hint.classList.add('is-used'); };
  ['touchstart', 'pointerdown', 'wheel'].forEach(function (ev) { pan.addEventListener(ev, used, { passive: true, once: true }); });
})();

/* email-ссылки: адрес ещё и копируется в буфер с подсказкой — на ПК без почтовой программы mailto ничего не делает */
(function () {
  var box = null, tm = 0;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="mailto:"]'); if (!a || !navigator.clipboard) return;
    var mail = a.getAttribute('href').slice(7).split('?')[0];
    navigator.clipboard.writeText(mail).then(function () {
      var lang = window.__uscLang || document.documentElement.lang || 'en', d = (window.I18N && window.I18N[lang]) || {};
      if (!box) { box = document.createElement('div'); box.className = 'toast'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
      box.textContent = (d['toast.copied'] || '{e}').replace('{e}', mail);
      box.offsetWidth; box.classList.add('in'); clearTimeout(tm); tm = setTimeout(function () { box.classList.remove('in'); }, 2600);
    }, function () {});
  });
})();

/* точки-лидеры тянутся до текста: перенесённое значение (text-align:right) ужимаем до ширины самой длинной
   строки — иначе между точками и короткой строкой оставалась пустота */
(function () {
  function fit() {
    [].forEach.call(document.querySelectorAll('.leaders > div > b'), function (b) {
      b.style.width = ''; b.style.textAlign = '';
      var r = document.createRange(); r.selectNodeContents(b);
      var rs = r.getClientRects(), l = Infinity, rt = -Infinity, tops = {};
      for (var i = 0; i < rs.length; i++) if (rs[i].width) { l = Math.min(l, rs[i].left); rt = Math.max(rt, rs[i].right); tops[Math.round(rs[i].top)] = 1; }
      // блок = ширина самой длинной строки, строки по правому краю: по левому смотрится плохо
      if (Object.keys(tops).length > 1) { b.style.width = Math.ceil(rt - l + 1) + 'px'; b.style.textAlign = 'right'; }
    });
  }
  var t; function later() { cancelAnimationFrame(t); t = requestAnimationFrame(fit); }
  window.__uscFit = later;
  fit(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('resize', later);
  var prev = window.__uscRerender; window.__uscRerender = function (lang) { if (prev) prev(lang); later(); };
})();

/* висячие короткие слова (RU и EN): слово до 3 букв и число приклеиваем неразрывным пробелом к следующему.
   Словарь при смене языка пишет innerHTML заново, поэтому проход повторяется последним хуком после перерисовки */
(function () {
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|SELECT|OPTION|CODE|PRE|NOSCRIPT|svg)$/;
  var RX = /(^|[\s\u00A0(«"„“])([A-Za-zА-Яа-яЁё]{1,3}|\d+) (?=\S)/g;
  function run(root) {
    var w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      for (var p = n.parentNode; p && p !== document.body; p = p.parentNode) if (SKIP.test(p.nodeName) || p.isContentEditable) return NodeFilter.FILTER_REJECT;
      return / /.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    } }), n;
    while ((n = w.nextNode())) {
      var v = n.nodeValue, s = v;
      for (var k = 0; k < 3; k++) { var s2 = s.replace(RX, '$1$2\u00A0'); if (s2 === s) break; s = s2; }
      if (s !== v) n.nodeValue = s;
    }
  }
  window.__uscNbsp = run;
  run(); if (window.__uscFit) window.__uscFit();
  var prev = window.__uscRerender; window.__uscRerender = function (lang) { if (prev) prev(lang); run(); if (window.__uscFit) window.__uscFit(); };
})();

/* карточки форматов: «Доступно: N вилл» чипом на фото + строки «Доступно» и «Этаж».
   Считается по свободным лотам таблицы того же формата (1+1 и 1+1 с бассейном — разные продукты); лотов нет — ничего не добавляем */
(function () {
  function run() {
    var lots = window.USC_LOTS, units = window.USC_UNITS; if (!lots || !units) return;
    var lang = window.__uscLang || (document.documentElement.lang || 'en').slice(0, 2), d = (window.I18N && window.I18N[lang]) || {};
    var pool = function (s) { return /-pool$/.test(s); };
    document.querySelectorAll('.fmt-card').forEach(function (c) {
      c.querySelectorAll('.js-av').forEach(function (e) { e.remove(); });
      var a = c.querySelector('a.fmt-card__media'), m = a && (a.getAttribute('href') || '').match(/([\w-]+)\.html/);
      var u = m && units.filter(function (x) { return x.slug === m[1]; })[0]; if (!u) return;
      var ls = lots.filter(function (l) { return l.fmt === u.fmt && pool(l.slug) === pool(u.slug); }); if (!ls.length) return;
      var n = window.__uscVillas(ls.length, lang), fl = window.__uscFloors(ls);
      a.insertAdjacentHTML('beforeend', '<span class="product-card__area product-card__area--n js-av">' + (d['avail.chip'] || '').replace('{n}', n) + '</span>');
      var rows = c.querySelector('.fmt-card__rows'); if (!rows) return;
      var row = function (k, v) { return '<div class="js-av"><span>' + (d[k] || '') + '</span><b class="tnum">' + v + '</b></div>'; };
      var html = row('avail.f_n', n) + (fl ? row('avail.f_fl', fl) : '');
      var where = rows.children[1]; if (where) where.insertAdjacentHTML('afterend', html); else rows.insertAdjacentHTML('beforeend', html);
    });
    if (window.__uscNbsp) window.__uscNbsp(document.querySelector('#plans') || document.body);
    if (window.__uscFit) window.__uscFit();
  }
  run();
  var prev = window.__uscRerender; window.__uscRerender = function (lang) { if (prev) prev(lang); run(); };
})();
