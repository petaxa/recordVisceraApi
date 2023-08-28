/*
  Warnings:

  - You are about to alter the column `createdAt` on the `users` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `updatedAt` on the `users` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `bowel_movements` MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT NOW(3),
    MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3);

-- AlterTable
ALTER TABLE `profiles` MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT NOW(3),
    MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3);

-- AlterTable
ALTER TABLE `user_temps` MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT NOW(3),
    MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT NOW(3) ON UPDATE NOW(3);

-- AlterTable
ALTER TABLE `users` ADD COLUMN `verified` INTEGER NOT NULL DEFAULT 1,
    MODIFY `createdAt` DATETIME NOT NULL DEFAULT NOW(),
    MODIFY `updatedAt` DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW();