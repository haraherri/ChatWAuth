import { Skeleton } from "@/components/ui/skeleton";

const DashboardCardSkeleton = () => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
    <div className="flex items-center justify-between pb-2">
      <Skeleton className="h-4 w-[100px]" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
    <Skeleton className="h-8 w-[120px] mt-2" />
    <Skeleton className="h-3 w-[140px] mt-2" />
  </div>
);

export const TabContentSkeleton = () => (
  <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <DashboardCardSkeleton key={i} />
      ))}
    </div>
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-[300px]" />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[160px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
