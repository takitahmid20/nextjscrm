/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Deal, DealStage } from '../types';
import { getSavedCRMData, saveCRMData } from '../utils';

export class DealService {
  /**
   * Fetch all deal records from mock datastore
   */
  static async getDeals(): Promise<Deal[]> {
    const { deals } = getSavedCRMData();
    return deals;
  }

  /**
   * Register a new contract deal offer
   */
  static async createDeal(dealInput: Omit<Deal, 'id' | 'createdAt'>): Promise<Deal> {
    const { leads, deals, tasks, activities } = getSavedCRMData();
    const freshDeal: Deal = {
      ...dealInput,
      id: `DL-${Math.floor(200 + Math.random() * 100)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [freshDeal, ...deals];
    saveCRMData(leads, updated, tasks, activities);
    return freshDeal;
  }

  /**
   * Update deal stage transition
   */
  static async updateDealStage(id: string, stage: DealStage): Promise<Deal> {
    const { leads, deals, tasks, activities } = getSavedCRMData();
    let updatedDeal: Deal | null = null;

    const updated = deals.map((d) => {
      if (d.id === id) {
        updatedDeal = { ...d, stage };
        return updatedDeal;
      }
      return d;
    });

    if (!updatedDeal) {
      throw new Error(`Deal folder resource with ID ${id} is not registered.`);
    }

    saveCRMData(leads, updated, tasks, activities);
    return updatedDeal;
  }

  /**
   * Update deal win/loss status tag
   */
  static async updateDealStatus(id: string, status: 'Open' | 'Won' | 'Lost'): Promise<Deal> {
    const { leads, deals, tasks, activities } = getSavedCRMData();
    let updatedDeal: Deal | null = null;

    const updated = deals.map((d) => {
      if (d.id === id) {
        updatedDeal = { ...d, status };
        return updatedDeal;
      }
      return d;
    });

    if (!updatedDeal) {
      throw new Error(`Deal folder resource with ID ${id} is not registered.`);
    }

    saveCRMData(leads, updated, tasks, activities);
    return updatedDeal;
  }

  /**
   * Clear opportunity proposal from dashboard viewports
   */
  static async deleteDeal(id: string): Promise<void> {
    const { leads, deals, tasks, activities } = getSavedCRMData();
    const updated = deals.filter((d) => d.id !== id);
    saveCRMData(leads, updated, tasks, activities);
  }
}
