import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  // Force recompilation - timestamp: 2025-09-02 12:38:30
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    // Fetch user with public visibility settings
    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        profileVisibility: true,
        createdAt: true,
        userStats: {
          select: {
            level: true,
            totalXP: true,
            currentStreak: true,
            longestStreak: true
          }
        },
        _count: {
          select: {
            packOpenings: true,
            userItems: true,
            userAchievements: true
          }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check privacy settings
    if (targetUser.profileVisibility === 'PRIVATE') {
      return NextResponse.json(
        { error: 'Profile is private' },
        { status: 403 }
      )
    }

    // For FRIENDS_ONLY, we would need to implement friendship system
    // For now, treat FRIENDS_ONLY as PRIVATE
    if (targetUser.profileVisibility === 'FRIENDS_ONLY') {
      const session = await getServerSession(authOptions)
      
      // Allow user to see their own profile even if set to FRIENDS_ONLY
      if (!session?.user?.id || session.user.id !== params.userId) {
        return NextResponse.json(
          { error: 'Profile is visible to friends only' },
          { status: 403 }
        )
      }
    }

    // Fetch additional public profile data
    const [rankingsData, achievementsData, collectionsData, rareItemsData] = await Promise.all([
      // User rankings in different categories
      prisma.ranking.findMany({
        where: { userId: params.userId },
        select: {
          category: true,
          position: true,
          value: true
        },
        orderBy: { position: 'asc' },
        take: 5 // Top 5 rankings
      }),

      // Recent achievements
      prisma.userAchievement.findMany({
        where: { userId: params.userId },
        include: {
          achievement: {
            select: {
              id: true,
              name: true,
              description: true,
              icon: true,
              category: true,
              points: true
            }
          }
        },
        orderBy: { unlockedAt: 'desc' },
        take: 10
      }),

      // Completed collections - temporarily simplified
      Promise.resolve([]),

      // Rare items (Epic and Legendary)
      prisma.userItem.findMany({
        where: {
          userId: params.userId,
          item: {
            rarity: {
              in: ['EPICO', 'LENDARIO']
            }
          }
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              rarity: true,
              value: true
            }
          }
        },
        orderBy: [
          { item: { rarity: 'desc' } },
          { item: { value: 'desc' } }
        ],
        take: 8
      })
    ])

    // Build public profile response
    const publicProfile = {
      id: targetUser.id,
      name: targetUser.name || 'Anonymous User',
      memberSince: targetUser.createdAt,
      stats: {
        level: targetUser.userStats?.level || 1,
        totalXP: targetUser.userStats?.totalXP || 0,
        currentStreak: targetUser.userStats?.currentStreak || 0,
        longestStreak: targetUser.userStats?.longestStreak || 0,
        totalPacksOpened: targetUser._count.packOpenings,
        totalItems: targetUser._count.userItems,
        totalAchievements: targetUser._count.userAchievements
      },
      rankings: rankingsData.map(ranking => ({
        category: ranking.category,
        position: ranking.position,
        value: ranking.value
      })),
      achievements: achievementsData.map(ua => ({
        id: ua.achievement.id,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        category: ua.achievement.category,
        points: ua.achievement.points,
        unlockedAt: ua.unlockedAt
      })),
      completedCollections: collectionsData.map(uc => ({
        id: uc.collection.id,
        name: uc.collection.name,
        description: uc.collection.description,
        theme: uc.collection.theme,
        completedAt: uc.completedAt
      })),
      rareItems: rareItemsData.map(ui => ({
        id: ui.item.id,
        name: ui.item.name,
        imageUrl: ui.item.imageUrl,
        rarity: ui.item.rarity,
        value: ui.item.value,
        obtainedAt: ui.obtainedAt
      }))
    }

    const response = NextResponse.json({
      success: true,
      profile: publicProfile
    })

    // Cache public profiles for 5 minutes
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    console.error('Error fetching public profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}