/*
  Warnings:

  - You are about to drop the column `scheduledDate` on the `route` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `route` table. All the data in the column will be lost.
  - Added the required column `date` to the `Route` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Route` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `location` ADD COLUMN `imageUrl` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `route` DROP COLUMN `scheduledDate`,
    DROP COLUMN `title`,
    ADD COLUMN `actualTime` INTEGER NULL,
    ADD COLUMN `date` VARCHAR(191) NOT NULL,
    ADD COLUMN `endTime` DATETIME(3) NULL,
    ADD COLUMN `estimatedTime` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `startTime` DATETIME(3) NULL,
    ADD COLUMN `totalDistance` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `vehicleId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Vehicle` (
    `id` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `plateNumber` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `fuelType` VARCHAR(191) NOT NULL,
    `lastMaintenance` VARCHAR(191) NULL,
    `nextMaintenance` VARCHAR(191) NULL,
    `gpsDeviceId` VARCHAR(191) NULL,
    `currentFuelLevel` DOUBLE NOT NULL DEFAULT 100,
    `odometer` DOUBLE NOT NULL DEFAULT 0,
    `assignedDriverId` VARCHAR(191) NULL,
    `status` ENUM('IN_USE', 'MAINTENANCE') NOT NULL DEFAULT 'IN_USE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Vehicle_plateNumber_key`(`plateNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Route` ADD CONSTRAINT `Route_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_assignedDriverId_fkey` FOREIGN KEY (`assignedDriverId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
