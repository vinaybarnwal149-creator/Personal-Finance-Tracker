import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      id,
      name,
      type = 'text',
      placeholder,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      onRightIconClick,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <LeftIcon className="w-5 h-5" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            placeholder={placeholder}
            className={`block w-full h-11 rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-primary text-sm transition-colors ${
              LeftIcon ? 'pl-11' : 'pl-4'
            } ${RightIcon ? 'pr-11' : 'pr-4'} ${
              error ? 'border-expense focus:border-expense focus:ring-expense' : ''
            } ${className}`}
            {...props}
          />
          {RightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <RightIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-expense font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

