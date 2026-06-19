-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "encryptionKey" TEXT,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;
