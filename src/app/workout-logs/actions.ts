'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResult } from '@/app/types';
import { convertToBaseUnit } from '@/lib/utils';
import type {
  WorkoutLog,
  WorkoutLogExercise,
  WorkoutLogWithExercises,
} from './types';

export async function getWorkoutLogs(): Promise<ActionResult<WorkoutLog[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data as WorkoutLog[] };
  } catch (e) {
    console.error('Error fetching workout logs:', e);
    return { success: false, error: 'Failed to fetch workout logs' };
  }
}

export async function getWorkoutLog(
  id: string
): Promise<ActionResult<WorkoutLogWithExercises>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: log, error: logError } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (logError) throw logError;

    const { data: exercises, error: exError } = await supabase
      .from('workout_log_exercises')
      .select('*')
      .eq('workout_log_id', id)
      .order('position', { ascending: true })
      .order('set_number', { ascending: true });

    if (exError) throw exError;

    return {
      success: true,
      data: {
        ...(log as WorkoutLog),
        exercises: exercises as WorkoutLogExercise[],
      },
    };
  } catch (e) {
    console.error('Error fetching workout log:', e);
    return { success: false, error: 'Failed to fetch workout log' };
  }
}

export async function startWorkoutLog(
  workoutId: string,
  scheduleEntryId?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Verify workout is in the active schedule
    const { data: activeSchedule } = await supabase
      .from('weekly_schedules')
      .select('id')
      .eq('is_active', true)
      .single();

    if (!activeSchedule) {
      return { success: false, error: 'No active schedule' };
    }

    const { data: scheduleEntries } = await supabase
      .from('schedule_entries')
      .select('id')
      .eq('schedule_id', activeSchedule.id)
      .eq('workout_id', workoutId);

    if (!scheduleEntries || scheduleEntries.length === 0) {
      return { success: false, error: 'Workout is not in the active schedule' };
    }

    // Get workout template
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('name')
      .eq('id', workoutId)
      .single();

    if (workoutError) throw workoutError;

    // Create log
    const { data: log, error: logError } = await supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        workout_id: workoutId,
        schedule_entry_id: scheduleEntryId ?? null,
        name: workout.name,
      })
      .select('id')
      .single();

    if (logError) throw logError;

    // Get template exercises
    const { data: templateExercises, error: templateError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('position', { ascending: true });

    if (templateError) throw templateError;

    // Find most recent completed log of this workout to pre-fill reps/weights
    // from prior session. Scoped by workout only — schedule_entry_id is
    // ON DELETE SET NULL and isn't always populated, so filtering by it
    // would silently miss most legacy logs.
    const { data: prevLog } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_id', workoutId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Per-exercise FIFO queue of "slots". Each slot is the set list from
    // one (exercise_id, position) combo in the prior log, with slots
    // ordered by their prior position. The Nth occurrence of an exercise
    // in the new template consumes the Nth occurrence from the prior log,
    // so reordering exercises doesn't break the carry-over.
    // Each slot carries the prior set list plus a single per-exercise
    // note (read from the first set row of that combo in the prior log).
    type PriorSlot = {
      sets: { reps: number; weight_kg: number | null }[];
      notes: string;
    };
    const priorSlotsByExercise = new Map<string, PriorSlot[]>();
    if (prevLog) {
      const { data: prevExercises } = await supabase
        .from('workout_log_exercises')
        .select('exercise_id, position, set_number, reps, weight_kg, notes')
        .eq('workout_log_id', prevLog.id)
        .order('position', { ascending: true })
        .order('set_number', { ascending: true });

      if (prevExercises) {
        const byCombo = new Map<string, PriorSlot>();
        const comboOrder: { exerciseId: string; position: number }[] = [];
        for (const pe of prevExercises) {
          const key = `${pe.exercise_id}:${pe.position}`;
          if (!byCombo.has(key)) {
            byCombo.set(key, { sets: [], notes: pe.notes ?? '' });
            comboOrder.push({
              exerciseId: pe.exercise_id,
              position: pe.position,
            });
          }
          byCombo.get(key)!.sets.push({
            reps: pe.reps,
            weight_kg: pe.weight_kg,
          });
        }
        for (const c of comboOrder) {
          const slot = byCombo.get(`${c.exerciseId}:${c.position}`)!;
          if (!priorSlotsByExercise.has(c.exerciseId)) {
            priorSlotsByExercise.set(c.exerciseId, []);
          }
          priorSlotsByExercise.get(c.exerciseId)!.push(slot);
        }
      }
    }

    // Pre-populate log exercises (one row per set). The per-exercise
    // note is stored on the set_number = 1 row by convention; other set
    // rows keep notes = ''.
    if (templateExercises && templateExercises.length > 0) {
      const logExercises = [];
      for (const te of templateExercises) {
        const priorSlot = priorSlotsByExercise.get(te.exercise_id)?.shift();
        if (priorSlot && priorSlot.sets.length > 0) {
          priorSlot.sets.forEach((ps, idx) => {
            logExercises.push({
              workout_log_id: log.id,
              exercise_id: te.exercise_id,
              position: te.position,
              set_number: idx + 1,
              reps: ps.reps,
              weight_kg: ps.weight_kg,
              completed: false,
              notes: idx === 0 ? priorSlot.notes : '',
            });
          });
        } else {
          for (let s = 1; s <= te.sets; s++) {
            logExercises.push({
              workout_log_id: log.id,
              exercise_id: te.exercise_id,
              position: te.position,
              set_number: s,
              reps: te.reps,
              weight_kg: te.weight_kg,
              completed: false,
              notes: '',
            });
          }
        }
      }

      const { error: insertError } = await supabase
        .from('workout_log_exercises')
        .insert(logExercises);

      if (insertError) throw insertError;
    }

    return { success: true, data: { id: log.id } };
  } catch (e) {
    console.error('Error starting workout log:', e);
    return { success: false, error: 'Failed to start workout' };
  }
}

