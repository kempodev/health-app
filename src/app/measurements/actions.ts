'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { MetricType, UnitType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function addMeasurement(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const value = parseFloat(formData.get('value') as string);
  const date = formData.get('date') as string;
  const type = formData.get('metricType') as MetricType;
  const unit = formData.get('unit') as UnitType;

  // Convert values to base units if needed
  const metricValue = convertToBaseUnit(value, unit, type);

  const measurement = await prisma.measurement.create({
    data: {
      userId: session.user.id,
      metricType: type,
      metricValue: metricValue,
      originalValue: value,
      originalUnit: unit,
      recordedAt: new Date(date),
    },
  });

  revalidatePath('/measurements');
  return measurement;
}

export async function getMeasurements() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const measurements = await prisma.measurement.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      recordedAt: 'desc',
    },
  });

  return measurements;
}

function convertToBaseUnit(
  value: number,
  unit: UnitType,
  type: MetricType
): number {
  switch (type) {
    case 'weight':
      return unit === 'lbs' ? value * 0.45359237 : value;
    case 'body_fat':
      return value;
    default:
      return unit === 'inches' ? value * 2.54 : value;
  }
}
