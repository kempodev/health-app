'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  ChevronDown,
  ChevronRight,
  Info,
  MessageSquare,
  Minus,
  Plus,
  Timer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getExerciseById, getExerciseImageUrl } from '@/lib/exercises';
import type { Exercise, UnitType } from '@/app/types';
import type { WorkoutLogExercise } from '../types';
import ExerciseDetailSheet from '@/app/workouts/components/ExerciseDetailSheet';
import ExerciseNoteSheet from './ExerciseNoteSheet';
import LogSetRow from './LogSetRow';

type LogExerciseRowProps = {
  exerciseId: string;
  position: number;
  sets: WorkoutLogExercise[];
  weightUnit: UnitType;
  restSeconds: number;
  onUpdateSet: (
    id: string,
    reps: number,
    weight: number | null,
    completed: boolean,
  ) => void;
  onRemoveSet: (id: string) => void;
  onAddSet: (exerciseId: string, position: number) => void;
  onUpdateNote: (position: number, notes: string) => void;
  expanded: boolean;
  onToggle: () => void;
};

export default function LogExerciseRow({
  exerciseId,
  position,
  sets,
  weightUnit,
  restSeconds,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
  onUpdateNote,
  expanded,
  onToggle,
}: LogExerciseRowProps) {
  const exercise = getExerciseById(exerciseId);
  const [detailExercise, setDetailExercise] = React.useState<Exercise | null>(
    null,
  );
  const [noteSheetOpen, setNoteSheetOpen] = React.useState(false);

  const completedCount = sets.filter((s) => s.completed).length;
  const allCompleted = completedCount === sets.length;
  const note = sets.find((s) => s.set_number === 1)?.notes ?? '';
  const hasNote = note.trim().length > 0;

  return (
    <>
      <div className='rounded-lg border p-3 space-y-3'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            className='flex items-center gap-3 flex-1 min-w-0 text-left'
            onClick={onToggle}
          >
            {expanded ? (
              <ChevronDown className='h-4 w-4 shrink-0 text-muted-foreground' />
            ) : (
              <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground' />
            )}
            {exercise?.images[0] && (
              <div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md'>
                <Image
                  src={getExerciseImageUrl(exercise.images[0])}
                  alt={exercise.name}
                  fill
                  className='object-cover'
                  sizes='40px'
                />
              </div>
            )}
            <div className='flex-1 min-w-0'>
              <span className='font-medium text-sm truncate block'>
                {exercise?.name ?? exerciseId}
              </span>
              <div className='flex flex-wrap items-center gap-1 mt-0.5'>
                {!expanded && (
                  <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                    {completedCount}/{sets.length} sets
                    {allCompleted && ' \u2713'}
                    {hasNote && (
                      <MessageSquare className='h-3 w-3 text-muted-foreground' />
                    )}
                  </span>
                )}
                {expanded && exercise?.primaryMuscles.map((m) => (
                  <Badge key={m} variant='secondary' className='text-xs'>
                    {m}
                  </Badge>
                ))}
                {expanded && restSeconds > 0 && (
                  <span className='inline-flex items-center gap-0.5 text-xs text-muted-foreground ml-1'>
                    <Timer className='h-3 w-3' />
                    {restSeconds}s
                  </span>
                )}
              </div>
            </div>
          </button>
          {expanded && (
            <>
              <button
                type='button'
                aria-label={hasNote ? 'Edit note' : 'Add note'}
                className={`shrink-0 p-2 ${
                  hasNote
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setNoteSheetOpen(true)}
              >
                <MessageSquare
                  className='h-4 w-4'
                  fill={hasNote ? 'currentColor' : 'none'}
                />
              </button>
              {exercise && (
                <button
                  type='button'
                  className='shrink-0 p-2 text-muted-foreground hover:text-foreground'
                  onClick={() => setDetailExercise(exercise)}
                >
                  <Info className='h-4 w-4' />
                </button>
              )}
            </>
          )}
        </div>

        {expanded && (
          <>
            <div className='space-y-1.5'>
              <div className='flex items-center gap-2 text-xs text-muted-foreground px-1'>
                <span className='w-7 text-center'>Set</span>
                <span className='flex-1'>Reps</span>
                <span className='flex-1'>Weight</span>
                <span className='w-6 text-center'>Done</span>
              </div>
              {sets.map((set) => (
                <LogSetRow
                  key={set.id}
                  set={set}
                  weightUnit={weightUnit}
                  onUpdate={onUpdateSet}
                />
              ))}
            </div>

            <div className='flex justify-between'>
              <Button
                variant='ghost'
                size='default'
                className='text-sm'
                onClick={() => onAddSet(exerciseId, position)}
              >
                <Plus className='h-4 w-4 mr-1' />
                Add Set
              </Button>
              {sets.length > 1 && (
                <Button
                  variant='ghost'
                  size='default'
                  className='text-sm text-destructive hover:text-destructive'
                  onClick={() => onRemoveSet(sets[sets.length - 1].id)}
                >
                  <Minus className='h-4 w-4 mr-1' />
                  Remove Set
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      <ExerciseDetailSheet
        exercise={detailExercise}
        open={!!detailExercise}
        onOpenChange={(open) => {
          if (!open) setDetailExercise(null);
        }}
      />
      <ExerciseNoteSheet
        exerciseName={exercise?.name ?? exerciseId}
        initialNote={note}
        open={noteSheetOpen}
        onOpenChange={setNoteSheetOpen}
        onSave={(updated) => onUpdateNote(position, updated)}
      />
    </>
  );
}
