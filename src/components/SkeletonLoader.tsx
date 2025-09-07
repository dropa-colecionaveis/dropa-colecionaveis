import { memo } from 'react'

interface SkeletonLoaderProps {
  width?: string
  height?: string
  className?: string
}

export function SkeletonLoader({ width = "w-full", height = "h-4", className = "" }: SkeletonLoaderProps) {
  return (
    <div className={`${width} ${height} bg-gradient-to-r from-gray-700/50 via-gray-600/50 to-gray-700/50 rounded animate-pulse ${className}`}>
      <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" 
           style={{
             backgroundSize: '200% 100%',
             animation: 'shimmer 2s infinite linear'
           }}
      ></div>
    </div>
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

export function RankingsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <SkeletonLoader width="w-12" height="h-12" className="rounded-full" />
              <div className="flex items-center space-x-4">
                <SkeletonLoader width="w-10" height="h-10" className="rounded-full flex-shrink-0" />
                <div>
                  <SkeletonLoader width="w-32" height="h-6" className="mb-2" />
                  <SkeletonLoader width="w-24" height="h-4" />
                </div>
              </div>
            </div>
            <div className="text-right">
              <SkeletonLoader width="w-16" height="h-8" className="mb-1 ml-auto" />
              <SkeletonLoader width="w-12" height="h-4" className="ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function RankingCategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="text-center">
            <SkeletonLoader width="w-12" height="h-12" className="mx-auto mb-3 rounded-full" />
            <SkeletonLoader width="w-24" height="h-6" className="mx-auto mb-2" />
            <SkeletonLoader width="w-32" height="h-4" className="mx-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function UserRankingStatsSkeleton() {
  return (
    <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <SkeletonLoader width="w-32" height="h-6" className="mb-2" />
          <SkeletonLoader width="w-24" height="h-4" />
        </div>
        <div className="text-right">
          <SkeletonLoader width="w-16" height="h-8" className="mb-2" />
          <SkeletonLoader width="w-20" height="h-4" />
        </div>
      </div>
    </div>
  )
}

export function PacksSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="text-center mb-6">
            <SkeletonLoader width="w-16" height="h-16" className="mx-auto mb-4 rounded-full" />
            <SkeletonLoader width="w-32" height="h-8" className="mx-auto mb-2" />
            <SkeletonLoader width="w-48" height="h-4" className="mx-auto mb-4" />
            <SkeletonLoader width="w-24" height="h-8" className="mx-auto" />
          </div>

          {/* Probabilities skeleton */}
          <div className="mb-6">
            <SkeletonLoader width="w-28" height="h-6" className="mb-3" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                  <SkeletonLoader width="w-16" height="h-4" />
                  <SkeletonLoader width="w-8" height="h-4" />
                </div>
              ))}
            </div>
          </div>

          {/* Action button skeleton */}
          <SkeletonLoader width="w-full" height="h-12" className="rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function HeaderStatsSkeleton() {
  return (
    <div className="flex items-center space-x-2 sm:space-x-4">
      {/* Level and XP skeleton - sempre visível e com tamanho normal */}
      <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-4 border border-purple-400/30">
        <div className="text-center">
          <SkeletonLoader width="w-12 sm:w-16" height="h-3 sm:h-4" className="mb-1" />
          <SkeletonLoader width="w-8 sm:w-12" height="h-2 sm:h-3" />
        </div>
      </div>

      {/* Container para elementos empilhados no mobile */}
      <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4">
        {/* Ranking skeleton */}
        <div className="bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 backdrop-blur-sm rounded-xl px-2 py-1 sm:px-4 sm:py-2 border border-indigo-400/30">
          <div className="text-center">
            <SkeletonLoader width="w-16 sm:w-20" height="h-3 sm:h-4" className="mb-1" />
            <SkeletonLoader width="w-12 sm:w-16" height="h-2 sm:h-3" />
          </div>
        </div>

        {/* Credits skeleton */}
        <div className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 backdrop-blur-sm rounded-xl px-2 py-1 sm:px-4 sm:py-2 border border-yellow-400/30">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <SkeletonLoader width="w-4 sm:w-6" height="h-4 sm:h-6" className="rounded-full" />
            <div>
              <SkeletonLoader width="w-8 sm:w-12" height="h-3 sm:h-4" className="mb-1" />
              <SkeletonLoader width="w-12 sm:w-16" height="h-2 sm:h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const InventoryStatsSkeleton = memo(() => {
  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="group bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-blue-500/30">
          <SkeletonLoader width="w-8" height="h-8" className="mx-auto mb-2 rounded-full" />
          <SkeletonLoader width="w-16" height="h-8" className="mx-auto mb-1" />
          <SkeletonLoader width="w-20" height="h-4" className="mx-auto" />
        </div>
      ))}
    </div>
  )
})
InventoryStatsSkeleton.displayName = 'InventoryStatsSkeleton'

