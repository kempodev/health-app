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
  getMetricDisplayName,
  unitSignMap,
} from '@/lib/utils';
import { type UnitType, type MetricType } from '@prisma/client';

type Measurement = {
  id: string;
  userId: string;
  metricType: MetricType;
  metricValue: number;
  originalValue: number;
  originalUnit: UnitType;
  createdAt: Date;
};

type Target = {
  value: number;
  unit: UnitType;
};

type Props = {
  userId: string;
  metricType: MetricType;
  measurement?: Measurement | null; // optional pre-fetched measurement
  target?: Target | null; // optional pre-fetched target
  userPreferenceUnit?: UnitType | null; // optional pre-fetched preference
  showDelta?: boolean;
};

export default async function MeasurementCard({
  userId,
  metricType,
  measurement = null,
  target = null,
  userPreferenceUnit = null,
  showDelta = true,
}: Props) {
  // If measurement/target/pref not passed, fetch them
  const latestMeasurement: Measurement | null =
    measurement ||
    (await prisma.measurement.findFirst({
      where: { userId, metricType },
      orderBy: { createdAt: 'desc' },
    }));

  const weightTarget =
    target ||
    (await prisma.measurementTarget.findFirst({
      where: { userId, metricType },
    }));

  const userPref =
    userPreferenceUnit ||
    (await prisma.userPreferences.findFirst({ where: { userId, metricType } }))
      ?.unit ||
    null;

  const preferredUnit = userPref as UnitType | undefined;

  // compute display values taking preference into account
  let displayValue: number | null = null;
  let displayUnit: string | null = null;
  if (latestMeasurement) {
    if (preferredUnit) {
      displayValue = Number(
        convertFromBaseUnit(
          latestMeasurement.metricValue,
          preferredUnit,
          metricType
        ).toFixed(1)
      );
      displayUnit = unitSignMap.get(preferredUnit) ?? preferredUnit;
    } else {
      displayValue = Number(latestMeasurement.originalValue.toFixed(1));
      displayUnit =
        unitSignMap.get(latestMeasurement.originalUnit) ??
        latestMeasurement.originalUnit;
    }
  }

  let displayTargetValue: number | null = null;
  let displayTargetUnit: string | null = null;
  if (weightTarget) {
    if (preferredUnit) {
      const base = convertToBaseUnit(
        weightTarget.value,
        weightTarget.unit as UnitType,
        metricType
      );
      displayTargetValue = Number(
        convertFromBaseUnit(base, preferredUnit, metricType).toFixed(1)
      );
      displayTargetUnit = unitSignMap.get(preferredUnit) ?? preferredUnit;
    } else {
      displayTargetValue = Number(weightTarget.value.toFixed(1));
      displayTargetUnit =
        unitSignMap.get(weightTarget.unit) ?? weightTarget.unit;
    }
  }

  // compute delta between latest and previous measurement
  let deltaDisplay: string | null = null;
  let deltaPercentDisplay: string | null = null;
  if (showDelta && latestMeasurement) {
    const recent = await prisma.measurement.findMany({
      where: { userId, metricType },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    const previous = recent.length > 1 ? recent[1] : null;
    if (previous) {
      const deltaBase = latestMeasurement.metricValue - previous.metricValue;
      const sign = deltaBase >= 0 ? '+' : '-';
      if (preferredUnit) {
        const absDelta = Number(
          convertFromBaseUnit(
            Math.abs(deltaBase),
            preferredUnit,
            metricType
          ).toFixed(1)
        );
        deltaDisplay = `${sign}${absDelta} ${
          unitSignMap.get(preferredUnit) ?? preferredUnit
        }`;
      } else {
        const absDelta = Number(
          Math.abs(
            latestMeasurement.originalValue - previous.originalValue
          ).toFixed(1)
        );
        deltaDisplay = `${sign}${absDelta} ${
          unitSignMap.get(latestMeasurement.originalUnit) ??
          latestMeasurement.originalUnit
        }`;
      }

      if (previous.metricValue !== 0) {
        const percent = (deltaBase / previous.metricValue) * 100;
        deltaPercentDisplay = `${percent >= 0 ? '+' : ''}${percent.toFixed(
          1
        )}%`;
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getMetricDisplayName(metricType)}</CardTitle>
      </CardHeader>
      <CardContent>
        {latestMeasurement ? (
          <div className='flex flex-col gap-2'>
            <div className='text-2xl font-semibold'>
              {displayValue !== null
                ? displayValue
                : latestMeasurement.originalValue}{' '}
              {displayUnit}
            </div>
            <div className='text-sm text-muted-foreground'>
              Recorded on{' '}
              {new Date(latestMeasurement.createdAt).toLocaleDateString()}
            </div>
            {deltaDisplay && (
              <div className='text-sm'>
                Change since previous:{' '}
                <span className='font-medium'>{deltaDisplay}</span>{' '}
                {deltaPercentDisplay && (
                  <span className='text-muted-foreground'>
                    ({deltaPercentDisplay})
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className='text-sm text-muted-foreground'>
            No {getMetricDisplayName(metricType).toLowerCase()} recorded yet.
          </div>
        )}

        {weightTarget && (
          <div className='mt-4'>
            <div className='text-sm text-muted-foreground'>Target</div>
            <div className='text-lg font-medium'>
              {displayTargetValue !== null
                ? displayTargetValue
                : weightTarget.value}{' '}
              {displayTargetUnit}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className='mt-auto'>
        <CardAction>
          <Link href='/measurements' className='text-sm'>
            <Button className='px-3 py-1 cursor-pointer'>
              Update {getMetricDisplayName(metricType)}
            </Button>
          </Link>
        </CardAction>
      </CardFooter>
    </Card>
  );
}
