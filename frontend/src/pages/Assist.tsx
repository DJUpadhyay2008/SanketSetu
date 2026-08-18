import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchFromApi } from "../api/client";
import { 
  HeartHandshake, PhoneCall, MapPin, Calendar, Clock, User, 
  Search, Printer, X, Building2, ExternalLink
} from "lucide-react";
import { 
  Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, LoadingState 
} from "../components/ui";

interface RequestDetail {
  id: string;
  service_type: string;
  description: string;
  location: string;
  scheduled_time: string;
  status: string;
  interpreter_name: string | null;
  created_at: string;
}

interface InstitutionItem {
  slug: string;
  name: string;
  category: "hospital" | "college" | "government";
  location: string;
  description: string;
}

export default function Assist() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestDetail[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation Tabs: "portals" (Service Workflows & QR) vs "requests" (Interpreter Match)
  const [activeTab, setActiveTab] = useState<"portals" | "requests">("portals");

  // Form State
  const [serviceType, setServiceType] = useState("medical_emergency");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Institution Search State
  const [searchQuery, setSearchQuery] = useState("");

  // QR Modal State
  const [selectedInst, setSelectedInst] = useState<InstitutionItem | null>(null);

  // Static Institution Directory
  const institutions: InstitutionItem[] = [
    {
      slug: "aiims-delhi",
      name: "AIIMS New Delhi — Inclusive OPD Centre",
      category: "hospital",
      location: "New Delhi",
      description: "Simplified outpatient check-in, live ISL video queue trackers, and accessible department navigation."
    },
    {
      slug: "aiish-mysore",
      name: "All India Institute of Speech and Hearing (AIISH)",
      category: "hospital",
      location: "Mysore, Karnataka",
      description: "Premier speech & hearing diagnostic center, audiology grants, and early intervention sign counseling."
    },
    {
      slug: "nimhans-bengaluru",
      name: "NIMHANS Special Rehabilitation Wing",
      category: "hospital",
      location: "Bengaluru, Karnataka",
      description: "Specialized assistive rehabilitation care, neuro-divergent accommodation support, and token queues."
    },
    {
      slug: "iit-bombay",
      name: "IIT Bombay Disability Resource Centre",
      category: "college",
      location: "Mumbai, Maharashtra",
      description: "Student examination scribe allocation, academic braille/ISL transcript software, and hostel accessibility."
    },
    {
      slug: "collectorate-office",
      name: "District Collectorate & Social Welfare Office",
      category: "government",
      location: "Pan-India / Municipal",
      description: "Disability pension registrations, UDID card verification timelines, and civic counter token queue managers."
    }
  ];

  useEffect(() => {
    fetchFromApi<RequestDetail[]>("/assist/requests")
      .then((data) => {
        setRequests(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback mock requests
        setRequests([
          {
            id: "fallback-req-1",
            service_type: "medical_emergency",
            description: "Dental appointment assistance at Community Clinic",
            location: "Sector 12, Dwarka, New Delhi",
            scheduled_time: new Date().toISOString(),
            status: "assigned",
            interpreter_name: "Rajesh Kumar (Certified ISL Level 3)",
            created_at: new Date().toISOString()
          }
        ]);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !location.trim() || !dateStr || !timeStr) return;

    setSubmitting(true);
    const scheduledTime = new Date(`${dateStr}T${timeStr}`).toISOString();

    try {
      const newReq = await fetchFromApi<RequestDetail>("/assist/request", {
        method: "POST",
        body: JSON.stringify({
          service_type: serviceType,
          description,
          location,
          scheduled_time: scheduledTime
        })
      });
      setRequests((prev) => [newReq, ...prev]);
      setDescription("");
      setLocation("");
      setDateStr("");
      setTimeStr("");
    } catch {
      // Offline fallback push
      const mockReq: RequestDetail = {
        id: `mock-req-${Math.floor(Math.random() * 1000)}`,
        service_type: serviceType,
        description,
        location,
        scheduled_time: scheduledTime,
        status: "pending",
        interpreter_name: null,
        created_at: new Date().toISOString()
      };
      setRequests((prev) => [mockReq, ...prev]);
      setDescription("");
      setLocation("");
      setDateStr("");
      setTimeStr("");
    } finally {
      setSubmitting(false);
    }
  };

  const getServiceTypeBadge = (t: string) => {
    const formatted = t.replace("_", " ").toUpperCase();
    if (t.includes("emergency") || t.includes("medical")) return <Badge variant="danger">{formatted}</Badge>;
    if (t.includes("legal")) return <Badge variant="saffron">{formatted}</Badge>;
    return <Badge variant="secondary">{formatted}</Badge>;
  };

  const getStatusBadge = (s: string) => {
    const st = s.toLowerCase();
    if (st === "assigned") return <Badge variant="success">ASSIGNED</Badge>;
    if (st === "pending") return <Badge variant="saffron">FINDING INTERPRETER</Badge>;
    return <Badge variant="muted">{s.toUpperCase()}</Badge>;
  };

  const filteredInstitutions = institutions.filter(inst => {
    return inst.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           inst.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
           inst.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getCategoryBadge = (cat: string) => {
    if (cat === "hospital") return <Badge variant="danger">OPD / HOSPITAL</Badge>;
    if (cat === "college") return <Badge variant="primary">CAMPUS / COLLEGE</Badge>;
    return <Badge variant="saffron">CIVIC / GOVT</Badge>;
  };

  // Generate QR url using public api
  const getQrCodeUrl = (inst: InstitutionItem) => {
    const origin = window.location.origin;
    const portalUrl = `${origin}/assist/${inst.category}/${inst.slug}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(portalUrl)}`;
  };

  return (
    <div className="space-y-8 py-2">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 px-6 py-10 text-white shadow-xl border border-emerald-700/50">
        <div className="absolute right-0 top-0 h-48 w-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-10 bottom-0 h-32 w-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/50 text-2xs font-extrabold uppercase tracking-widest text-amber-300">
            <span>Instant Disability Support</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Sanket Assist
          </h1>
          <p className="text-emerald-200 text-xs font-black tracking-wider uppercase">
            Accessible Service Portals, Scan-for-ISL QR entry points, and interpreter matching.
          </p>
          <p className="text-xs text-emerald-100/90 max-w-xl leading-relaxed font-medium">
            Enter simplified, sign-language accessible service portals directly by scanning "Scan-for-ISL" QR codes placed at reception desks, or request local certified translators for live support.
          </p>
        </div>
      </section>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("portals")}
          className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === "portals"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Scan-for-ISL Portals Directory
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === "requests"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Interpreter Match Booking
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column(s): Portal Directory OR Request Form & List */}
        <div className="lg:col-span-2 space-y-8">
          
          {activeTab === "portals" ? (
            /* PORTALS TAB */
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hospitals, colleges, offices..."
                    className="w-full rounded-xl border border-slate-350 dark:border-slate-805 bg-white dark:bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                  />
                </div>
                <div className="text-2xs text-slate-450 font-semibold uppercase tracking-wider">
                  {filteredInstitutions.length} Registered Public Profiles
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredInstitutions.map((inst) => (
                  <Card key={inst.slug} className="flex flex-col justify-between h-full border border-slate-200 dark:border-slate-800/80">
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        {getCategoryBadge(inst.category)}
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight">
                          {inst.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                          {inst.location}
                        </p>
                      </div>
                      <p className="text-2xs font-semibold text-slate-650 dark:text-slate-350 leading-relaxed">
                        {inst.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => navigate(`/assist/${inst.category}/${inst.slug}`)}
                        variant="secondary"
                        className="flex-1 text-2xs font-black uppercase tracking-wider py-2"
                      >
                        Enter Portal <ExternalLink className="h-3 w-3 shrink-0 ml-1" />
                      </Button>
                      <Button
                        onClick={() => setSelectedInst(inst)}
                        variant="outline"
                        className="text-2xs font-black uppercase tracking-wider py-2"
                      >
                        Get QR Code
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* INTERPRETER REQUESTS TAB */
            <div className="space-y-8">
              {/* Request Form Card */}
              <Card className="border border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base uppercase tracking-wider">Request an Interpreter</CardTitle>
                  <CardDescription>Scheduled dispatch or remote assistance matching</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="service-type" className="block text-3xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                          Service Context
                        </label>
                        <select
                          id="service-type"
                          value={serviceType}
                          onChange={(e) => setServiceType(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500 font-semibold"
                        >
                          <option value="medical_emergency">Medical Emergency / Doctor Visit</option>
                          <option value="legal">Legal / Police Station Help</option>
                          <option value="education">Educational Lecture / Exams</option>
                          <option value="general">General Support (Banks, Post Offices)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="location" className="block text-3xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                          Location / Office Name
                        </label>
                        <input
                          id="location"
                          type="text"
                          placeholder="E.g. AIIMS Hospital, Vadodara"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500 font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="req-date" className="block text-3xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                          Target Date
                        </label>
                        <input
                          id="req-date"
                          type="date"
                          value={dateStr}
                          onChange={(e) => setDateStr(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500 font-semibold"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="req-time" className="block text-3xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                          Target Time
                        </label>
                        <input
                          id="req-time"
                          type="time"
                          value={timeStr}
                          onChange={(e) => setTimeStr(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500 font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="req-desc" className="block text-3xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                        Additional Details
                      </label>
                      <textarea
                        id="req-desc"
                        rows={3}
                        placeholder="Describe the context. E.g. explaining symptoms to an ENT doctor..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500 font-semibold"
                        required
                      />
                    </div>

                    <Button type="submit" variant="secondary" className="w-full text-xs font-black uppercase" loading={submitting}>
                      <HeartHandshake className="h-4 w-4 shrink-0 mr-1" />
                      Request Certified Interpreter
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Active Requests Directory */}
              <div className="space-y-4">
                <h3 className="text-base font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2">
                  Your Requests
                </h3>

                {loading && <LoadingState />}

                {!loading && requests.length === 0 ? (
                  <p className="text-xs text-slate-500 font-semibold text-center py-6">You haven't posted any interpreter requests.</p>
                ) : (
                  requests.map((req) => (
                    <Card key={req.id} className="border border-slate-200 dark:border-slate-800/80">
                      <div className="space-y-4">
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <div className="space-y-1">
                            {getServiceTypeBadge(req.service_type)}
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-1 leading-tight">
                              {req.description}
                            </h4>
                          </div>
                          {getStatusBadge(req.status)}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 text-2xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
                            <span>{req.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Calendar className="h-4 w-4 text-teal-600 shrink-0" />
                            <span>{new Date(req.scheduled_time).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Clock className="h-4 w-4 text-teal-600 shrink-0" />
                            <span>{new Date(req.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {req.interpreter_name && (
                          <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 flex items-center gap-2 text-2xs">
                            <div className="h-6 w-6 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-655 flex items-center justify-center">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-slate-700 dark:text-slate-350 font-bold">
                              Interpreter: <span className="text-slate-900 dark:text-slate-200">{req.interpreter_name}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Emergency Video Relay & Guidelines */}
        <div className="space-y-6">
          <Card className="border border-orange-500/20 bg-orange-50/10 dark:bg-orange-950/5">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-orange-600 dark:text-orange-400">Emergency Video Relay</CardTitle>
              <CardDescription className="text-orange-500/80">Immediate translator support 24/7</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xs text-slate-650 dark:text-slate-400 leading-relaxed font-semibold">
                Require an instant translation bridge for police inquiries, medical diagnostics, or accidents? Trigger a live video conference with an on-duty interpreter.
              </p>
              <Button variant="saffron" className="w-full text-2xs font-extrabold uppercase py-2">
                <PhoneCall className="h-4 w-4 shrink-0 mr-1" />
                Call Emergency VRS
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800/80">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider">How Portal Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3.5 text-xs font-semibold text-slate-550 dark:text-slate-450 leading-relaxed">
                <li className="flex gap-3">
                  <span className="h-5 w-5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 font-extrabold text-[10px]">1</span>
                  <span>Public offices put "Scan-for-ISL" QR points at counter reception desks.</span>
                </li>
                <li className="flex gap-3">
                  <span className="h-5 w-5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 font-extrabold text-[10px]">2</span>
                  <span>Deaf citizens scan the QR code to load the simplified accessible workflow wizard.</span>
                </li>
                <li className="flex gap-3">
                  <span className="h-5 w-5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 font-extrabold text-[10px]">3</span>
                  <span>The portal provides queue token prints, check-in forms, floor maps, and text speech logs.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PRINTABLE QR CODE ACCESS POINT MODAL */}
      {selectedInst && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedInst(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Poster Body */}
            <div className="p-6 sm:p-8 space-y-6 text-center">
              
              {/* Poster Header */}
              <div className="space-y-1">
                <div className="flex justify-center items-center gap-1.5 text-teal-600 dark:text-teal-400">
                  <Building2 className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sanket Setu Accessibility</span>
                </div>
                <h3 className="text-md font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Scan for ISL Support</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedInst.name}</p>
              </div>

              {/* QR Image Graphic */}
              <div className="relative mx-auto h-52 w-52 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-inner p-4">
                <img
                  src={getQrCodeUrl(selectedInst)}
                  alt="Scan for ISL Service Portal QR"
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Poster Instructions */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-sm mx-auto">
                <p className="text-teal-600 dark:text-teal-450 font-bold uppercase tracking-wider mb-1">Instruction for Administration</p>
                Print and mount this poster at reception OPD desks and ticket kiosks. Beneficiaries can scan to directly open simplified process logs, OPD queue tokens, and live transcription.
              </div>

              {/* Print action */}
              <div className="pt-2 flex gap-3">
                <Button 
                  onClick={() => window.print()}
                  variant="secondary" 
                  className="flex-1 text-2xs font-black uppercase tracking-wider py-2.5 flex items-center justify-center gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print Access Poster
                </Button>
                <Button 
                  onClick={() => setSelectedInst(null)}
                  variant="outline" 
                  className="text-2xs font-black uppercase tracking-wider py-2.5"
                >
                  Close
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
