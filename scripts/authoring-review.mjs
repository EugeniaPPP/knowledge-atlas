/** Read-only source inventory and review digests; never grants editorial approval. */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const stages = ['blueprint', 'core-ru', 'modes-ru', 'bilingual', 'integration'];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
function contained(root, path, mustExist = true) {
  if (typeof path !== 'string' || !path || isAbsolute(path) || path.includes('\\')) throw new Error('Use a nonempty repository-relative path');
  const target = resolve(root, path), base = realpathSync(root);
  const outside = (p) => p === '..' || p.startsWith(`..${sep}`) || isAbsolute(p);
  if (outside(relative(resolve(root), target))) throw new Error(`Path leaves repository: ${path}`);
  try {
    if (outside(relative(base, realpathSync(target)))) throw new Error(`Symlink leaves repository: ${path}`);
  } catch (error) {
    if (mustExist || error.code !== 'ENOENT') throw error;
  }
  return target;
}
const portable = (root, path) => relative(resolve(root), path).split(sep).join('/');

export function inventory(root, directory) {
  const start = contained(root, directory, false), files = [];
  try { if (!statSync(start).isDirectory()) throw new Error('Inventory input must be a directory'); }
  catch (error) { if (error.code === 'ENOENT') return { directory, status: 'missing', files }; throw error; }
  function walk(folder) {
    for (const entry of readdirSync(folder, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      if (entry.name === '.DS_Store') continue;
      const path = resolve(folder, entry.name), rel = portable(root, path);
      if (entry.isSymbolicLink()) throw new Error(`Inventory does not follow source symlinks: ${rel}`);
      contained(root, rel);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) {
        const bytes = readFileSync(path);
        files.push({ path: rel, bytes: bytes.length, sha256: sha(bytes), readStatus: 'not-read', publicationPolicy: 'unknown' });
      }
    }
  }
  walk(start);
  return { directory, status: files.length ? 'present' : 'empty', files };
}

export function reviewDigest(root, manifestPath) {
  const fullPath = contained(root, manifestPath), raw = readFileSync(fullPath);
  const manifest = JSON.parse(raw);
  if (manifest.schemaVersion !== 1 || !/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(manifest.lessonId || '') || !stages.includes(manifest.stage) ||
      JSON.stringify(manifest.requiredLocales) !== JSON.stringify(['ru', 'en'])) throw new Error('Invalid review header; require lessonId, supported stage and requiredLocales [ru,en]');
  const seen = new Set(), groups = {};
  for (const group of ['inputFiles', 'outputFiles']) {
    if (!Array.isArray(manifest[group]) || !manifest[group].length) throw new Error(`${group} must explicitly list at least one file`);
    groups[group] = manifest[group].map((path) => {
      const target = contained(root, path), normalized = portable(root, target), identity = realpathSync(target);
      if (seen.has(identity)) throw new Error(`Duplicate review file: ${path}`);
      if (identity === realpathSync(fullPath)) throw new Error('Review manifest cannot hash itself');
      seen.add(identity);
      if (!statSync(target).isFile()) throw new Error(`Review entry must be a file: ${path}`);
      return { path: normalized, bytes: readFileSync(target) };
    }).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  }
  const inputs = createHash('sha256'), bundle = createHash('sha256');
  // Raw manifest binds lesson, stage, locales and the complete declared file list.
  inputs.update(raw).update('\0'); bundle.update(raw).update('\0');
  const files = [];
  for (const group of ['inputFiles', 'outputFiles']) for (const file of groups[group]) {
    const add = (hash) => hash.update(group).update('\0').update(file.path).update('\0').update(file.bytes).update('\0');
    if (group === 'inputFiles') add(inputs);
    add(bundle);
    files.push({ group, path: file.path, sha256: sha(file.bytes) });
  }
  return { schemaVersion: 1, lessonId: manifest.lessonId, stage: manifest.stage, requiredLocales: manifest.requiredLocales,
    manifestSha256: sha(raw), inputSha256: inputs.digest('hex'), packageSha256: bundle.digest('hex'), files,
    approval: 'not-granted', limitation: 'Hashes only declared files; does not check semantic quality, manifest completeness or human authorization.' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, path, ...extra] = process.argv.slice(2);
    if (!path || extra.length || !['inventory', 'digest'].includes(command)) throw new Error('Usage: node scripts/authoring-review.mjs inventory <source-directory> | digest <review-manifest.json>');
    const result = command === 'inventory' ? inventory(process.cwd(), path) : reviewDigest(process.cwd(), path);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (command === 'inventory' && result.status !== 'present') process.exitCode = 2;
  } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
