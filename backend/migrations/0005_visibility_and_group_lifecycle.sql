ALTER TABLE groups ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE trips ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS group_ids TEXT NOT NULL DEFAULT '[]';

ALTER TABLE places ADD COLUMN IF NOT EXISTS group_ids TEXT NOT NULL DEFAULT '[]';

UPDATE groups SET status = 'active' WHERE status IS NULL;
UPDATE trips SET visibility = 'public' WHERE visibility IS NULL;
UPDATE trips SET group_ids = '[]' WHERE group_ids IS NULL;
UPDATE places SET group_ids = '[]' WHERE group_ids IS NULL;
