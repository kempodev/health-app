import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { DAY_LABELS, DayOfWeek } from '@/app/types';
import { getWorkoutLogs } from './actions';
import { getActiveSchedule } from '@/app/schedules/actions';
import WorkoutLogList from './components/WorkoutLogList';
import StartWorkoutButton from './components/StartWorkoutButton';

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

  // Determine today's workouts from active schedule
  const today = new Date().getDay();
  // Convert JS day (0=Sun) to our format (0=Mon)
  const dayOfWeek: DayOfWeek = (today === 0 ? 6 : today - 1) as DayOfWeek;
  const todaysEntries =
    scheduleResult.data?.entries.filter((e) => e.day_of_week === dayOfWeek) ??
    [];

  // Get unique workouts from the schedule that aren't in today's entries
  const todaysWorkoutIds = new Set(todaysEntries.map((e) => e.workout_id));
  const otherEntries = scheduleResult.data?.entries
    .filter((e) => !todaysWorkoutIds.has(e.workout_id))
    .filter(
      (e, i, arr) => arr.findIndex((a) => a.workout_id === e.workout_id) === i,
    ) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Workout Log</h1>

      {!scheduleResult.data ? (
        <p className="text-sm text-muted-foreground">
          No active schedule.{' '}
          <Link href="/schedules" className="underline">
            Create a schedule
          </Link>{' '}
          to start logging workouts.
        </p>
      ) : (
        <div className="rounded-lg border p-4 space-y-3">
          {todaysEntries.length > 0 ? (
            <>
              <h2 className="font-semibold text-sm text-muted-foreground">
                Today&apos;s Workouts ({DAY_LABELS[dayOfWeek]})
              </h2>
              <div className="flex flex-wrap gap-2">
                {todaysEntries.map((entry) => (
                  <StartWorkoutButton
                    key={entry.id}
                    workoutId={entry.workout_id}
                    workoutName={entry.workout.name}
                    scheduleEntryId={entry.id}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No workouts scheduled for today ({DAY_LABELS[dayOfWeek]}).
            </p>
          )}
          {otherEntries.length > 0 && (
            <>
              <h2 className="font-semibold text-sm text-muted-foreground">
                Other Workouts
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherEntries.map((entry) => (
                  <StartWorkoutButton
                    key={entry.id}
                    workoutId={entry.workout_id}
                    workoutName={entry.workout.name}
                    variant="ghost"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <h2 className="text-lg font-semibold">History</h2>
      <WorkoutLogList logs={logsResult.data!} />
    </div>
  );
}
