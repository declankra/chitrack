// src/components/marketing/hero.tsx
"use client";

import { Button } from "@/components/ui/button";
import { IPhoneFrame } from "@/components/marketing/iphone";
import { Users, TrainFront, ArrowRight } from "lucide-react";
import { useState } from "react";
import { RequestAccessDialog } from "@/components/marketing/RequestAccessDialog";
import Link from "next/link";
import { motion } from "framer-motion";
import { TextShimmer } from "@/components/ui/text-shimmer";

// Hero section component
export function Hero() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <section className="relative w-full overflow-hidden bg-background pb-20 pt-10 md:pt-0">
      <div className="container relative z-10 mx-auto px-4">
        <div className="grid gap-12 md:grid-cols-2 md:gap-20 md:pt-20">
          {/* Text content */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-6">
              <div className="relative">
                <h2 className="text-sm font-medium tracking-wider text-secondary uppercase">
                  Chicago Transit Tracking Done Right
                </h2>
                <TextShimmer 
                  as="h2" 
                  className="text-sm font-medium tracking-wider uppercase absolute top-0 left-0 opacity-70"
                  duration={4}
                  spread={0.5}
                >
                  Chicago Transit Tracking Done Right
                </TextShimmer>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                The Chicago CTA Tracker Ventra Couldn't Give You
              </h1>
              <p className="text-xl text-muted-foreground">
                Save time and travel in style with real-time CTA arrivals, beautifully designed for Chicago professionals
              </p>
            </div>
            
            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Trusted by 1,000+ Chicago commuters (soon)
              </p>
            </div>

            {/* Request Access Button */}
            <Button 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={() => setIsDialogOpen(true)}
            >
              Request Access
            </Button>
            
            {/* Request Access Dialog */}
            <RequestAccessDialog 
              isOpen={isDialogOpen} 
              onClose={() => setIsDialogOpen(false)} 
            />
          </div>

          {/* iPhone mockup */}
          <div className="relative mx-auto w-full max-w-[280px] md:max-w-none">
            {/* Announcement pill */}
            <div className="absolute -top-14 left-0 right-0 flex justify-center w-full">
              <Link href="/home">
                <motion.div 
                  className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-black/90 transition-colors"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <TrainFront className="h-4 w-4" />
                  </motion.div>
                  Try web demo!
                  <ArrowRight className="h-4 w-4" />
                </motion.div>
              </Link>
            </div>
            
            <IPhoneFrame 
              className="w-full"
              image="/app-preview.webp" 
              imageAlt="ChiTrack app showing train arrivals"
            >
              {/* Fallback content if image doesn't load */}
              <div className="flex h-full w-full flex-col bg-black">
                <div className="flex-1 p-4">
                  {/* Sample app content - this would be replaced with actual app screenshots */}
                  <div className="mb-4 rounded-lg bg-zinc-800 p-3">
                    <div className="h-4 w-24 rounded bg-red-500 mb-2"></div>
                    <div className="h-3 w-32 rounded bg-zinc-600"></div>
                    <div className="mt-2 h-3 w-20 rounded bg-zinc-600"></div>
                  </div>
                  <div className="rounded-lg bg-zinc-800 p-3">
                    <div className="h-4 w-24 rounded bg-blue-500 mb-2"></div>
                    <div className="h-3 w-32 rounded bg-zinc-600"></div>
                    <div className="mt-2 h-3 w-20 rounded bg-zinc-600"></div>
                  </div>
                </div>
                {/* Bottom navigation */}
                <div className="h-16 border-t border-zinc-800 flex justify-around items-center px-6">
                  <div className="h-2 w-10 rounded-full bg-zinc-700"></div>
                  <div className="h-2 w-10 rounded-full bg-zinc-700"></div>
                  <div className="h-2 w-10 rounded-full bg-zinc-700"></div>
                </div>
              </div>
            </IPhoneFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
