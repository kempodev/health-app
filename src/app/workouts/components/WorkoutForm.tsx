'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Exercise, UnitType } from '@/app/types';
import type { WorkoutWithExercises } from '../types';
import {
  createWorkout,
  updateWorkout,
  addExerciseToWorkout,
  updateWorkoutExercise,
  removeExerciseFromWorkout,
  reorderWorkoutExercises,
} from '../actions';
import WorkoutExerciseList from './WorkoutExerciseList';
import ExerciseBrowser from './ExerciseBrowser';

type WorkoutFormProps = {
  workout?: WorkoutWithExercises;
  weightUnit: UnitType;
};

export default function WorkoutForm({ workout, weightUnit }: WorkoutFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [browserOpen, setBrowserOpen] = React.useState(false);
  const isEditing = !!workout;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);

    if (isEditing) {
      const result = await updateWorkout(workout.id, formData);
      setIsSaving(false);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success('Workout updated');
      }
    } else {
      const result = await createWorkout(formData);
      setIsSaving(false);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success('Workout created');
        router.push(`/workouts/${result.data!.id}`);
      }
    }
  };

  const handleAddExercise = async (exercise: Exercise) => {
    if (!workout) {
      toast.error('Save the workout first before adding exercises');
      return;
    }
    const result = await addExerciseToWorkout(
      workout.id,
      exercise.id,
      3,
      10,
      null,
      weightUnit,
      60,
    );
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success(`Added ${exercise.name}`);
    }
  };

  const handleUpdateExercise = async (
    id: string,
    sets: number,
    reps: number,
    weight: number | null,
    restSeconds: number,
  ) => {
    if (!workout) return;
    const result = await updateWorkoutExercise(
      id,
      workout.id,
      sets,
      reps,
      weight,
      weightUnit,
      restSeconds,
    );
    if (!result.success) {
      toast.error(result.error);
    }
  };

  const handleRemoveExercise = async (id: string) => {
    if (!workout) return;
    const result = await removeExerciseFromWorkout(id, workout.id);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success('Exercise removed');
    }
  };

  const handleReorder = async (exerciseIds: string[]) => {
    if (!workout) return;
    const result = await reorderWorkoutExercises(workout.id, exerciseIds);
    if (!result.success) {
      toast.error(result.error);
    }
  };

  return (
    <div className='space-y-6'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <Label htmlFor='name' className='mb-2'>
            Name
          </Label>
          <Input
            id='name'
            name='name'
            defaultValue={workout?.name ?? ''}
            placeholder='e.g. Push Day'
            required
          />
        </div>
        <div>
          <Label htmlFor='description' className='mb-2'>
            Description
          </Label>
          <Textarea
            id='description'
            name='description'
            defaultValue={workout?.description ?? ''}
            placeholder='Optional description...'
            rows={2}
          />
        </div>
        <Button type='submit' disabled={isSaving}>
          {isSaving
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
              ? 'Save Changes'
              : 'Create Workout'}
        </Button>
      </form>

      {isEditing && (
        <>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Exercises</h3>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setBrowserOpen(true)}
            >
              <Plus className='h-4 w-4 mr-1' />
              Add Exercise
            </Button>
          </div>

          <WorkoutExerciseList
            exercises={workout.exercises}
            weightUnit={weightUnit}
            onUpdate={handleUpdateExercise}
            onRemove={handleRemoveExercise}
            onReorder={handleReorder}
          />

          <ExerciseBrowser
            open={browserOpen}
            onOpenChange={setBrowserOpen}
            onSelect={handleAddExercise}
          />
        </>
      )}
    </div>
  );
}

