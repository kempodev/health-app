'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { deleteWorkout } from '../actions';

type DeleteWorkoutDialogProps = {
  workoutId: string;
  workoutName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function DeleteWorkoutDialog({
  workoutId,
  workoutName,
  open,
  onOpenChange,
}: DeleteWorkoutDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    const result = await deleteWorkout(workoutId);
    setIsPending(false);

    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success(`Deleted "${workoutName}"`);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Workout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{workoutName}&quot;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
