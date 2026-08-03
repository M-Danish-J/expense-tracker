"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { saveCategory } from "@/app/actions/categories";
import { categorySchema } from "@/lib/validation";
import type { Category, CategoryType } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CategoryDraft {
  readonly id: string;
  readonly name: string;
  readonly type: CategoryType;
  readonly parent_id: string | null;
  readonly is_active: boolean;
}

interface FormValues {
  name: string;
  type: CategoryType;
  parent_id: string;
}

const NO_PARENT = "__none__";

export function CategoryDialog({
  open,
  onOpenChange,
  roots,
  draft,
  defaultType = "expense",
  defaultParentId,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Only top-level categories can be parents — the tree is two levels deep. */
  readonly roots: readonly Category[];
  readonly draft?: CategoryDraft | null;
  readonly defaultType?: CategoryType;
  readonly defaultParentId?: string;
}) {
  const isEditing = Boolean(draft);

  const defaults = useMemo<FormValues>(
    () => ({
      name: draft?.name ?? "",
      type: draft?.type ?? defaultType,
      parent_id: draft?.parent_id ?? defaultParentId ?? NO_PARENT,
    }),
    [draft, defaultType, defaultParentId],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: defaults });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const type = watch("type");
  const parentId = watch("parent_id");

  // A child must share its parent's type, so only same-type roots are offered.
  const availableParents = useMemo(
    () => roots.filter((root) => root.type === type && root.id !== draft?.id),
    [roots, type, draft?.id],
  );

  // Editing a category that already has children would create a third level.
  const hasChildren = Boolean(draft && roots.some((r) => r.id === draft.id));

  const onSubmit = handleSubmit(async (values) => {
    const parsed = categorySchema.safeParse({
      name: values.name,
      type: values.type,
      parent_id: values.parent_id === NO_PARENT ? "" : values.parent_id,
      is_active: draft?.is_active ?? true,
    });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "");
        if (field === "name" || field === "type" || field === "parent_id") {
          setError(field as keyof FormValues, { message: issue.message });
        }
      }
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    const result = await saveCategory(parsed.data, draft?.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Category updated" : "Category created");
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit category" : "New category"}
          </DialogTitle>
          <DialogDescription>
            Group your spending and income so the dashboard can break it down.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="contents">
          <DialogBody className="space-y-lg">
            <div className="space-y-1.5">
              <Label htmlFor="category-type">Type</Label>
              <Tabs
                value={type}
                onValueChange={(value) => {
                  setValue("type", value as CategoryType);
                  setValue("parent_id", NO_PARENT);
                }}
              >
                <TabsList id="category-type" className="grid-cols-2">
                  <TabsTrigger value="expense" tone="expense">
                    Expense
                  </TabsTrigger>
                  <TabsTrigger value="income" tone="income">
                    Income
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                autoComplete="off"
                placeholder="e.g. Groceries"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-caption text-danger" role="alert">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category-parent">Parent category</Label>
              <Select
                value={parentId}
                onValueChange={(value) => setValue("parent_id", value)}
                disabled={hasChildren}
              >
                <SelectTrigger id="category-parent">
                  <SelectValue placeholder="None — top level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>None — top level</SelectItem>
                  {availableParents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-caption text-content-secondary">
                {hasChildren
                  ? "This category has sub-categories, so it has to stay top level."
                  : "Categories go two levels deep, e.g. Food → Groceries."}
              </p>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewCategoryButton({
  roots,
  label = "New category",
  variant = "primary",
  defaultType,
  defaultParentId,
}: {
  readonly roots: readonly Category[];
  readonly label?: string;
  readonly variant?: "primary" | "secondary" | "ghost";
  readonly defaultType?: CategoryType;
  readonly defaultParentId?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={variant === "ghost" ? "sm" : "default"} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <CategoryDialog
        open={open}
        onOpenChange={setOpen}
        roots={roots}
        defaultType={defaultType}
        defaultParentId={defaultParentId}
      />
    </>
  );
}
