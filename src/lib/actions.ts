'use server';

import { ActionResult } from '@/app/measurements/types';
import { MetricType, UnitType } from '@prisma/client';
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
      return { error: 'Not authenticated' };
    }

    const preferences = await prisma.userPreferences.findMany({
      where: { userId: session.user.id },
    });

    return { data: preferences };
  } catch (e) {
    console.error('Error fetching user preferences:', e);
    return { error: 'Failed to fetch preferences' };
  }
}
