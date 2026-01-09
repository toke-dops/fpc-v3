"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Loader2, TrendingUp, Eye, MousePointerClick, Mail, MapPin, Building2, LogOut, Search, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

export function AdminAnalyticsClient() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  // Memoize query args to prevent infinite re-renders
  const queryArgs = useMemo(() => {
    if (dateRange === "all") {
      return { limit: 20 };
    }

    const now = Date.now();
    let startDate: number;
    
    switch (dateRange) {
      case "7d":
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "90d":
        startDate = now - 90 * 24 * 60 * 60 * 1000;
        break;
      default:
        return { limit: 20 };
    }

    return {
      startDate,
      endDate: now,
      limit: 20,
    };
  }, [dateRange]);

  // Get analytics data
  const analytics = useQuery(api.analytics.getAdminDashboard, queryArgs);

  // Loading state
  if (analytics === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Error or null state
  if (!analytics) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-slate-900 mb-2">No Analytics Data</p>
          <p className="text-sm text-muted-foreground">
            There are no analytics events recorded yet. Analytics will appear here once users start viewing clubs and interacting with the site.
          </p>
        </div>
      </div>
    );
  }

  // Handle case where analytics might not have the expected structure
  if (!analytics.overview) {
    console.error("Analytics data structure error:", analytics);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-red-600 mb-2">Error Loading Analytics</p>
          <p className="text-sm text-muted-foreground mb-4">
            The analytics data structure is unexpected. Please check the console for details.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  const { overview, popularClubs = [], popularLocations = [] } = analytics;
  const { totalViews = 0, totalBookingClicks = 0, totalLeads = 0, totalEvents = 0 } = overview;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Track popular clubs, locations, and user engagement
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin">Back to Dashboard</Link>
              </Button>
              <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
                <Button
                  variant={dateRange === "7d" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDateRange("7d")}
                  className="h-8"
                >
                  7d
                </Button>
                <Button
                  variant={dateRange === "30d" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDateRange("30d")}
                  className="h-8"
                >
                  30d
                </Button>
                <Button
                  variant={dateRange === "90d" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDateRange("90d")}
                  className="h-8"
                >
                  90d
                </Button>
                <Button
                  variant={dateRange === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDateRange("all")}
                  className="h-8"
                >
                  All
                </Button>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Club page views</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Booking Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalBookingClicks.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">"Book now" button clicks</p>
              {totalViews > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {((totalBookingClicks / totalViews) * 100).toFixed(1)}% conversion
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lead Submissions</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Contact form submissions</p>
              {totalViews > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {((totalLeads / totalViews) * 100).toFixed(1)}% conversion
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">All tracked events</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Popular Clubs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Popular Clubs
              </CardTitle>
              <CardDescription>
                Clubs with the most engagement (views, clicks, leads)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {popularClubs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No club data available
                </p>
              ) : (
                <div className="space-y-4">
                  {popularClubs.map((club: any, index: number) => {
                    const total = club.views + club.clicks + club.leads;
                    return (
                      <div
                        key={club.clubId}
                        className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-500 w-6">
                              #{index + 1}
                            </span>
                            {club.club ? (
                              <Link
                                href={`/clubs/${club.club.slug}`}
                                className="font-semibold text-slate-900 hover:text-primary transition-colors"
                              >
                                {club.club.name}
                              </Link>
                            ) : (
                              <span className="font-semibold text-slate-900">Unknown Club</span>
                            )}
                            {club.club?.rating && (
                              <Badge variant="outline" className="text-xs">
                                ⭐ {club.club.rating.toFixed(1)}
                                {club.club.rating_count && ` (${club.club.rating_count})`}
                              </Badge>
                            )}
                          </div>
                          {club.club?.city && (
                            <p className="text-xs text-muted-foreground ml-8">
                              📍 {club.club.city}
                            </p>
                          )}
                          <div className="flex gap-4 mt-2 ml-8">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {club.views} views
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MousePointerClick className="w-3 h-3" />
                              {club.clicks} clicks
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {club.leads} leads
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-4">
                          {total} total
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Popular Locations
              </CardTitle>
              <CardDescription>
                Cities/areas with the most engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {popularLocations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No location data available
                </p>
              ) : (
                <div className="space-y-4">
                  {popularLocations.map((location: any, index: number) => {
                    const total = location.views + location.clicks + location.leads;
                    const citySlug = location.city.toLowerCase().replace(/\s+/g, "-");
                    return (
                      <div
                        key={location.city}
                        className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-500 w-6">
                              #{index + 1}
                            </span>
                            <Link
                              href={`/city/${citySlug}`}
                              className="font-semibold text-slate-900 hover:text-primary transition-colors"
                            >
                              {location.city}
                            </Link>
                          </div>
                          <div className="flex gap-4 mt-2 ml-8 flex-wrap">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {location.views} views
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MousePointerClick className="w-3 h-3" />
                              {location.clicks} clicks
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {location.leads} leads
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {location.clubCount} {location.clubCount === 1 ? "club" : "clubs"}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-4">
                          {total} total
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

