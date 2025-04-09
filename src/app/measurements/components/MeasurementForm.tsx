'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MetricType, UnitType, metricConfigs } from '../types';
import { addMeasurement } from '../actions';

type MeasurementFormProps = {
  selectedMetric: MetricType;
  userPreferences?: {
    metricType: MetricType;
    unit: UnitType;
  }[];
};

const initialState = {
  success: false,
  error: '',
};

export function MeasurementForm({
  selectedMetric,
  userPreferences = [],
}: MeasurementFormProps) {
  const [selectedUnit, setSelectedUnit] = useState<UnitType>(
    getInitialUnit(selectedMetric, userPreferences)
  );

  const [state, submitAction, isPending] = useActionState(async () => {
    const formData = new FormData(
      document.querySelector('form') as HTMLFormElement
    );
    const result = await addMeasurement(formData);

    if (!result.success) {
      return { success: result.success, error: result.error };
    }

    toast.success('Measurement added successfully!');
    return { success: result.success, error: '' };
  }, initialState);

  // Update selected unit when metric changes
  useEffect(() => {
    setSelectedUnit(getInitialUnit(selectedMetric, userPreferences));
  }, [selectedMetric, userPreferences]);

  return (
    <form action={submitAction} className='space-y-4'>
      <input type='hidden' name='metricType' value={selectedMetric} />
      <input type='hidden' name='unit' value={selectedUnit} />

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='value' className='mb-2'>
            {metricConfigs[selectedMetric].label}
          </Label>
          <Input
            id='value'
            name='value'
            type='number'
            step='0.1'
            min='0'
            required
            placeholder={`Enter ${metricConfigs[
              selectedMetric
            ].label.toLowerCase()}`}
          />
          {state.error && (
            <p className='text-sm text-red-500 mt-2'>{state.error}</p>
          )}
        </div>
        <div>
          <Label htmlFor='unit' className='mb-2'>
            Unit
          </Label>
          <Select
            value={selectedUnit}
            onValueChange={(value: UnitType) => setSelectedUnit(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {metricConfigs[selectedMetric].units.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit === 'percentage' ? '%' : unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type='submit' disabled={isPending}>
        {isPending ? 'Adding...' : 'Add Entry'}
      </Button>
    </form>
  );
}

// Helper function to determine initial unit
function getInitialUnit(
  metricType: MetricType,
  preferences: { metricType: MetricType; unit: UnitType }[]
): UnitType {
  if (metricType === 'body_fat') {
    return 'percentage';
  }

  const preference = preferences.find((pref) => pref.metricType === metricType);
  return preference?.unit || metricConfigs[metricType].units[0];
}
