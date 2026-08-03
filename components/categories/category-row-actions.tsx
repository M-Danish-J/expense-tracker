"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from "lucide-react";

import { deleteCategory, setCategoryActive } from "@/app/actions/categories";
import { toast } from "@/components/ui/toaster";
import {
  CategoryDialog,
  type CategoryDraft,
} from "@/components/categories/category-dialog";
import type { Category } from "@/lib/db/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Delete is only offered for a category nothing depends on. Anything with
 * transactions or sub-categories is deactivated instead, which keeps the label
 * on historical records intact.
 */
export function CategoryRowActions({
  category,
  roots,
  isInUse,
}: {
  readonly category: CategoryDraft;
  readonly roots: readonly Category[];
  readonly isInUse: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggleActive = () => {
    startTransition(async () => {
      const result = await setCategoryActive(category.id, !category.is_active);
      if (result.ok) {
        toast.success(
          category.is_active ? "Category deactivated" : "Category reactivated",
        );
      } else {
        toast.error(result.error);
      }
    });
  };

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.ok) {
        toast.success("Category deleted");
        setConfirmingDelete(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isPending}
          aria-label={`Actions for ${category.name}`}
          className="flex size-8 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onSelect={() => setEditing(true)}
            className="cursor-pointer"
          >
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleActive} className="cursor-pointer">
            {category.is_active ? (
              <>
                <PowerOff className="size-4" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="size-4" />
                Reactivate
              </>
            )}
          </DropdownMenuItem>
          {isInUse ? null : (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setConfirmingDelete(true)}
                className="cursor-pointer text-danger focus:text-danger"
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CategoryDialog
        open={editing}
        onOpenChange={setEditing}
        roots={roots}
        draft={category}
      />

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {category.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Nothing is filed under this category, so it can be removed
              permanently. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending}>
              {isPending ? "Deleting…" : "Delete category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
