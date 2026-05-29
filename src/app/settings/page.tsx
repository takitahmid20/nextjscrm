/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { useCRM } from '../../context/CRMContext';
import SettingsView from '../../components/SettingsView';

export default function SettingsPage() {
  const { resetData, currentUser, updateCurrentUser } = useCRM();

  return (
    <SettingsView 
      onResetData={resetData}
      currentUser={currentUser}
      onUpdateCurrentUser={updateCurrentUser}
    />
  );
}
