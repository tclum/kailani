-- AlterTable
ALTER TABLE "User" ADD COLUMN     "communityFlagged" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StructuredReview" (
    "id" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "overallRating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "reviewerResponse" TEXT,
    "responseDeadline" TIMESTAMP(3) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "flagCount" INTEGER NOT NULL DEFAULT 0,
    "adminFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StructuredReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingTogetherPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "responseDeadline" TIMESTAMP(3) NOT NULL,
    "subjectResponse" TEXT,
    "adminFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkingTogetherPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StructuredReview_reviewerId_revieweeId_campaignId_key" ON "StructuredReview"("reviewerId", "revieweeId", "campaignId");

-- AddForeignKey
ALTER TABLE "StructuredReview" ADD CONSTRAINT "StructuredReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructuredReview" ADD CONSTRAINT "StructuredReview_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructuredReview" ADD CONSTRAINT "StructuredReview_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingTogetherPost" ADD CONSTRAINT "WorkingTogetherPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingTogetherPost" ADD CONSTRAINT "WorkingTogetherPost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
