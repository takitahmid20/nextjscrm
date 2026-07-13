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
  const errorId = `${fieldId}-error`;
  return (
    <div className={cn('flex flex-col space-y-1.5 w-full', className)}>
      {label && (
        <label htmlFor={fieldId} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none whitespace-nowrap truncate">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <input
        id={fieldId}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-10 px-3 bg-background border border-border rounded-[6px] text-xs text-foreground placeholder:text-muted-foreground outline-none transition-colors selection:bg-primary/10 w-full focus:border-primary focus:ring-1 focus:ring-ring',
          error ? 'border-destructive bg-destructive/10 focus:ring-destructive focus:border-destructive' : ''
        )}
        {...register}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-destructive font-medium">
          {error}
        </p>
      )}
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
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // `value !== undefined` is the single source of truth for controlled vs
  // uncontrolled mode. When controlled, the prop drives what is displayed;
  // when uncontrolled, we fall back to internal state seeded once from
  // `defaultValue`/the first option. This avoids the one-render-behind
  // staleness risk of syncing controlled `value` into state via useEffect.
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(() => {
    if (defaultValue !== undefined) return defaultValue;
    return options[0]?.value || '';
  });

  const selectedValue = isControlled ? (value as string) : internalValue;

  const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
    setInternalValue(val);
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

    triggerRef.current?.focus();
  };

  const selectedLabel = options.find((opt) => opt.value === selectedValue)?.label || selectedValue || placeholder;
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    opt.value.toLowerCase().includes(search.toLowerCase())
  );

  const fieldId = id || (register ? register.name : 'select-field');
  const errorId = `${fieldId}-error`;
  const listboxId = `${fieldId}-listbox`;

  const heightClass = className?.split(' ').find(c => c.startsWith('h-')) || 'h-10';
  const cleanedClassName = className?.split(' ').filter(c => !c.startsWith('h-')).join(' ');

  // Reset the highlighted option whenever the popover opens, defaulting to
  // whichever option is currently selected.
  useEffect(() => {
    if (open) {
      const idx = filteredOptions.findIndex((opt) => opt.value === selectedValue);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the highlighted index in range whenever the filtered list shrinks/grows.
  useEffect(() => {
    setHighlightedIndex((idx) => {
      if (filteredOptions.length === 0) return 0;
      return Math.min(idx, filteredOptions.length - 1);
    });
  }, [filteredOptions.length]);

  const handlePopoverKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((idx) => Math.min(idx + 1, filteredOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((idx) => Math.max(idx - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filteredOptions[highlightedIndex];
      if (opt) selectOption(opt.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setSearch('');
      triggerRef.current?.focus();
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setOpen(true);
    } else if (open && e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className={cn('flex flex-col space-y-1.5 w-full relative', cleanedClassName)} ref={dropdownRef}>
      {label && (
        <label htmlFor={fieldId} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none whitespace-nowrap truncate">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        id={fieldId}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'px-3 bg-muted hover:bg-accent border border-border rounded-[6px] text-xs text-foreground font-medium flex items-center justify-between transition-colors w-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary',
          heightClass,
          error ? 'border-destructive bg-destructive/10' : ''
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-1.5" />
      </button>

      {register ? (
        <select
          ref={(el) => {
            register.ref(el);
            hiddenSelectRef.current = el;
          }}
          name={register.name}
          onChange={(e) => {
            setInternalValue(e.target.value);
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
            setInternalValue(e.target.value);
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
        <div
          className="absolute top-[calc(100%+4px)] left-0 w-full bg-popover border border-border rounded-[8px] shadow-lg py-1.5 z-50 flex flex-col max-h-[250px]"
          onKeyDown={handlePopoverKeyDown}
        >
          <div className="px-2 pb-1.5 border-b border-border relative">
            <Search className="absolute left-4.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              placeholder="Filter options..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-foreground bg-muted border border-border rounded-[4px] pl-7.5 pr-2.5 py-1.5 outline-none focus:border-primary focus:ring-1 focus:ring-ring"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div
            id={listboxId}
            role="listbox"
            aria-activedescendant={filteredOptions[highlightedIndex] ? `${fieldId}-option-${highlightedIndex}` : undefined}
            className="overflow-y-auto flex-1 mt-1 font-sans text-xs max-h-[160px] crm-scrollbar"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === selectedValue;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={opt.value}
                    id={`${fieldId}-option-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => selectOption(opt.value)}
                    className={cn(
                      'w-full text-left px-3 py-2 flex items-center justify-between text-foreground hover:bg-accent transition-colors',
                      isSelected ? 'bg-accent text-primary font-semibold' : '',
                      isHighlighted && !isSelected ? 'bg-accent/60' : ''
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-muted-foreground text-center italic text-[11px]">
                No options match search
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-destructive font-medium">
          {error}
        </p>
      )}
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
  const errorId = `${fieldId}-error`;
  return (
    <div className={cn('flex flex-col space-y-1.5 w-full', className)}>
      <label htmlFor={fieldId} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'px-3 py-2 bg-background border border-border rounded-[6px] text-xs text-foreground placeholder:text-muted-foreground outline-none transition-colors resize-none selection:bg-primary/10 w-full focus:border-primary focus:ring-1 focus:ring-ring',
          error ? 'border-destructive bg-destructive/10 focus:ring-destructive focus:border-destructive' : ''
        )}
        {...register}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-destructive font-medium">
          {error}
        </p>
      )}
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
  const errorId = `${fieldId}-error`;
  return (
    <div className={cn('flex items-start space-x-2.5 w-full py-1.5', className)}>
      <input
        id={fieldId}
        type="checkbox"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-4 w-4 rounded border-border text-primary focus:ring-ring/40 cursor-pointer mt-0.5 transition-shadow'
        )}
        {...register}
        {...props}
      />
      <div className="flex flex-col">
        <label htmlFor={fieldId} className="text-xs font-semibold text-foreground cursor-pointer select-none">
          {label}
        </label>
        {error && (
          <p id={errorId} role="alert" className="text-[11px] text-destructive font-medium mt-0.5">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

interface FormDatePickerProps extends BaseFieldProps {
  value?: string;
  onChange?: (dateString: string) => void;
  placeholder?: string;
  registerName?: string;
  // Intentionally `name: any` — react-hook-form's UseFormSetValue<T> narrows
  // `name` to a literal union of T's keys per form, which is incompatible
  // with a single shared prop type across every form that uses this picker.
  setValue?: (name: any, value: string, options?: Record<string, unknown>) => void;
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
  const fieldId = id || registerName || 'date-field';
  const errorId = `${fieldId}-error`;

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
      <label htmlFor={fieldId} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none whitespace-nowrap truncate">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={fieldId}
            type="button"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'h-10 px-3 bg-background border border-border rounded-[6px] text-xs text-foreground outline-none transition-colors w-full text-left flex items-center justify-between hover:bg-accent focus:border-primary',
              error ? 'border-destructive bg-destructive/10 focus:ring-destructive focus:border-destructive' : ''
            )}
          >
            <span>{value ? new Date(value).toLocaleDateString('en-US') : placeholder}</span>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover border border-border shadow-md z-50 rounded-[8px]" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-destructive font-medium">
          {error}
        </p>
      )}
    </div>
  );
};
