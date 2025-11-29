/**
 * Company Scraper Page
 */

import { CompanyScraper } from '@/components/CompanyScraper';

export default function CompanyScraperPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Company Intelligence</h1>
        <p className="text-muted-foreground">
          Discover regulatory topics and compliance requirements relevant to any company
        </p>
      </div>

      <CompanyScraper />
    </div>
  );
}
