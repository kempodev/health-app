'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { MetricType, UnitType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { convertToBaseUnit } from './utils';

// Server actions
export async function addMeasurement(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const value = parseFloat(formData.get('value') as string);
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
      createdAt: 'desc',
    },
  });

  return measurements;
}

export async function getUserPreferences() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const preferences = await prisma.userPreferences.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      metricType: true,
      unit: true,
    },
  });

  return preferences;
}
