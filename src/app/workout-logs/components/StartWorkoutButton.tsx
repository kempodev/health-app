'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/confirm-dialog';

type StartWorkoutButtonProps = {
  workoutId: string;
  workoutName: string;
  scheduleEntryId?: string;
  variant?: 'outline' | 'ghost';
};

export default function StartWorkoutButton({
  workoutId,
  workoutName,
  scheduleEntryId,
  variant = 'outline',
}: StartWorkoutButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleConfirm = () => {
    const params = new URLSearchParams({ workoutId });
    if (scheduleEntryId) params.set('scheduleEntryId', scheduleEntryId);
    router.push(`/workout-logs/new?${params.toString()}`);
  };

  return (
    <>
      <Button variant={variant} className="max-w-full" onClick={() => setConfirmOpen(true)}>
        <Play className="h-4 w-4 mr-1 shrink-0" />
        <span className="truncate">{workoutName}</span>
      </Button>
      <ConfirmDialog
        title="Start Workout"
        description={`Start "${workoutName}"?`}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirm}
        confirmLabel="Start"
        pendingLabel="Starting..."
      />
    </>
  );
}
