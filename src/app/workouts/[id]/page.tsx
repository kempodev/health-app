import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { getUserPreferences } from '@/lib/actions';
import { getWorkout } from '../actions';
import WorkoutForm from '../components/WorkoutForm';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditWorkoutPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [workoutResult, prefsResult] = await Promise.all([
    getWorkout(id),
    getUserPreferences(),
  ]);

  if (!workoutResult.success) {
    return <div>Error: {workoutResult.error}</div>;
  }

  const weightUnit =
    prefsResult.data?.find((p) => p.metric_type === 'weight')?.unit ?? 'kg';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workouts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Workout</h1>
      </div>
      <WorkoutForm workout={workoutResult.data!} weightUnit={weightUnit} />
    </div>
  );
}
