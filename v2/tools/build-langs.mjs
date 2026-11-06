// Словари новых языков: tools/l10n/<xx>.json → assets/i18n-<xx>.js. Запускается из build-index.mjs, отдельно: node tools/build-langs.mjs
// Формат JSON: { dict: {ключ: текст}, units: {slug: {name, floor}}, complex: {u1: {status, where}}, fmt: {studio: описание}, attrs: {EN-alt: перевод} }.
// Чего нет в JSON, берётся из EN. Цены, метражи и «где есть формат» не переводятся: их пересчитывает uscApplyLang из EN (автосинк).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const AUTO = /^(price\.(studio|1bd|2bd|villa)|fmt\.(studio|1bd|2bd|villa)_[wa]|calc\.pick_.*|legal\..*)$/;

export function buildLangs() {
  const dir = path.join(here, 'l10n');
  if (!fs.existsSync(dir)) return [];
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/i18n.js'), 'utf8').split('window.setLang')[0], ctx);
  const EN = ctx.window.I18N.en;
  const need = Object.keys(EN).filter((k) => !AUTO.test(k));
  const done = [];
  for (const file of fs.readdirSync(dir).filter((f) => /^[a-z]{2}\.json$/.test(f)).sort()) {
    const lang = file.slice(0, 2);
    const j = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const dict = {};
    for (const k of Object.keys(j.dict || {})) if (k in EN && !AUTO.test(k) && typeof j.dict[k] === 'string') dict[k] = j.dict[k];
    const extra = { units: j.units || {}, complex: j.complex || {}, fmt: j.fmt || {}, attrs: j.attrs || {} };
    const body = Object.entries(dict).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n');
    fs.writeFileSync(path.join(root, 'assets', `i18n-${lang}.js`),
      `/* ${lang.toUpperCase()}: собирает tools/build-langs.mjs из tools/l10n/${file}, руками не править */\nwindow.I18N.${lang} = {\n${body}\n};\nwindow.uscApplyLang(${JSON.stringify(lang)}, ${JSON.stringify(extra)});\n`);
    const miss = need.filter((k) => !(k in dict));
    done.push(`${lang} ${Object.keys(dict).length}/${need.length}${miss.length ? ' (из EN: ' + miss.length + ')' : ''}`);
  }
  return done;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log('ok langs', buildLangs().join(', ') || 'нет');
