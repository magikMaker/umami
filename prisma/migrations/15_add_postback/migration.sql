-- CreateTable: postback_endpoint
CREATE TABLE "postback_endpoint" (
    "endpoint_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "website_id" UUID NOT NULL,
    "user_id" UUID,
    "team_id" UUID,
    "config" JSONB NOT NULL DEFAULT '{}',
    "debug_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "postback_endpoint_pkey" PRIMARY KEY ("endpoint_id")
);

-- CreateTable: postback_request
CREATE TABLE "postback_request" (
    "request_id" UUID NOT NULL,
    "endpoint_id" UUID NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(2000) NOT NULL,
    "query" JSONB NOT NULL DEFAULT '{}',
    "headers" JSONB NOT NULL DEFAULT '{}',
    "body" JSONB,
    "body_raw" TEXT,
    "client_ip" VARCHAR(45),
    "content_type" VARCHAR(200),
    "status" VARCHAR(20) NOT NULL DEFAULT 'recorded',
    "click_id" VARCHAR(100),
    "event_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postback_request_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable: postback_relay
CREATE TABLE "postback_relay" (
    "relay_id" UUID NOT NULL,
    "endpoint_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "target_url" VARCHAR(2000) NOT NULL,
    "method" VARCHAR(10) NOT NULL DEFAULT 'POST',
    "format" VARCHAR(20) NOT NULL DEFAULT 'json',
    "mapping" JSONB NOT NULL DEFAULT '{}',
    "headers" JSONB,
    "conditions" JSONB,
    "retry_config" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "postback_relay_pkey" PRIMARY KEY ("relay_id")
);

-- CreateTable: postback_relay_log
CREATE TABLE "postback_relay_log" (
    "log_id" UUID NOT NULL,
    "relay_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "response_code" INTEGER,
    "response_body" TEXT,
    "error_message" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postback_relay_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable: link_click
CREATE TABLE "link_click" (
    "click_id" VARCHAR(26) NOT NULL,
    "link_id" UUID NOT NULL,
    "session_id" UUID,
    "website_id" UUID NOT NULL,
    "url" VARCHAR(2000) NOT NULL,
    "referrer" VARCHAR(2000),
    "query" JSONB NOT NULL DEFAULT '{}',
    "client_ip" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "country" VARCHAR(2),
    "region" VARCHAR(100),
    "city" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "link_click_pkey" PRIMARY KEY ("click_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "postback_endpoint_endpoint_id_key" ON "postback_endpoint"("endpoint_id");

-- CreateIndex
CREATE UNIQUE INDEX "postback_endpoint_slug_key" ON "postback_endpoint"("slug");

-- CreateIndex
CREATE INDEX "postback_endpoint_slug_idx" ON "postback_endpoint"("slug");

-- CreateIndex
CREATE INDEX "postback_endpoint_website_id_idx" ON "postback_endpoint"("website_id");

-- CreateIndex
CREATE INDEX "postback_endpoint_user_id_idx" ON "postback_endpoint"("user_id");

-- CreateIndex
CREATE INDEX "postback_endpoint_team_id_idx" ON "postback_endpoint"("team_id");

-- CreateIndex
CREATE INDEX "postback_endpoint_created_at_idx" ON "postback_endpoint"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "postback_request_request_id_key" ON "postback_request"("request_id");

-- CreateIndex
CREATE INDEX "postback_request_endpoint_id_idx" ON "postback_request"("endpoint_id");

-- CreateIndex
CREATE INDEX "postback_request_click_id_idx" ON "postback_request"("click_id");

-- CreateIndex
CREATE INDEX "postback_request_created_at_idx" ON "postback_request"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "postback_relay_relay_id_key" ON "postback_relay"("relay_id");

-- CreateIndex
CREATE INDEX "postback_relay_endpoint_id_idx" ON "postback_relay"("endpoint_id");

-- CreateIndex
CREATE UNIQUE INDEX "postback_relay_log_log_id_key" ON "postback_relay_log"("log_id");

-- CreateIndex
CREATE INDEX "postback_relay_log_relay_id_idx" ON "postback_relay_log"("relay_id");

-- CreateIndex
CREATE INDEX "postback_relay_log_request_id_idx" ON "postback_relay_log"("request_id");

-- CreateIndex
CREATE INDEX "postback_relay_log_created_at_idx" ON "postback_relay_log"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "link_click_click_id_key" ON "link_click"("click_id");

-- CreateIndex
CREATE INDEX "link_click_link_id_idx" ON "link_click"("link_id");

-- CreateIndex
CREATE INDEX "link_click_website_id_idx" ON "link_click"("website_id");

-- CreateIndex
CREATE INDEX "link_click_created_at_idx" ON "link_click"("created_at");

-- AddForeignKey
ALTER TABLE "postback_endpoint" ADD CONSTRAINT "postback_endpoint_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "website"("website_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postback_endpoint" ADD CONSTRAINT "postback_endpoint_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postback_endpoint" ADD CONSTRAINT "postback_endpoint_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postback_request" ADD CONSTRAINT "postback_request_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "postback_endpoint"("endpoint_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postback_relay" ADD CONSTRAINT "postback_relay_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "postback_endpoint"("endpoint_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postback_relay_log" ADD CONSTRAINT "postback_relay_log_relay_id_fkey" FOREIGN KEY ("relay_id") REFERENCES "postback_relay"("relay_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postback_relay_log" ADD CONSTRAINT "postback_relay_log_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "postback_request"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_click" ADD CONSTRAINT "link_click_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "link"("link_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_click" ADD CONSTRAINT "link_click_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "website"("website_id") ON DELETE RESTRICT ON UPDATE CASCADE;
