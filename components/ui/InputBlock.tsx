import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface BaseProps {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

interface InputBlockProps extends BaseProps, InputHTMLAttributes<HTMLInputElement> {
  multiline?: false;
}

interface TextareaBlockProps extends BaseProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  multiline: true;
  rows?: number;
}

type Props = InputBlockProps | TextareaBlockProps;

const baseInputClasses =
  "w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-primary/50 focus:shadow-[0_0_0_2px_rgba(123,63,242,0.08)]";

export default function InputBlock(props: Props) {
  // Destructure multiline and rows before spreading so they never reach the DOM
  const { label, error, helperText, className = "", multiline, ...rest } = props as Props & { rows?: number };
  const { rows, ...inputRest } = rest;
  const inputId = label?.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          id={inputId}
          rows={rows ?? 3}
          className={`${baseInputClasses} resize-none ${error ? "border-error" : ""}`}
          {...(inputRest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={inputId}
          className={`${baseInputClasses} ${error ? "border-error" : ""}`}
          {...(inputRest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && <p className="text-xs text-error">{error}</p>}
      {!error && helperText && <p className="text-xs text-text-muted">{helperText}</p>}
    </div>
  );
}
