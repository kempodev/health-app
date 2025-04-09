import React from 'react';
import { Button } from './ui/button';
import { signIn } from 'next-auth/react';

export default function LoginButton() {
  return (
    <Button
      className='cursor-pointer'
      onClick={() => signIn(undefined, { redirectTo: '/dashboard' })}
    >
      Login
    </Button>
  );
}
