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

/**
 * Auth schemas — used client-side by AuthView and server-side by the
 * /api/auth/* route handlers, so the same rules apply in both places.
 */
export const loginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid work email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Enter your full name.' }).max(80).trim(),
  companyName: z.string().min(2, { message: 'Enter your company name.' }).max(80).trim(),
  email: z.string().email({ message: 'Enter a valid work email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Enter the email associated with your account.' }),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, { message: 'Enter the 6-digit code.' }).regex(/^\d{6}$/, { message: 'Code must be numeric.' }),
});

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

/**
 * Shared pagination/search/sort query schema for GET list endpoints.
 */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).optional().default(25),
  search: z.string().optional().default(''),
  sortField: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type ListQueryValues = z.infer<typeof listQuerySchema>;

/**
 * Lead -> Contact/Deal conversion payload (CRMConvertLeadSheet).
 */
export const convertLeadSchema = z.object({
  dealTitle: z.string().min(3, { message: 'Deal title must be at least 3 characters.' }).max(60).trim(),
  dealValue: z.coerce.number().min(0, { message: 'Deal value cannot be negative.' }),
  stage: z.enum(['Lead In', 'Contact Made', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']),
});

export type ConvertLeadFormValues = z.infer<typeof convertLeadSchema>;

/**
 * Quick-create deal payload from a Contact's details page (CRMOpportunityDealSheet).
 */
export const opportunityDealSchema = z.object({
  title: z.string().min(3, { message: 'Deal title must be at least 3 characters.' }).max(60).trim(),
  value: z.coerce.number().min(1, { message: 'Deal value must be greater than zero.' }),
  stage: z.enum(['Lead In', 'Contact Made', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']),
  expectedCloseDate: z.string().min(1, { message: 'Expected close date is required.' }),
  assignedTo: z.string().min(1, { message: 'Please select an assigned rep.' }),
});

export type OpportunityDealFormValues = z.infer<typeof opportunityDealSchema>;

/**
 * Outbound email composer payload (CRMOutboundEmailSheet).
 */
export const outboundEmailSchema = z.object({
  subject: z.string().min(1, { message: 'Subject is required.' }).max(120).trim(),
  body: z.string().min(1, { message: 'Message body cannot be empty.' }).max(5000).trim(),
});

export type OutboundEmailFormValues = z.infer<typeof outboundEmailSchema>;

/**
 * Team member (CRMUser) create/edit payload (Settings > Team).
 */
export const userSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(80).trim(),
  email: z.string().email({ message: 'Enter a valid work email address.' }),
  role: z.string().min(2, { message: 'Role is required.' }).max(60).trim(),
});

export type UserFormValues = z.infer<typeof userSchema>;

/**
 * CSV import row schemas. Looser than leadSchema/contactSchema (no
 * firstName/lastName requirement — CSVs typically export a single "name"
 * column) but still enum/format-checked, so a garbage cell fails the row
 * instead of silently becoming a live status/source value.
 */
export const leadImportRowSchema = z.object({
  name: z.string().min(1, { message: 'Name or company is required.' }),
  company: z.string().min(1, { message: 'Company is required.' }),
  email: z.string().email({ message: 'Invalid email format.' }).or(z.literal('')).default(''),
  phone: z.string().default(''),
  status: z.enum(['New', 'Contacted', 'Working', 'Qualified', 'Nurturing', 'Unqualified']).default('New'),
  source: z.enum(['Website', 'Referral', 'Cold Call', 'Inbound', 'LinkedIn', 'Ad Campaign', 'Partnership']).default('Inbound'),
  assignedTo: z.string().default(''),
  dealValue: z.coerce.number().min(0, { message: 'Deal value cannot be negative.' }).default(0),
});

export type LeadImportRow = z.infer<typeof leadImportRowSchema>;

export const contactImportRowSchema = z.object({
  name: z.string().min(1, { message: 'Name or company is required.' }),
  company: z.string().min(1, { message: 'Company is required.' }),
  email: z.string().email({ message: 'Invalid email format.' }).or(z.literal('')).default(''),
  phone: z.string().default(''),
  source: z.enum(['Website', 'Referral', 'Cold Call', 'Inbound', 'LinkedIn', 'Ad Campaign', 'Partnership']).default('Inbound'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  assignedTo: z.string().default(''),
  dealValue: z.coerce.number().min(0, { message: 'Deal value cannot be negative.' }).default(0),
});

export const dealImportRowSchema = z.object({
  title: z.string().min(1, { message: 'Deal title is required.' }),
  company: z.string().min(1, { message: 'Company is required.' }),
  value: z.coerce.number().min(0, { message: 'Value cannot be negative.' }).default(0),
  stage: z.enum(['Lead In', 'Contact Made', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']).default('Lead In'),
  contactPerson: z.string().default(''),
  email: z.string().email({ message: 'Invalid email format.' }).or(z.literal('')).default(''),
  phone: z.string().default(''),
  expectedCloseDate: z.string().default(''),
  assignedTo: z.string().default(''),
});

export type DealImportRow = z.infer<typeof dealImportRowSchema>;

export const taskImportRowSchema = z.object({
  title: z.string().min(1, { message: 'Task title is required.' }),
  dueDate: z.string().default(''),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  assignedTo: z.string().default(''),
  category: z.enum(['Call', 'Email', 'Meeting', 'Proposal', 'Follow-up', 'Task']).default('Task'),
});

export type TaskImportRow = z.infer<typeof taskImportRowSchema>;

/**
 * Account (Company) create/edit payload.
 */
export const accountSchema = z.object({
  name: z.string().min(2, { message: 'Company name must be at least 2 characters.' }).max(80).trim(),
  industry: z.string().max(60).optional().default(''),
  website: z.string().max(200).optional().default(''),
  phone: z.string().max(40).optional().default(''),
  description: z.string().max(1000).optional().default(''),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressPostalCode: z.string().optional(),
  addressCountry: z.string().optional(),
  assignedTo: z.string().min(1, { message: 'Please assign an owner.' }),
});

export type AccountFormValues = z.infer<typeof accountSchema>;

/**
 * Attachment upload metadata — the file content itself (`dataUrl`) is
 * capped client-side before this ever reaches the API.
 */
export const attachmentUploadSchema = z.object({
  entityType: z.enum(['Lead', 'Contact', 'Deal', 'Account']),
  entityId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().min(0).max(5 * 1024 * 1024, { message: 'Files must be 5MB or smaller.' }),
  mimeType: z.string().min(1).max(120),
  dataUrl: z.string().min(1),
});

export type AttachmentUploadValues = z.infer<typeof attachmentUploadSchema>;

export type ContactImportRow = z.infer<typeof contactImportRowSchema>;
