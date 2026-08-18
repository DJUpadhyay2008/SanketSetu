import React, { useEffect, useState } from "react";
import { fetchFromApi } from "../api/client";
import { 
  Send, HelpCircle, Sparkles, Loader2, 
  Search, ShieldCheck, FileText, ExternalLink, ChevronDown, ChevronUp, UserCheck, RefreshCw
} from "lucide-react";
import { 
  Card, LoadingState, Badge, Button
} from "../components/ui";

interface Scheme {
  id: string;
  title: string;
  description: string;
  department: string;
  benefits: string;
  eligibility?: string;
  documents: string[];
  state: string;
  category: string;
  application_method: string;
  official_url?: string;
  source_name?: string;
  status: string;
}

interface SchemeEvaluationResult {
  scheme_id: string;
  title: string;
  description: string;
  benefits: string;
  eligibility_text?: string;
  documents: string[];
  state: string;
  category: string;
  official_url?: string;
  source_name?: string;
  status: "eligible" | "potentially_eligible" | "ineligible";
  matched_criteria: string[];
  unmatched_criteria: string[];
  missing_input_criteria: string[];
}

const INITIAL_SCHEMES: Scheme[] = [
  {
    id: "1",
    title: "ADIP Scheme (Assistance to Disabled Persons for Purchase/Fitting of Aids & Appliances)",
    description: "Provides grants to assist needy disabled persons in procuring durable, sophisticated, and scientifically manufactured standard aids and appliances (digital hearing aids, smart canes, laptops for deaf/blind).",
    department: "Ministry of Social Justice and Empowerment, Central Govt",
    benefits: "100% subsidy for family income up to Rs. 22,500/month. 50% subsidy for family income between Rs. 22,500 and Rs. 30,000/month.",
    eligibility: "Indian citizen with 40%+ disability certificate. Monthly income under Rs. 30,000.",
    documents: ["Aadhaar Card", "Disability Certificate (40%+)", "Income Certificate", "Photograph"],
    state: "CENTRAL",
    category: "ASSISTIVE TECHNOLOGY",
    application_method: "Online",
    official_url: "https://depwd.gov.in/adip-scheme/",
    source_name: "DEPwD Official Portal",
    status: "active"
  },
  {
    id: "2",
    title: "National Fellowship for Persons with Disabilities (NFPwD)",
    description: "Provides financial fellowships to students with disabilities pursuing higher education research courses such as M.Phil. and Ph.D. in recognized Indian universities.",
    department: "Department of Empowerment of Persons with Disabilities, Central Govt",
    benefits: "Stipend of Rs. 31,000/month (JRF) / Rs. 35,000/month (SRF) + HRA and contingency grants.",
    eligibility: "Indian student with 40%+ disability enrolled in full-time M.Phil/Ph.D.",
    documents: ["Aadhaar Card", "Disability Certificate (40%+)", "University Admission Proof"],
    state: "CENTRAL",
    category: "EDUCATION",
    application_method: "Online",
    official_url: "https://depwd.gov.in/national-fellowship-for-pwd/",
    source_name: "DEPwD Fellowship Portal",
    status: "active"
  },
  {
    id: "3",
    title: "Unique Disability ID (UDID) National Swavlamban Card Services",
    description: "Single nationwide smart identity card providing seamless access to all central & state disability schemes, healthcare concessions, and transit benefits.",
    department: "Department of Empowerment of Persons with Disabilities, Central Govt",
    benefits: "Universal medical validation, free/concessional rail and bus transport travel nationwide.",
    eligibility: "All Indian citizens certified with 40%+ disability.",
    documents: ["Medical Board Certificate", "Aadhaar Card", "Passport Photo"],
    state: "CENTRAL",
    category: "ASSISTIVE TECHNOLOGY",
    application_method: "Online",
    official_url: "https://www.swavlambancard.gov.in",
    source_name: "Swavlamban Card Portal",
    status: "active"
  },
  {
    id: "4",
    title: "Divyangjan Swavalamban Concessional Loan Scheme",
    description: "Low-interest concessional micro-loans for starting self-employment ventures, small businesses, or vocational training.",
    department: "National Handicapped Finance & Development Corp (NHFDC), Central Govt",
    benefits: "Concessional loans up to Rs. 5,00,000 at low interest rates (5% to 8% p.a.). 1% rebate for women.",
    eligibility: "Indian citizen aged 18+ with 40%+ certified disability.",
    documents: ["UDID Card", "Business Plan", "Aadhaar Card"],
    state: "CENTRAL",
    category: "FINANCIAL AID",
    application_method: "Online",
    official_url: "http://www.nhfdc.nic.in",
    source_name: "NHFDC Portal",
    status: "active"
  },
  {
    id: "5",
    title: "Deendayal Disabled Rehabilitation Scheme (DDRS)",
    description: "Grant-in-aid support to NGOs for running special schools, vocational centers, and early intervention clinics for deaf and disabled children.",
    department: "Ministry of Social Justice and Empowerment, Central Govt",
    benefits: "Free special schooling, skill development, sign language therapy, and hostel accommodations.",
    eligibility: "Children and young adults with disabilities across all Indian states.",
    documents: ["Disability Certificate", "School Enrollment Form"],
    state: "CENTRAL",
    category: "EDUCATION",
    application_method: "Offline/School Desk",
    official_url: "https://depwd.gov.in/ddrs-scheme/",
    source_name: "DEPwD Portal",
    status: "active"
  },
  {
    id: "6",
    title: "Sanjay Gandhi Niradhar Anudan & Divyang Maintenance Allowance",
    description: "State pension scheme in Maharashtra providing monthly financial sustenance to persons with disabilities.",
    department: "Social Justice & Special Assistance Dept, Govt of Maharashtra",
    benefits: "Monthly financial grant of Rs. 1,500/month directly transferred to beneficiary account.",
    eligibility: "Resident of Maharashtra. Disability 40%+. Annual income under Rs. 50,000.",
    documents: ["Maharashtra Domicile", "Aadhaar Card", "Disability Certificate"],
    state: "MAHARASHTRA",
    category: "FINANCIAL AID",
    application_method: "Online",
    official_url: "https://sanjaygandhimaharashtra.gov.in",
    source_name: "MahaOnline Portal",
    status: "active"
  },
  {
    id: "7",
    title: "Delhi Financial Assistance to Persons with Special Needs",
    description: "Delhi Government direct pension assistance for persons with disabilities living in NCT of Delhi.",
    department: "Department of Social Welfare, Government of NCT of Delhi",
    benefits: "Rs. 2,500/month direct pension allowance.",
    eligibility: "Resident of Delhi (5+ yrs). Disability 40%+. Family income under Rs. 1,00,000/yr.",
    documents: ["Delhi Domicile (5 Yrs)", "Disability Certificate", "Aadhaar Card"],
    state: "DELHI",
    category: "FINANCIAL AID",
    application_method: "Online",
    official_url: "https://edistrict.delhigovt.nic.in",
    source_name: "e-District Delhi",
    status: "active"
  },
  {
    id: "8",
    title: "Tamil Nadu Monthly Maintenance Allowance for Differently Abled",
    description: "Comprehensive maintenance allowance and free public transport passes across Tamil Nadu.",
    department: "Dept for Welfare of Differently Abled Persons, Govt of Tamil Nadu",
    benefits: "Monthly allowance of Rs. 2,000/month plus free RTC bus passes.",
    eligibility: "Resident of Tamil Nadu. Disability percentage 40%+.",
    documents: ["TN Smart Card / Ration Card", "Disability Certificate"],
    state: "TAMIL NADU",
    category: "FINANCIAL AID",
    application_method: "Online",
    official_url: "https://www.scda.tn.gov.in",
    source_name: "TN Welfare Portal",
    status: "active"
  },
  {
    id: "9",
    title: "Karnataka Vikalangara Pension & Assistive Equipment Scheme",
    description: "State-wide social security pension and assistive equipment distribution scheme for PwDs in Karnataka.",
    department: "Directorate for Empowerment of Differently Abled, Govt of Karnataka",
    benefits: "Rs. 1,200 to Rs. 2,000/month based on severity, plus free hearing aid kits.",
    eligibility: "Karnataka domicile resident with 40%+ disability.",
    documents: ["Karnataka Domicile", "UDID Card", "Aadhaar Card"],
    state: "KARNATAKA",
    category: "FINANCIAL AID",
    application_method: "Online",
    official_url: "https://sevasindhu.karnataka.gov.in",
    source_name: "Seva Sindhu Portal",
    status: "active"
  },
  {
    id: "10",
    title: "UP Divyangjan Pension & Shadi Protsahan Puraskar Yojana",
    description: "Direct benefit pension allowance and marriage financial grant for differently abled residents of Uttar Pradesh.",
    department: "Divyangjan Empowerment Department, Govt of Uttar Pradesh",
    benefits: "Monthly pension of Rs. 1,000/month + marriage incentive grant up to Rs. 35,000.",
    eligibility: "Resident of UP aged 18+, BPL income status.",
    documents: ["UP Domicile", "Disability Certificate", "BPL Certificate"],
    state: "UTTAR PRADESH",
    category: "FINANCIAL AID",
    application_method: "Online",
    official_url: "http://sspy-up.gov.in",
    source_name: "SSPY UP Portal",
    status: "active"
  },
  {
    id: "11",
    title: "West Bengal Manabik Pension Scheme for PwD",
    description: "Monthly pension grant for persons with disabilities residing in West Bengal.",
    department: "Dept of Women & Child Development & Social Welfare, Govt of West Bengal",
    benefits: "Rs. 1,000/month direct pension to beneficiary bank accounts.",
    eligibility: "Resident of West Bengal with 50%+ certified disability.",
    documents: ["WB Domicile Proof", "Disability Certificate (50%+)", "Bank Passbook"],
    state: "WEST BENGAL",
    category: "FINANCIAL AID",
    application_method: "Online/Offline",
    official_url: "https://wb.gov.in",
    source_name: "WB Social Welfare Portal",
    status: "active"
  },
  {
    id: "12",
    title: "Gujarat Divyang Sahay Yojana (Direct Financial Aid)",
    description: "State-funded direct benefit transfer scheme in Gujarat to support severely disabled individuals with monthly pension grants.",
    department: "Social Justice and Empowerment Department, Government of Gujarat",
    benefits: "Direct pension allowance of Rs. 1,000 per month deposited to Jan-Dhan account.",
    eligibility: "Resident of Gujarat. Age 18-79. Income BPL threshold. Disability 80%+.",
    documents: ["Gujarat Domicile Proof", "Aadhaar Card", "Disability Certificate (80%+)"],
    state: "GUJARAT",
    category: "FINANCIAL AID",
    application_method: "Online/Offline",
    official_url: "http://sje.gujarat.gov.in/",
    source_name: "SJE Gujarat Portal",
    status: "active"
  },
  {
    id: "13",
    title: "Kerala Swasraya Self-Employment Scheme for Divyangjan",
    description: "Financial assistance for single parents and disabled individuals to start micro enterprises.",
    department: "Social Justice Department, Government of Kerala",
    benefits: "One-time financial grant up to Rs. 35,000 for small business setups.",
    eligibility: "Kerala resident with 70%+ disability and BPL status.",
    documents: ["Kerala Domicile", "Disability Certificate", "Project Plan"],
    state: "KERALA",
    category: "FINANCIAL AID",
    application_method: "Online",
    official_url: "http://www.sjd.kerala.gov.in",
    source_name: "SJD Kerala Portal",
    status: "active"
  },
  {
    id: "14",
    title: "Rajasthan Chief Minister Vishesh Yogyajan Samman Pension",
    description: "Social security monthly pension scheme for persons with disabilities in Rajasthan.",
    department: "Social Justice and Empowerment Department, Govt of Rajasthan",
    benefits: "Rs. 750 to Rs. 1,500/month depending on age and disability severity.",
    eligibility: "Permanent resident of Rajasthan with 40%+ disability.",
    documents: ["Jan Aadhaar Card", "Disability Certificate", "Bank Account Details"],
    state: "RAJASTHAN",
    category: "FINANCIAL AID",
    application_method: "Online",
    official_url: "https://ssp.rajasthan.gov.in",
    source_name: "SSP Rajasthan Portal",
    status: "active"
  }
];

