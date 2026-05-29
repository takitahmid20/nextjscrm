"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lead, Deal, CRMTask, Activity, DealStage, TaskStatus, Contact } from '../types';
import { getSavedCRMData, saveCRMData, INITIAL_LEADS, INITIAL_DEALS, INITIAL_TASKS, INITIAL_ACTIVITIES, INITIAL_CONTACTS } from '../utils';

interface CRMContextType {
  leads: Lead[];
  deals: Deal[];
  contacts: Contact[];
  tasks: CRMTask[];
  activities: Activity[];
  currentUser: { name: string; role: string };
  collapsedSidebar: boolean;
  workspace: string;
  globalSearch: string;
  setCollapsedSidebar: (val: boolean) => void;
  setWorkspace: (val: string) => void;
  setGlobalSearch: (val: string) => void;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastActivity'>) => void;
  updateLead: (id: string, fields: Partial<Lead>) => void;
  deleteLeads: (ids: string[]) => void;
  importLeads: (leads: Partial<Lead>[]) => void;
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt'>) => void;
  updateDealStage: (id: string, stage: DealStage) => void;
  updateDealStatus: (id: string, status: 'Open' | 'Won' | 'Lost') => void;
  deleteDeal: (id: string) => void;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'lastActivity'>) => void;
  updateContact: (id: string, fields: Partial<Contact>) => void;
  deleteContacts: (ids: string[]) => void;
  importContacts: (contacts: Partial<Contact>[]) => void;
  addTask: (task: Omit<CRMTask, 'id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  resetData: () => void;
  updateCurrentUser: (name: string, role: string) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [collapsedSidebar, setCollapsedSidebar] = useState<boolean>(false);
  const [workspace, setWorkspace] = useState<string>('US_EAST_PROD');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [currentUser, setCurrentUser] = useState({
    name: 'Sarah Jenkins',
    role: 'Sales Director'
  });

  // Load from local storage on mount
  useEffect(() => {
    const data = getSavedCRMData();
    setLeads(data.leads);
    setDeals(data.deals);
    setTasks(data.tasks);
    setActivities(data.activities);
    setContacts(data.contacts || []);
  }, []);

  const persistChanges = (
    newLeads: Lead[], 
    newDeals: Deal[], 
    newTasks: CRMTask[], 
    newActivities: Activity[],
    newContacts?: Contact[]
  ) => {
    const finalContacts = newContacts !== undefined ? newContacts : contacts;
    setLeads(newLeads);
    setDeals(newDeals);
    setTasks(newTasks);
    setActivities(newActivities);
    if (newContacts !== undefined) {
      setContacts(newContacts);
    }
    saveCRMData(newLeads, newDeals, newTasks, newActivities, finalContacts);
  };

  const addLead = (leadInput: Omit<Lead, 'id' | 'createdAt' | 'lastActivity'>) => {
    const freshLead: Lead = {
      ...leadInput,
      id: `LD-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    const updated = [freshLead, ...leads];
    const description = `Registered new lead account: ${freshLead.name} (${freshLead.company}).`;
    const nextActivities: Activity[] = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'lead_created',
        user: currentUser.name,
        description,
        entityName: freshLead.name,
        value: freshLead.dealValue
      },
      ...activities
    ];
    persistChanges(updated, deals, tasks, nextActivities);
  };

  const updateLead = (id: string, updatedFields: Partial<Lead>) => {
    const updated = leads.map(l => {
      if (l.id === id) {
        return { ...l, ...updatedFields, lastActivity: new Date().toISOString() };
      }
      return l;
    });
    const leadObj = leads.find(l => l.id === id);
    let nextActivities = [...activities];
    if (updatedFields.status && leadObj && leadObj.status !== updatedFields.status) {
      nextActivities = [
        {
          id: `ACT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'stage_changed',
          user: currentUser.name,
          description: `Updated status of "${leadObj.name}" to ${updatedFields.status}.`,
          entityName: leadObj.name
        },
        ...nextActivities
      ];
    }
    persistChanges(updated, deals, tasks, nextActivities);
  };

  const deleteLeads = (ids: string[]) => {
    const updated = leads.filter(l => !ids.includes(l.id));
    const description = `Permanently purged ${ids.length} lead account folder records.`;
    const nextActivities: Activity[] = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'lead_created',
        user: currentUser.name,
        description
      },
      ...activities
    ];
    persistChanges(updated, deals, tasks, nextActivities);
  };

  const importLeads = (newImportedLeads: Partial<Lead>[]) => {
    const resolved: Lead[] = newImportedLeads.map((part) => ({
      id: `LD-${Math.floor(100 + Math.random() * 900)}`,
      name: part.name || 'Imported Lead',
      company: part.company || 'Enterprise Corp',
      email: part.email || 'info@company.com',
      phone: part.phone || '+1 (555) 000-0000',
      status: (part.status as any) || 'New',
      source: (part.source as any) || 'Inbound',
      assignedTo: part.assignedTo || currentUser.name,
      dealValue: part.dealValue || 10000,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      notes: 'Acquired through bulk database CSV import.'
    }));

    const updated = [...resolved, ...leads];
    const description = `Executed Bulk CSV deployment. Successfully registered ${resolved.length} business entities.`;
    const nextActivities: Activity[] = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'lead_created',
        user: currentUser.name,
        description
      },
      ...activities
    ];
    persistChanges(updated, deals, tasks, nextActivities);
  };

  const addDeal = (dealInput: Omit<Deal, 'id' | 'createdAt'>) => {
    const freshDeal: Deal = {
      ...dealInput,
      id: `DL-${Math.floor(200 + Math.random() * 100)}`,
      createdAt: new Date().toISOString()
    };
    const updated = [freshDeal, ...deals];
    const description = `Drafted contract offer proposal: "${freshDeal.title}" with company ${freshDeal.company}.`;
    const nextActivities: Activity[] = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'lead_created',
        user: currentUser.name,
        description,
        entityName: freshDeal.title,
        value: freshDeal.value
      },
      ...activities
    ];
    persistChanges(leads, updated, tasks, nextActivities);
  };

  const updateDealStage = (id: string, stage: DealStage) => {
    const dealObj = deals.find(d => d.id === id);
    if (!dealObj) return;

    const updated = deals.map(d => {
      if (d.id === id) {
        return { ...d, stage };
      }
      return d;
    });

    const description = `Advanced opportunity "${dealObj.title}" to stage: ${stage}.`;
    const nextActivities: Activity[] = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'stage_changed',
        user: currentUser.name,
        description,
        entityName: dealObj.title,
        value: dealObj.value
      },
      ...activities
    ];
    persistChanges(leads, updated, tasks, nextActivities);
  };

  const updateDealStatus = (id: string, status: 'Open' | 'Won' | 'Lost') => {
    const dealObj = deals.find(d => d.id === id);
    if (!dealObj) return;

    const updated = deals.map(d => {
      if (d.id === id) {
        return { ...d, status };
      }
      return d;
    });

    const logType = status === 'Won' ? 'deal_won' : status === 'Lost' ? 'deal_lost' : 'stage_changed';
    const description = status === 'Won'
      ? `Successfully secured contract closed WON!: "${dealObj.title}" valued at ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(dealObj.value)}!`
      : `Marked proposal "${dealObj.title}" as closed LOST. Reason: Competition / unqualified.`;

    const nextActivities: Activity[] = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: logType,
        user: currentUser.name,
        description,
        entityName: dealObj.title,
        value: dealObj.value
      },
      ...activities
    ];
    persistChanges(leads, updated, tasks, nextActivities);
  };

  const deleteDeal = (id: string) => {
    const dealObj = deals.find(d => d.id === id);
    const updated = deals.filter(d => d.id !== id);
    if (!dealObj) return;

    const description = `Removed opportunity proposal folder: "${dealObj.title}".`;
    const nextActivities: Activity[] = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'stage_changed',
        user: currentUser.name,
        description
      },
      ...activities
    ];
    persistChanges(leads, updated, tasks, nextActivities);
  };

  const addContact = (contactInput: Omit<Contact, 'id' | 'createdAt' | 'lastActivity'>) => {
    const freshContact: Contact = {
      ...contactInput,
      id: `CON-${Math.floor(500 + Math.random() * 499)}`,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    const updated = [freshContact, ...contacts];
    const description = `Added new unified business Contact: ${freshContact.name} (${freshContact.company}).`;
    const nextActivities: Activity[] = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'lead_created',
        user: currentUser.name,
        description,
        entityName: freshContact.name
      },
      ...activities
    ];
    persistChanges(leads, deals, tasks, nextActivities, updated);
  };

  const updateContact = (id: string, updatedFields: Partial<Contact>) => {
    const updated = contacts.map(c => {
      if (c.id === id) {
        return { ...c, ...updatedFields, lastActivity: new Date().toISOString() };
      }
      return c;
    });
    const contactObj = contacts.find(c => c.id === id);
    let nextActivities = [...activities];
    if (updatedFields.priority && contactObj && contactObj.priority !== updatedFields.priority) {
      nextActivities = [
        {
          id: `ACT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'stage_changed',
          user: currentUser.name,
          description: `Updated priority of Contact "${contactObj.name}" to ${updatedFields.priority}.`,
          entityName: contactObj.name
        },
        ...nextActivities
      ];
    }
    persistChanges(leads, deals, tasks, nextActivities, updated);
  };

  const deleteContacts = (ids: string[]) => {
    const updated = contacts.filter(c => !ids.includes(c.id));
    const description = `Archived ${ids.length} corporate relationship Contacts.`;
    const nextActivities: Activity[] = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'lead_created',
        user: currentUser.name,
        description
      },
      ...activities
    ];
    persistChanges(leads, deals, tasks, nextActivities, updated);
  };

  const importContacts = (newImportedContacts: Partial<Contact>[]) => {
    const resolved: Contact[] = newImportedContacts.map((part) => ({
      id: `CON-${Math.floor(500 + Math.random() * 499)}`,
      name: part.name || 'Imported Contact',
      firstName: part.firstName || part.name?.split(' ')[0] || 'Imported',
      lastName: part.lastName || part.name?.split(' ').slice(1).join(' ') || 'Contact',
      company: part.company || 'Enterprise Corp',
      email: part.email || 'info@company.com',
      phone: part.phone || '+1 (555) 000-0000',
      source: (part.source as any) || 'Inbound',
      assignedTo: part.assignedTo || currentUser.name,
      dealValue: part.dealValue || 10000,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      notes: 'Acquired through bulk database CSV import.'
    }));

    const updated = [...resolved, ...contacts];
    const description = `Executed Bulk CSV deployment. Successfully registered ${resolved.length} business partners.`;
    const nextActivities: Activity[] = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'lead_created',
        user: currentUser.name,
        description
      },
      ...activities
    ];
    persistChanges(leads, deals, tasks, nextActivities, updated);
  };

  const addTask = (taskInput: Omit<CRMTask, 'id'>) => {
    const freshTask: CRMTask = {
      ...taskInput,
      id: `TSK-${Math.floor(300 + Math.random() * 100)}`
    };
    const updated = [freshTask, ...tasks];
    persistChanges(leads, deals, updated, activities);
  };

  const toggleTask = (id: string) => {
    const taskObj = tasks.find(t => t.id === id);
    if (!taskObj) return;

    const nextStatus: TaskStatus = taskObj.status === 'Pending' ? 'Completed' : 'Pending';
    const updated = tasks.map(t => {
      if (t.id === id) {
        return { ...t, status: nextStatus };
      }
      return t;
    });

    let nextActivities = [...activities];
    if (nextStatus === 'Completed') {
      nextActivities = [
        {
          id: `ACT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'task_completed',
          user: currentUser.name,
          description: `Completed follow-up checklist: "${taskObj.title}".`,
          entityName: taskObj.title
        },
        ...nextActivities
      ];
    }
    persistChanges(leads, deals, updated, nextActivities);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    persistChanges(leads, deals, updated, activities);
  };

  const resetData = () => {
    localStorage.clear();
    setLeads(INITIAL_LEADS);
    setDeals(INITIAL_DEALS);
    setTasks(INITIAL_TASKS);
    setActivities(INITIAL_ACTIVITIES);
    setContacts(INITIAL_CONTACTS);
    saveCRMData(INITIAL_LEADS, INITIAL_DEALS, INITIAL_TASKS, INITIAL_ACTIVITIES, INITIAL_CONTACTS);
  };

  const updateCurrentUser = (name: string, role: string) => {
    setCurrentUser({ name, role });
  };

  return (
    <CRMContext.Provider
      value={{
        leads,
        deals,
        contacts,
        tasks,
        activities,
        currentUser,
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
        resetData,
        updateCurrentUser
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
