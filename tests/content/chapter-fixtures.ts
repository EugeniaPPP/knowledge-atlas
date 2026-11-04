import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chapterSchema, type Chapter } from '../../src/lib/content/schema';
function chaptersIn(directory: string): Chapter[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? chaptersIn(join(directory, entry.name)) : entry.name === 'chapter.json' ? [chapterSchema.parse(JSON.parse(readFileSync(join(directory, entry.name), 'utf8')))] : []);
}
export const allChapters = chaptersIn(fileURLToPath(new URL('../../src/content/chapters/', import.meta.url)));
