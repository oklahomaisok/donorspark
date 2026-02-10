'use client';

import { Suspense } from 'react';
import { ClaimedModal } from './claimed-modal';

interface ClaimedModalWrapperProps {
  orgName: string;
  deckUrl: string;
}

export function ClaimedModalWrapper({ orgName, deckUrl }: ClaimedModalWrapperProps) {
  return (
    <Suspense fallback={null}>
      <ClaimedModal orgName={orgName} deckUrl={deckUrl} />
    </Suspense>
  );
}
