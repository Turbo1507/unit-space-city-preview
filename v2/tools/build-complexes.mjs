// Страницы комплексов: complexes/<q>.html (EN, корень) и ru/complexes/<q>.html (RU) из tools/unit-template.html.
// Экстерьеры комплекса в барабане, все свободные виллы комплекса (assets/lots.js, рендер в site.js), «О комплексе», форматы комплекса.
// Запуск: node tools/build-complexes.mjs (после build-units)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { applyDict, langHead, translateAttrs, stamp, BASE } from './i18n-static.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/units.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/lots.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/i18n.js'), 'utf8').split('window.setLang')[0], ctx);
const { USC_COMPLEX, USC_LOTS, I18N } = ctx.window;
const src = fs.readFileSync(path.join(here, 'unit-template.html'), 'utf8').replace(/\r\n/g, '\n');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const cut = (s, from, to, by) => { // заменить кусок от from до to (включительно) — якоря обязаны найтись
  const a = s.indexOf(from); const b = s.indexOf(to, a + from.length);
  if (a < 0 || b < 0) throw new Error('нет якоря: ' + (a < 0 ? from : to).slice(0, 60));
  return s.slice(0, a) + by + s.slice(b + to.length);
};
const money = (n, lang) => (lang === 'ru' ? `от $${n.toLocaleString('ru-RU').replace(/ /g, ' ')}` : `from $${n.toLocaleString('en-US')}`);
let missing = [];

