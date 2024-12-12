/*
  Warnings:

  - Made the column `skill` on table `Skill` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Skill" ALTER COLUMN "skill" SET NOT NULL;
