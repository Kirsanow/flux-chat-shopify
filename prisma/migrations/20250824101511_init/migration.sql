-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_profiles" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stores" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "store_name" TEXT NOT NULL,
    "shopify_domain" TEXT NOT NULL,
    "shopify_access_token" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ai_config" JSONB,
    "sync_config" JSONB,
    "user_id" TEXT,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "shopify_product_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "handle" TEXT,
    "product_type" TEXT,
    "vendor" TEXT,
    "tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "price_min" DECIMAL(65,30),
    "price_max" DECIMAL(65,30),
    "image_url" TEXT,
    "image_urls" TEXT[],
    "total_inventory" INTEGER,
    "available_for_sale" BOOLEAN NOT NULL DEFAULT true,
    "embedding" DOUBLE PRECISION[],
    "embedding_model" TEXT,
    "last_embedded" TIMESTAMP(3),
    "search_metadata" JSONB,
    "last_synced" TIMESTAMP(3),
    "sync_version" INTEGER NOT NULL DEFAULT 1,
    "sync_metadata" JSONB,
    "store_id" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "conversation_id" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "session_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" TEXT,
    "store_id" TEXT NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_shopify_domain_key" ON "public"."stores"("shopify_domain");

-- CreateIndex
CREATE INDEX "products_store_id_status_idx" ON "public"."products"("store_id", "status");

-- CreateIndex
CREATE INDEX "products_store_id_available_for_sale_idx" ON "public"."products"("store_id", "available_for_sale");

-- CreateIndex
CREATE UNIQUE INDEX "products_store_id_shopify_product_id_key" ON "public"."products"("store_id", "shopify_product_id");

-- CreateIndex
CREATE INDEX "conversations_store_id_status_idx" ON "public"."conversations"("store_id", "status");

-- AddForeignKey
ALTER TABLE "public"."stores" ADD CONSTRAINT "stores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
