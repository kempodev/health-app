export type WorkoutLog = {
  id: string;
  user_id: string;
  workout_id: string | null;
  schedule_entry_id: string | null;
  name: string;
  started_at: string;
  completed_at: string | null;
  notes: string;
  created_at: string;
};

export type WorkoutLogExercise = {
  id: string;
  workout_log_id: string;
  exercise_id: string;
  position: number;
  set_number: number;
  reps: number;
  weight_kg: number | null;
  completed: boolean;
  notes: string;
  created_at: string;
};

export type WorkoutLogWithExercises = WorkoutLog & {
  exercises: WorkoutLogExercise[];
};
