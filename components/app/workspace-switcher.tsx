"use client";

import { useState, useTransition } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { toast } from "@/components/ui/toaster";
import { switchWorkspace } from "@/app/actions/workspace";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkspaceOption {
  readonly id: string;
  readonly name: string;
  readonly currency: string;
}

/**
 * Sits at the top of the sidebar. With a single workspace it renders as the
 * brand row from the Pencil design; the moment there is more than one, the same
 * row becomes a picker — no separate code path to keep in sync later.
 */
export function WorkspaceSwitcher({
  workspaces,
  activeId,
}: {
  readonly workspaces: readonly WorkspaceOption[];
  readonly activeId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  if (workspaces.length <= 1) {
    return (
      <div className="flex items-center px-4 py-5">
        <Logo variant="dark" size="sm" />
      </div>
    );
  }

  const handleSelect = (id: string) => {
    if (id === activeId) return;
    startTransition(async () => {
      const result = await switchWorkspace(id);
      if (!result.ok) toast.error(result.error);
    });
  };

  return (
    <div className="px-2 py-4">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          disabled={isPending}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors",
            "hover:bg-sidebar-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-text-active/40",
            isPending && "opacity-60",
          )}
        >
          <Logo variant="dark" size="sm" showWordmark={false} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-medium text-sidebar-text-active">
              {active.name}
            </span>
            <span className="block text-caption text-sidebar-text">
              {active.currency}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-sidebar-text" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onSelect={() => handleSelect(workspace.id)}
              className="justify-between"
            >
              <span className="truncate">{workspace.name}</span>
              {workspace.id === activeId ? (
                <Check className="size-4 text-brand-900" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
