'use server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { MetricType, UnitType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '../measurements/types';

export async function saveUserPreferences(
  formData: FormData
): Promise<ActionResult<{ success: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  const weightUnit = formData.get('weightUnit') as UnitType;
  const lengthUnit = formData.get('lengthUnit') as UnitType;

  try {
    // Save weight preference
    await prisma.userPreferences.upsert({
      where: {
        userId_metricType: {
          userId: session.user.id,
          metricType: 'weight',
        },
      },
      update: {
        unit: weightUnit,
      },
      create: {
        userId: session.user.id,
        metricType: 'weight',
        unit: weightUnit,
      },
    });

    // Save length preference for all length-based metrics
    const lengthMetrics: MetricType[] = [
      'chest',
      'arm',
      'waist',
      'hip',
      'thigh',
      'calf',
    ];

    await Promise.all(
      lengthMetrics.map((metric) =>
        prisma.userPreferences.upsert({
          where: {
            userId_metricType: {
              userId: session?.user?.id as string,
              metricType: metric,
            },
          },
          update: {
            unit: lengthUnit,
          },
          create: {
            userId: session?.user?.id as string,
            metricType: metric,
            unit: lengthUnit,
          },
        })
      )
    );

    revalidatePath('/profile');
    revalidatePath('/measurements');
    return { success: true };
  } catch (e) {
    console.error('Failed to save preferences:', e);
    return { success: false, error: 'Failed to save preferences' };
  }
}
