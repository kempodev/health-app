'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { MetricType, UnitType, Measurement, ActionResult } from '@/app/types';
import { convertToBaseUnit } from '@/lib/utils';

export async function addMeasurement(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const value = parseFloat(formData.get('value') as string);
    if (value < 0) {
      return { success: false, error: 'Value cannot be negative' };
    }

    const type = formData.get('metricType') as MetricType;
    const unit = formData.get('unit') as UnitType;
    const metricValue = convertToBaseUnit(value, unit, type);

    const { data, error } = await supabase
      .from('measurements')
      .insert({
        user_id: user.id,
        metric_type: type,
        metric_value: metricValue,
        original_value: value,
        original_unit: unit,
      })
      .select('id')
      .single();

    if (error) throw error;

    revalidatePath('/measurements');
    return { success: true, data: { id: data.id } };
  } catch (e) {
    console.error('Error adding measurement:', e);
    return { success: false, error: 'Failed to add measurement' };
  }
}

export async function getMeasurements(): Promise<ActionResult<Measurement[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data as Measurement[] };
  } catch (e) {
    console.error('Error fetching measurements:', e);
    return { success: false, error: 'Failed to fetch measurements' };
  }
}

export async function deleteMeasurement(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('measurements')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/measurements');
    return { success: true, data: { id } };
  } catch (e) {
    console.error('Error deleting measurement:', e);
    return {
      success: false,
      error: 'Failed to delete measurement',
    };
  }
}
