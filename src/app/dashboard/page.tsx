import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CurrentWeightCard from './components/CurrentWeightCard';

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

      <div className='flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-8'>
        <div className='flex-1'>
          <CurrentWeightCard userId={userId} userName={session?.user?.name} />
        </div>
      </div>
    </>
  );
}
