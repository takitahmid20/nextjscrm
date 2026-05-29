/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

/**
 * Enterprise validation base schema for customer entity demographics
 */
export const baseEntitySchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'First name is required.' })
    .max(30, { message: 'First name cannot exceed 30 characters.' })
    .trim(),
  lastName: z
    .string()
    .min(1, { message: 'Last name is required.' })
    .max(30, { message: 'Last name cannot exceed 30 characters.' })
    .trim(),
  name: z.string().optional(),
  company: z
    .string()
    .min(2, { message: 'Company name must be at least 2 characters.' })
    .max(50, { message: 'Company name cannot exceed 50 characters.' })
    .trim(),
  email: z
    .string()
    .email({ message: 'Must be a valid corporate email address (e.g., mail@corp.com).' })
    .or(z.literal('')),
  phone: z
    .string()
    .min(5, { message: 'Phone number is too short.' })
    .or(z.literal('')),
  source: z.enum(['Website', 'Referral', 'Cold Call', 'Inbound', 'LinkedIn', 'Ad Campaign', 'Partnership']),
  assignedTo: z.string().min(1, { message: 'Please assign a manager/specialist.' }),
  notes: z.string().max(500, { message: 'Notes cannot exceed 500 characters.' }).optional(),
  companyWebsite: z.string().or(z.literal('')).optional(),
  facebook: z.string().or(z.literal('')).optional(),
  emailOptOut: z.boolean().optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressPostalCode: z.string().optional(),
  addressCountry: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
});

/**
 * Enterprise validation schema for corporate contact registration (extends base demographics)
 */
export const contactSchema = baseEntitySchema;

export type ContactFormValues = z.infer<typeof contactSchema>;

/**
 * Enterprise validation schema for corporate lead registration (extends base demographics with status)
 */
export const leadSchema = baseEntitySchema.extend({
  status: z.enum(['New', 'Contacted', 'Working', 'Qualified', 'Nurturing', 'Unqualified']),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

/**
 * Enterprise validation schema for contract deal creation
 */
export const dealSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Deal title / opportunity must be at least 3 characters.' })
    .max(60, { message: 'Title cannot exceed 60 characters.' })
    .trim(),
  company: z
    .string()
    .min(2, { message: 'Associated account company is required.' })
    .max(50, { message: 'Company cannot exceed 50 characters.' })
    .trim(),
  value: z.coerce
    .number()
    .min(1, { message: 'Contract value must be greater than zero.' })
    .max(10000000, { message: 'Value cannot exceed $10,000,000.' }),
  stage: z.enum([
    'Lead In',
    'Contact Made',
    'Demo Scheduled',
    'Proposal Sent',
    'Negotiation',
    'Won',
    'Lost',
  ]),
  contactPerson: z
    .string()
    .min(2, { message: 'Primary contact person is required.' })
    .trim(),
  email: z
    .string()
    .email({ message: 'Invalid contact email.' })
    .or(z.literal('')),
  phone: z
    .string()
    .min(5, { message: 'Invalid phone string.' })
    .or(z.literal('')),
  expectedCloseDate: z
    .string()
    .min(1, { message: 'Expected closing target date is required.' }),
  assignedTo: z
    .string()
    .min(1, { message: 'Please select an assigned rep.' }),
});

export type DealFormValues = z.infer<typeof dealSchema>;

/**
 * Enterprise validation schema for task scheduling
 */
export const taskSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Action title must be at least 3 characters.' })
    .max(100, { message: 'Action title cannot exceed 100 characters.' })
    .trim(),
  dueDate: z
    .string()
    .min(1, { message: 'Schedules due date is required.' }),
  priority: z.enum(['Low', 'Medium', 'High']),
  assignedTo: z
    .string()
    .min(1, { message: 'Please select an assigned specialist.' }),
  category: z.enum(['Call', 'Email', 'Meeting', 'Proposal', 'Follow-up', 'Task']),
  relatedToType: z.enum(['Lead', 'Deal', 'None']),
  relatedToName: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