export const InventoryFilterSkeleton = memo(() => {
  return (
    <div className="mb-8">
      <div className="text-center mb-4">
        <SkeletonLoader width="w-48" height="h-6" className="mx-auto mb-4" />
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonLoader key={i} width="w-24" height="h-12" className="rounded-xl" />
        ))}
      </div>
    </div>
  )
})
InventoryFilterSkeleton.displayName = 'InventoryFilterSkeleton'

export const InventoryItemSkeleton = memo(() => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border-2 border-gray-500/30">
      <div className="text-center mb-4">
        <SkeletonLoader width="w-32" height="h-32" className="mx-auto mb-4 rounded-xl" />
        <SkeletonLoader width="w-24" height="h-6" className="mx-auto mb-2" />
        <SkeletonLoader width="w-full" height="h-4" className="mb-3" />
        <SkeletonLoader width="w-20" height="h-6" className="mx-auto rounded-full" />
      </div>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <SkeletonLoader width="w-12" height="h-4" />
          <SkeletonLoader width="w-16" height="h-4" />
        </div>
        <div className="flex justify-between">
          <SkeletonLoader width="w-16" height="h-4" />
          <SkeletonLoader width="w-20" height="h-4" />
        </div>
        <div className="flex justify-between">
          <SkeletonLoader width="w-14" height="h-4" />
          <SkeletonLoader width="w-18" height="h-4" />
        </div>
      </div>
      
      <div className="flex space-x-2">
        <SkeletonLoader width="w-1/2" height="h-8" className="rounded" />
        <SkeletonLoader width="w-1/2" height="h-8" className="rounded" />
      </div>
    </div>
  )
})
InventoryItemSkeleton.displayName = 'InventoryItemSkeleton'

export const InventoryGridSkeleton = memo(() => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <InventoryItemSkeleton key={i} />
      ))}
    </div>
  )
})
InventoryGridSkeleton.displayName = 'InventoryGridSkeleton'

export const CollectionStatsSkeleton = memo(() => {
  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="group bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-green-500/30">
          <SkeletonLoader width="w-8" height="h-8" className="mx-auto mb-2 rounded-full" />
          <SkeletonLoader width="w-16" height="h-8" className="mx-auto mb-1" />
          <SkeletonLoader width="w-20" height="h-4" className="mx-auto" />
        </div>
      ))}
    </div>
  )
})
CollectionStatsSkeleton.displayName = 'CollectionStatsSkeleton'

export const CollectionFilterSkeleton = memo(() => {
  return (
    <div className="mb-8">
      <div className="text-center mb-4">
        <SkeletonLoader width="w-48" height="h-6" className="mx-auto mb-4" />
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonLoader key={i} width="w-32" height="h-12" className="rounded-xl" />
        ))}
      </div>
    </div>
  )
})
CollectionFilterSkeleton.displayName = 'CollectionFilterSkeleton'

