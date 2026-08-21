import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Flame, ArrowRight, BookOpen, 
  FileText, HeartHandshake, Users, Sparkles,
  Trophy, Zap, WifiOff, TrendingUp, Building2
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { fetchFromApi } from "../api/client";
import { useOnlineStatus } from "../hooks/useOfflineSync";
import { 
  Button, Card, CardContent,
  Badge, ProgressBar, Avatar, CourseCard, InstitutionCard, SkeletonCard
} from "../components/ui";

// ── API types (subset) ────────────────────────────────────────
interface CourseProgress {
  id: string;
  title: string;
  difficulty: string;
  lessons_count: number;
  xp_reward: number;
  progress_percent: number;
}

interface Recommendation {
  weakness_analysis: string;
  practice_suggestion: string;
  recommended_focus: string;
  recommended_lesson_id?: string;
  recommended_lesson_title?: string;
}

interface TopInstitution {
  name: string;
  category: string;
  city: string;
  score: number;
  tier: string;
  hasVideoServices?: boolean;
  hasInterpreters?: boolean;
}

// ── Fallback demo data (visible if API offline) ───────────────
const DEMO_COURSES: CourseProgress[] = [
  {
    id: "demo-1",
    title: "Healthcare ISL & Medical Vocab",
    difficulty: "Intermediate",
    lessons_count: 12,
    xp_reward: 350,
    progress_percent: 68,
  },
];

const DEMO_INSTITUTIONS: TopInstitution[] = [
  { name: "AIIMS New Delhi", category: "Healthcare", city: "New Delhi", score: 94, tier: "Gold", hasVideoServices: true, hasInterpreters: true },
  { name: "Gujarat University", category: "Education", city: "Ahmedabad", score: 87, tier: "Silver", hasVideoServices: true, hasInterpreters: false },
];

