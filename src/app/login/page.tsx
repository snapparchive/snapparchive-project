import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LoginPage } from '@/components/pages/LoginPage';

export default function Login() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginPage />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
