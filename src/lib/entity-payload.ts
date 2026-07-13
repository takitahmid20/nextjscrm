/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { baseEntitySchema } from '../validation';
import { BaseEntity } from '../types';

type BaseFormValues = z.infer<typeof baseEntitySchema>;

/**
 * Maps the flat form/validation shape (baseEntitySchema — addressStreet,
 * addressCity, ...) used by Lead/Contact forms onto the nested
 * `addressInfo` shape the domain type (BaseEntity) actually stores.
 */
export function toBaseEntityFields(values: BaseFormValues): Omit<BaseEntity, 'id' | 'createdAt' | 'lastActivity'> {
  const hasAddress = values.addressStreet || values.addressCity || values.addressState || values.addressPostalCode || values.addressCountry;

  return {
    firstName: values.firstName,
    lastName: values.lastName,
    name: values.name || `${values.firstName} ${values.lastName}`.trim(),
    company: values.company,
    email: values.email,
    phone: values.phone,
    source: values.source,
    assignedTo: values.assignedTo,
    notes: values.notes,
    companyWebsite: values.companyWebsite,
    facebook: values.facebook,
    emailOptOut: values.emailOptOut,
    priority: values.priority,
    addressInfo: hasAddress
      ? { street: values.addressStreet, city: values.addressCity, state: values.addressState, postalCode: values.addressPostalCode, country: values.addressCountry }
      : undefined,
  };
}

/**
 * Same mapping as `toBaseEntityFields`, but for PATCH-style partial updates
 * where any subset of fields (including none of the address ones) may be present.
 */
export function toBaseEntityPatch(values: Partial<BaseFormValues>): Partial<BaseEntity> {
  const { addressStreet, addressCity, addressState, addressPostalCode, addressCountry, ...rest } = values;
  const hasAddress = addressStreet || addressCity || addressState || addressPostalCode || addressCountry;

  return {
    ...rest,
    ...(hasAddress
      ? { addressInfo: { street: addressStreet, city: addressCity, state: addressState, postalCode: addressPostalCode, country: addressCountry } }
      : {}),
  };
}
