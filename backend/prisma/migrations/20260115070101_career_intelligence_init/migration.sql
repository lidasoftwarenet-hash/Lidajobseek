-- AlterTable
ALTER TABLE "Process" ADD COLUMN     "cvVersion" TEXT,
ADD COLUMN     "reverseQuestions" JSONB,
ADD COLUMN     "scoreGrowth" INTEGER DEFAULT 0,
ADD COLUMN     "scoreTech" INTEGER DEFAULT 0,
ADD COLUMN     "scoreVibe" INTEGER DEFAULT 0,
ADD COLUMN     "scoreWLB" INTEGER DEFAULT 0,
ADD COLUMN     "submissionLink" TEXT,
ADD COLUMN     "tailoredPitch" TEXT,
ADD COLUMN     "targetQuestions" JSONB;

-- CreateTable
CREATE TABLE "Contact" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "linkedIn" TEXT,
    "socialHooks" TEXT,
    "email" TEXT,
    "processId" INTEGER NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;
