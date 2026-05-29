/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, Check, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
      {label && (
        <label htmlFor={fieldId} className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none whitespace-nowrap truncate">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
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

interface FormSelectProps extends Omit<BaseFieldProps, 'label'>, Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'onChange' | 'value'> {
  label?: string;
  register?: UseFormRegisterReturn;
  options: { value: string; label: string }[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  id,
  className,
  required,
  register,
  options,
  value,
  defaultValue,
  onChange,
  placeholder = "Select an option...",
  ...props
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const getInitialValue = () => {
    if (value !== undefined) return value;
    if (defaultValue !== undefined) return defaultValue;
    return options[0]?.value || '';
  };
  
  const [selectedValue, setSelectedValue] = useState(getInitialValue());
  const hiddenSelectRef = useRef<HTMLSelectElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectOption = (val: string) => {
    setSelectedValue(val);
    setOpen(false);
    setSearch('');
    
    if (onChange) {
      onChange(val);
    }

    if (hiddenSelectRef.current) {
      const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
        HTMLSelectElement.prototype,
        'value'
      )?.set;
      if (nativeSelectValueSetter) {
        nativeSelectValueSetter.call(hiddenSelectRef.current, val);
      } else {
        hiddenSelectRef.current.value = val;
      }
      const event = new Event('change', { bubbles: true });
      hiddenSelectRef.current.dispatchEvent(event);
    }
  };

  const selectedLabel = options.find((opt) => opt.value === selectedValue)?.label || selectedValue || placeholder;
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()) || 
    opt.value.toLowerCase().includes(search.toLowerCase())
  );

  const fieldId = id || (register ? register.name : 'select-field');

  const heightClass = className?.split(' ').find(c => c.startsWith('h-')) || 'h-10';
  const cleanedClassName = className?.split(' ').filter(c => !c.startsWith('h-')).join(' ');

  return (
    <div className={cn('flex flex-col space-y-1.5 w-full relative', cleanedClassName)} ref={dropdownRef}>
      {label && (
        <label htmlFor={fieldId} className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none whitespace-nowrap truncate">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <button
        id={fieldId}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'px-3 bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] rounded-[6px] text-xs text-[#1F2937] font-medium flex items-center justify-between transition-colors w-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]',
          heightClass,
          error ? 'border-red-500 bg-red-50/10' : ''
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0 ml-1.5" />
      </button>

      {register ? (
        <select
          ref={(e) => {
            register.ref(e);
            (hiddenSelectRef as any).current = e;
          }}
          name={register.name}
          onChange={(e) => {
            setSelectedValue(e.target.value);
            register.onChange(e);
          }}
          onBlur={register.onBlur}
          value={selectedValue}
          className="hidden"
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <select
          ref={hiddenSelectRef}
          value={selectedValue}
          onChange={(e) => {
            setSelectedValue(e.target.value);
            if (onChange) onChange(e.target.value);
          }}
          className="hidden"
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg py-1.5 z-50 flex flex-col max-h-[250px]">
          <div className="px-2 pb-1.5 border-b border-slate-100 relative">
            <Search className="absolute left-4.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Filter options..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-[4px] pl-7.5 pr-2.5 py-1.5 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="overflow-y-auto flex-1 mt-1 font-sans text-xs max-h-[160px] crm-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === selectedValue;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => selectOption(opt.value)}
                    className={cn(
                      'w-full text-left px-3 py-2 flex items-center justify-between text-slate-700 hover:bg-slate-100 transition-colors',
                      isSelected ? 'bg-slate-50 text-[#2563EB] font-semibold' : ''
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#2563EB] flex-shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-slate-400 text-center italic text-[11px]">
                No options match search
              </div>
            )}
          </div>
        </div>
      )}

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

interface FormDatePickerProps extends BaseFieldProps {
  value?: string;
  onChange?: (dateString: string) => void;
  placeholder?: string;
  registerName?: string;
  setValue?: (name: any, value: any, options?: any) => void;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  error,
  id,
  className,
  required,
  value,
  onChange,
  placeholder = "Select Date",
  registerName,
  setValue,
}) => {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? new Date(value) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Create local YYYY-MM-DD offset-corrected string
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      const dateStr = localDate.toISOString().slice(0, 10);
      
      if (onChange) {
        onChange(dateStr);
      }
      if (registerName && setValue) {
        setValue(registerName, dateStr, { shouldValidate: true, shouldDirty: true });
      }
      setOpen(false);
    }
  };

  return (
    <div className={cn('flex flex-col space-y-1.5 w-full', className)}>
      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider select-none whitespace-nowrap truncate">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'h-10 px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#111827] outline-none transition-colors w-full text-left flex items-center justify-between hover:bg-slate-50 focus:border-[#2563EB]',
              error ? 'border-red-500 bg-red-50/10 focus:ring-red-500 focus:border-red-500' : ''
            )}
          >
            <span>{value ? new Date(value).toLocaleDateString() : placeholder}</span>
            <CalendarIcon className="h-4 w-4 text-slate-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border border-[#E5E7EB] shadow-md z-50 rounded-[8px]" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
      {error && <span className="text-[11px] text-red-600 font-medium">{error}</span>}
    </div>
  );
};
