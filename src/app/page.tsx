// src/app/page.tsx
import LoginPage from '@/components/auth/login-page';
import { Suspense } from 'react';

export default async function Home() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
