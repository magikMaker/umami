-- AlterTable: postback_endpoint - Remove debug_enabled, add template fields
ALTER TABLE "postback_endpoint" DROP COLUMN IF EXISTS "debug_enabled";
ALTER TABLE "postback_endpoint" ADD COLUMN IF NOT EXISTS "receive_template_id" VARCHAR(50);
ALTER TABLE "postback_endpoint" ADD COLUMN IF NOT EXISTS "relay_template_id" VARCHAR(50);
ALTER TABLE "postback_endpoint" ADD COLUMN IF NOT EXISTS "relay_target_url" VARCHAR(2000);

-- AlterTable: postback_request - Add parsed_fields and relay_result
ALTER TABLE "postback_request" ADD COLUMN IF NOT EXISTS "parsed_fields" JSONB;
ALTER TABLE "postback_request" ADD COLUMN IF NOT EXISTS "relay_result" JSONB;