export async function updateLogExerciseSet(
  id: string,
  reps: number,
  weightValue: number | null,
  weightUnit: string,
  completed: boolean
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const weightKg =
      weightValue !== null
        ? convertToBaseUnit(weightValue, weightUnit as 'kg' | 'lbs', 'weight')
        : null;

    const { error } = await supabase
      .from('workout_log_exercises')
      .update({ reps, weight_kg: weightKg, completed })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.error('Error updating log exercise set:', e);
    return { success: false, error: 'Failed to update set' };
  }
}

export async function addLogExerciseSet(
  workoutLogId: string,
  exerciseId: string,
  position: number,
  reps: number,
  weightValue: number | null,
  weightUnit: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Get next set number for this exercise
    const { data: existing } = await supabase
      .from('workout_log_exercises')
      .select('set_number')
      .eq('workout_log_id', workoutLogId)
      .eq('exercise_id', exerciseId)
      .eq('position', position)
      .order('set_number', { ascending: false })
      .limit(1);

    const setNumber =
      existing && existing.length > 0 ? existing[0].set_number + 1 : 1;

    const weightKg =
      weightValue !== null
        ? convertToBaseUnit(weightValue, weightUnit as 'kg' | 'lbs', 'weight')
        : null;

    const { data, error } = await supabase
      .from('workout_log_exercises')
      .insert({
        workout_log_id: workoutLogId,
        exercise_id: exerciseId,
        position,
        set_number: setNumber,
        reps,
        weight_kg: weightKg,
        completed: false,
      })
      .select('id')
      .single();

    if (error) throw error;

    revalidatePath(`/workout-logs/${workoutLogId}`);
    return { success: true, data: { id: data.id } };
  } catch (e) {
    console.error('Error adding log exercise set:', e);
    return { success: false, error: 'Failed to add set' };
  }
}

export async function removeLogExerciseSet(
  id: string,
  workoutLogId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('workout_log_exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath(`/workout-logs/${workoutLogId}`);
    return { success: true, data: { id } };
  } catch (e) {
    console.error('Error removing log exercise set:', e);
    return { success: false, error: 'Failed to remove set' };
  }
}

export async function completeWorkoutLog(
  id: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('workout_logs')
      .update({
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/workout-logs');
    revalidatePath(`/workout-logs/${id}`);
    return { success: true };
  } catch (e) {
    console.error('Error completing workout log:', e);
    return { success: false, error: 'Failed to complete workout' };
  }
}

export async function updateWorkoutLogNotes(
  id: string,
  notes: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('workout_logs')
      .update({ notes })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.error('Error updating workout log notes:', e);
    return { success: false, error: 'Failed to update notes' };
  }
}

export async function updateLogExerciseNote(
  workoutLogId: string,
  position: number,
  notes: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('workout_log_exercises')
      .update({ notes })
      .eq('workout_log_id', workoutLogId)
      .eq('position', position)
      .eq('set_number', 1);

    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.error('Error updating log exercise note:', e);
    return { success: false, error: 'Failed to update note' };
  }
}

export async function deleteWorkoutLog(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/workout-logs');
    return { success: true, data: { id } };
  } catch (e) {
    console.error('Error deleting workout log:', e);
    return { success: false, error: 'Failed to delete workout log' };
  }
}
