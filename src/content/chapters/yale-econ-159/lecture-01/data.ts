import rawChapter from "./chapter.json";
import rawModels from "./models.json";
import rawExercises from "./exercises.json";
import rawInteractions from './interaction-content.json';
import { chapterSchema, modelsSchema, exercisesSchema, interactionContentSchema, type LearningConfig } from "../../../../lib/content/schema";

export const chapter = chapterSchema.parse(rawChapter);
export const models = modelsSchema.parse(rawModels);
export const exercises = exercisesSchema.parse(rawExercises);
const interactions = interactionContentSchema.parse(rawInteractions);
export const activityContent = interactions.activities;
export const writtenExercise = interactions.written;
export const quickAnswer = interactions.quickAnswer;
export const config: LearningConfig = { chapterId: chapter.id, contentVersion: chapter.contentVersion, stepIds: chapter.steps.map((s) => s.id) };
