import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inventory, reviewDigest } from '../../scripts/authoring-review.mjs';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'atlas-authoring-'));
  writeFileSync(join(root, 'source.txt'), 'Synthetic source, no lecture facts.');
  writeFileSync(join(root, 'core-ru.md'), 'Редакционный пробный текст.');
  writeFileSync(join(root, 'core-en.md'), 'Editorial test text.');
  const manifest = { schemaVersion: 1, lessonId: 'test-course/test-lesson', stage: 'bilingual', requiredLocales: ['ru', 'en'],
    inputFiles: ['source.txt'], outputFiles: ['core-ru.md', 'core-en.md'] };
  const save = () => writeFileSync(join(root, 'review.json'), JSON.stringify(manifest));
  save();
  return { root, manifest, save, clean: () => rmSync(root, { recursive: true, force: true }) };
}

test('inventory distinguishes missing, empty and present sources without claiming to have read them', () => {
  const f = fixture();
  try {
    assert.equal(inventory(f.root, 'missing').status, 'missing');
    mkdirSync(join(f.root, 'sources')); assert.equal(inventory(f.root, 'sources').status, 'empty');
    writeFileSync(join(f.root, 'sources', 'transcript.txt'), 'Synthetic input');
    const result = inventory(f.root, 'sources');
    assert.equal(result.status, 'present'); assert.equal(result.files.length, 1);
    assert.equal(result.files[0].readStatus, 'not-read'); assert.equal(result.files[0].publicationPolicy, 'unknown');
    assert.match(result.files[0].sha256, /^[a-f0-9]{64}$/);
  } finally { f.clean(); }
});
test('a review digest is stable but changes with either language, source bytes or stage', () => {
  const f = fixture();
  try {
    let previous = reviewDigest(f.root, 'review.json');
    assert.deepEqual(reviewDigest(f.root, 'review.json'), previous);
    assert.equal(previous.approval, 'not-granted');
    for (const path of ['core-ru.md', 'core-en.md', 'source.txt']) {
      writeFileSync(join(f.root, path), `Changed ${path}`);
      const next = reviewDigest(f.root, 'review.json');
      assert.notEqual(next.packageSha256, previous.packageSha256);
      if (path !== 'source.txt') assert.equal(next.inputSha256, previous.inputSha256);
      else assert.notEqual(next.inputSha256, previous.inputSha256);
      previous = next;
    }
    f.manifest.stage = 'integration'; f.save();
    assert.notEqual(reviewDigest(f.root, 'review.json').packageSha256, previous.packageSha256);
  } finally { f.clean(); }
});
test('review hashes reject omitted lists, missing files, duplicate files and self-reference', () => {
  const f = fixture();
  try {
    f.manifest.outputFiles = []; f.save(); assert.throws(() => reviewDigest(f.root, 'review.json'), /explicitly list/);
    f.manifest.outputFiles = ['missing.md']; f.save(); assert.throws(() => reviewDigest(f.root, 'review.json'));
    f.manifest.outputFiles = ['source.txt']; f.save(); assert.throws(() => reviewDigest(f.root, 'review.json'), /Duplicate/);
    f.manifest.outputFiles = ['review.json']; f.save(); assert.throws(() => reviewDigest(f.root, 'review.json'), /itself/);
  } finally { f.clean(); }
});
test('inventory and review paths cannot escape the workspace through traversal or symlinks', () => {
  const f = fixture(), outside = mkdtempSync(join(tmpdir(), 'atlas-outside-'));
  try {
    writeFileSync(join(outside, 'external.txt'), 'External');
    assert.throws(() => inventory(f.root, '../'), /leaves repository/);
    assert.throws(() => inventory(f.root, outside), /relative path/);
    symlinkSync(join(outside, 'external.txt'), join(f.root, 'external.txt'));
    f.manifest.outputFiles = ['external.txt']; f.save();
    assert.throws(() => reviewDigest(f.root, 'review.json'), /Symlink leaves/);
    assert.throws(() => inventory(f.root, '.'), /does not follow source symlinks/);
  } finally { f.clean(); rmSync(outside, { recursive: true, force: true }); }
});
