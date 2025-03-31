## Next.js to React Native (Expo) Migration Guide

This guide outlines the steps to migrate your Next.js web application (`chitrack`) to a React Native mobile application using Expo, focusing on reusing the existing backend API endpoints located in `src/app/api/`.

**Assumptions:**

- The Next.js application uses App Router (`src/app/`).
- Styling is primarily done with Tailwind CSS (`tailwind.config.ts`).
- State management solutions (if any) need to be adapted or replaced.
- Backend API routes in `src/app/api/` are self-contained and ready to be consumed by a mobile client.
- You are comfortable with React Native and Expo concepts.

### 1. Codebase Analysis Summary

- **Project Root**: Standard Next.js setup (`src/`, `public/`, `package.json`, `next.config.ts`, `tailwind.config.ts`). Uses TypeScript.
- **App Structure (`src/app/`)**: Uses App Router with route groups (`(app)`, `(marketing)`). Contains global layout (`layout.tsx`), CSS (`globals.css`), and providers (`providers.tsx`).
- **API Routes (`src/app/api/`)**: Backend endpoints organized by service (`cta/`, `mapbox/`). These will be reused directly.
- **Frontend Components (`src/components/`)**: Organized by feature/screen (`home/`, `map/`, `settings/`, etc.) and shared elements (`shared/`, `ui/`, `layout/`). These will need significant adaptation.
- **Shared Logic (`src/lib/`)**: Contains hooks (`hooks/`), utilities (`utilities/`, `utils.ts`), types (`types/`), data handling (`data/`, `gtfs/`), and service clients (e.g., `redis.ts`, `supabase.ts`). Some parts might be reusable, others might need adaptation (especially if they rely on Node.js APIs).
- **Styling**: Tailwind CSS. Needs conversion to a React Native compatible solution (e.g., NativeWind).
- **Static Assets (`public/`)**: Contains static files (images, fonts, etc.). These need to be moved to Expo's asset system.
- **Dependencies (`package.json`)**: Review needed. Web-specific dependencies (e.g., `next`, potentially some UI libraries) will be replaced by React Native/Expo equivalents. Backend dependencies used in API routes *should* remain unchanged if the backend isn't being modified.

### 2. Migration Planning: Step-by-Step Guide

**Step 2.1: Set Up New Expo Project**

1. **Initialize Expo App**: Create a new Expo project using a template (TypeScript recommended):
    
    ```bash
    npx create-expo-app chitrack-mobile --template expo-template-blank-typescript
    cd ChitrakMobile
    
    ```
    
2. **Install Core Dependencies**: Add essential navigation and potentially styling libraries. We'll use Expo Router and NativeWind (for Tailwind compatibility).
    
    ```bash
    npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
    npm install nativewind
    npm install --dev tailwindcss
    npx tailwindcss init
    
    ```
    
