-- ============================================================
-- Migration: Gym Workout Tracking
-- ============================================================

-- 1. Workouts (templates)
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own workouts" ON workouts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_workouts_user_id ON workouts(user_id);

-- 2. Workout exercises (exercises within a template)
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id text NOT NULL,
  position smallint NOT NULL,
  sets smallint NOT NULL DEFAULT 3,
  reps smallint NOT NULL DEFAULT 10,
  weight_kg numeric(7,2) DEFAULT NULL,
  rest_seconds smallint NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workout_id, position)
);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own workout exercises" ON workout_exercises
  FOR ALL
  USING (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()));
CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);

-- 3. Weekly schedules
CREATE TABLE IF NOT EXISTS weekly_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own schedules" ON weekly_schedules
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_weekly_schedules_user_id ON weekly_schedules(user_id);
CREATE UNIQUE INDEX idx_one_active_schedule ON weekly_schedules(user_id) WHERE is_active = true;

-- 4. Schedule entries (workout-to-day assignments)
CREATE TABLE IF NOT EXISTS schedule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES weekly_schedules(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE RESTRICT,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(schedule_id, workout_id, day_of_week)
);

ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own schedule entries" ON schedule_entries
  FOR ALL
  USING (EXISTS (SELECT 1 FROM weekly_schedules WHERE weekly_schedules.id = schedule_entries.schedule_id AND weekly_schedules.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM weekly_schedules WHERE weekly_schedules.id = schedule_entries.schedule_id AND weekly_schedules.user_id = auth.uid()));
CREATE INDEX idx_schedule_entries_schedule_id ON schedule_entries(schedule_id);

-- 5. Workout logs (completed sessions)
CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL,
  schedule_entry_id uuid REFERENCES schedule_entries(id) ON DELETE SET NULL,
  name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz DEFAULT NULL,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own workout logs" ON workout_logs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_started_at ON workout_logs(user_id, started_at DESC);

-- 6. Workout log exercises (individual sets performed)
CREATE TABLE IF NOT EXISTS workout_log_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id uuid NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id text NOT NULL,
  position smallint NOT NULL,
  set_number smallint NOT NULL,
  reps smallint NOT NULL,
  weight_kg numeric(7,2) DEFAULT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workout_log_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own log exercises" ON workout_log_exercises
  FOR ALL
  USING (EXISTS (SELECT 1 FROM workout_logs WHERE workout_logs.id = workout_log_exercises.workout_log_id AND workout_logs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM workout_logs WHERE workout_logs.id = workout_log_exercises.workout_log_id AND workout_logs.user_id = auth.uid()));
CREATE INDEX idx_workout_log_exercises_log_id ON workout_log_exercises(workout_log_id);
CREATE INDEX idx_workout_log_exercises_exercise_id ON workout_log_exercises(exercise_id);
