"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function BillingFailedPageContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
          <CardDescription>
            We couldn't process your payment. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{decodeURIComponent(error)}</p>
              </div>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Common reasons for payment failure:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Insufficient funds</li>
              <li>Card expired or invalid</li>
              <li>Bank declined the transaction</li>
              <li>Network error during processing</li>
              <li>3D Secure authentication required</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            {plan ? (
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/billing/checkout?plan=${plan}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Try Again
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="flex-1">
                <Link href="/owner/subscriptions">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Subscriptions
                </Link>
              </Button>
            )}
            <Button asChild className="flex-1">
              <Link href="/owner/subscriptions">
                View Subscriptions
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <BillingFailedPageContent />
    </Suspense>
  );
}

