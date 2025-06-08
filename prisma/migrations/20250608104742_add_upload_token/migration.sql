/*
  Warnings:

  - Added the required column `userId` to the `UploadToken` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UploadToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "UploadToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UploadToken" ("createdAt", "email", "expiresAt", "id", "token") SELECT "createdAt", "email", "expiresAt", "id", "token" FROM "UploadToken";
DROP TABLE "UploadToken";
ALTER TABLE "new_UploadToken" RENAME TO "UploadToken";
CREATE UNIQUE INDEX "UploadToken_token_key" ON "UploadToken"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
