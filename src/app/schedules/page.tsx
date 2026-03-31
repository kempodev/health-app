import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { getSchedules } from './actions';
import ScheduleList from './components/ScheduleList';

export default async function SchedulesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const result = await getSchedules();
  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Weekly Schedules</h1>
        <Button asChild>
          <Link href="/schedules/new">
            <Plus className="h-4 w-4 mr-1" />
            New Schedule
          </Link>
        </Button>
      </div>
      <ScheduleList schedules={result.data!} />
    </div>
  );
}
