CREATE TABLE "MaterialStore" ("id" TEXT NOT NULL PRIMARY KEY, "revision" INTEGER NOT NULL DEFAULT 0, "data" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL);
CREATE TABLE "MaterialSource" ("id" TEXT NOT NULL PRIMARY KEY, "episodeId" INTEGER NOT NULL, "data" TEXT NOT NULL);
CREATE INDEX "MaterialSource_episodeId_idx" ON "MaterialSource"("episodeId");
CREATE TABLE "MaterialLesson" ("id" TEXT NOT NULL PRIMARY KEY, "sourceId" TEXT NOT NULL, "status" TEXT NOT NULL, "data" TEXT NOT NULL, FOREIGN KEY ("sourceId") REFERENCES "MaterialSource"("id") ON DELETE RESTRICT);
CREATE INDEX "MaterialLesson_sourceId_status_idx" ON "MaterialLesson"("sourceId", "status");
CREATE TABLE "MaterialEntry" ("id" TEXT NOT NULL PRIMARY KEY, "lessonId" TEXT NOT NULL, "kind" TEXT NOT NULL, "approved" BOOLEAN NOT NULL DEFAULT false, "data" TEXT NOT NULL, FOREIGN KEY ("lessonId") REFERENCES "MaterialLesson"("id") ON DELETE RESTRICT);
CREATE INDEX "MaterialEntry_lessonId_kind_idx" ON "MaterialEntry"("lessonId", "kind");
CREATE TABLE "MaterialProgress" ("lessonId" TEXT NOT NULL PRIMARY KEY, "data" TEXT NOT NULL, FOREIGN KEY ("lessonId") REFERENCES "MaterialLesson"("id") ON DELETE RESTRICT);
