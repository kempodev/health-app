'use client';

import * as React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getExerciseById, getExerciseImageUrl } from '@/lib/exercises';
import { convertFromBaseUnit } from '@/lib/utils';
import type { UnitType } from '@/app/types';
import type { WorkoutLogWithExercises } from '../types';

type WorkoutLogDetailProps = {
  log: WorkoutLogWithExercises;
  weightUnit: UnitType;
};

export default function WorkoutLogDetail({
  log,
  weightUnit,
}: WorkoutLogDetailProps) {
  // Group exercises by position
  const exerciseGroups = React.useMemo(() => {
    const groups: Map<
      string,
      { exerciseId: string; position: number; sets: typeof log.exercises }
    > = new Map();
    for (const ex of log.exercises) {
      const key = `${ex.position}-${ex.exercise_id}`;
      if (!groups.has(key)) {
        groups.set(key, {
          exerciseId: ex.exercise_id,
          position: ex.position,
          sets: [],
        });
      }
      groups.get(key)!.sets.push(ex);
    }
    return Array.from(groups.values());
  }, [log]);

  const duration =
    log.completed_at && log.started_at
      ? Math.round(
          (new Date(log.completed_at).getTime() -
            new Date(log.started_at).getTime()) /
            60000
        )
      : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{log.name}</h2>
        <p className="text-sm text-muted-foreground">
          {new Date(log.started_at).toLocaleDateString()}{' '}
          {duration !== null && `- ${duration} min`}
        </p>
      </div>

      {log.notes && (
        <p className="text-sm bg-accent/50 rounded-md p-3">{log.notes}</p>
      )}

      <Separator />

      <div className="space-y-4">
        {exerciseGroups.map((group) => {
          const exercise = getExerciseById(group.exerciseId);
          const note =
            group.sets.find((s) => s.set_number === 1)?.notes?.trim() ?? '';
          return (
            <div key={`${group.position}-${group.exerciseId}`} className="space-y-2">
              <div className="flex items-center gap-2">
                {exercise?.images[0] && (
                  <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={getExerciseImageUrl(exercise.images[0])}
                      alt={exercise.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                )}
                <p className="font-medium text-sm">
                  {exercise?.name ?? group.exerciseId}
                </p>
              </div>
              {note && (
                <p className="ml-10 text-sm italic text-muted-foreground whitespace-pre-wrap">
                  {note}
                </p>
              )}
              <div className="ml-10 space-y-1">
                {group.sets.map((set) => (
                  <div
                    key={set.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="text-muted-foreground w-12">
                      Set {set.set_number}
                    </span>
                    <span>{set.reps} reps</span>
                    {set.weight_kg !== null && (
                      <span>
                        {convertFromBaseUnit(set.weight_kg, weightUnit, 'weight')}{' '}
                        {weightUnit}
                      </span>
                    )}
                    {set.completed ? (
                      <Badge variant="default" className="text-xs">Done</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Skipped</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
