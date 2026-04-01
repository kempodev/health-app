'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { UnitType } from '@/app/types';
import type { WorkoutLogWithExercises } from '../types';
import {
  updateLogExerciseSet,
  addLogExerciseSet,
  removeLogExerciseSet,
  completeWorkoutLog,
  updateWorkoutLogNotes,
} from '../actions';
import LogExerciseRow from './LogExerciseRow';

type WorkoutLogFormProps = {
  log: WorkoutLogWithExercises;
  weightUnit: UnitType;
  restSecondsMap: Record<string, number>;
};

export default function WorkoutLogForm({
  log,
  weightUnit,
  restSecondsMap,
}: WorkoutLogFormProps) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [notes, setNotes] = React.useState(log.notes);

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
    return Array.from(groups.values()).sort((a, b) => a.position - b.position);
  }, [log]);

  const handleUpdateSet = async (
    id: string,
    reps: number,
    weight: number | null,
    completed: boolean,
  ) => {
    const result = await updateLogExerciseSet(
      id,
      reps,
      weight,
      weightUnit,
      completed,
    );
    if (!result.success) toast.error(result.error);
  };

  const handleRemoveSet = async (id: string) => {
    const result = await removeLogExerciseSet(id, log.id);
    if (!result.success) toast.error(result.error);
  };

  const handleAddSet = async (exerciseId: string, position: number) => {
    const lastSet = log.exercises
      .filter((e) => e.exercise_id === exerciseId && e.position === position)
      .sort((a, b) => b.set_number - a.set_number)[0];

    const result = await addLogExerciseSet(
      log.id,
      exerciseId,
      position,
      lastSet?.reps ?? 10,
      lastSet?.weight_kg !== null && lastSet?.weight_kg !== undefined
        ? lastSet.weight_kg
        : null,
      'kg', // stored in kg already
    );
    if (!result.success) toast.error(result.error);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    if (notes !== log.notes) {
      await updateWorkoutLogNotes(log.id, notes);
    }
    const result = await completeWorkoutLog(log.id);
    setIsCompleting(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success('Workout completed!');
      router.push('/workout-logs');
    }
  };

  const handleNotesBlur = async () => {
    if (notes !== log.notes) {
      await updateWorkoutLogNotes(log.id, notes);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold'>{log.name}</h2>
          <p className='text-sm text-muted-foreground'>
            Started {new Date(log.started_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className='space-y-3'>
        {exerciseGroups.map((group) => (
          <LogExerciseRow
            key={`${group.position}-${group.exerciseId}`}
            exerciseId={group.exerciseId}
            position={group.position}
            sets={group.sets}
            weightUnit={weightUnit}
            restSeconds={restSecondsMap[group.exerciseId] ?? 0}
            onUpdateSet={handleUpdateSet}
            onRemoveSet={handleRemoveSet}
            onAddSet={handleAddSet}
          />
        ))}
      </div>

      <div>
        <Label htmlFor='notes' className='mb-2'>
          Notes
        </Label>
        <Textarea
          id='notes'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder='How did it go?'
          rows={2}
        />
      </div>

      <Button
        onClick={handleComplete}
        disabled={isCompleting}
        className='w-full'
        size='lg'
      >
        {isCompleting ? 'Completing...' : 'Complete Workout'}
      </Button>
    </div>
  );
}

