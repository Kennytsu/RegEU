/**
 * Company Scraper Component
 * UI for scraping company information and viewing results
 */

import { useState } from 'react';
import { useCompanyScraper } from '@/hooks/use-company-scraper';
import { CompanyProfile } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ExternalLink } from 'lucide-react';

export function CompanyScraper() {
  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [wikipediaUrl, setWikipediaUrl] = useState('');
  const [scrapedProfile, setScrapedProfile] = useState<CompanyProfile | null>(null);

  const { scrapeCompany, isLoading } = useCompanyScraper();

  const handleScrape = async () => {
    if (!companyName.trim()) {
      return;
    }

    const profile = await scrapeCompany({
      company_name: companyName.trim(),
      website_url: websiteUrl.trim() || undefined,
      wikipedia_url: wikipediaUrl.trim() || undefined,
    });

    if (profile) {
      setScrapedProfile(profile);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Profile Scraper</CardTitle>
          <CardDescription>
            Extract company information from websites and Wikipedia to identify relevant regulatory topics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              placeholder="e.g., Tesla, Microsoft, OpenAI"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL (optional)</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wikipediaUrl">Wikipedia URL (optional)</Label>
            <Input
              id="wikipediaUrl"
              type="url"
              placeholder="https://en.wikipedia.org/wiki/Company_Name"
              value={wikipediaUrl}
              onChange={(e) => setWikipediaUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button onClick={handleScrape} disabled={isLoading || !companyName.trim()} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Scrape Company
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {scrapedProfile && (
        <Card>
          <CardHeader>
            <CardTitle>{scrapedProfile.company_name}</CardTitle>
            <CardDescription>
              <Badge variant={scrapedProfile.scrape_status === 'success' ? 'default' : 'destructive'}>
                {scrapedProfile.scrape_status}
              </Badge>
              {scrapedProfile.source_type && (
                <Badge variant="outline" className="ml-2">
                  Source: {scrapedProfile.source_type}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            {scrapedProfile.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{scrapedProfile.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {scrapedProfile.industry && (
                <div>
                  <span className="font-semibold">Industry:</span> {scrapedProfile.industry}
                </div>
              )}
              {scrapedProfile.sector && (
                <div>
                  <span className="font-semibold">Sector:</span> {scrapedProfile.sector}
                </div>
              )}
              {scrapedProfile.founded_year && (
                <div>
                  <span className="font-semibold">Founded:</span> {scrapedProfile.founded_year}
                </div>
              )}
              {scrapedProfile.headquarters && (
                <div>
                  <span className="font-semibold">Headquarters:</span> {scrapedProfile.headquarters}
                </div>
              )}
              {scrapedProfile.employee_count && (
                <div>
                  <span className="font-semibold">Employees:</span> {scrapedProfile.employee_count}
                </div>
              )}
            </div>

            {/* Regulatory Topics */}
            {scrapedProfile.regulatory_topics && scrapedProfile.regulatory_topics.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Relevant Regulatory Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {scrapedProfile.regulatory_topics.map((topic) => (
                    <Badge key={topic} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Technologies */}
            {scrapedProfile.technologies_used && scrapedProfile.technologies_used.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Technologies Used</h3>
                <div className="flex flex-wrap gap-2">
                  {scrapedProfile.technologies_used.map((tech) => (
                    <Badge key={tech} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Products/Services */}
            {scrapedProfile.products_services && scrapedProfile.products_services.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Products & Services</h3>
                <div className="flex flex-wrap gap-2">
                  {scrapedProfile.products_services.map((product) => (
                    <Badge key={product} variant="outline">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex gap-4">
              {scrapedProfile.website_url && (
                <a
                  href={scrapedProfile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {scrapedProfile.wikipedia_url && (
                <a
                  href={scrapedProfile.wikipedia_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Wikipedia <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {scrapedProfile.scrape_error && (
              <div className="text-sm text-destructive">
                <span className="font-semibold">Error:</span> {scrapedProfile.scrape_error}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
