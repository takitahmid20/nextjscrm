/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React from 'react';
import { useCRM } from '../../context/CRMContext';
import ContactsView from '../../components/ContactsView';

export default function ContactsPage() {
  const { contacts, addContact, updateContact, deleteContacts, importContacts, globalSearch } = useCRM();

  return (
    <ContactsView 
      contacts={contacts}
      onAddContact={addContact}
      onUpdateContact={updateContact}
      onDeleteContacts={deleteContacts}
      onImportContacts={importContacts}
      globalSearch={globalSearch}
    />
  );
}
