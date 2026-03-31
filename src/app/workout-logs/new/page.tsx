import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { startWorkoutLog } from '../actions';

type Props = {
  searchParams: Promise<{ workoutId?: string; scheduleEntryId?: string }>;
};

export default async function NewWorkoutLogPage({ searchParams }: Props) {
  const { workoutId, scheduleEntryId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  if (!workoutId) {
    redirect('/workout-logs');
  }

  const result = await startWorkoutLog(workoutId, scheduleEntryId);

  if (!result.success) {
    redirect('/workout-logs');
  }

  redirect(`/workout-logs/${result.data!.id}`);
}
