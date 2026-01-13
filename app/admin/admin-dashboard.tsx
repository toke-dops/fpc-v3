"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Loader2, Mail, Building2, ShieldCheck, ArrowRight, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function AdminDashboard() {
  const router = useRouter();
  const { signOut } = useClerk();
  const submissions = useQuery(api.submissions.getSubmissions, { limit: 50 });
  const claims = useQuery(api.submissions.getClaims, { status: "new", limit: 50 });

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const isLoading = submissions === undefined || claims === undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Review club submissions and claims
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/users">
                  Users
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/analytics">
                  Analytics
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/claims">
                  Review Claims
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Club Submissions */}
            <div className="bg-white rounded-2xl border shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Club Submissions
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {submissions?.length ?? 0} total submissions
                </p>
              </div>

              <div className="divide-y max-h-[600px] overflow-y-auto">
                {submissions && submissions.length > 0 ? (
                  submissions.map((submission) => (
                    <div key={submission._id} className="p-6 hover:bg-slate-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 mb-1">
                            {submission.club_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {submission.city}
                          </p>
                        </div>
                        <Badge
                          variant={
                            submission.status === "approved"
                              ? "default"
                              : submission.status === "reviewed"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {submission.status}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {submission.email}
                          </span>
                        </div>
                        {submission.phone && (
                          <div className="text-muted-foreground">
                            📞 {submission.phone}
                          </div>
                        )}
                        {submission.website && (
                          <div className="text-muted-foreground">
                            🌐{" "}
                            <a
                              href={submission.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {submission.website}
                            </a>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-slate-700 mb-2">
                        {submission.message}
                      </p>

                      <div className="text-xs text-muted-foreground">
                        {new Date(submission.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>

                      {submission.notes && (
                        <div className="mt-2 p-2 bg-slate-100 rounded text-xs text-slate-600">
                          <strong>Notes:</strong> {submission.notes}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No submissions yet
                  </div>
                )}
              </div>
            </div>

            {/* Club Claims */}
            <div className="bg-white rounded-2xl border shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-slate-900">
                      Club Claims
                    </h2>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/claims">
                      Review Claims
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {claims?.filter((c: any) => c.status === "new").length ?? 0} pending,{" "}
                  {claims?.length ?? 0} total claims
                </p>
              </div>

              <div className="divide-y max-h-[600px] overflow-y-auto">
                {claims && claims.length > 0 ? (
                  claims.map((claim: any) => (
                    <div key={claim._id} className="p-6 hover:bg-slate-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 mb-1">
                            {claim.club_name_snapshot}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Claimed by {claim.claimant_name}
                          </p>
                        </div>
                        <Badge
                          variant={
                            claim.status === "approved"
                              ? "default"
                              : claim.status === "rejected"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {claim.status}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {claim.claimant_email}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          Role: <span className="font-medium">{claim.claimant_role}</span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-700 mb-2">
                        {claim.message}
                      </p>

                      <div className="text-xs text-muted-foreground">
                        {new Date(claim.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>

                      {claim.notes && (
                        <div className="mt-2 p-2 bg-slate-100 rounded text-xs text-slate-600">
                          <strong>Notes:</strong> {claim.notes}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No claims yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
