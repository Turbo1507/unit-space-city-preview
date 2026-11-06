// Собирает главную на всех языках из tools/index-template.html (RU-мастер с data-i18n):
// index.html (EN, корень), ru/index.html (мастер как есть), <xx>/index.html (словарь assets/i18n-xx.js поверх EN). Старые /en/* отдают редирект-заглушки.
// Запуск после любой правки шаблона или словаря:
// node tools/build-index.mjs && node tools/build-units.mjs && node tools/build-privacy.mjs && node tools/build-sitemap.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyDict, enMeta, langHead, translateAttrs, stamp, redirectStub, BASE, LANGS, OG, pre, loadCtx, addLangScript, langSel } from './i18n-static.mjs';
import { buildLangs } from './build-langs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const langsDone = buildLangs();
if (langsDone.length) console.log('ok langs', langsDone.join(', '));
const W = loadCtx(root);
const EN = W.I18N.en;
if (!EN || Object.keys(EN).length < 150) { console.error('I18N.en не загрузился'); process.exit(1); }

const HEAD_RX = /<script>try\{localStorage\.setItem\('usc_lang'[\s\S]*?hreflang="x-default"[^>]*>\n?/;
const tpl = fs.readFileSync(path.join(here, 'index-template.html'), 'utf8').replace(HEAD_RX, '');
const RU_LD = '"description":"Три жилых комплекса U1 Space Village, U2 Nuanu Village и U3 Nyanyi Village рядом с Nuanu Creative City, Бали"';
const EN_LD = '"description":"Three residential complexes, U1 Space Village, U2 Nuanu Village and U3 Nyanyi Village, next to Nuanu Creative City, Bali"';
const deeper = (h) => h.replaceAll('href="assets/', 'href="../assets/').replaceAll('src="assets/', 'src="../assets/').replaceAll('="photos/', '="../photos/').replaceAll(', photos/', ', ../photos/');
const ownUrl = (h, lang) => h.replace(`<meta property="og:url" content="${BASE}">`, `<meta property="og:url" content="${BASE}${pre(lang)}">`)
  .replace(`"@id":"${BASE}#site","url":"${BASE}"`, `"@id":"${BASE}${pre(lang)}#site","url":"${BASE}${pre(lang)}"`);

for (const lang of LANGS) {
  const p = pre(lang), up = lang === 'en' ? '' : '../';
  let h;
  if (lang === 'ru') {
    h = tpl.replace(/<html\b[^>]*>/, '<html lang="ru" data-assets="../photos/">');
    h = enMeta(deeper(h), EN['meta.title'], EN['meta.desc']);
  } else {
    const D = W.I18N[lang];
    if (!D) { console.error('нет словаря', lang); process.exit(1); }
    const m2 = W.uscM2(lang);
    h = translateAttrs(applyDict(tpl, D), lang, (W.USC_ATTR || {})[lang]).replaceAll(' м²</b>', ` ${m2}</b>`).replaceAll(' м²</span>', ` ${m2}</span>`);
    h = h.replace(/<html\b[^>]*>/, `<html lang="${lang}" data-assets="photos/">`);
    h = enMeta(h, EN['meta.title'], EN['meta.desc']);
    h = h.replace('<meta property="og:locale" content="ru_RU">', `<meta property="og:locale" content="${OG[lang]}">`);
    h = h.replace('"inLanguage":"ru"', `"inLanguage":"${lang}"`).replace(RU_LD, EN_LD);
    // не RU: Анну Орлову не показываем, карточка Стивена становится широкой (фото + био рядом)
    h = h.replace(/<article class="team-card card">\s*<div><div class="team-card__name" data-i18n="co\.p2n">[\s\S]*?<\/article>\s*/, '');
    h = h.replace('<article class="team-card card">', '<article class="team-card team-card--wide card">');
    if (up) h = deeper(h).replace('data-assets="photos/"', 'data-assets="../photos/"');
  }
  h = langSel(addLangScript(ownUrl(h, lang), lang, up), lang);
  h = h.replace('<link rel="stylesheet"', langHead(lang, '') + '\n<link rel="stylesheet"');
  fs.mkdirSync(path.join(root, p), { recursive: true });
  fs.writeFileSync(path.join(root, p, 'index.html'), stamp(h));
  // кириллица в не-RU версиях = непереведённое (в украинской ищем только русские буквы)
  const rx = lang === 'ru' ? null : lang === 'uk' ? /[А-Яа-я]*[ЁёЫыЭэЪъ][А-Яа-я]*/g : /[А-Яа-яЁёЇїІіЄєҐґ]{3,}/g;
  const left = rx ? [...new Set(h.match(rx) || [])] : [];
  console.log(`ok ${p}index.html` + (rx ? '; кириллица: ' + (left.length ? left.slice(0, 15).join(', ') : 'нет') : ''));
}

// /en/* → редиректы на корень (старые ссылки, индекс)
fs.mkdirSync(path.join(root, 'en', 'units'), { recursive: true });
fs.writeFileSync(path.join(root, 'en', 'index.html'), redirectStub(BASE));
fs.writeFileSync(path.join(root, 'en', 'privacy.html'), redirectStub(BASE + 'privacy.html'));
console.log('ok en/ redirect stubs');
