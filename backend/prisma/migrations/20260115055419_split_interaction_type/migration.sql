/*
  Warnings:

  - You are about to drop the column `type` on the `Interaction` table. All the data in the column will be lost.
  - Added the required column `interviewType` to the `Interaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Interaction" DROP COLUMN "type",
ADD COLUMN     "interviewType" TEXT NOT NULL,
ADD COLUMN     "participants" JSONB;
