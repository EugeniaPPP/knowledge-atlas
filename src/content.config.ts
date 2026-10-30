import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';
import { chapterSchema, courseSchema, modeSchema } from './lib/content/schema';

const chapters = defineCollection({
  loader: glob({ pattern: '**/chapter.json', base: './src/content/chapters' }),
  schema: chapterSchema,
});
const lessons = defineCollection({
  loader: glob({ pattern: '**/{quick,core,mastery}.mdx', base: './src/content/chapters' }),
  schema: z.object({ chapterId: z.string(), mode: modeSchema }),
});
// Ancillary text is available to all modes without generating a learning route.
const sourceNotes = defineCollection({
  loader: glob({ pattern: '**/source-notes.mdx', base: './src/content/chapters' }),
  schema: z.object({ chapterId: z.string() }),
});
const concepts = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/concepts' }),
  schema: z.object({ id: z.string(), title: z.string(), definition: z.string(),
    prerequisites: z.array(z.string()), related: z.array(z.string()), stepId: z.string() }),
});
const courses = defineCollection({ loader: glob({ pattern: '*.json', base: './src/content/courses' }), schema: courseSchema });
export const collections = { chapters, lessons, sourceNotes, concepts, courses };
