/*
  Warnings:

  - You are about to drop the column `allskill` on the `Skill` table. All the data in the column will be lost.
  - You are about to drop the column `skill1` on the `Skill` table. All the data in the column will be lost.
  - You are about to drop the column `skill2` on the `Skill` table. All the data in the column will be lost.
  - You are about to drop the column `skill3` on the `Skill` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Skill" DROP COLUMN "allskill",
DROP COLUMN "skill1",
DROP COLUMN "skill2",
DROP COLUMN "skill3",
ADD COLUMN     "skill" TEXT;
