// src/app/page.tsx
import LoginPage from '@/components/auth/login-page';
import { Suspense } from 'react';

export default async function Home() {
  // The Suspense boundary has been removed as the client component
  // will now handle its own client-side rendering to prevent hydration errors.
  return <LoginPage />;
}
