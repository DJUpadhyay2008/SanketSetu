import { useEffect, useState } from "react";
import { fetchFromApi } from "../api/client";
import { Building2, ClipboardCheck, Sparkles, ShieldCheck } from "lucide-react";
import { 
  Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, ProgressBar, LoadingState 
} from "../components/ui";

interface InstitutionItem {
  id: string;
  name: string;
  category: string;
  readiness_score: number;
  tier: string;
  city: string;
}

const FALLBACK_INSTITUTIONS: InstitutionItem[] = [
  { id: "fallback-inst-1", name: "All India Institute of Medical Sciences (AIIMS)", category: "healthcare", readiness_score: 88, tier: "A", city: "New Delhi" },
  { id: "fallback-inst-2", name: "Noida Public School", category: "education", readiness_score: 45, tier: "C", city: "Noida" },
  { id: "fallback-inst-3", name: "State Bank of India (CP Branch)", category: "finance", readiness_score: 72, tier: "B", city: "New Delhi" },
  { id: "fallback-inst-4", name: "District Collectorate Office", category: "government", readiness_score: 30, tier: "D", city: "Indore" }
];

export default function Institution() {
  const [institutions, setInstitutions] = useState<InstitutionItem[]>(FALLBACK_INSTITUTIONS);
  const [loading, setLoading] = useState(true);
  
  // Auditing Form State
  const [interpreters, setInterpreters] = useState(false);
  const [staffTrained, setStaffTrained] = useState(0);
  const [vrs, setVrs] = useState(false);
  const [signage, setSignage] = useState(5);
  
  const [result, setResult] = useState<{ score: number; tier: string; recommendations: string[] } | null>(null);
  const [auditing, setAuditing] = useState(false);

  useEffect(() => {
    fetchFromApi<InstitutionItem[]>("/institutions/index")
      .then((data) => {
        if (Array.isArray(data)) {
          setInstitutions(data);
        } else {
          setInstitutions(FALLBACK_INSTITUTIONS);
        }
        setLoading(false);
      })
      .catch(() => {
        setInstitutions(FALLBACK_INSTITUTIONS);
        setLoading(false);
      });
  }, []);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuditing(true);

    try {
      const res = await fetchFromApi<{ calculated_score: number; assigned_tier: string; recommendations: string[] }>("/institutions/evaluate", {
        method: "POST",
        body: JSON.stringify({
          has_isl_interpreters: interpreters,
          staff_trained_percentage: staffTrained,
          has_video_relay_services: vrs,
          signage_accessibility_score: signage
        })
      });
      setResult({
        score: res.calculated_score ?? 50,
        tier: res.assigned_tier ?? "C",
        recommendations: Array.isArray(res.recommendations) ? res.recommendations : [
          "Conduct beginner sign workshops for first-contact customer desks.",
          "Integrate direct Video Relay Services (VRS) desk connectivity.",
          "Display high-contrast visual guiding signs in building lobbies."
        ]
      });
    } catch {
      // Local calculation fallback
      setTimeout(() => {
        let score = 0;
        if (interpreters) score += 40;
        score += Math.floor(staffTrained * 0.4);
        if (vrs) score += 10;
        score += signage;

        let tier = "D";
        if (score >= 90) tier = "A+";
        else if (score >= 75) tier = "A";
        else if (score >= 55) tier = "B";
        else if (score >= 35) tier = "C";

        setResult({
          score,
          tier,
          recommendations: [
            "Conduct beginner sign workshops for first-contact customer desks.",
            "Integrate direct Video Relay Services (VRS) desk connectivity.",
            "Display high-contrast visual guiding signs in building lobbies."
          ]
        });
      }, 800);
    } finally {
      setAuditing(false);
    }
  };

  const getTierBadge = (t: string) => {
    if (!t) return <Badge variant="secondary">Tier N/A</Badge>;
    if (t.startsWith("A")) return <Badge variant="success">{`Tier ${t}`}</Badge>;
    if (t.startsWith("B") || t.startsWith("C")) return <Badge variant="saffron">{`Tier ${t}`}</Badge>;
    return <Badge variant="danger">{`Tier ${t}`}</Badge>;
  };

  return (
    <div className="space-y-8 py-2">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 h-48 w-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-10 bottom-0 h-32 w-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-slate-100">
            ISL-Ready Index
          </h1>
          <p className="text-teal-300 text-sm font-semibold tracking-wide uppercase">
            Check and audits organizations to measure accessibility, promoting ISL inclusion across public services.
          </p>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Measuring accessibility compliance nationwide. Calculate your institution's compliance Tier based on certified staff counts, signage quality, and active VRS desks.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: National Rankings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-500">
              National Accessibility Rankings
            </h2>
          </div>

          {loading && <LoadingState />}

          <div className="grid grid-cols-1 gap-4">
            {!loading && (Array.isArray(institutions) ? institutions : FALLBACK_INSTITUTIONS).map((inst) => (
              <Card key={inst.id} className="border border-slate-200 dark:border-slate-800/80">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex gap-3">
                    <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 text-teal-600 dark:text-teal-400">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight">
                        {inst.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1 tracking-wider">
                        {inst.category?.toUpperCase()} • {inst.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-850 pt-3 sm:pt-0">
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Readiness Score</p>
                      <ProgressBar value={inst.readiness_score || 0} size="sm" variant="teal" />
                      <p className="text-xs font-black text-slate-700 dark:text-slate-350">{inst.readiness_score || 0}/100</p>
                    </div>
                    <div className="shrink-0 pl-2">
                      {getTierBadge(inst.tier)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Audit Evaluation Form */}
        <div className="space-y-6">
          
          <Card className="border border-slate-200 dark:border-slate-800/80">
            <CardHeader className="flex flex-row items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center shrink-0">
                <ClipboardCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm uppercase tracking-wider">Auditing Calculator</CardTitle>
                <CardDescription>Evaluate office compliance score</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAudit} className="space-y-5 text-xs font-semibold text-slate-650 dark:text-slate-350">
                
                <div className="flex items-center justify-between">
                  <label htmlFor="interpreters-check" className="cursor-pointer">
                    On-Site Interpreters?
                  </label>
                  <input
                    id="interpreters-check"
                    type="checkbox"
                    checked={interpreters}
                    onChange={(e) => setInterpreters(e.target.checked)}
                    className="rounded border-slate-350 text-teal-600 focus:ring-teal-500 h-4.5 w-4.5 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="staff-trained" className="block">
                    Staff Trained in Basic ISL (%)
                  </label>
                  <input
                    id="staff-trained"
                    type="range"
                    min="0"
                    max="100"
                    value={staffTrained}
                    onChange={(e) => setStaffTrained(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex justify-between text-3xs text-slate-405 font-black uppercase tracking-wider">
                    <span>0%</span>
                    <span className="text-teal-600">{staffTrained}%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="vrs-check" className="cursor-pointer">
                    VRS Translation Desk Active?
                  </label>
                  <input
                    id="vrs-check"
                    type="checkbox"
                    checked={vrs}
                    onChange={(e) => setVrs(e.target.checked)}
                    className="rounded border-slate-355 text-teal-655 focus:ring-teal-500 h-4.5 w-4.5 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="signage-score" className="block">
                    Signage Accessibility (1-10)
                  </label>
                  <input
                    id="signage-score"
                    type="number"
                    min="1"
                    max="10"
                    value={signage}
                    onChange={(e) => setSignage(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <Button type="submit" variant="secondary" className="w-full" loading={auditing}>
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>Auditing Accessibility</span>
                </Button>
              </form>

              {/* Audit Results Panel */}
              {result && (
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-4 space-y-4 mt-6 text-xs shadow-2xs">
                  <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800 pb-2">
                    <span className="font-extrabold text-slate-900 dark:text-white">Calculated Score: {result.score}/100</span>
                    {getTierBadge(result.tier)}
                  </div>
                  <div className="space-y-2 font-semibold">
                    <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-teal-605" />
                      Compliance Actions:
                    </p>
                    <ul className="list-disc pl-4 text-slate-550 dark:text-slate-400 space-y-1.5">
                      {(result.recommendations || []).map((rec, i) => (
                        <li key={i} className="leading-relaxed">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}
