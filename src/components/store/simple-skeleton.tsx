export function SimpleSkeleton() {
  return (
    <div className="container-page max-w-3xl py-10" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-72 max-w-full animate-pulse rounded-full bg-cream-dark" />
      <div className="card mt-8 h-72 animate-pulse" />
    </div>
  );
}
