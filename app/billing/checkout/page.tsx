"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, Sparkles, Star, Image, BarChart3, Calendar, TrendingUp, Eye, Users, Badge, Mail } from "lucide-react";
import Link from "next/link";
import { PricingTable } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Component to filter PricingTable to show only selected plan
function PlanFilter({ plan }: { plan: "business" | "featured" | null }) {
  useEffect(() => {
    if (!plan) return;

    const filterPlans = () => {
      const container = document.getElementById("pricing-table-container");
      if (!container) return;

      // Wait for Clerk's component to render
      setTimeout(() => {
        // Find all pricing table cards
        const allCards = container.querySelectorAll('[class*="pricingTableCard"]');
        
        allCards.forEach((card) => {
          const cardElement = card as HTMLElement;
          const cardClasses = cardElement.className || "";
          
          // Check if this card matches the selected plan using class name
          const isBusiness = cardClasses.includes("__business") || cardClasses.includes("business");
          const isFeatured = cardClasses.includes("__featured") || cardClasses.includes("featured");
          
          // Hide cards that don't match
          if (plan === "business") {
            if (!isBusiness) {
              cardElement.style.display = "none";
            } else {
              cardElement.style.display = "";
              cardElement.style.visibility = "visible";
            }
          } else if (plan === "featured") {
            if (!isFeatured) {
              cardElement.style.display = "none";
            } else {
              cardElement.style.display = "";
              cardElement.style.visibility = "visible";
            }
          }
        });

        // Now ensure buttons are visible in the visible card
        const visibleCard = container.querySelector(`[class*="pricingTableCard__${plan}"]`) as HTMLElement;
        if (visibleCard) {
          // Make sure the card itself is visible
          visibleCard.style.display = "";
          visibleCard.style.visibility = "visible";
          visibleCard.style.opacity = "1";
          
          // Find ALL possible button-like elements
          const selectors = [
            'button',
            '[role="button"]',
            'a[href]',
            '[class*="button"]',
            '[class*="Button"]',
            '[class*="subscribe"]',
            '[class*="Subscribe"]',
            '[class*="checkout"]',
            '[class*="Checkout"]',
            '[type="submit"]',
            '[class*="cl-button"]',
            '[class*="clButton"]',
            '[class*="cl-pricingTable"]',
          ];
          
          let foundButtons = 0;
          selectors.forEach((selector) => {
            const elements = visibleCard.querySelectorAll(selector);
            elements.forEach((el) => {
              const element = el as HTMLElement;
              const computedStyle = window.getComputedStyle(element);
              
              // Force visibility but keep z-index low so it doesn't overlap Clerk's drawer
              element.style.display = "";
              element.style.visibility = "visible";
              element.style.opacity = "1";
              element.style.pointerEvents = "auto";
              
              // Remove any attributes that might hide it
              element.removeAttribute('hidden');
              element.removeAttribute('aria-hidden');
              element.setAttribute('aria-hidden', 'false');
              
              // If it was hidden by computed styles, override them
              if (computedStyle.display === 'none') {
                element.style.display = "block";
              }
              if (computedStyle.visibility === 'hidden') {
                element.style.visibility = "visible";
              }
              if (computedStyle.opacity === '0') {
                element.style.opacity = "1";
              }
              
              // Ensure z-index is low so subscribe button stays behind Clerk's drawer (which uses z-index 1000+)
              // Only set z-index if it's currently too high
              const currentZIndex = computedStyle.zIndex;
              if (currentZIndex && currentZIndex !== 'auto' && parseInt(currentZIndex) > 100) {
                element.style.zIndex = "1";
              } else {
                // Remove z-index override to let it use default stacking context
                element.style.zIndex = "";
              }
              
              foundButtons++;
            });
          });
          
          // Debug logging
          if (foundButtons === 0) {
            console.warn('[PlanFilter] No buttons found in visible card. Card HTML:', visibleCard.innerHTML.substring(0, 500));
          } else {
            console.log(`[PlanFilter] Found ${foundButtons} button-like elements`);
          }

          // Also check parent elements - sometimes buttons are nested
          const allElements = visibleCard.querySelectorAll('*');
          allElements.forEach((el) => {
            const element = el as HTMLElement;
            const tagName = element.tagName?.toLowerCase();
            const classes = element.className || "";
            
            // If it looks like a button, make sure it's visible
            if (
              tagName === 'button' ||
              tagName === 'a' ||
              element.getAttribute('role') === 'button' ||
              classes.includes('button') ||
              classes.includes('Button') ||
              classes.includes('subscribe') ||
              classes.includes('checkout')
            ) {
              element.style.display = "";
              element.style.visibility = "visible";
              element.style.opacity = "1";
              element.style.pointerEvents = "auto";
              // Keep z-index low for buttons so they don't overlap Clerk's drawer
              const buttonZIndex = window.getComputedStyle(element).zIndex;
              if (buttonZIndex && buttonZIndex !== 'auto' && parseInt(buttonZIndex) > 100) {
                element.style.zIndex = "1";
              } else {
                element.style.zIndex = "";
              }
            }
          });
        }
      }, 300);
    };

    // Initial filter
    filterPlans();

    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      filterPlans();
    });
    
    const container = document.getElementById("pricing-table-container");
    if (container) {
      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden'],
      });
    }

    // Periodic check to ensure buttons stay visible
    const interval = setInterval(filterPlans, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [plan]);

  return null;
}


