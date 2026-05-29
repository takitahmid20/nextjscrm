/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { useCRM } from '../../context/CRMContext';
import LeadsView from '../../components/LeadsView';

export default function LeadsPage() {
  const { leads, addLead, updateLead, deleteLeads, importLeads, globalSearch } = useCRM();

  return (
    <LeadsView 
      leads={leads}
      onAddLead={addLead}
      onUpdateLead={updateLead}
      onDeleteLeads={deleteLeads}
      onImportLeads={importLeads}
      globalSearch={globalSearch}
    />
  );
}
