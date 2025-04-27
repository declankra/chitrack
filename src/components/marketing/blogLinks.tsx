import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Placeholder data for blog articles
const articles = [
  {
    title: "How to Get Real-Time CTA Alerts",
    description: "Learn how to get instant, real-time CTA train alerts for your Chicago commute using the ChiTrack app.",
    slug: "/blog/real-time-cta-alerts",
  },
  {
    title: "Guide to Using Ventra with CTA",
    description: "Understand how Ventra works with CTA trains and buses, and how ChiTrack simplifies your commute.",
    slug: "/blog/guide-to-using-ventra-with-cta",
  },
  {
    title: "ChiTrack vs. Transit Stop",
    description: "Why Chicago commuters prefer ChiTrack's simple, beautiful, and intuitive design over other transit apps.",
    slug: "/blog/chitrack-vs-transit-stop",
  },
  {
    title: "Chicago L Tracker vs. Google Maps – Key Differences",
    description: "Discover why ChiTrack offers more accurate real-time CTA L train tracking compared to Google Maps.",
    slug: "/blog/chicago-l-tracker-vs-google-maps",
  },
  // Removed other placeholder articles for brevity/focus
  // {
  //   title: "Automate your accounts payable",
  //   description: "Discover how automation can save time and reduce errors in your AP process.",
  //   slug: "/blog/automate-accounts-payable",
  // },
  // {
  //   title: "Tips for managing cash flow",
  //   description: "Effective strategies for small businesses to maintain healthy cash flow.",
  //   slug: "/blog/managing-cash-flow",
  // },
  // {
  //   title: "Understanding trade finance",
  //   description: "A beginner's guide to the complex world of trade finance options.",
  //   slug: "/blog/understanding-trade-finance",
  // },
];

export const BlogLinks = () => {
  return (
    <section className="w-full py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Latest ChiTrack CTA News</h2>
          <Button variant="ghost" asChild>
            <Link href="/blog">
              View all articles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {articles.map((article, index) => (
            <Link key={index} href={article.slug} passHref>
              <Card className="flex h-full flex-col overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md">
                {/* Removed image placeholder */}
                <CardHeader>
                  <CardTitle className="text-lg font-semibold leading-tight">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    {article.description}
                  </p>
                </CardContent>
                {/* Optional: Add a read more link if needed later
                <CardFooter>
                  <Button variant="link" asChild className="p-0 h-auto">
                    <Link href={article.slug}>
                      Read more <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
                */}
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
