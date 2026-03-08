ALTER TABLE trips ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS group_ids TEXT NOT NULL DEFAULT '[]';

ALTER TABLE places ADD COLUMN IF NOT EXISTS group_ids TEXT NOT NULL DEFAULT '[]';

ALTER TABLE groups ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

UPDATE trips SET visibility = 'public' WHERE visibility IS NULL;
UPDATE trips SET group_ids = '[]' WHERE group_ids IS NULL;
UPDATE places SET group_ids = '[]' WHERE group_ids IS NULL;
UPDATE groups SET status = 'active' WHERE status IS NULL;

ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_status_check;
ALTER TABLE groups ADD CONSTRAINT groups_status_check CHECK (status IN ('active', 'archived'));

CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
