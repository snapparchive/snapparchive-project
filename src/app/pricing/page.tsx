import { Suspense } from 'react';
import PricingClient from './pricing-client';

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PricingClient />
    </Suspense>
  );
}
