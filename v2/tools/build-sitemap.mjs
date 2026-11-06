// sitemap.xml с hreflang-альтернативами всех языков (seo-hreflang, метод 3). Запуск: node tools/build-sitemap.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { BASE, LANGS, pre } from './i18n-static.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/units.js'), 'utf8'), ctx);
const rel = ['', 'privacy.html', ...ctx.window.USC_UNITS.map(u => 'units/' + u.slug + '.html')]; // из данных, не из листинга папки
const today = new Date().toISOString().slice(0, 10);
const entry = (r, lang) => `  <url>
    <loc>${BASE}${pre(lang)}${r}</loc>
    <lastmod>${today}</lastmod>
${LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE}${pre(l)}${r}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}${r}"/>
  </url>`;
const urls = rel.flatMap(r => LANGS.map((l) => entry(r, l)));
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
console.log('ok sitemap.xml', urls.length, 'urls');
