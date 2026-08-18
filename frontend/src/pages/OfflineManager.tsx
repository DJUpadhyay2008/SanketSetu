/**
 * OfflineManager.tsx — Phase 9
 * Download management, storage usage, emergency pack, and offline scheme cache.
 */

import { useEffect, useState, useCallback } from "react";
import { 
  Download, Trash2, Wifi, WifiOff, HardDrive, AlertTriangle,
  CheckCircle2, Loader2, RefreshCw, ShieldAlert, BookOpen,
  Zap, Info, ChevronRight
} from "lucide-react";
import { 
  Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, LoadingState
} from "../components/ui";
import { 
  getDownloadedCourses, getTotalStorageUsed, type DownloadedCourse 
} from "../lib/indexeddb";
import { 
  useOnlineStatus, useServiceWorker, useOfflineSync, type DownloadQuality 
} from "../hooks/useOfflineSync";
import { fetchFromApi } from "../api/client";

interface CourseOption {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  lessons_count: number;
  downloadable: boolean;
}

interface EmergencySign {
  word: string;
  description: string;
  icon: string;
  priority: number;
}

const QUALITY_LABELS: Record<DownloadQuality, string> = {
  data_saver: "Data Saver (~6 MB/lesson)",
  standard:   "Standard (~20 MB/lesson)",
  high:       "High Quality (~44 MB/lesson)",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function OfflineManager() {
  const isOnline = useOnlineStatus();
  const { swReady, cacheCourse, deleteCourse } = useServiceWorker();
  const { flushQueue } = useOfflineSync();

  const [activeTab, setActiveTab] = useState<"downloads" | "emergency" | "schemes">("downloads");
  const [availableCourses, setAvailableCourses] = useState<CourseOption[]>([]);
  const [downloadedCourses, setDownloadedCourses] = useState<DownloadedCourse[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [emergencySigns, setEmergencySigns] = useState<EmergencySign[]>([]);
  const [emergencyLastFetch, setEmergencyLastFetch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState<Record<string, DownloadQuality>>({});
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done">("idle");

  // ── Load local data from IndexedDB ─────────────────────────
  const refreshLocalData = useCallback(async () => {
    const [courses, totalBytes] = await Promise.all([
      getDownloadedCourses(),
      getTotalStorageUsed(),
    ]);
    setDownloadedCourses(courses);
    setStorageUsed(totalBytes);
  }, []);

  // ── Load available courses from backend ────────────────────
  const loadAvailableCourses = useCallback(async () => {
    try {
      const data = await fetchFromApi<CourseOption[]>("/learning/courses");
      setAvailableCourses(data.filter((c) => c.downloadable));
    } catch (_) {
      // Offline — show fallback list
      setAvailableCourses([
        { id: "course-fallback-1", title: "Everyday ISL Greetings", category: "Everyday Communication", difficulty: "Beginner", lessons_count: 3, downloadable: true },
        { id: "course-fallback-2", title: "Healthcare Vocabulary", category: "Healthcare", difficulty: "Intermediate", lessons_count: 5, downloadable: true },
        { id: "course-fallback-3", title: "Emergency Situation Signs", category: "Emergency", difficulty: "Beginner", lessons_count: 4, downloadable: true },
      ]);
    }
  }, []);

  // ── Load emergency pack ────────────────────────────────────
  const loadEmergencyPack = useCallback(async () => {
    try {
      const data = await fetchFromApi<{ signs: EmergencySign[]; cached_at: string }>("/learning/emergency-pack");
      setEmergencySigns(data.signs);
      setEmergencyLastFetch(data.cached_at);
    } catch (_) {
      // Serve from SW cache or use hardcoded fallback
      setEmergencySigns([
        { word: "Help", description: "Open hands raised rapidly, palms outward.", icon: "🆘", priority: 1 },
        { word: "Hospital", description: "H handshape crossed on opposite arm like a cross symbol.", icon: "🏥", priority: 2 },
        { word: "Police", description: "P handshape tapped on chest badge location.", icon: "🚔", priority: 3 },
        { word: "Fire", description: "Fluttering fingers from waist upward, both hands.", icon: "🔥", priority: 4 },
        { word: "Ambulance", description: "A handshape rotating circles in front of body.", icon: "🚑", priority: 5 },
        { word: "Emergency", description: "E handshape shaken rapidly from side to side.", icon: "🚨", priority: 6 },
        { word: "Location / Here", description: "Index finger pointed down, then circular motion.", icon: "📍", priority: 7 },
        { word: "Pain / Hurt", description: "Two index fingers brought together at the pain area.", icon: "🤕", priority: 8 },
        { word: "Water", description: "W handshape tapped on chin.", icon: "💧", priority: 9 },
        { word: "Doctor", description: "D handshape tapped on opposite wrist (pulse point).", icon: "👨‍⚕️", priority: 10 },
      ]);
      setEmergencyLastFetch(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadAvailableCourses(), refreshLocalData(), loadEmergencyPack()]);
      setLoading(false);
    })();
  }, [loadAvailableCourses, refreshLocalData, loadEmergencyPack]);

  // ── Download a course ──────────────────────────────────────
  const handleDownload = async (course: CourseOption) => {
    const quality = selectedQuality[course.id] || "standard";
    setDownloading((prev) => ({ ...prev, [course.id]: true }));

    try {
      // Build the URLs for lessons (in production: real asset URLs from API)
      const assetUrls = Array.from({ length: course.lessons_count }, (_, i) =>
        `/api/learning/lessons/${course.id}-lesson-${i + 1}`
      );

      await cacheCourse(
        course.id,
        course.title,
        course.category,
        course.difficulty,
        course.lessons_count,
        quality,
        assetUrls
      );

      await refreshLocalData();
    } finally {
      setDownloading((prev) => ({ ...prev, [course.id]: false }));
    }
  };

  // ── Delete a downloaded course ─────────────────────────────
  const handleDelete = async (courseId: string) => {
    setDeleting((prev) => ({ ...prev, [courseId]: true }));
    try {
      await deleteCourse(courseId);
      await refreshLocalData();
    } finally {
      setDeleting((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  // ── Manual sync ────────────────────────────────────────────
  const handleSync = async () => {
    setSyncStatus("syncing");
    await flushQueue();
    setSyncStatus("done");
    setTimeout(() => setSyncStatus("idle"), 3000);
  };

  const downloadedIds = new Set(downloadedCourses.map((c) => c.course_id));

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 h-48 w-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-10 bottom-0 h-32 w-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Offline Learning</h1>
            <p className="text-teal-400 text-sm font-extrabold tracking-wide uppercase">
              Learn ISL even without internet access
            </p>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Download courses to learn offline in low-connectivity Tier 2/3 cities and rural India.
              Progress is saved locally and synced automatically when online.
            </p>
          </div>

          {/* Online / Storage status pills */}
          <div className="flex flex-col gap-2 items-end">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-extrabold uppercase tracking-widest ${
              isOnline 
                ? "bg-teal-950/40 border-teal-500/30 text-teal-400" 
                : "bg-rose-950/40 border-rose-500/30 text-rose-400"
            }`}>
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isOnline ? "Online" : "Offline Mode"}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-850 border border-slate-800 text-xs font-extrabold text-slate-350">
              <HardDrive className="h-4 w-4 text-slate-500" />
              {formatBytes(storageUsed)} used
            </div>
          </div>
        </div>
      </section>

      {/* Offline progress sync banner */}
      {!isOnline && (
        <div className="p-4 bg-orange-950/20 border border-orange-500/30 rounded-2xl flex items-start gap-3">
          <WifiOff className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider">You are offline</h4>
            <p className="text-2xs text-slate-400 leading-relaxed">
              Offline progress is being saved locally. It will sync automatically when your internet connection is restored.
            </p>
          </div>
        </div>
      )}

      {isOnline && (
        <div className="flex items-center justify-between p-4 bg-teal-950/10 border border-teal-500/20 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-teal-400" />
            <div>
              <p className="text-xs font-black text-teal-400 uppercase tracking-wider">Online — sync available</p>
              <p className="text-2xs text-slate-450">Push queued offline progress to backend now.</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSync}
            className="flex items-center gap-1.5 text-2xs font-extrabold uppercase tracking-widest"
          >
            {syncStatus === "syncing" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : syncStatus === "done" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {syncStatus === "syncing" ? "Syncing..." : syncStatus === "done" ? "Synced!" : "Sync Now"}
          </Button>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-slate-850 pb-px gap-6">
        {(["downloads", "emergency", "schemes"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
              activeTab === tab
                ? "border-teal-500 text-teal-400"
                : "border-transparent text-slate-450 hover:text-slate-200"
            }`}
          >
            {tab === "downloads" ? "Course Downloads" : tab === "emergency" ? "🆘 Emergency Pack" : "Cached Schemes"}
          </button>
        ))}
      </div>

      {/* ── TAB: COURSE DOWNLOADS ───────────────────────────────── */}
      {activeTab === "downloads" && (
        <div className="space-y-8">
          {/* Already Downloaded */}
          {downloadedCourses.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-450 flex items-center gap-1.5">
                <Download className="h-4 w-4 text-teal-400" /> Downloaded Courses
              </h2>
              <div className="space-y-3">
                {downloadedCourses.map((course) => (
                  <div
                    key={course.course_id}
                    className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-850 rounded-2xl gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-teal-950/60 border border-teal-500/20 flex items-center justify-center shrink-0">
                        <BookOpen className="h-4.5 w-4.5 text-teal-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-black text-slate-100 truncate">{course.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">
                            {formatBytes(course.size_bytes)}
                          </span>
                          <span className="text-[9px] text-slate-600">•</span>
                          <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">
                            {QUALITY_LABELS[course.quality]}
                          </span>
                          <Badge variant="teal" className="text-[8px] px-1.5 py-0">Downloaded ✓</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="secondary" size="sm" className="text-2xs">
                        Continue
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-2xs text-rose-400 hover:bg-rose-500/10 border-rose-500/30"
                        onClick={() => handleDelete(course.course_id)}
                      >
                        {deleting[course.course_id] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available to Download */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-450">
              Available for Download
            </h2>

            {loading ? (
              <LoadingState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableCourses.map((course) => {
                  const isDownloaded = downloadedIds.has(course.id);
                  const quality = selectedQuality[course.id] || "standard";
                  const isDownloading = downloading[course.id];

                  return (
                    <Card
                      key={course.id}
                      className={`border transition-all ${
                        isDownloaded
                          ? "border-teal-500/30 bg-teal-950/10"
                          : "border-slate-850 bg-slate-900/30"
                      }`}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <CardTitle className="text-sm">{course.title}</CardTitle>
                            <CardDescription className="mt-0.5">
                              {course.category} · {course.difficulty} · {course.lessons_count} lessons
                            </CardDescription>
                          </div>
                          {isDownloaded && <Badge variant="teal" className="text-[9px] shrink-0">✓ Saved</Badge>}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Quality selector */}
                        {!isDownloaded && (
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">
                              Download Quality
                            </span>
                            <div className="flex gap-2">
                              {(["data_saver", "standard", "high"] as DownloadQuality[]).map((q) => (
                                <button
                                  key={q}
                                  onClick={() => setSelectedQuality((prev) => ({ ...prev, [course.id]: q }))}
                                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                    quality === q
                                      ? "bg-teal-950/60 border-teal-500/50 text-teal-400"
                                      : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                                  }`}
                                >
                                  {q === "data_saver" ? "Saver" : q === "standard" ? "Standard" : "HD"}
                                </button>
                              ))}
                            </div>
                            <p className="text-[9px] text-slate-500 italic">{QUALITY_LABELS[quality]}</p>
                          </div>
                        )}

                        <Button
                          variant={isDownloaded ? "secondary" : "primary"}
                          size="sm"
                          className="w-full flex items-center justify-center gap-1.5 text-2xs font-extrabold"
                          onClick={() => isDownloaded ? handleDelete(course.id) : handleDownload(course)}
                          disabled={isDownloading || !swReady}
                        >
                          {isDownloading ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Downloading...</>
                          ) : isDownloaded ? (
                            <><Trash2 className="h-3.5 w-3.5" /> Remove Download</>
                          ) : (
                            <><Download className="h-3.5 w-3.5" /> Download Course</>
                          )}
                        </Button>

                        {!swReady && (
                          <p className="text-[9px] text-orange-400 italic text-center">
                            Service Worker initializing…
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: EMERGENCY PACK ─────────────────────────────────── */}
      {activeTab === "emergency" && (
        <div className="space-y-6">
          <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-2xl flex items-start gap-3">
            <Zap className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest">Always Available Offline</h4>
              <p className="text-2xs text-slate-400 leading-relaxed">
                These essential signs are cached by the system automatically and will work even without any internet.
                {emergencyLastFetch && (
                  <span className="text-slate-500 block mt-1">Last verified: {new Date(emergencyLastFetch).toLocaleDateString()}</span>
                )}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-orange-950/10 border border-orange-500/20 rounded-xl flex items-start gap-2.5">
            <ShieldAlert className="h-4.5 w-4.5 text-orange-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-orange-300 font-semibold leading-relaxed">
              These are learning references for ISL communication. In a life-threatening emergency, always call 112 (India Emergency) first.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {emergencySigns.map((sign) => (
              <div
                key={sign.word}
                className="flex items-start gap-3 p-4 bg-slate-900/50 border border-slate-850 rounded-2xl"
              >
                <div className="text-2xl shrink-0 leading-none mt-0.5">{sign.icon}</div>
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-sm font-black text-slate-100">{sign.word}</h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">{sign.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: CACHED SCHEMES ─────────────────────────────────── */}
      {activeTab === "schemes" && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/50 border border-slate-850 rounded-2xl flex items-start gap-3">
            <Info className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-teal-400 uppercase tracking-widest">Offline Scheme Cache</h4>
              <p className="text-2xs text-slate-400 leading-relaxed">
                Selected government scheme information can be cached for offline reading. Always verify eligibility and application status online before applying.
              </p>
            </div>
          </div>

          <div className="p-4 bg-orange-950/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-orange-400 uppercase tracking-widest">Staleness Warning</h4>
              <p className="text-2xs text-slate-400 leading-relaxed">
                Government scheme eligibility criteria, application windows, and benefit amounts change frequently.
                Cached scheme data may be outdated. <strong className="text-orange-300">Always verify at the official government portal before applying.</strong>
              </p>
            </div>
          </div>

          {/* Demo: Cached Schemes list */}
          {[
            { name: "ADIP Scheme", last_cached: "2026-08-14", category: "Central", is_stale: false },
            { name: "Viklaang Pension Yojana — Gujarat", last_cached: "2026-07-28", category: "State · Gujarat", is_stale: true },
          ].map((scheme) => (
            <div
              key={scheme.name}
              className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-850 rounded-2xl gap-3"
            >
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-slate-100">{scheme.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[9px]">{scheme.category}</Badge>
                  <span className={`text-[9px] font-bold ${scheme.is_stale ? "text-orange-400" : "text-slate-500"}`}>
                    Last updated: {scheme.last_cached}
                    {scheme.is_stale && " ⚠ May be outdated"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="secondary" size="sm" className="text-2xs flex items-center gap-1">
                  Read <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="text-2xs text-rose-400 hover:bg-rose-500/10 border-rose-500/30">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="primary"
            className="w-full flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest"
            onClick={() => {}}
            disabled={!isOnline}
          >
            <Download className="h-4 w-4" /> Cache More Schemes
          </Button>
          {!isOnline && (
            <p className="text-center text-2xs text-slate-500 italic">Connect to internet to cache additional schemes</p>
          )}
        </div>
      )}
    </div>
  );
}
