-- ============================================================
-- Migration: Per-exercise notes on workout log exercises
-- ============================================================
-- Adds a free-text note that lives on the first set row of each
-- (workout_log_id, position) group. Used as a self-coaching reminder
-- ("increase reps next time"). Carried forward from the most recent
-- completed log of the same workout, via the same Nth-occurrence
-- FIFO logic that already carries reps/weight.

ALTER TABLE workout_log_exercises
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';
