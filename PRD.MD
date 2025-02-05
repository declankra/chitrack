# **Chicago CTA Transit Tracker – One-Pager Implementation Guide**

## Overview

- **Objective:** Create an elegant, fast, and intuitive Web & IOS app for real-time Chicago train tracking that solves poor UX and cumbersome navigation in current CTA apps.
- **Scope (v1):** Train tracking only; future iterations can include bus tracking, expanded route details, and map-based features.
- **App Name:** ChiTrack: Chicago CTA Ventra Transit Tracker

## Technical Architecture

### Tech Stack

**web:**

- FE host: Vercel (serverless)
- FE UI: NextJS

**app**

- FE UI: SwiftUI

**shared:**

- NextJS API Route functions: hosted on Vercel
- Postgres db: Supabase (serverless)
- Redis db: Upstash (serverless)

### Architecture

- **Frontend (Web):** Next.js (UI) hosted on Vercel with Next.js API routes for serverless functions.
- **Frontend (Mobile):** SwiftUI for iOS, with local data stored using @AppStorage.
- **Backend & Caching:** Upstash Redis used as a serverless cache to limit CTA API calls.
- **API Integration for Mobile:** The mobile app calls Next.js API routes (hosted on Vercel) that handle logic, caching, and communication with the CTA API.
- **Mobile App Backend:** Supabase for low-volume user data (user info, feedback, paywall info)
- **Supabase table schemas:**
    - chitrack_users: `userID`, `homeStop`, `favoriteStops`, `userName`, `recentStops`, `firstOpenDate`, `paidUserStatus`
    - chitrack_feedback: `userID`, `feedback`,

### Data Management & Caching

- **Convenience User Data Storage & Feedback (Supabase):**
    - chitrack_users Table (REPLICATE THIS IN @APP LOCAL STORAGE for offline access):
        - Store userID, homeStop, favoriteStops, userName, recentStops, firstOpenDate, and paidUserStatus.
        - Use firstOpenDate to enforce the 5-day free trial before the paywall on Mobile app.
    - chitrack_feedback Table:
        - Store `userID` and `feedback` (submitted text)
        - FK userID tied to userID in chitrack_users
- **Server-Side Cache (Upstash Redis):**
    - **train_updates Table:**
        - Each record represents a stop with columns for stop_id, upcoming arrival times (up to three), and last_fetched_at.
        - Refresh data every 30 seconds. On each API request, check the timestamp. Serve cached data if within threshold; otherwise, fetch fresh data from the CTA API, update the cache, and return new results.
- **Offline Handling for Arrival Times:**
    - If no internet, display the last cached arrival times with an indication of how stale the data is.

### Backend & API Integration

- **Next.js API Routes (Vercel):**
    - Acts as the middle layer between the iOS app and CTA API.
    - Implements caching logic to reduce direct CTA API calls (keeping within the 100k/day limit).
    - Endpoints provide arrival time data and handle logic for refreshing and caching.
- **API Call Strategy:**
    - Each device calls these endpoints using Swift’s async/await.
    - Manual refresh triggered by tapping on a stop.
    - Auto-refresh every 30 seconds to keep data current.
    - CTA_TRAIN_API_KEY: ff0c4676989b4a9aa9dc88ec14220292

### IOS App Paywall

**Technical Integration:**

- **Frameworks:**
    - **StoreKit2:** Use async/await for in-app purchase flows.
    - **Superwall:** Integrate the Superwall SDK to display a multi-screen paywall.
- **Trial Enforcement:**
    - Track `firstOpenDate` using `@AppStorage`.
    - On app launch, compare the current date to `firstOpenDate`.
    - If more than 5 days have elapsed without a purchase, trigger the paywall.
- **Purchase Flow:**
    - Fetch the product (e.g., `com.yourapp.lifetime` for a one-time 6.99 payment).
    - On successful transaction via StoreKit2, update `paidUserStatus` locally and in Supabase (`chitrack_users` table).
- **Superwall Configuration:**
    - Set up a 4-screen paywall flow via the Superwall dashboard for A/B testing and custom UI.

## UI & UX

### Style & Design

- **Design Aesthetic:**
    - Minimalistic, modern, and uncluttered.
    - Floating dock with active states and smooth animations.
    - Consistent color scheme: primarily black/white with route-specific colors for clarity.
- **Interaction Details:**
    - Desktop users see hover magnification/animation effects.
    - Mobile users benefit from quick taps and one-tap refresh for arrival times.
- **Style:** clean, sleek, minimalistic, uncluttered, and modern style. Colors are occasionally uses sharp, crisp animations to keep visitors engaged, adding a “wow” effect.
- **Color Scheme:** Black and white everything unless for the route information (color matches name of route, e.g. “red train line” is red)
    - automatically swaps white/black based on appearance
        - primary color = black
        - primary base = white
        - base content = shade of black-ish grey
        - base = white
