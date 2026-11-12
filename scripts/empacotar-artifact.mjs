// Gera dist-artifact/index.html (página única) + img/ a partir do build com VITE_ARTIFACT=1.
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8');
const css = [...html.matchAll(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/g)].map((m) => readFileSync('dist/' + m[1], 'utf8')).join('\n');
const js = html.match(/<script type="module"[^>]*src="\.\/(assets\/[^"]+\.js)"/)[1];
const code = readFileSync('dist/' + js, 'utf8').replace(/<\/script/gi, '<\\/script');
const tema = html.match(/<script>\s*try[\s\S]*?<\/script>/)[0];
const fontes = html.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis[^>]*>/)[0];
const out = `<title>Gabarito Concursos</title>
<meta name="claude:viewport-fit-sides" content="cover">
${fontes}
<style>${css}</style>
${tema}
<div id="root"></div>
<script type="module">${code}</script>
`;
mkdirSync('dist-artifact', { recursive: true });
writeFileSync('dist-artifact/index.html', out);
cpSync('dist/img', 'dist-artifact/img', { recursive: true });
console.log('ok', (out.length / 1024).toFixed(0) + ' KB', readdirSync('dist-artifact/img/pcpr-2026'));
