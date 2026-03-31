'use client';

import * as React from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getExerciseById, getExerciseImageUrl } from '@/lib/exercises';
import type { UnitType } from '@/app/types';
import type { WorkoutLogExercise } from '../types';
import LogSetRow from './LogSetRow';

type LogExerciseRowProps = {
  exerciseId: string;
  position: number;
  sets: WorkoutLogExercise[];
  weightUnit: UnitType;
  onUpdateSet: (
    id: string,
    reps: number,
    weight: number | null,
    completed: boolean
  ) => void;
  onRemoveSet: (id: string) => void;
  onAddSet: (exerciseId: string, position: number) => void;
};

export default function LogExerciseRow({
  exerciseId,
  position,
  sets,
  weightUnit,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
}: LogExerciseRowProps) {
  const exercise = getExerciseById(exerciseId);

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center gap-3">
        {exercise?.images[0] && (
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
            <Image
              src={getExerciseImageUrl(exercise.images[0])}
              alt={exercise.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {exercise?.name ?? exerciseId}
          </p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {exercise?.primaryMuscles.map((m) => (
              <Badge key={m} variant="secondary" className="text-xs">
                {m}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <span className="w-6 text-center">Set</span>
          <span className="w-16">Reps</span>
          <span className="w-20">Weight</span>
          <span>Done</span>
        </div>
        {sets.map((set) => (
          <LogSetRow
            key={set.id}
            set={set}
            weightUnit={weightUnit}
            onUpdate={onUpdateSet}
            onRemove={onRemoveSet}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={() => onAddSet(exerciseId, position)}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Set
      </Button>
    </div>
  );
}
