// src/app/page.tsx
import LoginPage from '@/components/auth/login-page';
import { Suspense } from 'react';

export default async function Home() {
  // Wrap the client component in Suspense to prevent hydration errors.
  // The server will render the fallback, and the client will match it
  // before rendering the actual component content.
  return (
    <Suspense fallback={<div></div>}>
      <LoginPage />
    </Suspense>
  );
}
