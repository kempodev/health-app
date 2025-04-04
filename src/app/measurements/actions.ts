'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { MetricType, UnitType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { convertToBaseUnit } from './utils';
import { ActionResult } from './types';

interface Measurement {
  id: string;
  userId: string;
  metricType: MetricType;
  metricValue: number;
  originalValue: number;
  originalUnit: UnitType;
  createdAt: Date;
  updatedAt: Date;
}

interface UserPreference {
  metricType: MetricType;
  unit: UnitType;
}

export async function addMeasurement(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    const value = parseFloat(formData.get('value') as string);
    if (value < 0) {
      return { error: 'Value cannot be negative' };
    }

    const type = formData.get('metricType') as MetricType;
    const unit = formData.get('unit') as UnitType;
    const metricValue = convertToBaseUnit(value, unit, type);

    const measurement = await prisma.measurement.create({
      data: {
        userId: session.user.id,
        metricType: type,
        metricValue: metricValue,
        originalValue: value,
        originalUnit: unit,
      },
      select: { id: true },
    });

    revalidatePath('/measurements');
    return { data: measurement };
  } catch (e) {
    console.error('Error adding measurement:', e);
    return { error: 'Failed to add measurement' };
  }
}

export async function getMeasurements(): Promise<ActionResult<Measurement[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    const measurements = await prisma.measurement.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return { data: measurements };
  } catch (e) {
    console.error('Error fetching measurements:', e);
    return { error: 'Failed to fetch measurements' };
  }
}

export async function getUserPreferences(): Promise<
  ActionResult<UserPreference[]>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    const preferences = await prisma.userPreferences.findMany({
      where: { userId: session.user.id },
      select: { metricType: true, unit: true },
    });

    return { data: preferences };
  } catch (e) {
    console.error('Error fetching user preferences:', e);
    return { error: 'Failed to fetch preferences' };
  }
}
