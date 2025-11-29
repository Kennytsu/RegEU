-- Migration: Add user_id to company_profile table
-- This links company profiles to authenticated users

-- Add user_id column (nullable first to allow existing data)
ALTER TABLE company_profile
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_company_profile_user_id ON company_profile(user_id);

-- Update RLS policies to be user-specific

-- Drop old policies
DROP POLICY IF EXISTS "Allow authenticated users to read company profiles" ON company_profile;
DROP POLICY IF EXISTS "Allow authenticated users to insert company profiles" ON company_profile;
DROP POLICY IF EXISTS "Allow authenticated users to update their company profile" ON company_profile;
DROP POLICY IF EXISTS "Allow authenticated users to delete their company profile" ON company_profile;

-- Allow users to read their own company profiles
CREATE POLICY "Users can read their own company profiles"
    ON company_profile
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to insert their own company profile
CREATE POLICY "Users can insert their own company profile"
    ON company_profile
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own company profile
CREATE POLICY "Users can update their own company profile"
    ON company_profile
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own company profile
CREATE POLICY "Users can delete their own company profile"
    ON company_profile
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Add comment
COMMENT ON COLUMN company_profile.user_id IS 'References the authenticated user who owns this company profile';
