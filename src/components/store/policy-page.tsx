export function PolicyPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">{title}</h1>
      <div className="prose-simple card mt-8 p-6 sm:p-8">{children}</div>
    </div>
  );
}
