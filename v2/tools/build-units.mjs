// Генерирует v2/units/<slug>.html из tools/unit-template.html + assets/units.js.
// Запуск: node tools/build-units.mjs (из папки v2). Проверяет, что все фото есть на диске.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const assetsDir = path.resolve(root, '../prototype-2026-09/assets');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/units.js'), 'utf8'), ctx);
const { USC_UNITS, USC_COMPLEX, USC_PRICE, USC_FMT } = ctx.window;
const tpl = fs.readFileSync(path.join(here, 'unit-template.html'), 'utf8');

const PLANS = {
  studio: '<svg viewBox="0 0 120 96" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="10" y="14" width="100" height="68" rx="3"/><path d="M62 14v68M62 48h48"/></svg>',
  '1bd': '<svg viewBox="0 0 120 96" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="10" y="14" width="100" height="68" rx="3"/><path d="M55 14v68M10 48h45M55 40h55"/></svg>',
  '2bd': '<svg viewBox="0 0 120 96" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="10" y="14" width="100" height="68" rx="3"/><path d="M48 14v68M10 40h38M48 34h30M78 14v68M78 54h32"/></svg>',
  villa: '<svg viewBox="0 0 120 96" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="10" y="10" width="100" height="52" rx="3"/><rect x="30" y="70" width="60" height="16" rx="3"/><path d="M50 10v52M50 36h60"/></svg>'
};
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const outDir = path.join(root, 'units');
fs.mkdirSync(outDir, { recursive: true });
let missing = [];
for (const u of USC_UNITS) {
  const cx = USC_COMPLEX[u.q];
  for (const p of u.photos) for (const ext of ['jpg', 'webp']) if (!fs.existsSync(path.join(assetsDir, `${p}.${ext}`))) missing.push(`${p}.${ext}`);
  const gallery = u.photos.slice(0, 3).map((p, i) =>
    `      <figure><picture><source srcset="../../prototype-2026-09/assets/${p}.webp" type="image/webp"><img src="../../prototype-2026-09/assets/${p}.jpg" alt="${esc(cx.code + ' — ' + u.name.ru)}" width="960" height="720"${i ? ' loading="lazy"' : ''}></picture></figure>`).join('\n');
  const title = `${u.name.ru} ${u.area} м², ${cx.code} ${cx.name}`;
  const desc = `${u.name.ru} ${u.area} м² в ${cx.code} ${cx.name} (${cx.where.ru}), ${cx.status.ru}. ${USC_PRICE.ru[u.fmt]}. Покупка напрямую у девелопера UNIT.`;
  const html = tpl
    .replace('<p data-unit-field="desc">{{DESC}}</p>', `<p data-unit-field="desc">${USC_FMT[u.fmt].desc.ru}</p>`)
    .replaceAll('{{SLUG}}', u.slug).replaceAll('{{TITLE}}', esc(title)).replaceAll('{{DESC}}', esc(desc))
    .replaceAll('{{NAME}}', u.name.ru).replaceAll('{{AREA}}', String(u.area)).replaceAll('{{CODE}}', cx.code).replaceAll('{{CXNAME}}', cx.name)
    .replaceAll('{{FLOOR}}', u.floor.ru).replaceAll('{{PRICE}}', USC_PRICE.ru[u.fmt]).replaceAll('{{WHERE}}', cx.where.ru).replaceAll('{{STATUS}}', cx.status.ru)
    .replaceAll('{{GALLERY}}', gallery).replaceAll('{{GALLERY_MOD}}', u.photos.length < 3 ? ' unit-gallery--2' : '')
    .replaceAll('{{RENDER_NOTE}}', u.render ? '<p class="t-small dim" style="margin-top:var(--s2)" data-i18n="unit.render_note">U3 строится — это рендеры, не&nbsp;фото.</p>' : '')
    .replaceAll('{{PLAN}}', '<div class="ph ph--plan" aria-hidden="true"></div>');
  fs.writeFileSync(path.join(outDir, `${u.slug}.html`), html);
  console.log('ok', u.slug);
}
if (missing.length) { console.error('MISSING PHOTOS:', missing.join(', ')); process.exit(1); }
