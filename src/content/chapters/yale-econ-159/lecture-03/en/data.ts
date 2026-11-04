import { chapter as originalChapter, models as originalModels, tasks as originalTasks, election as originalElection, config as originalConfig } from '../data';
import raw from './content.json';
import { spatialAssessmentTranslationSchema, translateChapter, translateModels, translateAssessmentTasks } from '../../../../../lib/content/translations';
import { validateElectionCopy } from '../../../../../lib/content/election';

export const translation = spatialAssessmentTranslationSchema.parse(raw);
export const chapter = translateChapter(originalChapter, translation);
export const models = translateModels(originalModels, translation);
export const tasks = translateAssessmentTasks(originalTasks, translation.exerciseCopy);
export const taskById = Object.fromEntries(tasks.map((task) => [task.id, task]));
validateElectionCopy(originalElection.content, translation.interactions.election);
export const election = { ...originalElection, content: translation.interactions.election };
export const config = { ...originalConfig, locale: 'en' as const };
