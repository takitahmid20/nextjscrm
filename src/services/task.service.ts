/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CRMTask } from '../types';
import { getSavedCRMData, saveCRMData } from '../utils';

export class TaskService {
  /**
   * Fetch scheduled follow-up actions
   */
  static async getTasks(): Promise<CRMTask[]> {
    const { tasks } = getSavedCRMData();
    return tasks;
  }

  /**
   * Enqueue a new scheduled checkmark CRMTask
   */
  static async createTask(taskInput: Omit<CRMTask, 'id'>): Promise<CRMTask> {
    const { leads, deals, tasks, activities } = getSavedCRMData();
    const freshTask: CRMTask = {
      ...taskInput,
      id: `TSK-${Math.floor(300 + Math.random() * 100)}`,
    };

    const updated = [freshTask, ...tasks];
    saveCRMData(leads, deals, updated, activities);
    return freshTask;
  }

  /**
   * Toggle task progression status
   */
  static async toggleTaskStatus(id: string): Promise<CRMTask> {
    const { leads, deals, tasks, activities } = getSavedCRMData();
    let updatedTask: CRMTask | null = null;

    const updated = tasks.map((t) => {
      if (t.id === id) {
        const nextStatus = t.status === 'Pending' ? 'Completed' : 'Pending';
        updatedTask = { ...t, status: nextStatus };
        return updatedTask;
      }
      return t;
    });

    if (!updatedTask) {
      throw new Error(`Task checklist item ${id} is missing in DB registers.`);
    }

    saveCRMData(leads, deals, updated, activities);
    return updatedTask;
  }

  /**
   * Purge a scheduled action folder
   */
  static async deleteTask(id: string): Promise<void> {
    const { leads, deals, tasks, activities } = getSavedCRMData();
    const updated = tasks.filter((t) => t.id !== id);
    saveCRMData(leads, deals, updated, activities);
  }
}
