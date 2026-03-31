'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Workout } from '@/app/workouts/types';
import type { WeeklyScheduleWithEntries } from '../types';
import { createSchedule, updateSchedule } from '../actions';
import WeekGrid from './WeekGrid';

type ScheduleFormProps = {
  schedule?: WeeklyScheduleWithEntries;
  workouts: Workout[];
};

export default function ScheduleForm({
  schedule,
  workouts,
}: ScheduleFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const isEditing = !!schedule;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);

    if (isEditing) {
      const result = await updateSchedule(schedule.id, formData);
      setIsSaving(false);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success('Schedule updated');
      }
    } else {
      const result = await createSchedule(formData);
      setIsSaving(false);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success('Schedule created');
        router.push(`/schedules/${result.data!.id}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={schedule?.name ?? ''}
            placeholder="e.g. PPL Split"
            required
          />
        </div>
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
              ? 'Save Changes'
              : 'Create Schedule'}
        </Button>
      </form>

      {isEditing && (
        <>
          <h3 className="text-lg font-semibold">Weekly Plan</h3>
          {workouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create some workouts first before assigning them to days.
            </p>
          ) : (
            <WeekGrid
              scheduleId={schedule.id}
              entries={schedule.entries}
              workouts={workouts}
            />
          )}
        </>
      )}
    </div>
  );
}
