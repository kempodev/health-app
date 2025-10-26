'use server';

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import {
  convertFromBaseUnit,
  convertToBaseUnit,
} from '@/app/measurements/utils';
import { type UnitType } from '@prisma/client';

type Props = {
  userId: string;
  userName?: string | null;
};

export default async function CurrentWeightCard({ userId }: Props) {
  // fetch latest weight measurement and target for the user
  const latestWeight = await prisma.measurement.findFirst({
    where: { userId, metricType: 'weight' },
    orderBy: { createdAt: 'desc' },
  });

  const weightTarget = await prisma.measurementTarget.findFirst({
    where: { userId, metricType: 'weight' },
  });

  const userPref = await prisma.userPreferences.findFirst({
    where: { userId, metricType: 'weight' },
  });

  const preferredUnit = userPref?.unit as UnitType | undefined;

  // compute display values taking preference into account
  let displayWeightValue: number | null = null;
  let displayWeightUnit: string | null = null;
  if (latestWeight) {
    if (preferredUnit) {
      displayWeightValue = Number(
        convertFromBaseUnit(latestWeight.metricValue, preferredUnit, 'weight').toFixed(1)
      );
      displayWeightUnit = preferredUnit;
    } else {
      displayWeightValue = Number(latestWeight.originalValue.toFixed(1));
      displayWeightUnit = latestWeight.originalUnit;
    }
  }

  let displayTargetValue: number | null = null;
  let displayTargetUnit: string | null = null;
  if (weightTarget) {
    if (preferredUnit) {
      const base = convertToBaseUnit(weightTarget.value, weightTarget.unit as UnitType, 'weight');
      displayTargetValue = Number(convertFromBaseUnit(base, preferredUnit, 'weight').toFixed(1));
      displayTargetUnit = preferredUnit;
    } else {
      displayTargetValue = Number(weightTarget.value.toFixed(1));
      displayTargetUnit = weightTarget.unit;
    }
  }

  // compute delta between latest and previous measurement
  const recentWeights = await prisma.measurement.findMany({
    where: { userId, metricType: 'weight' },
    orderBy: { createdAt: 'desc' },
    take: 2,
  });
  const previousWeight = recentWeights.length > 1 ? recentWeights[1] : null;

  let deltaDisplay: string | null = null;
  let deltaPercentDisplay: string | null = null;
  if (latestWeight && previousWeight) {
    const deltaBase = latestWeight.metricValue - previousWeight.metricValue;
    const sign = deltaBase >= 0 ? '+' : '-';

    if (preferredUnit) {
      const absDelta = Number(
        convertFromBaseUnit(Math.abs(deltaBase), preferredUnit, 'weight').toFixed(1)
      );
      deltaDisplay = `${sign}${absDelta} ${preferredUnit}`;
    } else {
      const absDelta = Number(Math.abs(latestWeight.originalValue - previousWeight.originalValue).toFixed(1));
      deltaDisplay = `${sign}${absDelta} ${latestWeight.originalUnit}`;
    }

    if (previousWeight.metricValue !== 0) {
      const percent = (deltaBase / previousWeight.metricValue) * 100;
      deltaPercentDisplay = `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Weight</CardTitle>
      </CardHeader>
      <CardContent>
        {latestWeight ? (
          <div className='flex flex-col gap-2'>
            <div className='text-sm text-muted-foreground'>Latest</div>
            <div className='text-2xl font-semibold'>
              {displayWeightValue !== null ? displayWeightValue : latestWeight.originalValue}{' '}
              {displayWeightUnit}
            </div>
            <div className='text-sm text-muted-foreground'>
              Recorded on {new Date(latestWeight.createdAt).toLocaleDateString()}
            </div>
            {deltaDisplay && (
              <div className='text-sm'>
                Change since previous: <span className='font-medium'>{deltaDisplay}</span>{' '}
                {deltaPercentDisplay && (
                  <span className='text-muted-foreground'>({deltaPercentDisplay})</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className='text-sm text-muted-foreground'>No weight recorded yet.</div>
        )}

        {weightTarget && (
          <div className='mt-4'>
            <div className='text-sm text-muted-foreground'>Target</div>
            <div className='text-lg font-medium'>
              {displayTargetValue !== null ? displayTargetValue : weightTarget.value}{' '}
              {displayTargetUnit}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <CardAction>
          <Link href='/measurements' className='text-sm'>
            <Button className='px-3 py-1 cursor-pointer'>Update weight</Button>
          </Link>
        </CardAction>
      </CardFooter>
    </Card>
  );
}
