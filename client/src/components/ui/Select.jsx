import React, { forwardRef } from 'react';

const Select = forwardRef(
  ({ label, error, id, name, options = [], className = '', children, ...props }, ref) => {
    const selectId = id || name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          name={name}
          className={`block w-full h-11 rounded-xl border-slate-300 bg-white text-slate-900 focus:border-primary focus:ring-primary text-sm px-3.5 transition-colors ${
            error ? 'border-expense focus:border-expense focus:ring-expense' : ''
          } ${className}`}
          {...props}
        >
          {children
            ? children
            : options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
        </select>
        {error && <p className="mt-1.5 text-xs text-expense font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;