const PLAN_DETAILS = {
  basic: {
    name: "Basic Plan",
    price: "Free",
    originalPrice: null,
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
    originalPrice: "£59.99",
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    features: [
      { icon: Calendar, text: "Booking Link" },
      { icon: Badge, text: "Custom Badge on Club Listings" },
      { icon: BarChart3, text: "Access to Analytics Dashboard" },
      { icon: Mail, text: "Dedicated Email Support" },
      { icon: TrendingUp, text: "Priority Listing over Basic Plan" },
    ],
  },
  featured: {
    name: "Featured Plan",
    price: "£149.99",
    originalPrice: "£199.99",
    icon: Star,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    features: [
      { icon: Star, text: "Advert Placement" },
      { icon: TrendingUp, text: "Top-of-List Placement" },
      { icon: Eye, text: "Homepage and Special Placements" },
      { icon: Mail, text: "Priority Support" },
      { icon: BarChart3, text: "Advanced Analytics (All Business Features)" },
      { icon: Calendar, text: "Booking Link" },
      { icon: Badge, text: "Custom Badge on Club Listings" },
      { icon: Users, text: "Contact Email" },
    ],
  },
};

function BillingCheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [userSynced, setUserSynced] = useState(false);
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);

  const plan = searchParams.get("plan") as "basic" | "business" | "featured" | null;
  
  // Check if user exists in Convex
  const currentUser = useQuery(api.users.getCurrentUser);

  // Listen for checkout completion and trigger sync immediately
  useEffect(() => {
    if (!user || !plan || !userSynced) return;

    const handleCheckoutSuccess = async () => {
      const syncKey = `checkout_sync_${user.id}_${plan}`;
      if (sessionStorage.getItem(syncKey)) {
        console.log("[Checkout] Already synced, skipping");
        return;
      }

      console.log(`[Checkout] Detected checkout completion for ${plan} plan, triggering sync...`);
      sessionStorage.setItem(syncKey, "true");

      try {
        const response = await fetch("/api/billing/post-purchase-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });

        const data = await response.json();
        if (data.success) {
          console.log("✅ Checkout sync successful, redirecting to subscriptions...");
          // Redirect to subscriptions page after a short delay
          setTimeout(() => {
            router.push("/owner/subscriptions?success=subscription_activated");
          }, 1500);
        } else {
          console.error("❌ Checkout sync failed:", data.error);
        }
      } catch (error: any) {
        console.error("❌ Checkout sync error:", error);
      }
    };

    // Listen for various checkout completion indicators
    const checkForSuccess = () => {
      // Check for success modal/overlay - look for "Success!" text specifically
      const bodyText = document.body.textContent?.toLowerCase() || "";
      const hasSuccessText = bodyText.includes("success") && 
                             (bodyText.includes("subscription is all set") || 
                              bodyText.includes("new subscription") ||
                              bodyText.includes("subscription"));
      
      // Check for "Continue" button which appears after success
      const continueButtons = Array.from(document.querySelectorAll('button, [role="button"]'));
      const hasContinueAfterSuccess = continueButtons.some(btn => {
        const btnText = btn.textContent?.toLowerCase() || "";
        return btnText.includes("continue") && bodyText.includes("success");
      });
      
      if (hasSuccessText || hasContinueAfterSuccess) {
        handleCheckoutSuccess();
        return;
      }

      // Check for URL changes (Clerk might redirect)
      if (window.location.pathname.includes("success") || window.location.search.includes("success")) {
        handleCheckoutSuccess();
        return;
      }
    };

    // Poll for success indicators
    const interval = setInterval(checkForSuccess, 1000);

    // Also listen for custom events or DOM changes
    const observer = new MutationObserver(() => {
      checkForSuccess();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Listen for storage events (Clerk might set sessionStorage)
    const storageListener = (e: StorageEvent) => {
      if (e.key?.includes("clerk") || e.key?.includes("subscription") || e.key?.includes("checkout")) {
        checkForSuccess();
      }
    };
    window.addEventListener("storage", storageListener);

    // Listen for messages from Clerk iframe
    const messageListener = (e: MessageEvent) => {
      if (e.data?.type === "clerk:subscription:success" || 
          e.data?.type === "checkout:success" ||
          e.data?.subscription) {
        handleCheckoutSuccess();
      }
    };
    window.addEventListener("message", messageListener);

    return () => {
      clearInterval(interval);
      observer.disconnect();
      window.removeEventListener("storage", storageListener);
      window.removeEventListener("message", messageListener);
    };
  }, [user, plan, userSynced, router]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push(`/sign-in?redirect_url=/billing/checkout?plan=${plan}`);
      return;
    }

    if (!plan) {
      // Try to get plan from sessionStorage (might be stored from previous visit)
      if (typeof window !== "undefined") {
        const storedPlan = sessionStorage.getItem("pending_plan_sync");
        if (storedPlan && ["business", "featured"].includes(storedPlan)) {
          // Update URL to include plan parameter
          router.replace(`/billing/checkout?plan=${storedPlan}`);
          return;
        }
      }
      
      // If still no plan, redirect to subscriptions page
      console.warn("Plan parameter missing from URL, redirecting to subscriptions");
      router.push("/owner/subscriptions");
      return;
    }

    if (!["basic", "business", "featured"].includes(plan)) {
      setError("Invalid plan selected");
      setLoading(false);
      return;
    }

    // Store plan in sessionStorage immediately when plan is available
    // This ensures it's available for post-purchase sync
    if (typeof window !== "undefined" && plan) {
      sessionStorage.setItem("pending_plan_sync", plan);
      console.log(`[Checkout] Stored plan ${plan} in sessionStorage for post-purchase sync`);
    }

    // Check if user is synced to Convex
    if (currentUser === undefined) {
      // Still loading
      return;
    }

    if (currentUser === null) {
      // User not synced - this will cause webhook to fail
      setError("Your account is not fully set up. Please refresh the page and try again. If the issue persists, please log out and log back in.");
      setLoading(false);
      return;
    }

    setUserSynced(true);
    setLoading(false);
  }, [user, isLoaded, plan, router, currentUser]);

  // Listen for checkout completion and trigger sync immediately
  useEffect(() => {
    if (!user || !plan || !userSynced || checkoutCompleted) return;

    const handleCheckoutSuccess = async () => {
      if (checkoutCompleted) return;
      
      const syncKey = `checkout_sync_${user.id}_${plan}_${Date.now()}`;
      const lastSync = sessionStorage.getItem(`last_checkout_sync_${user.id}`);
      const now = Date.now();
      
      // Prevent duplicate syncs within 5 seconds
      if (lastSync && (now - parseInt(lastSync)) < 5000) {
        console.log("[Checkout] Sync already triggered recently, skipping");
        return;
      }

      console.log(`[Checkout] Detected checkout completion for ${plan} plan, triggering immediate sync...`);
      sessionStorage.setItem(`last_checkout_sync_${user.id}`, now.toString());
      setCheckoutCompleted(true);

      try {
        const response = await fetch("/api/billing/post-purchase-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });

        const data = await response.json();
        if (data.success) {
          console.log("✅ Checkout sync successful, redirecting to subscriptions...");
          // Redirect to subscriptions page after a short delay
          setTimeout(() => {
            router.push("/owner/subscriptions?success=subscription_activated");
          }, 1500);
        } else {
          console.error("❌ Checkout sync failed:", data.error);
          // Still redirect but show error
          setTimeout(() => {
            router.push("/owner/subscriptions?error=sync_failed");
          }, 2000);
        }
      } catch (error: any) {
        console.error("❌ Checkout sync error:", error);
        // Still redirect
        setTimeout(() => {
          router.push("/owner/subscriptions?error=sync_error");
        }, 2000);
      }
    };

    // Method 1: Listen for URL changes (Clerk might redirect)
    const checkUrl = () => {
      if (window.location.pathname.includes("success") || 
          window.location.search.includes("success") ||
          window.location.search.includes("subscription")) {
        handleCheckoutSuccess();
      }
    };

    // Method 2: Poll for success indicators in DOM
    const checkForSuccess = () => {
      // Check for success modal/overlay
      const successSelectors = [
        '[class*="success"]',
        '[class*="Success"]',
        '[class*="checkout-success"]',
        '[class*="subscription-success"]',
        'text*="Success"',
        'text*="success"',
      ];

      for (const selector of successSelectors) {
        try {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent?.toLowerCase() || "";
            if (text.includes("success") || text.includes("subscription") || text.includes("complete")) {
              handleCheckoutSuccess();
              return;
            }
          }
        } catch (e) {
          // Ignore selector errors
        }
      }

      // Check body text for success indicators
      const bodyText = document.body.textContent?.toLowerCase() || "";
      if ((bodyText.includes("success") || bodyText.includes("subscription is all set")) && 
          !bodyText.includes("complete your purchase")) {
        handleCheckoutSuccess();
        return;
      }
    };

    // Check immediately and then poll
    checkUrl();
    checkForSuccess();

    const urlInterval = setInterval(checkUrl, 500);
    const successInterval = setInterval(checkForSuccess, 1000);

    // Method 3: Listen for DOM changes
    const observer = new MutationObserver(() => {
      checkForSuccess();
      checkUrl();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    // Method 4: Listen for storage events (Clerk might set sessionStorage)
    const storageListener = (e: StorageEvent) => {
      if (e.key?.includes("clerk") || e.key?.includes("subscription") || e.key?.includes("checkout")) {
        checkForSuccess();
      }
    };
    window.addEventListener("storage", storageListener);

    // Method 5: Listen for messages from Clerk iframe/popup
    const messageListener = (e: MessageEvent) => {
      const data = e.data;
      if (data?.type === "clerk:subscription:success" || 
          data?.type === "checkout:success" ||
          data?.subscription ||
          data?.event === "subscription.created" ||
          data?.event === "subscription.updated") {
        handleCheckoutSuccess();
      }
    };
    window.addEventListener("message", messageListener);

    // Method 6: Listen for popstate (back/forward navigation)
    const popstateListener = () => {
      checkUrl();
    };
    window.addEventListener("popstate", popstateListener);

    return () => {
      clearInterval(urlInterval);
      clearInterval(successInterval);
      observer.disconnect();
      window.removeEventListener("storage", storageListener);
      window.removeEventListener("message", messageListener);
      window.removeEventListener("popstate", popstateListener);
    };
  }, [user, plan, userSynced, checkoutCompleted, router]);

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/owner/subscriptions">Go Back</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no plan specified, show error message but allow manual sync
  if (!plan || !PLAN_DETAILS[plan]) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Plan Selection Required</CardTitle>
            <CardDescription>
              Please select a plan to continue. If you just completed a purchase, your subscription will be synced automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/owner/subscriptions">Go to Subscriptions</Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={async () => {
                // Try to force sync with featured plan (most common)
                try {
                  const response = await fetch("/api/billing/force-sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan: "featured", status: "active" }),
                  });
                  const data = await response.json();
                  if (data.success) {
                    alert("Subscription synced! Redirecting...");
                    window.location.href = "/owner/subscriptions";
                  } else {
                    alert(`Sync failed: ${data.error}`);
                  }
                } catch (err: any) {
                  alert(`Error: ${err.message}`);
                }
              }}
            >
              Sync My Subscription
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planDetails = PLAN_DETAILS[plan];
  const Icon = planDetails.icon;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/owner/subscriptions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subscriptions
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Complete Your Purchase</h1>
          <p className="text-muted-foreground">
            Review your selected plan and complete payment
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selected Plan Card */}
          <div className="lg:col-span-1">
            <Card className={`border-2 ${planDetails.borderColor} ${planDetails.bgColor}`}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`w-6 h-6 ${planDetails.color}`} />
                  <CardTitle className="text-xl">{planDetails.name}</CardTitle>
                </div>
                <CardDescription>
                  {plan === "basic"
                    ? "Free plan for all verified club owners"
                    : plan === "business" 
                    ? "Essential features for growing your club"
                    : "Maximum visibility and premium features"}
                </CardDescription>
                <div className="mt-4">
                  {planDetails.originalPrice && (
                    <span className="text-xs line-through text-muted-foreground">
                      {planDetails.originalPrice}
                    </span>
                  )}
                  <div>
                    <span className={`text-3xl font-bold ${planDetails.color}`}>
                      {planDetails.price}
                    </span>
                    {plan !== "basic" && <span className="text-muted-foreground">/month</span>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {planDetails.features.map((feature, idx) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div key={idx} className="flex items-start gap-2">
                        <FeatureIcon className={`w-4 h-4 ${planDetails.color} mt-0.5`} />
                        <span>{feature.text}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    {plan === "basic" 
                      ? "Your current plan will remain active until the end of the billing period, then switch to Basic."
                      : "This subscription will apply to your account and all clubs you own or claim."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>
                  Your subscription will renew automatically each month. You can cancel anytime.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Clerk PricingTable - configured to show only the selected plan */}
                  {/* Configure redirect URLs to preserve plan parameter */}
                  {userSynced ? (
                    <div className="min-h-[400px] relative" id="pricing-table-container">
                      <PricingTable 
                        appearance={{
                          elements: {
                            rootBox: "w-full"
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="min-h-[400px] flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">Setting up payment...</p>
                      </div>
                    </div>
                  )}
                  {/* Hide other plans using PlanFilter component */}
                  {plan === "business" || plan === "featured" ? (
                    <PlanFilter plan={plan} />
                  ) : null}
                  
                  {/* Upgrade to Featured button if on Business plan */}
                  {plan === "business" && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        asChild
                      >
                        <Link href="/billing/checkout?plan=featured">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Upgrade to Featured Plan
                        </Link>
                      </Button>
                    </div>
                  )}
                  
                  {/* CSS to ensure subscribe button stays behind Clerk's drawer */}
                  <style jsx global>{`
                    .cl-pricingTableCardFooterButton,
                    button[class*="pricingTableCardFooterButton"],
                    button[data-localization-key="billing.subscribe"] {
                      z-index: 1 !important;
                      position: relative;
                    }
                    /* Clerk drawer should be above everything */
                    .cl-drawer,
                    [class*="cl-drawer"],
                    [class*="cl-modal"] {
                      z-index: 1000 !important;
                    }
                  `}</style>

                  {!userSynced && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> Please ensure you have logged into the application at least once before purchasing. 
                        This syncs your account and allows the payment to process correctly.
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
                    <p>• Your subscription will start immediately after payment</p>
                    <p>• You can cancel or change your plan at any time</p>
                    <p>• All payments are processed securely through Clerk</p>
                    <p>• If payment fails, check your card details and try again</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillingCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <BillingCheckoutPageContent />
    </Suspense>
  );
}
