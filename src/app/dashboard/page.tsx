'use client';

import { useSession } from 'next-auth/react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  console.log(session, status);
  return (
    <>
      <h1>Dashboard</h1>
      <p>Welcome to the dashboard, {session?.user?.name}!</p>
    </>
  );
}
