// sitemap.xml с hreflang-альтернативами (seo-hreflang, метод 3) — все 24 страницы RU+EN. Запуск: node tools/build-sitemap.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE } from './i18n-static.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = ['', 'privacy.html', ...fs.readdirSync(path.join(root, 'units')).map(f => 'units/' + f)];
const today = new Date().toISOString().slice(0, 10);
const entry = (loc, ru, en) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="ru" href="${ru}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ru}"/>
  </url>`;
const urls = rel.flatMap(r => { const ru = BASE + r, en = BASE + 'en/' + r; return [entry(ru, ru, en), entry(en, ru, en)]; });
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
console.log('ok sitemap.xml', urls.length, 'urls');
