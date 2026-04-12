export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* Greeting skeleton */}
        <div className="mb-6">
          <div className="h-3 w-24 bg-stone-200 rounded animate-pulse mb-3" />
          <div className="h-8 w-48 bg-stone-200 rounded-lg animate-pulse" />
        </div>

        {/* Next delivery highlight skeleton */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-stone-200 animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-28 bg-stone-200 rounded animate-pulse mb-2" />
                <div className="h-5 w-40 bg-stone-200 rounded-lg animate-pulse mb-2" />
                <div className="h-3 w-52 bg-stone-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-12 h-6 bg-stone-200 rounded-full animate-pulse flex-shrink-0" />
          </div>
        </div>

        {/* Pending payments alert skeleton */}
        <div className="flex items-center gap-3 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-9 h-9 bg-stone-200 rounded-full animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 w-48 bg-stone-200 rounded animate-pulse mb-1" />
            <div className="h-3 w-32 bg-stone-200 rounded animate-pulse" />
          </div>
          <div className="w-4 h-4 bg-stone-200 rounded animate-pulse flex-shrink-0" />
        </div>

        {/* Mes contrats section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-24 bg-stone-200 rounded animate-pulse" />
            <div className="h-3 w-20 bg-stone-200 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-200">
                <div className="w-10 h-10 bg-stone-200 rounded-lg animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-stone-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-24 bg-stone-200 rounded animate-pulse" />
                </div>
                <div className="w-4 h-4 bg-stone-200 rounded animate-pulse flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Mes permanences section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-28 bg-stone-200 rounded animate-pulse" />
            <div className="h-3 w-20 bg-stone-200 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl border border-stone-200 p-3">
                <div className="w-11 h-11 bg-stone-200 rounded-lg animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-stone-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-stone-200 rounded animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-stone-200 rounded-full animate-pulse flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Prochaines dates section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-32 bg-stone-200 rounded animate-pulse" />
            <div className="h-3 w-20 bg-stone-200 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl border border-stone-200 p-3">
                <div className="w-11 h-11 bg-stone-200 rounded-lg animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-36 bg-stone-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-40 bg-stone-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links section */}
        <div className="mb-6">
          <div className="h-4 w-24 bg-stone-200 rounded animate-pulse mb-3" />
          <div className="grid grid-cols-2 gap-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-200">
                <div className="w-9 h-9 bg-stone-200 rounded-lg animate-pulse flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-20 bg-stone-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-16 bg-stone-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution info skeleton */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-stone-200 rounded-full animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-stone-200 rounded animate-pulse mb-1" />
              <div className="h-3 w-56 bg-stone-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
