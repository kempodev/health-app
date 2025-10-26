'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { MetricType, UnitType } from '@prisma/client';

import { convertToBaseUnit } from '@/lib/utils';
import { ActionResult } from '@/app/types';

type Measurement = {
  id: string;
  userId: string;
  metricType: MetricType;
  metricValue: number;
  originalValue: number;
  originalUnit: UnitType;
  createdAt: Date;
  updatedAt: Date;
};

export async function addMeasurement(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const value = parseFloat(formData.get('value') as string);
    if (value < 0) {
      return { success: false, error: 'Value cannot be negative' };
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
    return { success: true, data: measurement };
  } catch (e) {
    console.error('Error adding measurement:', e);
    return { success: false, error: 'Failed to add measurement' };
  }
}

export async function getMeasurements(): Promise<ActionResult<Measurement[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const measurements = await prisma.measurement.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: measurements };
  } catch (e) {
    console.error('Error fetching measurements:', e);
    return { success: false, error: 'Failed to fetch measurements' };
  }
}

export async function deleteMeasurement(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify the measurement belongs to the user
    const measurement = await prisma.measurement.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!measurement) {
      return { success: false, error: 'Measurement not found' };
    }

    // Delete the measurement
    await prisma.measurement.delete({
      where: {
        id: id,
      },
    });

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
