import { Workout } from '@/types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function totalVolume(weight: number, reps: number): number {
  return weight * reps;
}

export function workoutsToMarkdown(workouts: Workout[]): string {
  if (workouts.length === 0) return '# Workout History\n\nNo workouts recorded.\n';

  const sorted = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lines: string[] = [
    '# Workout History',
    '',
    `**Exported:** ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    `**Workouts:** ${workouts.length}`,
    '',
    '---',
    '',
  ];

  for (const workout of sorted) {
    const date = new Date(workout.date);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const duration = workout.durationMs
      ? `${Math.round(workout.durationMs / 60000)} min`
      : null;

    lines.push(`## ${dateStr}`);
    if (duration) lines.push(`*Duration: ${duration}*`);
    lines.push('');

    for (const ex of workout.exercises) {
      lines.push(`### ${ex.name}`);
      if (ex.bodyweight) lines.push('*(bodyweight)*');

      const setLines = ex.sets.map((set, i) => {
        if (ex.bodyweight) return `- Set ${i + 1}: ${set.reps} reps`;
        return `- Set ${i + 1}: ${set.weight} kg × ${set.reps} reps`;
      });
      lines.push(...setLines);

      const vol = ex.bodyweight
        ? null
        : ex.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
      if (vol) lines.push(`*Volume: ${vol} kg*`);
      if (ex.notes) lines.push(`*Notes: ${ex.notes}*`);
      lines.push('');
    }

    lines.push('---', '');
  }

  return lines.join('\n');
}
