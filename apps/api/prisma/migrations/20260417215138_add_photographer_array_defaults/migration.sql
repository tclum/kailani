-- AlterTable
ALTER TABLE "PhotographerProfile" ALTER COLUMN "specialties" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "portfolioImages" SET DEFAULT ARRAY[]::TEXT[];
