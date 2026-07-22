"use client";

import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({
  message,
  children,
  className,
  variant = "ghost",
  size = "sm",
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  return (
    <Button
      variant={variant}
      size={size}
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
