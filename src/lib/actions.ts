'use server';

import { ActionResult } from '@/app/measurements/types';
import { MeasurementTarget, MetricType, UnitType } from '@prisma/client';
import { auth } from './auth';
import { prisma } from './prisma';

type UserPreference = {
  metricType: MetricType;
  unit: UnitType;
};

export async function getUserPreferences(): Promise<
  ActionResult<UserPreference[]>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const preferences = await prisma.userPreferences.findMany({
      where: { userId: session.user.id },
    });

    return { success: true, data: preferences };
  } catch (e) {
    console.error('Error fetching user preferences:', e);
    return { success: false, error: 'Failed to fetch preferences' };
  }
}

export async function getTargets(): Promise<ActionResult<MeasurementTarget[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const targets = await prisma.measurementTarget.findMany({
      where: { userId: session.user.id },
    });

    return { success: true, data: targets };
  } catch (e) {
    console.error('Error fetching targets:', e);
    return { success: false, error: 'Failed to fetch targets' };
  }
}
