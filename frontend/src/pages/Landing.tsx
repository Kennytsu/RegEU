import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Shield, Zap, Bell, Bot, CheckCircle2, XCircle } from "lucide-react";
import euStars from "@/assets/eu-stars.png";
import { apiClient, CompanyProfileSimple } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { BackendConnectionTest } from "@/components/BackendConnectionTest";

// Available regulatory topics (matching backend enum)
const REGULATORY_TOPICS = [
  "AI Act",
  "Bafin",
  "Cybersecurity",
  "Gdpr",
  "Aml",
  "kyc",
  "Esg",
] as const;

export default function Landing() {
  const [urls, setUrls] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scrapedData, setScrapedData] = useState<CompanyProfileSimple[]>([]);
  const [showReview, setShowReview] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleTopic = (companyIndex: number, topic: string) => {
    setScrapedData((prev) =>
      prev.map((company, idx) => {
        if (idx === companyIndex) {
          const topics = company.regulatory_topics || [];
          const newTopics = topics.includes(topic)
            ? topics.filter((t) => t !== topic)
            : [...topics, topic];
          return { ...company, regulatory_topics: newTopics };
        }
        return company;
      })
    );
  };

  const handleSaveProfiles = async () => {
    setIsSaving(true);

    try {
      toast({
        title: "Saving profiles...",
        description: `Creating ${scrapedData.length} company profile${scrapedData.length === 1 ? '' : 's'}`,
      });

      const result = await apiClient.saveCompanyProfiles(scrapedData);

      if (result.success) {
        toast({
          title: "✅ Profiles Created!",
          description: `Successfully saved ${result.data.length} company profile${result.data.length === 1 ? '' : 's'} to the database`,
          duration: 5000,
        });

        // Navigate to dashboard after successful save
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to save profiles:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      toast({
        title: "❌ Failed to Save Profiles",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsSaving(false);
    }
  };

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

      if (urlList.length === 0) {
        toast({
          title: "Error",
          description: "Please enter at least one URL",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Show loading toast
      toast({
        title: "Analyzing companies...",
        description: `Scraping ${urlList.length} compan${urlList.length === 1 ? 'y' : 'ies'}`,
      });

      // Use the new batch scraping API
      const result = await apiClient.scrapeCompanies({
        urls: urlList,
      });

      if (result.success && result.data) {
        setScrapedData(result.data);
        setShowReview(true);

        // Show success notification
        toast({
          title: "✅ Analysis Complete!",
          description: `Analyzed ${result.data.length} compan${result.data.length === 1 ? 'y' : 'ies'}. Please review and confirm topics.`,
          duration: 5000,
        });

        // Show individual errors if any
        if (result.errors && result.errors.length > 0) {
          setTimeout(() => {
            result.errors?.forEach((err, index) => {
              setTimeout(() => {
                toast({
                  title: "❌ Scraping Failed",
                  description: `${err.url}: ${err.error}`,
                  variant: "destructive",
                  duration: 5000,
                });
              }, index * 500); // Stagger error toasts
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Scraping failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      toast({
        title: "❌ Failed to Create Profiles",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
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
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !urls.trim()}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Analyzing...</span>
                  </div>
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              We'll analyze your sites and create your company profile
            </p>
          </form>

          {/* Review Section */}
          {showReview && scrapedData.length > 0 && (
            <div className="max-w-4xl mx-auto mb-16">
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  📋 Review Your Company Profiles
                </h3>
                <p className="text-sm text-muted-foreground">
                  AI has suggested regulatory topics for your compan{scrapedData.length === 1 ? 'y' : 'ies'}.
                  Click on topics below to add or remove them before saving.
                </p>
              </div>

              <div className="space-y-6">
                {scrapedData.map((data, idx) => (
                  <div
                    key={idx}
                    className="p-6 border rounded-lg bg-card shadow-sm"
                  >
                    <div className="mb-4">
                      <h4 className="font-semibold text-lg mb-1">
                        {data.company_name}
                      </h4>
                      {data.website_url && (
                        <a
                          href={data.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {data.website_url}
                        </a>
                      )}
                    </div>

                    {data.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {data.description}
                      </p>
                    )}

                    {data.industry && (
                      <div className="mb-4 text-sm">
                        <span className="font-medium">Industry: </span>
                        <span className="text-muted-foreground">
                          {data.industry}
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Regulatory Topics (click to toggle):
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {REGULATORY_TOPICS.map((topic) => {
                          const isSelected = data.regulatory_topics?.includes(topic);
                          return (
                            <button
                              key={topic}
                              onClick={() => toggleTopic(idx, topic)}
                              className={`px-3 py-2 rounded-md border text-sm transition-all ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background hover:bg-accent border-border"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                                    isSelected
                                      ? "bg-white border-white"
                                      : "border-muted-foreground"
                                  }`}
                                >
                                  {isSelected && (
                                    <CheckCircle2 className="w-3 h-3 text-primary" />
                                  )}
                                </div>
                                <span>{topic}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReview(false);
                    setScrapedData([]);
                    setUrls("");
                  }}
                  disabled={isSaving}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfiles}
                  disabled={isSaving}
                  className="flex-1 gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save & Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
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
