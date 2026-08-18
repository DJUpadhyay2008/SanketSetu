import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchFromApi } from "../api/client";
import { 
  ShieldCheck, ShieldAlert, Award, Calendar, Compass, 
  ArrowLeft, Loader2
} from "lucide-react";

interface VerificationResponse {
  is_valid: boolean;
  recipient_masked_name: string;
  course_name: string;
  issue_date: string;
  grade: string;
  issuer: string;
  skill: string;
  verification_id: string;
  disclaimer: string;
}

export default function Verify() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchFromApi<VerificationResponse>(`/passport/verify/${id}`)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden font-sans">
      {/* Background radial glows */}
      <div className="absolute top-0 right-0 h-96 w-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-96 w-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-4xl w-full mx-auto flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2 group text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4.5 w-4.5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-2xs font-extrabold uppercase tracking-widest">Back to Portal</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Compass className="h-5 w-5 text-teal-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-100">Sanket Setu</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-12 max-w-xl w-full mx-auto">
        {loading ? (
          <div className="text-center space-y-3">
            <Loader2 className="h-10 w-10 text-teal-500 animate-spin mx-auto" />
            <p className="text-2xs font-black uppercase tracking-widest text-slate-400">Verifying credential signature...</p>
          </div>
        ) : error || !data || !data.is_valid ? (
          <div className="w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="h-16 w-16 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black uppercase tracking-wider text-rose-450">Verification Failed</h2>
              <p className="text-2xs text-slate-400 font-semibold leading-relaxed">
                This credential ID is either invalid, has been revoked, or does not exist on our servers. Please check the ID and try again.
              </p>
            </div>
            {id && (
              <div className="p-3 bg-slate-950 rounded-xl font-mono text-3xs text-rose-400 border border-rose-500/10 select-all">
                Query ID: {id}
              </div>
            )}
            <Link to="/" className="inline-block bg-slate-800 hover:bg-slate-750 text-slate-350 text-2xs font-extrabold py-2 px-6 rounded-xl transition-all">
              Return Home
            </Link>
          </div>
        ) : (
          <div className="w-full bg-slate-900 border border-slate-850 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
            {/* Verification Tag */}
            <div className="absolute top-0 right-0 bg-teal-500/10 text-teal-400 border-l border-b border-teal-500/20 px-4 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" /> Verified Signature
            </div>

            {/* Title / Header */}
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Sanket Setu Platform Credential</span>
              <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-500 shrink-0" /> Completion Audit Assertion
              </h2>
            </div>

            <hr className="border-slate-800" />

            {/* Fields list */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Recipient (Masked)</span>
                  <span className="text-xs font-black text-slate-200">{data.recipient_masked_name}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Course Name</span>
                  <span className="text-xs font-black text-slate-200 line-clamp-1">{data.course_name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Grade Achieved</span>
                  <span className="text-xs font-black text-teal-450">{data.grade}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Issue Date</span>
                  <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" /> {new Date(data.issue_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Issuer Institution</span>
                  <span className="text-xs font-black text-slate-200">{data.issuer}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Competency Domain</span>
                  <span className="text-xs font-black text-slate-200">{data.skill}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Credential ID (UUID)</span>
                <span className="text-3xs font-mono text-slate-400 select-all bg-slate-950 p-2 rounded-lg border border-slate-850 block break-all">
                  {data.verification_id}
                </span>
              </div>
            </div>

            <hr className="border-slate-800" />

            {/* Disclaimer */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 block">Statutory Disclaimer</span>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                {data.disclaimer}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 border-t border-slate-900/60 max-w-4xl w-full mx-auto">
        <p className="text-3xs text-slate-550 font-semibold">
          Sanket Setu National Accessibility Initiative. All Rights Reserved. &copy; 2026.
        </p>
      </footer>
    </div>
  );
}
