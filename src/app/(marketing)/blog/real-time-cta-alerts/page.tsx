//src/app/(marketing)/blog/real-time-cta-alerts/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'How to Get Real-Time CTA Alerts | ChiTrack Chicago Transit Tracker',
  description:
    'Learn how to get instant, real-time CTA train alerts for your Chicago commute using the ChiTrack app. Stay updated and avoid delays.',
  keywords: [
    'real-time cta alerts',
    'cta alerts',
    'cta train tracker',
    'chicago transit tracker',
    'cta tracking',
    'chitrack app',
    'chicago l tracker',
    'cta updates',
    'ventra',
  ],
};

export default function RealTimeCtaAlertsPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <Link
          href="/"
          className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
        >
          ChiTrack Home
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <article className="prose prose-lg prose-gray max-w-none">
          <h1 className="mb-6 !text-4xl font-bold text-black">How to Get Real-Time CTA Alerts for Chicago Trains</h1>

          <p className="lead text-lg text-gray-600 mb-8">
            Tired of guessing when your next CTA train will arrive?
            Missed connections and unexpected delays can disrupt your day. Get
            ahead of your Chicago commute with instant, reliable, real-time CTA
            alerts using the ChiTrack app.
          </p>
          <div className="flex justify-center mb-8">
            <Link href="https://apps.apple.com/app/chitrack-chicago-l-tracker/id6745131685" className="inline-block">
              <Image
                src="/app-store-badge.svg"
                alt="Download ChiTrack on the App Store"
                width={180}
                height={60}
                priority
              />
            </Link>
          </div>

          <h2 className="mt-12 mb-4 !text-2xl font-semibold text-gray-900">Why Real-Time CTA Information Matters</h2>
          <p className="my-4 text-gray-700">
            Navigating Chicago's extensive public transit system requires timely
            information. Knowing exactly when your 'L' train is coming
            isn't just convenient – it's essential for efficient travel.
            Traditional schedules can become outdated due to unforeseen issues.
            A reliable{' '}
            <strong>CTA train tracker</strong> provides the up-to-the-minute data you
            need.
          </p>

          <h2 className="mt-10 mb-4 !text-2xl font-semibold text-gray-900">Using ChiTrack for Instant CTA Updates</h2>
          <p className="my-4 text-gray-700">
            ChiTrack is designed specifically for Chicago commuters, offering a
            clean, fast interface to access live{' '}
            <strong>CTA tracking</strong> data. Think of it as your personal{' '}
            <strong>Chicago transit tracker</strong>, putting{' '}
            <strong>real-time CTA alerts</strong> right in your pocket.
          </p>
          <p className="my-4 text-gray-700">Here's how ChiTrack helps you stay informed:</p>
          <ul className="my-6 space-y-3">
            <li>
              <strong>Live Arrival Times:</strong> See accurate, real-time
              arrival predictions for nearby CTA train stations.
              No more relying on static schedules.
            </li>
            <li>
              <strong>Simple Interface:</strong> Get the information you need
              quickly with a minimalistic design focused on clarity and speed.
            </li>
            <li>
              <strong>Covers All CTA Train Lines:</strong> Track 'L' trains
              seamlessly within one app.
            </li>
          </ul>

          <h2 className="mt-10 mb-4 !text-2xl font-semibold text-gray-900">Accessing "Alerts" Through Real-Time Data</h2>
          <p className="my-4 text-gray-700">
            While ChiTrack might not send traditional push notifications for
            every delay (keeping the experience uncluttered), it provides the
            most crucial alert: **knowing the actual arrival time**. By simply
            opening the app and checking your saved stations or nearby options, you
            effectively "get alerted" to the current status of your commute.
            This proactive approach, powered by the official{' '}
            <strong>CTA Train Tracker</strong> feed, ensures you always have the
            latest information.
          </p>

          <h2 className="mt-10 mb-4 !text-2xl font-semibold text-gray-900">Integrating with Your Commute (and Ventra)</h2>
          <p className="my-4 text-gray-700">
            ChiTrack focuses purely on delivering the best{' '}
            <strong>CTA tracking</strong> experience. While you'll need the
            official <strong>Ventra</strong> app or website to manage fares and
            passes, ChiTrack complements it by providing the essential real-time
            arrival data Ventra doesn't focus on. Use ChiTrack to plan your
            journey timings, then manage your fare seamlessly with Ventra.
          </p>

          <h2 className="mt-10 mb-4 !text-2xl font-semibold text-gray-900">Download ChiTrack Today</h2>
          <p className="my-4 text-gray-700">
            Stop guessing and start tracking. Experience a smoother, more
            predictable commute with the power of real-time information.
            Download ChiTrack from the App Store and take control of your CTA
            journey.
          </p>
          <p className="text-center mt-8">
            <Link
              href="https://apps.apple.com/app/chitrack-chicago-l-tracker/id6745131685" // TODO: Update with actual App Store link
              className="inline-block text-lg font-semibold px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
            >
              Get ChiTrack on the App Store
            </Link>
          </p>
        </article>
      </main>
    </div>
  );
}
