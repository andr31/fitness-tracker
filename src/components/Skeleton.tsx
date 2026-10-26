interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-gray-700/60 ${className}`}
    />
  );
}

export function SessionCardSkeleton() {
  return (
    <div
      className="border rounded-lg p-4 space-y-3"
      style={{ borderColor: 'rgb(75, 85, 99)', backgroundColor: 'rgb(55, 65, 81)' }}
    >
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-3 w-1/3" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export function PlayerCardSkeleton() {
  return (
    <div
      className="rounded-xl border p-4 space-y-4"
      style={{ borderColor: 'rgb(55, 65, 81)', backgroundColor: 'rgba(31, 41, 55, 0.6)' }}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
