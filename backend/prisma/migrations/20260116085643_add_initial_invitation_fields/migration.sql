-- AlterTable
ALTER TABLE "Process" ADD COLUMN     "initialInviteContent" TEXT,
ADD COLUMN     "initialInviteDate" TIMESTAMP(3),
ADD COLUMN     "initialInviteMethod" TEXT;
