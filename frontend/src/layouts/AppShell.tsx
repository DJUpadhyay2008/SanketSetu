import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Menu, X, Home, BookOpen, FileText, HeartHandshake, 
  Award, Users, Trophy, Building2, Bell, Settings,
  Volume2, WifiOff, Zap, Eye
} from "lucide-react";
import { fetchFromApi } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { NotificationItem, Button, Modal } from "../components/ui";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, account, loading, loginWithEmail, registerWithEmail, logout } = useAuth();
  
  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      if (isRegisterMode) {
        await registerWithEmail(authEmail, authPassword);
      } else {
        await loginWithEmail(authEmail, authPassword);
      }
      setAuthModalOpen(false);
      setAuthEmail("");
      setAuthPassword("");
    } catch (err: any) {
      setAuthError(err?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setAuthSubmitting(false);
    }
  };
  
  // Accessibility state
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem("accessibility_high_contrast") === "true";
  });
  const [fontScale, setFontScale] = useState<"normal" | "large" | "xlarge">(() => {
    return (localStorage.getItem("accessibility_font_scale") as any) || "normal";
  });

  // Modal / Drawer Toggles
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Mock Notifications list
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Practice Request Matched",
      message: "An ISL interpreter has accepted your General Assistance request for tomorrow at 10:00 AM.",
      isRead: false,
      timestamp: "2h ago"
    },
    {
      id: "2",
      title: "New Course Available",
      message: "Level 2 Healthcare vocabulary is now online. Earn double XP this week!",
      isRead: false,
      timestamp: "1d ago"
    },
    {
      id: "3",
      title: "Scheme Status Updated",
      message: "Your application for the Disability Pension Assist Scheme has been reviewed.",
      isRead: true,
      timestamp: "3d ago"
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Backend Status
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    // Check health endpoint
    fetchFromApi<{ status: string }>("/health")
      .then((res) => {
        if (res.status === "healthy") {
          setBackendStatus("online");
        } else {
          setBackendStatus("offline");
        }
      })
      .catch(() => {
        setBackendStatus("offline");
      });
  }, [location.pathname]);

  // Apply high contrast styling
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast-active");
      localStorage.setItem("accessibility_high_contrast", "true");
    } else {
      document.documentElement.classList.remove("high-contrast-active");
      localStorage.setItem("accessibility_high_contrast", "false");
    }
  }, [highContrast]);

  // Save font scale preference
  useEffect(() => {
    localStorage.setItem("accessibility_font_scale", fontScale);
  }, [fontScale]);

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Sanket Learn", path: "/learn", icon: BookOpen },
    { name: "Sanket Schemes", path: "/schemes", icon: FileText },
    { name: "Sanket Assist", path: "/assist", icon: HeartHandshake },
    { name: "Sanket Community", path: "/community", icon: Users },
    { name: "Sanket Passport", path: "/passport", icon: Award },
    { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
    { name: "ISL-Ready Index", path: "/institution", icon: Building2 },
    { name: "Sanket Live", path: "/live", icon: Zap },
    { name: "Offline Learning", path: "/offline", icon: WifiOff },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const mobileNavItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Learn", path: "/learn", icon: BookOpen },
    { name: "Live", path: "/live", icon: Zap },
    { name: "Offline", path: "/offline", icon: WifiOff },
    { name: "Passport", path: "/passport", icon: Award },
  ];

  const getFontSizeClass = () => {
    if (fontScale === "large") return "text-[18px] md:text-[20px]";
    if (fontScale === "xlarge") return "text-[20px] md:text-[22px]";
    return "text-[16px]";
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors ${getFontSizeClass()}`}>
      {/* Skip to Main Content Link for screen readers */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-orange-500 focus:text-white focus:p-3 focus:rounded-xl focus:font-bold focus:shadow-md"
      >
        Skip to main content
      </a>

      {/* Top Brand Accent Line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3.5px] bg-gradient-to-r from-[#10B981] via-[#F59E0B] to-[#10B981]" />

      {/* Header bar - Fixed at Top */}
      <header className="fixed top-[3.5px] left-0 right-0 z-40 h-[57px] bg-white/95 backdrop-blur-md text-zinc-800 border-b border-zinc-200/90 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-zinc-100 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#10B981] cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <Link to="/" className="flex items-center gap-2.5 font-black tracking-tight text-xl text-zinc-900 group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
              S
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#059669]">Sanket</span>
              <span className="border-l border-zinc-200 pl-2 text-xs text-zinc-500 font-extrabold tracking-wider uppercase hidden sm:inline">Setu</span>
            </div>
          </Link>
        </div>

        {/* Accessibility & Connection Toggles */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Connection Status indicator */}
          <div className="hidden xs:flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-2xs font-bold border border-emerald-200/80">
            <span className={`h-2.5 w-2.5 rounded-full ${
              backendStatus === "online" ? "bg-emerald-500 animate-pulse" : backendStatus === "offline" ? "bg-rose-500" : "bg-zinc-400"
            }`} />
            <span className="text-emerald-800">
              API: {backendStatus === "online" ? "ONLINE" : backendStatus === "offline" ? "OFFLINE" : "CHECKING"}
            </span>
          </div>

          {/* Quick Actions (Notifications & Settings) */}
          <div className="flex items-center gap-1.5">
            {/* Notification Bell */}
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 rounded-xl bg-zinc-100/80 text-zinc-700 hover:bg-zinc-200/80 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#10B981] cursor-pointer transition-colors"
              aria-label="Open notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>

            {/* Accessibility Settings Shortcut */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl bg-zinc-100/80 text-zinc-700 hover:bg-zinc-200/80 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#10B981] cursor-pointer transition-colors"
              aria-label="Open accessibility and UI settings"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Supabase Email/Password Auth State */}
          <div className="flex items-center gap-2 border-l border-zinc-200 pl-3 sm:pl-4">
            {loading ? (
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full skeleton" />
                <span className="text-zinc-500 text-xs">Loading…</span>
              </div>
            ) : user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-xs font-bold text-zinc-800">
                    {profile?.display_name || user.email}
                  </span>
                  {account?.roles && (
                    <span className="text-[9px] text-[#059669] font-extrabold uppercase tracking-widest">
                      {account.roles[0]}
                    </span>
                  )}
                </div>
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || "User Avatar"}
                    className="h-8 w-8 rounded-full border border-[#10B981] object-cover shadow-2xs"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                    {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <button
                  onClick={() => logout()}
                  className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-2xs font-bold border border-zinc-200 cursor-pointer"
                >
                  Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthError(null);
                  setAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <span>LOGIN</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative pt-[60px]">
        {/* Sidebar for Desktop & Mobile Drawer */}
        <aside 
          className={`fixed top-[60px] bottom-0 left-0 z-30 w-64 bg-zinc-900 text-zinc-300 border-r border-zinc-800 flex flex-col justify-between p-3.5 transform transition-transform duration-200 ease-in-out md:transform-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 h-[calc(100vh-60px)] shrink-0 overflow-hidden shadow-md`}
          aria-label="Main sidebar navigation"
        >
          <nav className="space-y-1 overflow-y-auto flex-1 pr-1 custom-scrollbar" aria-label="Sidebar links">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-[#10B981] ${
                    isActive 
                      ? "bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-black shadow-md shadow-emerald-950/60 border border-emerald-400/30" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/80"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-zinc-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer pinned cleanly at bottom */}
          <div className="pt-3 mt-2 border-t border-zinc-800/80 text-zinc-400 text-3xs space-y-1 font-bold uppercase tracking-wider px-2 shrink-0 bg-zinc-950/60 rounded-xl p-2.5">
            <p className="text-zinc-200 font-extrabold flex items-center justify-between">
              <span>Sanket Setu</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </p>
            <p className="text-[#10B981] text-4xs font-bold">v1.0 · Hackathon 2026 · ISL India</p>
          </div>
        </aside>

        {/* Overlay when sidebar open on mobile */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-slate-950/60 md:hidden"
            aria-hidden="true"
          />
        )}

        {/* Main Content Area */}
        <main 
          id="main-content"
          className="flex-1 md:ml-64 p-4 sm:p-6 md:p-10 max-w-5xl mx-auto overflow-y-auto w-full pb-20 md:pb-10 min-h-[calc(100vh-57px)]"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 text-white flex items-center justify-around py-2 px-3 shadow-lg safe-bottom">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 text-center py-1 select-none transition-colors ${
                isActive ? "text-teal-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[8px] uppercase tracking-wider font-extrabold">{item.name}</span>
            </Link>
          );
        })}
        {/* Menu item to toggle full Sidebar links */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 text-center py-1 select-none transition-colors cursor-pointer ${
            sidebarOpen ? "text-teal-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[8px] uppercase tracking-wider font-extrabold">More</span>
        </button>
      </nav>

      {/* Notifications modal */}
      <Modal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notifications"
        footer={
          <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
            Mark All Read
          </Button>
        }
      >
        <div className="space-y-3.5">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              title={n.title}
              message={n.message}
              isRead={n.isRead}
              timestamp={n.timestamp}
              onMarkRead={() => markNotificationRead(n.id)}
            />
          ))}
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Accessibility & Interface Controls"
      >
        <div className="space-y-5 py-2">
          {/* Text Size options */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
              Text Sizing Preferences
            </label>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Text Size Controls">
              <button
                onClick={() => setFontScale("normal")}
                className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                  fontScale === "normal" 
                    ? "bg-teal-600 border-teal-500 text-white shadow-sm" 
                    : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                }`}
              >
                Normal (A)
              </button>
              <button
                onClick={() => setFontScale("large")}
                className={`py-2 px-3 rounded-xl border text-sm font-extrabold transition-all cursor-pointer ${
                  fontScale === "large" 
                    ? "bg-teal-600 border-teal-500 text-white shadow-sm" 
                    : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                }`}
              >
                Large (A+)
              </button>
              <button
                onClick={() => setFontScale("xlarge")}
                className={`py-2 px-3 rounded-xl border text-base font-extrabold transition-all cursor-pointer ${
                  fontScale === "xlarge" 
                    ? "bg-teal-600 border-teal-500 text-white shadow-sm" 
                    : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                }`}
              >
                Huge (A++)
              </button>
            </div>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                High Contrast Theme
              </h4>
              <p className="text-[11px] font-semibold text-slate-400">
                Improves readability using sharp monochrome palettes.
              </p>
            </div>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`p-2 rounded-lg border text-2xs font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                highContrast ? "bg-orange-500 text-white border-orange-400" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <Eye className="h-4.5 w-4.5" />
              <span>{highContrast ? "ACTIVE" : "ENABLE"}</span>
            </button>
          </div>

          {/* Audio Description */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Sign Descriptions (Audio)
              </h4>
              <p className="text-[11px] font-semibold text-slate-400">
                Dictate sign characteristics text-to-speech description.
              </p>
            </div>
            <button
              className="p-2 rounded-lg border text-2xs font-extrabold flex items-center gap-1 bg-slate-950 text-slate-400 border-slate-800 cursor-pointer"
            >
              <Volume2 className="h-4.5 w-4.5" />
              <span>OFF</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Email & Password Login / Register Modal */}
      <Modal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={isRegisterMode ? "Create Sanket Setu Account" : "Log In to Sanket Setu"}
      >
        <form onSubmit={handleAuthSubmit} className="space-y-4 py-2">
          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
              {authError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Email Address
            </label>
            <input
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={authSubmitting}
              className="w-full justify-center py-2.5 font-bold"
            >
              {authSubmitting
                ? "Processing..."
                : isRegisterMode
                ? "Create Account"
                : "Sign In"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setAuthError(null);
                }}
                className="text-xs font-bold text-teal-400 hover:underline cursor-pointer"
              >
                {isRegisterMode
                  ? "Already have an account? Sign in here"
                  : "Need an account? Register with email"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
