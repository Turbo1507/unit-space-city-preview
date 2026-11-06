// Проверка перевода: node tools/l10n-check.mjs <xx>  (или --source: пересобрать tools/l10n/_source.json из EN/RU)
// Ловит: пропущенные ключи, разные HTML-теги и классы с EN, тире и среднюю точку, кириллицу, потерянные {p} и числа.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { ATTR } from './i18n-static.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/units.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/i18n.js'), 'utf8').split('window.setLang')[0], ctx);
const { I18N, USC_UNITS, USC_COMPLEX, USC_FMT } = ctx.window;
const AUTO = /^(price\.(studio|1bd|2bd|villa)|fmt\.(studio|1bd|2bd|villa)_[wa]|calc\.pick_.*|legal\..*)$/;
const keys = Object.keys(I18N.en).filter((k) => !AUTO.test(k));

if (process.argv[2] === '--source') {
  const src = {
    dict: Object.fromEntries(keys.map((k) => [k, { en: I18N.en[k], ru: I18N.ru[k] }])),
    units: Object.fromEntries(USC_UNITS.map((u) => [u.slug, { name: { en: u.name.en, ru: u.name.ru }, floor: { en: u.floor.en, ru: u.floor.ru } }])),
    complex: Object.fromEntries(Object.entries(USC_COMPLEX).map(([q, c]) => [q, { status: c.status, where: c.where }])),
    fmt: Object.fromEntries(Object.entries(USC_FMT).map(([f, v]) => [f, v.desc])),
    attrs: [...new Set(Object.values(ATTR))].concat('photo'),
  };
  fs.writeFileSync(path.join(here, 'l10n', '_source.json'), JSON.stringify(src, null, 1));
  console.log('ok _source.json:', keys.length, 'ключей,', src.attrs.length, 'alt');
  process.exit(0);
}

const lang = process.argv[2];
const j = JSON.parse(fs.readFileSync(path.join(here, 'l10n', lang + '.json'), 'utf8'));
/* сравниваем открывающие теги; обёртку nw (без переноса по дефису) язык ставит по-своему */
const tags = (s) => (String(s).match(/<[a-z][^>]*>/gi) || []).filter((t) => !/class=.nw./.test(t)).map((t) => t.replace(/\s+(href|title|aria-[a-z]+)="[^"]*"/g, '')).sort().join('|');
/* разделитель тысяч у языков разный: 1,500 / 1 500 / 1.500 — сравниваем без него */
const nums = (s) => (String(s).replace(/&nbsp;/g, ' ').replace(/(\d)[\s\u00a0\u202f.,](?=\d{3}(?!\d))/g, '$1').match(/\d+(?:[.,]\d+)?/g) || []).map((n) => n.replace(',', '.')).sort().join(' ');
const cyr = lang === 'uk' ? /[ЁёЫыЭэЪъ]/ : /[А-Яа-яЁёЇїІіЄєҐґ]/;
const errs = [];
const chk = (where, en, v) => {
  if (typeof v !== 'string' || !v.trim()) { errs.push(`${where}: пусто`); return; }
  if (tags(en) !== tags(v)) errs.push(`${where}: теги не как в EN\n    EN: ${tags(en)}\n    ${lang}: ${tags(v)}`);
  if (/[—·]/.test(v)) errs.push(`${where}: тире или средняя точка`);
  if (cyr.test(v)) errs.push(`${where}: кириллица`);
  if (nums(en) !== nums(v)) errs.push(`${where}: числа не как в EN (${nums(en)} / ${nums(v)})`);
  if (/\{p\}/.test(en) && !/\{p\}/.test(v)) errs.push(`${where}: потерян {p}`);
};
const D = j.dict || {};
for (const k of keys) { if (!(k in D)) errs.push(`dict.${k}: нет ключа`); else chk('dict.' + k, I18N.en[k], D[k]); }
for (const k of Object.keys(D)) if (!keys.includes(k)) errs.push(`dict.${k}: лишний ключ`);
for (const u of USC_UNITS) { const t = (j.units || {})[u.slug] || {}; chk(`units.${u.slug}.name`, u.name.en, t.name); chk(`units.${u.slug}.floor`, u.floor.en, t.floor); }
for (const [q, c] of Object.entries(USC_COMPLEX)) { const t = (j.complex || {})[q] || {}; chk(`complex.${q}.status`, c.status.en, t.status); chk(`complex.${q}.where`, c.where.en, t.where); }
for (const [f, v] of Object.entries(USC_FMT)) chk(`fmt.${f}`, v.desc.en, (j.fmt || {})[f]);
for (const a of [...new Set(Object.values(ATTR))].concat('photo')) if (!(j.attrs || {})[a]) errs.push(`attrs: нет перевода «${a}»`);
console.log(errs.length ? errs.join('\n') + `\n\nИТОГО ошибок: ${errs.length}` : `ok ${lang}: ${keys.length} ключей, ошибок нет`);
process.exit(errs.length ? 1 : 0);
