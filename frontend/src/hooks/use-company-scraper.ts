/**
 * React Hook for Company Scraper
 * Provides easy access to company scraping functionality
 */

import { useState } from 'react';
import { apiClient, CompanyProfile, CompanyProfileRequest } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export interface UseCompanyScraperReturn {
  scrapeCompany: (request: CompanyProfileRequest) => Promise<CompanyProfile | null>;
  getCompany: (companyName: string) => Promise<CompanyProfile | null>;
  listCompanies: (params?: { limit?: number; offset?: number; industry?: string }) => Promise<CompanyProfile[]>;
  deleteCompany: (companyName: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useCompanyScraper(): UseCompanyScraperReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const scrapeCompany = async (request: CompanyProfileRequest): Promise<CompanyProfile | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.scrapeCompany(request);

      if (response.success && response.data) {
        toast({
          title: 'Success!',
          description: `Successfully scraped profile for ${request.company_name}`,
        });
        return response.data;
      } else {
        const errorMessage = response.error || 'Failed to scrape company';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Scraping Failed',
          description: errorMessage,
        });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getCompany = async (companyName: string): Promise<CompanyProfile | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getCompany(companyName);

      if (response.success && response.data) {
        return response.data;
      } else {
        const errorMessage = response.error || 'Company not found';
        setError(errorMessage);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const listCompanies = async (params?: {
    limit?: number;
    offset?: number;
    industry?: string;
  }): Promise<CompanyProfile[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.listCompanies(params);

      if (response.success) {
        return response.data;
      } else {
        setError('Failed to load companies');
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCompany = async (companyName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.deleteCompany(companyName);

      if (response.success) {
        toast({
          title: 'Deleted',
          description: `Successfully deleted ${companyName}`,
        });
        return true;
      } else {
        setError('Failed to delete company');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    scrapeCompany,
    getCompany,
    listCompanies,
    deleteCompany,
    isLoading,
    error,
  };
}
