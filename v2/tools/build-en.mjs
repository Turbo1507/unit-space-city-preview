// Собирает en/index.html из index.html + window.I18N.en (паттерн build-ru.mjs с БСО).
// Также добавляет в RU index.html языковой <head>-блок (canonical/hreflang/localStorage).
// Запуск после любой правки index.html или словаря: node tools/build-en.mjs && node tools/build-units.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { applyDict, langHead, translateAttrs, stamp } from './i18n-static.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/i18n.js'), 'utf8').split('window.setLang')[0], ctx);
const EN = ctx.window.I18N.en;
if (!EN || Object.keys(EN).length < 150) { console.error('I18N.en не загрузился'); process.exit(1); }

const HEAD_RX = /<script>try\{localStorage\.setItem\('usc_lang'[\s\S]*?hreflang="x-default"[^>]*>\n?/;
let ru = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(HEAD_RX, '');
// RU index: языковой блок
const ruOut = ru.replace('<link rel="stylesheet"', langHead('ru', '') + '\n<link rel="stylesheet"');
fs.writeFileSync(path.join(root, 'index.html'), stamp(ruOut));

// EN index
let en = translateAttrs(applyDict(ru, EN)).replaceAll(' м²</b>', ' m²</b>').replaceAll(' м²</span>', ' m²</span>');
en = en.replace(/<html\b[^>]*>/, '<html lang="en" data-assets="../photos/">');
en = en.replace(/<title>[^<]*<\/title>/, `<title>${EN['meta.title']}</title>`);
en = en.replace(/(<meta name="description" content=")[^"]*(")/, `$1${EN['meta.desc'].replace(/"/g, '&quot;')}$2`);
en = en.replaceAll('href="assets/', 'href="../assets/').replaceAll('src="assets/', 'src="../assets/');
en = en.replaceAll('="photos/', '="../photos/');
en = en.replace(/<button type="button" data-lang="ru" class="is-active">RU<\/button><span>\/<\/span><button type="button" data-lang="en">EN<\/button>/g,
  '<button type="button" data-lang="ru">RU</button><span>/</span><button type="button" data-lang="en" class="is-active">EN</button>');
// EN: Анну Орлову не показываем — карточка Стивена становится широкой (фото + био рядом)
en = en.replace(/<article class="team-card card">\s*<div><div class="team-card__name" data-i18n="co\.p2n">[\s\S]*?<\/article>\s*/, '');
en = en.replace('<article class="team-card card">', '<article class="team-card team-card--wide card">');
en = en.replace('<link rel="stylesheet"', langHead('en', '') + '\n<link rel="stylesheet"');
fs.mkdirSync(path.join(root, 'en'), { recursive: true });
fs.writeFileSync(path.join(root, 'en', 'index.html'), stamp(en));
const left = (en.match(/[А-Яа-яЁё]{3,}/g) || []).filter(w => !/UNIT/.test(w));
console.log('ok en/index.html; кириллица осталась:', left.length ? [...new Set(left)].slice(0, 20).join(', ') : 'нет');
