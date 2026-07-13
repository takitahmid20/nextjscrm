/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Lead, Deal, CRMTask, Activity, DealStage, Contact, Account } from '../types';
import { leadsApi } from '../lib/api/leads';
import { contactsApi } from '../lib/api/contacts';
import { dealsApi } from '../lib/api/deals';
import { tasksApi } from '../lib/api/tasks';
import { activitiesApi } from '../lib/api/activities';
import { accountsApi } from '../lib/api/accounts';
import { ApiError } from '../lib/api/http';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

// Large enough to behave like "fetch everything" for a mock-scale dataset —
// every consuming view still does its own client-side filter/sort/paginate
// on top of this array. A real backend at scale should move that logic
// server-side and have views call the paginated `leadsApi.list({page, ...})`
// directly instead of relying on this "load it all up front" shape.
const LIST_ALL_PAGE_SIZE = 1000;

interface CRMContextType {
  leads: Lead[];
  deals: Deal[];
  contacts: Contact[];
  tasks: CRMTask[];
  activities: Activity[];
  accounts: Account[];
  currentUser: { name: string; role: string };
  loading: boolean;
  collapsedSidebar: boolean;
  workspace: string;
  globalSearch: string;
  setCollapsedSidebar: (val: boolean) => void;
  setWorkspace: (val: string) => void;
  setGlobalSearch: (val: string) => void;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastActivity'>) => Promise<void>;
  updateLead: (id: string, fields: Partial<Lead>) => Promise<void>;
  deleteLeads: (ids: string[]) => Promise<void>;
  importLeads: (rows: Record<string, unknown>[]) => Promise<{ importedCount: number; errors: { row: number; message: string }[] }>;
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt'>) => Promise<void>;
  updateDeal: (id: string, fields: Partial<Deal>) => Promise<void>;
  updateDealStage: (id: string, stage: DealStage) => Promise<void>;
  updateDealStatus: (id: string, status: 'Open' | 'Won' | 'Lost') => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'lastActivity'>) => Promise<void>;
  updateContact: (id: string, fields: Partial<Contact>) => Promise<void>;
  deleteContacts: (ids: string[]) => Promise<void>;
  importContacts: (rows: Record<string, unknown>[]) => Promise<{ importedCount: number; errors: { row: number; message: string }[] }>;
  addTask: (task: Omit<CRMTask, 'id'>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  importDeals: (rows: Record<string, unknown>[]) => Promise<{ importedCount: number; errors: { row: number; message: string }[] }>;
  importTasks: (rows: Record<string, unknown>[]) => Promise<{ importedCount: number; errors: { row: number; message: string }[] }>;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  updateAccount: (id: string, fields: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  resetData: () => Promise<void>;
  updateCurrentUser: (name: string, role: string) => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const { user, status: authStatus, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedSidebar, setCollapsedSidebar] = useState<boolean>(false);
  const [workspace, setWorkspace] = useState<string>('US_EAST_PROD');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  const currentUser = { name: user?.name ?? 'Guest', role: user?.role ?? '' };

  const reportError = useCallback((error: unknown, fallback: string) => {
    const message = error instanceof ApiError ? error.message : fallback;
    showToast(message, 'error');
  }, [showToast]);

  const refetchLeads = useCallback(async () => {
    const result = await leadsApi.list({ pageSize: LIST_ALL_PAGE_SIZE });
    setLeads(result.items);
  }, []);
  const refetchContacts = useCallback(async () => {
    const result = await contactsApi.list({ pageSize: LIST_ALL_PAGE_SIZE });
    setContacts(result.items);
  }, []);
  const refetchDeals = useCallback(async () => {
    const result = await dealsApi.list({ pageSize: LIST_ALL_PAGE_SIZE });
    setDeals(result.items);
  }, []);
  const refetchTasks = useCallback(async () => {
    const result = await tasksApi.list({ pageSize: LIST_ALL_PAGE_SIZE });
    setTasks(result.items);
  }, []);
  const refetchActivities = useCallback(async () => {
    setActivities(await activitiesApi.list());
  }, []);
  const refetchAccounts = useCallback(async () => {
    const result = await accountsApi.list({ pageSize: LIST_ALL_PAGE_SIZE });
    setAccounts(result.items);
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      if (authStatus === 'unauthenticated') setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([refetchLeads(), refetchContacts(), refetchDeals(), refetchTasks(), refetchActivities(), refetchAccounts()])
      .catch((error) => reportError(error, 'Failed to load workspace data.'))
      .finally(() => setLoading(false));
  }, [authStatus, refetchLeads, refetchContacts, refetchDeals, refetchTasks, refetchActivities, refetchAccounts, reportError]);

  // ---------------------------------------------------------------------
  // Leads
  // ---------------------------------------------------------------------
  const addLead = async (leadInput: Omit<Lead, 'id' | 'createdAt' | 'lastActivity'>) => {
    try {
      await leadsApi.create(leadInput);
      await Promise.all([refetchLeads(), refetchActivities()]);
      showToast(`Lead "${leadInput.name}" created.`, 'success');
    } catch (error) {
      reportError(error, 'Could not create lead.');
    }
  };

  const updateLead = async (id: string, fields: Partial<Lead>) => {
    try {
      await leadsApi.update(id, fields);
      await Promise.all([refetchLeads(), refetchActivities()]);
    } catch (error) {
      reportError(error, 'Could not update lead.');
    }
  };

  const deleteLeads = async (ids: string[]) => {
    try {
      await leadsApi.bulkDelete(ids);
      await Promise.all([refetchLeads(), refetchActivities()]);
      showToast(`Deleted ${ids.length} lead${ids.length === 1 ? '' : 's'}.`, 'success');
    } catch (error) {
      reportError(error, 'Could not delete lead(s).');
    }
  };

  const importLeads = async (rows: Record<string, unknown>[]) => {
    try {
      const result = await leadsApi.import(rows);
      await Promise.all([refetchLeads(), refetchActivities()]);
      if (result.errors.length > 0) {
        showToast(`Imported ${result.importedCount} lead(s). ${result.errors.length} row(s) failed validation.`, 'info');
      } else {
        showToast(`Imported ${result.importedCount} lead(s).`, 'success');
      }
      return { importedCount: result.importedCount, errors: result.errors };
    } catch (error) {
      reportError(error, 'Import failed.');
      return { importedCount: 0, errors: [] };
    }
  };

  // ---------------------------------------------------------------------
  // Deals
  // ---------------------------------------------------------------------
  const addDeal = async (dealInput: Omit<Deal, 'id' | 'createdAt'>) => {
    try {
      await dealsApi.create(dealInput);
      await Promise.all([refetchDeals(), refetchActivities()]);
      showToast(`Deal "${dealInput.title}" created.`, 'success');
    } catch (error) {
      reportError(error, 'Could not create deal.');
    }
  };

  const updateDeal = async (id: string, fields: Partial<Deal>) => {
    try {
      await dealsApi.update(id, fields);
      await Promise.all([refetchDeals(), refetchActivities()]);
    } catch (error) {
      reportError(error, 'Could not update deal.');
    }
  };

  const updateDealStage = async (id: string, stage: DealStage) => {
    await updateDeal(id, { stage });
  };

  const updateDealStatus = async (id: string, status: 'Open' | 'Won' | 'Lost') => {
    await updateDeal(id, { status });
  };

  const deleteDeal = async (id: string) => {
    try {
      await dealsApi.remove(id);
      await Promise.all([refetchDeals(), refetchActivities()]);
      showToast('Deal removed.', 'success');
    } catch (error) {
      reportError(error, 'Could not delete deal.');
    }
  };

  // ---------------------------------------------------------------------
  // Contacts
  // ---------------------------------------------------------------------
  const addContact = async (contactInput: Omit<Contact, 'id' | 'createdAt' | 'lastActivity'>) => {
    try {
      await contactsApi.create(contactInput);
      await Promise.all([refetchContacts(), refetchActivities()]);
      showToast(`Contact "${contactInput.name}" added.`, 'success');
    } catch (error) {
      reportError(error, 'Could not create contact.');
    }
  };

  const updateContact = async (id: string, fields: Partial<Contact>) => {
    try {
      await contactsApi.update(id, fields);
      await Promise.all([refetchContacts(), refetchActivities()]);
    } catch (error) {
      reportError(error, 'Could not update contact.');
    }
  };

  const deleteContacts = async (ids: string[]) => {
    try {
      await contactsApi.bulkDelete(ids);
      await Promise.all([refetchContacts(), refetchActivities()]);
      showToast(`Deleted ${ids.length} contact${ids.length === 1 ? '' : 's'}.`, 'success');
    } catch (error) {
      reportError(error, 'Could not delete contact(s).');
    }
  };

  const importContacts = async (rows: Record<string, unknown>[]) => {
    try {
      const result = await contactsApi.import(rows);
      await Promise.all([refetchContacts(), refetchActivities()]);
      if (result.errors.length > 0) {
        showToast(`Imported ${result.importedCount} contact(s). ${result.errors.length} row(s) failed validation.`, 'info');
      } else {
        showToast(`Imported ${result.importedCount} contact(s).`, 'success');
      }
      return { importedCount: result.importedCount, errors: result.errors };
    } catch (error) {
      reportError(error, 'Import failed.');
      return { importedCount: 0, errors: [] };
    }
  };

  // ---------------------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------------------
  const addTask = async (taskInput: Omit<CRMTask, 'id'>) => {
    try {
      await tasksApi.create(taskInput);
      await refetchTasks();
    } catch (error) {
      reportError(error, 'Could not create task.');
    }
  };

  const toggleTask = async (id: string) => {
    const taskObj = tasks.find((t) => t.id === id);
    if (!taskObj) return;
    try {
      await tasksApi.update(id, { status: taskObj.status === 'Pending' ? 'Completed' : 'Pending' });
      await Promise.all([refetchTasks(), refetchActivities()]);
    } catch (error) {
      reportError(error, 'Could not update task.');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksApi.remove(id);
      await refetchTasks();
    } catch (error) {
      reportError(error, 'Could not delete task.');
    }
  };

  const importDeals = async (rows: Record<string, unknown>[]) => {
    try {
      const result = await dealsApi.import(rows);
      await Promise.all([refetchDeals(), refetchActivities()]);
      if (result.errors.length > 0) {
        showToast(`Imported ${result.importedCount} deal(s). ${result.errors.length} row(s) failed validation.`, 'info');
      } else {
        showToast(`Imported ${result.importedCount} deal(s).`, 'success');
      }
      return { importedCount: result.importedCount, errors: result.errors };
    } catch (error) {
      reportError(error, 'Import failed.');
      return { importedCount: 0, errors: [] };
    }
  };

  const importTasks = async (rows: Record<string, unknown>[]) => {
    try {
      const result = await tasksApi.import(rows);
      await refetchTasks();
      if (result.errors.length > 0) {
        showToast(`Imported ${result.importedCount} task(s). ${result.errors.length} row(s) failed validation.`, 'info');
      } else {
        showToast(`Imported ${result.importedCount} task(s).`, 'success');
      }
      return { importedCount: result.importedCount, errors: result.errors };
    } catch (error) {
      reportError(error, 'Import failed.');
      return { importedCount: 0, errors: [] };
    }
  };

  // ---------------------------------------------------------------------
  // Accounts
  // ---------------------------------------------------------------------
  const addAccount = async (accountInput: Omit<Account, 'id' | 'createdAt'>) => {
    try {
      await accountsApi.create(accountInput);
      await refetchAccounts();
      showToast(`Account "${accountInput.name}" created.`, 'success');
    } catch (error) {
      reportError(error, 'Could not create account.');
    }
  };

  const updateAccount = async (id: string, fields: Partial<Account>) => {
    try {
      await accountsApi.update(id, fields);
      await refetchAccounts();
    } catch (error) {
      reportError(error, 'Could not update account.');
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await accountsApi.remove(id);
      await refetchAccounts();
      showToast('Account removed.', 'success');
    } catch (error) {
      reportError(error, 'Could not delete account.');
    }
  };

  const resetData = async () => {
    try {
      await Promise.all([refetchLeads(), refetchContacts(), refetchDeals(), refetchTasks(), refetchActivities(), refetchAccounts()]);
      showToast('Workspace data refreshed from the server.', 'success');
    } catch (error) {
      reportError(error, 'Could not refresh workspace data.');
    }
  };

  const updateCurrentUser = async (name: string, role: string) => {
    try {
      await updateProfile({ name, role });
    } catch (error) {
      reportError(error, 'Could not update profile.');
    }
  };

  return (
    <CRMContext.Provider
      value={{
        leads,
        deals,
        contacts,
        tasks,
        activities,
        accounts,
        currentUser,
        loading,
        collapsedSidebar,
        workspace,
        globalSearch,
        setCollapsedSidebar,
        setWorkspace,
        setGlobalSearch,
        addLead,
        updateLead,
        deleteLeads,
        importLeads,
        addDeal,
        updateDeal,
        updateDealStage,
        updateDealStatus,
        deleteDeal,
        addContact,
        updateContact,
        deleteContacts,
        importContacts,
        addTask,
        toggleTask,
        deleteTask,
        importDeals,
        importTasks,
        addAccount,
        updateAccount,
        deleteAccount,
        resetData,
        updateCurrentUser,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
