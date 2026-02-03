-- Create profiles table (schema: app)
-- Run this on your PostgreSQL database after deploying the code.

CREATE TABLE IF NOT EXISTS app.profile (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    about VARCHAR(4000),
    top_skills VARCHAR(2000),
    activity VARCHAR(3000),
    old_companies VARCHAR(4000),
    experience VARCHAR(4000),
    private_projects VARCHAR(4000),
    education VARCHAR(3000),
    certifications VARCHAR(3000),
    links VARCHAR(2000),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES app.user (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profile_user_id ON app.profile (user_id);