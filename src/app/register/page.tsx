import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RegisterPage } from '@/components/pages/RegisterPage';

export default function Register() {
  return (
    <>
      <Header />
      <main>
        <RegisterPage />
      </main>
      <Footer />
    </>
  );
}
