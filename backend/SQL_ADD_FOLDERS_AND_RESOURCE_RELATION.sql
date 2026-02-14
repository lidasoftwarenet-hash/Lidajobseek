-- SQL Migration: Add FOLDERS table and link it to RESOURCES
-- Schema: app
-- Target: PostgreSQL

CREATE TABLE IF NOT EXISTS app.folder (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INT,
    user_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_folder_parent FOREIGN KEY (parent_id) REFERENCES app.folder (id) ON DELETE CASCADE,
    CONSTRAINT fk_folder_user FOREIGN KEY (user_id) REFERENCES app.user (id) ON DELETE CASCADE
);

-- Add folder_id to resource table
ALTER TABLE app.resource ADD COLUMN IF NOT EXISTS folder_id INT;

-- Add foreign key constraint to resource
-- Note: Using an IF NOT EXISTS pattern for the constraint check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_resource_folder') THEN
        ALTER TABLE app.resource ADD CONSTRAINT fk_resource_folder FOREIGN KEY (folder_id) REFERENCES app.folder (id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_folder_user_id ON app.folder (user_id);
CREATE INDEX IF NOT EXISTS idx_folder_parent_id ON app.folder (parent_id);
CREATE INDEX IF NOT EXISTS idx_resource_folder_id ON app.resource (folder_id);
