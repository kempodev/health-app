'use client';

import Link from 'next/link';
import { Copy, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Workout } from '../types';
import { duplicateWorkout } from '../actions';
import DeleteWorkoutDialog from './DeleteWorkoutDialog';

type WorkoutListProps = {
  workouts: Workout[];
};

export default function WorkoutList({ workouts }: WorkoutListProps) {
  if (workouts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No workouts yet. Create your first workout to get started.</p>
      </div>
    );
  }

  const handleDuplicate = async (id: string, name: string) => {
    const result = await duplicateWorkout(id);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success(`Duplicated "${name}"`);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workouts.map((workout) => (
        <Card key={workout.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Link
                href={`/workouts/${workout.id}`}
                className="hover:underline"
              >
                {workout.name}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            {workout.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {workout.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Updated {new Date(workout.updated_at).toLocaleDateString()}
            </p>
          </CardContent>
          <CardFooter className="gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/workouts/${workout.id}`}>Edit</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleDuplicate(workout.id, workout.name)}
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <DeleteWorkoutDialog
              workoutId={workout.id}
              workoutName={workout.name}
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
