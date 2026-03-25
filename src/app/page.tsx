import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <h1 className='text-3xl font-bold mb-2'>Home</h1>
      <p>
        {user
          ? `Signed in as ${user.email ?? 'unknown email'}`
          : 'Not signed in'}
      </p>
    </>
  );
}
