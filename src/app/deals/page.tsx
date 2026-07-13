/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { useCRM } from '../../context/CRMContext';
import DealsView from '../../components/DealsView';

export default function DealsPage() {
  const { deals, addDeal, updateDeal, updateDealStage, updateDealStatus, deleteDeal, importDeals } = useCRM();

  return (
    <DealsView
      deals={deals}
      onAddDeal={addDeal}
      onUpdateDeal={updateDeal}
      onUpdateDealStage={updateDealStage}
      onUpdateDealStatus={updateDealStatus}
      onDeleteDeal={deleteDeal}
      onImportDeals={importDeals}
    />
  );
}
