// Страница политики: privacy.html (RU) и en/privacy.html из tools/privacy-template.html. Запуск: node tools/build-privacy.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { applyDict, langHead, translateAttrs, stamp } from './i18n-static.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/i18n.js'), 'utf8').split('window.setLang')[0], ctx);
const tpl = fs.readFileSync(path.join(here, 'privacy-template.html'), 'utf8');

fs.writeFileSync(path.join(root, 'privacy.html'), stamp(tpl.replace('<link rel="stylesheet"', langHead('ru', 'privacy.html') + '\n<link rel="stylesheet"')));
let en = translateAttrs(applyDict(tpl, ctx.window.I18N.en));
en = en.replace(/<html\b[^>]*>/, '<html lang="en" data-assets="../../prototype-2026-09/assets/">');
en = en.replaceAll('href="assets/', 'href="../assets/').replaceAll('src="assets/', 'src="../assets/');
en = en.replace(/<button type="button" data-lang="ru" class="is-active">RU<\/button><span>\/<\/span><button type="button" data-lang="en">EN<\/button>/g,
  '<button type="button" data-lang="ru">RU</button><span>/</span><button type="button" data-lang="en" class="is-active">EN</button>');
en = en.replace('<link rel="stylesheet"', langHead('en', 'privacy.html') + '\n<link rel="stylesheet"');
fs.writeFileSync(path.join(root, 'en', 'privacy.html'), stamp(en));
const left = (en.match(/[А-Яа-яЁё]{3,}/g) || []);
console.log('ok privacy.html + en/privacy.html; кириллица:', left.length ? [...new Set(left)].slice(0, 10).join(', ') : 'нет');
