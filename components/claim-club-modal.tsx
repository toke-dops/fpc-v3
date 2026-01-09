"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { X, Send, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import type { Id } from "@/convex/_generated/dataModel";

interface ClaimClubModalProps {
  clubId: Id<"clubs">;
  clubName: string;
  clubCity?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClaimClubModal({
  clubId,
  clubName,
  clubCity,
  isOpen,
  onClose,
}: ClaimClubModalProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    claimant_name: "",
    claimant_email: "",
    claimant_role: "",
    message: "",
  });

  const submitClubClaim = useMutation(api.submissions.submitClubClaim);

  // Pre-fill form with user data if authenticated
  useEffect(() => {
    if (isLoaded && user && currentUser && isOpen) {
      setFormData({
        claimant_name: user.fullName || user.firstName || "",
        claimant_email: user.primaryEmailAddress?.emailAddress || "",
        claimant_role: "",
        message: "",
      });
    }
  }, [isLoaded, user, currentUser, isOpen]);

  // Check authentication when modal opens
  useEffect(() => {
    if (isOpen && isLoaded && !user) {
      // User not authenticated - close modal and redirect to sign in
      onClose();
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/sign-in?redirect_url=${returnUrl}`);
    }
  }, [isOpen, isLoaded, user, router, onClose]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Temporarily exclude club_city_snapshot until Convex syncs
      // TODO: Re-enable after Convex syncs the updated mutation
      await submitClubClaim({
        club_id: clubId,
        club_name_snapshot: clubName,
        // club_city_snapshot: clubCity || undefined, // Will be added back after Convex syncs
        claimant_name: formData.claimant_name,
        claimant_email: formData.claimant_email,
        claimant_role: formData.claimant_role,
        message: formData.message,
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit claim. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubmitted(false);
      setError(null);
      setFormData({
        claimant_name: "",
        claimant_email: "",
        claimant_role: "",
        message: "",
      });
      onClose();
    }
  };

  // Don't render if not authenticated
  if (!isOpen || !isLoaded) return null;
  
  if (!user) {
    // This shouldn't happen due to useEffect redirect, but just in case
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Thank You!
            </h2>
            <p className="text-muted-foreground mb-6">
              Thanks for your claim submission. We&apos;ll review your request and
              get back to you soon.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-slate-900">
                Claim {clubName}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="claimant_name" className="mb-2 block">
                  Your Name *
                </Label>
                <Input
                  id="claimant_name"
                  required
                  placeholder="John Doe"
                  value={formData.claimant_name}
                  onChange={(e) =>
                    setFormData({ ...formData, claimant_name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="claimant_email" className="mb-2 block">
                  Your Email *
                </Label>
                <Input
                  id="claimant_email"
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={formData.claimant_email}
                  readOnly
                  disabled
                  className="opacity-75 cursor-not-allowed bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This email is taken from your account and cannot be changed.
                </p>
              </div>

              <div>
                <Label htmlFor="claimant_role" className="mb-2 block">
                  Your Role *
                </Label>
                <Select
                  value={formData.claimant_role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, claimant_role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff Member</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message" className="mb-2 block">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  required
                  rows={4}
                  placeholder="Tell us why you're claiming this club and how we can verify your ownership..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      Submit Claim
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                We&apos;ll review your claim and verify your ownership before
                approving. This helps us maintain accurate club information.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

