export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="h-9 w-56 animate-pulse rounded-full bg-cream-dark" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-28 animate-pulse" />
        ))}
      </div>
      <div className="card mt-6 h-72 animate-pulse" />
    </div>
  );
}
