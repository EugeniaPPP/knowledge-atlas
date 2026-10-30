import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../../dist/', import.meta.url));
const origin = 'https://eugeniappp.github.io';
const base = '/knowledge-atlas/';
function filesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

test('all generated page links, island scripts, styles and fonts resolve under the GitHub Pages base', () => {
  assert.ok(existsSync(join(dist, 'index.html')), 'Run npm run build before npm run test:dist');
  const files = filesIn(dist);
  const pages = files.filter((path) => path.endsWith('.html'));
  assert.ok(pages.length > 0);
  let checked = 0;
  function checkUrl(value: string, documentUrl: string) {
    const url = new URL(value, documentUrl);
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) return;
    assert.ok(url.pathname.startsWith(base), `Missing deployment base: ${value} in ${documentUrl}`);
    const path = join(dist, decodeURIComponent(url.pathname.slice(base.length)));
    const target = url.pathname.endsWith('/') ? join(path, 'index.html') : path;
    assert.ok(existsSync(target), `Missing built target: ${value} in ${documentUrl}`);
    checked++;
  }
  for (const file of [...pages, ...files.filter((path) => path.endsWith('.css'))]) {
    const localPath = relative(dist, file).split('\\').join('/');
    const documentPath = localPath === 'index.html' ? '' : localPath.replace(/\/index\.html$/, '/');
    const documentUrl = `${origin}${base}${documentPath}`;
    const source = readFileSync(file, 'utf8');
    const attributes = file.endsWith('.html') ? /\b(?:href|src|component-url|renderer-url)=["']([^"'<>]+)["']/g : /url\(\s*["']?([^\s"')]+)["']?\s*\)/g;
    for (const match of source.matchAll(attributes)) checkUrl(match[1].replace(/&amp;/g, '&'), documentUrl);
  }
  assert.ok(checked > pages.length, 'Expected page and asset references to be checked');
  assert.ok(!files.some((path) => /(?:^|\/)(?:references|authoring)\//.test(relative(dist, path)) || path.endsWith('.pdf')), 'Source materials must not be deployed');
});
