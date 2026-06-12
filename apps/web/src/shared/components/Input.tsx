import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-semibold text-on-surface block ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full h-14 px-5 rounded-full text-on-surface bg-white/50 border border-outline/20 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-on-surface-variant/50 ${
            error ? 'border-error bg-error-container text-on-error-container' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-error ml-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
