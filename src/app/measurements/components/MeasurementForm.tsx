'use client';

import { useFormStatus } from 'react-dom';
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
import { useEffect, useState } from 'react';
import { MetricType, UnitType, metricConfigs } from '../types';
import { addMeasurement } from '../actions';

interface MeasurementFormProps {
  selectedMetric: MetricType;
  userPreferences?: {
    metricType: MetricType;
    unit: UnitType;
  }[];
}

export function MeasurementForm({
  selectedMetric,
  userPreferences = [],
}: MeasurementFormProps) {
  const [selectedUnit, setSelectedUnit] = useState<UnitType>(
    getInitialUnit(selectedMetric, userPreferences)
  );
  const [error, setError] = useState<string>('');

  // Update selected unit when metric changes
  useEffect(() => {
    setSelectedUnit(getInitialUnit(selectedMetric, userPreferences));
  }, [selectedMetric, userPreferences]);

  const handleSubmit = async (formData: FormData) => {
    const value = parseFloat(formData.get('value') as string);

    if (value < 0) {
      setError('Value cannot be negative');
      return;
    }

    setError('');
    const result = await addMeasurement(formData);

    if (result.error) {
      setError(result.error);
    }
  };

  const { pending } = useFormStatus();

  return (
    <form action={handleSubmit} className='space-y-4'>
      <input type='hidden' name='metricType' value={selectedMetric} />
      <input type='hidden' name='unit' value={selectedUnit} />

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='value'>{metricConfigs[selectedMetric].label}</Label>
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
            onChange={() => setError('')}
          />
          {error && <p className='text-sm text-red-500 mt-1'>{error}</p>}
        </div>
        <div>
          <Label htmlFor='unit'>Unit</Label>
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
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type='submit' disabled={pending}>
        {pending ? 'Adding...' : 'Add Entry'}
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
