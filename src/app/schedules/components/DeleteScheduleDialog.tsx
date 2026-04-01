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
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { deleteSchedule } from '../actions';

type DeleteScheduleDialogProps = {
  scheduleId: string;
  scheduleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function DeleteScheduleDialog({
  scheduleId,
  scheduleName,
  open,
  onOpenChange,
}: DeleteScheduleDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    const result = await deleteSchedule(scheduleId);
    setIsPending(false);

    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success(`Deleted "${scheduleName}"`);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{scheduleName}&quot;? This
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
