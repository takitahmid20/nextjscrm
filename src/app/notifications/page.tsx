/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { useCRM } from '../../context/CRMContext';
import NotificationsView from '../../components/NotificationsView';

export default function NotificationsPage() {
  const { activities, loading } = useCRM();

  return <NotificationsView activities={activities} loading={loading} />;
}
