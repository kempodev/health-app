'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { ModeToggle } from './mode-toggle';
import LogoutButton from './logout-button';
import LoginButton from './login-button';

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { data: session } = useSession();

  return (
    <nav className='border-b'>
      <div className='flex h-16 items-center px-4 container mx-auto'>
        <div className='mr-4 hidden md:flex'>
          <Link href='/' className='mr-6 flex items-center space-x-2'>
            <span className='hidden font-bold sm:inline-block'>Health App</span>
          </Link>
          {session && (
            <div className='flex items-center'>
              <Link
                href='/dashboard'
                className='mr-6 text-sm font-medium transition-colors hover:text-primary'
              >
                Dashboard
              </Link>
              <Link
                href='/measurements'
                className='mr-6 text-sm font-medium transition-colors hover:text-primary'
              >
                Measurements
              </Link>
              <Link
                href='/profile'
                className='text-sm font-medium transition-colors hover:text-primary'
              >
                Profile
              </Link>
            </div>
          )}
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant='ghost'
              className='mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden'
            >
              <Menu className='h-6 w-6' />
              <span className='sr-only'>Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='pr-0'>
            <SheetTitle className='ml-4 mt-4'>Health App</SheetTitle>
            <div className='ml-4'>
              <MobileLink href='/' onOpenChange={setIsOpen}>
                Home
              </MobileLink>
              {session && (
                <>
                  <MobileLink href='/dashboard' onOpenChange={setIsOpen}>
                    Dashboard
                  </MobileLink>
                  <MobileLink href='/measurements' onOpenChange={setIsOpen}>
                    Measurements
                  </MobileLink>
                  <MobileLink href='/profile' onOpenChange={setIsOpen}>
                    Profile
                  </MobileLink>
                </>
              )}
              <div className='mt-4'>
                {session ? <LogoutButton /> : <LoginButton />}
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className='flex flex-1 items-center space-x-4 justify-end'>
          <ModeToggle />
          <div className='w-full flex-1 md:w-auto md:flex-none hidden md:block'>
            {session ? <LogoutButton /> : <LoginButton />}
          </div>
        </div>
      </div>
    </nav>
  );
}

interface MobileLinkProps extends React.PropsWithChildren {
  href: string;
  onOpenChange?: (open: boolean) => void;
}

function MobileLink({ href, onOpenChange, children }: MobileLinkProps) {
  return (
    <Link
      href={href}
      onClick={() => {
        onOpenChange?.(false);
      }}
      className='block py-2 text-sm transition-colors hover:text-primary'
    >
      {children}
    </Link>
  );
}
