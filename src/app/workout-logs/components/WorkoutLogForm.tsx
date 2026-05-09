'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { UnitType } from '@/app/types';
import type { WorkoutLogExercise, WorkoutLogWithExercises } from '../types';
import {
  updateLogExerciseSet,
  addLogExerciseSet,
  removeLogExerciseSet,
  completeWorkoutLog,
  updateWorkoutLogNotes,
} from '../actions';
import LogExerciseRow from './LogExerciseRow';
import RestTimer from './RestTimer';

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
  const [optimisticExercises, setOptimisticExercises] = React.useState(
    log.exercises,
  );
  const [restTimerSeconds, setRestTimerSeconds] = React.useState<number | null>(
    null,
  );
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);
  const [wakeLock, setWakeLock] = React.useState<WakeLockSentinel | null>(null);
  const [wakeLockSupported, setWakeLockSupported] = React.useState(false);

  React.useEffect(() => {
    const supported = 'wakeLock' in navigator;
    setWakeLockSupported(supported);

    if (supported && localStorage.getItem('wakeLockEnabled') === 'true') {
      navigator.wakeLock
        .request('screen')
        .then((lock) => setWakeLock(lock))
        .catch(() => {});
    }
  }, []);

  // Release wake lock on unmount
  React.useEffect(() => {
    return () => {
      wakeLock?.release();
    };
  }, [wakeLock]);

  // Re-acquire wake lock when page becomes visible again (browser releases it on tab switch)
  React.useEffect(() => {
    if (!wakeLock) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && wakeLock.released) {
        try {
          const newLock = await navigator.wakeLock.request('screen');
          setWakeLock(newLock);
        } catch {
          // Silently fail
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [wakeLock]);

  const toggleWakeLock = async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
      localStorage.setItem('wakeLockEnabled', 'false');
      toast.success('Screen lock disabled');
    } else {
      try {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        localStorage.setItem('wakeLockEnabled', 'true');
        toast.success('Screen will stay on');
      } catch {
        toast.error('Could not keep screen on');
      }
    }
  };

  // Sync with server data when it updates
  React.useEffect(() => {
    setOptimisticExercises(log.exercises);
  }, [log.exercises]);

  // Group exercises by position
  const exerciseGroups = React.useMemo(() => {
    const groups: Map<
      string,
      { exerciseId: string; position: number; sets: WorkoutLogExercise[] }
    > = new Map();
    for (const ex of optimisticExercises) {
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
  }, [optimisticExercises]);

  // Auto-expand first exercise with uncompleted sets
  const autoExpandKey = React.useMemo(() => {
    for (const group of exerciseGroups) {
      if (group.sets.some((s) => !s.completed)) {
        return `${group.position}-${group.exerciseId}`;
      }
    }
    return null;
  }, [exerciseGroups]);

  // expandedKey: null = use auto, 'none' = all collapsed, string = specific exercise
  const activeKey = React.useMemo(() => {
    if (expandedKey === 'none') return null;
    if (expandedKey) return expandedKey;
    return autoExpandKey;
  }, [expandedKey, autoExpandKey]);

  const handleUpdateSet = async (
    id: string,
    reps: number,
    weight: number | null,
    completed: boolean,
  ) => {
    // Optimistically update the set
    setOptimisticExercises((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, reps, weight_kg: weight, completed } : e,
      ),
    );

    // Start rest timer when checking a set as done
    if (completed) {
      const set = optimisticExercises.find((e) => e.id === id);
      if (set) {
        const rest = restSecondsMap[set.exercise_id] ?? 0;
        if (rest > 0) setRestTimerSeconds(rest);

        // Check if all sets for this exercise are now completed
        const siblingsSets = optimisticExercises.filter(
          (e) =>
            e.exercise_id === set.exercise_id && e.position === set.position,
        );
        const allDone = siblingsSets.every((s) =>
          s.id === id ? true : s.completed,
        );
        if (allDone) {
          // Reset to auto-expand so the next exercise opens
          setExpandedKey(null);
        }
      }
    }

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
    // Optimistically remove
    setOptimisticExercises((prev) => prev.filter((e) => e.id !== id));

    const result = await removeLogExerciseSet(id, log.id);
    if (!result.success) {
      toast.error(result.error);
      // Revert on failure
      setOptimisticExercises(log.exercises);
    }
  };

  const handleAddSet = async (exerciseId: string, position: number) => {
    const setsForExercise = optimisticExercises
      .filter((e) => e.exercise_id === exerciseId && e.position === position)
      .sort((a, b) => b.set_number - a.set_number);
    const lastSet = setsForExercise[0];
    const nextSetNumber = lastSet ? lastSet.set_number + 1 : 1;

    const reps = lastSet?.reps ?? 10;
    const weightKg =
      lastSet?.weight_kg !== null && lastSet?.weight_kg !== undefined
        ? lastSet.weight_kg
        : null;

    // Optimistically add
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticSet: WorkoutLogExercise = {
      id: optimisticId,
      workout_log_id: log.id,
      exercise_id: exerciseId,
      position,
      set_number: nextSetNumber,
      reps,
      weight_kg: weightKg,
      completed: false,
      created_at: new Date().toISOString(),
    };
    setOptimisticExercises((prev) => [...prev, optimisticSet]);

    const result = await addLogExerciseSet(
      log.id,
      exerciseId,
      position,
      reps,
      weightKg,
      'kg', // stored in kg already
    );
    if (!result.success) {
      toast.error(result.error);
      // Revert on failure
      setOptimisticExercises((prev) =>
        prev.filter((e) => e.id !== optimisticId),
      );
    }
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
    <>
      {restTimerSeconds !== null && (
        <RestTimer
          seconds={restTimerSeconds}
          onDone={() => setRestTimerSeconds(null)}
        />
      )}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-bold'>{log.name}</h2>
            <p className='text-sm text-muted-foreground'>
              Started {new Date(log.started_at).toLocaleString()}
            </p>
          </div>
        </div>

        {wakeLockSupported && (
          <div className='flex items-center justify-between rounded-lg border p-3'>
            <Label htmlFor='wake-lock' className='text-sm'>
              Keep screen on
            </Label>
            <Switch
              id='wake-lock'
              checked={!!wakeLock}
              onCheckedChange={toggleWakeLock}
            />
          </div>
        )}

        <div className='space-y-3'>
          {exerciseGroups.map((group) => {
            const key = `${group.position}-${group.exerciseId}`;
            return (
              <LogExerciseRow
                key={key}
                exerciseId={group.exerciseId}
                position={group.position}
                sets={group.sets}
                weightUnit={weightUnit}
                restSeconds={restSecondsMap[group.exerciseId] ?? 0}
                expanded={activeKey === key}
                onToggle={() =>
                  setExpandedKey(activeKey === key ? 'none' : key)
                }
                onUpdateSet={handleUpdateSet}
                onRemoveSet={handleRemoveSet}
                onAddSet={handleAddSet}
              />
            );
          })}
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
    </>
  );
}
