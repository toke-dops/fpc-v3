"use client";

import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, CheckCircle2, Clock, XCircle, Sparkles, Building2, Calendar, Users, BarChart3, Star, Mail, TrendingUp, Eye, Badge as BadgeIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function MySubscriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const subscriptions = useQuery(api.subscriptions.getMySubscriptions);
  const myClubs = useQuery(api.owner.getMyClubs);
  const userData = useQuery(api.users.getCurrentUser);
  const [showSuccess, setShowSuccess] = useState(false);

  // Show success message if redirected from checkout
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "subscription_activated") {
      setShowSuccess(true);
      setTimeout(() => {
        router.replace("/owner/subscriptions", { scroll: false });
        setShowSuccess(false);
      }, 5000);
    }
  }, [searchParams, router]);

  // Redirect if not authenticated
  if (clerkLoaded && !clerkUser) {
    router.push("/sign-in");
    return null;
  }

  // Loading state
  if (!clerkLoaded || subscriptions === undefined || myClubs === undefined || userData === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Find subscriptions from Convex
  const activeSubscription = subscriptions?.find(sub => sub.status === "active");
  const upcomingSubscription = subscriptions?.find(sub => sub.status === "upcoming");
  const endedSubscriptions = subscriptions?.filter(sub => sub.status === "canceled");

  // SOURCE OF TRUTH: Always use activeSubscription.plan for current plan
  // This ensures the current plan stays active until the subscription expires
  const currentPlan = activeSubscription?.plan || userData?.plan || "basic";
  
  // Get scheduled plan and dates from active subscription
  const scheduledPlan = activeSubscription?.scheduled_plan || null;
  const scheduledAtPeriodEnd = activeSubscription?.scheduled_at_period_end || activeSubscription?.scheduled_plan_activation_date || null;
  const currentPeriodEnd = activeSubscription?.current_period_end || null;

  // Determine actual active plan for display purposes
  const clubPlans = myClubs?.map(club => club.plan) || [];
  const hasBusinessClub = clubPlans.includes("business");
  const hasFeaturedClub = clubPlans.includes("featured");
  const actualActivePlan = hasFeaturedClub ? "featured" : hasBusinessClub ? "business" : currentPlan;

  const PLAN_DETAILS = {
    basic: {
      name: "Basic Plan",
      price: "Free",
      monthlyPrice: 0,
      icon: CheckCircle2,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
      features: [
        { icon: CheckCircle2, text: "Basic club listing" },
        { icon: CheckCircle2, text: "Edit club information" },
      ],
    },
    business: {
      name: "Business Plan",
      price: "£49.99",
      monthlyPrice: 49.99,
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      features: [
        { icon: Calendar, text: "Booking Link" },
        { icon: BarChart3, text: "Access to Analytics Dashboard" },
        { icon: Mail, text: "Dedicated Email Support" },
        { icon: TrendingUp, text: "Priority Listing over Basic Plan" },
      ],
    },
    featured: {
      name: "Featured Plan",
      price: "£149.99",
      monthlyPrice: 149.99,
      icon: Sparkles,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      features: [
        { icon: Star, text: "Advert Placement" },
        { icon: TrendingUp, text: "Top-of-List Placement" },
        { icon: Eye, text: "Homepage and Special Placements" },
        { icon: Mail, text: "Priority Support" },
        { icon: BarChart3, text: "Advanced Analytics (All Business Features)" },
        { icon: Calendar, text: "Booking Link" },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/owner/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Subscription</h1>
            <p className="text-muted-foreground">
              Manage your subscription and billing
            </p>
          </div>
        </div>

        {/* Success message */}
        {showSuccess && (
          <div className="mb-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <p>Subscription activated successfully! Your plan is now active.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current Active Plan - Source of Truth */}
        {activeSubscription && (
          <div className="mb-8">
            <Card className={`border-2 ${PLAN_DETAILS[currentPlan as keyof typeof PLAN_DETAILS].borderColor} ${PLAN_DETAILS[currentPlan as keyof typeof PLAN_DETAILS].bgColor}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">
                        {PLAN_DETAILS[currentPlan as keyof typeof PLAN_DETAILS].name}
                      </CardTitle>
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Current Plan
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Applies to {myClubs?.length || 0} club{myClubs?.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Plan Name</div>
                    <Badge variant="default" className="capitalize">
                      {PLAN_DETAILS[currentPlan as keyof typeof PLAN_DETAILS].name}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                    <Badge variant="default" className="capitalize">
                      Active
                    </Badge>
                  </div>
                  {currentPeriodEnd && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {scheduledPlan ? "Plan Expires" : "Next Billing Date"}
                      </div>
                      <div className="text-sm">
                        {new Date(currentPeriodEnd).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      {scheduledPlan ? (
                        <div className="text-xs text-muted-foreground mt-1">
                          {PLAN_DETAILS[scheduledPlan as keyof typeof PLAN_DETAILS]?.monthlyPrice 
                            ? `£${PLAN_DETAILS[scheduledPlan as keyof typeof PLAN_DETAILS].monthlyPrice.toFixed(2)} will be charged on ${new Date(scheduledAtPeriodEnd || currentPeriodEnd).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}`
                            : "No charge (Basic plan)"}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground mt-1">
                          {currentPlan === "featured" 
                            ? "£149.99 will be charged"
                            : currentPlan === "business"
                            ? "£49.99 will be charged"
                            : "No charge (Basic plan)"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Scheduled Plan Change */}
                {scheduledPlan && scheduledAtPeriodEnd && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-1">
                      Scheduled Plan Change
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>
                        You are on <strong>{PLAN_DETAILS[currentPlan as keyof typeof PLAN_DETAILS].name}</strong> until{" "}
                        {new Date(scheduledAtPeriodEnd).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        . Your plan will then change to <strong>{PLAN_DETAILS[scheduledPlan as keyof typeof PLAN_DETAILS]?.name || scheduledPlan}</strong>.
                      </div>
                      {PLAN_DETAILS[scheduledPlan as keyof typeof PLAN_DETAILS]?.monthlyPrice && (
                        <div className="text-xs text-blue-600 mt-1">
                          <strong>£{PLAN_DETAILS[scheduledPlan as keyof typeof PLAN_DETAILS].monthlyPrice.toFixed(2)}</strong> will be charged on{" "}
                          {new Date(scheduledAtPeriodEnd).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Plan Features */}
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium text-muted-foreground mb-3">Plan Features</div>
                  <div className="space-y-2">
                    {PLAN_DETAILS[currentPlan as keyof typeof PLAN_DETAILS].features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <feature.icon className="w-4 h-4 text-green-600" />
                        <span>{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upcoming Plan */}
        {upcomingSubscription && (
          <div className="mb-8">
            <Card className="border-2 border-blue-300 bg-blue-50/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">
                        {PLAN_DETAILS[upcomingSubscription.plan as keyof typeof PLAN_DETAILS]?.name || upcomingSubscription.plan}
                      </CardTitle>
                      <Badge className="bg-blue-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Upcoming
                      </Badge>
                    </div>
                    <CardDescription>
                      This plan will activate on{" "}
                      {upcomingSubscription.current_period_end
                        ? new Date(upcomingSubscription.current_period_end).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "the expiry date of your current plan"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Subscription Packages */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Subscription Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic Plan */}
            <Card className={`border-2 ${actualActivePlan === "basic" ? "border-green-300 bg-green-50/50" : "border-slate-200"}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Basic</span>
                  {currentPlan === "basic" && (
                    <Badge className="bg-green-600">Current Plan</Badge>
                  )}
                  {scheduledPlan === "basic" && (
                    <Badge className="bg-blue-600">
                      <Clock className="w-3 h-3 mr-1" />
                      Upcoming
                    </Badge>
                  )}
                </CardTitle>
                <div className="text-2xl font-bold mt-2">Free</div>
                <CardDescription>Basic plan for all verified club owners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {PLAN_DETAILS.basic.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <feature.icon className="w-4 h-4 text-green-600" />
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>
                {currentPlan === "basic" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : scheduledPlan === "basic" && scheduledAtPeriodEnd ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    This plan will be active on {new Date(scheduledAtPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
                  </div>
                ) : (
                  <Button className="w-full" asChild>
                    <Link href="/billing/checkout?plan=basic">Select Basic Plan</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Business Plan */}
            <Card className={`border-2 ${actualActivePlan === "business" ? "border-green-300 bg-green-50/50" : "border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Business</span>
                  {currentPlan === "business" && (
                    <Badge className="bg-green-600">Current Plan</Badge>
                  )}
                  {scheduledPlan === "business" && (
                    <Badge className="bg-blue-600">
                      <Clock className="w-3 h-3 mr-1" />
                      Upcoming
                    </Badge>
                  )}
                </CardTitle>
                <div className="text-2xl font-bold mt-2">£49.99<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <CardDescription>Essential features for growing your club</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {PLAN_DETAILS.business.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <feature.icon className="w-4 h-4 text-green-600" />
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>
                
                {/* Show scheduled plan if there is one */}
                {scheduledPlan && scheduledAtPeriodEnd && currentPlan !== scheduledPlan && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <div className="font-medium text-blue-900 mb-1">Next Scheduled Plan</div>
                    <div className="text-blue-700">
                      Will change to <strong>{PLAN_DETAILS[scheduledPlan as keyof typeof PLAN_DETAILS]?.name || scheduledPlan}</strong> on{" "}
                      {new Date(scheduledAtPeriodEnd).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                )}

                {currentPlan === "business" ? (
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/owner/subscriptions">Manage Subscription</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/billing/checkout?plan=basic">Downgrade to Basic</Link>
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" asChild>
                    <Link href="/billing/checkout?plan=business">
                      {scheduledPlan === "business" ? "Already Scheduled" : "Select Business Plan"}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Featured Plan */}
            <Card className={`border-2 ${actualActivePlan === "featured" ? "border-green-300 bg-green-50/50" : "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100"}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Featured</span>
                  {currentPlan === "featured" && (
                    <Badge className="bg-green-600">Current Plan</Badge>
                  )}
                  {scheduledPlan === "featured" && (
                    <Badge className="bg-blue-600">
                      <Clock className="w-3 h-3 mr-1" />
                      Upcoming
                    </Badge>
                  )}
                </CardTitle>
                <div className="text-2xl font-bold mt-2">£149.99<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <CardDescription>Maximum visibility for your club</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {PLAN_DETAILS.featured.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <feature.icon className="w-4 h-4 text-green-600" />
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>
                {currentPlan === "featured" ? (
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/owner/subscriptions">Manage Subscription</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/billing/checkout?plan=business">Downgrade to Business</Link>
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" asChild>
                    <Link href="/billing/checkout?plan=featured">
                      {scheduledPlan === "featured" ? "Already Scheduled" : "Select Featured Plan"}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
