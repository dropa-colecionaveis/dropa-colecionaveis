/*
  Warnings:

  - You are about to drop the column `dailyLimit` on the `auto_sell_configs` table. All the data in the column will be lost.
  - You are about to drop the column `delayBetweenSales` on the `auto_sell_configs` table. All the data in the column will be lost.
  - You are about to drop the column `enabled` on the `auto_sell_configs` table. All the data in the column will be lost.
  - You are about to drop the column `maxItemValue` on the `auto_sell_configs` table. All the data in the column will be lost.
  - You are about to drop the column `minItemValue` on the `auto_sell_configs` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "free_pack_grants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" DATETIME,
    CONSTRAINT "free_pack_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "free_pack_grants_packId_fkey" FOREIGN KEY ("packId") REFERENCES "packs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auto_sell_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sellCommon" BOOLEAN NOT NULL DEFAULT true,
    "sellUncommon" BOOLEAN NOT NULL DEFAULT true,
    "sellRare" BOOLEAN NOT NULL DEFAULT false,
    "sellEpic" BOOLEAN NOT NULL DEFAULT false,
    "sellLegendary" BOOLEAN NOT NULL DEFAULT false,
    "keepQuantity" INTEGER NOT NULL DEFAULT 1,
    "sellLimitedEd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "auto_sell_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_auto_sell_configs" ("createdAt", "id", "keepQuantity", "sellCommon", "sellEpic", "sellLegendary", "sellLimitedEd", "sellRare", "sellUncommon", "updatedAt", "userId") SELECT "createdAt", "id", "keepQuantity", "sellCommon", "sellEpic", "sellLegendary", "sellLimitedEd", "sellRare", "sellUncommon", "updatedAt", "userId" FROM "auto_sell_configs";
DROP TABLE "auto_sell_configs";
ALTER TABLE "new_auto_sell_configs" RENAME TO "auto_sell_configs";
CREATE UNIQUE INDEX "auto_sell_configs_userId_key" ON "auto_sell_configs"("userId");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "hasReceivedFreePack" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "provider" TEXT,
    "providerAccountId" TEXT
);
INSERT INTO "new_users" ("createdAt", "credits", "email", "id", "name", "password", "updatedAt") SELECT "createdAt", "credits", "email", "id", "name", "password", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "admin_logs_userId_createdAt_idx" ON "admin_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_logs_action_idx" ON "admin_logs"("action");
