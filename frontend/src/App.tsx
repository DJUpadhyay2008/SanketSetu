import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppShell from './layouts/AppShell'
import { AuthProvider } from './hooks/useAuth'

// Lazy-loaded pages for code-splitting / performance
const Home         = lazy(() => import('./pages/Home'))
const Learn        = lazy(() => import('./pages/Learn'))
const Schemes      = lazy(() => import('./pages/Schemes'))
const Assist       = lazy(() => import('./pages/Assist'))
const AssistPortal = lazy(() => import('./pages/AssistPortal'))
const Institution  = lazy(() => import('./pages/Institution'))
const Passport     = lazy(() => import('./pages/Passport'))
const Community    = lazy(() => import('./pages/Community'))
const Leaderboard  = lazy(() => import('./pages/Leaderboard'))
const Verify       = lazy(() => import('./pages/Verify'))
const OfflineManager = lazy(() => import('./pages/OfflineManager'))
const SanketLive   = lazy(() => import('./pages/SanketLive'))
const Settings     = lazy(() => import('./pages/Settings'))
const NotFound     = lazy(() => import('./pages/NotFound'))

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
              <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
                <Verify />
              </Suspense>
            } />

            {/* Main Application Routes inside AppShell */}
            <Route path="/*" element={
              <AppShell>
                <Suspense fallback={<PageSkeleton />}>
                  <Routes>
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
                  </Routes>
                </Suspense>
              </AppShell>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
