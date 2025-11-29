-- Company Profile Table for User Onboarding
-- This table stores company information scraped during user onboarding

-- Create enum for regulatory topics (matching the backend enum)
CREATE TYPE regulatory_topic AS ENUM (
    'AI Act',
    'Bafin',
    'Cybersecurity',
    'Gdpr',
    'Aml',
    'kyc',
    'Esg'
);

-- Create company_profile table
CREATE TABLE IF NOT EXISTS company_profile (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Basic Information (required)
    company_name TEXT NOT NULL UNIQUE,
    website_url TEXT,

    -- Company Details
    description TEXT,
    industry TEXT,

    -- Regulatory Topics (array of enum values)
    regulatory_topics regulatory_topic[] DEFAULT '{}',

    -- Scraping Metadata
    scrape_status TEXT DEFAULT 'pending',
    scrape_error TEXT,
    last_scraped_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX idx_company_profile_company_name ON company_profile(company_name);
CREATE INDEX idx_company_profile_created_at ON company_profile(created_at);
CREATE INDEX idx_company_profile_regulatory_topics ON company_profile USING GIN(regulatory_topics);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_profile_updated_at
    BEFORE UPDATE ON company_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow all authenticated users to read all company profiles
CREATE POLICY "Allow authenticated users to read company profiles"
    ON company_profile
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert their own company profile
CREATE POLICY "Allow authenticated users to insert company profiles"
    ON company_profile
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update their own company profile
CREATE POLICY "Allow authenticated users to update their company profile"
    ON company_profile
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete their own company profile
CREATE POLICY "Allow authenticated users to delete their company profile"
    ON company_profile
    FOR DELETE
    TO authenticated
    USING (true);

-- Grant permissions
GRANT ALL ON company_profile TO authenticated;
GRANT ALL ON company_profile TO service_role;

-- Add comments for documentation
COMMENT ON TABLE company_profile IS 'Stores company profiles created during user onboarding via web scraping';
COMMENT ON COLUMN company_profile.company_name IS 'Unique company name (used as identifier)';
COMMENT ON COLUMN company_profile.regulatory_topics IS 'Array of relevant EU regulatory topics determined by AI';
COMMENT ON COLUMN company_profile.scrape_status IS 'Status of the scraping process: pending, success, failed, partial';
