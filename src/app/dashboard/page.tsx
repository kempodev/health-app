import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await auth();
  if (!session) redirect('/api/auth/signin?callbackUrl=/dashboard');
  return (
    <>
      <h1>Dashboard</h1>
      <p>Welcome to the dashboard, {session?.user?.name}!</p>
    </>
  );
}
