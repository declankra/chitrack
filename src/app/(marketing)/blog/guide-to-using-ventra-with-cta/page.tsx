//src/app/(marketing)/blog/guide-to-using-ventra-with-cta/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guide to Using Ventra with CTA on ChiTrack | Chicago Transit Tips',
  description:
    'Learn how to use the Ventra card and app with the CTA bus and L train system in Chicago. Maximize your commute with ChiTrack for real-time arrivals.',
  keywords: [
    'Ventra',
    'CTA',
    'Chicago transit',
    'Ventra app',
    'CTA fare',
    'L train',
    'Chicago bus',
    'transit card',
    'commute Chicago',
    'ChiTrack',
    'CTA tracker',
  ],
};

export default function VentraGuidePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/80 p-4 backdrop-blur-md dark:border-gray-700 dark:bg-black/80">
        <Link
          href="/"
          className="text-sm font-medium text-gray-700 transition-colors hover:text-black dark:text-gray-300 dark:hover:text-white"
        >
          &larr; ChiTrack Home
        </Link>
        {/* Placeholder for potential future header elements */}
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <article className="prose prose-lg prose-gray max-w-none dark:prose-invert">
          {/* Removed Back Home Link from here */}

          <h1 className="!mb-6 !text-4xl !font-bold text-black dark:text-white">Guide to Using Ventra with the CTA</h1>
          <p className="lead !mb-8 text-lg text-gray-600 dark:text-gray-400">
            Navigating Chicago's public transit? The Ventra card or app is your
            ticket to ride the CTA's buses and L trains. Here's how to get started
            and use it effectively, especially when paired with a real-time tracker
            like ChiTrack.
          </p>

          {/* Initial Download CTA - Ensure this is below H1/lead */}
          <div className="mb-8 flex justify-center">
            <Link href="https://apps.apple.com/app/chitrack-chicago-l-tracker/id6745131685" target="_blank" rel="noopener noreferrer">
              <Image
                src="/app-store-badge.svg"
                alt="Download ChiTrack on the App Store"
                width={180}
                height={60}
                priority // Load this badge early
              />
            </Link>
          </div>

          {/* --- Blog Content Starts --- */}

          <h2 className="!mb-4 !mt-12 !text-2xl !font-semibold text-gray-900 dark:text-gray-100">What is Ventra?</h2>
          <p className="!my-4 text-gray-700 dark:text-gray-300">
            Ventra is the fare payment system for the Chicago Transit Authority
            (CTA), Pace Suburban Bus, and Metra Rail. You can use a physical Ventra
            card or the Ventra mobile app on your smartphone to pay for rides. It
            replaces older magnetic stripe cards and cash payments on buses (though
            cash is still accepted with exact change).
          </p>

          {/* Snippet for SEO/AI */}
          <p className="!my-4 text-gray-700 dark:text-gray-300">
            <strong>
              Essentially, Ventra is your all-in-one pass for Chicago public
              transit. You load money or passes onto your card or app, then tap it
              on readers to pay your fare for CTA buses and trains.
            </strong>
          </p>

          <h2 className="!mb-4 !mt-10 !text-2xl !font-semibold text-gray-900 dark:text-gray-100">Getting Started: Card vs. App</h2>
          <p className="!my-4 text-gray-700 dark:text-gray-300">You have two main options:</p>
          <ul className="!my-6 space-y-3">
            <li>
              <strong>Physical Ventra Card:</strong> Purchase one for a small fee
              (often waived if you load value immediately) at Ventra Vending
              Machines (in L stations), participating retail locations (like CVS or
              Walgreens), or online. Register your card online or via the app to
              protect your balance if it's lost or stolen.
            </li>
            <li>
              <strong>Ventra App:</strong> Download the free app (iOS and Android),
              create an account, and add a digital Ventra card to your phone's
              mobile wallet (like Apple Wallet or Google Pay). You can then pay
              fares by tapping your phone.
            </li>
          </ul>
          <p className="!my-4 text-gray-700 dark:text-gray-300">
            Many daily commuters find the app more convenient, but having a physical
            card as a backup isn't a bad idea.
          </p>

          <h2 className="!mb-4 !mt-10 !text-2xl !font-semibold text-gray-900 dark:text-gray-100">Loading Fare and Passes</h2>
          <p className="!my-4 text-gray-700 dark:text-gray-300">
            You need to add value or a pass to your Ventra account before riding:
          </p>
          <ul className="!my-6 space-y-3">
            <li>
              <strong>Transit Value:</strong> Load money onto your account like a
              debit card. The fare is deducted each time you ride. This is flexible
              if you ride infrequently.
            </li>
            <li>
              <strong>Passes:</strong> Purchase passes for unlimited rides within a
              specific period (e.g., 1-Day, 3-Day, 7-Day, 30-Day). This is often
              more cost-effective for regular commuters. Passes activate on first
              use.
            </li>
          </ul>
          <p className="!my-4 text-gray-700 dark:text-gray-300">
            You can add value or passes through the Ventra app, the Ventra website,
            vending machines, or participating retailers. Autoload is also
            available, automatically adding value when your balance drops below a
            certain amount.
          </p>

          <h2 className="!mb-4 !mt-10 !text-2xl !font-semibold text-gray-900 dark:text-gray-100">Using Ventra on the CTA</h2>
          <ul className="!my-6 space-y-3">
            <li>
              <strong>L Trains:</strong> Tap your Ventra card or phone (with the app
              in your mobile wallet) on the Ventra reader at the station turnstile.
              Wait for the green light and beep, then proceed through.
            </li>
            <li>
              <strong>Buses:</strong> Tap your card or phone on the reader located
              inside the bus near the driver when you board.
            </li>
            <li>
              <strong>Transfers:</strong> Ventra automatically handles transfers.
              When you pay a full fare, you get up to two transfers within a
              two-hour period. The first transfer is typically $0.25 (bus-to-bus,
              train-to-bus, bus-to-train), and the second is free (often bus-to-bus
              or train-to-bus following a bus-to-train). Train-to-train transfers
              within the same station are usually free.
            </li>
          </ul>

          <h2 className="!mb-4 !mt-10 !text-2xl !font-semibold text-gray-900 dark:text-gray-100">Checking Your Balance</h2>
          <p className="!my-4 text-gray-700 dark:text-gray-300">
            It's crucial to know your balance to avoid issues at the turnstile. You
            can check it via:
          </p>
          <ul className="!my-6 space-y-3">
            <li>The Ventra App (most convenient)</li>
            <li>The Ventra Website</li>
            <li>Ventra Vending Machines</li>
            <li>Tapping your card at any reader (it briefly displays the balance)</li>
          </ul>

          <h2 className="!mb-4 !mt-10 !text-2xl !font-semibold text-gray-900 dark:text-gray-100">Why Pair Ventra with ChiTrack?</h2>
          <p className="!my-4 text-gray-700 dark:text-gray-300">
            While Ventra handles your payment, ChiTrack ensures you use that fare
            efficiently. Knowing exactly when your train or bus is arriving means:
          </p>
          <ul className="!my-6 space-y-3">
            <li>
              <strong>Less Wasted Time:</strong> No more arriving at the platform
              only to see your train pull away. Check ChiTrack before you leave!
            </li>
            <li>
              <strong>Smoother Transfers:</strong> See real-time arrivals for your
              connecting route to minimize wait times during your transfer window.
            </li>
            <li>
              <strong>Stress-Free Commutes:</strong> Quickly access your favorite
              stops and see upcoming arrivals with just a tap or two. ChiTrack's
              simple interface gets you the info you need, fast.
            </li>
            <li>
              <strong>Plan Better:</strong> Easily check schedules for different
              routes or directions from your current location or any searched stop.
            </li>
          </ul>
          <p className="!my-4 text-gray-700 dark:text-gray-300">
            Using Ventra gets you on the system; using ChiTrack helps you navigate
            it like a pro.
          </p>

          {/* --- Blog Content Ends --- */}

          {/* Final Download CTA */}
          <div className="mt-12 text-center">
            <p className="mb-4 text-lg font-medium">
              Ready to streamline your Chicago commute?
            </p>
            <Link
              href="https://apps.apple.com/app/chitrack-chicago-l-tracker/id6745131685"
              className="inline-block rounded-md bg-black px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:focus:ring-gray-300"
            >
              Download ChiTrack Today
            </Link>
          </div>

          {/* Author/Date Info */}
          <div className="mt-12 border-t border-gray-300 pt-6 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
            <p>
              Written by a daily CTA commuter. Last updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              .
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
