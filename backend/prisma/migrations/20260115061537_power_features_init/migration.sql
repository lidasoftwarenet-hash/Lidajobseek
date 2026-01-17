-- AlterTable
ALTER TABLE "Process" ADD COLUMN     "baseSalary" INTEGER,
ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "bonus" TEXT,
ADD COLUMN     "equity" TEXT,
ADD COLUMN     "nextFollowUp" TIMESTAMP(3),
ADD COLUMN     "offerDeadline" TIMESTAMP(3),
ADD COLUMN     "signingBonus" INTEGER;
