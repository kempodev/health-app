'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResult, DayOfWeek } from '@/app/types';
import type {
  WeeklySchedule,
  ScheduleEntryWithWorkout,
  WeeklyScheduleWithEntries,
} from './types';

export async function getSchedules(): Promise<ActionResult<WeeklySchedule[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('weekly_schedules')
      .select('*')
      .order('is_active', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data as WeeklySchedule[] };
  } catch (e) {
    console.error('Error fetching schedules:', e);
    return { success: false, error: 'Failed to fetch schedules' };
  }
}

export async function getSchedule(
  id: string
): Promise<ActionResult<WeeklyScheduleWithEntries>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: schedule, error: scheduleError } = await supabase
      .from('weekly_schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (scheduleError) throw scheduleError;

    const { data: entries, error: entriesError } = await supabase
      .from('schedule_entries')
      .select('*, workouts(*)')
      .eq('schedule_id', id)
      .order('day_of_week', { ascending: true });

    if (entriesError) throw entriesError;

    const mappedEntries: ScheduleEntryWithWorkout[] = (entries ?? []).map(
      (entry) => ({
        id: entry.id,
        schedule_id: entry.schedule_id,
        workout_id: entry.workout_id,
        day_of_week: entry.day_of_week as DayOfWeek,
        created_at: entry.created_at,
        workout: entry.workouts as unknown as ScheduleEntryWithWorkout['workout'],
      })
    );

    return {
      success: true,
      data: {
        ...(schedule as WeeklySchedule),
        entries: mappedEntries,
      },
    };
  } catch (e) {
    console.error('Error fetching schedule:', e);
    return { success: false, error: 'Failed to fetch schedule' };
  }
}

export async function getActiveSchedule(): Promise<
  ActionResult<WeeklyScheduleWithEntries | null>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: schedule, error: scheduleError } = await supabase
      .from('weekly_schedules')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (scheduleError) throw scheduleError;
    if (!schedule) return { success: true, data: null };

    const { data: entries, error: entriesError } = await supabase
      .from('schedule_entries')
      .select('*, workouts(*)')
      .eq('schedule_id', schedule.id)
      .order('day_of_week', { ascending: true });

    if (entriesError) throw entriesError;

    const mappedEntries: ScheduleEntryWithWorkout[] = (entries ?? []).map(
      (entry) => ({
        id: entry.id,
        schedule_id: entry.schedule_id,
        workout_id: entry.workout_id,
        day_of_week: entry.day_of_week as DayOfWeek,
        created_at: entry.created_at,
        workout: entry.workouts as unknown as ScheduleEntryWithWorkout['workout'],
      })
    );

    return {
      success: true,
      data: {
        ...(schedule as WeeklySchedule),
        entries: mappedEntries,
      },
    };
  } catch (e) {
    console.error('Error fetching active schedule:', e);
    return { success: false, error: 'Failed to fetch active schedule' };
  }
}

export async function createSchedule(
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

    const { data, error } = await supabase
      .from('weekly_schedules')
      .insert({ user_id: user.id, name })
      .select('id')
      .single();

    if (error) throw error;

    revalidatePath('/schedules');
    return { success: true, data: { id: data.id } };
  } catch (e) {
    console.error('Error creating schedule:', e);
    return { success: false, error: 'Failed to create schedule' };
  }
}

export async function updateSchedule(
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

    const { error } = await supabase
      .from('weekly_schedules')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/schedules');
    revalidatePath(`/schedules/${id}`);
    return { success: true, data: { id } };
  } catch (e) {
    console.error('Error updating schedule:', e);
    return { success: false, error: 'Failed to update schedule' };
  }
}

export async function deleteSchedule(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('weekly_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/schedules');
    return { success: true, data: { id } };
  } catch (e) {
    console.error('Error deleting schedule:', e);
    return { success: false, error: 'Failed to delete schedule' };
  }
}

export async function setActiveSchedule(
  id: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Deactivate all schedules
    await supabase
      .from('weekly_schedules')
      .update({ is_active: false })
      .eq('is_active', true);

    // Activate the specified one
    const { error } = await supabase
      .from('weekly_schedules')
      .update({ is_active: true })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/schedules');
    revalidatePath('/workout-logs');
    return { success: true };
  } catch (e) {
    console.error('Error setting active schedule:', e);
    return { success: false, error: 'Failed to set active schedule' };
  }
}

export async function addScheduleEntry(
  scheduleId: string,
  workoutId: string,
  dayOfWeek: DayOfWeek
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('schedule_entries')
      .insert({
        schedule_id: scheduleId,
        workout_id: workoutId,
        day_of_week: dayOfWeek,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          error: 'This workout is already assigned to this day',
        };
      }
      throw error;
    }

    revalidatePath(`/schedules/${scheduleId}`);
    return { success: true, data: { id: data.id } };
  } catch (e) {
    console.error('Error adding schedule entry:', e);
    return { success: false, error: 'Failed to add entry' };
  }
}

export async function removeScheduleEntry(
  id: string,
  scheduleId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('schedule_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath(`/schedules/${scheduleId}`);
    return { success: true, data: { id } };
  } catch (e) {
    console.error('Error removing schedule entry:', e);
    return { success: false, error: 'Failed to remove entry' };
  }
}
