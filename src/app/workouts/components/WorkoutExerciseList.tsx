'use client';

import type { UnitType } from '@/app/types';
import type { WorkoutExerciseWithDetails } from '../types';
import WorkoutExerciseRow from './WorkoutExerciseRow';

type WorkoutExerciseListProps = {
  exercises: WorkoutExerciseWithDetails[];
  weightUnit: UnitType;
  onUpdate: (
    id: string,
    sets: number,
    reps: number,
    weight: number | null,
    restSeconds: number
  ) => void;
  onRemove: (id: string) => void;
  onReorder: (exerciseIds: string[]) => void;
};

export default function WorkoutExerciseList({
  exercises,
  weightUnit,
  onUpdate,
  onRemove,
  onReorder,
}: WorkoutExerciseListProps) {
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const ids = exercises.map((e) => e.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    onReorder(ids);
  };

  const handleMoveDown = (index: number) => {
    if (index === exercises.length - 1) return;
    const ids = exercises.map((e) => e.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    onReorder(ids);
  };

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No exercises added yet. Click &quot;Add Exercise&quot; to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {exercises.map((exercise, index) => (
        <WorkoutExerciseRow
          key={exercise.id}
          exercise={exercise}
          weightUnit={weightUnit}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onMoveUp={() => handleMoveUp(index)}
          onMoveDown={() => handleMoveDown(index)}
          isFirst={index === 0}
          isLast={index === exercises.length - 1}
        />
      ))}
    </div>
  );
}
