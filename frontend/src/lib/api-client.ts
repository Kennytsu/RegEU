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

export interface NotificationContact {
  id?: string;
  created_at?: string;
  updated_at?: string;
  user_id: string;
  name: string;
  role?: string;
  email: string;
  phone?: string;
  channel_email: boolean;
  channel_sms: boolean;
  channel_calls: boolean;
  frequency: 'realtime' | 'daily' | 'weekly';
  high_impact_only: boolean;
  is_active?: boolean;
}

export interface NotificationContactCreate {
  name: string;
  role?: string;
  email: string;
  phone?: string;
  channel_email: boolean;
  channel_sms: boolean;
  channel_calls: boolean;
  frequency: 'realtime' | 'daily' | 'weekly';
  high_impact_only: boolean;
}

export interface NotificationContactUpdate {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  channel_email?: boolean;
  channel_sms?: boolean;
  channel_calls?: boolean;
  frequency?: 'realtime' | 'daily' | 'weekly';
  high_impact_only?: boolean;
  is_active?: boolean;
}

export interface NotificationContactResponse {
  success: boolean;
  data?: NotificationContact;
  error?: string;
}

export interface NotificationContactListResponse {
  success: boolean;
  data: NotificationContact[];
  count: number;
}

export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RegulatoryUpdatePayload {
  user_id: string;
  user_name: string;
  company_name: string;
  regulation_type: string;
  regulation_title: string;
  effective_date: string;
  deadline: string;
  summary: string;
  action_required: string;
  impact_level: ImpactLevel;
  reference_url?: string;
}

export interface GenerateVoiceCallLinkRequest {
  payload: RegulatoryUpdatePayload;
  expires_in_minutes?: number;
}

export interface GenerateVoiceCallLinkResponse {
  success: boolean;
  token: string;
  link: string;
  expires_at: string;
}

export interface GetVoiceCallPayloadResponse {
  success: boolean;
  payload?: RegulatoryUpdatePayload;
  error?: string;
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
  async saveCompanyProfiles(profiles: CompanyProfileSimple[], userId: string): Promise<CompanyProfileSimpleListResponse> {
    return this.request<CompanyProfileSimpleListResponse>('/companies/profiles/save', {
      method: 'POST',
      body: JSON.stringify({
        profiles,
        user_id: userId,
      }),
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
   * Check if a user has any company profiles
   */
  async checkUserHasProfiles(userId: string): Promise<{
    success: boolean;
    has_profiles: boolean;
    count: number;
  }> {
    return this.request(`/companies/user/${encodeURIComponent(userId)}/has-profiles`);
  }

  /**
   * List all companies with optional filtering
   */
  async listCompanies(params?: {
    limit?: number;
    offset?: number;
    industry?: string;
    user_id?: string;
  }): Promise<CompanyListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.industry) queryParams.set('industry', params.industry);
    if (params?.user_id) queryParams.set('user_id', params.user_id);

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
   * Update a company profile
   */
  async updateCompanyProfile(companyId: string, updates: {
    regulatory_topics?: string[];
    company_name?: string;
    industry?: string;
    description?: string;
  }): Promise<CompanyProfileResponse> {
    return this.request<CompanyProfileResponse>(`/companies/${encodeURIComponent(companyId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Check backend health
   */
  async healthCheck(): Promise<{ status: string; service: string; scheduler_enabled: boolean }> {
    return this.request('/health');
  }

  /**
   * Get notification contacts for a user
   */
  async listUserContacts(userId: string, isActive?: boolean): Promise<NotificationContactListResponse> {
    const params = new URLSearchParams();
    if (isActive !== undefined) params.set('is_active', isActive.toString());

    const query = params.toString();
    const endpoint = query ? `/contacts/user/${encodeURIComponent(userId)}?${query}` : `/contacts/user/${encodeURIComponent(userId)}`;

    return this.request<NotificationContactListResponse>(endpoint);
  }

  /**
   * Create a notification contact for a user
   */
  async createContact(userId: string, contact: NotificationContactCreate): Promise<NotificationContactResponse> {
    return this.request<NotificationContactResponse>(`/contacts/user/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  /**
   * Update a notification contact
   */
  async updateContact(contactId: string, updates: NotificationContactUpdate): Promise<NotificationContactResponse> {
    return this.request<NotificationContactResponse>(`/contacts/${encodeURIComponent(contactId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a notification contact
   */
  async deleteContact(contactId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/contacts/${encodeURIComponent(contactId)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Generate a voice call link for regulatory update
   */
  async generateVoiceCallLink(request: GenerateVoiceCallLinkRequest): Promise<GenerateVoiceCallLinkResponse> {
    return this.request<GenerateVoiceCallLinkResponse>('/voice-calls/generate-link', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get voice call payload from token
   */
  async getVoiceCallPayload(token: string): Promise<GetVoiceCallPayloadResponse> {
    return this.request<GetVoiceCallPayloadResponse>(`/voice-calls/payload/${encodeURIComponent(token)}`);
  }

  /**
   * Invalidate a voice call token
   */
  async invalidateVoiceCallToken(token: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/voice-calls/token/${encodeURIComponent(token)}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export default ApiClient;
