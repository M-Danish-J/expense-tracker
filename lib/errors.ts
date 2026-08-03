import type { PostgrestError } from "@supabase/supabase-js";

/** The shape every Server Action returns, so forms handle results uniformly. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok(): ActionResult;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

/**
 * Turns a Postgres/PostgREST failure into something a person can act on.
 *
 * Raw database text never reaches the browser: constraint and trigger errors we
 * raise deliberately are mapped to plain language, and anything unrecognised
 * becomes a generic message while the real error is logged server-side.
 */
export function toUserMessage(
  error: PostgrestError | Error | null,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!error) return fallback;

  console.error("[expensio]", error);

  const code = "code" in error ? error.code : undefined;
  const message = error.message ?? "";

  // Trigger-raised validation messages are already written for humans.
  const knownTriggerMessages = [
    "must match the workspace currency",
    "must match the account currency",
    "belongs to a different workspace",
    "Categories support two levels only",
    "cannot sit under a",
    "cannot use a",
    "Cannot add a transaction to an inactive account",
    "Cannot transfer using an inactive account",
    "Transfer currency",
  ];
  if (knownTriggerMessages.some((fragment) => message.includes(fragment))) {
    return message;
  }

  switch (code) {
    case "23505":
      return "That already exists. Try a different name.";
    case "23503":
      // FK RESTRICT — something still references this row.
      return "This is still used by existing records, so it can't be removed. Deactivate it instead.";
    case "23514":
      if (message.includes("amount")) {
        return "The amount must be greater than zero.";
      }
      if (message.includes("distinct_accounts")) {
        return "Choose two different accounts for a transfer.";
      }
      return "Some of the values entered aren't valid.";
    case "42501":
    case "PGRST301":
      return "You don't have permission to do that in this workspace.";
    case "PGRST116":
      return "That record no longer exists.";
    default:
      return fallback;
  }
}
