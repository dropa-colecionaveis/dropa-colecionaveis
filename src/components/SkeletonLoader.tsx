interface SkeletonLoaderProps {
  width?: string
  height?: string
  className?: string
}

export function SkeletonLoader({ width = "w-full", height = "h-4", className = "" }: SkeletonLoaderProps) {
  return (
    <div className={`${width} ${height} bg-gradient-to-r from-gray-700/50 via-gray-600/50 to-gray-700/50 rounded animate-pulse ${className}`}></div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-purple-400/30">
      <div className="flex items-center space-x-2">
        <SkeletonLoader width="w-6" height="h-6" className="rounded-full" />
        <div>
          <SkeletonLoader width="w-20" height="h-4" className="mb-1" />
          <SkeletonLoader width="w-16" height="h-3" />
        </div>
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="text-center">
            <SkeletonLoader width="w-12" height="h-12" className="mx-auto mb-3 rounded-full" />
            <SkeletonLoader width="w-16" height="h-8" className="mx-auto mb-2" />
            <SkeletonLoader width="w-20" height="h-4" className="mx-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ActivitiesSkeleton() {
  return (
    <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
      <SkeletonLoader width="w-48" height="h-8" className="mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-3 p-3 rounded-xl bg-white/5">
            <SkeletonLoader width="w-10" height="h-10" className="rounded-full" />
            <div className="flex-1">
              <SkeletonLoader width="w-3/4" height="h-4" className="mb-2" />
              <SkeletonLoader width="w-1/2" height="h-3" />
            </div>
            <SkeletonLoader width="w-16" height="h-3" />
          </div>
        ))}
      </div>
    </div>
  )
}