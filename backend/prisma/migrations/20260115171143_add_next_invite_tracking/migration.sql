-- AlterTable
ALTER TABLE "Interaction" ADD COLUMN     "nextInviteDate" TIMESTAMP(3),
ADD COLUMN     "nextInviteLink" TEXT,
ADD COLUMN     "nextInviteStatus" TEXT,
ADD COLUMN     "nextInviteType" TEXT;
