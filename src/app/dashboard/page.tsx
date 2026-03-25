import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MeasurementCard from './components/MeasurementCard';

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email;

  return (
    <>
      <div>
        <h1 className='text-3xl font-bold mb-2'>Dashboard</h1>
        <p className='mb-6'>Welcome to the dashboard, {displayName}!</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        <MeasurementCard metricType='weight' />
        <MeasurementCard metricType='waist' />
        <MeasurementCard metricType='body_fat' />
      </div>
    </>
  );
}
