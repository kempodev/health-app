'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResult } from '@/app/types';
import { convertToBaseUnit } from '@/lib/utils';
import { getExerciseById } from '@/lib/exercises';
import type {
  Workout,
  WorkoutExercise,
  WorkoutWithExercises,
  WorkoutExerciseWithDetails,
} from './types';

function enrichExercise(we: WorkoutExercise): WorkoutExerciseWithDetails {
  const exercise = getExerciseById(we.exercise_id);
  return {
    ...we,
    exercise_name: exercise?.name ?? we.exercise_id,
    exercise_images: exercise?.images ?? [],
    primary_muscles: exercise?.primaryMuscles ?? [],
  };
}

export async function getWorkouts(): Promise<ActionResult<Workout[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data as Workout[] };
  } catch (e) {
    console.error('Error fetching workouts:', e);
    return { success: false, error: 'Failed to fetch workouts' };
  }
}

export async function getWorkout(
  id: string
): Promise<ActionResult<WorkoutWithExercises>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single();

    if (workoutError) throw workoutError;

    const { data: exercises, error: exercisesError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', id)
      .order('position', { ascending: true });

    if (exercisesError) throw exercisesError;

    return {
      success: true,
      data: {
        ...(workout as Workout),
        exercises: (exercises as WorkoutExercise[]).map(enrichExercise),
      },
    };
  } catch (e) {
    console.error('Error fetching workout:', e);
    return { success: false, error: 'Failed to fetch workout' };
  }
}

export async function createWorkout(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const name = (formData.get('name') as string)?.trim();
    if (!name) return { success: false, error: 'Name is required' };

    const description = (formData.get('description') as string)?.trim() ?? '';

    const { data, error } = await supabase
      .from('workouts')
      .insert({ user_id: user.id, name, description })
      .select('id')
      .single();

    if (error) throw error;

    revalidatePath('/workouts');
    return { success: true, data: { id: data.id } };
  } catch (e) {
    console.error('Error creating workout:', e);
    return { success: false, error: 'Failed to create workout' };
  }
}

export async function updateWorkout(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const name = (formData.get('name') as string)?.trim();
    if (!name) return { success: false, error: 'Name is required' };

    const description = (formData.get('description') as string)?.trim() ?? '';

    const { error } = await supabase
      .from('workouts')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/workouts');
    revalidatePath(`/workouts/${id}`);
    return { success: true, data: { id } };
  } catch (e) {
    console.error('Error updating workout:', e);
    return { success: false, error: 'Failed to update workout' };
  }
}

export async function deleteWorkout(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Check if workout is used in any schedule
    const { data: entries, error: entriesError } = await supabase
      .from('schedule_entries')
      .select('schedule_id, weekly_schedules(name)')
      .eq('workout_id', id);

    if (entriesError) throw entriesError;

    if (entries && entries.length > 0) {
      const scheduleNames = [
        ...new Set(
          entries.map((e) => {
            const schedule = e.weekly_schedules as unknown as
              | { name: string }
              | null;
            return schedule?.name ?? 'Unknown';
          })
        ),
      ];
      return {
        success: false,
        error: `This workout is used in schedule(s): ${scheduleNames.join(', ')}. Remove it from schedules first.`,
      };
    }

    const { error } = await supabase.from('workouts').delete().eq('id', id);

    if (error) throw error;

    revalidatePath('/workouts');
    return { success: true, data: { id } };
  } catch (e) {
    console.error('Error deleting workout:', e);
    return { success: false, error: 'Failed to delete workout' };
  }
}

