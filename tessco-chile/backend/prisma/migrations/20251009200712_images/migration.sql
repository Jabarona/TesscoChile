-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "logoThumbnail" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "imageThumbnail" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "imageThumbnail" TEXT,
ADD COLUMN     "imageThumbnails" TEXT[] DEFAULT ARRAY[]::TEXT[];
