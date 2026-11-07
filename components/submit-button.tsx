"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "@/lib/ui-classes";

export function SubmitButton({
  children,
  pendingLabel = "Working…",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={buttonClass} disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
