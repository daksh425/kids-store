export function GridSkeleton() {
  return (
    <div className="container-page py-10" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-64 animate-pulse rounded-full bg-cream-dark" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-full bg-cream-dark" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="aspect-[3/4] animate-pulse bg-cream-dark" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-cream-dark" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-cream-dark" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
