-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "author" VARCHAR(255),
    "sizeBytes" INTEGER NOT NULL,
    "filePath" VARCHAR(512) NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "encryptionKey" VARCHAR(255),
    "userId" UUID NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DocumentToTag" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_DocumentToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- --------------------------------------------------------
-- Unique Indexes
-- --------------------------------------------------------

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- --------------------------------------------------------
-- B-Tree Indexes — ordering and foreign key lookups
-- --------------------------------------------------------

-- Fast lookup of all documents belonging to a user
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- Fast ordering by most-recently-uploaded
CREATE INDEX "documents_uploadedAt_desc_idx" ON "documents"("uploadedAt" DESC);

-- Fast join-table B-Tree traversal (A->B and B->A)
CREATE INDEX "_DocumentToTag_B_index" ON "_DocumentToTag"("B");

-- --------------------------------------------------------
-- GIN Trigram Indexes — fast case-insensitive partial search
-- --------------------------------------------------------

-- Required extension (safe to re-run)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Title search: supports ILIKE '%term%' without a full table scan
CREATE INDEX "documents_title_trgm_idx" ON "documents" USING gin ("title" gin_trgm_ops);

-- Author search
CREATE INDEX "documents_author_trgm_idx" ON "documents" USING gin ("author" gin_trgm_ops);

-- User name search
CREATE INDEX "users_name_trgm_idx" ON "users" USING gin ("name" gin_trgm_ops);

-- Tag name search (useful for tag filter/autocomplete queries)
CREATE INDEX "tags_name_trgm_idx" ON "tags" USING gin ("name" gin_trgm_ops);

-- --------------------------------------------------------
-- Foreign Key Constraints
-- --------------------------------------------------------

ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "_DocumentToTag" ADD CONSTRAINT "_DocumentToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_DocumentToTag" ADD CONSTRAINT "_DocumentToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
