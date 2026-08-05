-- AlterTable
ALTER TABLE `routestop` ADD COLUMN `cashCollected` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `gpsVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `notes` VARCHAR(191) NULL,
    ADD COLUMN `productsRefilled` JSON NULL,
    ADD COLUMN `signatureUrl` LONGTEXT NULL;
