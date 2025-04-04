'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { MetricType, UnitType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getUserPreferences() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const preferences = await prisma.userPreferences.findMany({
    where: {
      userId: session.user.id,
    },
  });

  return preferences;
}

export async function saveUserPreferences(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
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
  } catch (error) {
    console.error('Failed to save preferences:', error);
    throw new Error('Failed to save preferences');
  }
}
