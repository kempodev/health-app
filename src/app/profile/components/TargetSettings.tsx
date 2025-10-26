'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { saveTargets } from '../actions';
import { toast } from 'sonner';
import { useActionState } from 'react';
import { metricConfigs, MetricType, UnitType } from '@/app/types';

const convertValue = (
  value: number,
  fromUnit: UnitType,
  toUnit: UnitType
): number => {
  if (fromUnit === toUnit) return value;

  // Convert to metric first
  let metricValue = value;
  if (fromUnit === 'lbs') metricValue = value * 0.453592;
  if (fromUnit === 'inches') metricValue = value * 2.54;

  // Then convert to target unit
  if (toUnit === 'lbs') return metricValue / 0.453592;
  if (toUnit === 'inches') return metricValue / 2.54;

  return metricValue;
};

function getPreferredUnit(
  metricType: MetricType,
  preferences: TargetSettingsProps['userPreferences']
): UnitType {
  if (metricType === 'body_fat') return 'percentage';
  const pref = preferences.find((p) => p.metricType === metricType);
  return pref?.unit || metricConfigs[metricType].units[0];
}

type Target = {
  metricType: MetricType;
  value: number;
  unit: UnitType;
};

type TargetSettingsProps = {
  initialTargets: Target[];
  userPreferences: {
    metricType: MetricType;
    unit: UnitType;
  }[];
};

const initialState = {
  success: false,
  error: '',
};

export function TargetSettings({
  initialTargets,
  userPreferences,
}: TargetSettingsProps) {
  const [prevPreferences, setPrevPreferences] = useState(userPreferences);

  const [targets, setTargets] = useState<Target[]>(() => {
    return Object.keys(metricConfigs).map((metric) => {
      const existingTarget = initialTargets.find(
        (t) => t.metricType === (metric as MetricType)
      );
      const preferredUnit = getPreferredUnit(
        metric as MetricType,
        userPreferences
      );

      if (existingTarget) {
        // If the target exists but has a different unit, convert the value
        if (existingTarget.unit !== preferredUnit) {
          return {
            ...existingTarget,
            value: convertValue(
              existingTarget.value,
              existingTarget.unit,
              preferredUnit
            ),
            unit: preferredUnit,
          };
        }
        return existingTarget;
      }

      // If no target exists, create a new one with preferred unit
      return {
        metricType: metric as MetricType,
        value: 0,
        unit: preferredUnit,
      };
    });
  });

  // useEffect to handle preference changes
  useEffect(() => {
    const preferencesChanged = userPreferences.some(
      (pref, index) => prevPreferences[index]?.unit !== pref.unit
    );

    if (preferencesChanged) {
      setTargets((prevTargets) =>
        prevTargets.map((target) => {
          const newUnit = getPreferredUnit(target.metricType, userPreferences);
          if (newUnit === target.unit) return target;

          return {
            ...target,
            value: convertValue(target.value, target.unit, newUnit),
            unit: newUnit,
          };
        })
      );
      setPrevPreferences(userPreferences);
    }
  }, [userPreferences, prevPreferences]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [state, submitAction, isPending] = useActionState(async () => {
    const formData = new FormData(
      document.getElementById('targets-form') as HTMLFormElement
    );

    const targetsToDelete: MetricType[] = [];

    targets.forEach((target) => {
      if (target.value === 0) {
        targetsToDelete.push(target.metricType);
      } else {
        formData.append('targets', JSON.stringify(target));
      }
    });

    targetsToDelete.forEach((metricType) => {
      formData.append('targetsToDelete', JSON.stringify(metricType));
    });

    const result = await saveTargets(formData);
    if (!result.success) {
      toast.error(result.error || 'Failed to save targets');
      return { success: result.success, error: result.error };
    }

    toast.success('Targets saved successfully');
    return { success: result.success, error: '' };
  }, initialState);

  const handleTargetChange = (metricType: MetricType, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (isNaN(numValue)) return;

    setTargets((prev) =>
      prev.map((target) =>
        target.metricType === metricType
          ? { ...target, value: numValue }
          : target
      )
    );
  };

  return (
    <form action={submitAction} id='targets-form' className='space-y-4'>
      <div className='grid gap-4'>
        {Object.entries(metricConfigs).map(([metric, config]) => {
          const target = targets.find(
            (t) => t.metricType === (metric as MetricType)
          );
          const unit = getPreferredUnit(metric as MetricType, userPreferences);

          return (
            <div key={metric} className='grid grid-cols-2 gap-4 items-center'>
              <Label htmlFor={`target-${metric}`}>{config.label} Target</Label>
              <div className='flex gap-2 items-center'>
                <Input
                  id={`target-${metric}`}
                  type='number'
                  step='0.1'
                  value={target?.value?.toString() || ''}
                  onChange={(e) =>
                    handleTargetChange(metric as MetricType, e.target.value)
                  }
                  min={0}
                  placeholder={`Enter target ${config.label.toLowerCase()}`}
                />
                <span className='w-16'>
                  {unit === 'percentage' ? '%' : unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <Button type='submit' disabled={isPending} className='cursor-pointer'>
        {isPending ? 'Saving...' : 'Save Targets'}
      </Button>
    </form>
  );
}
