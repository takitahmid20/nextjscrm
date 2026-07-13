/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '../../../context/CRMContext';
import AccountDetailsView from '../../../components/AccountDetailsView';

interface PageProps {
  params: Promise<{ id: string }>;
}

function AccountDetailsContent({ params }: PageProps) {
  const router = useRouter();
  const { id } = React.use(params);
  const { updateAccount, deleteAccount } = useCRM();

  return (
    <AccountDetailsView
      accountId={id}
      onUpdateAccount={updateAccount}
      onDeleteAccount={deleteAccount}
      onBack={() => router.push('/accounts')}
    />
  );
}

export default function AccountDetailsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading Account Details...</div>}>
      <AccountDetailsContent params={params} />
    </Suspense>
  );
}