export const CollectionCardSkeleton = memo(() => {
  return (
    <div className="bg-gradient-to-br from-gray-500/20 to-slate-500/20 backdrop-blur-lg rounded-lg p-6 border border-gray-500/30">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <SkeletonLoader width="w-8" height="h-8" className="rounded-full" />
          <div>
            <SkeletonLoader width="w-32" height="h-6" className="mb-2" />
            <SkeletonLoader width="w-20" height="h-4" />
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-1">
          <SkeletonLoader width="w-20" height="h-6" className="rounded-full" />
        </div>
      </div>
      
      <SkeletonLoader width="w-full" height="h-10" className="mb-4" />
      
      {/* Progress section */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <SkeletonLoader width="w-16" height="h-4" />
          <SkeletonLoader width="w-12" height="h-4" />
        </div>
        <SkeletonLoader width="w-full" height="h-3" className="rounded-full mb-1" />
        <div className="text-right">
          <SkeletonLoader width="w-8" height="h-3" className="ml-auto" />
        </div>
      </div>
      
      <div className="text-center">
        <SkeletonLoader width="w-24" height="h-4" className="mx-auto" />
      </div>
    </div>
  )
})
CollectionCardSkeleton.displayName = 'CollectionCardSkeleton'

export const CollectionsGridSkeleton = memo(() => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CollectionCardSkeleton key={i} />
      ))}
    </div>
  )
})
CollectionsGridSkeleton.displayName = 'CollectionsGridSkeleton'

export const AchievementStatsSkeleton = memo(() => {
  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="group bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-blue-500/30">
          <SkeletonLoader width="w-8" height="h-8" className="mx-auto mb-2 rounded-full" />
          <SkeletonLoader width="w-16" height="h-8" className="mx-auto mb-1" />
          <SkeletonLoader width="w-20" height="h-4" className="mx-auto" />
        </div>
      ))}
    </div>
  )
})
AchievementStatsSkeleton.displayName = 'AchievementStatsSkeleton'

export const RecentUnlocksSkeleton = memo(() => {
  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
      <div className="text-center mb-6">
        <SkeletonLoader width="w-48" height="h-8" className="mx-auto" />
      </div>
      <div className="grid md:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
            <SkeletonLoader width="w-16" height="w-16" className="mx-auto mb-3 rounded-full" />
            <SkeletonLoader width="w-20" height="h-4" className="mx-auto mb-1" />
            <SkeletonLoader width="w-16" height="h-3" className="mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
})
RecentUnlocksSkeleton.displayName = 'RecentUnlocksSkeleton'

export const AchievementFiltersSkeleton = memo(() => {
  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
      <div className="text-center mb-8">
        <SkeletonLoader width="w-56" height="h-8" className="mx-auto" />
      </div>
      
      {/* Category Filter */}
      <div className="mb-8">
        <SkeletonLoader width="w-32" height="h-6" className="mb-4" />
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonLoader key={i} width="w-28" height="h-12" className="rounded-xl" />
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <SkeletonLoader width="w-20" height="h-6" className="mb-4" />
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} width="w-24" height="h-12" className="rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
})
AchievementFiltersSkeleton.displayName = 'AchievementFiltersSkeleton'

export const AchievementCardSkeleton = memo(() => {
  return (
    <div className="group bg-gradient-to-br from-white/5 to-white/2 border-2 border-gray-600/30 rounded-2xl p-6">
      <div className="text-center mb-4">
        <SkeletonLoader width="w-16" height="w-16" className="mx-auto mb-3 rounded-full" />
        <SkeletonLoader width="w-32" height="h-6" className="mx-auto mb-2" />
        <SkeletonLoader width="w-full" height="h-10" className="mb-3" />
        <SkeletonLoader width="w-20" height="h-6" className="mx-auto rounded-full" />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <SkeletonLoader width="w-8" height="h-4" />
          <SkeletonLoader width="w-12" height="h-4" />
        </div>

        <div className="flex justify-between items-center">
          <SkeletonLoader width="w-24" height="h-4" />
          <SkeletonLoader width="w-20" height="h-4" />
        </div>

        <SkeletonLoader width="w-full" height="h-16" className="rounded-xl" />
      </div>
    </div>
  )
})
AchievementCardSkeleton.displayName = 'AchievementCardSkeleton'

