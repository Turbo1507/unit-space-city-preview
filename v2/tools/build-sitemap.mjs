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
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /tools/\n\nSitemap: ${BASE}sitemap.xml\n`);
// llms.txt: краткая карта сайта для ИИ-поисковиков, форматы и цены из собранных EN-страниц (обновляется с автосинком)
const meta = (f) => { const h = fs.readFileSync(path.join(root, f), 'utf8'); const g = (rx) => ((h.match(rx) || [])[1] || '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s*\|\s*UNIT\. SPACE CITY$/, ''); return { t: g(/<title>([^<]*)<\/title>/), d: g(/<meta name="description" content="([^"]*)"/) }; };
const home = meta('index.html');
const units = ctx.window.USC_UNITS.map((u) => ({ u, ...meta('units/' + u.slug + '.html') }));
const llms = `# UNIT. SPACE CITY

> ${home.d}

Three residential complexes on Jalan Pantai Nyanyi, Beraban, Tabanan, Bali, next to Nuanu Creative City and 3 minutes from Nyanyi beach: U1 Space Village (completed 2024), U2 Nuanu Village (completed 2026) and U3 Nyanyi Village (under construction). Developer: UNIT (https://unitdeveloper.com/). Prices are shown in IDR by default, the header has a currency switch. The site is available in ${LANGS.length} languages: ${LANGS.join(', ')}; English is at the root, other languages under /<code>/.

## Main pages
- [Home](${BASE}): complexes, formats and prices, amenities, location, FAQ and the request form
${LANGS.filter((l) => l !== 'en').map((l) => `- [Home, ${l}](${BASE}${pre(l)})`).join('\n')}

## Formats
${units.map((x) => `- [${x.t}](${BASE}units/${x.u.slug}.html): ${x.d}`).join('\n')}

## Other
- [Privacy policy](${BASE}privacy.html)
- [Sitemap](${BASE}sitemap.xml)
`;
fs.writeFileSync(path.join(root, 'llms.txt'), llms);
console.log('ok sitemap.xml', urls.length, 'urls');
