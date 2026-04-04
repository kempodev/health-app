'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { convertFromBaseUnit } from '@/lib/utils';
import type { UnitType } from '@/app/types';
import type { WorkoutLogExercise } from '../types';

type LogSetRowProps = {
  set: WorkoutLogExercise;
  weightUnit: UnitType;
  onUpdate: (
    id: string,
    reps: number,
    weight: number | null,
    completed: boolean,
  ) => void;
};

export default function LogSetRow({
  set,
  weightUnit,
  onUpdate,
}: LogSetRowProps) {
  const displayWeight =
    set.weight_kg !== null
      ? convertFromBaseUnit(set.weight_kg, weightUnit, 'weight')
      : '';

  const [reps, setReps] = React.useState(set.reps.toString());
  const [weight, setWeight] = React.useState(displayWeight.toString());
  const [completed, setCompleted] = React.useState(set.completed);

  const handleBlur = () => {
    const r = parseInt(reps) || set.reps;
    const w = weight === '' ? null : parseFloat(weight);
    onUpdate(set.id, r, w, completed);
  };

  const handleCompletedChange = (checked: boolean) => {
    setCompleted(checked);
    const r = parseInt(reps) || set.reps;
    const w = weight === '' ? null : parseFloat(weight);
    onUpdate(set.id, r, w, checked);
  };

  return (
    <div className='flex items-center gap-6'>
      <span className='text-sm text-muted-foreground w-7 text-center font-medium'>
        {set.set_number}
      </span>
      <Input
        type='number'
        min='0'
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={handleBlur}
        className='h-10 flex-1 min-w-0 text-base'
        placeholder='Reps'
      />
      <Input
        type='number'
        min='0'
        step='0.5'
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={handleBlur}
        className='h-10 flex-1 min-w-0 text-base'
        placeholder={weightUnit}
      />
      <Checkbox
        checked={completed}
        onCheckedChange={handleCompletedChange}
        className='h-6 w-6'
      />
    </div>
  );
}
