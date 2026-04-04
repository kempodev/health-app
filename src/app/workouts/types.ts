export type Workout = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  exercise_count?: number;
};

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_id: string;
  position: number;
  sets: number;
  reps: number;
  weight_kg: number | null;
  rest_seconds: number;
  created_at: string;
};

export type WorkoutExerciseWithDetails = WorkoutExercise & {
  exercise_name: string;
  exercise_images: string[];
  primary_muscles: string[];
};

export type WorkoutWithExercises = Workout & {
  exercises: WorkoutExerciseWithDetails[];
};
