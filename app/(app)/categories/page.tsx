import { Suspense } from "react";
import type { Metadata } from "next";
import { Tags } from "lucide-react";

import { getSessionContext } from "@/lib/workspace";
import {
  buildCategoryTree,
  getAccounts,
  getCategories,
  getCategoryUsage,
} from "@/lib/db/queries";
import { canWrite, type CategoryTree, type CategoryType } from "@/lib/db/types";
import { Header } from "@/components/app/header";
import { AddTransactionButton } from "@/components/app/add-transaction-button";
import {
  NewCategoryButton,
} from "@/components/categories/category-dialog";
import { CategoryRowActions } from "@/components/categories/category-row-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesContent />
    </Suspense>
  );
}

async function CategoriesContent() {
  const session = await getSessionContext();
  const workspaceId = session.workspace.id;

  const [categories, usage, accounts] = await Promise.all([
    getCategories(workspaceId),
    getCategoryUsage(workspaceId),
    getAccounts(workspaceId),
  ]);

  const writable = canWrite(session.role);
  const tree = buildCategoryTree(categories);
  const roots = categories.filter((c) => c.parent_id === null);
  const expense = tree.filter((c) => c.type === "expense");
  const income = tree.filter((c) => c.type === "income");

  // A category is protected if it labels transactions or has children.
  const isInUse = (id: string) =>
    (usage.get(id) ?? 0) > 0 || categories.some((c) => c.parent_id === id);

  return (
    <>
      <Header
        session={session}
        title="Categories"
        subtitle="Organise where your money goes and comes from."
        actions={
          writable ? (
            <div className="flex items-center gap-2">
              <NewCategoryButton roots={roots} variant="secondary" />
              <AddTransactionButton
                accounts={accounts}
                categories={buildCategoryTree(
                  categories.filter((c) => c.is_active),
                )}
                currency={session.currency}
                compact
              />
            </div>
          ) : null
        }
      />

      <main className="px-4 py-lg sm:px-lg">
        {categories.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface shadow-card">
            <EmptyState
              icon={Tags}
              title="No categories yet"
              description="Categories let the dashboard break your spending down. Create your first one to get started."
              action={
                writable ? (
                  <NewCategoryButton roots={roots} label="Add a category" />
                ) : null
              }
            />
          </div>
        ) : (
          <div className="grid gap-lg lg:grid-cols-2">
            <CategoryColumn
              title="Expense categories"
              type="expense"
              tree={expense}
              roots={roots}
              writable={writable}
              isInUse={isInUse}
            />
            <CategoryColumn
              title="Income categories"
              type="income"
              tree={income}
              roots={roots}
              writable={writable}
              isInUse={isInUse}
            />
          </div>
        )}
      </main>
    </>
  );
}

function CategoryColumn({
  title,
  type,
  tree,
  roots,
  writable,
  isInUse,
}: {
  readonly title: string;
  readonly type: CategoryType;
  readonly tree: readonly CategoryTree[];
  readonly roots: readonly import("@/lib/db/types").Category[];
  readonly writable: boolean;
  readonly isInUse: (id: string) => boolean;
}) {
  return (
    <section aria-labelledby={`${type}-categories`} className="space-y-md">
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${type}-categories`} className="text-h3 font-medium text-content">
          {title}
        </h2>
        {writable ? (
          <NewCategoryButton
            roots={roots}
            variant="ghost"
            label="+ Add"
            defaultType={type}
          />
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
        {tree.length === 0 ? (
          <EmptyState
            icon={Tags}
            title={`No ${type} categories`}
            description={`Add your first ${type} category to start grouping entries.`}
            className="py-xl"
          />
        ) : (
          <ul className="divide-y divide-border-light">
            {tree.map((parent) => (
              <li key={parent.id}>
                <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-body font-medium text-content">
                      {parent.name}
                    </span>
                    {parent.is_active ? null : (
                      <Badge variant="warning">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {writable ? (
                      <NewCategoryButton
                        roots={roots}
                        variant="ghost"
                        label="+ Sub"
                        defaultType={type}
                        defaultParentId={parent.id}
                      />
                    ) : null}
                    {writable ? (
                      <CategoryRowActions
                        roots={roots}
                        isInUse={isInUse(parent.id)}
                        category={{
                          id: parent.id,
                          name: parent.name,
                          type: parent.type as CategoryType,
                          parent_id: parent.parent_id,
                          is_active: parent.is_active,
                        }}
                      />
                    ) : null}
                  </div>
                </div>

                {parent.children.length > 0 ? (
                  <ul className="border-t border-border-light bg-surface-secondary/40">
                    {parent.children.map((child) => (
                      <li
                        key={child.id}
                        className="flex items-center justify-between gap-3 py-2.5 pl-10 pr-5"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-body text-content-secondary">
                            {child.name}
                          </span>
                          {child.is_active ? null : (
                            <Badge variant="warning">Inactive</Badge>
                          )}
                        </div>
                        {writable ? (
                          <CategoryRowActions
                            roots={roots}
                            isInUse={isInUse(child.id)}
                            category={{
                              id: child.id,
                              name: child.name,
                              type: child.type as CategoryType,
                              parent_id: child.parent_id,
                              is_active: child.is_active,
                            }}
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CategoriesSkeleton() {
  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border bg-background px-4 py-3.5 sm:px-lg">
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="grid gap-lg px-4 py-lg sm:px-lg lg:grid-cols-2">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </>
  );
}
