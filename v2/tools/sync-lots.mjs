// Свободные лоты из Google-таблицы Босса (вкладка Layouts) → assets/lots.js для блока «Свободные виллы».
// Запуск: node tools/sync-lots.mjs [путь к локальному CSV], затем обычная сборка (build-index и далее).
// SOLD не выводим; формат определяется по колонке MODEL, ссылка карточки — на страницу формата из units.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHEET = 'https://docs.google.com/spreadsheets/d/1g58AS0sl3X8GAxtUnX3QGwbx_hxRBl3vzc4vhSckRoI/export?format=csv&gid=235738430';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../assets/lots.js');

const csv = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : await (await fetch(SHEET)).text();

function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const num = (s) => Number(String(s).replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
const usd = (s) => Number(String(s).replace(/[^\d]/g, '')) || 0;

function format(q, model) {
  const m = model.toUpperCase().replace(/\s+/g, ' ').trim();
  if (/VILLA/.test(m)) return { fmt: 'villa', slug: `${q}-villa` };
  if (/MAX 2BD|2BD/.test(m)) return { fmt: '2bd', slug: `${q}-2bd` };
  if (/1BD 1ROOM/.test(m) || /^US ?1ROOM/.test(m)) return { fmt: 'studio', slug: `${q}-studio` };
  if (/1BD|2ROOMS/.test(m)) return { fmt: '1bd', slug: q === 'u1' ? 'u1-studio' : `${q}-1bd` }; // у U1 нет отдельной страницы 1+1
  return null;
}

const lots = []; const skipped = [];
for (const r of parseCsv(csv)) {
  const id = (r[0] || '').trim();
  if (!/^U[123]\.\w+$/.test(id)) continue;
  const q = id.slice(0, 2).toLowerCase();
  const status = (r[2] || '').trim().toUpperCase();
  if (status === 'SOLD') { skipped.push(`${id} SOLD`); continue; }
  const f = format(q, r[1] || '');
  const area = num(r[4]); const price = usd(r[6]);
  if (!f || !area || !price) { skipped.push(`${id} не распознан: ${r[1]} | ${r[4]} | ${r[6]}`); continue; }
  lots.push({ id, q, fmt: f.fmt, slug: f.slug, area, price });
}

// защита от сломанной/пустой таблицы: ничего не перезаписываем, автосинк упадёт с ошибкой
if (lots.length < 5 || !['u1', 'u2', 'u3'].some((q) => lots.some((l) => l.q === q))) {
  console.error(`СТОП: распознано ${lots.length} лотов — похоже, таблица изменила структуру. Файлы не тронуты.`);
  if (skipped.length) console.error('пропущено:', skipped.join('; '));
  process.exit(1);
}

const ORDER = { studio: 0, '1bd': 1, '2bd': 2, villa: 3 };
lots.sort((a, b) => a.q.localeCompare(b.q) || ORDER[a.fmt] - ORDER[b.fmt] || a.price - b.price);

const root = path.resolve(here, '..');
const changed = [];
function write(rel, text) {
  const f = path.join(root, rel);
  if (fs.readFileSync(f, 'utf8') !== text) { fs.writeFileSync(f, text); changed.push(rel); }
}
if (!fs.existsSync(out)) fs.writeFileSync(out, '');
write('assets/lots.js',
  `/* Свободные лоты — генерируется tools/sync-lots.mjs из Google-таблицы Босса (вкладка Layouts), руками не править.\n` +
  `   SOLD не выводятся. */\n` +
  `window.USC_LOTS = [\n${lots.map((l) => '  ' + JSON.stringify(l)).join(',\n')}\n];\n`);

// ---- блок «Форматы вилл» и «от»-цены страниц форматов: из тех же лотов ----
const NB = ' ';
const FMTS = ['studio', '1bd', '2bd', 'villa'];
const agg = {};
for (const f of FMTS) {
  const ls = lots.filter((l) => l.fmt === f);
  if (!ls.length) continue;
  const areas = ls.map((l) => l.area);
  agg[f] = { min: Math.min(...ls.map((l) => l.price)), where: ['u1', 'u2', 'u3'].filter((q) => ls.some((l) => l.q === q)).map((q) => q.toUpperCase()).join(', '), aMin: Math.min(...areas), aMax: Math.max(...areas) };
}
const priceTxt = (n, lang) => lang === 'ru' ? `от $${n.toLocaleString('ru-RU')}` : `from $${n.toLocaleString('en-US')}`;
const areaTxt = (a, lang) => {
  const f = (x) => (lang === 'ru' ? String(x).replace('.', ',') : String(x));
  return (a.aMin === a.aMax ? f(a.aMin) : `${f(a.aMin)}–${f(a.aMax)}`) + (lang === 'ru' ? ' м²' : ' m²');
};

// словарь: первое вхождение ключа — RU, второе — EN
let i18n = fs.readFileSync(path.join(root, 'assets/i18n.js'), 'utf8');
function setKey(key, fn) {
  let n = 0;
  i18n = i18n.replace(new RegExp(`("${key.replace('.', '\\.')}": ")([^"]*)(")`, 'g'), (m, a, v, b) => a + fn(v, n++ === 0 ? 'ru' : 'en') + b);
  return n;
}
for (const f of Object.keys(agg)) {
  const a = agg[f];
  setKey(`price.${f}`, (v, lang) => priceTxt(a.min, lang));
  setKey(`fmt.${f}_w`, () => a.where);
  setKey(`fmt.${f}_m`, (v) => a.where + v.slice(v.indexOf(NB + '—')));
  setKey(`calc.pick_${f}`, (v, lang) => `${areaTxt(a, lang)} — ${priceTxt(a.min, lang)}`);
  if (!setKey(`fmt.${f}_a`, (v, lang) => areaTxt(a, lang))) {
    let n = 0;
    i18n = i18n.replace(new RegExp(`(\\n(\\s*)"fmt\\.${f}_w": "[^"]*",)`, 'g'), (m, line, sp) => `${line}\n${sp}"fmt.${f}_a": "${areaTxt(a, n++ === 0 ? 'ru' : 'en')}",`);
  }
}
write('assets/i18n.js', i18n);

// RU-мастер главной: в разметке блока форматов — ровно RU-значения словаря (замены только функциями: в ценах есть «$»)
const ruVal = (key) => { const m = i18n.match(new RegExp(`"${key.replace('.', '\\.')}": "([^"]*)"`)); return m && m[1]; };
let tpl = fs.readFileSync(path.join(root, 'tools/index-template.html'), 'utf8');
for (const f of Object.keys(agg)) {
  // калькулятор доходности: цена карточки выбора = та же «от»; активная карточка задаёт стартовое значение поля
  tpl = tpl.replace(new RegExp(`(<button type="button" class="calc__pick-card( is-active)?" data-price=")\\d+("[^>]*><b data-i18n="fmt\\.${f}">)`),
    (m, o, act, c) => o + agg[f].min + c);
  if (new RegExp(`class="calc__pick-card is-active"[^>]*><b data-i18n="fmt\\.${f}">`).test(tpl)) {
    tpl = tpl.replace(/(<input type="number" id="c-price" value=")\d+(")/, (m, o, c) => o + agg[f].min + c);
  }
  for (const key of [`price.${f}`, `fmt.${f}_w`, `fmt.${f}_m`, `calc.pick_${f}`]) {
    const v = ruVal(key); if (v == null) continue;
    tpl = tpl.replace(new RegExp(`(data-i18n="${key.replace('.', '\\.')}">)[^<]*(<)`), (m, o, c) => o + v + c);
  }
  tpl = tpl.replace(new RegExp(`(<a class="fmt-card__media" href="units/u2-${f}\\.html"[^>]*>(?:(?!</a>)[\\s\\S])*?<span class="product-card__area")(?: data-i18n="[^"]*")?>[^<]*(</span>)`),
    (m, o, c) => `${o} data-i18n="fmt.${f}_a">${ruVal(`fmt.${f}_a`)}${c}`);
}
write('tools/index-template.html', tpl);

// units.js: «от»-цены форматов (страницы форматов, IDR-пересчёт) — блок генерируется целиком, нет лотов формата → прежнее значение
let units = fs.readFileSync(path.join(root, 'assets/units.js'), 'utf8');
const oldUsd = {}; (units.match(/USC_PRICE_USD = \{([^}]*)\}/)[1]).replace(/'?([\w]+)'?:(\d+)/g, (m, k, v) => { oldUsd[k] = +v; });
const minOf = (f) => (agg[f] ? agg[f].min : oldUsd[f]);
const js = (lang) => FMTS.map((f) => `${/^\d/.test(f) ? `'${f}'` : f}:'${priceTxt(minOf(f), lang)}'`).join(',');
units = units.replace(/window\.USC_PRICE = \{ru:\{[^}]*\},\s*\n\s*en:\{[^}]*\}\};/, () => `window.USC_PRICE = {ru:{${js('ru')}},\n                    en:{${js('en')}}};`)
             .replace(/window\.USC_PRICE_USD = \{[^}]*\};/, () => `window.USC_PRICE_USD = {${FMTS.map((f) => `${/^\d/.test(f) ? `'${f}'` : f}:${minOf(f)}`).join(',')}};`)
             .replace(/Средние по актуальным резейл-лотам \(Google Sheets, 22\.09\), не прайс девелопера — Босс подтвердил 23\.09/, 'Минимальная цена свободного лота формата — пишет tools/sync-lots.mjs из таблицы Босса');
write('assets/units.js', units);

console.log(`ok: ${lots.length} лотов (${['u1', 'u2', 'u3'].map((q) => q.toUpperCase() + ' ' + lots.filter((l) => l.q === q).length).join(', ')})`);
console.log('форматы:', Object.entries(agg).map(([f, a]) => `${f} ${priceTxt(a.min, 'ru')} [${a.where}] ${areaTxt(a, 'ru')}`).join(' | '));
console.log(changed.length ? 'изменено: ' + changed.join(', ') : 'изменений нет');
if (skipped.length) console.log('пропущено:', skipped.join('; '));
