import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ChiTrack vs. Transit Stop: The Simple, Beautiful CTA Tracker Built for You',
  description: 'Discover why Chicago commuters prefer ChiTrack over Transit Stop for its intuitive design, speed, and user-focused features like uni-directional stop tracking.',
  keywords: ['ChiTrack', 'Transit Stop', 'CTA tracker', 'Chicago transit', 'train tracker', 'bus tracker', 'Ventra', 'CTA comparison', 'best transit app Chicago'],
};

export default function ChiTrackVsTransitStopPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md dark:bg-black/80 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-sm font-medium text-gray-700 hover:text-black transition-colors dark:text-gray-300 dark:hover:text-white">
            &larr; ChiTrack Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <article className="prose prose-lg prose-gray dark:prose-invert">
          <h1 className="mb-6 !text-4xl font-bold text-black dark:text-white">
            ChiTrack vs. Transit Stop: The Simple, Beautiful CTA Tracker Built for You
          </h1>

          <p className="lead !text-lg !text-gray-600 dark:!text-gray-400 !mb-8">
            Tired of clunky transit apps that feel like they were designed in the dark ages? Discover why Chicago commuters are switching to ChiTrack for a refreshingly intuitive and beautiful way to track CTA trains and buses.
          </p>

          <div className="flex justify-center my-8">
            <Link href="https://apps.apple.com/us/app/chitrack/id6478848938" target="_blank" rel="noopener noreferrer" aria-label="Download ChiTrack on the App Store">
              <Image
                src="/app-store-badge.svg"
                alt="Download on the App Store"
                width={180}
                height={60}
                priority
              />
            </Link>
          </div>

          <h2 className="mt-12 mb-4 !text-2xl font-semibold text-gray-900 dark:text-gray-100">
            The Problem with Most Transit Apps (Like Transit Stop?)
          </h2>
          <p className="my-4 text-gray-700 dark:text-gray-300">
            Let's be honest, many transit tracking apps feel overwhelming. You're rushing out the door, and you're met with cluttered interfaces, confusing menus, and endless taps just to see when the next train arrives. Apps like "Transit Stop" often fall into this trap, focusing on packing in features without considering the actual user experience. This leads to frustration:
          </p>
          <ul className="my-6 space-y-3">
            <li>Too many taps to get the information you need *right now*.</li>
            <li>Messy alerts that aren't relevant to your specific direction.</li>
            <li>Having to re-select your entire route just to change direction.</li>
            <li>Interfaces that feel dated and unintuitive.</li>
          </ul>
          <p className="my-4 text-gray-700 dark:text-gray-300">Sound familiar? You deserve better.</p>

          <h2 className="mt-10 mb-4 !text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Introducing ChiTrack: Designed Around *You*
          </h2>
          <p className="my-4 text-gray-700 dark:text-gray-300">
            ChiTrack was built from the ground up with one person in mind: you, the daily Chicago commuter. We focused relentlessly on creating an app that is not just functional, but genuinely enjoyable to use.
          </p>
          <p className="my-4 text-gray-700 dark:text-gray-300">
            Our philosophy is simple:
          </p>
          <ul className="my-6 space-y-3">
            <li><strong>Simplicity First:</strong> Get the real-time arrival info you need with minimal taps. No clutter, no confusion.</li>
            <li><strong>Intuitive Flow:</strong> Navigate the app effortlessly. Finding stations, saving favorites, and checking times feels natural.</li>
            <li><strong>Beautiful Design:</strong> A clean, modern, minimalistic aesthetic that looks great on your phone and respects your focus.</li>
          </ul>
          <p className="my-4 text-gray-700 dark:text-gray-300">
            We listened to the pain points of Chicagoans – the young professionals, the students, the everyday riders – and built features that directly address them, like quickly accessing your home stop, easily searching any route, and saving your favorites.
          </p>

          <h2 className="mt-10 mb-4 !text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Key Differences You'll Love Immediately
          </h2>
          <p className="my-4 text-gray-700 dark:text-gray-300">
            When you compare ChiTrack to Transit Stop or other standard trackers, the difference is clear:
          </p>
          <ol className="my-6 space-y-3">
            <li>
              <strong>Unmatched Simplicity & Speed:</strong> ChiTrack prioritizes getting you accurate, real-time CTA arrival times instantly. The interface is clean, uncluttered, and requires fewer interactions to see what matters. Contrast this with the often dense and multi-step processes in other apps.
            </li>
            <li>
              <strong>Elegant & Modern Interface:</strong> We believe your tools should be beautiful. ChiTrack features a sleek, modern design that feels premium and is a pleasure to interact with, unlike the often utilitarian or dated look of competitors.
            </li>
            <li>
              <strong>Uni-Directional Stop Info (A ChiTrack Exclusive!):</strong> This is a game-changer. Ever selected a station only to be shown times for trains going in *both* directions? It's confusing! ChiTrack allows you to intuitively select your specific stop *and* direction (e.g., "Red Line towards Howard" or "Red Line towards 95th/Dan Ryan"). No more guesswork. To our knowledge, no other CTA app does this as seamlessly. It means you only see the arrival times relevant to *your* journey.
            </li>
            <li>
              <strong>Built for How *You* Commute:</strong> From setting a 'Home Stop' for one-tap access to easily favoriting your common routes (with direction!), ChiTrack adapts to your routine, not the other way around.
            </li>
          </ol>

          <h2 className="mt-10 mb-4 !text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Stop Fighting Your Transit App. Start Loving It.
          </h2>
          <p className="my-4 text-gray-700 dark:text-gray-300">
            Your commute shouldn't start with a frustrating app experience. ChiTrack provides the fast, reliable, and accurate CTA tracking you need, wrapped in a simple, beautiful, and intuitive package. It's the transit tracker designed specifically for the Chicago commuter who values their time and appreciates good design.
          </p>
          <p className="my-4 text-gray-700 dark:text-gray-300">
            Ready to upgrade your commute?
          </p>

          <div className="mt-8 mb-6 flex justify-center">
            <Link
              href="https://apps.apple.com/app/chitrack-chicago-l-tracker/id6745131685"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 dark:text-black dark:bg-white dark:hover:bg-gray-200 transition-colors"
            >
              Download ChiTrack on the App Store
            </Link>
          </div>
        </article>
      </main>

      {/* Basic Footer Placeholder - Consider adding a shared footer component later */}
      <footer className="max-w-3xl mx-auto p-6 md:p-8 lg:p-10 mt-12 border-t border-gray-200 dark:border-gray-700">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} ChiTrack. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