- **Brand:**
    - Premium. Elegance. Elevated everyday. Minimalistic Productivity. Professional.

### User Flows & Screens

- **Home Screen:**
    - Greets user with custom message.
    - Displays “home stop” arrival times (with one-tap refresh).
    - Shows up to three favorite stops.
- **Search Screen:**
    - Floating dock contains a search icon.
    - On tap, the dock expands into dropdown allowing users to select a line and stop or type to search.
- **Map Screen (Future):**
    - Interactive map with black and white format except for colored transit lines.
    - User can pull up (using geolocation) nearby stops.
- **User Settings:**
    - Edit home stop, favorite stops, and user name.
    - Submit in-app feedback.
    - Display app credits and onboarding details.

**Additional Feature Requirements:**

- main controller is the floating dock on bottom:
    - three items: Home, Search, Map
    - active state for dock item: hover light under item
- ‘home stop’:
    - user can set their most frequently used stop (with route/direction they want to go) as their ‘home stop’
- ‘favorite stops’:
    - user can set up to 3 commonly used stops as their ‘favorite stops’ (without direction auto-set)
- map feature:
    - when user clicks a stop, bottom sheet pops up with information on whats coming from either direction, with each arrival time marked.

### Onboarding

- **Onboarding Flow:**
    - Welcome screen with animation and a slogan.
    - Auto-transition to screen asking for location access.
    - Prompt the user to select the stop they use the most = home stop (mandatory).
    - Prompt the user to select other common stops = favorite stops (optional).
    - A “completed” screen with encouraging text like “enjoy traveling in style” and instructions to click route icon at any time to refresh arrival times.

### Paywall UI/UX Flow

- **Overview:**
    
    The paywall is a full-screen, multi-step flow that only appears after the five-day free trial period. The flow consists of four interactive screens that build the value proposition before reaching the final purchase screen.
    
- **Screen 1 – Introduction:**
    - Introduce premium benefits.
    - Message: "For the price of a coffee, unlock lifetime access."
    - Action: “Continue.”
- **Screen 2 – Value Proposition:**
    - Highlight how the app elevates daily travel with superior design and peace of mind.
    - Action: “Next.”
- **Screen 3 – Benefits Recap:**
    - Summarize key benefits: fast tracking, intuitive UI, professional feel.
    - Action: “Continue.”
- **Screen 4 – Final Call-to-Action:**
    - Reinforce the value: “Unlock lifetime access for just 6.99.”
    - Action: “Unlock Now” to initiate the StoreKit2 purchase.
- **Post-Purchase:**
    - On successful purchase, dismiss the paywall and grant full access.
    - If the purchase fails, offer options to retry or contact support.

## Additional considerations

- **Mobile-First Mindset:** Continue to use mobile-first CSS classes. For example, design all your buttons, fonts, and spacing for mobile by default, then adjust with responsive modifiers if needed for larger screens.
- The website will be free to use if anyone accesses it. How will I prevent people from only using the website? Every 15s the user is on the web version, initiate a pop-up that tells them to download the app
- **After the website is used to mimic a mobile app, it will be used as a marketing tool to get people to download the app.**
    - first, create the web app UI as if its the mobile app. then, add a marketing/landing page and additional pages for SEO - to drive traffic to the website which will ultimately tell them to download the app.
- **How this app will win:**
    - simple & intuitive UX: on open, user should know exactly how the app works and what each button does, getting exactly what they need.
    - modern, clean, uncluttered, and beautiful: it should make the user feel professional, exceptional, and elegant.
    - fast: loading/navigation should be crisp and user should get the information they want without distraction/friction/having to wait.
- **Possible Future features:**
    - Analytics tracking
    - Bus Tracking
    - iPhone widgets to display ‘home stop’
    - apple watch app to view ‘home stop’
    - daily morning commute alert: notify user when the train is {user inputted time} from their home stop within {user inputted ideal timeframe they want to leave}

**!! Assistant Instructions !!**

- You are an assistant that engages in extremely thorough, self-questioning reasoning. Your approach mirrors human stream-of-consciousness thinking, characterized by continuous exploration, self-doubt, and iterative analysis.
- Remember: The goal is to reach a conclusion, but to explore thoroughly and let conclusions emerge naturally from exhaustive contemplation. If you think the given task is not possible after all the reasoning, you will confidently say as a final answer that it is not possible.

**!! Coding Instructions !!**

- Include comments in code for clear readability and understanding
- Provide crisp code, achieving the objective in minimal lines and few dependencies to keep the codebase lean
- This site should be optimized for mobile-first experience because it will be replicated in SwiftUI.