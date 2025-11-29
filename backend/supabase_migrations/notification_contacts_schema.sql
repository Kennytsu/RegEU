-- Notification Contacts Table Schema
-- Stores notification contact information for users

-- Create notification_frequency enum
CREATE TYPE notification_frequency AS ENUM (
    'realtime',
    'daily',
    'weekly'
);

-- Create notification_contacts table
CREATE TABLE IF NOT EXISTS notification_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- User association
    user_id UUID NOT NULL,

    -- Contact information
    name TEXT NOT NULL,
    role TEXT,
    email TEXT NOT NULL,
    phone TEXT,

    -- Notification channels
    channel_email BOOLEAN DEFAULT true,
    channel_sms BOOLEAN DEFAULT false,
    channel_calls BOOLEAN DEFAULT false,

    -- Notification settings
    frequency notification_frequency DEFAULT 'daily',
    high_impact_only BOOLEAN DEFAULT false,

    -- Metadata
    is_active BOOLEAN DEFAULT true,

    CONSTRAINT notification_contacts_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_notification_contacts_user_id ON notification_contacts(user_id);
CREATE INDEX idx_notification_contacts_created_at ON notification_contacts(created_at DESC);
CREATE INDEX idx_notification_contacts_is_active ON notification_contacts(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE notification_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own contacts
CREATE POLICY "Users can view own contacts"
    ON notification_contacts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own contacts
CREATE POLICY "Users can insert own contacts"
    ON notification_contacts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own contacts
CREATE POLICY "Users can update own contacts"
    ON notification_contacts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own contacts
CREATE POLICY "Users can delete own contacts"
    ON notification_contacts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_contacts_updated_at
    BEFORE UPDATE ON notification_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_contacts_updated_at();

-- Add comment to table
COMMENT ON TABLE notification_contacts IS 'Stores notification contact information for users including preferred channels and frequency';
