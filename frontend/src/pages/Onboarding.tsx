import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { apiClient, CompanyProfileSimple } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Available regulatory topics (matching backend enum)
const REGULATORY_TOPICS = [
  "AI Act",
  "BaFin",
  "Cybersecurity",
  "GDPR",
  "AMLR",
  "ESG",
] as const;

export default function Onboarding() {
  const [urls, setUrls] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scrapedData, setScrapedData] = useState<CompanyProfileSimple[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user already has profiles on mount
  useEffect(() => {
    const checkExistingProfiles = async () => {
      if (!user) {
        setCheckingProfile(false);
        return;
      }

      try {
        const profileCheck = await apiClient.checkUserHasProfiles(user.id);

        if (profileCheck.has_profiles) {
          // User already has profiles, redirect to dashboard
          toast({
            title: "Profile already exists",
            description: "Redirecting to dashboard...",
          });
          navigate('/dashboard');
        } else {
          setCheckingProfile(false);
        }
      } catch (error) {
        console.error('Error checking profiles:', error);
        // On error, allow them to continue with onboarding
        setCheckingProfile(false);
      }
    };

    checkExistingProfiles();
  }, [user, navigate, toast]);

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
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save profiles",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      toast({
        title: "Saving profiles...",
        description: `Creating ${scrapedData.length} company profile${scrapedData.length === 1 ? '' : 's'}`,
      });

      const result = await apiClient.saveCompanyProfiles(scrapedData, user.id);

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
              }, index * 500);
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Scraping failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      toast({
        title: "❌ Failed to Analyze",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking profile
  if (checkingProfile) {
    return (
      <div className="min-h-screen py-12 px-6 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6 bg-background">
      <div className="max-w-2xl mx-auto">
        {!showReview ? (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-semibold text-foreground mb-2">
                Create Your Company Profile
              </h1>
              <p className="text-muted-foreground">
                Enter your company website to get started with regulatory tracking
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter company website..."
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
                We'll analyze your site and suggest relevant regulations
              </p>
            </form>
          </>
        ) : (
          <div>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                📋 Review Your Company Profile
              </h3>
              <p className="text-sm text-muted-foreground">
                AI has suggested regulatory topics. Click on topics to add or remove them.
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
                Start Over
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
      </div>
    </div>
  );
}
