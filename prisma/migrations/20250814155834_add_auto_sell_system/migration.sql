-- CreateTable
CREATE TABLE "auto_sell_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "commonPercent" REAL NOT NULL DEFAULT 80,
    "uncommonPercent" REAL NOT NULL DEFAULT 85,
    "rarePercent" REAL NOT NULL DEFAULT 90,
    "epicPercent" REAL NOT NULL DEFAULT 95,
    "legendaryPercent" REAL NOT NULL DEFAULT 100,
    "sellCommon" BOOLEAN NOT NULL DEFAULT true,
    "sellUncommon" BOOLEAN NOT NULL DEFAULT true,
    "sellRare" BOOLEAN NOT NULL DEFAULT false,
    "sellEpic" BOOLEAN NOT NULL DEFAULT false,
    "sellLegendary" BOOLEAN NOT NULL DEFAULT false,
    "minItemValue" INTEGER NOT NULL DEFAULT 5,
    "maxItemValue" INTEGER,
    "keepQuantity" INTEGER NOT NULL DEFAULT 0,
    "sellLimitedEd" BOOLEAN NOT NULL DEFAULT false,
    "delayBetweenSales" INTEGER NOT NULL DEFAULT 300,
    "dailyLimit" INTEGER NOT NULL DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "auto_sell_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "auto_sell_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userItemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "configUsed" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "listingId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auto_sell_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_item_protections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userItemId" TEXT NOT NULL,
    "protected" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_item_protections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_item_protections_userItemId_fkey" FOREIGN KEY ("userItemId") REFERENCES "user_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "auto_sell_configs_userId_key" ON "auto_sell_configs"("userId");

-- CreateIndex
CREATE INDEX "auto_sell_logs_userId_createdAt_idx" ON "auto_sell_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "auto_sell_logs_status_idx" ON "auto_sell_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_item_protections_userItemId_key" ON "user_item_protections"("userItemId");

-- CreateIndex
CREATE INDEX "user_item_protections_userId_idx" ON "user_item_protections"("userId");
