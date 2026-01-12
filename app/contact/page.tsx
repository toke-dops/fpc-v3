import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <h1 className="text-3xl font-black text-slate-900 mb-4">Contact Us</h1>
              <CardDescription>
                Have a question or feedback? We'd love to hear from you!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Send us an email</h2>
                <p className="text-muted-foreground mb-6">
                  Please send your inquiry, feedback, or questions directly to our email address:
                </p>
                <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-6 mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Email us at:</p>
                  <a 
                    href="mailto:findpadelclubs@gmail.com"
                    className="text-2xl font-bold text-primary hover:underline inline-flex items-center gap-2"
                  >
                    <Mail className="w-6 h-6" />
                    findpadelclubs@gmail.com
                  </a>
                </div>
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <a href="mailto:findpadelclubs@gmail.com">
                    <Mail className="w-4 h-4 mr-2" />
                    Open Email Client
                  </a>
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold mb-4">What to Include</h3>
                <div className="space-y-2 text-muted-foreground text-sm">
                  <p>
                    When contacting us, please include:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your name and contact information</li>
                    <li>The subject of your inquiry</li>
                    <li>Any relevant details about your question or request</li>
                  </ul>
                  <p className="mt-4">
                    <strong>For club owners:</strong> If you need help with your club listing or subscription, please include your club name and email in your message.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
