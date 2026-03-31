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

    // Pre-populate log exercises (one row per set)
    if (templateExercises && templateExercises.length > 0) {
      const logExercises = [];
      for (const te of templateExercises) {
        for (let s = 1; s <= te.sets; s++) {
          logExercises.push({
            workout_log_id: log.id,
            exercise_id: te.exercise_id,
            position: te.position,
            set_number: s,
            reps: te.reps,
            weight_kg: te.weight_kg,
            completed: false,
          });
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
