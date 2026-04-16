-- Rename measurement columns on ModelProfile
ALTER TABLE "ModelProfile" RENAME COLUMN "height" TO "heightCm";
ALTER TABLE "ModelProfile" RENAME COLUMN "bust"   TO "bustCm";
ALTER TABLE "ModelProfile" RENAME COLUMN "waist"  TO "waistCm";
ALTER TABLE "ModelProfile" RENAME COLUMN "hips"   TO "hipsCm";

-- Add new ModelProfile fields
ALTER TABLE "ModelProfile" ADD COLUMN "skinTone"     TEXT;
ALTER TABLE "ModelProfile" ADD COLUMN "rates"        JSONB;
ALTER TABLE "ModelProfile" ADD COLUMN "availability" JSONB;

-- Add instagramUrl to BrandProfile
ALTER TABLE "BrandProfile" ADD COLUMN "instagramUrl" TEXT;

-- Add PHOTOGRAPHER value to Role enum
ALTER TYPE "Role" ADD VALUE 'PHOTOGRAPHER';

-- Create PhotographerProfile table
CREATE TABLE "PhotographerProfile" (
    "id"              TEXT         NOT NULL,
    "userId"          TEXT         NOT NULL,
    "displayName"     TEXT         NOT NULL,
    "bio"             TEXT,
    "location"        TEXT,
    "instagramUrl"    TEXT,
    "specialties"     TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "portfolioImages" TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "coverImage"      TEXT,
    "rates"           JSONB,
    "availability"    JSONB,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotographerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PhotographerProfile_userId_key" ON "PhotographerProfile"("userId");

ALTER TABLE "PhotographerProfile"
    ADD CONSTRAINT "PhotographerProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
