'use client';

import type { DayOfWeek } from '@/app/types';
import type { Workout } from '@/app/workouts/types';
import type { ScheduleEntryWithWorkout } from '../types';
import DaySlot from './DaySlot';

type WeekGridProps = {
  scheduleId: string;
  entries: ScheduleEntryWithWorkout[];
  workouts: Workout[];
};

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

export default function WeekGrid({
  scheduleId,
  entries,
  workouts,
}: WeekGridProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
      {DAYS.map((day) => (
        <DaySlot
          key={day}
          day={day}
          scheduleId={scheduleId}
          entries={entries.filter((e) => e.day_of_week === day)}
          workouts={workouts}
        />
      ))}
    </div>
  );
}