3. **Configure NativeWind**: Follow the [NativeWind setup guide](https://www.nativewind.dev/v4/getting-started/expo-router). Update `tailwind.config.js` (copy settings from your Next.js `tailwind.config.ts` and adapt paths) and configure the Babel plugin (`babel.config.js`).
4. **Configure Expo Router**: Set up the `app` directory for file-based routing similar to Next.js App Router. Follow the [Expo Router setup guide](https://docs.expo.dev/router/installation/).

**Step 2.2: Adapt Frontend Components (HTML -> React Native)**

- **Mapping**: Systematically go through `src/components/` in your Next.js project.
    - Replace HTML elements with React Native core components:
        - `div`, `section`, `article`, `header`, `footer`, `nav` -> `<View>`
        - `p`, `span`, `h1h6`, `label` -> `<Text>`
        - `img` -> `<Image>` (from `react-native`)
        - `button` -> `<Button>` or `<Pressable>`/`<TouchableOpacity>` for custom styling
        - `input`, `textarea` -> `<TextInput>`
        - `a` (for internal links) -> `<Link>` (from `expo-router`)
        - `ul`, `ol`, `li` -> `<FlatList>` or `<ScrollView>` with mapped `<View>`/`<Text>`
- **Example Conversion:**
    
    ```tsx
    // Next.js (src/components/shared/MyCard.tsx)
    import React from 'react';
    
    interface MyCardProps {
      title: string;
      children: React.ReactNode;
    }
    
    export const MyCard: React.FC<MyCardProps> = ({ title, children }) => {
      return (
        <div className="p-4 bg-white rounded shadow">
          <h3 className="text-lg font-bold">{title}</h3>
          <div className="mt-2">{children}</div>
        </div>
      );
    };
    
    // React Native (ChitrakMobile/components/shared/MyCard.tsx)
    import React from 'react';
    import { View, Text } from 'react-native';
    import { styled } from 'nativewind';
    
    const StyledView = styled(View);
    const StyledText = styled(Text);
    
    interface MyCardProps {
      title: string;
      children: React.ReactNode;
    }
    
    export const MyCard: React.FC<MyCardProps> = ({ title, children }) => {
      return (
        <StyledView className="p-4 bg-white rounded shadow">
          <StyledText className="text-lg font-bold">{title}</StyledText>
          <StyledView className="mt-2">{children}</StyledView>
        </StyledView>
      );
    };
    
    ```
    
- **Component Structure**: Recreate the directory structure from `src/components/` inside your Expo project (e.g., `ChitrakMobile/components/`).

**Step 2.3: Adapt Styling (Tailwind CSS -> NativeWind)**

- **NativeWind**: Since you're using Tailwind, NativeWind is the most direct path. Most of your existing Tailwind classes should work directly after setting up NativeWind correctly.
- **Unsupported Styles**: Some web-specific CSS properties might not be supported or have different behavior in React Native. Consult NativeWind and React Native StyleSheet documentation. Pay attention to layout differences (Flexbox is the primary layout system).
- **Global Styles**: Migrate styles from `src/app/globals.css` to your main layout file in Expo (`ChitrakMobile/app/_layout.tsx`) or a dedicated stylesheet.

**Step 2.4: Reuse API Endpoints**

- **API Client**: Create a dedicated service layer for API calls in the Expo app (e.g., `ChitrakMobile/services/api.ts`). Use `fetch` or install Axios (`npm install axios`).
- **Base URL**: Configure the base URL for your deployed Next.js backend (Vercel URL). Store this in environment variables (using `expo-constants` or a dedicated library like `react-native-dotenv`).
- **Fetching Data**: Replace any server-side data fetching (e.g., in Server Components, `getServerSideProps`, or `getStaticProps` if you were using Pages Router previously) with client-side fetching within your React Native components using `useEffect` or a data-fetching library (like React Query/TanStack Query or SWR).
- **Example API Call:**
    
    ```tsx
    // ChitrakMobile/services/ctaApi.ts
    import axios from 'axios';
    import Constants from 'expo-constants';
    
    const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'YOUR_DEFAULT_VERCEL_URL'; // Configure in app.json extra field
    
    const apiClient = axios.create({
      baseURL: `${API_BASE_URL}/api/cta`, // Point to your deployed API route
    });
    
    export const getTrainArrivals = async (stationId: string) => {
      try {
        const response = await apiClient.get(`/arrivals?stationId=${stationId}`); // Example endpoint
        return response.data;
      } catch (error) {
        console.error('Error fetching train arrivals:', error);
        throw error; // Or handle appropriately
      }
    };
    
    // ChitrakMobile/app/home.tsx (Example Usage)
    import React, { useState, useEffect } from 'react';
    import { View, Text, FlatList } from 'react-native';
    import { getTrainArrivals } from '../services/ctaApi';
    
    export default function HomeScreen() {
      const [arrivals, setArrivals] = useState([]);
      const [loading, setLoading] = useState(true);
    
      useEffect(() => {
        const fetchArrivals = async () => {
          try {
            const data = await getTrainArrivals('YOUR_STATION_ID'); // Replace with actual logic
            setArrivals(data);
          } catch (error) {
            // Handle error display
          } finally {
            setLoading(false);
          }
        };
        fetchArrivals();
      }, []);
    
      // ... render loading state or FlatList with arrivals ...
      return (<View><Text>Home Screen</Text></View>) // Placeholder
    }
    
    ```
    

**Step 2.5: Handle Navigation (Next.js Router -> Expo Router)**

- **Expo Router**: Mimics the file-based routing of Next.js App Router. Recreate your page structure from `src/app/(app)/` and `src/app/(marketing)/` within `ChitrakMobile/app/`.
    - `src/app/(app)/page.tsx` -> `ChitrakMobile/app/index.tsx` (or your main tab)
    - `src/app/(app)/settings/page.tsx` -> `ChitrakMobile/app/settings.tsx`
    - `src/app/(app)/map/[id]/page.tsx` -> `ChitrakMobile/app/map/[id].tsx`
- **Layouts**: Use Expo Router's Layout Routes (`_layout.tsx`) to replicate shared UI like headers, footers, or tab bars, similar to Next.js layouts (`src/app/layout.tsx`).
- **Navigation Actions**: Replace `next/link` with `expo-router/Link` for declarative navigation and `next/navigation` hooks (like `useRouter`) with `expo-router` hooks (like `useRouter`).

**Step 2.6: Manage State**

- **Identify**: Determine the state management solution used in the Next.js app (Context API, Redux, Zustand, Jotai, etc., likely found in `src/lib/providers/` or within components).
- **Migrate/Adapt**:
    - **Context API**: Generally portable. Wrap your app in the provider within the root layout (`ChitrakMobile/app/_layout.tsx`).
    - **Redux/Zustand/Jotai**: Install the corresponding React Native compatible packages. The core logic (reducers, actions, stores) is often reusable, but provider setup might differ slightly.

**Step 2.7: Address Next.js Specific Features**

- **Server Components/Server Actions**: Any logic within Server Components or Server Actions needs to be moved to your existing API routes (`src/app/api/`) if not already there. The React Native app will interact purely via client-side API calls.
- **ISR/SSR**: Not applicable in React Native. All data fetching becomes client-side. Caching strategies need to be implemented client-side (e.g., using React Query, AsyncStorage, or MMKV).
- **Middleware**: Next.js middleware (`middleware.ts`) logic (e.g., auth checks) needs to be reimplemented either on the client-side (potentially insecure for some checks) or within your API endpoints.

**Step 2.8: Platform-Specific Considerations**

- **UI/UX**: Adapt designs for smaller screens and touch interactions. Consider platform conventions (iOS vs. Android).
- **Native Modules**: If you need native device features (camera, location, etc.), use Expo's modules or React Native community libraries.
- **Permissions**: Implement requests for necessary device permissions (location, notifications, etc.) using Expo's APIs.
- **Offline Support**: Plan for offline data caching and synchronization if needed, using tools like AsyncStorage, MMKV, or WatermelonDB.

### 3. File Migration Strategy

1. **Setup (`ChitrakMobile/`)**: Initialize Expo, set up NativeWind, Expo Router, environment variables.
2. **API Services (`ChitrakMobile/services/`)**: Create API client functions (`api.ts`, `ctaApi.ts`, `mapboxApi.ts`) to call your *deployed* Next.js API endpoints.
3. **Assets**: Copy contents of `public/` (images, fonts) into `ChitrakMobile/assets/` and update references using `require()` or `expo-asset`. Configure fonts in `expo-font`.
4. **Core Layout (`ChitrakMobile/app/_layout.tsx`, `components/layout/`)**: Migrate `src/app/layout.tsx` and `src/components/layout/` components. Set up root navigation (e.g., Tabs, Stack).
5. **Shared Components (`ChitrakMobile/components/shared/`, `components/ui/`)**: Prioritize migrating common UI elements (Buttons, Cards, Inputs, etc.). Convert HTML tags and Tailwind classes.
6. **Utilities & Hooks (`ChitrakMobile/lib/` or `hooks/`, `utils/`)**: Migrate platform-agnostic utilities from `src/lib/utilities`, `utils.ts`, `types/`. Adapt or rewrite hooks (`src/lib/hooks`) for React Native environment (e.g., replace web APIs). Review `src/lib/data`, `gtfs` for Node/browser-specific code.
7. **Screens/Pages (`ChitrakMobile/app/`)**: Migrate screen by screen, starting with simpler ones.
    - Recreate the route file structure from `src/app/(app)/`.
    - Adapt page components, replacing data fetching logic with client-side calls to your API services.
    - Compose screens using migrated shared/UI components.
    - Example Order: `index.tsx` (Home), `search.tsx`, `map.tsx`, `settings.tsx`, etc.
8. **State Management (`ChitrakMobile/providers/` or integrated)**: Integrate migrated state management (Context, Redux, etc.) into the root layout.
9. **Refinement**: Address platform differences, optimize performance.

### 4. Validation and Testing

- **Expo Go**: Use Expo Go on physical devices or simulators/emulators for rapid development and testing during migration.
- **API Connectivity**: Thoroughly test all API calls from the mobile app. Check request/response formats and error handling. Use network debugging tools.
- **UI Parity & UX**: Compare screens side-by-side with the web app (where applicable). Test usability on different screen sizes and platforms (iOS/Android). Use component snapshot testing if desired.
- **Navigation**: Test all navigation flows, including deep linking if applicable.
- **State**: Verify state is managed correctly across screens and application lifecycle events.
- **Performance**: Profile the app using Flipper or platform-specific tools. Optimize list rendering (`FlatList`), image loading, and expensive computations.

### 5. Deliverables Summary

- **Recommended RN Project Structure (`ChitrakMobile/`)**:
    
    ```
    ChitrakMobile/
    ├── app/               # Expo Router routes/screens (_layout.tsx, index.tsx, settings.tsx, map/[id].tsx, etc.)
    ├── assets/            # Static assets (images, fonts)
    ├── components/        # Reusable UI components (organized by feature or type: shared/, ui/, home/, map/, etc.)
    ├── constants/         # Constant values (e.g., Colors, Layout)
    ├── hooks/             # Custom React hooks
    ├── navigation/        # (Optional) Custom navigation logic/components if needed beyond basic Expo Router
    ├── providers/         # State management providers (Context, etc.)
    ├── services/          # API interaction layer (api.ts, ctaApi.ts, mapboxApi.ts)
    ├── types/             # TypeScript type definitions
    ├── utils/             # Utility functions
    ├── app.json           # Expo config
    ├── babel.config.js    # Babel config (for NativeWind)
    ├── tailwind.config.js # Tailwind/NativeWind config
    ├── package.json
    └── tsconfig.json
    
    ```
    
- **Code Snippets**: Provided above for component conversion and API integration.
- **Step-by-Step Plan**: Detailed in Sections 2 and 3.
- **Potential Challenges & Notes**:
    - **Performance**: React Native performance tuning (especially for lists and navigation) can be challenging. Use `FlatList` optimizations, memoization (`React.memo`), and consider libraries like `react-native-fast-image`.
    - **NativeWind Limitations**: While good, NativeWind might not cover 100% of Tailwind features or behave identically. Be prepared to use `StyleSheet.create` for complex or unsupported styles.
    - **Expo Managed Workflow**: Understand the limitations (e.g., need to use EAS Build for custom native code). Your current `lib/` dependencies (`redis.ts`, `supabase.ts`) look like they might be client libraries, which *should* be fine, but double-check they don't rely on Node.js APIs not available in React Native. If they do, interaction must happen via your API routes.
    - **Environment Variables**: Securely manage API keys and base URLs using Expo's mechanisms (e.g., `app.json` extra field, `expo-constants`, or `react-native-dotenv` with EAS Build secrets).
    - **Debugging**: Utilize React Native Debugger, Flipper, and Expo's tools effectively.