'use server';

import { revalidatePath } from 'next/cache';

import { MetricType, UnitType, ActionResult } from '@/app/types';
import { createClient } from '@/lib/supabase/server';

export async function saveUserPreferences(
  formData: FormData
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const weightUnit = formData.get('weightUnit') as UnitType;
    const lengthUnit = formData.get('lengthUnit') as UnitType;

    const lengthMetrics: MetricType[] = [
      'chest',
      'arm',
      'waist',
      'hip',
      'thigh',
      'calf',
    ];

    const rows = [
      { user_id: user.id, metric_type: 'weight' as MetricType, unit: weightUnit },
      ...lengthMetrics.map((metric) => ({
        user_id: user.id,
        metric_type: metric,
        unit: lengthUnit,
      })),
    ];

    const { error } = await supabase
      .from('user_preferences')
      .upsert(rows, { onConflict: 'user_id,metric_type' });

    if (error) throw error;

    revalidatePath('/profile');
    revalidatePath('/measurements');
    return { success: true };
  } catch (e) {
    console.error('Failed to save preferences:', e);
    return { success: false, error: 'Failed to save preferences' };
  }
}

export async function saveTargets(
  formData: FormData
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const targets = formData
      .getAll('targets')
      .map((t) => JSON.parse(t.toString()));
    const targetsToDelete = formData
      .getAll('targetsToDelete')
      .map((t) => JSON.parse(t.toString()));

    // Delete targets with value 0
    if (targetsToDelete.length > 0) {
      const { error } = await supabase
        .from('measurement_targets')
        .delete()
        .in('metric_type', targetsToDelete as MetricType[]);

      if (error) throw error;
    }

    // Update/create remaining targets
    if (targets.length > 0) {
      const rows = targets.map(
        (target: { metricType: MetricType; value: number; unit: UnitType }) => ({
          user_id: user.id,
          metric_type: target.metricType,
          value: target.value,
          unit: target.unit,
        })
      );

      const { error } = await supabase
        .from('measurement_targets')
        .upsert(rows, { onConflict: 'user_id,metric_type' });

      if (error) throw error;
    }

    revalidatePath('/profile');
    return { success: true, data: { success: true } };
  } catch (e) {
    console.error('Error saving targets:', e);
    return { success: false, error: 'Failed to save targets' };
  }
}
