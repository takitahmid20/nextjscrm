/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthView from '../../components/AuthView';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <AuthView
      onAuthenticated={() => {
        router.push(searchParams.get('from') || '/');
      }}
    />
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}
