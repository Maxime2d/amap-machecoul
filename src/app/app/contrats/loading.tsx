export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7f4] via-white to-[#f8f7f4]">
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="h-10 w-48 bg-stone-200 rounded-lg animate-pulse mb-3" />
              <div className="h-6 w-64 bg-stone-200 rounded animate-pulse" />
            </div>
            <div className="h-11 w-40 bg-stone-200 rounded-xl animate-pulse flex-shrink-0" />
          </div>
        </div>

        {/* Active contracts section */}
        <div className="mb-12">
          <div className="mb-6">
            <div className="h-6 w-32 bg-stone-200 rounded-lg animate-pulse" />
          </div>

          {/* Contract cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md border border-stone-200 p-6">
                {/* Card header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-stone-200 rounded-xl animate-pulse flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="h-5 w-32 bg-stone-200 rounded animate-pulse mb-2" />
                      <div className="h-3 w-28 bg-stone-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-stone-200 rounded-lg animate-pulse flex-shrink-0" />
                </div>

                {/* Nature badge */}
                <div className="mb-4">
                  <div className="h-6 w-24 bg-stone-200 rounded-full animate-pulse inline-block" />
                </div>

                {/* Amount */}
                <div className="mb-5 pb-5 border-b border-stone-100">
                  <div className="h-3 w-20 bg-stone-200 rounded animate-pulse mb-2" />
                  <div className="h-8 w-32 bg-stone-200 rounded-lg animate-pulse" />
                </div>

                {/* Progress bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-3 w-20 bg-stone-200 rounded animate-pulse" />
                    <div className="h-3 w-12 bg-stone-200 rounded animate-pulse" />
                  </div>
                  <div className="h-2 w-full bg-stone-200 rounded-full animate-pulse" />
                </div>

                {/* Date range */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-4 h-4 bg-stone-200 rounded animate-pulse flex-shrink-0" />
                  <div className="h-3 w-48 bg-stone-200 rounded animate-pulse flex-1" />
                </div>

                {/* Footer CTA */}
                <div className="pt-4 border-t border-stone-100">
                  <div className="h-4 w-32 bg-stone-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other contracts section */}
        <div>
          <div className="mb-6">
            <div className="h-6 w-40 bg-stone-200 rounded-lg animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md border border-stone-200 p-6 opacity-85">
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-stone-200 rounded-xl animate-pulse flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="h-5 w-32 bg-stone-200 rounded animate-pulse mb-2" />
                      <div className="h-3 w-28 bg-stone-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-stone-200 rounded-lg animate-pulse flex-shrink-0" />
                </div>

                {/* Nature badge */}
                <div className="mb-4">
                  <div className="h-6 w-24 bg-stone-200 rounded-full animate-pulse inline-block" />
                </div>

                {/* Amount */}
                <div className="mb-4 pb-4 border-b border-stone-100">
                  <div className="h-3 w-16 bg-stone-200 rounded animate-pulse mb-2" />
                  <div className="h-7 w-28 bg-stone-200 rounded-lg animate-pulse" />
                </div>

                {/* Date range */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-4 h-4 bg-stone-200 rounded animate-pulse flex-shrink-0" />
                  <div className="h-3 w-40 bg-stone-200 rounded animate-pulse flex-1" />
                </div>

                {/* Footer CTA */}
                <div className="pt-4 border-t border-stone-100">
                  <div className="h-4 w-32 bg-stone-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
