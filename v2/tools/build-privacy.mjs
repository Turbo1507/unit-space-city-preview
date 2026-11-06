// Политика: privacy.html (EN, корень), ru/privacy.html (RU-мастер) и <xx>/privacy.html: шапка и подвал на языке, сам текст политики английский.
// Из tools/privacy-template.html. Запуск: node tools/build-privacy.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyDict, enMeta, langHead, translateAttrs, stamp, LANGS, pre, loadCtx, addLangScript, langSel } from './i18n-static.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const W = loadCtx(root);
const tpl = fs.readFileSync(path.join(here, 'privacy-template.html'), 'utf8');
const deeper = (h) => h.replaceAll('href="assets/', 'href="../assets/').replaceAll('src="assets/', 'src="../assets/');
const out = [];
for (const lang of LANGS) {
  const up = lang === 'en' ? '' : '../';
  let h;
  if (lang === 'ru') {
    h = enMeta(deeper(tpl.replace(/<html\b[^>]*>/, '<html lang="ru" data-assets="../photos/">')), W.I18N.en['legal.title']);
  } else {
    h = translateAttrs(applyDict(tpl, W.I18N[lang]), lang, (W.USC_ATTR || {})[lang]);
    h = h.replace(/<html\b[^>]*>/, `<html lang="${lang}" data-assets="${up}photos/">`);
    h = enMeta(h, W.I18N.en['legal.title']);
    if (up) h = deeper(h);
  }
  h = langSel(addLangScript(h, lang, up), lang);
  h = h.replace('<link rel="stylesheet"', langHead(lang, 'privacy.html') + '\n<link rel="stylesheet"');
  fs.mkdirSync(path.join(root, pre(lang)), { recursive: true });
  fs.writeFileSync(path.join(root, pre(lang), 'privacy.html'), stamp(h));
  if (lang !== 'ru' && lang !== 'uk' && /[А-Яа-яЁё]{3,}/.test(h)) out.push(lang + ': кириллица');
  else out.push(lang);
}
console.log('ok privacy', out.join(', '));
