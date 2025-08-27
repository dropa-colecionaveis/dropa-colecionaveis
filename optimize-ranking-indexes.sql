-- Ranking Performance Optimization Indexes
-- This script creates optimized indexes for the rankings system

-- 1. Compound index for ranking queries with user role filtering
CREATE INDEX IF NOT EXISTS idx_ranking_category_user_role ON "Ranking"(category, "userId") 
  INCLUDE (position, value, "seasonId", "updatedAt");

-- 2. Index for global ranking distinct user queries  
CREATE INDEX IF NOT EXISTS idx_ranking_userid_distinct ON "Ranking"("userId")
  INCLUDE (category, position, value);

-- 3. User role filtering optimization
CREATE INDEX IF NOT EXISTS idx_user_role_not_admin ON "User"(role)
  WHERE role NOT IN ('ADMIN', 'SUPER_ADMIN');

-- 4. UserStats optimization for ranking calculations
CREATE INDEX IF NOT EXISTS idx_userstats_category_values ON "UserStats"("userId")
  INCLUDE ("totalXP", "totalPacksOpened", "totalItemsCollected", "marketplaceSales", "marketplacePurchases", "currentStreak", "longestStreak", "lastActivityAt");

-- 5. Achievement-based XP calculation optimization
CREATE INDEX IF NOT EXISTS idx_userachievement_completed ON "UserAchievement"("userId", "isCompleted")
  INCLUDE ("achievementId")
  WHERE "isCompleted" = true;

-- 6. Achievement points lookup optimization
CREATE INDEX IF NOT EXISTS idx_achievement_points ON "Achievement"(id)
  INCLUDE (points);

-- 7. Season-based ranking queries
CREATE INDEX IF NOT EXISTS idx_ranking_season_category ON "Ranking"("seasonId", category)
  INCLUDE (position, "userId", value);

-- 8. User activity time-based queries
CREATE INDEX IF NOT EXISTS idx_userstats_activity_time ON "UserStats"("lastActivityAt")
  INCLUDE ("userId", "currentStreak", "longestStreak")
  WHERE "lastActivityAt" IS NOT NULL;

-- 9. Position-based ranking queries (for leaderboards)
CREATE INDEX IF NOT EXISTS idx_ranking_position_lookup ON "Ranking"(category, position)
  INCLUDE ("userId", value, "seasonId");

-- 10. Recently updated rankings (cache invalidation)
CREATE INDEX IF NOT EXISTS idx_ranking_updated_recent ON "Ranking"(category, "updatedAt")
  WHERE "updatedAt" > NOW() - INTERVAL '10 minutes';

-- Statistics update to help query planner
ANALYZE "Ranking";
ANALYZE "User";
ANALYZE "UserStats";
ANALYZE "UserAchievement";
ANALYZE "Achievement";