export default function Schemes() {
  const [schemes, setSchemes] = useState<Scheme[]>(INITIAL_SCHEMES);
  const [loading, setLoading] = useState(false);

  // View control
  const [activeTab, setActiveTab] = useState<"directory" | "wizard">("directory");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedState, setSelectedState] = useState("ALL");

  // Wizard Eligibility Profile State
  const [profile, setProfile] = useState({
    age: "",
    state: "CENTRAL",
    student: false,
    income: "",
    disability_category: "hearing_impairment",
    education_level: "postgraduate",
    gender: "any",
    employment: "any"
  });
  const [evaluationResults, setEvaluationResults] = useState<SchemeEvaluationResult[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [showIneligible, setShowIneligible] = useState(false);

  // Chatbot State
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string; sources?: string[]; urls?: string[] }[]>([]);
  const [asking, setAsking] = useState(false);

  // Fetch initial schemes list
  useEffect(() => {
    fetchFromApi<Scheme[]>("/schemes")
      .then((data) => {
        if (data && data.length > 0) {
          setSchemes(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch schemes:", err);
        setLoading(false);
      });
  }, []);

  const handleAsk = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const queryToSend = customQ || question;
    if (!queryToSend.trim()) return;

    setAsking(true);
    if (!customQ) setQuestion("");

    try {
      const res = await fetchFromApi<{ answer: string; sources: string[]; urls?: string[] }>("/schemes/ask", {
        method: "POST",
        body: JSON.stringify({ question: queryToSend }),
      });
      setChatHistory((prev) => [...prev, { q: queryToSend, a: res.answer, sources: res.sources, urls: res.urls }]);
    } catch {
      // Fallback
      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          {
            q: queryToSend,
            a: "I couldn't verify this from our current government sources.",
            sources: [],
            urls: []
          },
        ]);
      }, 800);
    } finally {
      setAsking(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    try {
      const payload = {
        age: profile.age ? parseInt(profile.age) : null,
        state: profile.state || null,
        student: profile.student,
        income: profile.income ? parseInt(profile.income) : null,
        disability_category: profile.disability_category === "any" ? null : profile.disability_category,
        education_level: profile.education_level === "any" ? null : profile.education_level,
        gender: profile.gender === "any" ? null : profile.gender,
        employment: profile.employment === "any" ? null : profile.employment
      };

      const res = await fetchFromApi<SchemeEvaluationResult[]>("/schemes/evaluate-eligibility", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setEvaluationResults(res);
      setHasEvaluated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  // Helper to select preset questions
  const handlePresetQuestion = (preset: string) => {
    handleAsk(undefined, preset);
  };

  // Filter schemes in Directory tab
  const filteredSchemes = schemes.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || s.category.toUpperCase() === selectedCategory.toUpperCase();
    const matchesState = selectedState === "ALL" || s.state.toUpperCase() === selectedState.toUpperCase();
    return matchesSearch && matchesCategory && matchesState;
  });

  const categories = ["ALL", "ASSISTIVE TECHNOLOGY", "EDUCATION", "FINANCIAL AID"];
  const states = [
    "ALL", "CENTRAL", "ANDHRA PRADESH", "ASSAM", "BIHAR", "DELHI", "GUJARAT", 
    "HARYANA", "KARNATAKA", "KERALA", "MADHYA PRADESH", "MAHARASHTRA", 
    "PUNJAB", "RAJASTHAN", "TAMIL NADU", "TELANGANA", "UTTAR PRADESH", "WEST BENGAL"
  ];

  return (
    <div className="space-y-8 py-2">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 px-6 py-10 text-white shadow-xl border border-emerald-700/50">
        <div className="absolute right-0 top-0 h-48 w-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-10 bottom-0 h-32 w-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/50 text-2xs font-extrabold uppercase tracking-widest text-amber-300">
            <span>Verified Government Policies</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Sanket Schemes
          </h1>
          <p className="text-emerald-200 text-xs font-black tracking-wider uppercase">
            Rule-Engine Directory & Hallucination-Safe AI Policy Guide
          </p>
          <p className="text-xs text-emerald-100/90 max-w-xl leading-relaxed font-medium">
            Verify criteria deterministically via the eligibility matcher, read documentation requirements, or chat with our RAG Policy AI using verified central & state sources.
          </p>
        </div>
      </section>

      {/* Tabs Controller */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === "directory"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Scheme Database Directory
        </button>
        <button
          onClick={() => setActiveTab("wizard")}
          className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === "wizard"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Deterministic Eligibility Matcher
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Col 1 & 2): Schemes Directory or Wizard */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === "directory" ? (
            <div className="space-y-6">
              {/* Directory Filter Panel */}
              <div className="space-y-4 bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search schemes, benefits, sources..."
                      className="w-full rounded-xl border border-slate-350 dark:border-slate-855 bg-white dark:bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-semibold"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">State:</span>
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-2xs font-extrabold uppercase text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-teal-500"
                      >
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Category:</span>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-2xs font-extrabold uppercase text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-teal-500"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schemes Listing */}
              {loading && <LoadingState />}
              
              {!loading && filteredSchemes.length === 0 ? (
                <Card className="p-10 text-center border-dashed border-2">
                  <p className="text-xs font-semibold text-slate-400">No verified schemes match your active filter.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredSchemes.map((s) => (
                    <div key={s.id} className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 flex flex-col justify-between shadow-xs">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">
                              {s.department}
                            </span>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                              {s.title}
                            </h3>
                          </div>
                          <Badge variant={s.state === "Gujarat" ? "saffron" : "muted"}>
                            {s.state}
                          </Badge>
                        </div>

                        <div className="space-y-3 text-2xs font-semibold text-slate-650 dark:text-slate-350">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Description</span>
                            <p className="leading-relaxed">{s.description}</p>
                          </div>
                          
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Key Benefits</span>
                            <p className="leading-relaxed text-teal-655 dark:text-teal-350">{s.benefits}</p>
                          </div>

                          {s.eligibility && (
                            <div>
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Eligibility Criteria</span>
                              <p className="leading-relaxed">{s.eligibility}</p>
                            </div>
                          )}

                          {s.documents && s.documents.length > 0 && (
                            <div>
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Required Documents</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {s.documents.map((doc, i) => (
                                  <span key={i} className="flex items-center gap-1 rounded bg-slate-50 dark:bg-slate-900 px-2 py-0.5 text-[10px] text-slate-500 border border-slate-200/50 dark:border-slate-800">
                                    <FileText className="h-3 w-3 text-slate-400" />
                                    {doc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {s.official_url && (
                        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                            Source: {s.source_name || "Official Portal"}
                          </span>
                          <a
                            href={s.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-2xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 hover:underline"
                          >
                            Official Website <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* WIZARD ELIGIBILITY MATCHER TAB */
            <div className="space-y-6">
              
              {!hasEvaluated ? (
                <div className="bg-white dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-md space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
                    <h2 className="text-md uppercase tracking-wider text-slate-850 dark:text-white font-extrabold flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-teal-500" /> Complete Eligibility Questionnaire
                    </h2>
                    <p className="text-2xs text-slate-400 font-semibold mt-1">
                      Our rules engine evaluates verified policy guidelines deterministically. Fill in your demographics to identify guaranteed matches.
                    </p>
                  </div>

                  <form onSubmit={handleEvaluate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Residence state */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Residence State</label>
                      <select
                        value={profile.state}
                        onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-805 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-semibold uppercase"
                      >
                        {states.filter(s => s !== "ALL").map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Age */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Age (Years)</label>
                      <input
                        type="number"
                        value={profile.age}
                        onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                        placeholder="e.g. 19"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-805 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-semibold"
                      />
                    </div>

                    {/* Disability category */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Disability Classification</label>
                      <select
                        value={profile.disability_category}
                        onChange={(e) => setProfile(prev => ({ ...prev, disability_category: e.target.value }))}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-805 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-semibold"
                      >
                        <option value="hearing_impairment">Hearing Impairment (Deaf/Hard of Hearing)</option>
                        <option value="visual_impairment">Visual Impairment</option>
                        <option value="any">General / Other Disability</option>
                      </select>
                    </div>

                    {/* Family Monthly Income */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Monthly Family Income (Rs.)</label>
                      <input
                        type="number"
                        value={profile.income}
                        onChange={(e) => setProfile(prev => ({ ...prev, income: e.target.value }))}
                        placeholder="e.g. 15000"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-805 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-semibold"
                      />
                    </div>

                    {/* Education Level */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Education Level</label>
                      <select
                        value={profile.education_level}
                        onChange={(e) => setProfile(prev => ({ ...prev, education_level: e.target.value }))}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-805 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-semibold"
                      >
                        <option value="school">Primary/Secondary School</option>
                        <option value="undergraduate">Undergraduate Degree</option>
                        <option value="postgraduate">Postgraduate Degree (M.Phil / Ph.D)</option>
                      </select>
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Gender</label>
                      <select
                        value={profile.gender}
                        onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-805 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-semibold"
                      >
                        <option value="any">Any / Not Specified</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    {/* Student toggle */}
                    <div className="flex items-center gap-3 md:col-span-2 bg-slate-50 dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80">
                      <input
                        type="checkbox"
                        id="student-checkbox"
                        checked={profile.student}
                        onChange={(e) => setProfile(prev => ({ ...prev, student: e.target.checked }))}
                        className="h-4.5 w-4.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <label htmlFor="student-checkbox" className="text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer">
                        Currently enrolled as a student in a recognized school/university
                      </label>
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
                      <Button
                        type="submit"
                        variant="secondary"
                        disabled={evaluating}
                        className="px-6 py-2.5 text-xs uppercase tracking-wider font-extrabold flex items-center gap-2"
                      >
                        {evaluating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-teal-500" /> Evaluating Engine...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4.5 w-4.5 text-teal-500" /> Evaluate Eligibility
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                /* RESULTS PRESENTATION */
                <div className="space-y-6">
                  {/* Results Header */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-teal-500/10 border border-teal-500/20 p-5 rounded-2xl">
                    <div>
                      <h3 className="text-sm font-black uppercase text-teal-700 dark:text-teal-400 tracking-wider">Evaluation Completed</h3>
                      <p className="text-2xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                        Showing scheme eligibility matching results for profile: {profile.age || "?"}y, {profile.state}, {profile.student ? "Student" : "Non-student"}, Rs. {profile.income || "?"}/mo.
                      </p>
                    </div>
                    <Button 
                      onClick={() => setHasEvaluated(false)} 
                      variant="outline" 
                      className="text-2xs font-extrabold uppercase tracking-wider px-4 flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Modify Profile
                    </Button>
                  </div>

                  {/* Confirmed Eligibility */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-l-3 border-emerald-500 pl-2">
                      Confirmed Eligibility
                    </h4>
                    {evaluationResults.filter(r => r.status === "eligible").length === 0 ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 text-2xs text-slate-400 font-semibold italic text-center">
                        No schemes matched 100% of your current profile.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {evaluationResults.filter(r => r.status === "eligible").map(res => (
                          <div key={res.scheme_id} className="bg-white dark:bg-slate-900/60 rounded-2xl border-2 border-emerald-500/40 p-5 space-y-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-bl">
                              Match Guaranteed
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{res.state} • {res.category}</span>
                              <h5 className="text-sm font-extrabold text-slate-950 dark:text-white pr-24">{res.title}</h5>
                            </div>
                            <p className="text-2xs font-semibold text-slate-650 dark:text-slate-350">{res.benefits}</p>
                            
                            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-[10px]">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <span className="font-extrabold text-emerald-600 uppercase tracking-wider mr-1">Matched Rules:</span>
                                {res.matched_criteria.map((c, i) => (
                                  <span key={i} className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/25 px-2 py-0.5 rounded font-bold">{c}</span>
                                ))}
                              </div>

                              {res.documents && res.documents.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 items-center pt-1.5">
                                  <span className="font-extrabold text-slate-400 uppercase tracking-wider mr-1">Documents to Prepare:</span>
                                  {res.documents.map((doc, i) => (
                                    <span key={i} className="bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-200/50 dark:border-slate-800 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                      <FileText className="h-3 w-3 text-slate-400" /> {doc}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Potentially Relevant */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-500 border-l-3 border-orange-500 pl-2">
                      Potentially Relevant
                    </h4>
                    {evaluationResults.filter(r => r.status === "potentially_eligible").length === 0 ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-805 text-2xs text-slate-400 font-semibold italic text-center">
                        No potentially matching schemes found.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {evaluationResults.filter(r => r.status === "potentially_eligible").map(res => (
                          <div key={res.scheme_id} className="bg-white dark:bg-slate-900/60 rounded-2xl border-2 border-orange-500/40 p-5 space-y-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-orange-500 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-bl">
                              Needs Profile Details
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{res.state} • {res.category}</span>
                              <h5 className="text-sm font-extrabold text-slate-950 dark:text-white pr-28">{res.title}</h5>
                            </div>
                            <p className="text-2xs font-semibold text-slate-650 dark:text-slate-350">{res.benefits}</p>
                            
                            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-[10px]">
                              {res.matched_criteria.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  <span className="font-extrabold text-emerald-600 uppercase tracking-wider mr-1">Matched:</span>
                                  {res.matched_criteria.map((c, i) => (
                                    <span key={i} className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/25 px-2 py-0.5 rounded font-bold">{c}</span>
                                  ))}
                                </div>
                              )}
                              
                              {res.missing_input_criteria.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 items-center pt-1.5">
                                  <span className="font-extrabold text-orange-500 uppercase tracking-wider mr-1">Missing Inputs to Confirm:</span>
                                  {res.missing_input_criteria.map((c, i) => (
                                    <span key={i} className="bg-orange-50/40 dark:bg-orange-950/20 text-orange-700 dark:text-orange-450 border border-orange-200/50 dark:border-orange-900/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px]">{c.replace("_", " ")}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ineligible Collapsible */}
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowIneligible(prev => !prev)}
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
                    >
                      {showIneligible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      Ineligible Schemes ({evaluationResults.filter(r => r.status === "ineligible").length})
                    </button>

                    {showIneligible && (
                      <div className="grid grid-cols-1 gap-4">
                        {evaluationResults.filter(r => r.status === "ineligible").map(res => (
                          <div key={res.scheme_id} className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 space-y-3 opacity-60">
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-450">{res.state} • {res.category}</span>
                              <h5 className="text-sm font-extrabold text-slate-900 dark:text-slate-450">{res.title}</h5>
                            </div>
                            <div className="space-y-1.5 text-[10px]">
                              {res.unmatched_criteria.map((c, i) => (
                                <div key={i} className="text-rose-500 font-semibold flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                  Unmatched rule: {c}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: AI Assistant Chatbot */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-[540px]">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-4 text-white flex items-center gap-2.5 shadow-xs">
              <div className="h-8 w-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm tracking-tight text-white">Policy AI Assistant</h3>
                <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">RAG-Verified Policy Search</p>
              </div>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-350 font-semibold leading-relaxed">
                Namaste! Ask me questions about schemes. I am strictly constrained to only answer using verified government policy databases.
              </div>

              {chatHistory.map((chat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="ml-auto max-w-[85%] rounded-xl bg-teal-600 text-white p-3 text-right font-bold shadow-xs">
                    {chat.q}
                  </div>
                  <div className="max-w-[85%] rounded-xl bg-slate-50 dark:bg-slate-900/80 p-3 border border-slate-200/50 dark:border-slate-808 text-slate-700 dark:text-slate-300 space-y-2 font-semibold leading-relaxed shadow-2xs">
                    <p className="whitespace-pre-wrap">{chat.a}</p>
                    
                    {chat.sources && chat.sources.length > 0 && (
                      <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-2 mt-2 space-y-1.5">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Verified Sources:</span>
                        <div className="flex flex-wrap gap-2">
                          {chat.sources.map((src, i) => (
                            <span key={i} className="bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-450 px-2 py-0.5 rounded text-[10px] font-bold">
                              {src}
                            </span>
                          ))}
                        </div>
                        {chat.urls && chat.urls.length > 0 && (
                          <div className="flex flex-col gap-1 pt-1 border-t border-dashed border-slate-200/50 dark:border-slate-800/50">
                            {chat.urls.map((url, i) => (
                              <a 
                                key={i} 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[9px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1 hover:underline"
                              >
                                Official Portal Link <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {asking && (
                <div className="flex items-center gap-2 text-2xs font-extrabold uppercase tracking-widest text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                  Generating RAG Answer...
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30 flex flex-wrap gap-1.5 justify-center">
              <button
                onClick={() => handlePresetQuestion("Am I eligible for NFPwD if I'm a student in India?")}
                className="text-[9px] font-bold px-2 py-1 rounded bg-slate-200/50 dark:bg-slate-800 text-slate-550 dark:text-slate-350 hover:bg-teal-500/10 hover:text-teal-500 transition-colors cursor-pointer"
              >
                "Fellowship for Indian students?"
              </button>
              <button
                onClick={() => handlePresetQuestion("What benefits do I get under the ADIP scheme?")}
                className="text-[9px] font-bold px-2 py-1 rounded bg-slate-200/50 dark:bg-slate-800 text-slate-550 dark:text-slate-350 hover:bg-teal-500/10 hover:text-teal-500 transition-colors cursor-pointer"
              >
                "What does ADIP Scheme cover?"
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => handleAsk(e)} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-2">
              <input
                type="text"
                placeholder="Ask about pensions, ADIP, fellowship..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-semibold"
                disabled={asking}
              />
              <button
                type="submit"
                className="rounded-xl bg-teal-600 hover:bg-teal-600 text-white p-2.5 flex items-center justify-center shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                disabled={asking}
                aria-label="Send policy query"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="rounded-xl bg-orange-50/20 dark:bg-orange-950/10 p-4 border border-orange-200/35 dark:border-orange-900/30 text-2xs text-slate-650 dark:text-slate-400 flex gap-2.5 items-start">
            <HelpCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-1 font-semibold leading-relaxed">
              <p className="font-extrabold text-orange-700 dark:text-orange-450 uppercase tracking-wider">Hallucination Safeguard Enabled</p>
              <p>AI replies are grounded exclusively in our verified government database. If details aren't verified, the model declines to answer to preserve authenticity.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
