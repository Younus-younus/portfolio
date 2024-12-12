/*
  Warnings:

  - The required column `id` was added to the `Contact` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `Education` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `Skill` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "Image_userId_portfolioId_key";

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Contact_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Education" ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Education_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Image" ALTER COLUMN "imageUrl" SET DEFAULT 'https://...';

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Skill_pkey" PRIMARY KEY ("id");
