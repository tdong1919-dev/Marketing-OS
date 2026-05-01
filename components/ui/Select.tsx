import { SelectHTMLAttributes } from "react";

interface Option { value: string; label: string }

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
}

export default function Select({ label, error, options, className = "", id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`bg-surface-2 border rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors appearance-none cursor-pointer
          ${error ? "border-brand-pink focus:border-brand-pink" : "border-white/10 focus:border-brand-purple"}
          ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface-2">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-brand-pink">{error}</p>}
    </div>
  );
}
