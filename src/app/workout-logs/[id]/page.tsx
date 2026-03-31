import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { getUserPreferences } from '@/lib/actions';
import { getWorkoutLog } from '../actions';
import WorkoutLogForm from '../components/WorkoutLogForm';
import WorkoutLogDetail from '../components/WorkoutLogDetail';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WorkoutLogPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [logResult, prefsResult] = await Promise.all([
    getWorkoutLog(id),
    getUserPreferences(),
  ]);

  if (!logResult.success) {
    return <div>Error: {logResult.error}</div>;
  }

  const weightUnit =
    prefsResult.data?.find((p) => p.metric_type === 'weight')?.unit ?? 'kg';

  const log = logResult.data!;
  const isActive = !log.completed_at;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workout-logs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {isActive ? 'Active Workout' : 'Workout Log'}
        </h1>
      </div>

      {isActive ? (
        <WorkoutLogForm log={log} weightUnit={weightUnit} />
      ) : (
        <WorkoutLogDetail log={log} weightUnit={weightUnit} />
      )}
    </div>
  );
}
