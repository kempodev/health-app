'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, Dumbbell, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Workout } from '../types';
import { duplicateWorkout } from '../actions';
import DeleteWorkoutDialog from './DeleteWorkoutDialog';

type WorkoutListProps = {
  workouts: Workout[];
};

export default function WorkoutList({ workouts }: WorkoutListProps) {
  if (workouts.length === 0) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        <Dumbbell className='h-12 w-12 mx-auto mb-4 opacity-50' />
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
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {workouts.map((workout) => (
        <WorkoutCard
          key={workout.id}
          workout={workout}
          onDuplicate={handleDuplicate}
        />
      ))}
    </div>
  );
}

function WorkoutCard({
  workout,
  onDuplicate,
}: {
  workout: Workout;
  onDuplicate: (id: string, name: string) => void;
}) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-workout-menu]')) return;
    router.push(`/workouts/${workout.id}`);
  };

  return (
    <Card className='cursor-pointer hover:bg-accent/50 transition-colors' onClick={handleCardClick}>
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between gap-2'>
          <CardTitle className='text-base'>
            {workout.name}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0' data-workout-menu>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem asChild>
                <Link href={`/workouts/${workout.id}`}>
                  <Pencil className='h-4 w-4 mr-2' />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDuplicate(workout.id, workout.name)}
              >
                <Copy className='h-4 w-4 mr-2' />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                className='text-destructive focus:text-destructive'
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {workout.description && (
          <p className='text-sm text-muted-foreground line-clamp-2'>
            {workout.description}
          </p>
        )}
        <p className='text-xs text-muted-foreground mt-1'>
          Updated {new Date(workout.updated_at).toLocaleDateString()}
        </p>
      </CardContent>
      <DeleteWorkoutDialog
        workoutId={workout.id}
        workoutName={workout.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </Card>
  );
}

