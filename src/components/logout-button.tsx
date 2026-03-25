'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

export default function LogoutButton({ onClick }: { onClick?: () => void }) {
  const router = useRouter();

  const handleLogout = async () => {
    onClick?.();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <Button className='cursor-pointer' onClick={handleLogout}>
      Logout
    </Button>
  );
}
