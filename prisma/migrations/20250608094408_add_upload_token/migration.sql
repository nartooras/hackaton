-- CreateTable
CREATE TABLE "UploadToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadToken_token_key" ON "UploadToken"("token");

-- CreateIndex
CREATE INDEX "UploadToken_email_idx" ON "UploadToken"("email");
