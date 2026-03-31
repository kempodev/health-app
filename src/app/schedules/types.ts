import type { DayOfWeek } from '@/app/types';
import type { Workout } from '@/app/workouts/types';

export type WeeklySchedule = {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ScheduleEntry = {
  id: string;
  schedule_id: string;
  workout_id: string;
  day_of_week: DayOfWeek;
  created_at: string;
};

export type ScheduleEntryWithWorkout = ScheduleEntry & {
  workout: Workout;
};

export type WeeklyScheduleWithEntries = WeeklySchedule & {
  entries: ScheduleEntryWithWorkout[];
};
