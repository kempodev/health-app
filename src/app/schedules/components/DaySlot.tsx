'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DAY_LABELS, DayOfWeek } from '@/app/types';
import type { Workout } from '@/app/workouts/types';
import type { ScheduleEntryWithWorkout } from '../types';
import { addScheduleEntry, removeScheduleEntry } from '../actions';

type DaySlotProps = {
  day: DayOfWeek;
  scheduleId: string;
  entries: ScheduleEntryWithWorkout[];
  workouts: Workout[];
};

export default function DaySlot({
  day,
  scheduleId,
  entries,
  workouts,
}: DaySlotProps) {
  const [adding, setAdding] = React.useState(false);
  const [removeEntry, setRemoveEntry] = React.useState<ScheduleEntryWithWorkout | null>(null);

  const handleAdd = async (workoutId: string) => {
    setAdding(false);
    const result = await addScheduleEntry(scheduleId, workoutId, day);
    if (!result.success) {
      toast.error(result.error);
    }
  };

  const handleRemove = async (entryId: string) => {
    const result = await removeScheduleEntry(entryId, scheduleId);
    if (!result.success) {
      toast.error(result.error);
    }
  };

  const assignedWorkoutIds = entries.map((e) => e.workout_id);
  const availableWorkouts = workouts.filter(
    (w) => !assignedWorkoutIds.includes(w.id)
  );

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <h4 className="font-medium text-sm">{DAY_LABELS[day]}</h4>

      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between rounded-md bg-accent/50 px-2 py-1.5 text-sm"
        >
          <span className="truncate">{entry.workout.name}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => setRemoveEntry(entry)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {adding ? (
        <Select onValueChange={handleAdd}>
          <SelectTrigger className="text-sm h-8">
            <SelectValue placeholder="Select workout..." />
          </SelectTrigger>
          <SelectContent>
            {availableWorkouts.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => setAdding(true)}
          disabled={availableWorkouts.length === 0}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      )}
      <ConfirmDialog
        title='Remove Workout'
        description={`Remove "${removeEntry?.workout.name}" from ${DAY_LABELS[day]}?`}
        open={!!removeEntry}
        onOpenChange={(open) => { if (!open) setRemoveEntry(null); }}
        onConfirm={() => { if (removeEntry) handleRemove(removeEntry.id); }}
        confirmLabel='Remove'
        pendingLabel='Removing...'
      />
    </div>
  );
}
