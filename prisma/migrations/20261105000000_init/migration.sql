PRAGMA foreign_keys=ON;

CREATE TABLE "Episode" (
 "id" INTEGER NOT NULL PRIMARY KEY,
 "title" TEXT,
 "titleSource" TEXT
);

CREATE TABLE "Lesson" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "episodeId" INTEGER NOT NULL,
 "title" TEXT NOT NULL,
 "sourceType" TEXT NOT NULL,
 "source" TEXT NOT NULL,
 FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT
);

CREATE TABLE "SubtitleCue" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "lessonId" TEXT NOT NULL,
 "position" INTEGER NOT NULL,
 "start" REAL NOT NULL,
 "end" REAL NOT NULL,
 "text" TEXT NOT NULL,
 "translation" TEXT NOT NULL,
 "sourceType" TEXT NOT NULL,
 "source" TEXT NOT NULL,
 "original" TEXT NOT NULL,
 FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE,
 UNIQUE ("lessonId", "position")
);

CREATE INDEX "SubtitleCue_lessonId_start_idx" ON "SubtitleCue" ("lessonId", "start");

CREATE TABLE "Vocabulary" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "lessonId" TEXT NOT NULL,
 "word" TEXT NOT NULL,
 "ipa" TEXT,
 "meaning" TEXT NOT NULL,
 "data" TEXT NOT NULL,
 FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT
);

CREATE TABLE "Phrase" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "lessonId" TEXT NOT NULL,
 "text" TEXT NOT NULL,
 "meaning" TEXT NOT NULL,
 "source" TEXT NOT NULL,
 FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT
);

CREATE TABLE "GrammarPoint" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "lessonId" TEXT NOT NULL,
 "title" TEXT NOT NULL,
 "data" TEXT NOT NULL,
 "source" TEXT NOT NULL,
 FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT
);

CREATE TABLE "Exercise" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "lessonId" TEXT NOT NULL,
 "kind" TEXT NOT NULL,
 "data" TEXT NOT NULL,
 FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT
);

CREATE TABLE "ExerciseAttempt" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "exerciseId" TEXT NOT NULL,
 "answer" TEXT NOT NULL,
 "correct" BOOLEAN NOT NULL,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT
);

CREATE INDEX "ExerciseAttempt_exerciseId_createdAt_idx" ON "ExerciseAttempt" ("exerciseId", "createdAt");

CREATE TABLE "LearningProgress" (
 "episodeId" INTEGER NOT NULL PRIMARY KEY,
 "seconds" REAL NOT NULL DEFAULT 0,
 "completed" TEXT NOT NULL DEFAULT '[]',
 "updatedAt" DATETIME NOT NULL,
 FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT
);

CREATE TABLE "ReviewSchedule" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "vocabularyId" TEXT NOT NULL UNIQUE,
 "interval" INTEGER NOT NULL DEFAULT 0,
 "dueAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "known" BOOLEAN NOT NULL DEFAULT false,
 FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE RESTRICT
);

CREATE TABLE "UserSettings" (
 "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'local',
 "data" TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE "LocalState" (
 "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'local',
 "data" TEXT NOT NULL,
 "updatedAt" DATETIME NOT NULL
);
