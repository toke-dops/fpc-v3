import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-lg">
                P
              </div>
              <span className="font-bold text-xl text-foreground">
                UK Padel<span className="text-primary">Finder</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm">
              The UK&apos;s most comprehensive padel club directory. Find courts, 
              book sessions, and discover the fastest-growing racket sport.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-foreground mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/clubs"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Find Clubs
                </Link>
              </li>
              <li>
                <Link
                  href="/city/london"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  London Clubs
                </Link>
              </li>
              <li>
                <Link
                  href="/city/manchester"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Manchester Clubs
                </Link>
              </li>
              <li>
                <Link
                  href="/city/birmingham"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Birmingham Clubs
                </Link>
              </li>
            </ul>
          </div>

          {/* For Clubs */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-foreground mb-4">
              For Clubs
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/clubs"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Claim Your Listing
                </Link>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Advertise with Us
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Partner Programme
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} UK PadelFinder. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

