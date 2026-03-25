import Link from 'next/link';
import { Button } from './ui/button';

export default function LoginButton() {
  return (
    <Link href='/auth/login'>
      <Button className='cursor-pointer'>Login</Button>
    </Link>
  );
}
