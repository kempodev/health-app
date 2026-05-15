import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getWorkoutLogs } from './actions';
import { getActiveSchedule } from '@/app/schedules/actions';
import WorkoutLogList from './components/WorkoutLogList';
import TodaysWorkoutsSection from './components/TodaysWorkoutsSection';

export default async function WorkoutLogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [logsResult, scheduleResult] = await Promise.all([
    getWorkoutLogs(),
    getActiveSchedule(),
  ]);

  if (!logsResult.success) {
    return <div>Error: {logsResult.error}</div>;
  }

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>Workout Log</h1>

      {!scheduleResult.data ? (
        <p className='text-sm text-muted-foreground'>
          No active schedule.{' '}
          <Link href='/schedules' className='underline'>
            Create a schedule
          </Link>{' '}
          to start logging workouts.
        </p>
      ) : (
        <div className='rounded-lg border p-4'>
          <TodaysWorkoutsSection entries={scheduleResult.data.entries} />
        </div>
      )}

      <h2 className='text-lg font-semibold'>History</h2>
      <WorkoutLogList logs={logsResult.data!} />
    </div>
  );
}
