import { Skeleton } from '@/components/shared/Skeletons';

export function StatusListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="card-soft divide-y divide-border/60">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3.5">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded-full" />
            <Skeleton className="h-3 w-1/4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MyStatusSkeleton() {
  return (
    <div className="card-soft flex items-center gap-3 p-3.5">
      <Skeleton className="h-14 w-14 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-3 w-40 rounded-full" />
      </div>
    </div>
  );
}
