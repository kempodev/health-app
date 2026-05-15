'use client';

import { useEffect, useState } from 'react';
import { DAY_LABELS, DayOfWeek } from '@/app/types';
import type { ScheduleEntryWithWorkout } from '@/app/schedules/types';
import StartWorkoutButton from './StartWorkoutButton';

type Props = {
  entries: ScheduleEntryWithWorkout[];
};

export default function TodaysWorkoutsSection({ entries }: Props) {
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek | null>(null);

  useEffect(() => {
    const jsDay = new Date().getDay();
    setDayOfWeek((jsDay === 0 ? 6 : jsDay - 1) as DayOfWeek);
  }, []);

  if (dayOfWeek === null) {
    return <div className='h-9' aria-hidden />;
  }

  const todaysEntries = entries.filter((e) => e.day_of_week === dayOfWeek);
  const todaysWorkoutIds = new Set(todaysEntries.map((e) => e.workout_id));
  const otherEntries = entries
    .filter((e) => !todaysWorkoutIds.has(e.workout_id))
    .filter(
      (e, i, arr) => arr.findIndex((a) => a.workout_id === e.workout_id) === i,
    );

  return (
    <div className='space-y-3'>
      {todaysEntries.length > 0 ? (
        <>
          <h2 className='font-semibold text-sm text-muted-foreground'>
            Today&apos;s Workouts ({DAY_LABELS[dayOfWeek]})
          </h2>
          <div className='flex flex-wrap gap-2'>
            {todaysEntries.map((entry) => (
              <StartWorkoutButton
                key={entry.id}
                workoutId={entry.workout_id}
                workoutName={entry.workout.name}
                scheduleEntryId={entry.id}
              />
            ))}
          </div>
        </>
      ) : (
        <p className='text-sm text-muted-foreground'>
          No workouts scheduled for today ({DAY_LABELS[dayOfWeek]}).
        </p>
      )}
      {otherEntries.length > 0 && (
        <>
          <h2 className='font-semibold text-sm text-muted-foreground'>
            Other Workouts
          </h2>
          <div className='flex flex-wrap gap-2'>
            {otherEntries.map((entry) => (
              <StartWorkoutButton
                key={entry.id}
                workoutId={entry.workout_id}
                workoutName={entry.workout.name}
                scheduleEntryId={entry.id}
                variant='ghost'
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
