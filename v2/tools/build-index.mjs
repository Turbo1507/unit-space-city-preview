// Собирает index.html (EN — основной язык, корень; Босс 15.09) и ru/index.html из tools/index-template.html
// (RU-мастер с data-i18n) + window.I18N.en (паттерн build-ru.mjs с БСО). Старые /en/* отдают редирект-заглушки.
// Запуск после любой правки шаблона или словаря:
//   node tools/build-index.mjs && node tools/build-units.mjs && node tools/build-privacy.mjs && node tools/build-sitemap.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { applyDict, langHead, translateAttrs, stamp, redirectStub, BASE } from './i18n-static.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/i18n.js'), 'utf8').split('window.setLang')[0], ctx);
const EN = ctx.window.I18N.en;
if (!EN || Object.keys(EN).length < 150) { console.error('I18N.en не загрузился'); process.exit(1); }

const HEAD_RX = /<script>try\{localStorage\.setItem\('usc_lang'[\s\S]*?hreflang="x-default"[^>]*>\n?/;
const tpl = fs.readFileSync(path.join(here, 'index-template.html'), 'utf8').replace(HEAD_RX, '');
const swapLang = h => h.replace(/<button type="button" data-lang="ru" class="is-active">RU<\/button><span>\/<\/span><button type="button" data-lang="en">EN<\/button>/g,
  '<button type="button" data-lang="ru">RU</button><span>/</span><button type="button" data-lang="en" class="is-active">EN</button>');

// ---- EN → index.html (корень) ----
let en = translateAttrs(applyDict(tpl, EN)).replaceAll(' м²</b>', ' m²</b>').replaceAll(' м²</span>', ' m²</span>');
en = en.replace(/<html\b[^>]*>/, '<html lang="en" data-assets="photos/">');
en = en.replace(/<title>[^<]*<\/title>/, `<title>${EN['meta.title']}</title>`);
en = en.replace(/(<meta name="description" content=")[^"]*(")/, `$1${EN['meta.desc'].replace(/"/g, '&quot;')}$2`);
en = en.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${EN['meta.title']}$2`).replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${EN['meta.desc'].replace(/"/g, '&quot;')}$2`);
en = en.replace('<meta property="og:locale" content="ru_RU">', '<meta property="og:locale" content="en_US">');
// мастерплан Nuanu — единственная картинка с текстом внутри, у неё отдельный EN-файл (словарь подменяет только alt)
en = en.replaceAll('nuanu-plan-ru', 'nuanu-plan-en');
en = en.replace('"inLanguage":"ru"', '"inLanguage":"en"');
en = en.replace('"description":"Три жилых комплекса U1 Space Village, U2 Nuanu Village и U3 Nyanyi Village рядом с Nuanu Creative City, Бали"', '"description":"Three residential complexes — U1 Space Village, U2 Nuanu Village and U3 Nyanyi Village — next to Nuanu Creative City, Bali"');
en = swapLang(en);
// EN: Анну Орлову не показываем — карточка Стивена становится широкой (фото + био рядом)
en = en.replace(/<article class="team-card card">\s*<div><div class="team-card__name" data-i18n="co\.p2n">[\s\S]*?<\/article>\s*/, '');
en = en.replace('<article class="team-card card">', '<article class="team-card team-card--wide card">');
en = en.replace('<link rel="stylesheet"', langHead('en', '') + '\n<link rel="stylesheet"');
fs.writeFileSync(path.join(root, 'index.html'), stamp(en));
const left = (en.match(/[А-Яа-яЁё]{3,}/g) || []).filter(w => !/UNIT/.test(w));
console.log('ok index.html (EN); кириллица осталась:', left.length ? [...new Set(left)].slice(0, 20).join(', ') : 'нет');

// ---- RU → ru/index.html ----
let ru = tpl.replace(/<html\b[^>]*>/, '<html lang="ru" data-assets="../photos/">');
ru = ru.replace(/(<meta property="og:url" content="[^"]*v2\/)(")/, '$1ru/$2');
ru = ru.replace(/"@id":"([^"]*v2\/)#site","url":"[^"]*"/, '"@id":"$1ru/#site","url":"$1ru/"');
ru = ru.replaceAll('href="assets/', 'href="../assets/').replaceAll('src="assets/', 'src="../assets/');
ru = ru.replaceAll('="photos/', '="../photos/');
ru = ru.replace('<link rel="stylesheet"', langHead('ru', '') + '\n<link rel="stylesheet"');
fs.mkdirSync(path.join(root, 'ru'), { recursive: true });
fs.writeFileSync(path.join(root, 'ru', 'index.html'), stamp(ru));
console.log('ok ru/index.html');

// ---- /en/* → редиректы на корень (старые ссылки, индекс) ----
fs.mkdirSync(path.join(root, 'en', 'units'), { recursive: true });
fs.writeFileSync(path.join(root, 'en', 'index.html'), redirectStub(BASE));
fs.writeFileSync(path.join(root, 'en', 'privacy.html'), redirectStub(BASE + 'privacy.html'));
console.log('ok en/ redirect stubs');
