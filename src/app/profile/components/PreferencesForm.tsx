'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { saveUserPreferences } from '../actions';

interface PreferencesFormProps {
  initialWeightUnit: UnitType;
  initialLengthUnit: UnitType;
}

export function PreferencesForm({
  initialWeightUnit,
  initialLengthUnit,
}: PreferencesFormProps) {
  const [weightUnit, setWeightUnit] = useState<UnitType>(initialWeightUnit);
  const [lengthUnit, setLengthUnit] = useState<UnitType>(initialLengthUnit);
  const { pending } = useFormStatus();

  return (
    <Card className='max-w-2xl'>
      <CardHeader>
        <CardTitle>Measurement Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={saveUserPreferences} className='space-y-6'>
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

          <Button type='submit' disabled={pending}>
            {pending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
