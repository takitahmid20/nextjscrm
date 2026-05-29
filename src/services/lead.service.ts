/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lead, LeadStatus, LeadSource } from '../types';
import { getSavedCRMData, saveCRMData, INITIAL_LEADS } from '../utils';

export class LeadService {
  /**
   * Fetch all corporate leads matching filter parameters
   */
  static async getLeads(filters?: {
    search?: string;
    status?: LeadStatus | 'All';
    source?: LeadSource | 'All';
    minVal?: number;
  }): Promise<Lead[]> {
    const { leads } = getSavedCRMData();
    let result = [...leads];

    if (filters) {
      const { search, status, source, minVal } = filters;
      
      if (search) {
        const query = search.toLowerCase();
        result = result.filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            l.company.toLowerCase().includes(query) ||
            l.email.toLowerCase().includes(query) ||
            l.phone.includes(query)
        );
      }

      if (status && status !== 'All') {
        result = result.filter((l) => l.status === status);
      }

      if (source && source !== 'All') {
        result = result.filter((l) => l.source === source);
      }

      if (minVal !== undefined) {
        result = result.filter((l) => l.dealValue >= minVal);
      }
    }

    return result;
  }

  /**
   * Register a new lead
   */
  static async createLead(leadInput: Omit<Lead, 'id' | 'createdAt' | 'lastActivity'>): Promise<Lead> {
    const { leads, deals, tasks, activities } = getSavedCRMData();
    const freshLead: Lead = {
      ...leadInput,
      id: `LD-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };

    const updated = [freshLead, ...leads];
    saveCRMData(updated, deals, tasks, activities);
    return freshLead;
  }

  /**
   * Update critical metrics on an existing corporate lead
   */
  static async updateLead(id: string, updatedFields: Partial<Lead>): Promise<Lead> {
    const { leads, deals, tasks, activities } = getSavedCRMData();
    let updatedLead: Lead | null = null;

    const updated = leads.map((l) => {
      if (l.id === id) {
        updatedLead = { ...l, ...updatedFields, lastActivity: new Date().toISOString() };
        return updatedLead;
      }
      return l;
    });

    if (!updatedLead) {
      throw new Error(`Lead folder resource with ID ${id} is not registered in central databases.`);
    }

    saveCRMData(updated, deals, tasks, activities);
    return updatedLead;
  }

  /**
   * Bulk purge leads
   */
  static async deleteLeads(ids: string[]): Promise<void> {
    const { leads, deals, tasks, activities } = getSavedCRMData();
    const updated = leads.filter((l) => !ids.includes(l.id));
    saveCRMData(updated, deals, tasks, activities);
  }

  /**
   * Process a list of imported CSV leads
   */
  static async importLeads(newImportedLeads: Partial<Lead>[], defaultAssignee: string): Promise<Lead[]> {
    const { leads, deals, tasks, activities } = getSavedCRMData();
    const resolved: Lead[] = newImportedLeads.map((part) => ({
      id: `LD-${Math.floor(100 + Math.random() * 900)}`,
      name: part.name || 'Imported Lead',
      company: part.company || 'Enterprise Corp',
      email: part.email || 'info@company.com',
      phone: part.phone || '+1 (555) 000-0000',
      status: (part.status as LeadStatus) || 'New',
      source: (part.source as LeadSource) || 'Inbound',
      assignedTo: part.assignedTo || defaultAssignee,
      dealValue: part.dealValue || 10000,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      notes: 'Acquired through bulk database CSV import.',
    }));

    const updated = [...resolved, ...leads];
    saveCRMData(updated, deals, tasks, activities);
    return resolved;
  }
}
