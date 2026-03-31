import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { getWorkouts } from './actions';
import WorkoutList from './components/WorkoutList';

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const result = await getWorkouts();
  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workouts</h1>
        <Button asChild>
          <Link href="/workouts/new">
            <Plus className="h-4 w-4 mr-1" />
            New Workout
          </Link>
        </Button>
      </div>
      <WorkoutList workouts={result.data!} />
    </div>
  );
}
