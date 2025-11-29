/**
 * API Client for Backend Communication
 * Connects React frontend to FastAPI backend
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface CompanyProfileRequest {
  company_name: string;
  website_url?: string;
  wikipedia_url?: string;
}

export interface CompanyScrapeRequest {
  urls: string[];
}

export interface CompanyProfileSimple {
  company_name: string;
  description?: string;
  industry?: string;
  regulatory_topics?: string[];
  website_url?: string;
}

export interface CompanyProfileListResponse {
  success: boolean;
  data: CompanyProfile[];
  errors?: Array<{ url: string; error: string }>;
}

export interface CompanyProfileSimpleListResponse {
  success: boolean;
  data: CompanyProfileSimple[];
  errors?: Array<{ url: string; error: string }>;
}

export interface CompanyProfile {
  id?: string;
  created_at?: string;
  updated_at?: string;

  // Basic Information
  company_name: string;
  website_url?: string;
  wikipedia_url?: string;

  // Company Details
  industry?: string;
  sector?: string;
  description?: string;
  founded_year?: number;
  headquarters?: string;
  employee_count?: string;
  company_size?: string;

  // Business Information
  business_model?: string;
  products_services?: string[];
  technologies_used?: string[];

  // Regulatory Interests
  regulatory_topics?: string[];
  relevant_legislative_areas?: string[];
  compliance_requirements?: string[];

  // Market Information
  target_markets?: string[];
  geographic_presence?: string[];

  // Extracted Metadata
  keywords?: string[];
  categories?: string[];

  // Scraping Metadata
  source_type?: string;
  last_scraped_at?: string;
  scrape_status?: string;
  scrape_error?: string;

  // Raw Data
  raw_data?: Record<string, any>;
}

export interface CompanyProfileResponse {
  success: boolean;
  data?: CompanyProfile;
  error?: string;
}

export interface CompanyListResponse {
  success: boolean;
  data: CompanyProfile[];
  count: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred');
    }
  }

  /**
   * Scrape multiple companies from an array of URLs (does NOT save to database)
   */
  async scrapeCompanies(request: CompanyScrapeRequest): Promise<CompanyProfileSimpleListResponse> {
    return this.request<CompanyProfileSimpleListResponse>('/companies/scrape', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Save reviewed company profiles to database
   */
  async saveCompanyProfiles(profiles: CompanyProfileSimple[]): Promise<CompanyProfileSimpleListResponse> {
    return this.request<CompanyProfileSimpleListResponse>('/companies/profiles/save', {
      method: 'POST',
      body: JSON.stringify(profiles),
    });
  }

  /**
   * Scrape single company information (legacy method)
   */
  async scrapeCompany(request: CompanyProfileRequest): Promise<CompanyProfileResponse> {
    return this.request<CompanyProfileResponse>('/companies/scrape/single', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get company profile by name
   */
  async getCompany(companyName: string): Promise<CompanyProfileResponse> {
    return this.request<CompanyProfileResponse>(`/companies/${encodeURIComponent(companyName)}`);
  }

  /**
   * List all companies with optional filtering
   */
  async listCompanies(params?: {
    limit?: number;
    offset?: number;
    industry?: string;
  }): Promise<CompanyListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.industry) queryParams.set('industry', params.industry);

    const query = queryParams.toString();
    const endpoint = query ? `/companies/?${query}` : '/companies/';

    return this.request<CompanyListResponse>(endpoint);
  }

  /**
   * Get regulatory topics for a company
   */
  async getCompanyRegulatoryTopics(companyName: string): Promise<{
    success: boolean;
    data: {
      company_name: string;
      regulatory_topics: string[];
      relevant_legislative_areas: string[];
    };
  }> {
    return this.request(`/companies/${encodeURIComponent(companyName)}/regulatory-topics`);
  }

  /**
   * Delete a company profile
   */
  async deleteCompany(companyName: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/companies/${encodeURIComponent(companyName)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Check backend health
   */
  async healthCheck(): Promise<{ status: string; service: string; scheduler_enabled: boolean }> {
    return this.request('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export default ApiClient;
