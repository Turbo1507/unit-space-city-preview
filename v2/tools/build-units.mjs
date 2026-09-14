// Генерирует страницы юнитов: units/<slug>.html (RU) и en/units/<slug>.html (EN)
// из tools/unit-template.html + assets/units.js + assets/i18n.js. Запуск: node tools/build-units.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { applyDict, langHead, translateAttrs } from './i18n-static.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const assetsDir = path.resolve(root, '../prototype-2026-09/assets');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/units.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/i18n.js'), 'utf8').split('window.setLang')[0], ctx);
const { USC_UNITS, USC_COMPLEX, USC_PRICE, USC_FMT, I18N } = ctx.window;
const tpl = fs.readFileSync(path.join(here, 'unit-template.html'), 'utf8');
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const m2 = { ru: 'м²', en: 'm²' };
let missing = [];

for (const lang of ['ru', 'en']) {
  const outDir = lang === 'ru' ? path.join(root, 'units') : path.join(root, 'en', 'units');
  fs.mkdirSync(outDir, { recursive: true });
  const dict = I18N[lang];
  for (const u of USC_UNITS) {
    const cx = USC_COMPLEX[u.q];
    for (const p of u.photos) for (const ext of ['jpg', 'webp']) if (!fs.existsSync(path.join(assetsDir, `${p}.${ext}`))) missing.push(`${p}.${ext}`);
    const photoBase = lang === 'ru' ? '../../prototype-2026-09/assets/' : '../../../prototype-2026-09/assets/';
    const gallery = u.photos.slice(0, 3).map((p, i) =>
      `      <figure><picture><source srcset="${photoBase}${p}.webp" type="image/webp"><img src="${photoBase}${p}.jpg" alt="${esc(cx.code + ' — ' + u.name[lang])}" width="960" height="720"${i ? ' loading="lazy"' : ''}></picture></figure>`).join('\n');
    const title = `${u.name[lang]} ${u.area} ${m2[lang]}, ${cx.code} ${cx.name}`;
    const desc = lang === 'ru'
      ? `${u.name.ru} ${u.area} м² в ${cx.code} ${cx.name} (${cx.where.ru}), ${cx.status.ru}. ${USC_PRICE.ru[u.fmt]}. Покупка напрямую у девелопера UNIT.`
      : `${u.name.en} ${u.area} m² in ${cx.code} ${cx.name} (${cx.where.en}), ${cx.status.en}. ${USC_PRICE.en[u.fmt]}. Direct from the developer, Unit Space.`;
    let html = tpl
      .replace('<p data-unit-field="desc">{{DESC}}</p>', `<p data-unit-field="desc">${USC_FMT[u.fmt].desc[lang]}</p>`)
      .replaceAll('{{SLUG}}', u.slug).replaceAll('{{TITLE}}', esc(title)).replaceAll('{{DESC}}', esc(desc))
      .replaceAll('{{NAME}}', u.name[lang]).replaceAll('{{AREA}}', String(u.area)).replaceAll('{{CODE}}', cx.code).replaceAll('{{CXNAME}}', cx.name)
      .replaceAll('{{FLOOR}}', u.floor[lang]).replaceAll('{{PRICE}}', USC_PRICE[lang][u.fmt]).replaceAll('{{WHERE}}', cx.where[lang]).replaceAll('{{STATUS}}', cx.status[lang])
      .replaceAll('{{GALLERY}}', gallery).replaceAll('{{GALLERY_MOD}}', u.photos.length < 3 ? ' unit-gallery--2' : '')
      .replaceAll('{{RENDER_NOTE}}', u.render ? `<p class="t-small dim" style="margin-top:var(--s2)" data-i18n="unit.render_note">${dict['unit.render_note']}</p>` : '')
      .replaceAll('{{PLAN}}', '<div class="ph ph--plan" aria-hidden="true"></div>');
    if (lang === 'en') {
      html = translateAttrs(applyDict(html, dict));
      html = html.replaceAll('data-unit-field="m2">м²<', 'data-unit-field="m2">m²<');
      html = html.replace('data-assets="../../prototype-2026-09/assets/"', 'data-assets="../../../prototype-2026-09/assets/"');
      html = html.replaceAll('href="../assets/', 'href="../../assets/').replaceAll('src="../assets/', 'src="../../assets/');
    }
    html = html.replace('<html lang="ru"', `<html lang="${lang}"`);
    html = html.replace('<link rel="stylesheet"', langHead(lang, `units/${u.slug}.html`) + '\n<link rel="stylesheet"');
    fs.writeFileSync(path.join(outDir, `${u.slug}.html`), html);
  }
  console.log('ok', lang, USC_UNITS.length, 'pages');
}
if (missing.length) { console.error('MISSING PHOTOS:', [...new Set(missing)].join(', ')); process.exit(1); }
