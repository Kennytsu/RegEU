-- SQL script to create company_profiles table in Supabase
-- This table stores company information scraped from websites and Wikipedia

-- Create company_profiles table
CREATE TABLE IF NOT EXISTS company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Basic Information
    company_name TEXT NOT NULL,
    website_url TEXT,
    wikipedia_url TEXT,

    -- Company Details
    industry TEXT,
    sector TEXT,
    description TEXT,
    founded_year INTEGER,
    headquarters TEXT,
    employee_count TEXT,
    company_size TEXT,

    -- Business Information
    business_model TEXT,
    products_services TEXT[],
    technologies_used TEXT[],

    -- Regulatory Interests
    regulatory_topics TEXT[],
    relevant_legislative_areas TEXT[],
    compliance_requirements TEXT[],

    -- Market Information
    target_markets TEXT[],
    geographic_presence TEXT[],

    -- Extracted Metadata
    keywords TEXT[],
    categories TEXT[],

    -- Scraping Metadata
    source_type TEXT CHECK (source_type IN ('website', 'wikipedia', 'combined')),
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    scrape_status TEXT CHECK (scrape_status IN ('pending', 'success', 'failed', 'partial')),
    scrape_error TEXT,

    -- Raw Data (for reference)
    raw_data JSONB,

    -- Indexes for faster queries
    CONSTRAINT unique_company_name UNIQUE (company_name)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_company_profiles_name ON company_profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_company_profiles_industry ON company_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_company_profiles_sector ON company_profiles(sector);
CREATE INDEX IF NOT EXISTS idx_company_profiles_regulatory_topics ON company_profiles USING GIN(regulatory_topics);
CREATE INDEX IF NOT EXISTS idx_company_profiles_technologies ON company_profiles USING GIN(technologies_used);
CREATE INDEX IF NOT EXISTS idx_company_profiles_keywords ON company_profiles USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_company_profiles_created_at ON company_profiles(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_profiles_updated_at
    BEFORE UPDATE ON company_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_company_profiles_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- Policy: Allow public read access
CREATE POLICY "Allow public read access" ON company_profiles
    FOR SELECT
    USING (true);

-- Policy: Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON company_profiles
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON company_profiles
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON company_profiles
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE company_profiles IS 'Stores company profile information extracted from websites and Wikipedia';
COMMENT ON COLUMN company_profiles.company_name IS 'Official company name';
COMMENT ON COLUMN company_profiles.regulatory_topics IS 'Array of regulatory topics relevant to the company';
COMMENT ON COLUMN company_profiles.technologies_used IS 'Technologies and tools used by the company';
COMMENT ON COLUMN company_profiles.raw_data IS 'Raw scraped data in JSON format for reference';
