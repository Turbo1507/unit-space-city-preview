// Страницы форматов на всех языках: units/<slug>.html (EN, корень), ru/units/ (RU-мастер), <xx>/units/ (словарь i18n-xx.js поверх EN);
// en/units/* — редиректы. Из tools/unit-template.html + assets/units.js + словарей. Запуск: node tools/build-units.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { enMeta, applyDict, langHead, translateAttrs, stamp, redirectStub, BASE, LANGS, OG, pre, loadCtx, addLangScript, langSel } from './i18n-static.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const assetsDir = path.join(root, 'photos');
const W = loadCtx(root);
const { USC_UNITS, USC_COMPLEX, USC_PRICE, USC_PRICE_USD, USC_FMT, USC_AREA_TXT, I18N } = W;
const tpl = fs.readFileSync(path.join(here, 'unit-template.html'), 'utf8');
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const missing = [];

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
/* в описании и разметке цена этого комплекса и формата, а не минимум формата по всем комплексам */
const minUsd = (u) => { const ls = (W.USC_LOTS || []).filter((l) => l.slug === u.slug); return ls.length ? Math.min(...ls.map((l) => l.price)) : USC_PRICE_USD[u.fmt]; };
const priceOf = (u, lang) => (lang === 'ru' ? 'от $' : 'from $') + String(minUsd(u)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'ru' ? ' ' : ',');
// title и description на всех языках английские, кроме собственного RU-описания в разметке RU
const enTitle = (u, cx) => `${u.name.en} ${USC_AREA_TXT(u, 'en')} m², ${cx.code} ${cx.name}`;
const enDesc = (u, cx) => `${u.name.en} ${USC_AREA_TXT(u, 'en')} m² in ${cx.code} ${cx.name} (${cx.where.en}), ${cx.status.en}. ${cap(priceOf(u, 'en'))}. Direct from the developer, UNIT.SPACE.`;

for (const lang of LANGS) {
  const outDir = path.join(root, pre(lang), 'units');
  fs.mkdirSync(outDir, { recursive: true });
  const dict = I18N[lang];
  const deep = lang !== 'en';
  for (const u of USC_UNITS) {
    const cx = USC_COMPLEX[u.q];
    for (const p of u.photos) for (const ext of ['jpg', 'webp']) if (!fs.existsSync(path.join(assetsDir, `${p}.${ext}`))) missing.push(`${p}.${ext}`);
    const photoBase = deep ? '../../photos/' : '../photos/';
    const thumbs = u.photos.map((p, i) =>
      `        <button type="button" class="ugal__thumb${i ? '' : ' is-active'}" data-i="${i}"><img src="${photoBase}t/${p}.webp" alt="" width="160" height="120"${i > 2 ? ' loading="lazy"' : ''}></button>`).join('\n');
    const area = USC_AREA_TXT(u, lang);
    const title = lang === 'ru' ? `${u.name.ru} ${area} м², ${cx.code} ${cx.name}` : enTitle(u, cx);
    const desc = lang === 'ru'
      ? `${u.name.ru} ${area} м² в ${cx.code} ${cx.name} (${cx.where.ru}), ${cx.status.ru}. ${priceOf(u, 'ru')}. Покупка напрямую у девелопера UNIT.`
      : enDesc(u, cx);
    let html = tpl
      .replace(/(<p [^>]*data-unit-field="desc">)\{\{DESC\}\}(<\/p>)/, `$1${USC_FMT[u.fmt].desc[lang]}$2`)
      .replaceAll('{{SLUG}}', u.slug).replaceAll('{{TITLE}}', esc(title)).replaceAll('{{DESC}}', esc(desc))
      .replaceAll('{{NAME}}', u.name[lang]).replaceAll('{{AREA}}', area).replaceAll('{{CODE}}', cx.code).replaceAll('{{CXNAME}}', cx.name)
      .replaceAll('{{FLOOR}}', u.floor[lang]).replaceAll('{{PRICE}}', USC_PRICE[lang][u.fmt]).replaceAll('{{WHERE}}', cx.where[lang]).replaceAll('{{STATUS}}', cx.status[lang])
      .replaceAll('{{THUMBS}}', thumbs).replaceAll('{{PHOTOS}}', u.photos.join(',')).replaceAll('{{PB}}', photoBase).replaceAll('{{P0}}', u.photos[0]).replaceAll('{{N}}', String(u.photos.length)).replaceAll('{{ALT}}', esc(cx.code + ': ' + u.name[lang]))
      .replaceAll('{{RENDER_NOTE}}', u.render ? `<p class="t-small dim" style="margin-top:var(--s2)" data-i18n="unit.render_note">${dict['unit.render_note']}</p>` : '')
      .replaceAll('{{PLAN}}', '<div class="ph ph--plan" aria-hidden="true"></div>')
      .replaceAll('{{URL}}', `${BASE}${pre(lang)}units/${u.slug}.html`)
      .replaceAll('{{OGIMG}}', `${BASE}photos/${u.photos[0]}.jpg`)
      .replaceAll('{{OGLOCALE}}', OG[lang])
      .replaceAll('{{PRICENUM}}', String(minUsd(u)))
      .replaceAll('{{RATENUM}}', String(({ studio: 60, '1bd': 95, '2bd': 140, villa: 205 })[u.fmt]))
      .replaceAll('{{MGMTNUM}}', String(({ studio: 11, '1bd': 18, '2bd': 18, villa: 18 })[u.fmt]));
    if (lang !== 'ru') {
      html = translateAttrs(applyDict(html, dict), lang, (W.USC_ATTR || {})[lang]);
      html = html.replaceAll('data-unit-field="m2">м²<', `data-unit-field="m2">${W.uscM2(lang)}<`);
    }
    if (lang !== 'en') {
      if (lang === 'ru') html = enMeta(html, `${esc(enTitle(u, cx))} | UNIT. SPACE CITY`, enDesc(u, cx));
      html = html.replace('data-assets="../photos/"', 'data-assets="../../photos/"');
      html = html.replaceAll('href="../assets/', 'href="../../assets/').replaceAll('src="../assets/', 'src="../../assets/');
    }
    if (lang === 'en') fs.writeFileSync(path.join(root, 'en', 'units', `${u.slug}.html`), redirectStub(`${BASE}units/${u.slug}.html`));
    html = html.replaceAll('href="privacy.html"', 'href="../privacy.html"'); // ссылки из словаря — на уровень выше
    html = html.replace('<html lang="ru"', `<html lang="${lang}"`);
    html = langSel(addLangScript(html, lang, deep ? '../../' : '../'), lang);
    html = html.replace('<link rel="stylesheet"', langHead(lang, `units/${u.slug}.html`) + '\n<link rel="stylesheet"');
    fs.writeFileSync(path.join(outDir, `${u.slug}.html`), stamp(html));
  }
  console.log('ok', lang, USC_UNITS.length, 'pages');
}
if (missing.length) { console.error('MISSING PHOTOS:', [...new Set(missing)].join(', ')); process.exit(1); }