const DEMO_LEADERBOARD = [
  { rank: 1, name: "Aarav Sharma", xp: 2410, isMe: false },
  { rank: 2, name: "Priya Patel",  xp: 2150, isMe: false },
  { rank: 3, name: "You",          xp: 1240, isMe: true },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isOnline = useOnlineStatus();

  const displayName = profile?.display_name || (user ? user.email?.split("@")[0] : "Friend");

  // Dynamic Progress calculations
  const userXP = user ? (profile?.xp ?? 0) : 0;
  const userStreak = user ? (profile?.streak_days ?? 1) : 0;
  const userLevel = user ? (profile?.rank_level ?? Math.max(1, Math.floor(userXP / 200) + 1)) : 1;
  const levelBaseXP = (userLevel - 1) * 200;
  const milestonePercent = Math.min(100, Math.round(((userXP - levelBaseXP) / 200) * 100));

  // ── TanStack Query: Courses with progress ──────────────────
  const { data: courses, isLoading: coursesLoading } = useQuery<CourseProgress[]>({
    queryKey: ["home-courses"],
    queryFn: () => fetchFromApi<CourseProgress[]>("/learning/courses"),
    enabled: isOnline,
    placeholderData: DEMO_COURSES,
  });

  // ── TanStack Query: AI Recommendation (only if logged in) ─
  const { data: recommendation, isLoading: recLoading } = useQuery<Recommendation>({
    queryKey: ["home-recommendation"],
    queryFn: () => fetchFromApi<Recommendation>("/learning/recommendations"),
    enabled: !!user && isOnline,
  });

  // ── TanStack Query: Top Institutions ──────────────────────
  const { data: institutions, isLoading: instLoading } = useQuery<any>({
    queryKey: ["home-institutions"],
    queryFn: () => fetchFromApi("/institutions?limit=2&sort=score"),
    enabled: isOnline,
    select: (d: any) => d?.institutions ?? d ?? DEMO_INSTITUTIONS,
    placeholderData: { institutions: DEMO_INSTITUTIONS },
  });

  const displayCourse = (courses && courses.length > 0) ? courses[0] : DEMO_COURSES[0];
  const displayInstitutions: TopInstitution[] = Array.isArray(institutions) && institutions.length > 0
    ? institutions.slice(0, 2)
    : DEMO_INSTITUTIONS;

  return (
    <div className="space-y-8 py-2 animate-in">
      
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-orange-950/20 border border-orange-500/30 rounded-2xl text-xs text-orange-400 font-black no-print">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>You are offline. Showing cached content. Progress will sync when you reconnect.</span>
        </div>
      )}

      {/* Welcome Header Banner */}
      <section 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-[#17233C] via-[#10344A] to-[#006B66] text-white rounded-2xl shadow-xs border border-[#008F87]/30 relative overflow-hidden"
        aria-label="Welcome banner"
      >
        <div className="absolute right-0 top-0 h-48 w-48 bg-[#008F87]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-8 bottom-0 h-24 w-24 bg-[#F59E0B]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <Avatar 
            src={profile?.avatar_url} 
            name={displayName} 
            size="lg" 
            active={!!user} 
          />
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight md:text-2xl text-white flex items-center gap-2">
              {getGreeting()}, {displayName} <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
              {profile?.isl_level ? `ISL Level — ${profile.isl_level}` : "ISL READY INDIA INITIATIVE"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => navigate("/live")}
            aria-label="Go to Sanket Live practice"
            className="px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold text-xs flex items-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-slate-950" />
            <span>Practice Live</span>
          </button>
          {!user && (
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 font-bold text-xs border border-white/20 transition-all active:scale-95 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </section>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Column 1 & 2: Primary Content */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          
          {/* Continue Learning */}
          <section className="space-y-3" aria-label="Continue learning section">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
                Continue Learning
              </h2>
              <Link 
                to="/learn" 
                className="text-xs font-bold text-[#008F87] hover:text-[#006B66] flex items-center gap-1 uppercase tracking-wider"
                aria-label="Go to all courses"
              >
                All Courses <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {coursesLoading ? (
              <SkeletonCard className="h-28 w-full" />
            ) : (
              <CourseCard
                title={displayCourse.title}
                difficulty={displayCourse.difficulty}
                lessonsCount={displayCourse.lessons_count}
                xpReward={displayCourse.xp_reward}
                progressPercent={displayCourse.progress_percent}
                onAction={() => navigate("/learn")}
              />
            )}
          </section>

          {/* AI Recommendation */}
          <section className="space-y-3" aria-label="Personalized recommendation">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
              Recommended for You
            </h2>

            {!user ? (
              <Card className="border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="flex flex-col items-center justify-center py-7 gap-3 text-center">
                  <div className="h-10 w-10 rounded-xl bg-[#008F87]/10 border border-[#008F87]/20 flex items-center justify-center shadow-2xs">
                    <Sparkles className="h-5 w-5 text-[#008F87]" />
                  </div>
                  <p className="text-xs text-[#172033] dark:text-slate-200 font-bold max-w-sm">
                    Sign in to get AI-powered personalized ISL learning recommendations.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => navigate("/")} className="bg-[#008F87] hover:bg-[#006B66] text-white font-bold text-xs">
                    Sign In to Unlock
                  </Button>
                </CardContent>
              </Card>
            ) : recLoading ? (
              <SkeletonCard className="h-28 w-full" />
            ) : recommendation ? (
              <Card className="border border-[#008F87]/20 bg-[#008F87]/5 dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="space-y-3 pt-1">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-800 border border-[#008F87]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <TrendingUp className="h-4.5 w-4.5 text-[#008F87]" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#172033] dark:text-white">
                        {recommendation.recommended_lesson_title || recommendation.recommended_focus}
                      </h3>
                      <p className="text-xs text-[#667085] dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                        {recommendation.practice_suggestion}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full font-bold text-xs bg-[#008F87] hover:bg-[#006B66] text-white"
                    onClick={() => navigate("/learn")}
                  >
                    Start Recommended Lesson →
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="flex items-center justify-center py-6">
                  <p className="text-xs text-[#667085] dark:text-slate-400 font-medium">
                    Complete your first lesson to unlock personalized recommendations.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Top ISL-Ready Institutions */}
          <section className="space-y-3" aria-label="ISL-Ready institutions">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
                ISL-Ready Institutions
              </h2>
              <Link 
                to="/institution" 
                className="text-xs font-bold text-[#008F87] hover:text-[#006B66] flex items-center gap-1 uppercase tracking-wider"
              >
                View Index <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {instLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonCard className="h-32" />
                <SkeletonCard className="h-32" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayInstitutions.map((inst, index) => (
                  <InstitutionCard
                    key={index}
                    name={inst.name}
                    category={inst.category}
                    city={inst.city}
                    score={inst.score}
                    tier={inst.tier}
                    hasVideoServices={!!inst.hasVideoServices}
                    hasInterpreters={!!inst.hasInterpreters}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Column 3: Sidebar */}
        <div className="space-y-6 sm:space-y-8">
          
          {/* Progress & Streak Stats */}
          <section className="space-y-3" aria-label="Your learning progress">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
              Your Progress
            </h2>
            <Card className="border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="space-y-4">
                {/* Level / XP */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-[#E4E7EC] dark:border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 block">
                      Current Rank
                    </span>
                    <span className="text-base font-bold text-[#172033] dark:text-white">
                      {user ? `Level ${userLevel}` : "Level 1"}
                    </span>
                  </div>
                  <Badge variant="teal" className="px-2.5 py-1 font-bold">
                    {user ? `${userXP.toLocaleString()} XP` : "0 XP"}
                  </Badge>
                </div>

                {/* Streak */}
                <div className="flex items-center gap-3 p-3.5 bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20 rounded-xl border border-[#F59E0B]/20">
                  <div className="h-9 w-9 bg-[#F59E0B] text-slate-950 rounded-lg flex items-center justify-center shrink-0 shadow-2xs">
                    <Flame className="h-5 w-5 fill-current" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706] dark:text-[#F59E0B] block">
                      Daily Streak
                    </span>
                    <span className="text-sm font-bold text-[#172033] dark:text-white">
                      {user ? `${userStreak} ${userStreak === 1 ? 'Day' : 'Days'} Active 🔥` : "1 Day Active 🔥"}
                    </span>
                  </div>
                </div>

                {/* Next Milestone */}
                <div className="pt-1">
                  <ProgressBar value={milestonePercent} label={`Milestone: Level ${userLevel + 1}`} size="sm" variant="saffron" />
                </div>

                {!user && (
                  <Button
                    variant="outline"
                    className="w-full text-xs font-bold border-[#E4E7EC]"
                    onClick={() => navigate("/")}
                    leftIcon={<Zap className="h-4 w-4 text-[#008F87]" />}
                  >
                    Sign In to Sync Progress
                  </Button>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Quick Actions Grid */}
          <section className="space-y-3" aria-label="Quick action shortcuts">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Learn ISL",   icon: BookOpen,      path: "/learn" },
                { label: "Find Schemes",icon: FileText,       path: "/schemes" },
                { label: "Get Assist",  icon: HeartHandshake, path: "/assist" },
                { label: "Community",   icon: Users,          path: "/community" },
                { label: "Leaderboard", icon: Trophy,         path: "/leaderboard" },
                { label: "ISL Index",   icon: Building2,      path: "/institution" },
              ].map(({ label, icon: Icon, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 hover:border-[#008F87]/40 hover:shadow-2xs transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer shadow-2xs active:scale-95 group"
                  aria-label={`Navigate to ${label}`}
                >
                  <div className="h-9 w-9 rounded-xl bg-[#008F87]/10 text-[#008F87] flex items-center justify-center transition-colors group-hover:bg-[#008F87] group-hover:text-white">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[11px] font-bold text-[#172033] dark:text-slate-200">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Mini Leaderboard */}
          <section className="space-y-3" aria-label="Weekly leaderboard preview">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400">
                Weekly Leaders
              </h2>
              <Link 
                to="/learn" 
                className="text-xs font-bold text-[#008F87] hover:text-[#006B66] flex items-center gap-1 uppercase tracking-wider"
              >
                Full list <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <Card className="border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="space-y-3 py-2">
                {DEMO_LEADERBOARD.map((entry) => (
                  <div key={entry.rank} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-bold w-5 text-center ${
                        entry.rank === 1 ? "text-[#F59E0B]" : entry.rank === 2 ? "text-slate-400" : "text-amber-700"
                      }`}>
                        {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                      </span>
                      <span className={`text-xs font-bold ${entry.isMe ? "text-[#008F87] dark:text-teal-400" : "text-[#172033] dark:text-slate-200"}`}>
                        {entry.isMe ? `${displayName} (You)` : entry.name}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold ${entry.isMe ? "text-[#008F87] dark:text-teal-400 font-bold" : "text-[#667085]"}`}>
                      {entry.xp.toLocaleString()} XP
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
