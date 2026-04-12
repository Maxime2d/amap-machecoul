export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero header skeleton */}
      <div className="relative rounded-2xl overflow-hidden mb-6 h-40 md:h-48 bg-stone-200 animate-pulse" />

      {/* Pending payments alert skeleton */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
        <div className="w-9 h-9 bg-stone-200 rounded-full animate-pulse flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 w-40 bg-stone-200 rounded animate-pulse" />
        </div>
        <div className="w-4 h-4 bg-stone-200 rounded animate-pulse flex-shrink-0" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 bg-stone-200 rounded-lg animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-stone-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-24 bg-stone-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent members section */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-100">
            <div className="h-4 w-32 bg-stone-200 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-stone-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 bg-stone-200 rounded-full animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-4 w-32 bg-stone-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-40 bg-stone-200 rounded animate-pulse" />
                </div>
                <div className="h-3 w-12 bg-stone-200 rounded animate-pulse flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Next deliveries */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100">
              <div className="h-4 w-32 bg-stone-200 rounded animate-pulse" />
            </div>
            <div className="p-3 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-stone-50">
                  <div className="w-10 h-10 bg-stone-200 rounded-lg animate-pulse flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-28 bg-stone-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-16 bg-stone-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100">
              <div className="h-4 w-28 bg-stone-200 rounded animate-pulse" />
            </div>
            <div className="p-2 space-y-0.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                  <div className="w-7 h-7 bg-stone-200 rounded-md animate-pulse flex-shrink-0" />
                  <div className="h-4 w-24 bg-stone-200 rounded animate-pulse flex-1" />
                  <div className="w-4 h-4 bg-stone-200 rounded animate-pulse flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Open enrollments section */}
      <div className="mt-4 bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-100">
          <div className="h-4 w-32 bg-stone-200 rounded animate-pulse" />
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-32 bg-stone-200 rounded-xl animate-pulse inline-block" />
          ))}
        </div>
      </div>
    </div>
  );
}
