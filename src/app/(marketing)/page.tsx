// src/app/(marketing)/page.tsx
import { Hero } from "@/components/marketing/hero";
import { Card } from "@/components/ui/card";
import { BlogLinks } from "@/components/marketing/blogLinks";
import { 
  Clock, 
  StarIcon, 
  MapPin, 
  RefreshCw,
  CheckCircle2,
  HelpCircle
} from "lucide-react";

// Features section showing key benefits
const Features = () => (
  <section className="w-full bg-muted/50 py-20">
    <div className="container mx-auto px-4">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold">Why Professionals Choose ChiTrack</h2>
        <p className="text-muted-foreground">
          The best CTA Train Tracking App in the City of Chicago
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {[
          {
            icon: Clock,
            title: "Zero-tap access",
            description:
              "See your home stop arrival times instantly. No more navigating through menus.",
          },
          {
            icon: StarIcon,
            title: "Save favorite stops",
            description:
              "Quick access to your most-used stations for seamless daily commutes.",
          },
          {
            icon: MapPin,
            title: "Quickly find new stations",
            description:
              "Use the slickest map ever made to view stations outside your normal route.",
          },
          {
            icon: RefreshCw,
            title: "Real-time updates",
            description:
              "Live arrival times (unlike Apple/Google Maps) that refresh automatically every 30 seconds.",
          },
          {
            icon: CheckCircle2,
            title: "Clean interface",
            description:
              "Modern, uncluttered design that puts the information you need front and center.",
          },
          {
            icon: HelpCircle,
            title: "Clear alerts",
            description:
              "Service updates in plain English, right when you need them.",
          },
        ].map((feature, i) => (
          <Card key={i} className="p-6">
            <feature.icon className="mb-4 h-6 w-6 text-primary" />
            <h3 className="mb-2 font-semibold">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// Problem & Solution section
const ProblemSolution = () => (
  <section className="w-full py-20">
    <div className="container mx-auto px-4">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="mb-6 text-3xl font-bold">The Problem</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Current transit apps are clunky and slow, making it frustrating to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                • Navigate through multiple menus just to check arrival times
              </li>
              <li className="flex items-center gap-2">
                • Decipher confusing service alerts
              </li>
              <li className="flex items-center gap-2">
                • Switch between different stations quickly
              </li>
            </ul>
          </div>
        </div>

        <div>
          <h2 className="mb-6 text-3xl font-bold">The Solution</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              ChiTrack reimagines the transit experience with:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                • Zero-tap access to your most frequently used stations
              </li>
              <li className="flex items-center gap-2">
                • Clean, professional interface that respects your time and sanity
              </li>
              <li className="flex items-center gap-2">
                • Smart features that make sense for your daily routine
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// FAQ section with schema markup
const FAQ = () => {
  const faqs = [
    {
      question: "How accurate are the train arrival times?",
      answer:
        "ChiTrack uses official CTA data so it is more accurate than using Apple/Google Maps. Arrival predictions are typically accurate within ±1 minute and are updated every 30 seconds."
    },
    {
      question: "Does ChiTrack work for all CTA train lines?",
      answer:
        "Yes, ChiTrack supports all CTA train lines including Red, Blue, Brown, Green, Orange, Purple, Pink, and Yellow lines."
    },
    {
      question: "Is this the official Ventra transit app?",
      answer:
        "No, ChiTrack is the transit app Ventra could never ship - designed with a focus on speed, simplicity, and user experience that the official app lacks."
    },
    {
      question: "How much does ChiTrack cost?",
      answer:
        "ChiTrack is completely free to use while in beta. There are no subscriptions, trials, or hidden fees."
    },
    {
      question: "I commute on the CTA train daily. Why is ChiTrack better than other CTA-specific apps?",
      answer:
        "ChiTrack is designed for you. It's the simplest, fastest, and most modern CTA tracking app. We cut the clutter so you get your train times quickly and intuitively, making your daily commute smoother."
    },
    {
      question: "Why should I use ChiTrack instead of Google or Apple Maps for train times?",
      answer:
        "Accuracy. ChiTrack uses the official CTA data feed, giving you real-time arrival information that's more reliable than general map apps. If you need to know exactly when your train is coming, ChiTrack is the way to go."
    },
    {
      question: "What's so special about selecting a direction, like 'Belmont towards the Loop'?",
      answer:
        "It saves you time and hassle. You only care about your train, in your direction. ChiTrack lets you save exactly that, so you don't have to sift through times for trains going the other way. This, combined with setting a home/favorite stop means arrival times are on your screen instantly – zero clicks needed!"
    },
    {
      question: "Okay, zero clicks for my usual commute is great. What if I'm going somewhere else?",
      answer:
        "ChiTrack makes that easy too. Quickly search for any CTA station and you'll see all upcoming arrivals for every line and direction at that station. It's just as straightforward for new trips as it is for your daily routine."
    },
    {
      question: "Can I see bus arrivals on ChiTrack?",
      answer:
        "Currently, ChiTrack focuses on providing the best train tracking experience. Bus tracking will be added in a future update."
    }
  ];

  // Schema markup for FAQs
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section className="w-full bg-muted/50 py-20">
      <div className="container mx-auto px-4">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        
        <h2 className="mb-12 text-center text-3xl font-bold">
          Frequently Asked Questions
        </h2>

        <div className="mx-auto max-w-3xl space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="space-y-2">
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Main landing page component
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <ProblemSolution />
      <FAQ />
      <BlogLinks />
    </>
  );
}