'use server';

import {
  ActionResult,
  MeasurementTarget,
  UserPreference,
} from '@/app/types';
import { createClient } from '@/lib/supabase/server';

export async function getUserPreferences(): Promise<
  ActionResult<UserPreference[]>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('metric_type, unit');

    if (error) throw error;

    return { success: true, data: data as UserPreference[] };
  } catch (e) {
    console.error('Error fetching user preferences:', e);
    return { success: false, error: 'Failed to fetch preferences' };
  }
}

export async function getTargets(): Promise<ActionResult<MeasurementTarget[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('measurement_targets')
      .select('*');

    if (error) throw error;

    return { success: true, data: data as MeasurementTarget[] };
  } catch (e) {
    console.error('Error fetching targets:', e);
    return { success: false, error: 'Failed to fetch targets' };
  }
}
