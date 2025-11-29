import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Shield, Zap, Bell, Bot } from "lucide-react";
import euStars from "@/assets/eu-stars.png";
import { apiClient, CompanyProfile } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { BackendConnectionTest } from "@/components/BackendConnectionTest";

export default function Landing() {
  const [urls, setUrls] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<CompanyProfile[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urls) return;

    setIsLoading(true);
    setScrapedData([]);

    try {
      // Split URLs by comma or newline
      const urlList = urls
        .split(/[,\n]/)
        .map((u) => u.trim())
        .filter(Boolean);

      // Use the new batch scraping API
      const result = await apiClient.scrapeCompanies({
        urls: urlList,
      });

      if (result.success && result.data) {
        setScrapedData(result.data);

        toast({
          title: "Success",
          description: `Successfully scraped ${result.data.length} compan${result.data.length === 1 ? 'y' : 'ies'}`,
        });

        // Show errors if any
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((err) => {
            toast({
              title: "Error",
              description: `Failed to scrape ${err.url}: ${err.error}`,
              variant: "destructive",
            });
          });
        }
      }
    } catch (error) {
      console.error("Scraping failed:", error);
      toast({
        title: "Error",
        description: "Failed to scrape companies",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Stay Compliant",
      description: "Never miss a regulation",
    },
    { icon: Zap, title: "AI Insights", description: "Smart summaries for you" },
    {
      icon: Bell,
      title: "Real-time Alerts",
      description: "Email, SMS, or calls",
    },
    { icon: Bot, title: "AI Assistant", description: "Ask anything" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border">
        <nav className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={euStars} alt="EUgene" className="w-5 h-5" />
            <span className="font-semibold text-foreground">EUgene</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            Sign In
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <main className="px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-4">
            EU Regulatory Intelligence
          </p>

          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-4 tracking-tight">
            We watch the EU so you don't have to
          </h1>

          <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
            AI-powered alerts on regulations that matter to your business.
          </p>

          {/* URL Input */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-16">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter company websites (comma-separated)..."
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "..." : <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              We'll analyze your sites and suggest relevant regulations
            </p>
          </form>

          {/* Scraped Results */}
          {scrapedData.length > 0 && (
            <div className="max-w-4xl mx-auto mb-16">
              <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
              <div className="space-y-4">
                {scrapedData.map((data, idx) => (
                  <div key={idx} className="p-4 border rounded-lg bg-card">
                    <h4 className="font-semibold mb-2">{data.company_name}</h4>
                    <div className="text-sm space-y-2">
                      {data.regulatory_topics &&
                        data.regulatory_topics.length > 0 && (
                          <div>
                            <span className="font-medium">
                              Regulatory Topics:{" "}
                            </span>
                            <span className="text-muted-foreground">
                              {data.regulatory_topics.join(", ")}
                            </span>
                          </div>
                        )}
                      {data.industry && (
                        <div>
                          <span className="font-medium">Industry: </span>
                          <span className="text-muted-foreground">
                            {data.industry}
                          </span>
                        </div>
                      )}
                      {data.technologies_used &&
                        data.technologies_used.length > 0 && (
                          <div>
                            <span className="font-medium">Technologies: </span>
                            <span className="text-muted-foreground">
                              {data.technologies_used.join(", ")}
                            </span>
                          </div>
                        )}
                    </div>
                    <details className="mt-3">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        View full JSON
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Backend Connection Test */}
        <div className="max-w-4xl mx-auto mt-20">
          <BackendConnectionTest />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-4xl mx-auto text-center text-xs text-muted-foreground">
          © 2024 EUgene
        </div>
      </footer>
    </div>
  );
}
