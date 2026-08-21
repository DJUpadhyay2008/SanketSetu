import { useEffect, useState } from "react";
import { fetchFromApi, postToApi } from "../api/client";
import { 
  Sparkles, Building2, Search, 
  CheckCircle2, TrendingUp, TrendingDown, Info,
  Calculator, Check, BadgeCheck
} from "lucide-react";
import { 
  Card, CardHeader, CardTitle, CardContent,
  LoadingState, Button
} from "../components/ui";

interface ScoreBreakdown {
  staff_training: number;
  service_accessibility: number;
  isl_resources: number;
  emergency_readiness: number;
  learning_participation: number;
  user_feedback: number;
  accessibility_audit: number;
}

interface LeaderboardInstitutionEntry {
  rank: number;
  id: string;
  name: string;
  category: string;
  city: string;
  score: number;
  tier: string;
  trend: "up" | "down" | "stable";
  badges: string[];
  is_verified: boolean;
}

interface IndexItem {
  id: string;
  name: string;
  category: string;
  readiness_score: number;
  tier: string;
  city: string;
  is_verified: boolean;
  breakdown: ScoreBreakdown;
  recommendations: string[];
}

const DEMO_LEADERBOARD_INSTITUTIONS: LeaderboardInstitutionEntry[] = [
  { rank: 1, id: "inst-1", name: "AIIMS New Delhi — Inclusive OPD Centre", category: "Hospitals", city: "New Delhi", score: 94, tier: "A+", trend: "up", badges: ["Verified OPD", "VRS Active", "Certified Staff"], is_verified: true },
  { rank: 2, id: "inst-2", name: "IIT Bombay Disability Resource Centre", category: "Colleges", city: "Mumbai", score: 91, tier: "A+", trend: "up", badges: ["Exam Scribe", "Accessible Campus"], is_verified: true },
  { rank: 3, id: "inst-3", name: "All India Institute of Speech and Hearing (AIISH)", category: "Hospitals", city: "Mysore", score: 88, tier: "A", trend: "stable", badges: ["Audiology Grants", "Early Intervention"], is_verified: true },
  { rank: 4, id: "inst-4", name: "Gujarat University Disability Cell", category: "Colleges", city: "Ahmedabad", score: 85, tier: "A", trend: "up", badges: ["ISL Workshops"], is_verified: true },
  { rank: 5, id: "inst-5", name: "District Collectorate & Social Welfare Office", category: "Government", city: "New Delhi", score: 78, tier: "B", trend: "stable", badges: ["UDID Counter"], is_verified: true }
];

