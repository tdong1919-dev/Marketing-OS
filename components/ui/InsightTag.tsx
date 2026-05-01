type TagType =
  | "Hot Lead"
  | "Complaint Risk"
  | "Spam"
  | "Pricing Question"
  | "Booking Intent"
  | "General Inquiry"
  | "Positive Feedback";

interface InsightTagProps {
  tag: TagType | string;
  className?: string;
}

const tagConfig: Record<string, string> = {
  "Hot Lead":          "bg-primary/10 text-primary border border-primary/20",
  "Booking Intent":    "bg-primary/10 text-primary border border-primary/20",
  "Pricing Question":  "bg-accent-purple/15 text-purple-300 border border-accent-purple/25",
  "General Inquiry":   "bg-white/5 text-text-secondary border border-border",
  "Positive Feedback": "bg-success/10 text-success border border-success/20",
  "Complaint Risk":    "bg-warning/10 text-warning border border-warning/20",
  "Spam":              "bg-error/10 text-error border border-error/20",
};

export default function InsightTag({ tag, className = "" }: InsightTagProps) {
  const classes = tagConfig[tag] ?? "bg-white/5 text-text-secondary border border-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${classes} ${className}`}>
      {tag}
    </span>
  );
}
