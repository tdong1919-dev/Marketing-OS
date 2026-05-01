"use client";
import { KeyboardEvent, useState } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  label?: string;
}

export default function TagInput({ value, onChange, placeholder = "Type and press Enter...", maxTags, label }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim();
    if (!tag || value.includes(tag) || (maxTags && value.length >= maxTags)) return;
    onChange([...value, tag]);
    setInput("");
  };

  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag));

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !input && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-white/80">{label}</label>}
      <div className="flex flex-wrap gap-2 bg-surface-2 border border-white/10 focus-within:border-brand-purple rounded-lg px-3 py-2 min-h-[42px] transition-colors">
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1 bg-brand-purple/20 border border-brand-purple/30 text-brand-purple text-xs px-2 py-0.5 rounded-full">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition-colors">×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-white/30 outline-none"
        />
      </div>
      {maxTags && (
        <p className="text-xs text-white/40">{value.length}/{maxTags} tags</p>
      )}
    </div>
  );
}
