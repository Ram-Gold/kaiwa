export default function DictionaryLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse">
      {/* Header skeleton */}
      <header className="mb-6">
        <div className="h-4 w-28 rounded bg-ink/10" />
        <div className="mt-2 h-10 w-64 rounded bg-ink/10" />
      </header>

      {/* Search skeleton */}
      <div className="h-12 w-full rounded-xl bg-ink/10 brutal-border" />

      {/* Filter pills skeleton */}
      <div className="mt-6 flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-11 w-16 rounded-xl bg-ink/10" />
        ))}
      </div>

      {/* Word cards skeleton */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="brutal-border rounded-2xl bg-white p-5 shadow-nav">
            <div className="h-6 w-20 rounded bg-ink/10" />
            <div className="mt-2 h-4 w-32 rounded bg-ink/10" />
            <div className="mt-3 h-3 w-full rounded bg-ink/10" />
            <div className="mt-1 h-3 w-3/4 rounded bg-ink/10" />
          </div>
        ))}
      </section>
    </div>
  );
}
