import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { RegulatoryCard } from "@/components/shared/RegulatoryCard";
import { TopicBadge } from "@/components/shared/TopicBadge";
import { useMeetings, useLegislativeFiles } from "@/hooks/useMeetings";
import { useUserTopics } from "@/hooks/useUserTopics";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  MessageSquare, 
  Loader2, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Sparkles,
  FileText,
  Calendar,
  Target,
  BarChart3
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Dashboard() {
  const { data: meetings = [], isLoading: loadingMeetings } = useMeetings(50);
  const { data: legislation = [], isLoading: loadingLegislation } = useLegislativeFiles(500);
  const { data: userTopics = [], isLoading: loadingUserTopics } = useUserTopics();

  const isLoading = loadingMeetings || loadingLegislation || loadingUserTopics;

  // Filter items by user's topics
  const personalizedItems = useMemo(() => {
    if (userTopics.length === 0) return legislation;
    return legislation.filter(item => 
      item.topics?.some(topic => userTopics.includes(topic))
    );
  }, [legislation, userTopics]);

  // Get recent updates (last 30 days)
  const recentUpdates = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return personalizedItems
      .filter(item => new Date(item.date) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [personalizedItems]);

  // Get upcoming/active items
  const activeItems = useMemo(() => {
    return personalizedItems
      .filter(item => {
        const completedStatuses = [
          'Procedure completed',
          'Procedure lapsed or withdrawn',
          'Procedure rejected',
          'Procedure completed - delegated act enters into force'
        ];
        return item.legislativeStatus && !completedStatuses.some(s => item.legislativeStatus?.includes(s));
      })
      .slice(0, 4);
  }, [personalizedItems]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = personalizedItems.length;
    const active = personalizedItems.filter(item => 
      item.status && !item.status.includes('completed') && !item.status.includes('rejected')
    ).length;
    const thisWeek = personalizedItems.filter(item => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(item.date) >= weekAgo;
    }).length;
    
    // Topic breakdown
    const topicCounts: Record<string, number> = {};
    personalizedItems.forEach(item => {
      item.topics?.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
    
    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return { total, active, thisWeek, topTopics };
  }, [personalizedItems]);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Welcome Back
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {userTopics.length > 0 
                  ? `Tracking ${stats.total} items across your ${userTopics.length} regulatory topics`
                  : "Your personalized regulatory intelligence dashboard"
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/chat">
                <Button size="sm" variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Ask AI
                </Button>
              </Link>
              <Link to="/board">
                <Button size="sm" className="gap-2">
                  <Target className="w-4 h-4" />
                  View Board
                </Button>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Total Tracked
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Legislative items
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Active
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      In progress
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-orange-600">{stats.thisWeek}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      New updates
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Your Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">{userTopics.length || "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Monitored areas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left Side */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Recent Updates */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          Recent Updates
                        </CardTitle>
                        <Link to="/board">
                          <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            View All
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {recentUpdates.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {recentUpdates.map((item) => (
                            <RegulatoryCard key={item.id} item={item} compact />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No recent updates in the last 30 days</p>
                          <Link to="/settings" className="text-xs text-primary hover:underline mt-2 inline-block">
                            Configure your topics in Settings
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Active Items Requiring Attention */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-5 w-5 text-orange-500" />
                        Active & Requiring Attention
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {activeItems.length > 0 ? (
                        <div className="space-y-3">
                          {activeItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground line-clamp-1">
                                  {item.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {item.legislativeStatus && (
                                    <Badge variant="outline" className="text-xs">
                                      {item.legislativeStatus}
                                    </Badge>
                                  )}
                                  {item.committee && (
                                    <Badge variant="secondary" className="text-xs">
                                      {item.committee}
                                    </Badge>
                                  )}
                                </div>
                                {item.topics && item.topics.length > 0 && (
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {item.topics.slice(0, 2).map(topic => (
                                      <TopicBadge key={topic} topicId={topic} className="text-xs" />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Link to="/board">
                                <Button variant="ghost" size="sm" className="shrink-0">
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">All items are up to date</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar - Right Side */}
                <div className="space-y-6">
                  {/* Your Topics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Your Topics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userTopics.length > 0 ? (
                        <div className="space-y-3">
                          {userTopics.map(topic => {
                            const count = stats.topTopics.find(([t]) => t === topic)?.[1] || 0;
                            return (
                              <div key={topic} className="flex items-center justify-between">
                                <TopicBadge topicId={topic} />
                                <span className="text-sm font-semibold text-muted-foreground">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                          <p className="text-sm text-muted-foreground mb-3">
                            No topics configured
                          </p>
                          <Link to="/settings">
                            <Button size="sm" variant="outline">
                              Configure Topics
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Topic Activity Breakdown */}
                  {stats.topTopics.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          Most Active Topics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {stats.topTopics.map(([topic, count], index) => {
                            const percentage = Math.round((count / stats.total) * 100);
                            return (
                              <div key={topic}>
                                <div className="flex items-center justify-between mb-1">
                                  <TopicBadge topicId={topic} className="text-xs px-1.5 py-0" />
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {count} ({percentage}%)
                                  </span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                  <div
                                    className="bg-primary rounded-full h-2 transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Link to="/board?personalized=true">
                          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                            <Target className="h-4 w-4" />
                            View Personalized Board
                          </Button>
                        </Link>
                        <Link to="/chat">
                          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Ask AI Assistant
                          </Button>
                        </Link>
                        <Link to="/settings">
                          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Manage Topics
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