for (const lang of ['ru', 'en']) {
  const outDir = lang === 'en' ? path.join(root, 'complexes') : path.join(root, 'ru', 'complexes');
  fs.mkdirSync(outDir, { recursive: true });
  const dict = I18N.ru; // RU-мастер; EN — applyDict ниже, как у страниц форматов
  for (const q of ['u1', 'u2', 'u3']) {
    const cx = USC_COMPLEX[q];
    const photos = cx.ext;
    for (const p of photos) for (const f of [`${p}.jpg`, `${p}.webp`, `t/${p}.webp`]) if (!fs.existsSync(path.join(root, 'photos', f))) missing.push(f);
    const pb = lang === 'en' ? '../photos/' : '../../photos/';
    const thumbs = photos.map((p, i) =>
      `        <button type="button" class="ugal__thumb${i ? '' : ' is-active'}" data-i="${i}"><img src="${pb}t/${p}.webp" alt="" width="160" height="120"${i > 2 ? ' loading="lazy"' : ''}></button>`).join('\n');
    const ls = USC_LOTS.filter((l) => l.q === q);
    const min = ls.length ? Math.min(...ls.map((l) => l.price)) : 0;
    const name = `${cx.code} ${cx.name}`;
    const title = lang === 'ru' ? `${name}: свободные виллы` : `${name}: available villas`;
    const desc = lang === 'ru'
      ? `${name} (${cx.where.ru}), ${cx.status.ru}. Свободные виллы с ценами, наличие обновляется каждый час. Покупка напрямую у девелопера UNIT.`
      : `${name} (${cx.where.en}), ${cx.status.en}. Available villas with prices, updated every hour. Direct from the developer, UNIT.SPACE.`;
    const url = `${BASE}${lang === 'ru' ? 'ru/' : ''}complexes/${q}.html`;
    const og = `https://turbo1507.github.io/unit-space-city-preview/v2/photos/${photos[0]}.jpg`;
    const alt = esc(`${name} — ${lang === 'ru' ? 'экстерьер' : 'exterior'}`);
    let h = src;
    h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'ApartmentComplex', name, description: desc, image: og, url, numberOfAccommodationUnits: cx.units, address: { '@type': 'PostalAddress', streetAddress: 'Jl Pantai Nyanyi 88', addressLocality: 'Beraban, Tabanan', addressRegion: 'Bali', addressCountry: 'ID' } })}</script>`);
    h = h.replace('<meta property="og:type" content="product">', '<meta property="og:type" content="website">');
    h = h.replace('data-unit="{{SLUG}}"', `data-cx="${q}"`);
    h = h.replace('<a href="../index.html#plans" class="crumb">', '<a href="../index.html#overview" class="crumb">').replace('data-i18n="unit.back">Все форматы вилл', `data-i18n="cxp.back">${dict['cxp.back']}`);
    h = h.replace(/<h1>[\s\S]*?<\/h1>\s*<p class="t-lead">[\s\S]*?<\/p>/,
      () => `<h1><b>${cx.code}</b> ${cx.name}</h1>\n        <p class="t-lead"><span data-cx-field="status">${cx.status.ru}</span>, <span data-cx-field="where">${cx.where.ru}</span></p>`);
    h = h.replace('<span class="unit-price" data-unit-field="price">{{PRICE}}</span>', `<span class="unit-price" data-cx-field="price">${min ? money(min, 'ru') : ''}</span>`);
    // «О формате» + планировка → «Свободные виллы» (главное на странице) и «О комплексе»; калькулятор — у формата, здесь не нужен
    h = cut(h, '<div class="rows" style="margin-top:var(--sy)">', '<div class="avail__grid" aria-live="polite"></div>\n    </div>', `<div class="avail" id="avail" style="margin-top:var(--sy)">
      <h3 class="t-h3" data-i18n="cxp.avail_title">${dict['cxp.avail_title']}</h3>
      <p class="t-lead" style="margin-top:var(--s2)" data-i18n="cxp.avail_lead">${dict['cxp.avail_lead']}</p>
      <div class="avail__grid" aria-live="polite"></div>
    </div>

    <div style="margin-top:var(--sy)">
      <h3 class="t-h3" data-i18n="cxp.about">${dict['cxp.about']}</h3>
      <p class="t-lead" style="margin-top:var(--s2);max-width:80ch" data-i18n="${q}.intro">${dict[q + '.intro']}</p>
      <div class="card" style="margin-top:var(--s3);max-width:720px">
        <div class="leaders">
          <div><span class="lbl"><svg class="ic" aria-hidden="true"><use href="#i-circle-check"/></svg><span data-i18n="unit.status">Статус</span></span><b data-cx-field="status">${cx.status.ru}</b></div>
          <div><span class="lbl"><svg class="ic" aria-hidden="true"><use href="#i-map-pin"/></svg><span data-i18n="ov.f_ho">Сдача</span></span><b>${cx.ho.ru}</b></div>
          <div><span class="lbl"><svg class="ic" aria-hidden="true"><use href="#i-layers-2"/></svg><span data-i18n="ov.f_units">Юнитов</span></span><b class="tnum">${cx.units}</b></div>
          <div><span class="lbl"><svg class="ic" aria-hidden="true"><use href="#i-layout-grid"/></svg><span data-i18n="ov.f_fmts">Форматы</span></span><b data-i18n="ov.${q}_f">${dict['ov.' + q + '_f']}</b></div>
          <div><span class="lbl"><svg class="ic" aria-hidden="true"><use href="#i-layout-grid"/></svg><span data-i18n="ov.f_area">Площади</span></span><b class="tnum" data-i18n="ov.${q}_a">${dict['ov.' + q + '_a']}</b></div>
        </div>
      </div>
    </div>`);
    h = cut(h, '<div class="rv" style="margin-top:var(--sy)">\n      <h3 class="t-h3" data-i18n="unit.yield_title">', '        <p class="calc__note t-small dim" data-i18n="calc.note">', '');
    const tail = /Без учёта налогов[^\n]*<\/p>\n      <\/div>\n    <\/div>\n/;
    if (!tail.test(h)) throw new Error('хвост калькулятора не найден');
    h = h.replace(tail, () => '');
    h = h.replace('data-i18n="unit.cta">Спросить про эту виллу', `data-i18n="cxp.cta">${dict['cxp.cta']}`);
    h = h.replace('<input type="hidden" name="unit" value="{{SLUG}}">', `<input type="hidden" name="unit" value="cx-${q}">`);
    h = h.replace(/data-i18n="unit\.more">[^<]*/, `data-i18n="cxp.fmts">${dict['cxp.fmts']}`).replace(' data-exclude="{{SLUG}}"', '');
    h = h.replaceAll('{{TITLE}}', esc(title)).replaceAll('{{DESC}}', esc(desc)).replaceAll('{{URL}}', url).replaceAll('{{OGIMG}}', og)
      .replaceAll('{{OGLOCALE}}', lang === 'en' ? 'en_US' : 'ru_RU')
      .replaceAll('{{THUMBS}}', thumbs).replaceAll('{{PHOTOS}}', photos.join(',')).replaceAll('{{PB}}', pb).replaceAll('{{P0}}', photos[0]).replaceAll('{{ALT}}', alt)
      .replaceAll('{{RENDER_NOTE}}', q === 'u3' ? `<p class="t-small dim" style="margin-top:var(--s2)" data-i18n="unit.render_note">${dict['unit.render_note']}</p>` : '');
    const left = h.match(/\{\{[A-Z0-9_]+\}\}/g);
    if (left) throw new Error(`${q}: не заполнено ${[...new Set(left)].join(' ')}`);
    if (lang === 'en') {
      h = translateAttrs(applyDict(h, I18N.en));
      h = h.replace(/<button type="button" data-lang="ru" class="is-active">RU<\/button><span>\/<\/span><button type="button" data-lang="en">EN<\/button>/g,
        '<button type="button" data-lang="ru">RU</button><span>/</span><button type="button" data-lang="en" class="is-active">EN</button>');
      h = h.replace(`data-cx-field="status">${cx.status.ru}`, `data-cx-field="status">${cx.status.en}`).replaceAll(`data-cx-field="status">${cx.status.ru}`, `data-cx-field="status">${cx.status.en}`)
        .replace(`data-cx-field="where">${cx.where.ru}`, `data-cx-field="where">${cx.where.en}`).replace(`<b>${cx.ho.ru}</b>`, `<b>${cx.ho.en}</b>`)
        .replace(`data-cx-field="price">${min ? money(min, 'ru') : ''}`, `data-cx-field="price">${min ? money(min, 'en') : ''}`);
    } else {
      h = h.replace('data-assets="../photos/"', 'data-assets="../../photos/"');
      h = h.replaceAll('href="../assets/', 'href="../../assets/').replaceAll('src="../assets/', 'src="../../assets/');
    }
    h = h.replaceAll('href="privacy.html"', 'href="../privacy.html"');
    h = h.replace('<html lang="ru"', `<html lang="${lang}"`);
    h = h.replace('<link rel="stylesheet"', langHead(lang, `complexes/${q}.html`) + '\n<link rel="stylesheet"');
    fs.writeFileSync(path.join(outDir, `${q}.html`), stamp(h));
  }
  console.log('ok', lang, '3 complex pages');
}
if (missing.length) { console.error('MISSING PHOTOS:', [...new Set(missing)].join(', ')); process.exit(1); }
