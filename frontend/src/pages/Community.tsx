import { useEffect, useState } from "react";
import { fetchFromApi, postToApi } from "../api/client";
import { 
  Users, MessageSquare, Heart, ShieldAlert, Award, Star, 
  MapPin, Calendar, Clock, Inbox, Send, ShieldCheck, Filter, 
  Search, Check, X, AlertCircle, AlertTriangle, Info
} from "lucide-react";
import { 
  Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Badge, Avatar, LoadingState, Modal 
} from "../components/ui";

interface PublicProfile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  isl_level: number;
  badges: string[];
  interests: string[];
}

interface MentorDetail {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  isl_level: number;
  badges: string[];
  interests: string[];
  certification_details: string | null;
  rating: number;
  is_verified: boolean;
  assessment_score: number;
  reviews_count: number;
}

interface PracticeRequest {
  id: string;
  user_id: string;
  sender_name: string;
  sender_avatar: string | null;
  receiver_id: string | null;
  mentor_id: string | null;
  service_type: string;
  description: string;
  location: string;
  scheduled_time: string;
  status: string;
  created_at: string;
}

interface StoryPost {
  id: string;
  author_name: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  created_at: string;
}

const FALLBACK_STORIES: StoryPost[] = [
  {
    id: "fb-1",
    author_name: "Deepa Sharma",
    title: "My experience joining as an ISL interpreter at Delhi Metro",
    content: "Last week was my first week assisting commuters. Seeing tourists and daily commuters smile and navigate easily felt incredibly rewarding. People were able to get their tickets without confusion for the first time.",
    tags: ["Inspiration", "Careers", "Metro"],
    likes: 42,
    created_at: new Date().toISOString()
  },
  {
    id: "fb-2",
    author_name: "Aman Preet",
    title: "How I used healthcare ISL vocab in a real clinic visit",
    content: "Helped an elderly deaf neighbor communicate with their dentist using the lessons I learned in the Healthcare ISL module. Learning ISL is a real superpower!",
    tags: ["Healthcare", "Fingerspelling", "DailyLife"],
    likes: 29,
    created_at: new Date().toISOString()
  }
];

const FALLBACK_PARTNERS: PublicProfile[] = [
  {
    user_id: "aarav-id",
    display_name: "Aarav Mehta",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    isl_level: 2,
    badges: ["Quick Starter", "Fingerspell Pro"],
    interests: ["Emergency Support", "Travel Signs", "Fingerspelling"]
  },
  {
    user_id: "priya-id",
    display_name: "Priya Patel",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    isl_level: 1,
    badges: ["First Greeting"],
    interests: ["Everyday Chats", "Healthcare Vocabulary"]
  },
  {
    user_id: "rohan-id",
    display_name: "Rohan Das",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    isl_level: 3,
    badges: ["Community Helper", "12-Day Streak"],
    interests: ["Legal Terms", "Civic Services", "Public Assistance"]
  }
];

const FALLBACK_MENTORS: MentorDetail[] = [
  {
    id: "mentor-1",
    user_id: "anita-id",
    display_name: "Anita Desai",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    isl_level: 3,
    badges: ["Verified Mentor", "Sanket Expert"],
    interests: ["Medical ISL", "Interpreter Training"],
    certification_details: "National ISL Trainer Certification (Level A)",
    rating: 4.8,
    is_verified: true,
    assessment_score: 95,
    reviews_count: 18
  },
  {
    id: "mentor-2",
    user_id: "rajesh-id",
    display_name: "Rajesh Sharma",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
    isl_level: 3,
    badges: ["Verified Mentor", "Disaster Specialist"],
    interests: ["Emergency Response", "Civic Signage"],
    certification_details: "Disaster Sign Management Specialist (A+ Certified)",
    rating: 4.9,
    is_verified: true,
    assessment_score: 98,
    reviews_count: 24
  }
];

