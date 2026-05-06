"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className={`flex items-start justify-between gap-4 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer group"}`}>
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">{label}</p>}
          {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
        </div>
      )}
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200
          ${checked ? "bg-gradient-brand shadow-[0_0_12px_rgba(123,63,242,0.4)]" : "bg-border"}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200
          ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </div>
    </label>
  );
}
