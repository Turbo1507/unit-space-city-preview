// Общее для build-en.mjs и build-units.mjs: применить словарь к статической разметке
// (паттерн build-ru.mjs с БСО) и собрать <head>-блок языка: canonical + hreflang + lang в localStorage.
export const BASE = 'https://turbo1507.github.io/unit-space-city-preview/v2/';

export function applyDict(html, dict) {
  html = html.replace(/(<([a-zA-Z0-9]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g,
    (m, open, tag, key, _inner, close) => (key in dict) ? open + dict[key] + close : m);
  html = html.replace(/<[^>]*\bdata-i18n-alt="([^"]+)"[^>]*>/g, (m, key) => {
    if (!(key in dict)) return m; const v = dict[key].replace(/"/g, '&quot;');
    return m.replace(/\balt="[^"]*"/, `alt="${v}"`);
  });
  html = html.replace(/<[^>]*\bdata-i18n-aria="([^"]+)"[^>]*>/g, (m, key) => {
    if (!(key in dict)) return m; const v = dict[key].replace(/"/g, '&quot;');
    return m.replace(/\baria-label="[^"]*"/, `aria-label="${v}"`);
  });
  return html;
}

// rel — путь страницы относительно корня v2 ('' для index, 'units/x.html')
export function langHead(lang, rel) {
  const ru = BASE + rel, en = BASE + 'en/' + rel;
  return [
    `<script>try{localStorage.setItem('usc_lang','${lang}')}catch(e){}</script>`,
    `<link rel="canonical" href="${lang === 'ru' ? ru : en}">`,
    `<link rel="alternate" hreflang="ru" href="${ru}">`,
    `<link rel="alternate" hreflang="en" href="${en}">`,
    `<link rel="alternate" hreflang="x-default" href="${ru}">`
  ].join('\n');
}

// alt/aria без i18n-ключей (фото галерей, служебные подписи) + вычистить кириллицу из комментариев
const ATTR = {
  'U1 — приватный бассейн и сауна вечером': 'U1 — private pool and sauna in the evening',
  'U1 — спальня в минималистичном стиле': 'U1 — bedroom in a minimalist style',
  'U1 — спальня с видом на сад': 'U1 — bedroom with a garden view',
  'U2 — кухня с видом на рисовые поля': 'U2 — kitchen with a view of the rice fields',
  'U2 — терраса с зоной отдыха': 'U2 — terrace with a lounge area',
  'U2 — фасад виллы, палисадник': 'U2 — villa façade, front garden',
  'U3 — вилла с деревянным фасадом, рендер': 'U3 — villa with a timber façade, render',
  'U3 — внутренний двор с пальмами, рендер': 'U3 — courtyard with palms, render',
  'U3 — зона у приватного бассейна, рендер': 'U3 — private pool area, render',
  'Комплекс Unit Space с высоты — виллы и зелёные дворы': 'Unit Space complex from above — villas and green courtyards',
  'Коридор виллы с панорамным видом на рисовые поля': 'Villa corridor with a panoramic view of the rice fields',
  'Кухня виллы с видом на поля': 'Villa kitchen with a view of the fields',
  'Терраса виллы Unit Space': 'Unit Space villa terrace',
  'Зона отдыха у бассейна U3': 'Lounge area by the U3 pool',
  'Закрыть меню': 'Close menu', 'Комплексы': 'Complexes', 'Меню': 'Menu', 'Разделы': 'Sections', 'Язык': 'Language',
  'Уведомление об использовании cookie': 'Cookie notice'
};
export function translateAttrs(html) {
  for (const [ruV, enV] of Object.entries(ATTR)) html = html.replaceAll(`="${ruV}"`, `="${enV}"`);
  return html.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[А-Яа-яЁё]+/g, '').replace(/\s{2,}/g, ' '));
}
