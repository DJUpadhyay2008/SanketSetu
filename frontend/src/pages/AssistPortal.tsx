import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Building2, MapPin, ArrowLeft, PhoneCall, Mic, MicOff, MessageSquare, 
  CheckCircle2, ChevronRight, HelpCircle, AlertCircle, Compass, CheckSquare
} from "lucide-react";
import { Button, Badge } from "../components/ui";

interface Dept {
  name: string;
  room: string;
  doctor: string;
  queue: number;
}

export default function AssistPortal() {
  const { slug } = useParams<{ category: string; slug: string }>();
  const navigate = useNavigate();

  // Selected Workflow Tabs
  const [activeWorkflow, setActiveWorkflow] = useState<string>("");

  // Token demo states
  const [tokenGenerated, setTokenGenerated] = useState<string | null>(null);
  const [tokenDetails, setTokenDetails] = useState<any | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "male",
    department: "Cardiology",
    course: "B.Tech CSE",
    service: "Disability Certificate Verification",
    scribeNeeded: "no"
  });

  // Assistance requested state
  const [assistanceRequested, setAssistanceRequested] = useState(false);

  // Communication Helper state
  const [commMode, setCommMode] = useState<"text" | "speech" | "isl">("text");
  const [userText, setUserText] = useState("");
  const [officerText, setOfficerText] = useState("");
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Static Institution Profile data
  const institutionDetails: Record<string, { title: string; type: string; address: string; workflows: string[] }> = {
    "kpgu-hospital": {
      title: "KP Gujarat University Hospital",
      type: "Hospital / Healthcare",
      address: "VIP Road, Vadodara, Gujarat - 390019",
      workflows: ["departments", "appointment", "documents", "directions", "assistance"]
    },
    "gandhinagar-univ": {
      title: "Gandhinagar University Campus",
      type: "College / Education",
      address: "Sarkhej-Gandhinagar Highway, Gujarat - 382421",
      workflows: ["admissions", "scholarships", "exams", "notices"]
    },
    "collector-office": {
      title: "District Collector Office, Vadodara",
      type: "Government Office / Civic",
      address: "Kothi Kacheri Compound, Vadodara, Gujarat - 390001",
      workflows: ["services", "process", "token", "status"]
    }
  };

  const currentInst = institutionDetails[slug || ""] || {
    title: "Demo Civic Center",
    type: "Public Services",
    address: "Central Ward, Vadodara, Gujarat",
    workflows: ["services", "documents", "token"]
  };

  useEffect(() => {
    if (currentInst.workflows.length > 0) {
      setActiveWorkflow(currentInst.workflows[0]);
    }
  }, [slug]);

  // Speech Recognition hook
  useEffect(() => {
    // Check for web speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN"; // English with Indian accent / Hindi support

      recognition.onresult = (event: any) => {
        let current = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            current += event.results[i][0].transcript + " ";
          }
        }
        if (current) {
          setSpeechTranscript((prev) => prev + current);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognitionInstance(recognition);
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionInstance) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionInstance.stop();
      setIsListening(false);
    } else {
      setSpeechTranscript("");
      recognitionInstance.start();
      setIsListening(true);
    }
  };

  const handleGenerateToken = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingToken(true);
    setTimeout(() => {
      let token = "";
      if (slug === "kpgu-hospital") {
        token = `H-${Math.floor(Math.random() * 800) + 100}`;
      } else if (slug === "gandhinagar-univ") {
        token = `EDU-${Math.floor(Math.random() * 800) + 100}`;
      } else {
        token = `GOVT-${Math.floor(Math.random() * 800) + 100}`;
      }
      setTokenGenerated(token);
      setTokenDetails({
        ...formData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setLoadingToken(false);
    }, 1000);
  };

  const requestOnSiteHelp = () => {
    setAssistanceRequested(true);
    setTimeout(() => {
      setAssistanceRequested(false);
      alert("Escort Alert Sent! An assistance officer is heading to the reception counter to help you.");
    }, 2000);
  };

  // Hospital departments mock data
  const hospitalDepts: Dept[] = [
    { name: "Cardiology", room: "Room 102 (First Floor)", doctor: "Dr. Amit Shah", queue: 3 },
    { name: "Orthopedics", room: "Room 104 (First Floor)", doctor: "Dr. Sarah Patel", queue: 5 },
    { name: "Pediatrics", room: "Room 108 (Ground Floor)", doctor: "Dr. Rohit Mehta", queue: 1 },
    { name: "ENT / Audiology", room: "Room 205 (Second Floor)", doctor: "Dr. Kiran Dave", queue: 2 }
  ];

  return (
    <div className="space-y-8 py-2">
      {/* Return button */}
      <button
        onClick={() => navigate("/assist")}
        className="flex items-center gap-2 text-2xs font-extrabold uppercase tracking-wider text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Sanket Assist
      </button>

      {/* Institution Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
        <div className="space-y-2">
          <Badge variant="saffron" className="text-2xs font-black tracking-wider uppercase">
            {currentInst.type}
          </Badge>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">{currentInst.title}</h1>
          <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-teal-500 shrink-0" />
            {currentInst.address}
          </p>
        </div>

        <div className="bg-teal-500/10 border border-teal-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-2">
          <Building2 className="h-5 w-5 text-teal-400" />
          <span className="text-2xs font-extrabold text-teal-400 uppercase tracking-widest">
            ISL-Ready Service Portal
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Center Columns: Accessible Workflows */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800/85 overflow-hidden shadow-xs flex flex-col md:flex-row min-h-[500px]">
            
            {/* Sidebar Navigation inside Portal */}
            <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 p-4 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3 px-2">Accessible Services</span>
              
              {currentInst.workflows.map((wf) => (
                <button
                  key={wf}
                  onClick={() => {
                    setActiveWorkflow(wf);
                    setTokenGenerated(null);
                  }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-2xs font-black uppercase tracking-wider transition-colors cursor-pointer flex justify-between items-center ${
                    activeWorkflow === wf
                      ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-l-3 border-teal-500"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  {wf.replace("_", " ")}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            {/* Workflow Workspace Panel */}
            <div className="flex-1 p-6 sm:p-8">
              
              {/* HOSPITAL WORKFLOWS */}
              {slug === "kpgu-hospital" && (
                <div className="space-y-6">
                  
                  {/* Departments */}
                  {activeWorkflow === "departments" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Active Departments</h3>
                        <p className="text-2xs text-slate-400 font-semibold mt-1">Real-time room allocation and queue wait-times.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {hospitalDepts.map((dept, i) => (
                          <div key={i} className="border border-slate-200 dark:border-slate-800/80 p-4.5 rounded-2xl flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/10">
                            <div className="space-y-1">
                              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{dept.name}</h4>
                              <p className="text-2xs text-slate-400 font-bold uppercase">{dept.room}</p>
                              <p className="text-2xs text-slate-500 font-semibold">Doctor: {dept.doctor}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black uppercase text-teal-500 bg-teal-500/10 px-2.5 py-1 rounded-full">
                                {dept.queue} In Queue
                              </span>
                              <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase">Est. Wait: {dept.queue * 15} Mins</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Book Appointment */}
                  {activeWorkflow === "appointment" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Book OP Appointment</h3>
                        <p className="text-2xs text-slate-400 font-semibold mt-1">Simulated check-in queue. Confirms and outputs queue number.</p>
                      </div>

                      {!tokenGenerated ? (
                        <form onSubmit={handleGenerateToken} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Patient Name</label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                              placeholder="e.g. Sanket Patel"
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-teal-500 font-semibold"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Age</label>
                              <input
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData(p => ({ ...p, age: e.target.value }))}
                                placeholder="e.g. 28"
                                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-teal-500 font-semibold"
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Department</label>
                              <select
                                value={formData.department}
                                onChange={(e) => setFormData(p => ({ ...p, department: e.target.value }))}
                                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-teal-500 font-semibold"
                              >
                                <option value="Cardiology">Cardiology</option>
                                <option value="Orthopedics">Orthopedics</option>
                                <option value="Pediatrics">Pediatrics</option>
                                <option value="ENT">ENT / Audiology</option>
                              </select>
                            </div>
                          </div>

                          <Button type="submit" variant="secondary" className="w-full text-xs font-black uppercase" disabled={loadingToken}>
                            {loadingToken ? "Generating..." : "Generate Appointment Token"}
                          </Button>
                        </form>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center space-y-4">
                          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Your Appointment Token</h4>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{tokenGenerated}</p>
                          </div>
                          <div className="text-2xs text-slate-500 dark:text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed border-t border-slate-200/50 dark:border-slate-800 pt-3">
                            <p><strong>Department:</strong> {tokenDetails.department}</p>
                            <p><strong>Patient:</strong> {tokenDetails.name} ({tokenDetails.age}y)</p>
                            <p><strong>Time Generated:</strong> {tokenDetails.timestamp}</p>
                            <p className="text-teal-600 dark:text-teal-400 font-bold mt-2">
                              ★ Go directly to Window 1 to verify. Hand over Aadhaar Card.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Documents Required */}
                  {activeWorkflow === "documents" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Required Documents</h3>
                        <p className="text-2xs text-slate-400 font-semibold mt-1">Please prepare the following certificates before proceeding to the OPD desk.</p>
                      </div>
                      <div className="space-y-3.5">
                        {[
                          "Government Aadhaar Card (Proof of identity)",
                          "UDID card / Disability certificate (For concession benefits)",
                          "Previous Medical History & Prescriptions",
                          "Income certificate (For BPL/Ayushman Bharat free check-ups)"
                        ].map((doc, idx) => (
                          <div key={idx} className="flex gap-3 items-start text-xs font-semibold text-slate-655 dark:text-slate-350">
                            <CheckSquare className="h-4.5 w-4.5 text-teal-500 shrink-0 mt-0.5" />
                            <span>{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visual Directions */}
                  {activeWorkflow === "directions" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Visual Floor Directions</h3>
                        <p className="text-2xs text-slate-400 font-semibold mt-1">Simplified room navigation map instructions.</p>
                      </div>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-900/20 space-y-4">
                        <div className="flex items-center gap-3">
                          <Compass className="h-5 w-5 text-orange-500" />
                          <span className="text-2xs font-extrabold text-orange-500 uppercase tracking-widest">Ground Floor Path</span>
                        </div>
                        <div className="relative border-l-2 border-dashed border-slate-300 dark:border-slate-800 pl-4 space-y-4 text-xs font-semibold">
                          <div className="relative">
                            <span className="absolute -left-[23px] top-0 h-3.5 w-3.5 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900" />
                            <p className="font-extrabold text-slate-900 dark:text-white uppercase text-3xs tracking-wider">Step 1: Main Entrance Gate</p>
                            <p className="text-slate-450 text-2xs leading-normal mt-0.5">Proceed straight through the automatic glass doors into the main lobby.</p>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[23px] top-0 h-3.5 w-3.5 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900" />
                            <p className="font-extrabold text-slate-900 dark:text-white uppercase text-3xs tracking-wider">Step 2: Reception Counter (Desk 1)</p>
                            <p className="text-slate-450 text-2xs leading-normal mt-0.5">Located on your immediate left. Present your generated token number here.</p>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[23px] top-0 h-3.5 w-3.5 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900" />
                            <p className="font-extrabold text-slate-900 dark:text-white uppercase text-3xs tracking-wider">Step 3: Cardiology Wing A</p>
                            <p className="text-slate-450 text-2xs leading-normal mt-0.5">Walk past the lobby elevators, take a right down Wing A. Room 102 is the third door on the right.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Physical Assistance */}
                  {activeWorkflow === "assistance" && (
                    <div className="space-y-6 text-center py-6">
                      <HelpCircle className="h-10 w-10 text-teal-500 mx-auto" />
                      <div className="space-y-2">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Need On-Site Staff Escort?</h3>
                        <p className="text-2xs text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
                          Click the button below to alert our reception coordinator. A trained assistant will meet you at the lobby desk to assist with wheelchairs or ISL documentation.
                        </p>
                      </div>
                      <Button
                        onClick={requestOnSiteHelp}
                        disabled={assistanceRequested}
                        variant="secondary"
                        className="px-6 py-2.5 text-2xs uppercase tracking-wider font-extrabold"
                      >
                        {assistanceRequested ? "Dispatching Escort..." : "Request Staff Assistance"}
                      </Button>
                    </div>
                  )}

                </div>
              )}

              {/* COLLEGE WORKFLOWS */}
              {slug === "gandhinagar-univ" && (
                <div className="space-y-6">
                  
                  {/* Admissions */}
                  {activeWorkflow === "admissions" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Accessible Admission Portal</h3>
                        <p className="text-2xs text-slate-400 font-semibold mt-1">Book slots for certificates verification or ask about intake criteria.</p>
                      </div>

                      {!tokenGenerated ? (
                        <form onSubmit={handleGenerateToken} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Candidate Name</label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                              placeholder="e.g. Ramesh Kumar"
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-teal-500 font-semibold"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Target Course</label>
                              <select
                                value={formData.course}
                                onChange={(e) => setFormData(p => ({ ...p, course: e.target.value }))}
                                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-teal-500 font-semibold"
                              >
                                <option value="B.Tech CSE">B.Tech CSE (4 Years)</option>
                                <option value="MBA Finance">MBA Finance (2 Years)</option>
                                <option value="B.Sc Computer Science">B.Sc Computer Science</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Disability Classification</label>
                              <select
                                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-teal-500 font-semibold"
                              >
                                <option value="hearing">Hearing Impairment</option>
                                <option value="locomotor">Locomotor</option>
                                <option value="none">None</option>
                              </select>
                            </div>
                          </div>

                          <Button type="submit" variant="secondary" className="w-full text-xs font-black uppercase" disabled={loadingToken}>
                            {loadingToken ? "Generating..." : "Book Verification Slot"}
                          </Button>
                        </form>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center space-y-4">
                          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Verification Token Number</h4>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{tokenGenerated}</p>
                          </div>
                          <div className="text-2xs text-slate-500 dark:text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed border-t border-slate-200/50 dark:border-slate-800 pt-3">
                            <p><strong>Course Applied:</strong> {tokenDetails.course}</p>
                            <p><strong>Candidate:</strong> {tokenDetails.name}</p>
                            <p><strong>Verification Counter:</strong> Counter 3, Admin Wing</p>
                            <p className="text-teal-600 dark:text-teal-400 font-bold mt-2">
                              ★ Bring 10th/12th marksheets, Aadhaar, and original disability certificate.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scholarships */}
                  {activeWorkflow === "scholarships" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Disability Welfare Fellowships</h3>
                        <p className="text-2xs text-slate-400 font-semibold mt-1">Direct access to state & central sponsored education scholarships.</p>
                      </div>
                      <div className="space-y-4">
                        <div className="border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl space-y-2">
                          <Badge variant="saffron">Central Govt Scheme</Badge>
                          <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 uppercase">National Fellowship (NFPwD)</h4>
                          <p className="text-2xs text-slate-450 font-semibold leading-relaxed">Offers doctoral and fellowship grants up to Rs. 31,000/month. Complete documents verification at the university registrar desk.</p>
                        </div>
                        <div className="border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl space-y-2">
                          <Badge variant="secondary">Gujarat State Scheme</Badge>
                          <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 uppercase">Post-Matric Scholarship for Divyangs</h4>
                          <p className="text-2xs text-slate-450 font-semibold leading-relaxed">Full tuition fee reimbursement for hearing-impaired students enrolled in engineering courses. Apply via Digital Gujarat Portal.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exams */}
                  {activeWorkflow === "exams" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Special Exam Accommodations</h3>
                        <p className="text-2xs text-slate-400 font-semibold mt-1">Apply for extended exam hours or certified scribe assignments.</p>
                      </div>

                      {!tokenGenerated ? (
                        <form onSubmit={handleGenerateToken} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Student Register No / Name</label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                              placeholder="e.g. Ramesh Kumar"
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-teal-500 font-semibold"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Scribe Needed?</label>
                              <select
                                value={formData.scribeNeeded}
                                onChange={(e) => setFormData(p => ({ ...p, scribeNeeded: e.target.value }))}
                                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-teal-500 font-semibold"
                              >
                                <option value="no">No (Only extra 60 mins time needed)</option>
                                <option value="yes">Yes (Assign certified university scribe)</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Degree Course</label>
                              <select
                                value={formData.course}
                                onChange={(e) => setFormData(p => ({ ...p, course: e.target.value }))}
                                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-teal-500 font-semibold"
                              >
                                <option value="B.Tech CSE">B.Tech CSE</option>
                                <option value="B.Sc CSE">B.Sc Computer Science</option>
                              </select>
                            </div>
                          </div>

                          <Button type="submit" variant="secondary" className="w-full text-xs font-black uppercase" disabled={loadingToken}>
                            {loadingToken ? "Generating..." : "Submit Accommodation Form"}
                          </Button>
                        </form>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center space-y-4">
                          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Accommodation Status</h4>
                            <p className="text-xl font-black text-slate-900 dark:text-white">APPROVED</p>
                          </div>
                          <div className="text-2xs text-slate-500 dark:text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed border-t border-slate-200/50 dark:border-slate-800 pt-3">
                            <p><strong>Accommodations:</strong> +60 Minutes Extra Time granted.</p>
                            {tokenDetails.scribeNeeded === "yes" && <p><strong>Scribe Assigned:</strong> Prof. S. Sen (Dept. of IT)</p>}
                            <p><strong>Exams Desk:</strong> Admin Block Room 201</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notices */}
                  {activeWorkflow === "notices" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Simplified Campus Bulletins</h3>
                        <p className="text-2xs text-slate-400 font-semibold mt-1">High-contrast accessibility updates for deaf students.</p>
                      </div>
                      <div className="space-y-4">
                        <div className="border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl space-y-2">
                          <Badge variant="danger">IMPORTANT</Badge>
                          <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 uppercase">Mid-Semester Exam Schedule Release</h4>
                          <p className="text-2xs text-slate-450 font-semibold leading-relaxed">Exams start Sept 10. Forms deadline extended to Sept 3. Accessible hall tickets can be downloaded from student portal.</p>
                        </div>
                        <div className="border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl space-y-2">
                          <Badge variant="success">SCHOLARSHIP</Badge>
                          <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 uppercase">National Scholarship Verification Drive</h4>
                          <p className="text-2xs text-slate-450 font-semibold leading-relaxed">Submit BPL/income certificates to counter 4 before August 30 for verification approvals.</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* GOVERNMENT OFFICE WORKFLOWS */}
              {slug === "collector-office" && (
                <div className="space-y-6">
                  
                  {/* Service Selection */}
                  {activeWorkflow === "services" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Civic Services Selection</h3>
                        <p className="text-2xs text-slate-400 font-semibold mt-1">Select public welfare service desk directory.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { title: "Disability Certificate Verification", desk: "Desk 4, Ground Floor", docs: "Aadhaar + Form 3 + Medical report" },
                          { title: "Divyang Sahay Pension Registration", desk: "Desk 7, Ground Floor", docs: "Domicile proof + BPL Card + Bank passbook" },
                          { title: "Aadhaar Card Demographic Correction", desk: "Desk 1, First Floor", docs: "Birth proof / ID copy" }
                        ].map((srv, idx) => (
                          <div key={idx} className="border border-slate-200 dark:border-slate-800/80 p-4.5 rounded-2xl bg-slate-50/30 dark:bg-slate-900/10 space-y-1.5">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{srv.title}</h4>
                            <p className="text-2xs text-teal-600 dark:text-teal-400 font-bold">Counter: {srv.desk}</p>
                            <p className="text-2xs text-slate-400 font-semibold">Docs needed: {srv.docs}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Process Map */}
                  {activeWorkflow === "process" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Interactive Process Timeline</h3>
                        <p className="text-2xs text-slate-400 font-semibold mt-1">Follow these exact workflow stages step-by-step.</p>
                      </div>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-900/20 space-y-4">
                        <div className="relative border-l-2 border-dashed border-slate-350 dark:border-slate-800 pl-4 space-y-4 text-xs font-semibold">
                          <div className="relative">
                            <span className="absolute -left-[23px] top-0 h-3.5 w-3.5 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900" />
                            <p className="font-extrabold text-slate-900 dark:text-white uppercase text-3xs tracking-wider">Step 1: Get Token Desk</p>
                            <p className="text-slate-450 text-2xs leading-normal mt-0.5">Collect service-specific token. Deaf citizens get SMS alerts on queue updates.</p>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[23px] top-0 h-3.5 w-3.5 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900" />
                            <p className="font-extrabold text-slate-900 dark:text-white uppercase text-3xs tracking-wider">Step 2: Counter Document Audit</p>
                            <p className="text-slate-450 text-2xs leading-normal mt-0.5">Present token and original documents. Officer audits and logs eligibility.</p>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[23px] top-0 h-3.5 w-3.5 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900" />
                            <p className="font-extrabold text-slate-900 dark:text-white uppercase text-3xs tracking-wider">Step 3: Approval Signoff</p>
                            <p className="text-slate-450 text-2xs leading-normal mt-0.5">Sign digital verification register. Receipt will print automatically.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Token Generation */}
                  {activeWorkflow === "token" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Generate Civic Queue Token</h3>
                        <p className="text-2xs text-slate-400 font-semibold mt-1">Obtain digital queue placement prior to waiting at counters.</p>
                      </div>

                      {!tokenGenerated ? (
                        <form onSubmit={handleGenerateToken} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Applicant Name</label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                              placeholder="e.g. Ramesh Patel"
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-teal-500 font-semibold"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Requested Service</label>
                            <select
                              value={formData.service}
                              onChange={(e) => setFormData(p => ({ ...p, service: e.target.value }))}
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-teal-500 font-semibold"
                            >
                              <option value="Disability Certificate Verification">Disability Certificate Verification</option>
                              <option value="Divyang Sahay Pension Registration">Divyang Sahay Pension Registration</option>
                              <option value="Aadhaar Correction">Aadhaar Correction</option>
                            </select>
                          </div>

                          <Button type="submit" variant="secondary" className="w-full text-xs font-black uppercase" disabled={loadingToken}>
                            {loadingToken ? "Generating..." : "Generate Queue Token"}
                          </Button>
                        </form>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center space-y-4">
                          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Queue Token Generated</h4>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{tokenGenerated}</p>
                          </div>
                          <div className="text-2xs text-slate-500 dark:text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed border-t border-slate-200/50 dark:border-slate-800 pt-3">
                            <p><strong>Service:</strong> {tokenDetails.service}</p>
                            <p><strong>Applicant:</strong> {tokenDetails.name}</p>
                            <p><strong>Waiting Counter:</strong> Window 7, Ground Floor</p>
                            <p className="text-teal-600 dark:text-teal-400 font-bold mt-2">
                              ★ Present this token when your number is called. You will receive an SMS reminder when 2 people are ahead of you.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>

        {/* Right Column: SANKET COMMUNICATION HELPER WIDGET */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[520px]">
            {/* Header */}
            <div className="bg-slate-950 p-4.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center">
                  <MessageSquare className="h-4.5 w-4.5 text-slate-950" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-sm tracking-tight">Communication Assist</h3>
                  <p className="text-[9px] text-teal-350 font-bold uppercase tracking-wider">At-Counter Support Interface</p>
                </div>
              </div>

              <div className="flex bg-slate-800 p-0.5 rounded-lg">
                <button 
                  onClick={() => setCommMode("text")}
                  className={`px-2 py-1 text-[9px] font-black uppercase rounded-md transition-colors cursor-pointer ${commMode === "text" ? "bg-teal-500 text-slate-950" : "text-slate-400"}`}
                >
                  Text
                </button>
                <button 
                  onClick={() => setCommMode("speech")}
                  className={`px-2 py-1 text-[9px] font-black uppercase rounded-md transition-colors cursor-pointer ${commMode === "speech" ? "bg-teal-500 text-slate-950" : "text-slate-400"}`}
                >
                  Speech
                </button>
                <button 
                  onClick={() => setCommMode("isl")}
                  className={`px-2 py-1 text-[9px] font-black uppercase rounded-md transition-colors cursor-pointer ${commMode === "isl" ? "bg-teal-500 text-slate-950" : "text-slate-400"}`}
                >
                  Live
                </button>
              </div>
            </div>

            {/* Mode workspaces */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-semibold">
              
              {/* Text Mode */}
              {commMode === "text" && (
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-3.5 flex-1">
                    {/* User message */}
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                      <span className="text-[9px] font-black uppercase tracking-wider text-teal-500 block">Deaf Beneficiary Text</span>
                      <p className="text-slate-850 dark:text-slate-200 text-xs">
                        {userText || <span className="italic text-slate-400 font-normal">Type what you want to communicate below...</span>}
                      </p>
                    </div>

                    {/* Officer message */}
                    <div className="space-y-1 bg-orange-50/20 dark:bg-orange-950/10 p-3 rounded-2xl border border-orange-200/30 dark:border-orange-900/20">
                      <span className="text-[9px] font-black uppercase tracking-wider text-orange-500 block">Counter Officer Response</span>
                      <p className="text-slate-850 dark:text-slate-200 text-xs">
                        {officerText || <span className="italic text-slate-400 font-normal">Officer can type reply in counter input...</span>}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Type message for Officer</label>
                      <input 
                        type="text" 
                        value={userText}
                        onChange={(e) => setUserText(e.target.value)}
                        placeholder="e.g. I need to apply for Aadhaar correction..."
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Officer Reply Input</label>
                      <input 
                        type="text" 
                        value={officerText}
                        onChange={(e) => setOfficerText(e.target.value)}
                        placeholder="e.g. Please present your original school marksheet."
                        className="w-full rounded-xl border border-slate-350 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Speech to Text Mode */}
              {commMode === "speech" && (
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="bg-teal-500/5 border border-teal-500/10 p-3 rounded-2xl text-[10px] text-teal-600 dark:text-teal-450 leading-relaxed">
                      ★ <strong>Speech-to-Text:</strong> Ask the Counter Officer to talk. Their voice will be translated into accessible reading text.
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 min-h-[160px] bg-slate-50/50 dark:bg-slate-950">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">Transcribed Voice Text</span>
                      {speechTranscript ? (
                        <p className="text-slate-850 dark:text-slate-200 text-xs leading-relaxed font-bold">{speechTranscript}</p>
                      ) : (
                        <p className="text-slate-400 font-normal italic text-xs">Waiting for speech... Press "Start Listening" below and talk clearly.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-450">Speech Recognition Status</span>
                    <Button 
                      onClick={toggleListening}
                      variant={isListening ? "danger" : "secondary"}
                      className="px-4.5 py-2 text-2xs uppercase tracking-wider font-extrabold flex items-center gap-1.5"
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-3.5 w-3.5 animate-pulse" /> Stop Listening
                        </>
                      ) : (
                        <>
                          <Mic className="h-3.5 w-3.5" /> Start Listening
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Live ISL Interpreter */}
              {commMode === "isl" && (
                <div className="space-y-4 text-center py-8">
                  <div className="h-14 w-14 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
                    <PhoneCall className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-widest">Sanket Live Video Relay</h4>
                    <p className="text-2xs text-slate-450 leading-relaxed font-semibold max-w-xs mx-auto">
                      <strong>Coming Soon:</strong> Real-time certified sign language translator video relay pilot. Currently being integrated with district collectors and civic bureaus.
                    </p>
                  </div>
                  <div className="border border-dashed border-slate-250 dark:border-slate-800 p-4 rounded-xl text-[10px] text-slate-450 font-normal leading-normal italic">
                    Note: Unrestricted sign-to-text real-time AI translation is not claimed. We connect users to human volunteers.
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="rounded-2xl bg-orange-50/20 dark:bg-orange-950/10 p-4 border border-orange-200/35 dark:border-orange-900/30 text-2xs text-slate-650 dark:text-slate-400 flex gap-2.5 items-start">
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-1 font-semibold leading-relaxed">
              <p className="font-extrabold text-orange-700 dark:text-orange-450 uppercase tracking-wider">Demo / Sandbox Mode</p>
              <p>Workflows are local sandboxed simulations. Confirmed queue tokens do not link to real hospital or university systems.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
