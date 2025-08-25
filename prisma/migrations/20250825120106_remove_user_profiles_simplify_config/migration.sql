/*
  Warnings:

  - You are about to drop the column `user_id` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the `user_profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."stores" DROP CONSTRAINT "stores_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."stores" DROP COLUMN "user_id",
ADD COLUMN     "feature_flags" JSONB DEFAULT '{}',
ADD COLUMN     "ui_config" JSONB DEFAULT '{}',
ALTER COLUMN "ai_config" SET DEFAULT '{}',
ALTER COLUMN "sync_config" SET DEFAULT '{}';

-- DropTable
DROP TABLE "public"."user_profiles";
