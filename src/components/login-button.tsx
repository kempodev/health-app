import Link from 'next/link';
import { Button } from './ui/button';

export default function LoginButton({ onClick }: { onClick?: () => void }) {
  return (
    <Link href='/auth/login' onClick={onClick}>
      <Button className='cursor-pointer'>Login</Button>
    </Link>
  );
}
