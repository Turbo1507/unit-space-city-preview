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
  'Виллы U1 Space Village среди рисовых полей': 'U1 Space Village villas among the rice fields',
  'Фасады вилл U1 с деревянными террасами': 'U1 villa façades with timber terraces',
  'Терраса виллы Unit Space на закате': 'Unit Space villa terrace at sunset',
  'Лежаки у приватного бассейна виллы U2': 'Sun loungers by a private U2 villa pool',
  'Виллы Unit Space в рисовых полях у Nuanu': 'Unit Space villas in the rice fields next to Nuanu',
  'Общий двор U2 с бассейном и лаунжем': 'U2 shared courtyard with pool and lounge',
  'Фасады U2 Nuanu Village': 'U2 Nuanu Village façades',
  'Терраса виллы U2 с видом на рисовые поля': 'U2 villa terrace overlooking the rice fields',
  'Терраса виллы U1 на закате': 'U1 villa terrace at sunset',
  'U1 — стеклянный фасад и сад виллы': 'U1 — glass façade and villa garden',
  'U1 — спальня с видом на пальмы': 'U1 — bedroom with a view of the palms',
  'U1 — приватный бассейн и сауна': 'U1 — private pool and sauna',
  'U2 — бассейн виллы во внутреннем дворе': 'U2 — villa pool in the inner courtyard',
  'U2 — студия, спальная зона': 'U2 — studio, sleeping area',
  'U2 — кухня-гостиная 1+1': 'U2 — 1+1 kitchen and living room',
  'U3 — виллы с двором, рендер': 'U3 — villas with a courtyard, render',
  'U3 — внутренняя улица комплекса, рендер': 'U3 — inner street of the complex, render',
  'U3 — вилла с террасой, рендер': 'U3 — villa with a terrace, render',
  'Гостиная виллы U2 с видом на рисовые поля': 'U2 villa living room overlooking the rice fields',
  'Студия U2 — кухня и рабочее место': 'U2 studio — kitchen and workspace',
  'Студия — спальная зона': 'Studio — sleeping area',
  '1+1 — спальня': '1+1 — bedroom',
  '2+1 — кухня-гостиная': '2+1 — kitchen and living room',
  'Вилла 3+1 — фасад': '3+1 villa — façade',
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

// кеш-бастинг: ?v=<hash содержимого> у site.css / site.js / i18n.js / units.js (Pages кеширует 10 мин)
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const _root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function assetVersion() {
  const h = createHash('md5');
  for (const f of ['site.css', 'site.js', 'i18n.js', 'units.js']) h.update(fs.readFileSync(path.join(_root, 'assets', f)));
  return h.digest('hex').slice(0, 8);
}
export function stamp(html) {
  const v = assetVersion();
  return html.replace(/(assets\/(?:site\.css|site\.js|i18n\.js|units\.js))(\?v=[0-9a-f]+)?/g, `$1?v=${v}`);
}
