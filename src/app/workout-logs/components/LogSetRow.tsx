'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
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
    completed: boolean
  ) => void;
  onRemove: (id: string) => void;
};

export default function LogSetRow({
  set,
  weightUnit,
  onUpdate,
  onRemove,
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
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-6 text-center">
        {set.set_number}
      </span>
      <Input
        type="number"
        min="0"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={handleBlur}
        className="h-8 w-16 text-sm"
        placeholder="Reps"
      />
      <Input
        type="number"
        min="0"
        step="0.5"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={handleBlur}
        className="h-8 w-20 text-sm"
        placeholder={weightUnit}
      />
      <Checkbox
        checked={completed}
        onCheckedChange={handleCompletedChange}
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 text-muted-foreground"
        onClick={() => onRemove(set.id)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
