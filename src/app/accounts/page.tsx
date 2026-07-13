/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { useCRM } from '../../context/CRMContext';
import AccountsView from '../../components/AccountsView';

export default function AccountsPage() {
  const { accounts, addAccount, deleteAccount, globalSearch } = useCRM();

  return (
    <AccountsView
      accounts={accounts}
      onAddAccount={addAccount}
      onDeleteAccount={deleteAccount}
      globalSearch={globalSearch}
    />
  );
}
