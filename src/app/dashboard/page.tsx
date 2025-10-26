import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MeasurementCard from './components/MeasurementCard';

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect('/api/auth/signin?callbackUrl=/dashboard');

  const userId = session.user.id;

  return (
    <>
      <div>
        <h1 className='text-3xl font-bold mb-2'>Dashboard</h1>
        <p className='mb-6'>Welcome to the dashboard, {session?.user?.name}!</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        <MeasurementCard userId={userId} metricType='weight' />
        <MeasurementCard userId={userId} metricType='waist' />
        <MeasurementCard userId={userId} metricType='body_fat' />
      </div>
    </>
  );
}
