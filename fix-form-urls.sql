-- Migration to remove formUrl from existing trigger configs
-- This removes the hardcoded localhost:3000 URLs that were stored in the database
-- The formUrl will now be generated dynamically from formId and NEXT_PUBLIC_FRONTEND_URL

-- Update all Trigger records that have formUrl in their config
UPDATE "Trigger"
SET config = config - 'formUrl'
WHERE config ? 'formUrl';

-- Verify the update
SELECT 
  id, 
  "zapId",
  "formId",
  config
FROM "Trigger"
WHERE "formId" IS NOT NULL;
