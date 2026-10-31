import type { LearningConfig, AssessmentTask } from '../lib/content/schema';
import { getStore } from '../lib/learning/store';
import { taskChecked } from '../lib/learning/assessment';
const reader = document.querySelector('[data-learning-config]');
if (reader) {
  const store = getStore(JSON.parse(reader.textContent!) as LearningConfig);
  const cards = [...document.querySelectorAll<HTMLElement>('[data-assessment-parts]')].map((card) => ({ card, task: JSON.parse(card.dataset.assessmentParts!) as AssessmentTask }));
  const render = () => {
    const { state } = store.getSnapshot();
    for (const { card, task } of cards) {
      const checked = taskChecked(task, state);
      const solution = card.querySelector<HTMLDetailsElement>('[data-task-solution]');
      if (solution) { solution.hidden = !checked; solution.open = checked; }
      card.dataset.checked = String(checked);
    }
  };
  store.subscribe(render); store.load(); render();
}
