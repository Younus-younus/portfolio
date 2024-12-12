/*
  Warnings:

  - You are about to drop the column `sessionData` on the `Session` table. All the data in the column will be lost.
  - Added the required column `data` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "sessionData",
ADD COLUMN     "data" TEXT NOT NULL;
