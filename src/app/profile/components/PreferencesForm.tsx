'use client';

import { useActionState, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UnitType } from '@prisma/client';
import { toast } from 'sonner';

import { saveUserPreferences } from '../actions';

type PreferencesFormProps = {
  initialWeightUnit: UnitType;
  initialLengthUnit: UnitType;
};

export function PreferencesForm({
  initialWeightUnit,
  initialLengthUnit,
}: PreferencesFormProps) {
  const [weightUnit, setWeightUnit] = useState<UnitType>(initialWeightUnit);
  const [lengthUnit, setLengthUnit] = useState<UnitType>(initialLengthUnit);
  const [state, submitAction, isPending] = useActionState(async () => {
    const response = await saveUserPreferences(
      new FormData(document.querySelector('form') as HTMLFormElement)
    );
    if (!response.success) {
      toast.error(response.error || 'Failed to save preferences');
    }
    if (response.success) {
      toast.success('Preferences saved successfully!');
    }
  }, null);

  return (
    <Card className='max-w-2xl'>
      <CardHeader>
        <CardTitle>Measurement Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={submitAction} className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='weightUnit'>Weight Unit</Label>
            <Select
              name='weightUnit'
              value={weightUnit}
              onValueChange={(value: UnitType) => setWeightUnit(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select weight unit' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='kg'>Kilograms (kg)</SelectItem>
                <SelectItem value='lbs'>Pounds (lbs)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='lengthUnit'>Length Unit</Label>
            <Select
              name='lengthUnit'
              value={lengthUnit}
              onValueChange={(value: UnitType) => setLengthUnit(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select length unit' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='cm'>Centimeters (cm)</SelectItem>
                <SelectItem value='inches'>Inches (in)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type='submit' disabled={isPending} className='cursor-pointer'>
            {isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
