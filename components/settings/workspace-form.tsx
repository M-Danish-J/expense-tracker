"use client";

import { useForm } from "react-hook-form";

import { renameWorkspace } from "@/app/actions/workspace";
import { workspaceSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";

export function WorkspaceForm({ name }: { readonly name: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<{ name: string }>({ defaultValues: { name } });

  const onSubmit = handleSubmit(async (values) => {
    const parsed = workspaceSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    const result = await renameWorkspace(parsed.data);
    if (result.ok) toast.success("Workspace updated");
    else toast.error(result.error);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-lg">
      <div className="space-y-1.5">
        <Label htmlFor="workspace-name">Workspace name</Label>
        <Input
          id="workspace-name"
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-caption text-danger" role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Saving…" : "Save workspace"}
      </Button>
    </form>
  );
}
