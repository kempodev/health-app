'use client';

import * as React from 'react';
import Image from 'next/image';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getExerciseImageUrl } from '@/lib/exercises';
import { convertFromBaseUnit } from '@/lib/utils';
import type { UnitType } from '@/app/types';
import type { WorkoutExerciseWithDetails } from '../types';

type WorkoutExerciseRowProps = {
  exercise: WorkoutExerciseWithDetails;
  weightUnit: UnitType;
  onUpdate: (
    id: string,
    sets: number,
    reps: number,
    weight: number | null,
    restSeconds: number,
  ) => void;
  onRemove: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
};

export default function WorkoutExerciseRow({
  exercise,
  weightUnit,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: WorkoutExerciseRowProps) {
  const displayWeight =
    exercise.weight_kg !== null
      ? convertFromBaseUnit(exercise.weight_kg, weightUnit, 'weight')
      : '';

  const [sets, setSets] = React.useState(exercise.sets.toString());
  const [reps, setReps] = React.useState(exercise.reps.toString());
  const [weight, setWeight] = React.useState(displayWeight.toString());
  const [rest, setRest] = React.useState(exercise.rest_seconds.toString());

  const handleBlur = () => {
    const s = parseInt(sets) || exercise.sets;
    const r = parseInt(reps) || exercise.reps;
    const w = weight === '' ? null : parseFloat(weight);
    const rs = parseInt(rest) || exercise.rest_seconds;
    onUpdate(exercise.id, s, r, w, rs);
  };

  return (
    <div className='flex items-start gap-3 rounded-lg border p-3'>
      <div className='flex flex-col items-center gap-1 pt-1'>
        <Button
          size='icon'
          variant='ghost'
          className='h-8 w-8'
          disabled={isFirst}
          onClick={onMoveUp}
        >
          <ChevronUp className='h-4 w-4' />
        </Button>
        <Button
          size='icon'
          variant='ghost'
          className='h-8 w-8'
          disabled={isLast}
          onClick={onMoveDown}
        >
          <ChevronDown className='h-4 w-4' />
        </Button>
      </div>

      {exercise.exercise_images[0] && (
        <div className='relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md'>
          <Image
            src={getExerciseImageUrl(exercise.exercise_images[0])}
            alt={exercise.exercise_name}
            fill
            className='object-cover'
            sizes='56px'
          />
        </div>
      )}

      <div className='flex-1 min-w-0 space-y-2'>
        <div>
          <p className='font-medium text-sm truncate mb-2'>
            {exercise.exercise_name}
          </p>
          <div className='flex flex-wrap gap-1 mt-0.5'>
            {exercise.primary_muscles.map((m) => (
              <Badge key={m} variant='secondary' className='text-xs'>
                {m}
              </Badge>
            ))}
          </div>
        </div>

        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
          <div>
            <Label className='text-xs text-muted-foreground'>Sets</Label>
            <Input
              type='number'
              min='1'
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              onBlur={handleBlur}
              className='h-10 text-base'
            />
          </div>
          <div>
            <Label className='text-xs text-muted-foreground'>Reps</Label>
            <Input
              type='number'
              min='1'
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              onBlur={handleBlur}
              className='h-10 text-base'
            />
          </div>
          <div>
            <Label className='text-xs text-muted-foreground'>
              Weight ({weightUnit})
            </Label>
            <Input
              type='number'
              min='0'
              step='0.5'
              placeholder='BW'
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onBlur={handleBlur}
              className='h-10 text-base'
            />
          </div>
          <div>
            <Label className='text-xs text-muted-foreground'>Rest (s)</Label>
            <Input
              type='number'
              min='0'
              step='5'
              value={rest}
              onChange={(e) => setRest(e.target.value)}
              onBlur={handleBlur}
              className='h-10 text-base'
            />
          </div>
        </div>
      </div>

      <Button
        size='icon'
        variant='ghost'
        className='flex-shrink-0 text-destructive hover:text-destructive'
        onClick={() => onRemove(exercise.id)}
      >
        <Trash2 className='h-4 w-4' />
      </Button>
    </div>
  );
}

