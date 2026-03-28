import { Suspense } from 'react';
import { PricingPage } from '@/components/features/pricing/pricing-page';

export default function Page() {
  return (
    <Suspense>
      <PricingPage />
    </Suspense>
  );
}
