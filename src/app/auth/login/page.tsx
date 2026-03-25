'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOAuth = async (provider: 'github' | 'google') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className='flex justify-center mt-12'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle className='text-center'>Sign in to Health App</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className='flex flex-col gap-3'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error && <p className='text-sm text-red-500'>{error}</p>}
              <Button
                type='submit'
                className='w-full cursor-pointer'
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send login code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className='flex flex-col gap-3'>
              <p className='text-sm text-muted-foreground'>
                Enter the 6-digit code sent to {email}
              </p>
              <Label htmlFor='otp'>Code</Label>
              <Input
                id='otp'
                type='text'
                inputMode='numeric'
                placeholder='123456'
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
              />
              {error && <p className='text-sm text-red-500'>{error}</p>}
              <Button
                type='submit'
                className='w-full cursor-pointer'
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify code'}
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='w-full cursor-pointer'
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError('');
                }}
              >
                Use a different email
              </Button>
            </form>
          )}

          <div className='relative my-2'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-card px-2 text-muted-foreground'>or</span>
            </div>
          </div>

          <Button
            className='w-full cursor-pointer'
            variant='outline'
            onClick={() => handleOAuth('github')}
          >
            Sign in with GitHub
          </Button>
          <Button
            className='w-full cursor-pointer'
            variant='outline'
            onClick={() => handleOAuth('google')}
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
