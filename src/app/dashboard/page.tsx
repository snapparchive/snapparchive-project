'use client';

import { Dashboard } from '@/components/pages/Dashboard';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardPage() {
  return (
    <>
      <Dashboard />
      <Toaster />
    </>
  );
}