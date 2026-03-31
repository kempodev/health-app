import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { getWorkouts } from '@/app/workouts/actions';
import { getSchedule } from '../actions';
import ScheduleForm from '../components/ScheduleForm';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditSchedulePage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [scheduleResult, workoutsResult] = await Promise.all([
    getSchedule(id),
    getWorkouts(),
  ]);

  if (!scheduleResult.success) {
    return <div>Error: {scheduleResult.error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/schedules">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Schedule</h1>
      </div>
      <ScheduleForm
        schedule={scheduleResult.data!}
        workouts={workoutsResult.data ?? []}
      />
    </div>
  );
}
