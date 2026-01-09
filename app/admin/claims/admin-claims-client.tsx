"use client";

import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  MapPin,
  User,
  Mail,
  MessageSquare,
  Calendar,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function AdminClaimsClient() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [processingClaim, setProcessingClaim] = useState<string | null>(null);

  const claims = useQuery(api.submissions.getClaims, {
    status: "new",
    limit: 100,
  });

  const approveClaim = useMutation(api.submissions.approveClaim);
  const rejectClaim = useMutation(api.submissions.rejectClaim);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const handleApprove = async (claimId: string) => {
    setProcessingClaim(claimId);
    try {
      await approveClaim({ claimId: claimId as any });
    } catch (error: any) {
      alert(error.message || "Failed to approve claim");
    } finally {
      setProcessingClaim(null);
    }
  };

  const handleReject = async (claimId: string, notes?: string) => {
    setProcessingClaim(claimId);
    try {
      await rejectClaim({
        claimId: claimId as any,
        notes: notes?.trim() || undefined,
      });
      setRejectNote({ ...rejectNote, [claimId]: "" });
    } catch (error: any) {
      alert(error.message || "Failed to reject claim");
    } finally {
      setProcessingClaim(null);
    }
  };

  if (claims === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              Review Club Claims
            </h1>
            <p className="text-muted-foreground">
              Approve or reject club ownership claims
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {claims.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending claims</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {claims.map((claim: any) => (
              <Card key={claim._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {claim.club_name_snapshot}
                      </CardTitle>
                      <CardDescription>
                        {claim.club?.city && (
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-4 h-4" />
                            {claim.club.city}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{claim.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Claimant
                      </Label>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{claim.claimant_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{claim.claimant_email}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Role: <span className="font-medium">{claim.claimant_role}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Submitted
                      </Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(claim.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </Label>
                    <p className="text-sm bg-slate-50 p-3 rounded-lg">
                      {claim.message}
                    </p>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <Label htmlFor={`reject-note-${claim._id}`} className="text-sm">
                      Rejection Note (optional)
                    </Label>
                    <Textarea
                      id={`reject-note-${claim._id}`}
                      placeholder="Add a note explaining why this claim was rejected..."
                      value={rejectNote[claim._id] || ""}
                      onChange={(e) =>
                        setRejectNote({ ...rejectNote, [claim._id]: e.target.value })
                      }
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(claim._id)}
                        disabled={processingClaim === claim._id}
                        className="flex-1"
                      >
                        {processingClaim === claim._id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() =>
                          handleReject(claim._id, rejectNote[claim._id])
                        }
                        variant="destructive"
                        disabled={processingClaim === claim._id}
                        className="flex-1"
                      >
                        {processingClaim === claim._id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

