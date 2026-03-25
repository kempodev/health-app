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
import { createClient } from '@/lib/supabase/server';
import {
  convertFromBaseUnit,
  convertToBaseUnit,
  getMetricDisplayName,
  unitSignMap,
} from '@/lib/utils';
import { type UnitType, type MetricType } from '@/app/types';

type Measurement = {
  id: string;
  user_id: string;
  metric_type: MetricType;
  metric_value: number;
  original_value: number;
  original_unit: UnitType;
  created_at: string;
};

type Target = {
  value: number;
  unit: UnitType;
};

type Props = {
  metricType: MetricType;
  measurement?: Measurement | null;
  target?: Target | null;
  userPreferenceUnit?: UnitType | null;
  showDelta?: boolean;
};

export default async function MeasurementCard({
  metricType,
  measurement = null,
  target = null,
  userPreferenceUnit = null,
  showDelta = true,
}: Props) {
  const supabase = await createClient();

  // If measurement/target/pref not passed, fetch them
  let latestMeasurement: Measurement | null = measurement;
  if (!latestMeasurement) {
    const { data } = await supabase
      .from('measurements')
      .select('*')
      .eq('metric_type', metricType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    latestMeasurement = data as Measurement | null;
  }

  let weightTarget: Target | null = target;
  if (!weightTarget) {
    const { data } = await supabase
      .from('measurement_targets')
      .select('value, unit')
      .eq('metric_type', metricType)
      .maybeSingle();
    weightTarget = data as Target | null;
  }

  let userPref: UnitType | null = userPreferenceUnit;
  if (!userPref) {
    const { data } = await supabase
      .from('user_preferences')
      .select('unit')
      .eq('metric_type', metricType)
      .maybeSingle();
    userPref = (data?.unit as UnitType) ?? null;
  }

  const preferredUnit = userPref as UnitType | undefined;

  // compute display values taking preference into account
  let displayValue: number | null = null;
  let displayUnit: string | null = null;
  if (latestMeasurement) {
    if (preferredUnit) {
      displayValue = Number(
        convertFromBaseUnit(
          latestMeasurement.metric_value,
          preferredUnit,
          metricType
        ).toFixed(1)
      );
      displayUnit = unitSignMap.get(preferredUnit) ?? preferredUnit;
    } else {
      displayValue = Number(latestMeasurement.original_value.toFixed(1));
      displayUnit =
        unitSignMap.get(latestMeasurement.original_unit) ??
        latestMeasurement.original_unit;
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
    const { data: recent } = await supabase
      .from('measurements')
      .select('*')
      .eq('metric_type', metricType)
      .order('created_at', { ascending: false })
      .limit(2);

    const recentMeasurements = (recent as Measurement[]) ?? [];
    const previous = recentMeasurements.length > 1 ? recentMeasurements[1] : null;
    if (previous) {
      const deltaBase = latestMeasurement.metric_value - previous.metric_value;
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
            latestMeasurement.original_value - previous.original_value
          ).toFixed(1)
        );
        deltaDisplay = `${sign}${absDelta} ${
          unitSignMap.get(latestMeasurement.original_unit) ??
          latestMeasurement.original_unit
        }`;
      }

      if (previous.metric_value !== 0) {
        const percent = (deltaBase / previous.metric_value) * 100;
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
                : latestMeasurement.original_value}{' '}
              {displayUnit}
            </div>
            <div className='text-sm text-muted-foreground'>
              Recorded on{' '}
              {new Date(latestMeasurement.created_at).toLocaleDateString()}
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
