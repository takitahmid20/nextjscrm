/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity } from '../../types';
import { apiFetch } from './http';

export const activitiesApi = {
  list: () => apiFetch<Activity[]>('/activities'),
};
