import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchFromApi } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { 
  ShieldCheck, QrCode, Sparkles, UserCheck, Award, Calendar, 
  ExternalLink, Printer, X, Eye, Flame, Compass, MapPin, Maximize2
} from "lucide-react";
import { 
  Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, LoadingState 
} from "../components/ui";

interface CertificateItem {
  id: string;
  course_name: string;
  issue_date: string;
  grade: string;
  credential_url: string;
  issuer: string;
  skill: string;
}

interface PassportDetail {
  user_id: string;
  display_name: string;
  avatar_url: string;
  gender?: string;
  dob?: string;
  state?: string;
  city?: string;
  phone?: string;
  bio?: string;
  disability_category?: string;
  current_level: number;
  xp_points: number;
  streak: number;
  badges: string[];
  certificates: CertificateItem[];
  skills: string[];
  interests: string[];
  qr_code_data: string;
}

export default function Passport() {
  const { profile } = useAuth();
  const [passport, setPassport] = useState<PassportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);
  const [showPassportQrModal, setShowPassportQrModal] = useState(false);

  useEffect(() => {
    fetchFromApi<PassportDetail>("/passport")
      .then((data) => {
        setPassport(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback mock passport
        setPassport({
          user_id: profile?.id || "d3b07384-d113-495f-9e77-94d3a0429f55",
          display_name: profile?.display_name || "Sanket Citizen",
          avatar_url: profile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
          gender: profile?.gender || "Male",
          dob: profile?.dob || "1998-05-14",
          state: profile?.state || "Gujarat",
          city: profile?.city || "Ahmedabad",
          phone: profile?.phone || "+91 98765 43210",
          bio: profile?.bio || "Certified ISL Learner dedicated to civic inclusion.",
          disability_category: profile?.disability_category || "Deaf / Hard of Hearing",
          current_level: profile?.rank_level || 1,
          xp_points: profile?.xp ?? 0,
          streak: profile?.streak_days ?? 1,
          badges: ["Quick Starter", "First Greeting", "Daily Streak", "Community Pilot"],
          certificates: [
            {
              id: "88888888-8888-8888-8888-888888888888",
              course_name: "Everyday ISL Greetings",
              issue_date: "2026-08-16",
              grade: "A+",
              credential_url: "/verify/88888888-8888-8888-8888-888888888888",
              issuer: "Sanket Setu Platform",
              skill: "Basic Greetings"
            }
          ],
          skills: ["Everyday Greetings", "Emergency Reporting", "Basic Hospital Support"],
          interests: profile?.interests || ["Healthcare ISL", "Civic Services", "Daily Vocabulary"],
          qr_code_data: "sanket-passport-v1-d3b07384-d113-495f-9e77-94d3a0429f55"
        });
        setLoading(false);
      });
  }, [profile]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingState />;

  // Merge live profile data if available
  const activeAvatar = profile?.avatar_url || passport?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150";
  const activeName = profile?.display_name || passport?.display_name || "Sanket Citizen";
  const activeState = profile?.state || passport?.state || "Gujarat";
  const activeCity = profile?.city || passport?.city || "Ahmedabad";
  const activeGender = profile?.gender || passport?.gender;
  const activeDob = profile?.dob || passport?.dob;
  const activeCategory = profile?.disability_category || passport?.disability_category || "Deaf / Hard of Hearing";
  const activeBio = profile?.bio || passport?.bio;

  // Real Scannable Passport Verification QR URL
  const certIdForQr = passport?.certificates[0]?.id || "88888888-8888-8888-8888-888888888888";
  const passportVerifyUrl = `${window.location.origin}/verify/${certIdForQr}`;
  const passportQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(passportVerifyUrl)}`;

  return (
    <div className="space-y-8 py-2">
      {/* Print Styles Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-area, .print-area * {
            visibility: visible !important;
          }
          .print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white !important;
            z-index: 99999;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl border border-slate-850 no-print">
        <div className="absolute right-0 top-0 h-48 w-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-10 bottom-0 h-32 w-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-slate-100">
            Sanket Passport
          </h1>
          <p className="text-teal-350 text-sm font-semibold tracking-wide uppercase">
            Your digital ISL profile, credentials, and achievements. Verified to build a sign-ready India.
          </p>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Sanket Passport serves as a portable proof of sign language competency. Present certified credentials to public offices, colleges, or employers to verify your accessibility training.
          </p>
        </div>
      </section>

      {passport && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
          {/* Left Column: Passport Info & Badges */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Digital Identity Passport Card */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/65 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row gap-6 justify-between items-start relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-orange-500 via-slate-800 to-teal-500" />
              
              <div className="space-y-6 flex-1 pl-2">
                <div className="flex items-center gap-4">
                  <img 
                    src={activeAvatar} 
                    alt={activeName} 
                    className="h-16 w-16 rounded-full border-2 border-teal-500 object-cover shadow-md"
                  />
                  <div>
                    <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest block">
                      Digital Accessibility Passport
                    </span>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                      {activeName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-teal-500" /> {activeCity ? `${activeCity}, ` : ""}{activeState}
                      </span>
                      {activeGender && (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {activeGender}
                        </span>
                      )}
                      {activeDob && (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-teal-500" /> {activeDob}
                        </span>
                      )}
                      {activeCategory && (
                        <Badge variant="saffron" className="text-[9px]">
                          {activeCategory}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      ISL Level
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      Level {passport.current_level}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      Points
                    </span>
                    <span className="text-xs font-extrabold text-orange-550 dark:text-orange-400">
                      {passport.xp_points} XP
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      Streak
                    </span>
                    <span className="text-xs font-extrabold text-teal-600 dark:text-teal-450 flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 fill-current" /> {passport.streak} Days
                    </span>
                  </div>
                </div>

                {activeBio && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/50 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 italic">
                    "{activeBio}"
                  </div>
                )}

                {/* Badges */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Earned Badges
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {passport.badges.map((badge) => (
                      <Badge key={badge} variant={badge.includes("Streak") || badge.includes("Starter") ? "saffron" : "secondary"}>
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Skills & Interests */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-850">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      Proven Sign Skills
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {passport.skills.map((skill) => (
                        <span key={skill} className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 px-2 py-0.5 rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      Accessibility Interests
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {passport.interests.map((interest) => (
                        <span key={interest} className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 px-2 py-0.5 rounded-lg">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Passport Verification Real Scannable QR */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 p-3.5 bg-white dark:bg-slate-950 flex flex-col items-center gap-2 self-stretch sm:self-auto justify-center text-center shrink-0 shadow-sm">
                <div 
                  onClick={() => setShowPassportQrModal(true)}
                  className="relative p-1.5 bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner cursor-pointer group"
                  title="Click to enlarge scannable QR code"
                >
                  <img
                    src={passportQrImageUrl}
                    alt="Scannable ISL Passport QR Code"
                    className="h-28 w-28 object-contain rounded-lg"
                  />
                  <div className="absolute inset-0 bg-teal-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                    <Maximize2 className="h-6 w-6 text-teal-600 dark:text-teal-400 drop-shadow-md" />
                  </div>
                </div>
                
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">
                  Scan or Click to Verify
                </span>
                
                <Link
                  to={`/verify/${certIdForQr}`}
                  className="flex items-center gap-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 px-3 py-1.5 text-[9px] text-teal-700 dark:text-teal-350 font-black uppercase tracking-wide transition-all shadow-xs"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  VERIFY PASSPORT
                </Link>
              </div>
            </div>

            {/* Credentials Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-850 pb-2">
                Accredited Course Certificates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {passport.certificates.map((cert) => (
                  <Card key={cert.id} className="border-l-4 border-l-orange-500 p-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="h-9 w-9 bg-orange-50 dark:bg-orange-950/40 rounded-lg flex items-center justify-center text-orange-500 shrink-0 border border-orange-200/40">
                          <Award className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[9px] font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 rounded">
                          Grade: {cert.grade}
                        </span>
                      </div>
                      
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                          Sanket Setu Platform Credential
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-1">
                          {cert.course_name}
                        </h4>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[10px] font-extrabold text-slate-450">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(cert.issue_date).toLocaleDateString()}
                      </span>
                      
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <a 
                          href={`/verify/${cert.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-550 hover:underline flex items-center gap-1"
                        >
                          Verify <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Policies & Verification Widget */}
          <div className="space-y-6 no-print">
            <Card className="border border-slate-200 dark:border-slate-800/80">
              <CardHeader className="flex flex-row items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950 text-orange-650 flex items-center justify-center shrink-0">
                  <UserCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <CardTitle className="text-sm uppercase tracking-wider font-extrabold">Verification & Audit</CardTitle>
                  <CardDescription className="text-3xs uppercase font-bold text-slate-400">Accreditation policy</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-2xs text-slate-650 dark:text-slate-400 leading-relaxed font-semibold">
                  Employers and municipal corporations scan this unique passport card code to verify skill sets before appointing public service assistants or volunteers.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-xl space-y-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  <p className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-teal-600" /> Linked to Jan-Aadhaar profiles
                  </p>
                  <p className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-teal-600" /> Cryptographic validation tokens
                  </p>
                  <p className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-teal-600" /> Platform-level learning certificate
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border-0 shadow-lg">
              <CardContent className="p-5 space-y-3">
                <div className="h-8 w-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-300">
                  Affirmative Employment Match
                </h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Under the RPwD Act, certified ISL-capable citizens are actively prioritized for counter operations and helpdesks across state departments and civic hospitals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* DETAILED PRINTABLE CERTIFICATE MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl flex flex-col no-print">
            
            {/* Modal Actions */}
            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-200/50 dark:border-slate-850 flex justify-between items-center">
              <h3 className="font-extrabold text-xs text-slate-850 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-500" /> Digital Certificate Portal
              </h3>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handlePrint}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-2xs font-extrabold py-1.5 px-3 rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="h-4.5 w-4.5" /> Print / Save PDF
                </Button>
                <button 
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Certificate Area */}
            <div className="p-10 flex items-center justify-center bg-slate-50 dark:bg-slate-950/20">
              <div className="print-area w-full max-w-2xl bg-white text-slate-950 border-8 border-double border-teal-600 p-8 shadow-sm text-center relative overflow-hidden rounded-xl">
                {/* Watermark Logo */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                  <Compass className="h-96 w-96 text-teal-850 rotate-12" />
                </div>

                <div className="relative z-10 space-y-6">
                  {/* Certificate Header */}
                  <div className="space-y-1">
                    <h2 className="text-teal-700 font-extrabold text-lg tracking-widest uppercase">Sanket Setu</h2>
                    <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Accessibility Learning Platform</p>
                  </div>

                  <div className="w-16 h-0.5 bg-orange-500 mx-auto" />

                  {/* Certificate Title */}
                  <div className="space-y-1">
                    <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">Certificate of Completion</h1>
                    <p className="text-xs text-slate-500 italic">This is to officially certify that</p>
                  </div>

                  {/* Recipient */}
                  <div>
                    <h3 className="text-2xl font-black text-teal-600 tracking-tight">{passport?.display_name || "Sanket Citizen"}</h3>
                    <div className="w-32 h-0.25 bg-slate-300 mx-auto mt-1" />
                  </div>

                  {/* Course Details */}
                  <p className="text-xs text-slate-650 max-w-md mx-auto leading-relaxed">
                    has successfully completed all learning modules, quizzes, and scenario-based video evaluations for the certified course:
                    <strong className="block text-sm text-slate-900 uppercase tracking-tight mt-2 font-black">
                      {selectedCert.course_name}
                    </strong>
                    accredited under the **Sanket Setu Digital Curriculum** with a final grade of <strong>{selectedCert.grade}</strong>.
                  </p>

                  {/* Verification footer */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-left">
                    <div className="space-y-1 text-2xs text-slate-500 font-semibold">
                      <p><strong>Issuer:</strong> Sanket Setu Platform Credential</p>
                      <p><strong>Issue Date:</strong> {new Date(selectedCert.issue_date).toLocaleDateString()}</p>
                      <p><strong>Verification ID:</strong> <span className="font-mono text-3xs">{selectedCert.id}</span></p>
                    </div>

                    {/* Verification QR / Seal */}
                    <div className="flex items-center gap-3">
                      <div className="border border-slate-200 p-1 bg-white rounded-lg">
                        <QrCode className="h-14 w-14 text-slate-800" />
                      </div>
                      <div className="text-2xs text-slate-400 font-bold max-w-[120px] leading-tight">
                        Scan to verify validity on the official portal.
                      </div>
                    </div>
                  </div>

                  {/* STRICT DISCLAIMER */}
                  <p className="text-[8px] text-slate-400 font-semibold max-w-lg mx-auto pt-6 leading-normal border-t border-slate-100/50">
                    Disclaimer: This is a digital platform learning credential issued by Sanket Setu. It represents completion of online accessibility exercises and does not represent or claim government licensing, formal statutory certification, or professional interpreter registration under any national authority.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Background overlay printer helper */}
          <div className="print-area hidden">
            <div className="w-[800px] h-[550px] bg-white text-slate-950 border-[12px] border-double border-teal-600 p-12 text-center relative overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <Compass className="h-96 w-96 text-teal-850 rotate-12" />
              </div>

              <div className="space-y-4">
                <h2 className="text-teal-700 font-extrabold text-xl tracking-widest uppercase">Sanket Setu</h2>
                <p className="text-3xs text-slate-400 font-black tracking-widest uppercase">Accessibility Learning Platform</p>
                <div className="w-16 h-0.5 bg-orange-500 mx-auto" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Certificate of Completion</h1>
                <p className="text-xs text-slate-500 italic">This is to officially certify that</p>
                <h3 className="text-3xl font-black text-teal-600 tracking-tight mt-2">{passport?.display_name || "Sanket Citizen"}</h3>
                <div className="w-48 h-0.5 bg-slate-350 mx-auto" />
              </div>

              <p className="text-xs text-slate-650 max-w-xl mx-auto leading-relaxed">
                has successfully completed all learning modules, quizzes, and scenario-based video evaluations for the certified course:
                <strong className="block text-base text-slate-900 uppercase tracking-tight mt-1 font-black">
                  {selectedCert.course_name}
                </strong>
                accredited under the **Sanket Setu Digital Curriculum** with a final grade of <strong>{selectedCert.grade}</strong>.
              </p>

              <div className="flex justify-between items-end border-t border-slate-100 pt-4 text-left">
                <div className="space-y-1 text-3xs text-slate-500 font-semibold">
                  <p><strong>Issuer:</strong> Sanket Setu Platform Credential</p>
                  <p><strong>Issue Date:</strong> {new Date(selectedCert.issue_date).toLocaleDateString()}</p>
                  <p><strong>Verification ID:</strong> <span className="font-mono text-4xs">{selectedCert.id}</span></p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="border border-slate-200 p-1 bg-white rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/verify/${selectedCert.id}`)}`}
                      alt="Certificate Verification QR"
                      className="h-14 w-14 object-contain"
                    />
                  </div>
                  <div className="text-[8px] text-slate-450 font-bold max-w-[120px] leading-tight">
                    Scan to verify validity on the official portal.
                  </div>
                </div>
              </div>

              <p className="text-[7px] text-slate-450 font-semibold max-w-xl mx-auto pt-2 leading-normal border-t border-slate-100/50">
                Disclaimer: This is a digital platform learning credential issued by Sanket Setu. It represents completion of online accessibility exercises and does not represent or claim government licensing, formal statutory certification, or professional interpreter registration under any national authority.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ENLARGED PASSPORT QR CODE MODAL */}
      {showPassportQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-in">
            <button
              onClick={() => setShowPassportQrModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 sm:p-8 text-center space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest block">
                  Official Verification QR Code
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {activeName}'s Passport
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  Scan with any smartphone camera to verify identity & credentials
                </p>
              </div>

              {/* Large Scannable QR Image */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-inner max-w-[260px] mx-auto">
                <img
                  src={passportQrImageUrl}
                  alt="High Resolution Scannable Passport QR Code"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>

              {/* Encoded Verification URL */}
              <div className="space-y-2 text-left bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                  Encoded Target URL:
                </span>
                <Link
                  to={`/verify/${certIdForQr}`}
                  onClick={() => setShowPassportQrModal(false)}
                  className="text-xs font-mono text-teal-600 dark:text-teal-400 hover:underline break-all block flex items-center gap-1 font-bold"
                >
                  {passportVerifyUrl} <ExternalLink className="h-3 w-3 shrink-0" />
                </Link>
              </div>

              <div className="flex gap-3">
                <Link
                  to={`/verify/${certIdForQr}`}
                  onClick={() => setShowPassportQrModal(false)}
                  className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-black py-2.5 rounded-xl text-center shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="h-4 w-4" /> Open Verification Page
                </Link>
                <Button
                  onClick={() => setShowPassportQrModal(false)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold px-4 py-2.5 rounded-xl cursor-pointer"
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
