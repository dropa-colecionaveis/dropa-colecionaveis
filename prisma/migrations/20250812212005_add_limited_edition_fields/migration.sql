/*
  Warnings:

  - You are about to drop the column `theme` on the `collections` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "themes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT NOT NULL DEFAULT '📚',
    "colorClass" TEXT NOT NULL DEFAULT 'from-gray-500/20 to-slate-500/20',
    "borderClass" TEXT NOT NULL DEFAULT 'border-gray-500/30',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "limited_editions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "serialNumber" INTEGER NOT NULL,
    "mintedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "limited_editions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "themeId" TEXT,
    "customTheme" TEXT,
    "imageUrl" TEXT,
    "maxItems" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLimited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "collections_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "themes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_collections" ("createdAt", "description", "id", "imageUrl", "isActive", "isLimited", "maxItems", "name") SELECT "createdAt", "description", "id", "imageUrl", "isActive", "isLimited", "maxItems", "name" FROM "collections";
DROP TABLE "collections";
ALTER TABLE "new_collections" RENAME TO "collections";
CREATE UNIQUE INDEX "collections_name_key" ON "collections"("name");
CREATE TABLE "new_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "collectionId" TEXT,
    "itemNumber" INTEGER,
    "isLimitedEdition" BOOLEAN NOT NULL DEFAULT false,
    "maxEditions" INTEGER,
    "currentEditions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_items" ("collectionId", "createdAt", "description", "id", "imageUrl", "isActive", "itemNumber", "name", "rarity", "value") SELECT "collectionId", "createdAt", "description", "id", "imageUrl", "isActive", "itemNumber", "name", "rarity", "value" FROM "items";
DROP TABLE "items";
ALTER TABLE "new_items" RENAME TO "items";
CREATE TABLE "new_user_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "obtainedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "limitedEditionId" TEXT,
    CONSTRAINT "user_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_items_limitedEditionId_fkey" FOREIGN KEY ("limitedEditionId") REFERENCES "limited_editions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_user_items" ("id", "itemId", "obtainedAt", "userId") SELECT "id", "itemId", "obtainedAt", "userId" FROM "user_items";
DROP TABLE "user_items";
ALTER TABLE "new_user_items" RENAME TO "user_items";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "themes_name_key" ON "themes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "limited_editions_itemId_serialNumber_key" ON "limited_editions"("itemId", "serialNumber");
