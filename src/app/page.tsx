import { auth } from '@/lib/auth';

export default async function Home() {
  const session = await auth();
  return (
    <>
      <h1 className='text-3xl font-bold mb-2'>Home</h1>
      <p>
        {session
          ? `Signed in as ${session.user?.email ?? 'unknown email'}`
          : 'Not signed in'}
      </p>
    </>
  );
}