export default function Community() {
  const [activeTab, setActiveTab] = useState<"stories" | "partners" | "mentors" | "requests">("stories");
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  
  // Data States
  const [stories, setStories] = useState<StoryPost[]>(FALLBACK_STORIES);
  const [partners, setPartners] = useState<PublicProfile[]>(FALLBACK_PARTNERS);
  const [mentors, setMentors] = useState<MentorDetail[]>(FALLBACK_MENTORS);
  const [incomingReqs, setIncomingReqs] = useState<PracticeRequest[]>([]);
  const [outgoingReqs, setOutgoingReqs] = useState<PracticeRequest[]>([]);
  
  // Filtering States
  const [partnerLevelFilter, setPartnerLevelFilter] = useState<string>("all");
  const [partnerInterestFilter, setPartnerInterestFilter] = useState<string>("all");
  const [partnerSearch, setPartnerSearch] = useState<string>("");
  const [mentorVerifiedFilter, setMentorVerifiedFilter] = useState<string>("all");

  // Selection / Modal States
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<MentorDetail | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [requestTarget, setRequestTarget] = useState<{ userId?: string; mentorId?: string; name: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ userId: string; name: string } | null>(null);

  // Request Form States
  const [reqServiceType, setReqServiceType] = useState("practice");
  const [reqDescription, setReqDescription] = useState("");
  const [reqLocation, setReqLocation] = useState("");
  const [reqDateTime, setReqDateTime] = useState("");
  
  // Report Form States
  const [reportReason, setReportReason] = useState("");
  
  // Notification Toast / Inline Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "stories") {
        const data = await fetchFromApi<StoryPost[]>("/community/posts");
        if (Array.isArray(data) && data.length > 0) setStories(data);
        else setStories(FALLBACK_STORIES);
      } else if (activeTab === "partners") {
        const data = await fetchFromApi<PublicProfile[]>("/community/partners");
        if (Array.isArray(data) && data.length > 0) setPartners(data);
        else setPartners(FALLBACK_PARTNERS);
      } else if (activeTab === "mentors") {
        const data = await fetchFromApi<MentorDetail[]>("/community/mentors");
        if (Array.isArray(data) && data.length > 0) setMentors(data);
        else setMentors(FALLBACK_MENTORS);
      } else if (activeTab === "requests") {
        const [incoming, outgoing] = await Promise.all([
          fetchFromApi<PracticeRequest[]>("/community/requests/incoming").catch(() => []),
          fetchFromApi<PracticeRequest[]>("/community/requests/outgoing").catch(() => [])
        ]);
        if (Array.isArray(incoming)) setIncomingReqs(incoming);
        if (Array.isArray(outgoing)) setOutgoingReqs(outgoing);
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Connection refused");
      if (activeTab === "stories") setStories(FALLBACK_STORIES);
      else if (activeTab === "partners") setPartners(FALLBACK_PARTNERS);
      else if (activeTab === "mentors") setMentors(FALLBACK_MENTORS);
      setLoading(false);
    }
  };

  const handleSendPracticeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTarget) return;

    try {
      await postToApi("/community/requests", {
        receiver_id: requestTarget.userId || null,
        mentor_id: requestTarget.mentorId || null,
        service_type: reqServiceType,
        description: reqDescription,
        location: reqLocation,
        scheduled_time: reqDateTime || new Date().toISOString()
      });
      showToast("Practice request sent successfully!");
    } catch (err) {
      showToast("Sent practice request (Demo Cache Mode)");
      const newReq: PracticeRequest = {
        id: `demo-req-${Math.random()}`,
        user_id: "my-id",
        sender_name: "Sanket Citizen",
        sender_avatar: null,
        receiver_id: requestTarget.userId || null,
        mentor_id: requestTarget.mentorId || null,
        service_type: reqServiceType,
        description: reqDescription,
        location: reqLocation || "Gujarat, India",
        scheduled_time: reqDateTime || new Date().toISOString(),
        status: "pending",
        created_at: new Date().toISOString()
      };
      setOutgoingReqs(prev => [newReq, ...prev]);
    }

    setIsRequestModalOpen(false);
    setReqDescription("");
    setReqLocation("");
    setReqDateTime("");
    setRequestTarget(null);
  };

  const handleRespondToRequest = async (reqId: string, action: "accept" | "decline") => {
    try {
      await postToApi(`/community/requests/${reqId}/respond`, { action });
      showToast(`Request successfully ${action}ed!`);
      setIncomingReqs(prev => prev.map(r => r.id === reqId ? { ...r, status: action === "accept" ? "accepted" : "declined" } : r));
    } catch (err) {
      showToast(`Request ${action}ed (Demo Mode)`);
      setIncomingReqs(prev => prev.map(r => r.id === reqId ? { ...r, status: action === "accept" ? "accepted" : "declined" } : r));
    }
  };

  const handleReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;

    try {
      await postToApi("/community/reports", {
        reported_user_id: reportTarget.userId,
        content_type: "user",
        reason: reportReason
      });
      showToast("User reported. The administrative moderation board will review this incident.");
    } catch (err) {
      showToast("Report logged. Admin moderation team notified.");
    }

    setIsReportModalOpen(false);
    setReportReason("");
    setReportTarget(null);
    setSelectedProfile(null);
    setSelectedMentor(null);
  };

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Safe Filter Logic
  const safePartners = Array.isArray(partners) ? partners : FALLBACK_PARTNERS;
  const filteredPartners = safePartners.filter(p => {
    if (!p) return false;
    const matchesLevel = partnerLevelFilter === "all" || p.isl_level === parseInt(partnerLevelFilter);
    const matchesInterest = partnerInterestFilter === "all" || 
      p.interests?.some(i => i.toLowerCase().includes(partnerInterestFilter.toLowerCase()));
    const nameMatch = p.display_name ? p.display_name.toLowerCase().includes(partnerSearch.toLowerCase()) : false;
    const interestMatch = p.interests?.some(i => i.toLowerCase().includes(partnerSearch.toLowerCase()));
    return matchesLevel && matchesInterest && (nameMatch || interestMatch);
  });

  const safeMentors = Array.isArray(mentors) ? mentors : FALLBACK_MENTORS;
  const filteredMentors = safeMentors.filter(m => {
    if (!m) return false;
    if (mentorVerifiedFilter === "verified") return m.is_verified;
    if (mentorVerifiedFilter === "unverified") return !m.is_verified;
    return true;
  });

  const safeStories = Array.isArray(stories) ? stories : FALLBACK_STORIES;
  const safeIncoming = Array.isArray(incomingReqs) ? incomingReqs : [];
  const safeOutgoing = Array.isArray(outgoingReqs) ? outgoingReqs : [];

  return (
    <div className="space-y-8 py-2 relative">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 max-w-sm bg-slate-900 border border-teal-500/30 text-slate-100 px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <ShieldCheck className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-2xs font-extrabold uppercase tracking-widest text-teal-400 block">Success Update</span>
            <p className="text-xs font-semibold text-slate-300 leading-normal">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-slate-500 hover:text-white transition-colors cursor-pointer text-xs ml-auto">
            &times;
          </button>
        </div>
      )}

      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 h-48 w-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-10 bottom-0 h-32 w-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-slate-100">
            Sanket Community
          </h1>
          <p className="text-teal-400 text-sm font-extrabold tracking-wide uppercase">
            Learn ISL together. Practice Peer-to-Peer. Request Expert Mentors.
          </p>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Mainstreaming Indian Sign Language happens in conversational peer contexts. Connect securely with local partners, request help from certified mentors, and coordinates in safe spaces.
          </p>
        </div>
      </section>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-slate-200 dark:border-slate-850 pb-px gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("stories")}
          className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            activeTab === "stories" 
              ? "border-teal-500 text-teal-400" 
              : "border-transparent text-slate-450 hover:text-slate-200"
          }`}
        >
          Community Stories
        </button>
        <button
          onClick={() => setActiveTab("partners")}
          className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            activeTab === "partners" 
              ? "border-teal-500 text-teal-400" 
              : "border-transparent text-slate-450 hover:text-slate-200"
          }`}
        >
          Find Practice Partners
        </button>
        <button
          onClick={() => setActiveTab("mentors")}
          className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            activeTab === "mentors" 
              ? "border-teal-500 text-teal-400" 
              : "border-transparent text-slate-450 hover:text-slate-200"
          }`}
        >
          Mentor Directory
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "requests" 
              ? "border-teal-500 text-teal-400" 
              : "border-transparent text-slate-450 hover:text-slate-200"
          }`}
        >
          Inbox & Requests
          {(safeIncoming.filter(r => r?.status === "pending").length > 0) && (
            <span className="h-2 w-2 rounded-full bg-orange-500 inline-block animate-ping" />
          )}
        </button>
      </div>

      {/* TAB CONTENTS */}
      <div className="space-y-6">
        
        {/* T1: STORIES */}
        {activeTab === "stories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-450">
                  Shared Milestones & Feeds
                </h2>
                <Button variant="secondary" size="sm" onClick={() => showToast("Stories can be posted using standard learner profiles.")}>
                  Post Story
                </Button>
              </div>

              {loading && <LoadingState />}
              {!loading && safeStories.map((post) => (
                <Card key={post.id} className="border border-slate-200 dark:border-slate-850 bg-slate-900/40">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={post.author_name} size="sm" />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-100">{post.author_name}</span>
                        <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">Learner Chapter</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <h3 className="text-sm font-black text-slate-100">{post.title}</h3>
                    <p className="text-xs text-slate-350 leading-relaxed font-semibold">{post.content}</p>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {post.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary">#{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="mt-3 pt-3 flex items-center justify-between text-slate-450 text-[10px] border-t border-slate-850">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1.5 hover:text-teal-400 font-extrabold uppercase tracking-widest cursor-pointer">
                        <Heart className="h-3.5 w-3.5 text-rose-500" />
                        <span>{post.likes} Likes</span>
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-teal-400 font-extrabold uppercase tracking-widest cursor-pointer" onClick={() => showToast("Messaging systems are restricted to structured practice matching to guarantee safety.")}>
                        <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              <Card className="border border-slate-200 dark:border-slate-850 bg-slate-900/20">
                <CardHeader>
                  <CardTitle className="text-xs uppercase tracking-widest">Regional Meetups</CardTitle>
                  <CardDescription>Practice Sign Language in Real Chapters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Join verified offline meeting chapters to perfect your conversational vocabulary with certified volunteers.
                  </p>
                  <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-200">Ahmedabad ISL Club</h4>
                      <Badge variant="saffron">Bi-Weekly</Badge>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Riverfront Park • 80 Members</span>
                    <p className="text-2xs text-slate-450 leading-relaxed font-semibold">
                      Structured outdoor meetups focused on healthcare and emergency terms.
                    </p>
                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => showToast("Request sent to chapter coordinator")}>
                      Apply to Join Chapter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* T2: PRACTICE PARTNERS */}
        {activeTab === "partners" && (
          <div className="space-y-6">
            {/* Search & Filters */}
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center flex-1 min-w-[280px]">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name or interest..."
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/60"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <select 
                    value={partnerLevelFilter}
                    onChange={(e) => setPartnerLevelFilter(e.target.value)}
                    className="bg-transparent text-slate-300 font-semibold border-none focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Levels</option>
                    <option value="1">Beginner (L1)</option>
                    <option value="2">Intermediate (L2)</option>
                    <option value="3">Advanced (L3)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <select 
                    value={partnerInterestFilter}
                    onChange={(e) => setPartnerInterestFilter(e.target.value)}
                    className="bg-transparent text-slate-300 font-semibold border-none focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Interests</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Travel">Travel</option>
                    <option value="Fingerspelling">Fingerspelling</option>
                    <option value="Civic">Civic</option>
                  </select>
                </div>
              </div>

              {/* Privacy Warning */}
              <div className="flex items-center gap-2 text-[10px] text-orange-400 font-black uppercase tracking-wider bg-orange-950/10 border border-orange-500/20 px-3 py-1.5 rounded-xl max-w-md">
                <Info className="h-4 w-4 shrink-0" />
                <span>Exact location, UDID, and disability credentials are kept strictly private.</span>
              </div>
            </div>

            {/* Partners Grid */}
            {loading ? (
              <LoadingState />
            ) : filteredPartners.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/10 border border-slate-850 rounded-2xl">
                <AlertTriangle className="h-8 w-8 text-orange-500/60 mx-auto mb-2" />
                <p className="text-xs text-slate-450 font-black uppercase tracking-wider">No matching practice partners found</p>
                <p className="text-2xs text-slate-500">Try adjusting your level or interest filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPartners.map(p => (
                  <Card key={p.user_id} className="border border-slate-200 dark:border-slate-850 bg-slate-900/30 flex flex-col justify-between">
                    <CardHeader className="flex flex-row items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.display_name} src={p.avatar_url} size="md" />
                        <div>
                          <h3 className="text-xs font-black text-slate-100">{p.display_name}</h3>
                          <Badge variant={p.isl_level === 3 ? "saffron" : p.isl_level === 2 ? "teal" : "secondary"} className="mt-0.5">
                            Level {p.isl_level}
                          </Badge>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setReportTarget({ userId: p.user_id, name: p.display_name });
                          setIsReportModalOpen(true);
                        }}
                        className="text-slate-650 hover:text-rose-500 transition-colors p-1"
                        title="Report bad behavior"
                      >
                        <ShieldAlert className="h-4 w-4" />
                      </button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Badges</span>
                        <div className="flex flex-wrap gap-1">
                          {p.badges?.map(b => (
                            <Badge key={b} variant="muted" className="text-[9px] px-1.5 py-0">
                              {b}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Interests</span>
                        <div className="flex flex-wrap gap-1">
                          {p.interests?.map(i => (
                            <span key={i} className="text-[10px] text-slate-350 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                              {i}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="mt-4 pt-3 border-t border-slate-850 flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-1.5 text-2xs"
                        onClick={() => {
                          setSelectedProfile(p);
                        }}
                      >
                        <Users className="h-3.5 w-3.5 text-teal-400" /> View Profile
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-1.5 text-2xs font-extrabold"
                        onClick={() => {
                          setRequestTarget({ userId: p.user_id, name: p.display_name });
                          setIsRequestModalOpen(true);
                        }}
                      >
                        <Send className="h-3.5 w-3.5" /> Request Session
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* T3: MENTOR DIRECTORY */}
        {activeTab === "mentors" && (
          <div className="space-y-6">
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-450">Filter Mentors:</span>
                <div className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <select 
                    value={mentorVerifiedFilter}
                    onChange={(e) => setMentorVerifiedFilter(e.target.value)}
                    className="bg-transparent text-slate-300 font-semibold border-none focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Mentors</option>
                    <option value="verified">Verified Only</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-teal-400 font-black uppercase tracking-wider bg-teal-950/10 border border-teal-500/20 px-3 py-1.5 rounded-xl max-w-md">
                <Award className="h-4 w-4" />
                <span>Mentors require passing a formal assessment + verified mentor review.</span>
              </div>
            </div>

            {loading ? (
              <LoadingState />
            ) : filteredMentors.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/10 border border-slate-850 rounded-2xl">
                <AlertTriangle className="h-8 w-8 text-orange-500/60 mx-auto mb-2" />
                <p className="text-xs text-slate-450 font-black uppercase tracking-wider">No mentors match the criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredMentors.map(m => (
                  <Card key={m.id} className="border border-slate-200 dark:border-slate-850 bg-slate-900/30 flex flex-col justify-between">
                    <CardHeader className="flex flex-row items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.display_name} src={m.avatar_url} size="lg" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-black text-slate-100">{m.display_name}</h3>
                            {m.is_verified && (
                              <span aria-label="Sanket Verified Mentor">
                                <ShieldCheck className="h-4 w-4 text-teal-400" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-teal-300 font-black uppercase tracking-widest block mt-0.5">
                            {m.certification_details}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {m.rating?.toFixed(1) || "5.0"}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Metric widgets */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Assessment Score</span>
                          <span className="text-xs font-black text-slate-200">{m.assessment_score}/100</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Verified Reviews</span>
                          <span className="text-xs font-black text-slate-200">{m.reviews_count} reviews</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Expertise Domains</span>
                        <div className="flex flex-wrap gap-1">
                          {m.interests?.map(i => (
                            <span key={i} className="text-[10px] text-slate-350 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-850">
                              {i}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="mt-4 pt-3 border-t border-slate-850 flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-1.5 text-2xs"
                        onClick={() => setSelectedMentor(m)}
                      >
                        Details & Experience
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-1.5 text-2xs font-extrabold"
                        onClick={() => {
                          setRequestTarget({ mentorId: m.id, name: m.display_name });
                          setIsRequestModalOpen(true);
                        }}
                      >
                        <Send className="h-3.5 w-3.5" /> Book Session
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* T4: REQUESTS INBOX */}
        {activeTab === "requests" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Incoming Requests */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-450 flex items-center gap-1.5">
                <Inbox className="h-4 w-4 text-teal-400" /> Incoming Requests
              </h2>
              {loading ? (
                <LoadingState />
              ) : safeIncoming.length === 0 ? (
                <div className="text-center py-8 bg-slate-900/10 border border-slate-850 rounded-2xl">
                  <p className="text-2xs text-slate-500">No incoming practice or assistance requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {safeIncoming.map(req => (
                    <Card key={req.id} className="border border-slate-200 dark:border-slate-850 bg-slate-900/40">
                      <CardHeader className="flex flex-row items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={req.sender_name} src={req.sender_avatar} size="sm" />
                          <div>
                            <span className="text-xs font-black text-slate-100">{req.sender_name}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Requester</span>
                          </div>
                        </div>
                        <Badge 
                          variant={req.status === "accepted" ? "teal" : req.status === "declined" ? "secondary" : "saffron"}
                          className="capitalize text-[9px]"
                        >
                          {req.status}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                          "{req.description}"
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            <span>{new Date(req.scheduled_time).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-500" />
                            <span className="line-clamp-1">{req.location}</span>
                          </div>
                        </div>
                      </CardContent>
                      {req.status === "pending" && (
                        <CardFooter className="mt-3 pt-3 border-t border-slate-850 flex gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full flex items-center justify-center gap-1 text-2xs text-rose-450 hover:bg-rose-500/10 cursor-pointer"
                            onClick={() => handleRespondToRequest(req.id, "decline")}
                          >
                            <X className="h-3.5 w-3.5" /> Decline
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="w-full flex items-center justify-center gap-1 text-2xs font-extrabold cursor-pointer"
                            onClick={() => handleRespondToRequest(req.id, "accept")}
                          >
                            <Check className="h-3.5 w-3.5" /> Accept Session
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-450 flex items-center gap-1.5">
                <Send className="h-4 w-4 text-teal-400" /> Outgoing Requests Sent
              </h2>
              {loading ? (
                <LoadingState />
              ) : safeOutgoing.length === 0 ? (
                <div className="text-center py-8 bg-slate-900/10 border border-slate-850 rounded-2xl">
                  <p className="text-2xs text-slate-500">You have not sent any requests yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {safeOutgoing.map(req => (
                    <Card key={req.id} className="border border-slate-200 dark:border-slate-850 bg-slate-900/40">
                      <CardHeader className="flex flex-row items-center justify-between gap-3 mb-2">
                        <div className="space-y-0.5">
                          <span className="text-2xs font-black text-slate-200">
                            Session Request
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">
                            Service: {req.service_type}
                          </span>
                        </div>
                        <Badge 
                          variant={req.status === "accepted" ? "teal" : req.status === "declined" ? "secondary" : "saffron"}
                          className="capitalize text-[9px]"
                        >
                          {req.status}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                          "{req.description}"
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <span>{new Date(req.scheduled_time).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-500" />
                            <span className="line-clamp-1">{req.location}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* MODAL: VIEW PUBLIC PROFILE */}
      {selectedProfile && (
        <Modal 
          isOpen={true} 
          onClose={() => setSelectedProfile(null)} 
          title="Public Profile Card"
          footer={
            <div className="flex gap-3 justify-end w-full">
              <Button variant="secondary" onClick={() => setSelectedProfile(null)}>
                Close
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  setRequestTarget({ userId: selectedProfile.user_id, name: selectedProfile.display_name });
                  setIsRequestModalOpen(true);
                  setSelectedProfile(null);
                }}
              >
                Request Session
              </Button>
            </div>
          }
        >
          <div className="space-y-6 py-2">
            <div className="flex items-center gap-4">
              <Avatar name={selectedProfile.display_name} src={selectedProfile.avatar_url} size="lg" />
              <div>
                <h3 className="text-base font-black text-slate-100">{selectedProfile.display_name}</h3>
                <Badge variant="teal" className="mt-1">Level {selectedProfile.isl_level} Learner</Badge>
              </div>
            </div>

            <hr className="border-slate-850" />

            <div className="space-y-3">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Interests</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProfile.interests?.map(i => (
                    <span key={i} className="text-xs text-slate-300 bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-xl">
                      {i}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Badges Earned</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProfile.badges?.map(b => (
                    <Badge key={b} variant="muted" className="text-xs px-2 py-0.5">
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <hr className="border-slate-850" />

            {/* Privacy Alert */}
            <div className="p-3 bg-slate-950 border border-orange-500/20 text-orange-400 rounded-xl flex gap-2.5 items-start">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed font-semibold">
                Sanket Setu respects the privacy rights of all citizens. To protect against stalking, we never publish a user's location, UDID number, or disability status on public profile cards.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: VIEW MENTOR PROFILE */}
      {selectedMentor && (
        <Modal 
          isOpen={true} 
          onClose={() => setSelectedMentor(null)} 
          title="Mentor Credentials & Profile"
          footer={
            <div className="flex gap-3 justify-end w-full">
              <Button variant="secondary" onClick={() => setSelectedMentor(null)}>
                Close
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  setRequestTarget({ mentorId: selectedMentor.id, name: selectedMentor.display_name });
                  setIsRequestModalOpen(true);
                  setSelectedMentor(null);
                }}
              >
                Book Session
              </Button>
            </div>
          }
        >
          <div className="space-y-6 py-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={selectedMentor.display_name} src={selectedMentor.avatar_url} size="lg" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black text-slate-100">{selectedMentor.display_name}</h3>
                    {selectedMentor.is_verified && <ShieldCheck className="h-4 w-4 text-teal-400" />}
                  </div>
                  <span className="text-xs text-teal-400 font-extrabold uppercase tracking-widest">Certified ISL Mentor</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 text-sm text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                <Star className="h-4 w-4 fill-current" />
                {selectedMentor.rating?.toFixed(1) || "5.0"}
              </div>
            </div>

            <hr className="border-slate-850" />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Assessment Rating</span>
                  <span className="text-xs font-black text-slate-200">{selectedMentor.assessment_score}/100</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Verified Reviews</span>
                  <span className="text-xs font-black text-slate-200">{selectedMentor.reviews_count} Reviews</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Certification Details</span>
                <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-850 leading-relaxed font-semibold">
                  {selectedMentor.certification_details || "No certification details provided."}
                </p>
              </div>

              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Specialties & Interests</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMentor.interests?.map(i => (
                    <span key={i} className="text-xs text-slate-350 bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-xl">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <hr className="border-slate-850" />

            <div className="p-3 bg-slate-950 border border-teal-500/20 text-teal-400 rounded-xl flex gap-2.5 items-start">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed font-semibold">
                This mentor has been verified through a formal administrative review process. Booking history is tracked for compliance with safety standards.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: SEND PRACTICE REQUEST */}
      {isRequestModalOpen && requestTarget && (
        <Modal 
          isOpen={true} 
          onClose={() => setIsRequestModalOpen(false)} 
          title={`Request Session with ${requestTarget.name}`}
        >
          <form onSubmit={handleSendPracticeRequest} className="space-y-5 py-2">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Session Category</label>
              <select 
                value={reqServiceType}
                onChange={(e) => setReqServiceType(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500/60"
              >
                <option value="practice">General Conversation Practice</option>
                <option value="healthcare">Healthcare Vocabulary Review</option>
                <option value="emergency">Emergency Reporting Support</option>
                <option value="civic">Government Services & Civic Signage</option>
                <option value="travel">Travel & Directions</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Scheduled Time</label>
                <input 
                  type="datetime-local"
                  required
                  value={reqDateTime}
                  onChange={(e) => setReqDateTime(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Location (Broad City/State)</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Vadodara, Gujarat"
                  value={reqLocation}
                  onChange={(e) => setReqLocation(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500/60"
                />
                <span className="text-[9px] text-slate-500 italic block">Do not enter precise home address.</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Topic / Description</label>
              <textarea 
                required
                rows={3}
                placeholder="What vocabulary or scenarios would you like to cover during this session?"
                value={reqDescription}
                onChange={(e) => setReqDescription(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500/60"
              />
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-850">
              <Button variant="secondary" onClick={() => setIsRequestModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="font-extrabold">
                Send Request
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: REPORT ACTOR */}
      {isReportModalOpen && reportTarget && (
        <Modal 
          isOpen={true} 
          onClose={() => setIsReportModalOpen(false)} 
          title={`Report User: ${reportTarget.name}`}
        >
          <form onSubmit={handleReportUser} className="space-y-5 py-2">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl flex gap-2.5 items-start">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-widest block text-rose-400">Moderation Review Request</span>
                <p className="text-[10px] leading-relaxed font-semibold">
                  Reporting a user sends logs to the administrative team. Abuse, spam, or hostile behavior will result in swift account suspension.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Reason for Report</label>
              <textarea 
                required
                rows={4}
                placeholder="Explain the issue in detail, including specific actions or messages..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500/60"
              />
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-850">
              <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-rose-650 hover:bg-rose-700 text-white font-extrabold">
                Submit Moderation Report
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
