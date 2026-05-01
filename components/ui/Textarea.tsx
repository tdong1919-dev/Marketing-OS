"use client";
import { TextareaHTMLAttributes, useState } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
}

export default function Textarea({ label, error, helperText, maxLength, className = "", id, onChange, value, defaultValue, ...props }: TextareaProps) {
  const [charCount, setCharCount] = useState(
    typeof value === "string" ? value.length : typeof defaultValue === "string" ? defaultValue.length : 0
  );
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          setCharCount(e.target.value.length);
          onChange?.(e);
        }}
        className={`bg-surface-2 border rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors resize-none min-h-[100px]
          ${error ? "border-brand-pink focus:border-brand-pink" : "border-white/10 focus:border-brand-purple"}
          ${className}`}
        {...props}
      />
      <div className="flex justify-between">
        <span>{error ? <span className="text-xs text-brand-pink">{error}</span> : helperText ? <span className="text-xs text-white/40">{helperText}</span> : null}</span>
        {maxLength && <span className="text-xs text-white/40">{charCount}/{maxLength}</span>}
      </div>
    </div>
  );
}
