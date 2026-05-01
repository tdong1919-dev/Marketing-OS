import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({ label, error, helperText, className = "", id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-surface-2 border rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors
          ${error ? "border-brand-pink focus:border-brand-pink" : "border-white/10 focus:border-brand-purple"}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-brand-pink">{error}</p>}
      {!error && helperText && <p className="text-xs text-white/40">{helperText}</p>}
    </div>
  );
}