export async function duplicateWorkout(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Fetch original workout
    const { data: original, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Create copy
    const { data: newWorkout, error: createError } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        name: `${original.name} (Copy)`,
        description: original.description,
      })
      .select('id')
      .single();

    if (createError) throw createError;

    // Copy exercises
    const { data: exercises, error: exError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', id)
      .order('position', { ascending: true });

    if (exError) throw exError;

    if (exercises && exercises.length > 0) {
      const { error: insertError } = await supabase
        .from('workout_exercises')
        .insert(
          exercises.map((e: WorkoutExercise) => ({
            workout_id: newWorkout.id,
            exercise_id: e.exercise_id,
            position: e.position,
            sets: e.sets,
            reps: e.reps,
            weight_kg: e.weight_kg,
            rest_seconds: e.rest_seconds,
          }))
        );

      if (insertError) throw insertError;
    }

    revalidatePath('/workouts');
    return { success: true, data: { id: newWorkout.id } };
  } catch (e) {
    console.error('Error duplicating workout:', e);
    return { success: false, error: 'Failed to duplicate workout' };
  }
}

export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  sets: number,
  reps: number,
  weightValue: number | null,
  weightUnit: string,
  restSeconds: number
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Get next position
    const { data: existing } = await supabase
      .from('workout_exercises')
      .select('position')
      .eq('workout_id', workoutId)
      .order('position', { ascending: false })
      .limit(1);

    const position = existing && existing.length > 0 ? existing[0].position + 1 : 0;

    const weightKg =
      weightValue !== null
        ? convertToBaseUnit(weightValue, weightUnit as 'kg' | 'lbs', 'weight')
        : null;

    const { data, error } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: workoutId,
        exercise_id: exerciseId,
        position,
        sets,
        reps,
        weight_kg: weightKg,
        rest_seconds: restSeconds,
      })
      .select('id')
      .single();

    if (error) throw error;

    // Update workout timestamp
    await supabase
      .from('workouts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', workoutId);

    revalidatePath(`/workouts/${workoutId}`);
    return { success: true, data: { id: data.id } };
  } catch (e) {
    console.error('Error adding exercise to workout:', e);
    return { success: false, error: 'Failed to add exercise' };
  }
}

export async function updateWorkoutExercise(
  id: string,
  workoutId: string,
  sets: number,
  reps: number,
  weightValue: number | null,
  weightUnit: string,
  restSeconds: number
): Promise<ActionResult<{ id: string }>> {
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
      .from('workout_exercises')
      .update({ sets, reps, weight_kg: weightKg, rest_seconds: restSeconds })
      .eq('id', id);

    if (error) throw error;

    await supabase
      .from('workouts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', workoutId);

    revalidatePath(`/workouts/${workoutId}`);
    return { success: true, data: { id } };
  } catch (e) {
    console.error('Error updating workout exercise:', e);
    return { success: false, error: 'Failed to update exercise' };
  }
}

export async function removeExerciseFromWorkout(
  id: string,
  workoutId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await supabase
      .from('workouts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', workoutId);

    revalidatePath(`/workouts/${workoutId}`);
    return { success: true, data: { id } };
  } catch (e) {
    console.error('Error removing exercise from workout:', e);
    return { success: false, error: 'Failed to remove exercise' };
  }
}

export async function reorderWorkoutExercises(
  workoutId: string,
  exerciseIds: string[]
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Use negative positions first to avoid unique constraint conflicts
    for (let i = 0; i < exerciseIds.length; i++) {
      const { error } = await supabase
        .from('workout_exercises')
        .update({ position: -(i + 1) })
        .eq('id', exerciseIds[i])
        .eq('workout_id', workoutId);

      if (error) throw error;
    }

    for (let i = 0; i < exerciseIds.length; i++) {
      const { error } = await supabase
        .from('workout_exercises')
        .update({ position: i })
        .eq('id', exerciseIds[i])
        .eq('workout_id', workoutId);

      if (error) throw error;
    }

    await supabase
      .from('workouts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', workoutId);

    revalidatePath(`/workouts/${workoutId}`);
    return { success: true };
  } catch (e) {
    console.error('Error reordering exercises:', e);
    return { success: false, error: 'Failed to reorder exercises' };
  }
}
