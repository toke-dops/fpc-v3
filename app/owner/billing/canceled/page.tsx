"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function BillingCanceledPageContent() {
  const searchParams = useSearchParams();
  const clubId = searchParams.get("clubId");

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Checkout Canceled</CardTitle>
          <CardDescription>
            Your subscription checkout was canceled. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            You can try again anytime or contact support if you need assistance.
          </p>

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
              <Link href={clubId ? `/billing/checkout?clubId=${clubId}` : "/billing/checkout"}>
                Try Again
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingCanceledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <BillingCanceledPageContent />
    </Suspense>
  );
}

