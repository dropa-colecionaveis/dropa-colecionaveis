/*
  Warnings:

  - You are about to drop the column `commonPercent` on the `auto_sell_configs` table. All the data in the column will be lost.
  - You are about to drop the column `epicPercent` on the `auto_sell_configs` table. All the data in the column will be lost.
  - You are about to drop the column `legendaryPercent` on the `auto_sell_configs` table. All the data in the column will be lost.
  - You are about to drop the column `rarePercent` on the `auto_sell_configs` table. All the data in the column will be lost.
  - You are about to drop the column `uncommonPercent` on the `auto_sell_configs` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auto_sell_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_auto_sell_configs" ("createdAt", "dailyLimit", "delayBetweenSales", "enabled", "id", "keepQuantity", "maxItemValue", "minItemValue", "sellCommon", "sellEpic", "sellLegendary", "sellLimitedEd", "sellRare", "sellUncommon", "updatedAt", "userId") SELECT "createdAt", "dailyLimit", "delayBetweenSales", "enabled", "id", "keepQuantity", "maxItemValue", "minItemValue", "sellCommon", "sellEpic", "sellLegendary", "sellLimitedEd", "sellRare", "sellUncommon", "updatedAt", "userId" FROM "auto_sell_configs";
DROP TABLE "auto_sell_configs";
ALTER TABLE "new_auto_sell_configs" RENAME TO "auto_sell_configs";
CREATE UNIQUE INDEX "auto_sell_configs_userId_key" ON "auto_sell_configs"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
