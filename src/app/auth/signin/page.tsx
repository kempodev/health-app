'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const router = useRouter();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const res = await signIn('credentials', {
        username: formData.get('username'),
        password: formData.get('password'),
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error(error);
      setError('An error occurred during sign in');
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <form onSubmit={handleSubmit} className='space-y-4 w-full max-w-sm p-8'>
        <h1 className='text-2xl font-bold mb-6'>Sign In</h1>

        {error && (
          <div className='bg-red-100 text-red-600 p-3 rounded'>{error}</div>
        )}

        <div>
          <label htmlFor='username' className='block mb-2'>
            Username
          </label>
          <input
            id='username'
            name='username'
            type='text'
            required
            className='w-full p-2 border rounded'
          />
        </div>

        <div>
          <label htmlFor='password' className='block mb-2'>
            Password
          </label>
          <input
            id='password'
            name='password'
            type='password'
            required
            className='w-full p-2 border rounded'
          />
        </div>

        <button
          type='submit'
          className='w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600'
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
