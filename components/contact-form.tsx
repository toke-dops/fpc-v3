"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Mail, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import type { Id } from "@/convex/_generated/dataModel";

interface ContactFormProps {
  clubId: Id<"clubs">;
  clubName: string;
}

export function ContactForm({ clubId, clubName }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const submitLead = useMutation(api.leads.submit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitLead({
        club_id: clubId,
        name: formData.name,
        email: formData.email,
        message: formData.message,
      });
      setSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Failed to submit lead:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-12 text-center bg-primary/5 rounded-2xl border border-primary/10">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-primary shadow-sm">
          <Send className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
        <p className="text-slate-600 px-8">
          Thanks for your interest in {clubName}. They will get back to you
          shortly via email.
        </p>
        <Button
          variant="link"
          className="mt-4"
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Enquire Now
          </h2>
          <p className="text-muted-foreground text-sm">
            Have a question? Send a message to the club.
          </p>
        </div>
        <Mail className="w-8 h-8 text-primary/20" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="mb-2 block">
              Your Name
            </Label>
            <Input
              id="name"
              required
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="email" className="mb-2 block">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <Label htmlFor="message" className="mb-2 block">
            Message
          </Label>
          <Textarea
            id="message"
            required
            placeholder="Tell us what you're looking for..."
            rows={4}
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
          />
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            "Sending..."
          ) : (
            <>
              Send Inquiry
              <Send className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

