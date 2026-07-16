/* UNIT SPACE CITY — общий скрипт: хедер, меню, reveal, hotspot, FAQ, формы */

const QA = navigator.webdriver || /[?&]qa=1/.test(location.search);
if (QA) document.documentElement.classList.add('qa');

/* ---------- прозрачный хедер поверх hero, сплошной после скролла ---------- */
const heroEl = document.querySelector('.hero');
const headerEl = document.querySelector('.site-header');
const navEl = document.getElementById('nav');
function syncHeader() {
  if (!heroEl || !headerEl) return;
  if (navEl && navEl.classList.contains('open')) return;
  const limit = heroEl.offsetHeight - headerEl.offsetHeight - 32;
  headerEl.classList.toggle('is-transparent', scrollY < limit);
}
syncHeader();
addEventListener('scroll', syncHeader, { passive: true });
addEventListener('resize', syncHeader);

/* ---------- burger ---------- */
const burger = document.getElementById('burger');
function closeNav() {
  burger.classList.remove('open');
  navEl.classList.remove('open');
  document.body.style.overflow = '';
  syncHeader();
}
if (burger && navEl) {
  burger.addEventListener('click', () => {
    const opening = !navEl.classList.contains('open');
    burger.classList.toggle('open', opening);
    navEl.classList.toggle('open', opening);
    if (opening) {
      headerEl.classList.remove('is-transparent');
      document.body.style.overflow = 'hidden';
    } else {
      closeNav();
    }
  });
  navEl.addEventListener('click', e => { if (e.target.tagName === 'A') closeNav(); });
}

/* ---------- активный пункт меню по скроллу ---------- */
const sections = [...document.querySelectorAll('section[id]')];
const navLinks = [...document.querySelectorAll('.nav a')];
function syncActiveNav() {
  let current = null;
  for (const s of sections) {
    if (s.getBoundingClientRect().top < 140) current = s.id;
  }
  navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + current));
}
addEventListener('scroll', syncActiveNav, { passive: true });
syncActiveNav();

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---------- hotspot-точки на фото инфраструктуры ---------- */
document.querySelectorAll('.hotspot-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    const existing = dot.parentElement.querySelector('.hotspot-tooltip');
    if (existing) { existing.remove(); if (existing.dataset.for === dot.dataset.tip) return; }
    document.querySelectorAll('.hotspot-tooltip').forEach(t => t.remove());
    const tip = document.createElement('div');
    tip.className = 'hotspot-tooltip';
    tip.dataset.for = dot.dataset.tip;
    tip.textContent = dot.dataset.tip;
    Object.assign(tip.style, {
      position: 'absolute', left: dot.style.left, top: `calc(${dot.style.top} - 34px)`,
      transform: 'translate(-50%, 0)', background: 'var(--graphite)', color: '#fff',
      fontSize: '13px', fontWeight: '500', padding: '6px 12px', borderRadius: '8px',
      whiteSpace: 'nowrap', zIndex: 4, pointerEvents: 'none',
    });
    dot.parentElement.appendChild(tip);
    setTimeout(() => tip.remove(), 2600);
  });
});

/* ---------- FAQ аккордеон ---------- */
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-q').addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

/* ---------- поиск в hero: скроллит к каталогу с учётом фильтра типа ---------- */
const searchForm = document.getElementById('searchForm');
if (searchForm) {
  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    document.getElementById('units').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ---------- ссылки на юр.страницы: открывать на текущем языке сайта ---------- */
function syncLegalLinks() {
  const lang = window.__uf_lang || 'ru';
  document.querySelectorAll('a[href^="consent.html"], a[href^="legal.html"]').forEach(a => {
    const [path] = a.getAttribute('href').split('#');
    const file = path.split('?')[0];
    a.setAttribute('href', `${file}?lang=${lang}`);
  });
}
window.__uf_onLangChange = syncLegalLinks;

/* ---------- язык ---------- */
document.querySelectorAll('.lang-switch').forEach(sw => {
  sw.addEventListener('click', e => {
    const b = e.target.closest('[data-lang]');
    if (b) window.setLang(b.dataset.lang);
  });
});
(function initLang() {
  let saved = 'ru';
  try { saved = localStorage.getItem('usc_lang') || 'ru'; } catch (e) {}
  const urlLang = new URLSearchParams(location.search).get('lang');
  window.setLang(urlLang === 'en' || urlLang === 'ru' ? urlLang : saved);
})();

/* ---------- форма заявки ---------- */
const form = document.getElementById('leadForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('fName');
    const contact = document.getElementById('fContact');
    const agree = document.getElementById('fAgree');
    let ok = true;
    [name, contact].forEach(f => {
      f.classList.toggle('err', !f.value.trim());
      if (!f.value.trim()) ok = false;
    });
    if (!agree.checked) { ok = false; agree.focus(); }
    if (!ok) return;
    /* TODO: AJAX → Telegram Bot API, как на unitdeveloper.com/unit-furniture */
    form.querySelector('button[type="submit"]').disabled = true;
    document.getElementById('formDone').hidden = false;
  });
}
