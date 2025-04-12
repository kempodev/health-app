'use client';

import { useActionState, useState } from 'react';
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

const initialState = {
  success: false,
  error: '',
};

export function PreferencesForm({
  initialWeightUnit,
  initialLengthUnit,
}: PreferencesFormProps) {
  const [weightUnit, setWeightUnit] = useState<UnitType>(initialWeightUnit);
  const [lengthUnit, setLengthUnit] = useState<UnitType>(initialLengthUnit);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [state, submitAction, isPending] = useActionState(async () => {
    const formdata = new FormData(
      document.getElementById('preferences-form') as HTMLFormElement
    );
    const result = await saveUserPreferences(formdata);
    if (!result.success) {
      toast.error(result.error || 'Failed to save preferences');
      return { success: result.success, error: result.error };
    }

    toast.success('Preferences saved successfully!');
    return { success: result.success, error: '' };
  }, initialState);

  return (
    <form action={submitAction} id='preferences-form' className='space-y-6'>
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
  );
}
