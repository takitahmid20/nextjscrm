/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface BaseFieldProps {
  label: string;
  error?: string;
  id?: string;
  className?: string;
  required?: boolean;
}

interface FormInputProps extends BaseFieldProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
  register: UseFormRegisterReturn;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  id,
  className,
  required,
  register,
  type = 'text',
  ...props
}) => {
  const fieldId = id || register.name;
  return (
    <div className={cn('flex flex-col space-y-1.5 w-full', className)}>
      <label htmlFor={fieldId} className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={fieldId}
        type={type}
        className={cn(
          'h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]',
          error ? 'border-red-500 bg-red-50/10 focus:ring-red-500 focus:border-red-500' : ''
        )}
        {...register}
        {...props}
      />
      {error && <span className="text-[11px] text-red-600 font-medium">{error}</span>}
    </div>
  );
};

interface FormSelectProps extends BaseFieldProps, Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  register: UseFormRegisterReturn;
  options: { value: string; label: string }[];
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  id,
  className,
  required,
  register,
  options,
  ...props
}) => {
  const fieldId = id || register.name;
  return (
    <div className={cn('flex flex-col space-y-1.5 w-full', className)}>
      <label htmlFor={fieldId} className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={fieldId}
        className={cn(
          'h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] outline-none transition-colors w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] cursor-pointer',
          error ? 'border-red-500 bg-red-50/10 focus:ring-red-500 focus:border-red-500' : ''
        )}
        {...register}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-[11px] text-red-600 font-medium">{error}</span>}
    </div>
  );
};

interface FormTextareaProps extends BaseFieldProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  register: UseFormRegisterReturn;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  error,
  id,
  className,
  required,
  register,
  rows = 3,
  ...props
}) => {
  const fieldId = id || register.name;
  return (
    <div className={cn('flex flex-col space-y-1.5 w-full', className)}>
      <label htmlFor={fieldId} className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        className={cn(
          'px-3 py-2 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors resize-none selection:bg-[#2563EB]/10 w-full focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]',
          error ? 'border-red-500 bg-red-50/10 focus:ring-red-500 focus:border-red-500' : ''
        )}
        {...register}
        {...props}
      />
      {error && <span className="text-[11px] text-red-600 font-medium">{error}</span>}
    </div>
  );
};

interface FormCheckboxProps extends Omit<BaseFieldProps, 'required'>, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
  register: UseFormRegisterReturn;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  error,
  id,
  className,
  register,
  ...props
}) => {
  const fieldId = id || register.name;
  return (
    <div className={cn('flex items-start space-x-2.5 w-full py-1.5', className)}>
      <input
        id={fieldId}
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border-[#E5E7EB] text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer mt-0.5 transition-shadow'
        )}
        {...register}
        {...props}
      />
      <div className="flex flex-col">
        <label htmlFor={fieldId} className="text-xs font-semibold text-[#111827] cursor-pointer select-none">
          {label}
        </label>
        {error && <span className="text-[11px] text-red-600 font-medium mt-0.5">{error}</span>}
      </div>
    </div>
  );
};
