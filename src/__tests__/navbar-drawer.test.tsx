import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LoginButton from '@/components/login-button';
import LogoutButton from '@/components/logout-button';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    onClick,
    href,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    href: string;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock Supabase client
const mockSignOut = vi.fn().mockResolvedValue({});
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}));

afterEach(() => {
  cleanup();
});

describe('LoginButton', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<LoginButton onClick={onClick} />);

    fireEvent.click(screen.getByText('Login'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders without onClick prop', () => {
    render(<LoginButton />);

    expect(screen.getByText('Login')).toBeTruthy();
  });
});

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<LogoutButton onClick={onClick} />);

    fireEvent.click(screen.getByText('Logout'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('calls supabase signOut when clicked', () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByText('Logout'));

    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it('renders without onClick prop', () => {
    render(<LogoutButton />);

    expect(screen.getByText('Logout')).toBeTruthy();
  });
});
