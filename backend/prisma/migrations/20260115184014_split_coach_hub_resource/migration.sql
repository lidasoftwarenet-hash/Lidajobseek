/*
  Warnings:

  - You are about to drop the column `cvVersion` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `reverseQuestions` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `submissionLink` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `tailoredPitch` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `targetQuestions` on the `Process` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Process" DROP COLUMN "cvVersion",
DROP COLUMN "reverseQuestions",
DROP COLUMN "submissionLink",
DROP COLUMN "tailoredPitch",
DROP COLUMN "targetQuestions";

-- CreateTable
CREATE TABLE "Resource" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);
