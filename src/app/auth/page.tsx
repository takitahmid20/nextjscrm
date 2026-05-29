/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '../../context/CRMContext';
import AuthView from '../../components/AuthView';

export default function AuthPage() {
  const router = useRouter();
  const { updateCurrentUser } = useCRM();

  return (
    <AuthView 
      onSuccessLogin={(name, role) => {
        updateCurrentUser(name, role);
        router.push('/');
      }}
      onExitAuthPreview={() => {
        router.push('/');
      }}
    />
  );
}
