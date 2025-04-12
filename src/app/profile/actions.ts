'use server';

import { revalidatePath } from 'next/cache';

import { MetricType, UnitType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ActionResult } from '../measurements/types';

export async function saveUserPreferences(
  formData: FormData
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const weightUnit = formData.get('weightUnit') as UnitType;
    const lengthUnit = formData.get('lengthUnit') as UnitType;

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

export async function saveTargets(
  formData: FormData
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
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
      await prisma.measurementTarget.deleteMany({
        where: {
          userId: session.user.id,
          metricType: {
            in: targetsToDelete as MetricType[],
          },
        },
      });
    }

    // Update/create remaining targets
    if (targets.length > 0) {
      await Promise.all(
        targets.map(
          (target: { metricType: MetricType; value: number; unit: UnitType }) =>
            prisma.measurementTarget.upsert({
              where: {
                userId_metricType: {
                  userId: session?.user?.id as string,
                  metricType: target.metricType,
                },
              },
              update: {
                value: target.value,
                unit: target.unit,
              },
              create: {
                userId: session?.user?.id as string,
                metricType: target.metricType,
                value: target.value,
                unit: target.unit,
              },
            })
        )
      );
    }

    revalidatePath('/profile');
    return { success: true, data: { success: true } };
  } catch (e) {
    console.error('Error saving targets:', e);
    return { success: false, error: 'Failed to save targets' };
  }
}
