import { Suspense } from "react";

import { getSessionContext } from "@/lib/workspace";
import { Sidebar } from "@/components/app/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The application shell: a fixed sidebar on large screens, a drawer below that,
 * and the page's own header inside the content column.
 *
 * `cacheComponents` is enabled, so anything that reads cookies — which the
 * session does — has to sit behind a Suspense boundary. That works in our
 * favour: the shell paints immediately and each region streams in.
 */
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-svh bg-background">
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarRegion />
      </Suspense>
      <div className="lg:pl-60">{children}</div>
    </div>
  );
}

async function SidebarRegion() {
  const session = await getSessionContext();
  return <Sidebar session={session} />;
}

function SidebarSkeleton() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 bg-sidebar lg:block">
      <div className="px-4 py-5">
        <Skeleton className="h-8 w-32 bg-white/10" />
      </div>
      <div className="space-y-1 px-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-white/5" />
        ))}
      </div>
    </aside>
  );
}
