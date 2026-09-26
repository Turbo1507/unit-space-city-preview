/* UNIT SPACE CITY v2 — общий JS (index + units/*). Логика шапки/меню/языка — как на БСО. */
(function () {
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ASSETS = document.documentElement.getAttribute('data-assets') || 'assets/';
  document.documentElement.className += ' js';

  /* прогрузка фото — shine-скелет, пока фото не в кеше, снимаем по load/error (как на BSO, Босс 22.09) */
  document.querySelectorAll('picture img').forEach(function (img) {
    if (img.complete) return;
    img.classList.add('is-loading');
    var done = function () { img.classList.remove('is-loading'); };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

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

  /* ---------- дропдауны языка/валюты в шапке (Босс 23.09: 4 инлайн-кнопки в ряд — глупо, свели к 2 выпадающим) ---------- */
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

  /* ---------- валюта USD/IDR: закон Индонезии (PBI 17/3/PBI/2015) требует показывать цену в рупиях, не только в $
     (Босс 23.09). Живой курс через open.er-api.com (без ключа, CORS открыт), кэш 12ч в localStorage, фолбэк — константа */
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
    { sel: '[data-i18n="buy.2"]', usd: 1500 }
  ];
  function fmtUsd(n, lang) { return '$' + Math.round(n).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US'); }
  /* компактная запись IDR (Босс 23.09: «Rp2.185.454.000» тяжело читать) — млрд/млн с суффиксами B/M */
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
          el.textContent = el.textContent.replace(/\$[\d.,  ]+|Rp[\d.,  BM]+/, fmtIdr(usd));
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

  /* ---------- scrollspy: активный пункт меню ---------- */
  var navLinks = [].slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var secs = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var spy = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
          return;
        }
        /* прокрутили назад выше активной секции (к хиро) — снять подсветку, иначе залипает (Босс 23.09) */
        if (en.boundingClientRect.top > 0) {
          var link = navLinks.filter(function (a) { return a.getAttribute('href') === '#' + en.target.id; })[0];
          if (link && link.classList.contains('is-active')) navLinks.forEach(function (a) { a.classList.remove('is-active'); });
        }
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
      setTimeout(function () { bar.classList.add('in'); }, 700);
      var ok = document.getElementById('consentOk');
      /* карточка карты в углу перекрывалась баннером cookie (тоже в углу) — стрелка вела на клик по «OK» вместо перехода к карте;
         теперь карточка появляется только после закрытия баннера, плюс страховка на 6с если баннер проигнорировали (Босс 22.09) */
      if (ok) ok.addEventListener('click', function () { try { localStorage.setItem(KEY, '1'); } catch (e) {} bar.classList.remove('in'); showCard(200); });
      showCard(6000);
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
      /* выбор комплекса тут — подхватывается фильтром каталога «доступные юниты» ниже (Босс 22.09) */
      if (window.__uscSyncCatalog) window.__uscSyncCatalog(slides[i].id);
      fitTrack();
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
       а не самой длинной (раскрытый коллаж U1 не должен оставлять пустоту на U2) (Босс 27.09) */
    function fitTrack() { if (slides[cur]) cxTrack.style.height = slides[cur].offsetHeight + 'px'; }
    if (window.ResizeObserver) { var cxRO = new ResizeObserver(fitTrack); slides.forEach(function (s) { cxRO.observe(s); }); }
    addEventListener('resize', fitTrack);
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
    var href = hrefBase + u.slug + '.html';
    return '<div class="card fmt-card">' +
      '<a class="fmt-card__media" href="' + href + '" tabindex="-1" aria-hidden="true"><picture><source srcset="' + ASSETS + ph + '.webp" type="image/webp">' +
      '<img src="' + ASSETS + ph + '.jpg" alt="' + CX[u.q].code + ' — ' + u.name[lang] + '" width="720" height="450" loading="lazy"></picture>' +
      '<span class="product-card__area">' + u.area + ' ' + m2 + '</span></a>' +
      '<div class="fmt-card__body"><div class="fmt-card__head"><div><div class="fmt-card__name">' + u.name[lang] + '</div>' +
      '<div class="product-card__meta dim">' + CX[u.q].code + ', ' + u.floor[lang] + '</div></div></div>' +
      '<div class="leaders fmt-card__rows">' + rows + '</div>' +
      '<div class="fmt-card__foot"><span class="fmt-card__plan" aria-hidden="true">' + (d['fmt.plan'] || '') + '</span>' +
      '<span class="product-card__price">' + (window.__uscMoney(window.USC_PRICE_USD[u.fmt], lang) || '') + '</span></div>' +
      '<div class="fmt-card__actions">' +
      '<a class="btn btn-outline fmt-card__more" href="' + href + '">' + (d['fmt.more'] || '') + '</a>' +
      /* заявка ведёт на страницу ИМЕННО этой виллы, к её форме, а не на форму текущей страницы (Босс 23.09) */
      '<a class="btn btn-primary fmt-card__request" href="' + href + '#lead">' + (d['fmt.request'] || '') + '</a>' +
      '</div></div></div>';
  };
  window.__uscUnitCard = function (u, hrefBase) {
    var CX = window.USC_COMPLEX, lang = L(), d = D(), ph = u.photos[0];
    return '<a class="product-card" href="' + hrefBase + u.slug + '.html">' +
      '<div class="product-card__media"><picture><source srcset="' + ASSETS + ph + '.webp" type="image/webp">' +
      '<img src="' + ASSETS + ph + '.jpg" alt="' + CX[u.q].code + ' — ' + u.name[lang] + '" width="480" height="360" loading="lazy"></picture>' +
      '<span class="product-card__area">' + u.area + ' m²'.replace('m', lang === 'ru' ? 'м' : 'm') + '</span></div>' +
      '<div class="product-card__row"><div><div class="product-card__name">' + u.name[lang] + '</div>' +
      '<div class="product-card__meta dim">' + CX[u.q].code + ', ' + u.floor[lang] + '</div></div>' +
      '<span class="product-card__price">' + (window.__uscMoney(window.USC_PRICE_USD[u.fmt], lang) || '') + '</span></div>' +
      '<span class="btn btn-outline product-card__cta">' + (d['cat.details'] || '') + '</span></a>';
  };
  /* карточка реального лота из таблицы Босса (assets/lots.js): поля те же, что у карточки формата,
     но метраж и цена — этого лота (цена точная, без «от»); фото по кругу из барабана формата */
  window.__uscLotCard = function (lot, n, hrefBase) {
    var CX = window.USC_COMPLEX, lang = L(), d = D();
    var page = window.USC_UNITS.filter(function (u) { return u.slug === lot.slug; })[0];
    var named = window.USC_UNITS.filter(function (u) { return u.fmt === lot.fmt && u.q === lot.q; })[0] ||
                window.USC_UNITS.filter(function (u) { return u.fmt === lot.fmt; })[0] || page;
    var ph = page.photos[n % page.photos.length];
    var area = (lang === 'ru' ? String(lot.area).replace('.', ',') : String(lot.area)) + (lang === 'ru' ? ' м²' : ' m²');
    return '<a class="product-card" href="' + hrefBase + page.slug + '.html">' +
      '<div class="product-card__media"><picture><source srcset="' + ASSETS + ph + '.webp" type="image/webp">' +
      '<img src="' + ASSETS + ph + '.jpg" alt="' + CX[lot.q].code + ' — ' + named.name[lang] + '" width="480" height="360" loading="lazy"></picture>' +
      '<span class="product-card__area">' + area + '</span></div>' +
      '<div class="product-card__row"><div><div class="product-card__name">' + named.name[lang] + '</div>' +
      '<div class="product-card__meta dim">' + CX[lot.q].code + ', ' + page.floor[lang] + '</div></div>' +
      '<span class="product-card__price">' + window.__uscMoney(lot.price, lang, true) + '</span></div>' +
      '<span class="btn btn-outline product-card__cta">' + (d['cat.details'] || '') + '</span></a>';
  };
  if (uWrap && window.USC_UNITS) {
    var st = { q: 'all', fmt: 'all', open: false };
    var CAT_FIRST = 12;
    var catMore = document.getElementById('unitsMore');
    if (catMore) catMore.addEventListener('click', function () { st.open = true; renderUnits(); });
    function renderUnits() {
      var src = window.USC_LOTS && window.USC_LOTS.length ? window.USC_LOTS : window.USC_UNITS;
      var list = src.filter(function (u) { return (st.q === 'all' || u.q === st.q) && (st.fmt === 'all' || u.fmt === st.fmt); });
      /* «все комплексы»: чередуем U1/U2/U3, чтобы в первых карточках до «Показать все» были все три */
      if (st.q === 'all') {
        var byQ = ['u1', 'u2', 'u3'].map(function (q) { return list.filter(function (u) { return u.q === q; }); }), mixed = [];
        for (var k = 0; mixed.length < list.length; k++) byQ.forEach(function (arr) { if (arr[k]) mixed.push(arr[k]); });
        list = mixed;
      }
      if (catMore) catMore.parentElement.hidden = st.open || list.length <= CAT_FIRST;
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
      var seen = {};
      var shown = st.open ? list : list.slice(0, CAT_FIRST);
      uWrap.innerHTML = shown.map(function (u) {
        if (!u.id) return window.__uscUnitCard(u, 'units/');
        seen[u.slug] = (seen[u.slug] || 0) + 1;
        return window.__uscLotCard(u, seen[u.slug] - 1, 'units/');
      }).join('');
    }
    if (filters) filters.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      var f = b.dataset.f;
      filters.querySelectorAll('.chip[data-f="' + f + '"]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      st[f] = b.dataset.v; st.open = false; renderUnits();
    });
    renderUnits();
    var prevHook = window.__uscRerender;
    window.__uscRerender = function (lang) { if (prevHook) prevHook(lang); renderUnits(); };
    /* синхронизация с выбором комплекса в блоке «Комплексы» выше по странице (Босс 22.09) */
    window.__uscSyncCatalog = function (cxId) {
      var v = cxId.replace('cx-', '');
      st.q = v; st.open = false;
      if (filters) filters.querySelectorAll('.chip[data-f="q"]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.v === v)); });
      renderUnits();
    };
  }


  /* ---------- страница юнита: поля по языку + «другие форматы» ---------- */
  var unitSlug = document.body.getAttribute('data-unit');
  if (unitSlug && window.USC_UNITS) {
    var unit = window.USC_UNITS.filter(function (u) { return u.slug === unitSlug; })[0];
    var more = document.getElementById('moreUnits');
    function renderUnit(lang) {
      if (!unit) return;
      var cx = window.USC_COMPLEX[unit.q];
      var f = { name: unit.name[lang], floor: unit.floor[lang], price: window.__uscMoney(window.USC_PRICE_USD[unit.fmt], lang), where: cx.where[lang], status: cx.status[lang], desc: window.USC_FMT[unit.fmt].desc[lang], m2: lang === 'ru' ? 'м²' : 'm²' };
      document.querySelectorAll('[data-unit-field]').forEach(function (el) { var k = el.getAttribute('data-unit-field'); if (f[k] != null) el.textContent = f[k]; });
      document.title = f.name + ' ' + unit.area + ' ' + f.m2 + ', ' + cx.code + ' ' + cx.name + ' — UNIT.SPACE CITY';
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
    var arrowPrev = stage.querySelector('.ugal__arrow--prev'), arrowNext = stage.querySelector('.ugal__arrow--next');
    if (arrowPrev) arrowPrev.addEventListener('click', function (e) { e.stopPropagation(); go(-1); });
    if (arrowNext) arrowNext.addEventListener('click', function (e) { e.stopPropagation(); go(1); });
    var swiped = false;
    stage.addEventListener('click', function (e) {
      if (swiped) { swiped = false; return; }
      if (e.target.closest('.ugal__nav') || e.target.closest('.ugal__arrow')) return;
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
    /* свайп + клик по левой/правой половине кадра листает вперёд/назад, стрелки — доп. способ (Босс 23.09) */
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
    band.addEventListener('mouseenter', function () { clearInterval(timer); }); band.addEventListener('mouseleave', arm);
    var bp0 = null, bSwiped = false;
    band.addEventListener('pointerdown', function (e) { bp0 = { x: e.clientX, y: e.clientY }; });
    band.addEventListener('pointerup', function (e) {
      if (!bp0) return;
      var dx = e.clientX - bp0.x, dy = e.clientY - bp0.y; bp0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { bSwiped = true; show(bi + (dx < 0 ? 1 : -1)); arm(); }
    });
    band.addEventListener('click', function (e) {
      if (bSwiped) { bSwiped = false; return; }
      if (e.target.closest('.photo-band__nav')) return;
      var r = band.getBoundingClientRect();
      show(bi + (e.clientX - r.left < r.width / 2 ? -1 : 1)); arm();
    });
    arm();
  });

  /* ---------- концепция: фото U1/U2/U3 в синей панели, стрелки + клик по ряду (макет USC, вар2) ---------- */
  var ccPanel = document.getElementById('ccPanel');
  if (ccPanel) (function () {
    var slides = [].slice.call(ccPanel.querySelectorAll('.cc-slide')), i = 0;
    if (slides.length < 2) return;
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-in', k === i); });
    }
    ccPanel.querySelectorAll('.cc-arrow').forEach(function (b) {
      b.addEventListener('click', function () { show(i + (+b.getAttribute('data-cc'))); });
    });
    show(0);
  })();

  /* ---------- «Показать ещё» под коллажем комплекса: докладывает скрытые тайлы в ту же сетку (Босс 23.09) ---------- */
  /* Бенто-ритм 4×2 (крупный + широкий + мелкие), блоками по 2 ряда, раскрытые тайлы продолжают его — не сетка
     одинаковых квадратов (Босс 26.09). Схема каждого блока и место каждого фото подбираются по пропорциям фото
     (data-ar) и реальным размерам плиток на текущей ширине: вертикальные — в высокие плитки, панорамы — в широкие,
     чтобы кадр не резался до непонятного (Босс 27.09). Только десктоп: на ≤800 коллаж — лента-слайдер. */
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
    btn.addEventListener('click', function () { gallery.classList.add('is-expanded'); btn.remove(); });
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
  if (document.getElementById('c-price')) {
    function money(n) {
      if (window.__uscCcy === 'idr') return 'Rp' + window.__uscFmtIdrNum(n * window.__uscFx);
      return '$' + Math.round(n).toLocaleString('ru-RU');
    }
    /* цена/ставка — «рабочие» поля модели, всегда хранятся в USD (data-usd); .value показывает
       текущую валюту (Босс 23.09: в IDR-режиме поля молчком оставались в $) */
    var priceEl = document.getElementById('c-price'), rateEl = document.getElementById('c-rate');
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
      document.getElementById('o-roi').textContent = price > 0 ? (net / price * 100).toFixed(1) + '%' : '—';
    }
    priceEl.addEventListener('input', function () {
      priceEl.dataset.usd = window.__uscCcy === 'idr' ? (+priceEl.value / window.__uscFx) : priceEl.value;
      calc();
    });
    ['c-occ', 'c-mgmt'].forEach(function (id) { document.getElementById(id).addEventListener('input', calc); });
    window.__uscCalcRefresh = function () { syncCcyDisplay(); calc(); };
    syncCcyDisplay();
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
