import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BlogLinks } from "@/components/marketing/blogLinks";
import { Mail, Home, ExternalLink } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6 text-center">Support</h1>
      
      <Card className="mb-12">
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                Have questions, feedback, or need assistance with ChiTrack? We're here to help!
              </p>
              
              <div className="flex items-center mt-4">
                <Mail className="h-5 w-5 mr-2 text-primary" />
                <a 
                  href="mailto:business@dkbuilds.co" 
                  className="text-primary hover:underline flex items-center"
                >
                  business@dkbuilds.co
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h2 className="text-2xl font-semibold mb-3">Download ChiTrack</h2>
              <p className="text-muted-foreground mb-4">
                Get the latest version of ChiTrack for the best Chicago transit tracking experience.
              </p>
              
              <Link 
                href="https://apps.apple.com/us/app/chitrack-ventra-cta-tracker/id6745131685" 
                target="_blank" 
                className="inline-block"
                aria-label="Download ChiTrack on the App Store"
              >
                <Image 
                  src="/app-store-badge.svg" 
                  alt="Download on the App Store" 
                  width={200}
                  height={67}
                />
              </Link>
            </div>
            
            <div className="pt-4 border-t">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <BlogLinks />
    </div>
  );
}
