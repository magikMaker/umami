-- Redirect Module Tables
-- For ad click tracking and attribution

-- Redirect links table
CREATE TABLE IF NOT EXISTS "redirect" (
    "redirect_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "target_url" VARCHAR(2000) NOT NULL,
    "description" VARCHAR(500),
    "website_id" UUID NOT NULL,
    "user_id" UUID,
    "team_id" UUID,
    "param_config" JSONB,
    "endpoint_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "redirect_pkey" PRIMARY KEY ("redirect_id")
);

-- Redirect clicks table
CREATE TABLE IF NOT EXISTS "redirect_click" (
    "click_id" UUID NOT NULL,
    "redirect_id" UUID NOT NULL,
    "session_id" UUID,
    "click_token" VARCHAR(26) NOT NULL,
    "captured_params" JSONB,
    "external_click_id" VARCHAR(255),
    "gclid" VARCHAR(255),
    "fbclid" VARCHAR(255),
    "msclkid" VARCHAR(255),
    "ttclid" VARCHAR(255),
    "twclid" VARCHAR(255),
    "utm_source" VARCHAR(255),
    "utm_medium" VARCHAR(255),
    "utm_campaign" VARCHAR(255),
    "utm_content" VARCHAR(255),
    "utm_term" VARCHAR(255),
    "referrer" VARCHAR(500),
    "user_agent" VARCHAR(500),
    "client_ip" VARCHAR(45),
    "country" CHAR(2),
    "region" VARCHAR(50),
    "city" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "converted_at" TIMESTAMPTZ(6),

    CONSTRAINT "redirect_click_pkey" PRIMARY KEY ("click_id")
);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "redirect_redirect_id_key" ON "redirect"("redirect_id");
CREATE UNIQUE INDEX IF NOT EXISTS "redirect_slug_key" ON "redirect"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "redirect_click_click_id_key" ON "redirect_click"("click_id");
CREATE UNIQUE INDEX IF NOT EXISTS "redirect_click_click_token_key" ON "redirect_click"("click_token");

-- Redirect indexes
CREATE INDEX IF NOT EXISTS "redirect_slug_idx" ON "redirect"("slug");
CREATE INDEX IF NOT EXISTS "redirect_website_id_idx" ON "redirect"("website_id");
CREATE INDEX IF NOT EXISTS "redirect_user_id_idx" ON "redirect"("user_id");
CREATE INDEX IF NOT EXISTS "redirect_team_id_idx" ON "redirect"("team_id");
CREATE INDEX IF NOT EXISTS "redirect_endpoint_id_idx" ON "redirect"("endpoint_id");
CREATE INDEX IF NOT EXISTS "redirect_created_at_idx" ON "redirect"("created_at");

-- Redirect click indexes
CREATE INDEX IF NOT EXISTS "redirect_click_redirect_id_idx" ON "redirect_click"("redirect_id");
CREATE INDEX IF NOT EXISTS "redirect_click_session_id_idx" ON "redirect_click"("session_id");
CREATE INDEX IF NOT EXISTS "redirect_click_click_token_idx" ON "redirect_click"("click_token");
CREATE INDEX IF NOT EXISTS "redirect_click_external_click_id_idx" ON "redirect_click"("external_click_id");
CREATE INDEX IF NOT EXISTS "redirect_click_gclid_idx" ON "redirect_click"("gclid");
CREATE INDEX IF NOT EXISTS "redirect_click_fbclid_idx" ON "redirect_click"("fbclid");
CREATE INDEX IF NOT EXISTS "redirect_click_created_at_idx" ON "redirect_click"("created_at");
CREATE INDEX IF NOT EXISTS "redirect_click_redirect_id_created_at_idx" ON "redirect_click"("redirect_id", "created_at");

-- Add click attribution columns to postback_request table
ALTER TABLE "postback_request" ADD COLUMN IF NOT EXISTS "link_click_id" UUID;
ALTER TABLE "postback_request" ADD COLUMN IF NOT EXISTS "redirect_click_id" UUID;
CREATE INDEX IF NOT EXISTS "postback_request_link_click_id_idx" ON "postback_request"("link_click_id");
CREATE INDEX IF NOT EXISTS "postback_request_redirect_click_id_idx" ON "postback_request"("redirect_click_id");
