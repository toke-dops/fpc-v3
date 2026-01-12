"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, Suspense } from "react";

function BillingSuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clubId = searchParams.get("clubId");
  
  const club = clubId ? useQuery(api.clubs.getById, { id: clubId as any }) : null;
  const subscription = clubId ? useQuery(api.subscriptions.getSubscriptionByClub, { clubId: clubId as any }) : null;

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (clubId) {
        router.push(`/owner/clubs/${clubId}`);
      } else {
        router.push("/owner/subscriptions");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [clubId, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your subscription has been activated successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {club && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Club</p>
              <p className="text-lg">{club.name}</p>
              {club.city && (
                <p className="text-sm text-muted-foreground">{club.city}</p>
              )}
            </div>
          )}

          {subscription && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Next Billing Date</p>
              </div>
              <p className="text-lg">
                {subscription.current_period_end 
                  ? new Date(subscription.current_period_end).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {clubId && (
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/owner/clubs/${clubId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Club
                </Link>
              </Button>
            )}
            <Button asChild className="flex-1">
              <Link href="/owner/subscriptions">
                View Subscriptions
              </Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Redirecting automatically in 5 seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <BillingSuccessPageContent />
    </Suspense>
  );
}