export const AchievementsGridSkeleton = memo(() => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <AchievementCardSkeleton key={i} />
      ))}
    </div>
  )
})
AchievementsGridSkeleton.displayName = 'AchievementsGridSkeleton'

export const ProfileSettingsSkeleton = memo(() => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-b border-purple-500/30 shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SkeletonLoader width="w-30" height="h-15" />
              <div className="hidden md:block">
                <SkeletonLoader width="w-48" height="h-6" className="mb-2" />
                <SkeletonLoader width="w-64" height="h-4" />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <SkeletonLoader width="w-32" height="h-10" className="rounded-lg" />
              <SkeletonLoader width="w-10" height="h-10" className="rounded-lg" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12">
            <SkeletonLoader width="w-96" height="h-10" className="mx-auto mb-4" />
            <SkeletonLoader width="w-80" height="h-6" className="mx-auto" />
          </div>

          {/* Profile Picture Section */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
            <div className="flex items-center mb-6">
              <SkeletonLoader width="w-8" height="h-8" className="rounded-full mr-3" />
              <SkeletonLoader width="w-40" height="h-8" />
            </div>

            <div className="flex flex-col items-center mb-6">
              <SkeletonLoader width="w-32" height="h-32" className="rounded-full mb-4" />
              <SkeletonLoader width="w-48" height="h-6" className="mb-2" />
              <SkeletonLoader width="w-64" height="h-4" />
            </div>

            <div className="flex justify-center space-x-4">
              <SkeletonLoader width="w-32" height="h-12" className="rounded-lg" />
              <SkeletonLoader width="w-28" height="h-12" className="rounded-lg" />
            </div>
          </div>

          {/* Display Name Section */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
            <div className="flex items-center mb-6">
              <SkeletonLoader width="w-8" height="h-8" className="rounded-full mr-3" />
              <SkeletonLoader width="w-40" height="h-8" />
            </div>

            <div className="space-y-4">
              <div>
                <SkeletonLoader width="w-32" height="h-5" className="mb-2" />
                <div className="flex items-center space-x-4">
                  <SkeletonLoader width="w-64" height="h-12" className="rounded-lg" />
                  <SkeletonLoader width="w-20" height="h-12" className="rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Settings Section */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
            <div className="flex items-center mb-6">
              <SkeletonLoader width="w-8" height="h-8" className="rounded-full mr-3" />
              <SkeletonLoader width="w-48" height="h-8" />
            </div>

            <SkeletonLoader width="w-full" height="h-5" className="mb-6" />

            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <SkeletonLoader width="w-8" height="h-8" className="rounded-full" />
                      <div>
                        <SkeletonLoader width="w-24" height="h-6" className="mb-1" />
                        <SkeletonLoader width="w-80" height="h-4" />
                      </div>
                    </div>
                    <SkeletonLoader width="w-6" height="h-6" className="rounded-full" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <SkeletonLoader width="w-32" height="h-12" className="rounded-lg" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
})
ProfileSettingsSkeleton.displayName = 'ProfileSettingsSkeleton'

export const PublicProfileSkeleton = memo(() => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-b border-purple-500/30 shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SkeletonLoader width="w-30" height="h-15" />
              <div className="hidden md:block">
                <SkeletonLoader width="w-40" height="h-6" className="mb-2" />
                <SkeletonLoader width="w-32" height="h-4" />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <SkeletonLoader width="w-28" height="h-10" className="rounded-lg" />
              <SkeletonLoader width="w-24" height="h-10" className="rounded-lg" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 md:p-8 mb-8 border border-white/20 shadow-xl">
            {/* Mobile Layout */}
            <div className="block md:hidden text-center mb-6">
              <SkeletonLoader width="w-24" height="h-24" className="rounded-full mx-auto mb-4" />
              <SkeletonLoader width="w-48" height="h-8" className="mx-auto mb-3" />
              <div className="space-y-2">
                <SkeletonLoader width="w-32" height="h-5" className="mx-auto" />
                <SkeletonLoader width="w-40" height="h-5" className="mx-auto" />
                <SkeletonLoader width="w-36" height="h-5" className="mx-auto" />
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-start space-x-8">
              <SkeletonLoader width="w-32" height="h-32" className="rounded-full flex-shrink-0" />
              <div className="flex-1">
                <SkeletonLoader width="w-64" height="h-10" className="mb-6" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="text-center">
                      <SkeletonLoader width="w-16" height="h-8" className="mx-auto mb-2" />
                      <SkeletonLoader width="w-20" height="h-5" className="mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rankings Section */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
            <div className="flex items-center mb-6">
              <SkeletonLoader width="w-8" height="h-8" className="rounded-full mr-3" />
              <SkeletonLoader width="w-32" height="h-8" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-xl p-4 border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <SkeletonLoader width="w-24" height="h-5" className="mb-1" />
                      <SkeletonLoader width="w-20" height="h-4" />
                    </div>
                    <div className="text-right">
                      <SkeletonLoader width="w-8" height="h-8" className="mb-1 ml-auto rounded-full" />
                      <SkeletonLoader width="w-12" height="h-5" className="ml-auto" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Achievements */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
              <div className="flex items-center mb-6">
                <SkeletonLoader width="w-8" height="h-8" className="rounded-full mr-3" />
                <SkeletonLoader width="w-40" height="h-8" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-center space-x-4">
                      <SkeletonLoader width="w-12" height="h-12" className="rounded-full" />
                      <div className="flex-1">
                        <SkeletonLoader width="w-32" height="h-5" className="mb-2" />
                        <SkeletonLoader width="w-48" height="h-4" className="mb-1" />
                        <SkeletonLoader width="w-24" height="h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rare Items */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
              <div className="flex items-center mb-6">
                <SkeletonLoader width="w-8" height="h-8" className="rounded-full mr-3" />
                <SkeletonLoader width="w-24" height="h-8" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-600/30">
                    <SkeletonLoader width="w-full" height="h-20" className="rounded-lg mb-3" />
                    <div className="text-center">
                      <SkeletonLoader width="w-16" height="h-4" className="mx-auto mb-1" />
                      <SkeletonLoader width="w-12" height="h-3" className="mx-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Collections Section */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mt-8 border border-white/20 shadow-xl">
            <div className="flex items-center mb-6">
              <SkeletonLoader width="w-8" height="h-8" className="rounded-full mr-3" />
              <SkeletonLoader width="w-32" height="h-8" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gradient-to-br from-gray-500/20 to-slate-500/20 backdrop-blur-lg rounded-lg p-6 border border-gray-500/30">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      <SkeletonLoader width="w-8" height="h-8" className="rounded-full" />
                      <div>
                        <SkeletonLoader width="w-24" height="h-6" className="mb-2" />
                        <SkeletonLoader width="w-16" height="h-4" />
                      </div>
                    </div>
                    <SkeletonLoader width="w-16" height="h-6" className="rounded-full" />
                  </div>
                  
                  <SkeletonLoader width="w-full" height="h-10" className="mb-4" />
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <SkeletonLoader width="w-16" height="h-4" />
                      <SkeletonLoader width="w-12" height="h-4" />
                    </div>
                    <SkeletonLoader width="w-full" height="h-3" className="rounded-full" />
                    <SkeletonLoader width="w-12" height="h-3" className="ml-auto mt-1" />
                  </div>
                  
                  <div className="text-center">
                    <SkeletonLoader width="w-24" height="h-4" className="mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
})
PublicProfileSkeleton.displayName = 'PublicProfileSkeleton'