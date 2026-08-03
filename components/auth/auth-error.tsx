import { AlertCircle } from "lucide-react";

/** Inline auth failure notice, in the design's danger tint. */
export function AuthError({ message }: { readonly message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md bg-danger-light px-3.5 py-3 text-body text-danger"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
