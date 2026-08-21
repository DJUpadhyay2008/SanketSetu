import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppShell from './layouts/AppShell'
import { AuthProvider } from './hooks/useAuth'
import ErrorBoundary from './components/ErrorBoundary'

// Resilient lazy wrapper to retry chunk loading if network or cache fails
function lazyRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn("Chunk load error, retrying import:", error);
      try {
        return await componentImport();
      } catch (retryErr) {
        console.error("Failed to load chunk after retry:", retryErr);
        throw retryErr;
      }
    }
  });
}

// Lazy-loaded pages for code-splitting / performance
const Home         = lazyRetry(() => import('./pages/Home'))
const Learn        = lazyRetry(() => import('./pages/Learn'))
const Schemes      = lazyRetry(() => import('./pages/Schemes'))
const Assist       = lazyRetry(() => import('./pages/Assist'))
const AssistPortal = lazyRetry(() => import('./pages/AssistPortal'))
const Institution  = lazyRetry(() => import('./pages/Institution'))
const Passport     = lazyRetry(() => import('./pages/Passport'))
const Community    = lazyRetry(() => import('./pages/Community'))
const Leaderboard  = lazyRetry(() => import('./pages/Leaderboard'))
const Verify       = lazyRetry(() => import('./pages/Verify'))
const OfflineManager = lazyRetry(() => import('./pages/OfflineManager'))
const SanketLive   = lazyRetry(() => import('./pages/SanketLive'))
const Settings     = lazyRetry(() => import('./pages/Settings'))
const NotFound     = lazyRetry(() => import('./pages/NotFound'))

// Skeleton fallback while lazy pages load
function PageSkeleton() {
  return (
    <div className="space-y-6 py-6 px-2 animate-pulse">
      <div className="skeleton h-40 rounded-3xl w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="skeleton h-6 rounded-full w-48" />
          <div className="skeleton h-32 rounded-2xl w-full" />
          <div className="skeleton h-32 rounded-2xl w-full" />
        </div>
        <div className="space-y-4">
          <div className="skeleton h-6 rounded-full w-32" />
          <div className="skeleton h-48 rounded-2xl w-full" />
        </div>
      </div>
    </div>
  )
}

function MainLayout() {
  return (
    <AppShell>
      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  )
}

// Global TanStack Query Client with sensible cache settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,       // 30 seconds
      gcTime: 5 * 60 * 1000,      // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Standalone Public Verification Route */}
            <Route path="/verify/:id" element={
              <ErrorBoundary>
                <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
                  <Verify />
                </Suspense>
              </ErrorBoundary>
            } />

            {/* Main Application Routes inside AppShell */}
            <Route element={<MainLayout />}>
              <Route path="/"           element={<Home />} />
              <Route path="/learn"      element={<Learn />} />
              <Route path="/schemes"    element={<Schemes />} />
              <Route path="/assist"     element={<Assist />} />
              <Route path="/assist/:category/:slug" element={<AssistPortal />} />
              <Route path="/institution" element={<Institution />} />
              <Route path="/passport"   element={<Passport />} />
              <Route path="/community"  element={<Community />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/offline"    element={<OfflineManager />} />
              <Route path="/live"       element={<SanketLive />} />
              <Route path="/settings"   element={<Settings />} />
              <Route path="*"           element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
