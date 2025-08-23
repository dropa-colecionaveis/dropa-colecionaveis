-- Enable Row Level Security (RLS) for all tables
-- Execute this in Supabase SQL Editor

-- Enable RLS on all main tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pack" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PackOpening" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CollectionItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserCollection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketplaceListing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketplaceTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Achievement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserAchievement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutoSellConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (items that everyone can see)
-- Packs - everyone can see available packs
CREATE POLICY "Packs are viewable by everyone" ON "Pack"
FOR SELECT USING (true);

-- Items - everyone can see items
CREATE POLICY "Items are viewable by everyone" ON "Item"
FOR SELECT USING (true);

-- Collections - everyone can see collections
CREATE POLICY "Collections are viewable by everyone" ON "Collection"
FOR SELECT USING (true);

-- Collection Items - everyone can see collection items
CREATE POLICY "Collection items are viewable by everyone" ON "CollectionItem"
FOR SELECT USING (true);

-- Achievements - everyone can see achievements
CREATE POLICY "Achievements are viewable by everyone" ON "Achievement"
FOR SELECT USING (true);

-- Marketplace Listings - everyone can see active listings
CREATE POLICY "Active marketplace listings are viewable by everyone" ON "MarketplaceListing"
FOR SELECT USING (status = 'ACTIVE');

-- User-specific policies (users can only access their own data)
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON "User"
FOR SELECT USING (auth.uid()::text = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON "User"
FOR UPDATE USING (auth.uid()::text = id);

-- User Items - users can view their own items
CREATE POLICY "Users can view own items" ON "UserItem"
FOR ALL USING (auth.uid()::text = "userId");

-- Pack Openings - users can view their own pack openings
CREATE POLICY "Users can view own pack openings" ON "PackOpening"
FOR ALL USING (auth.uid()::text = "userId");

-- User Collections - users can view their own collections
CREATE POLICY "Users can view own collections" ON "UserCollection"
FOR ALL USING (auth.uid()::text = "userId");

-- User Achievements - users can view their own achievements
CREATE POLICY "Users can view own achievements" ON "UserAchievement"
FOR SELECT USING (auth.uid()::text = "userId");

-- Users can manage their own marketplace listings
CREATE POLICY "Users can manage own marketplace listings" ON "MarketplaceListing"
FOR ALL USING (auth.uid()::text = "sellerId");

-- Users can view marketplace transactions they're involved in
CREATE POLICY "Users can view own marketplace transactions" ON "MarketplaceTransaction"
FOR SELECT USING (auth.uid()::text = "buyerId" OR auth.uid()::text = "sellerId");

-- Users can manage their own auto-sell config
CREATE POLICY "Users can manage own auto-sell config" ON "AutoSellConfig"
FOR ALL USING (auth.uid()::text = "userId");

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON "Payment"
FOR SELECT USING (auth.uid()::text = "userId");

-- Admin policies (for future admin functionality)
-- Note: You'll need to implement proper admin role checking
-- For now, we'll create a simple policy based on admin email or role

-- Enable admin access to all tables (replace 'admin@your-domain.com' with your admin email)
-- Uncomment and modify these when you implement admin authentication:

/*
CREATE POLICY "Admin full access to users" ON "User"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid()::text 
    AND email = 'admin@your-domain.com'
  )
);

-- Add similar admin policies for other tables as needed
*/