const DEMO_INDEX_ITEMS: IndexItem[] = [
  {
    id: "inst-1",
    name: "AIIMS New Delhi — Inclusive OPD Centre",
    category: "Hospitals",
    readiness_score: 94,
    tier: "A+",
    city: "New Delhi",
    is_verified: true,
    breakdown: { staff_training: 18, service_accessibility: 20, isl_resources: 15, emergency_readiness: 14, learning_participation: 9, user_feedback: 9, accessibility_audit: 9 },
    recommendations: ["Maintain active staff refresher training workshops every quarter."]
  },
  {
    id: "inst-2",
    name: "IIT Bombay Disability Resource Centre",
    category: "Colleges",
    readiness_score: 91,
    tier: "A+",
    city: "Mumbai",
    is_verified: true,
    breakdown: { staff_training: 17, service_accessibility: 18, isl_resources: 15, emergency_readiness: 14, learning_participation: 9, user_feedback: 9, accessibility_audit: 9 },
    recommendations: ["Expand braille and ISL digital transcript archives for advanced STEM courses."]
  },
  {
    id: "inst-3",
    name: "All India Institute of Speech and Hearing (AIISH)",
    category: "Hospitals",
    readiness_score: 88,
    tier: "A",
    city: "Mysore",
    is_verified: true,
    breakdown: { staff_training: 16, service_accessibility: 18, isl_resources: 14, emergency_readiness: 13, learning_participation: 9, user_feedback: 9, accessibility_audit: 9 },
    recommendations: ["Publish video sign guides for pediatric early intervention desks."]
  },
  {
    id: "inst-4",
    name: "Gujarat University Disability Cell",
    category: "Colleges",
    readiness_score: 85,
    tier: "A",
    city: "Ahmedabad",
    is_verified: true,
    breakdown: { staff_training: 15, service_accessibility: 17, isl_resources: 14, emergency_readiness: 13, learning_participation: 8, user_feedback: 9, accessibility_audit: 9 },
    recommendations: ["Establish dedicated ISL scribe allocation desk for mid-term exams."]
  },
  {
    id: "inst-5",
    name: "District Collectorate & Social Welfare Office",
    category: "Government",
    readiness_score: 78,
    tier: "B",
    city: "New Delhi",
    is_verified: true,
    breakdown: { staff_training: 14, service_accessibility: 15, isl_resources: 12, emergency_readiness: 12, learning_participation: 8, user_feedback: 8, accessibility_audit: 9 },
    recommendations: ["Install permanent 'Scan-for-ISL' QR poster at Window 4."]
  }
];

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "audit" | "admin">("leaderboard");
  const [leaderboardCategory, setLeaderboardCategory] = useState<string>("overall");
  const [institutions, setInstitutions] = useState<LeaderboardInstitutionEntry[]>(DEMO_LEADERBOARD_INSTITUTIONS);
  const [indexItems, setIndexItems] = useState<IndexItem[]>(DEMO_INDEX_ITEMS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInst, setSelectedInst] = useState<IndexItem | null>(DEMO_INDEX_ITEMS[0]);

  // Self Evaluation State
  const [regName, setRegName] = useState("");
  const [regCategory, setRegCategory] = useState("healthcare");
  const [regCity, setRegCity] = useState("");
  
  const [hasInterpreters, setHasInterpreters] = useState(false);
  const [staffTrained, setStaffTrained] = useState(0);
  const [hasVrs, setHasVrs] = useState(false);
  const [resourcesScore, setResourcesScore] = useState(5);
  const [emergencyScore, setEmergencyScore] = useState(5);
  const [participationScore, setParticipationScore] = useState(5);
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [auditScore, setAuditScore] = useState(5);

  const [evaluationPreview, setEvaluationPreview] = useState<{
    score: number;
    tier: string;
    breakdown: ScoreBreakdown;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Load Leaderboard and Index data
  const loadData = () => {
    setLoading(true);
    // Fetch leaderboard
    fetchFromApi<LeaderboardInstitutionEntry[]>(`/leaderboard/institutions?category=${leaderboardCategory}`)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setInstitutions(data);
        } else {
          setInstitutions(DEMO_LEADERBOARD_INSTITUTIONS);
        }
      })
      .catch(() => {
        setInstitutions(DEMO_LEADERBOARD_INSTITUTIONS);
      });

    // Fetch index (details, breakdown, etc.)
    fetchFromApi<IndexItem[]>("/institutions/index")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setIndexItems(data);
          if (!selectedInst) setSelectedInst(data[0]);
        } else {
          setIndexItems(DEMO_INDEX_ITEMS);
        }
        setLoading(false);
      })
      .catch(() => {
        setIndexItems(DEMO_INDEX_ITEMS);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [leaderboardCategory, activeTab]);

  // Live score calculator on form changes
  useEffect(() => {
    const staff_training = Math.min(20, Math.floor((staffTrained * 20) / 100));
    const service_accessibility = (hasInterpreters ? 10 : 0) + (hasVrs ? 10 : 0);
    const score = staff_training + service_accessibility + resourcesScore + emergencyScore + participationScore + feedbackScore + auditScore;
    
    let tier = "D";
    if (score >= 90) tier = "A+";
    else if (score >= 75) tier = "A";
    else if (score >= 55) tier = "B";
    else if (score >= 35) tier = "C";

    setEvaluationPreview({
      score,
      tier,
      breakdown: {
        staff_training,
        service_accessibility,
        isl_resources: resourcesScore,
        emergency_readiness: emergencyScore,
        learning_participation: participationScore,
        user_feedback: feedbackScore,
        accessibility_audit: auditScore
      }
    });
  }, [hasInterpreters, staffTrained, hasVrs, resourcesScore, emergencyScore, participationScore, feedbackScore, auditScore]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regCity) {
      alert("Please fill in institution name and city");
      return;
    }
    setSubmitting(true);
    try {
      await postToApi("/institutions/register", {
        name: regName,
        category: regCategory,
        city: regCity,
        has_isl_interpreters: hasInterpreters,
        staff_trained_percentage: staffTrained,
        has_video_relay_services: hasVrs,
        isl_resources_score: resourcesScore,
        emergency_readiness_score: emergencyScore,
        learning_participation_score: participationScore,
        user_feedback_score: feedbackScore,
        accessibility_audit_score: auditScore
      });

      setSuccessMessage("Institution successfully submitted for verification! An administrator will audit your responses shortly.");
      setRegName("");
      setRegCity("");
      setStaffTrained(0);
      setHasInterpreters(false);
      setHasVrs(false);
      
      // Auto-switch back to leaderboard after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
        setActiveTab("leaderboard");
        loadData();
      }, 4000);
    } catch (err) {
      alert("Submitted audit request (Demo Offline Mode).");
      setSuccessMessage("Institution successfully submitted for verification! An administrator will audit your responses shortly.");
      setTimeout(() => {
        setSuccessMessage("");
        setActiveTab("leaderboard");
        loadData();
      }, 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await postToApi(`/institutions/${id}/verify`, {});
      alert("Institution marked as verified successfully!");
      loadData();
    } catch (err) {
      alert("Marked as verified (Demo Offline Mode)!");
      setIndexItems(prev => prev.map(i => i.id === id ? { ...i, is_verified: true } : i));
    }
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-lg shadow-yellow-500/10 ring-2 ring-yellow-350";
    if (rank === 2) return "bg-gradient-to-r from-slate-350 to-slate-450 text-slate-900 font-black ring-2 ring-slate-300";
    if (rank === 3) return "bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black ring-2 ring-amber-500";
    return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800 font-bold";
  };

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case "A+": return "bg-teal-500/10 text-teal-400 border border-teal-500/30";
      case "A": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/35";
      case "B": return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30";
      case "C": return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
      default: return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
    }
  };

  const safeInstitutions = Array.isArray(institutions) ? institutions : DEMO_LEADERBOARD_INSTITUTIONS;
  const safeIndexItems = Array.isArray(indexItems) ? indexItems : DEMO_INDEX_ITEMS;

  return (
    <div className="space-y-8 py-2">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 px-6 py-8 text-white shadow-xl border border-emerald-700/50">
        <div className="absolute right-0 top-0 h-48 w-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-10 bottom-0 h-32 w-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/50 text-3xs font-extrabold uppercase tracking-widest text-amber-300">
              <Calculator className="h-3 w-3" /> Transparent Evaluation Engine
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              ISL-Ready Index
            </h1>
            <p className="text-emerald-100/90 text-xs font-semibold leading-relaxed">
              Mainstreaming Indian Sign Language across hospitals, colleges, corporate campuses, and government offices. View certified institution score breakdowns.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => setActiveTab("leaderboard")} 
              className={`text-xs py-2 px-4 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === "leaderboard" 
                  ? "bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow-md" 
                  : "bg-emerald-900/80 hover:bg-emerald-900 text-emerald-200"
              }`}
            >
              Leaderboard & Search
            </Button>
            <Button 
              onClick={() => setActiveTab("audit")} 
              className={`text-xs py-2 px-4 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === "audit" 
                  ? "bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow-md" 
                  : "bg-emerald-900/80 hover:bg-emerald-900 text-emerald-200"
              }`}
            >
              Self-Audit & Onboard
            </Button>
            <Button 
              onClick={() => setActiveTab("admin")} 
              className={`text-xs py-2 px-4 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === "admin" 
                  ? "bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow-md" 
                  : "bg-emerald-900/80 hover:bg-emerald-900 text-emerald-200"
              }`}
            >
              Audit Admin
            </Button>
          </div>
        </div>
      </section>

      {/* PRIVACY COMPLIANCE NOTICE */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex gap-3 items-start">
        <Info className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-250">National Privacy & Accessibility Policy Notice</h4>
          <p className="text-2xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            In compliance with national digital privacy and RPwD guidelines, the Sanket Setu Leaderboard lists and evaluates **registered public and private institutions** to foster accessibility readiness. Personal learning records, test video submissions, and individual citizen achievements are kept private and stored securely under your personal credential passport.
          </p>
        </div>
      </div>

      {activeTab === "leaderboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEADERBOARD TABLE */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Tabs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto">
                {["Overall", "Colleges", "Hospitals", "Companies", "Government"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setLeaderboardCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold transition-all shrink-0 ${
                      leaderboardCategory.toLowerCase() === cat.toLowerCase()
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-850"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-2xs pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold text-slate-850 dark:text-slate-100"
                />
              </div>
            </div>

            {loading ? (
              <LoadingState />
            ) : (
              <div className="space-y-3.5">
                {safeInstitutions
                  .filter(inst => {
                    const nameMatch = inst?.name ? inst.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
                    const cityMatch = inst?.city ? inst.city.toLowerCase().includes(searchQuery.toLowerCase()) : true;
                    return nameMatch || cityMatch;
                  })
                  .map((entry) => (
                    <Card 
                      key={entry.id} 
                      className={`border cursor-pointer transition-all hover:translate-x-1 ${
                        selectedInst?.id === entry.id
                          ? "border-teal-500 bg-teal-500/5 dark:bg-teal-500/10"
                          : "border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900"
                      }`}
                      onClick={() => {
                        const fullInfo = safeIndexItems.find(item => item.id === entry.id);
                        if (fullInfo) setSelectedInst(fullInfo);
                      }}
                    >
                      <div className="flex items-center justify-between gap-4 p-4">
                        <div className="flex items-center gap-4">
                          <span className={`h-7 w-7 rounded-full flex items-center justify-center text-2xs border ${getRankBadgeStyle(entry.rank)}`}>
                            {entry.rank}
                          </span>

                          <div className="space-y-1">
                            <h3 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 leading-snug">
                              {entry.name}
                              {entry.is_verified ? (
                                <BadgeCheck className="h-4.5 w-4.5 text-teal-600 fill-teal-100 dark:fill-teal-900 shrink-0" />
                              ) : (
                                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-extrabold uppercase">Unverified</span>
                              )}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {entry.category} • {entry.city}
                            </p>
                            
                            {/* Badges */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {entry.badges?.map((badge, idx) => (
                                <span key={idx} className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-350 border border-slate-200/50 dark:border-slate-800 px-1.5 py-0.5 rounded text-[8px] font-extrabold">
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Trend */}
                          <div className="flex items-center shrink-0">
                            {entry.trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                            {entry.trend === "down" && <TrendingDown className="h-4 w-4 text-rose-500" />}
                            {entry.trend === "stable" && <span className="h-1.5 w-3 bg-slate-300 dark:bg-slate-700 rounded-full" />}
                          </div>

                          {/* Score and Tier */}
                          <div className="text-right space-y-1">
                            <p className="text-base font-black text-slate-900 dark:text-slate-100">
                              {entry.score}<span className="text-3xs text-slate-400">/100</span>
                            </p>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getTierBadgeStyle(entry.tier)}`}>
                              Tier {entry.tier}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>

          {/* DETAIL BREAKDOWN PANEL */}
          <div className="space-y-6">
            {selectedInst ? (
              <Card className="border border-slate-200 dark:border-slate-800/80 sticky top-4">
                <CardHeader className="border-b border-slate-100 dark:border-slate-850 pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Institution Details</CardTitle>
                      <h2 className="text-base font-black text-slate-900 dark:text-white mt-1 leading-snug">{selectedInst.name}</h2>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-widest ${getTierBadgeStyle(selectedInst.tier)}`}>
                      Tier {selectedInst.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-2xs font-semibold text-slate-400 mt-2">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{selectedInst.category} • {selectedInst.city}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6 pt-4">
                  {/* Total score ring */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-250/20 dark:border-slate-850 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest">Calculated Score</h4>
                      <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-0.5">Transparent Deterministic Audit</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{selectedInst.readiness_score}</span>
                      <span className="text-2xs text-slate-400 font-bold">/100</span>
                    </div>
                  </div>

                  {/* Components Breakdown */}
                  {selectedInst.breakdown && (
                    <div className="space-y-3.5">
                      <h3 className="text-2xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <Calculator className="h-3.5 w-3.5" /> Core Scoring Components
                      </h3>

                      <div className="space-y-2 text-2xs font-bold text-slate-650 dark:text-slate-350">
                        {[
                          { label: "Staff Training", score: selectedInst.breakdown.staff_training || 0, max: 20 },
                          { label: "Service Accessibility", score: selectedInst.breakdown.service_accessibility || 0, max: 20 },
                          { label: "ISL Resource Hub", score: selectedInst.breakdown.isl_resources || 0, max: 15 },
                          { label: "Emergency Readiness", score: selectedInst.breakdown.emergency_readiness || 0, max: 15 },
                          { label: "Learning Participation", score: selectedInst.breakdown.learning_participation || 0, max: 10 },
                          { label: "User Feedback", score: selectedInst.breakdown.user_feedback || 0, max: 10 },
                          { label: "Accessibility Audit", score: selectedInst.breakdown.accessibility_audit || 0, max: 10 },
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px]">
                              <span>{item.label}</span>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100">{item.score} <span className="text-[8px] text-slate-400 font-normal">/ {item.max}</span></span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-teal-600 dark:bg-teal-500 h-full rounded-full transition-all"
                                style={{ width: `${(item.score / item.max) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="space-y-3">
                    <h3 className="text-2xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Smart Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {selectedInst.recommendations?.map((rec, idx) => (
                        <li key={idx} className="text-3xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-850 flex gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                      {(!selectedInst.recommendations || selectedInst.recommendations.length === 0) && (
                        <li className="text-3xs font-bold text-emerald-500 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl text-center">
                          🎉 Perfect score! This institution meets all accessibility benchmarks.
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-slate-200 dark:border-slate-800/80 p-6 text-center space-y-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                  <Info className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Select an Institution</h3>
                <p className="text-2xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                  Click on any institution card to view its audit score breakdown, components rating, and accessibility improvements checklist.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <Card className="border border-slate-200 dark:border-slate-800/80 max-w-3xl mx-auto">
          <CardHeader className="border-b border-slate-100 dark:border-slate-850 pb-4">
            <CardTitle className="text-sm uppercase tracking-wider font-extrabold text-slate-400">Institutional Self-Audit Portal</CardTitle>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">Submit ISL-Ready Certification</h2>
            <p className="text-2xs font-semibold text-slate-400 mt-1 leading-relaxed">
              Complete the self-evaluation checklist below. Your scores will be calculated deterministically and verified by audit logs prior to index publication.
            </p>
          </CardHeader>
          
          <CardContent className="pt-6">
            {successMessage ? (
              <div className="p-8 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <Check className="h-8 w-8" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Audit Submitted!</h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {successMessage}
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-6">
                
                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-3xs font-extrabold uppercase tracking-widest text-slate-400">Institution Name</label>
                    <input
                      type="text"
                      placeholder="e.g. KP Gujarat Hospital"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full text-2xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-3xs font-extrabold uppercase tracking-widest text-slate-400">Category</label>
                    <select
                      value={regCategory}
                      onChange={(e) => setRegCategory(e.target.value)}
                      className="w-full text-2xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                    >
                      <option value="healthcare">Healthcare (Hospitals)</option>
                      <option value="education">Education (Colleges)</option>
                      <option value="corporate">Corporate (Companies)</option>
                      <option value="civic">Civic (Government Offices)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-3xs font-extrabold uppercase tracking-widest text-slate-400">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Vadodara"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="w-full text-2xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                    />
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-850" />

                {/* Audit Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Binary Switches */}
                  <div className="space-y-4">
                    <h3 className="text-2xs font-black uppercase tracking-widest text-slate-500">Service Accessibility (Max 20 XP)</h3>
                    
                    <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-250/20 dark:border-slate-850 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasInterpreters}
                        onChange={(e) => setHasInterpreters(e.target.checked)}
                        className="h-4 w-4 text-teal-600 accent-teal-600 rounded"
                      />
                      <div>
                        <p className="text-2xs font-bold text-slate-900 dark:text-slate-200">On-site Certified ISL Interpreters (10 XP)</p>
                        <p className="text-[9px] text-slate-400 font-semibold">Trained counters or on-call helpdesks are available.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-250/20 dark:border-slate-850 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasVrs}
                        onChange={(e) => setHasVrs(e.target.checked)}
                        className="h-4 w-4 text-teal-600 accent-teal-600 rounded"
                      />
                      <div>
                        <p className="text-2xs font-bold text-slate-900 dark:text-slate-200">Video Relay Kiosk Services (VRS) (10 XP)</p>
                        <p className="text-[9px] text-slate-400 font-semibold">Remote digital interpreters available on tablet/screen.</p>
                      </div>
                    </label>

                    <hr className="border-slate-100 dark:border-slate-850" />

                    <h3 className="text-2xs font-black uppercase tracking-widest text-slate-500">Staff Training (Max 20 XP)</h3>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-2xs font-bold">
                        <label>Trained Staff Percentage: {staffTrained}%</label>
                        <span className="text-teal-600">+{Math.min(20, Math.floor((staffTrained * 20) / 100))} Score</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={staffTrained}
                        onChange={(e) => setStaffTrained(parseInt(e.target.value))}
                        className="w-full accent-teal-600"
                      />
                      <p className="text-[9px] text-slate-400 font-semibold">Percentage of front-desk and support staff with everyday ISL certifications.</p>
                    </div>
                  </div>

                  {/* Quantitative Ratings */}
                  <div className="space-y-4">
                    <h3 className="text-2xs font-black uppercase tracking-widest text-slate-500">Resource and Auditing Scores</h3>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-2xs font-bold">
                        <label>ISL Resources & Signs Score: {resourcesScore}/15</label>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={resourcesScore}
                        onChange={(e) => setResourcesScore(parseInt(e.target.value))}
                        className="w-full accent-teal-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-2xs font-bold">
                        <label>Emergency Readiness Checklist: {emergencyScore}/15</label>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={emergencyScore}
                        onChange={(e) => setEmergencyScore(parseInt(e.target.value))}
                        className="w-full accent-teal-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-2xs font-bold">
                        <label>Staff Learning Participation: {participationScore}/10</label>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={participationScore}
                        onChange={(e) => setParticipationScore(parseInt(e.target.value))}
                        className="w-full accent-teal-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-2xs font-bold">
                        <label>User Rating / Beneficiary Feedback: {feedbackScore}/10</label>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={feedbackScore}
                        onChange={(e) => setFeedbackScore(parseInt(e.target.value))}
                        className="w-full accent-teal-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-2xs font-bold">
                        <label>Accessibility Audit/Signage Score: {auditScore}/10</label>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={auditScore}
                        onChange={(e) => setAuditScore(parseInt(e.target.value))}
                        className="w-full accent-teal-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Score Preview Panel */}
                {evaluationPreview && (
                  <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-2xs font-black uppercase tracking-widest text-teal-400">Evaluation Engine Preview</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Calculated dynamically based on standard audit model.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-white">{evaluationPreview.score}</span>
                        <span className="text-2xs text-slate-400 font-bold">/100</span>
                        <span className={`ml-3 px-2 py-0.5 rounded text-2xs font-black uppercase tracking-wider ${getTierBadgeStyle(evaluationPreview.tier)}`}>
                          Tier {evaluationPreview.tier}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-center border-t border-slate-850 pt-4">
                      {[
                        { label: "Staff Tr.", val: evaluationPreview.breakdown.staff_training, max: 20 },
                        { label: "Srv. Acc.", val: evaluationPreview.breakdown.service_accessibility, max: 20 },
                        { label: "ISL Res.", val: evaluationPreview.breakdown.isl_resources, max: 15 },
                        { label: "Emergency", val: evaluationPreview.breakdown.emergency_readiness, max: 15 },
                        { label: "Learning", val: evaluationPreview.breakdown.learning_participation, max: 10 },
                        { label: "Feedback", val: evaluationPreview.breakdown.user_feedback, max: 10 },
                        { label: "Auditing", val: evaluationPreview.breakdown.accessibility_audit, max: 10 },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-950 p-2 rounded-xl border border-slate-850 space-y-0.5">
                          <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">{item.label}</p>
                          <p className="text-xs font-black text-slate-200">{item.val}<span className="text-[8px] text-slate-500 font-normal">/{item.max}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-black py-2.5 px-6 rounded-xl shadow-lg shadow-teal-500/10"
                  >
                    {submitting ? "Submitting..." : "Submit Audit & Register"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "admin" && (
        <Card className="border border-slate-200 dark:border-slate-800/80 max-w-4xl mx-auto">
          <CardHeader className="border-b border-slate-100 dark:border-slate-850 pb-4">
            <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Administrator Console</CardTitle>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">Audit Verification Panel</h2>
            <p className="text-2xs font-semibold text-slate-400 mt-1 leading-relaxed">
              Verify self-evaluation submittals from registered public institutions and award the verified badge to publish their readiness index scores.
            </p>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="space-y-4">
              {safeIndexItems.filter(item => !item?.is_verified).length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                    <Check className="h-5 w-5" />
                  </div>
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">All caught up!</h3>
                  <p className="text-2xs font-semibold text-slate-500 dark:text-slate-400">There are no pending unverified institution registration audits at this time.</p>
                </div>
              ) : (
                safeIndexItems
                  .filter(item => !item?.is_verified)
                  .map((item) => (
                    <div 
                      key={item.id} 
                      className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">{item.name}</h4>
                        <p className="text-3xs text-slate-400 font-bold uppercase tracking-wider">{item.category} • {item.city}</p>
                        
                        <div className="flex gap-4 mt-2">
                          <span className="text-[10px] font-bold text-slate-650 dark:text-slate-350">
                            Readiness Score: <span className="font-black text-teal-600 dark:text-teal-400">{item.readiness_score}/100</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-650 dark:text-slate-350">
                            Tier: <span className="font-black text-teal-600 dark:text-teal-400">{item.tier}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => handleVerify(item.id)}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-2xs font-extrabold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5"
                        >
                          <Check className="h-3 w-3" /> Approve Audit
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
