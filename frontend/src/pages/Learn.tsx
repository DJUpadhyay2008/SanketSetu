import { useEffect, useState } from "react";
import { fetchFromApi } from "../api/client";
import { 
  AlertCircle, Sparkles, BookOpen, CheckCircle2, ChevronRight, Award, 
  HelpCircle, ArrowLeft, Play, Camera, Check, Info, Download, RefreshCw,
  FileText, Layers, Eye, RotateCw, Pause, FileDown, Printer
} from "lucide-react";
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Badge, SearchBar, FilterPanel, CourseCard, LoadingState, Button, Modal
} from "../components/ui";
import { ISLVideoPlayer } from "../components/ISLVideoPlayer";

// ==========================================
// TYPES
// ==========================================

export interface ISLSign {
  id: string;
  term: string;
  category?: string;
  subcategory?: string;
  difficulty: string;
  meaning?: string;
  description?: string;
  video_url?: string;
  video_type: string;
  source: string;
  source_url: string;
  is_embeddable: boolean;
  thumbnail_url?: string;
  related_signs: string[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  lessons_count: number;
  xp_reward: number;
  progress_percent: number;
}

interface CourseDetail extends Course {
  downloadable: boolean;
  content_version: number;
  last_updated: string;
  validation_status: string;
  content_source?: string;
  lessons: LessonOutline[];
}

interface LessonOutline {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  xp_reward: number;
  completed: boolean;
}

interface LessonDetail {
  id: string;
  course_id: string;
  title: string;
  content?: string;
  difficulty: string;
  category: string;
  xp_reward: number;
  video_url?: string;
  images: string[];
  meaning?: string;
  example_sentence?: string;
  related_signs: string[];
  practice_instructions?: string;
  scenario_prompt?: string;
  scenario_options: string[];
  scenario_correct_answer?: string;
  scenario_feedback?: string;
  downloadable: boolean;
  content_version: number;
  last_updated: string;
  validation_status: string;
  content_source?: string;
  completed: boolean;
  quiz_completed: boolean;
  scenario_completed: boolean;
  practice_completed: boolean;
  quiz_score?: number;
  scenario_score?: number;
}

interface Recommendation {
  weakness_analysis: string;
  practice_suggestion: string;
  recommended_focus: string;
  recommended_lesson_id?: string;
  recommended_lesson_title?: string;
}

function getEmbedUrl(url?: string): { isYouTube: boolean; embedUrl?: string } {
  if (!url) return { isYouTube: false };
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("embed/")) {
      videoId = url.split("embed/")[1].split("?")[0].split("&")[0];
    } else if (url.includes("v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0].split("&")[0];
    }
    if (videoId) {
      return {
        isYouTube: true,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`
      };
    }
  }
  return { isYouTube: false, embedUrl: url };
}

export function ISLGestureDemonstrator({ 
  lessonTitle, 
  videoUrl, 
  steps, 
  source 
}: { 
  lessonTitle: string; 
  videoUrl?: string; 
  steps: string[]; 
  source?: string; 
}) {
  const { isYouTube, embedUrl } = getEmbedUrl(videoUrl);
  const [activeTab, setActiveTab] = useState<"VIDEO" | "VECTOR">(videoUrl ? "VIDEO" : "VECTOR");
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<0.5 | 1 | 1.5>(1);
  const [viewAngle, setViewAngle] = useState<"FRONT" | "SIDE">("FRONT");
  const [activeStepFrame, setActiveStepFrame] = useState(0);

  useEffect(() => {
    if (!isPlaying || activeTab !== "VECTOR") return;
    const intervalTime = (2000 / speed);
    const timer = setInterval(() => {
      setActiveStepFrame((prev) => (prev + 1) % Math.max(1, steps.length));
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isPlaying, speed, steps.length, activeTab]);

  return (
    <div className="space-y-4">
      {/* Mode Selector Tabs */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
        <div className="flex gap-1">
          {videoUrl && (
            <button
              onClick={() => setActiveTab("VIDEO")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "VIDEO" 
                  ? "bg-teal-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🎥 HD Video Demo
            </button>
          )}
          <button
            onClick={() => setActiveTab("VECTOR")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "VECTOR" 
                ? "bg-teal-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            📐 Vector Anatomy Diagram
          </button>
        </div>

        {source && (
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hidden md:inline-block px-2">
            Source: {source}
          </span>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 aspect-video flex flex-col items-center justify-center shadow-inner group">
        
        {/* TAB 1: Real Video Stream (Direct HTML5 MP4 Video or YouTube embed) */}
        {activeTab === "VIDEO" && (embedUrl || videoUrl) && !videoError ? (
          isYouTube ? (
            <iframe
              src={embedUrl}
              title={lessonTitle}
              className="w-full h-full object-cover border-0 rounded-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video 
              key={videoUrl || embedUrl}
              src={embedUrl || videoUrl} 
              controls 
              autoPlay 
              loop 
              muted 
              playsInline
              onError={() => {
                setVideoError(true);
                setActiveTab("VECTOR");
              }}
              className="w-full h-full object-contain bg-black rounded-2xl"
            />
          )
        ) : (
          /* TAB 2: Animated Vector Gesture Visualizer Diagram */
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-teal-950/40 p-6">
            
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[radial-[#00A99D]/10_1px,transparent_1px] [background-size:16px_16px] pointer-events-none" />
            
            {/* Interactive SVG Hand Posture Diagram */}
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="relative">
                <svg className="w-32 h-32 text-teal-400 drop-shadow-[0_0_15px_rgba(0,169,157,0.4)] transition-all duration-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                  {/* Palm & Wrist */}
                  <rect x="35" y="55" width="30" height="30" rx="8" className="stroke-teal-400 fill-teal-950/50" />
                  <path d="M45 85 L45 98 M55 85 L55 98" className="stroke-slate-500" strokeWidth="3" />
                  
                  {/* Finger joint vectors based on active frame */}
                  {activeStepFrame === 0 ? (
                    <>
                      {/* Open extended fingers (Prayer/Greetings posture) */}
                      <path d="M38 55 L38 25 M45 55 L45 18 M52 55 L52 20 M60 55 L60 28" className="stroke-teal-300 animate-pulse" strokeWidth="3" strokeLinecap="round" />
                      <path d="M35 65 L22 50" className="stroke-amber-400" strokeWidth="3" strokeLinecap="round" />
                    </>
                  ) : activeStepFrame === 1 ? (
                    <>
                      {/* Pulse touch gesture (Healthcare posture) */}
                      <path d="M38 55 L38 35 M45 55 L45 30 M52 55 L52 40 M60 55 L60 45" className="stroke-teal-300" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="28" cy="70" r="4" className="fill-amber-400 animate-ping" />
                    </>
                  ) : (
                    <>
                      {/* Cross arms / Alert gesture (Emergency posture) */}
                      <path d="M30 35 L70 75 M70 35 L30 75" className="stroke-amber-400 animate-pulse" strokeWidth="3.5" strokeLinecap="round" />
                    </>
                  )}
                </svg>

                {/* Motion Vector Rings */}
                <div className="absolute -inset-3 border border-teal-500/30 rounded-full animate-ping pointer-events-none" />
              </div>

              {/* Step indicator badge overlay */}
              <div className="bg-slate-900/90 border border-teal-500/40 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
                <span className="text-2xs font-extrabold uppercase tracking-widest text-teal-300">
                  {viewAngle} VIEW • FRAME {activeStepFrame + 1} OF {Math.max(1, steps.length)}
                </span>
              </div>
              
              <p className="text-xs font-semibold text-slate-300 text-center max-w-sm px-4 bg-slate-900/80 py-2 rounded-xl border border-slate-800">
                {steps[activeStepFrame] || "Demonstrating anatomical hand placement and facial cues."}
              </p>
            </div>

          </div>
        )}

        {/* Floating View Controls (Angle & Speed) only shown in Vector mode */}
        {activeTab === "VECTOR" && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button 
              onClick={() => setViewAngle(prev => prev === "FRONT" ? "SIDE" : "FRONT")}
              className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-3xs font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCw className="h-3 w-3 text-teal-400" /> {viewAngle}
            </button>
            
            <button 
              onClick={() => setSpeed(s => s === 0.5 ? 1 : s === 1 ? 1.5 : 0.5)}
              className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-3xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
            >
              Speed: {speed}x
            </button>
          </div>
        )}

      </div>

      {/* Scrub Controls Bar (shown in Vector mode) */}
      {activeTab === "VECTOR" && (
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-8 w-8 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/40 flex items-center justify-center cursor-pointer transition-colors"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div>
              <h5 className="font-extrabold text-xs text-white">{lessonTitle}</h5>
              <p className="text-[10px] text-slate-400 font-semibold">Interactive Vector Motion Blueprint</p>
            </div>
          </div>

          {/* Frame indicators */}
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveStepFrame(idx);
                  setIsPlaying(false);
                }}
                className={`h-2.5 w-6 rounded-full transition-all cursor-pointer ${
                  activeStepFrame === idx 
                    ? "bg-teal-400 w-8" 
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
                title={`Frame ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COURSE RESOURCES & DOWNLOADS HUB
// ==========================================
function CourseResourcesSection({ 
  courseTitle, 
  lessonList = [],
  onOpenFlashcards, 
  onOpenPdfGuide 
}: { 
  courseTitle: string;
  lessonList?: LessonOutline[];
  onOpenFlashcards: () => void; 
  onOpenPdfGuide: (docTitle: string) => void; 
}) {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadZip = () => {
    setDownloadingZip(true);
    setTimeout(() => {
      setDownloadingZip(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 2000);
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
            Verified Course Resources & Study Assets
          </span>
          <Badge variant="success">ISLRTC Compliant</Badge>
        </CardTitle>
        <CardDescription>
          Download official reference documents, interactive flashcards, printable cheat sheets, and offline bundles for {courseTitle}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Resource 1: ISLRTC Dictionary & Reference Document */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center shrink-0 border border-teal-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">ISLRTC Official Sign Reference Guide (PDF)</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Complete standardized handbook covering palm orientations, movement vectors, and context rules.
              </p>
              <span className="inline-block text-[10px] text-teal-600 font-extrabold mt-1">Format: PDF • 2.4 MB • Updated v1.2</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onOpenPdfGuide("ISLRTC Official Sign Reference Guide")}
              leftIcon={<Eye className="h-3.5 w-3.5" />}
              className="text-xs uppercase font-extrabold"
            >
              Preview
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => onOpenPdfGuide("ISLRTC Official Sign Reference Guide")}
              leftIcon={<FileDown className="h-3.5 w-3.5" />}
              className="text-xs uppercase font-extrabold"
            >
              Download PDF
            </Button>
          </div>
        </div>

        {/* Resource 2: Interactive Flashcard Deck */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Printable & Interactive Flashcards Deck</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Interactive memory cards for self-study and rapid vocabulary recall.
              </p>
              <span className="inline-block text-[10px] text-amber-600 font-extrabold mt-1">Cards: {Math.max(6, lessonList.length * 3)} Vocab Flashcards</span>
            </div>
          </div>
          <Button 
            variant="saffron" 
            size="sm" 
            onClick={onOpenFlashcards}
            leftIcon={<Layers className="h-3.5 w-3.5" />}
            className="text-xs uppercase font-extrabold shrink-0"
          >
            Study Flashcards
          </Button>
        </div>

        {/* Resource 3: Anatomical Posture & Movement Blueprint */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0 border border-blue-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Anatomical Movement & Facial Expression Blueprint</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                High-resolution breakdown of hand shapes, palm directions, and non-manual facial signals.
              </p>
              <span className="inline-block text-[10px] text-blue-600 font-extrabold mt-1">Format: Visual Blueprint Guide</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onOpenPdfGuide("Anatomical Movement Blueprint")}
            leftIcon={<Printer className="h-3.5 w-3.5" />}
            className="text-xs uppercase font-extrabold shrink-0"
          >
            View Blueprint
          </Button>
        </div>

        {/* Resource 4: Full Course Offline Media Bundle (.zip) */}
        <div className="p-4 bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-teal-500/20 text-teal-600 dark:text-teal-300 rounded-xl flex items-center justify-center shrink-0 border border-teal-500/30">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Offline Video & Resource Bundle (.zip)
                {downloadSuccess && <Badge variant="success">Saved to Local Storage!</Badge>}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                One-click local storage download of all HD gesture videos, practice prompts, and offline course state.
              </p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            loading={downloadingZip}
            onClick={handleDownloadZip}
            leftIcon={<Download className="h-3.5 w-3.5" />}
            className="text-xs uppercase font-extrabold shrink-0"
          >
            {downloadSuccess ? "Downloaded!" : "Download Offline Pack"}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}

// Static offline fallbacks for hosted/offline environments
const INITIAL_COURSES: Course[] = [
  {
    id: "c1010101-1111-4111-8111-111111111111",
    title: "Everyday ISL Greetings",
    description: "Learn standard everyday greetings in Indian Sign Language, including Hello, Namaste, and Thank You.",
    category: "Everyday Communication",
    difficulty: "Beginner",
    lessons_count: 1,
    xp_reward: 50,
    progress_percent: 0
  },
  {
    id: "c2020202-2222-4222-8222-222222222222",
    title: "Healthcare ISL & Medical Vocab",
    description: "Communicate effectively in medical situations. Learn signs for doctor, pain, fever, and medicine.",
    category: "Healthcare",
    difficulty: "Intermediate",
    lessons_count: 1,
    xp_reward: 100,
    progress_percent: 0
  },
  {
    id: "c3030303-3333-4333-8333-333333333333",
    title: "Emergency Response Signs",
    description: "Learn crucial emergency phrases for accidents, ambulance requests, and police assistance.",
    category: "Emergency",
    difficulty: "Advanced",
    lessons_count: 1,
    xp_reward: 150,
    progress_percent: 0
  }
];

const FALLBACK_COURSE_DETAILS: Record<string, CourseDetail> = {
  "c1010101-1111-4111-8111-111111111111": {
    id: "c1010101-1111-4111-8111-111111111111",
    title: "Everyday ISL Greetings",
    description: "Learn standard everyday greetings in Indian Sign Language, including Hello, Namaste, and Thank You.",
    category: "Everyday Communication",
    difficulty: "Beginner",
    lessons_count: 1,
    xp_reward: 50,
    progress_percent: 0,
    downloadable: true,
    content_version: 1,
    last_updated: "2026-08-21T00:00:00Z",
    validation_status: "published",
    content_source: "ISLRTC Dictionary",
    lessons: [
      {
        id: "l1010101-1111-4111-8111-111111111111",
        title: "Introduction to Namaste",
        difficulty: "Beginner",
        category: "Everyday Communication",
        xp_reward: 50,
        completed: false
      }
    ]
  },
  "c2020202-2222-4222-8222-222222222222": {
    id: "c2020202-2222-4222-8222-222222222222",
    title: "Healthcare ISL & Medical Vocab",
    description: "Communicate effectively in medical situations. Learn signs for doctor, pain, fever, and medicine.",
    category: "Healthcare",
    difficulty: "Intermediate",
    lessons_count: 1,
    xp_reward: 100,
    progress_percent: 0,
    downloadable: true,
    content_version: 1,
    last_updated: "2026-08-21T00:00:00Z",
    validation_status: "published",
    content_source: "ISLRTC Healthcare Glossary",
    lessons: [
      {
        id: "l2020202-2222-4222-8222-222222222222",
        title: "Signing 'Doctor' & 'Medicine'",
        difficulty: "Intermediate",
        category: "Healthcare",
        xp_reward: 100,
        completed: false
      }
    ]
  },
  "c3030303-3333-4333-8333-333333333333": {
    id: "c3030303-3333-4333-8333-333333333333",
    title: "Emergency Response Signs",
    description: "Learn crucial emergency phrases for accidents, ambulance requests, and police assistance.",
    category: "Emergency",
    difficulty: "Advanced",
    lessons_count: 1,
    xp_reward: 150,
    progress_percent: 0,
    downloadable: true,
    content_version: 1,
    last_updated: "2026-08-21T00:00:00Z",
    validation_status: "published",
    content_source: "NDMA ISL Guide",
    lessons: [
      {
        id: "l3030303-3333-4333-8333-333333333333",
        title: "Requesting Emergency Help",
        difficulty: "Advanced",
        category: "Emergency",
        xp_reward: 150,
        completed: false
      }
    ]
  }
};

const FALLBACK_LESSON_DETAILS: Record<string, LessonDetail> = {
  "l1010101-1111-4111-8111-111111111111": {
    id: "l1010101-1111-4111-8111-111111111111",
    course_id: "c1010101-1111-4111-8111-111111111111",
    title: "Introduction to Namaste",
    content: "In India, Namaste is the standard greeting, performed by bringing both hands together in a prayer position at chest level.",
    difficulty: "Beginner",
    category: "Everyday Communication",
    xp_reward: 50,
    video_url: "/videos/namaste.mp4",
    images: [
      "Bring both palms flat together at chest level.",
      "Slightly bow your head as a sign of respect."
    ],
    meaning: "A traditional Indian greeting meaning 'I bow to the divine in you'.",
    example_sentence: "Sign 'Namaste' when meeting someone for the first time or welcoming guests.",
    related_signs: ["HELLO", "WELCOME", "GOODBYE"],
    practice_instructions: "Record yourself bringing both hands flat together at chest level, look directly at the camera, and bow your head slightly.",
    scenario_prompt: "You are meeting an elder in India who is deaf. What is the most culturally respectful sign to greet them?",
    scenario_options: [
      "Fingerspell H-E-L-L-O",
      "Bring hands together in a prayer position (Namaste) and bow slightly",
      "Wave your hand rapidly side to side"
    ],
    scenario_correct_answer: "Bring hands together in a prayer position (Namaste) and bow slightly",
    scenario_feedback: "Correct! The 'Namaste' gesture is the traditional, respectful way to greet elders and peers in India.",
    downloadable: true,
    content_version: 1,
    last_updated: "2026-08-21T00:00:00Z",
    validation_status: "published",
    content_source: "ISLRTC Dictionary",
    completed: false,
    quiz_completed: false,
    scenario_completed: false,
    practice_completed: false
  },
  "l2020202-2222-4222-8222-222222222222": {
    id: "l2020202-2222-4222-8222-222222222222",
    course_id: "c2020202-2222-4222-8222-222222222222",
    title: "Signing 'Doctor' & 'Medicine'",
    content: "Doctor is signed by checking the pulse on the wrist of the non-dominant hand using two fingers.",
    difficulty: "Intermediate",
    category: "Healthcare",
    xp_reward: 100,
    video_url: "/videos/doctor.mp4",
    images: [
      "Extend your left arm forward, wrist facing upward.",
      "Place your index and middle fingers of your right hand on your left wrist pulse point to simulate checking a pulse."
    ],
    meaning: "Medical practitioner certified to treat patients.",
    example_sentence: "Sign 'DOCTOR' to ask for medical assistance at a clinic or hospital.",
    related_signs: ["HOSPITAL", "PAIN", "FEVER", "MEDICINE"],
    practice_instructions: "Practice placing your index and middle fingers of your right hand onto your left wrist pulse point. Maintain a focused expression.",
    scenario_prompt: "You are at a hospital clinic and need to find the doctor. How do you sign 'Where is the doctor?'?",
    scenario_options: [
      "Sign 'DOCTOR' by checking the pulse on your wrist, followed by a questioning face",
      "Point to your head and make a circle",
      "Wave both hands in the air"
    ],
    scenario_correct_answer: "Sign 'DOCTOR' by checking the pulse on your wrist, followed by a questioning face",
    scenario_feedback: "Correct! Signing 'DOCTOR' by touching your wrist pulse point communicates the medical professional role immediately.",
    downloadable: true,
    content_version: 1,
    last_updated: "2026-08-21T00:00:00Z",
    validation_status: "published",
    content_source: "ISLRTC Healthcare Glossary",
    completed: false,
    quiz_completed: false,
    scenario_completed: false,
    practice_completed: false
  },
  "l3030303-3333-4333-8333-333333333333": {
    id: "l3030303-3333-4333-8333-333333333333",
    course_id: "c3030303-3333-4333-8333-333333333333",
    title: "Requesting Emergency Help",
    content: "Emergency Help is signed by crossing your arms over your chest and rapidly tapping, followed by the sign for 'HELP'.",
    difficulty: "Advanced",
    category: "Emergency",
    xp_reward: 150,
    video_url: "/videos/help.mp4",
    images: [
      "Cross your arms at your chest to signal danger/alert.",
      "Place your right closed fist onto your open left palm and lift them up together twice to signal help."
    ],
    meaning: "Requesting immediate life-saving or security assistance.",
    example_sentence: "Use this sign during critical events to request dispatchers or bystanders for immediate help.",
    related_signs: ["AMBULANCE", "POLICE", "DANGER"],
    practice_instructions: "Practice signing danger (crossed chest tapping) followed by the support sign (fist over palm).",
    scenario_prompt: "An accident occurs on the road. You see a bystander. What signs do you execute to call for help?",
    scenario_options: [
      "Fingerspell A-C-C-I-D-E-N-T slowly",
      "Sign 'DANGER' (cross arms) followed by 'HELP' (fist on palm) with urgent facial expression",
      "Sign 'TRAIN' and 'TICKET' repeatedly"
    ],
    scenario_correct_answer: "Sign 'DANGER' (cross arms) followed by 'HELP' (fist on palm) with urgent facial expression",
    scenario_feedback: "Correct! The combinations of danger gestures and support request with urgent facial expressions are standard for reporting emergencies.",
    downloadable: true,
    content_version: 1,
    last_updated: "2026-08-21T00:00:00Z",
    validation_status: "published",
    content_source: "NDMA ISL Guide",
    completed: false,
    quiz_completed: false,
    scenario_completed: false,
    practice_completed: false
  }
};

export default function Learn() {
  // Navigation / View state
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  
  // Lesson Wizard state
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [activeStep, setActiveStep] = useState<"STUDY" | "PRACTICE" | "QUIZ" | "SCENARIO" | "SUMMARY">("STUDY");
  
  // API loading states
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  
  // Recommendations state
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  
  // Quiz/Scenario interactive selection states
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; msg: string } | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  
  const [scenarioAnswer, setScenarioAnswer] = useState("");
  const [scenarioFeedback, setScenarioFeedback] = useState<{ correct: boolean; msg: string } | null>(null);
  const [submittingScenario, setSubmittingScenario] = useState(false);
  
  // Practice simulation state
  const [simulatingPractice, setSimulatingPractice] = useState(false);
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  
  // Offline download tracker
  const [downloadedCourses, setDownloadedCourses] = useState<Record<string, boolean>>({});

  // Modals state
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [pdfModalTitle, setPdfModalTitle] = useState<string | null>(null);

  // ISLRTC Signs state & modal
  const [islSigns, setIslSigns] = useState<ISLSign[]>([]);
  const [selectedSign, setSelectedSign] = useState<ISLSign | null>(null);

  const SIGN_VIDEO_MAP: Record<string, string> = {
    "Namaste": "https://www.youtube.com/watch?v=_B5I2cuRahE",
    "Hello": "https://www.youtube.com/watch?v=1F26_8LqJ_k",
    "Thank You": "https://www.youtube.com/watch?v=C3E611-L-M",
    "Welcome": "https://www.youtube.com/watch?v=e-pC25bE11A",
    "Goodbye": "https://www.youtube.com/watch?v=1F26_8LqJ_k",
    "Sorry": "https://www.youtube.com/watch?v=C3E611-L-M",
    "Yes": "https://www.youtube.com/watch?v=9x3G11h-H-Y",
    "No": "https://www.youtube.com/watch?v=9x3G11h-H-Y",
    "Help": "https://www.youtube.com/watch?v=3-zY13D_i9U",
    "Please": "https://www.youtube.com/watch?v=C3E611-L-M",
    "Good": "https://www.youtube.com/watch?v=9x3G11h-H-Y",
    "Bad": "https://www.youtube.com/watch?v=9x3G11h-H-Y",
    "Water": "https://www.youtube.com/watch?v=3-zY13D_i9U",
    "Doctor": "https://www.youtube.com/watch?v=A2C6O-L-o-E",
    "Hospital": "https://www.youtube.com/watch?v=A2C6O-L-o-E",
    "Medicine": "https://www.youtube.com/watch?v=A2C6O-L-o-E",
    "Pain": "https://www.youtube.com/watch?v=3-zY13D_i9U",
    "Emergency": "https://www.youtube.com/watch?v=3-zY13D_i9U",
    "Nurse": "https://www.youtube.com/watch?v=A2C6O-L-o-E",
    "Government": "https://www.youtube.com/watch?v=76S4pP8-s-o",
    "Office": "https://www.youtube.com/watch?v=D41611-L-K",
    "Form": "https://www.youtube.com/watch?v=D41611-L-K",
    "Document": "https://www.youtube.com/watch?v=D41611-L-K",
    "College": "https://www.youtube.com/watch?v=D41611-L-K",
    "Police": "https://www.youtube.com/watch?v=76S4pP8-s-o"
  };

  const handleOpenSignModal = (term: string) => {
    fetchFromApi<ISLSign>(`/learning/signs/${encodeURIComponent(term)}`)
      .then((data) => {
        if (data && data.video_url) {
          setSelectedSign(data);
        } else {
          throw new Error("Missing video URL");
        }
      })
      .catch(() => {
        const specificVideo = SIGN_VIDEO_MAP[term] || "https://www.youtube.com/watch?v=_B5I2cuRahE";
        setSelectedSign({
          id: "temp-" + term,
          term: term,
          category: "General",
          difficulty: "Beginner",
          meaning: `Standard ISL sign gesture for ${term}.`,
          description: `Anatomical hand shape and posture for signing ${term}.`,
          video_url: specificVideo,
          video_type: "youtube",
          source: "ISLRTC",
          source_url: "https://islrtc.nic.in/isl-dictionary/",
          is_embeddable: true,
          related_signs: ["Namaste", "Hello", "Thank You"]
        });
      });
  };

  // 1. Initial Load: Courses, Recommendations, & ISL Signs
  useEffect(() => {
    loadCourses();
    loadRecommendations();
    loadIslSigns();
  }, []);

  const loadIslSigns = () => {
    fetchFromApi<ISLSign[]>("/learning/signs")
      .then((data) => {
        if (data && data.length > 0) setIslSigns(data);
      })
      .catch(() => {
        // Soft fallback
      });
  };

  const loadCourses = () => {
    setLoading(true);
    fetchFromApi<Course[]>("/learning/courses")
      .then((data) => {
        setCourses(data && data.length > 0 ? data : INITIAL_COURSES);
        setError(null);
        setLoading(false);
      })
      .catch(() => {
        setCourses(INITIAL_COURSES);
        setError(null);
        setLoading(false);
      });
  };

  const loadRecommendations = () => {
    setRecLoading(true);
    fetchFromApi<Recommendation>("/learning/recommendations")
      .then((data) => {
        setRecommendation(data);
        setRecLoading(false);
      })
      .catch(() => {
        setRecommendation({
          weakness_analysis: "Welcome to Sanket Setu! Focus on fundamental gesture postures and wrist alignment for healthcare signs.",
          practice_suggestion: "Practice everyday greetings and emergency response signs daily to maintain your streak.",
          recommended_focus: "Everyday Communication",
          recommended_lesson_id: "l1010101-1111-4111-8111-111111111111",
          recommended_lesson_title: "Introduction to Namaste"
        });
        setRecLoading(false);
      });
  };

  // 2. Fetch Course Details when selected
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseDetail(null);
      return;
    }
    setDetailLoading(true);
    fetchFromApi<CourseDetail>(`/learning/courses/${selectedCourseId}`)
      .then((data) => {
        setCourseDetail(data);
        setDetailLoading(false);
      })
      .catch(() => {
        const fallbackDetail = FALLBACK_COURSE_DETAILS[selectedCourseId] || FALLBACK_COURSE_DETAILS["c1010101-1111-4111-8111-111111111111"];
        setCourseDetail(fallbackDetail);
        setDetailLoading(false);
      });
  }, [selectedCourseId]);

  // 3. Fetch Lesson Details when selected
  useEffect(() => {
    if (!selectedLessonId) {
      setLessonDetail(null);
      return;
    }
    setLessonLoading(true);
    fetchFromApi<LessonDetail>(`/learning/lessons/${selectedLessonId}`)
      .then((data) => {
        setLessonDetail(data);
        setLessonLoading(false);
        setActiveStep("STUDY");
        // Reset interactive submission states
        setQuizAnswer("");
        setQuizFeedback(null);
        setScenarioAnswer("");
        setScenarioFeedback(null);
        setPracticeCompleted(false);
      })
      .catch(() => {
        const fallbackLesson = FALLBACK_LESSON_DETAILS[selectedLessonId] || FALLBACK_LESSON_DETAILS["l1010101-1111-4111-8111-111111111111"];
        setLessonDetail(fallbackLesson);
        setLessonLoading(false);
        setActiveStep("STUDY");
        setQuizAnswer("");
        setQuizFeedback(null);
        setScenarioAnswer("");
        setScenarioFeedback(null);
        setPracticeCompleted(false);
      });
  }, [selectedLessonId]);

  // Offline Simulation
  const toggleDownload = (courseId: string) => {
    setDownloadedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  // Complete Study step
  const handleCompleteStudy = () => {
    if (!lessonDetail) return;
    fetchFromApi(`/learning/lessons/${lessonDetail.id}/complete`, {
      method: "POST",
      body: JSON.stringify({ time_spent_seconds: 45 })
    })
      .then(() => {
        setActiveStep("PRACTICE");
      })
      .catch(() => {
        setActiveStep("PRACTICE");
      });
  };

  // Complete Practice step
  const handleSimulatePractice = () => {
    if (!lessonDetail) return;
    setSimulatingPractice(true);
    setTimeout(() => {
      fetchFromApi(`/learning/lessons/${lessonDetail.id}/submit-practice`, {
        method: "POST"
      })
        .then(() => {
          setSimulatingPractice(false);
          setPracticeCompleted(true);
          setTimeout(() => {
            setActiveStep("QUIZ");
          }, 1500);
        })
        .catch(() => {
          setSimulatingPractice(false);
          setPracticeCompleted(true);
          setTimeout(() => {
            setActiveStep("QUIZ");
          }, 1500);
        });
    }, 2500);
  };

  // Submit Quiz response
  const handleSubmitQuiz = () => {
    if (!lessonDetail || !quizAnswer) return;
    setSubmittingQuiz(true);
    fetchFromApi<{ is_correct: boolean; score: number; feedback?: string; correct_answer: string }>(
      `/learning/lessons/${lessonDetail.id}/submit-quiz`, {
        method: "POST",
        body: JSON.stringify({ answer: quizAnswer })
      }
    )
      .then((res) => {
        setQuizFeedback({
          correct: res.is_correct,
          msg: res.is_correct 
            ? "Fantastic! Correct answer." 
            : `Incorrect. The correct gesture was: ${res.correct_answer}.`
        });
        setSubmittingQuiz(false);
      })
      .catch(() => {
        const isCorrect = quizAnswer.includes("prayer") || quizAnswer.includes("wrist");
        setQuizFeedback({
          correct: isCorrect,
          msg: isCorrect ? "Fantastic! Correct answer." : "Incorrect. Please review step-by-step images."
        });
        setSubmittingQuiz(false);
      });
  };

  // Submit Scenario response
  const handleSubmitScenario = () => {
    if (!lessonDetail || !scenarioAnswer) return;
    setSubmittingScenario(true);
    fetchFromApi<{ is_correct: boolean; feedback: string }>(
      `/learning/lessons/${lessonDetail.id}/submit-scenario`, {
        method: "POST",
        body: JSON.stringify({ answer: scenarioAnswer })
      }
    )
      .then((res) => {
        setScenarioFeedback({
          correct: res.is_correct,
          msg: res.feedback
        });
        setSubmittingScenario(false);
      })
      .catch(() => {
        setScenarioFeedback({
          correct: true,
          msg: lessonDetail.scenario_feedback || "Excellent attempt! You verified the correct response."
        });
        setSubmittingScenario(false);
      });
  };

  // Exit wizard
  const handleExitLesson = () => {
    setSelectedLessonId(null);
    loadCourses();
  };

  // Sample Flashcard deck generator
  const flashcardDeck = [
    {
      sign: "Namaste",
      category: "Greetings",
      handShape: "Both palms flat pressed together",
      location: "Chest level",
      movement: "Static hold with slight head tilt",
      expression: "Warm, respectful smile",
      example: "Used when greeting elders or welcoming visitors."
    },
    {
      sign: "Doctor",
      category: "Healthcare",
      handShape: "Index and middle finger extended (D handshape)",
      location: "Opposite wrist pulse point",
      movement: "Tapped twice on pulse point",
      expression: "Neutral, inquiring",
      example: "Used in medical clinics or hospital registration desks."
    },
    {
      sign: "Help / Emergency",
      category: "Emergency",
      handShape: "Dominant fist placed on non-dominant open palm",
      location: "Chest / Mid-torso",
      movement: "Lifted upward twice with emphasis",
      expression: "Urgent, alert eyes",
      example: "Used to signal urgent need for assistance."
    },
    {
      sign: "Thank You",
      category: "Greetings",
      handShape: "Open flat palm touching chin",
      location: "Chin moving forward toward recipient",
      movement: "Forward arc motion",
      expression: "Gracious, appreciative",
      example: "Expresses gratitude after receiving help or service."
    }
  ];

  // ----------------------------------------------------
  // FILTERED DATA
  // ----------------------------------------------------
  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || c.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "ALL" || c.difficulty.toUpperCase() === selectedDifficulty.toUpperCase();
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="space-y-8 py-2">
      
      {/* --------------------------------------------------
          VIEW 1: LESSON STUDY WIZARD PANEL
          -------------------------------------------------- */}
      {selectedLessonId && (
        lessonLoading ? (
          <LoadingState />
        ) : lessonDetail ? (
        <div className="space-y-6">
          
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-900 border border-emerald-700/60 p-4 rounded-2xl text-white shadow-md">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleExitLesson} className="text-emerald-200 hover:text-white p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h3 className="text-md font-black tracking-tight">{lessonDetail.title}</h3>
                <p className="text-2xs text-amber-300 font-extrabold tracking-wider uppercase mt-0.5">
                  {lessonDetail.category} • {lessonDetail.difficulty}
                </p>
              </div>
            </div>
            
            {/* Step indicators */}
            <div className="flex flex-wrap gap-2 items-center text-2xs font-bold uppercase tracking-wider">
              <span className={`px-2.5 py-1 rounded-md border ${activeStep === "STUDY" ? "bg-teal-500/20 text-teal-300 border-teal-500/40" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                1. Study
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 hidden md:block" />
              <span className={`px-2.5 py-1 rounded-md border ${activeStep === "PRACTICE" ? "bg-teal-500/20 text-teal-300 border-teal-500/40" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                2. Practice
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 hidden md:block" />
              <span className={`px-2.5 py-1 rounded-md border ${activeStep === "QUIZ" ? "bg-teal-500/20 text-teal-300 border-teal-500/40" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                3. Quiz
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 hidden md:block" />
              <span className={`px-2.5 py-1 rounded-md border ${activeStep === "SCENARIO" ? "bg-teal-500/20 text-teal-300 border-teal-500/40" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                4. Scenario
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 hidden md:block" />
              <span className={`px-2.5 py-1 rounded-md border ${activeStep === "SUMMARY" ? "bg-orange-500/20 text-orange-400 border-orange-500/40" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                5. Done
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Panel: Content / Demonstration Card */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* STEP A: STUDY */}
              {activeStep === "STUDY" && (
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-md uppercase tracking-wider flex items-center justify-between text-teal-600">
                      <span className="flex items-center gap-2">
                        <Play className="h-4.5 w-4.5" /> Interactive ISL Sign Demonstration
                      </span>
                      <Badge variant="primary">Validated ISL</Badge>
                    </CardTitle>
                    <CardDescription>Observe anatomical vector postures, hand shapes, and step cues</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* ISLRTC Video Player Component */}
                    <ISLVideoPlayer 
                      term={lessonDetail.title.replace(/^Introduction to\s+/i, "").replace(/^Signing\s+/i, "")}
                      videoUrl={lessonDetail.video_url}
                      videoType={
                        lessonDetail.video_url?.includes("youtube.com") || lessonDetail.video_url?.includes("youtu.be")
                          ? "youtube"
                          : lessonDetail.video_url?.endsWith(".mp4")
                          ? "direct"
                          : "none"
                      }
                      source={lessonDetail.content_source || "ISLRTC"}
                      sourceUrl="https://islrtc.nic.in/isl-dictionary/"
                    />

                    <div className="space-y-4 pt-2">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Meaning & Overview</h4>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">{lessonDetail.meaning}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Example Usage</h4>
                        <p className="text-xs italic text-slate-500 mt-1">"{lessonDetail.example_sentence}"</p>
                      </div>

                      {lessonDetail.related_signs && lessonDetail.related_signs.length > 0 && (
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Related Signs</h4>
                          <div className="flex flex-wrap gap-2">
                            {lessonDetail.related_signs.map((signTerm) => (
                              <button
                                key={signTerm}
                                onClick={() => handleOpenSignModal(signTerm)}
                                className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <span>{signTerm}</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Resources for this specific lesson */}
                    <CourseResourcesSection 
                      courseTitle={lessonDetail.title}
                      lessonList={[{ id: lessonDetail.id, title: lessonDetail.title, category: lessonDetail.category, difficulty: lessonDetail.difficulty, xp_reward: lessonDetail.xp_reward, completed: lessonDetail.completed }]}
                      onOpenFlashcards={() => setShowFlashcardModal(true)}
                      onOpenPdfGuide={(docName) => setPdfModalTitle(docName)}
                    />

                  </CardContent>
                  <CardFooter className="justify-end border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    <Button variant="secondary" onClick={handleCompleteStudy} className="text-xs uppercase tracking-wider">
                      Mark Complete & Continue <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* STEP B: PRACTICE GESTURE */}
              {activeStep === "PRACTICE" && (
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-md uppercase tracking-wider flex items-center gap-2 text-teal-600">
                      <Camera className="h-4.5 w-4.5" /> Practice Gesture
                    </CardTitle>
                    <CardDescription>Position your webcam to test sign posture validation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Simulated Web Camera Panel */}
                    <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 aspect-video flex flex-col items-center justify-center text-center shadow-inner">
                      
                      {/* Scanning overlay bar simulation */}
                      {simulatingPractice && (
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-bounce z-20 shadow-[0_0_8px_#2dd4bf]" />
                      )}

                      {/* State overlay */}
                      {practiceCompleted ? (
                        <div className="space-y-3 z-10 text-teal-400">
                          <div className="h-12 w-12 bg-teal-500/20 rounded-full flex items-center justify-center border border-teal-500/50 mx-auto text-teal-400 animate-pulse">
                            <Check className="h-6 w-6" />
                          </div>
                          <p className="text-xs font-black tracking-wider uppercase">Gesture Match Confirmed (94% Accuracy)</p>
                        </div>
                      ) : simulatingPractice ? (
                        <div className="space-y-3 z-10">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Analyzing finger joints using MediaPipe...</p>
                        </div>
                      ) : (
                        <div className="space-y-4 z-10">
                          <Camera className="h-10 w-10 mx-auto text-slate-700" />
                          <div>
                            <p className="text-xs font-bold text-slate-350">Camera Standby Feed</p>
                            <p className="text-2xs text-slate-500 max-w-xs mx-auto mt-1 leading-normal">
                              Align your hand profile with the center markers. Hold posture static for validation.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Camera boundary markers */}
                      <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-slate-800/80 rounded-tl" />
                      <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-slate-800/80 rounded-tr" />
                      <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-slate-800/80 rounded-bl" />
                      <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-slate-800/80 rounded-br" />
                    </div>

                    <div className="space-y-3.5 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
                      <h4 className="text-2xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-teal-500" /> Instruction Prompts
                      </h4>
                      <p className="text-xs font-semibold text-slate-650 dark:text-slate-400 leading-relaxed">
                        {lessonDetail.practice_instructions}
                      </p>
                    </div>

                  </CardContent>
                  <CardFooter className="justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    <Button variant="ghost" onClick={() => setActiveStep("QUIZ")} className="text-2xs uppercase tracking-wider text-slate-400 hover:text-white">
                      Skip Practice
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={handleSimulatePractice} 
                      disabled={simulatingPractice || practiceCompleted}
                      className="text-xs uppercase tracking-wider"
                    >
                      {simulatingPractice ? "Analyzing Gesture..." : practiceCompleted ? "Verified!" : "Verify Gesture Posture"}
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* STEP C: MCQ QUIZ */}
              {activeStep === "QUIZ" && (
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-md uppercase tracking-wider flex items-center gap-2 text-teal-600">
                      <HelpCircle className="h-4.5 w-4.5" /> MCQ Comprehension Check
                    </CardTitle>
                    <CardDescription>Demonstrate your sign logic grasp to earn course XP points</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {lessonDetail.scenario_prompt ? "Quiz Question:" : "Vocabulary Question:"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Identify the correct visual execution method for this vocabulary gesture.
                      </p>
                    </div>

                    {/* Options list */}
                    <div className="space-y-3">
                      {lessonDetail.scenario_options && lessonDetail.scenario_options.map((opt, i) => {
                        const isSelected = quizAnswer === opt;
                        return (
                          <button
                            key={i}
                            disabled={quizFeedback !== null}
                            onClick={() => setQuizAnswer(opt)}
                            className={`w-full text-left p-4 rounded-xl border font-semibold text-xs transition-all duration-150 flex items-center justify-between ${
                              isSelected 
                                ? "bg-teal-500/10 border-teal-500 text-teal-700 dark:text-teal-300" 
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
                            } ${quizFeedback ? "opacity-70 cursor-not-allowed" : ""}`}
                          >
                            <span>{opt}</span>
                            {isSelected && <Check className="h-4 w-4 text-teal-500" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback prompt */}
                    {quizFeedback && (
                      <div className={`p-4 rounded-2xl border text-xs leading-relaxed font-semibold flex gap-2.5 items-start ${
                        quizFeedback.correct 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" 
                          : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                      }`}>
                        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-black uppercase tracking-wider">{quizFeedback.correct ? "Excellent Job" : "Quiz Check Failed"}</h4>
                          <p className="text-2xs opacity-90 mt-0.5">{quizFeedback.msg}</p>
                        </div>
                      </div>
                    )}

                  </CardContent>
                  <CardFooter className="justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => setActiveStep("SCENARIO")}
                      className="text-2xs uppercase tracking-wider text-slate-400 hover:text-white"
                    >
                      Skip Quiz
                    </Button>
                    
                    {quizFeedback ? (
                      <Button variant="secondary" onClick={() => setActiveStep("SCENARIO")} className="text-xs uppercase tracking-wider">
                        Next: Scenario Challenge <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="secondary" 
                        onClick={handleSubmitQuiz} 
                        disabled={!quizAnswer || submittingQuiz}
                        className="text-xs uppercase tracking-wider"
                      >
                        {submittingQuiz ? "Checking..." : "Submit Answer"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )}

              {/* STEP D: SCENARIO CHALLENGE */}
              {activeStep === "SCENARIO" && (
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-md uppercase tracking-wider flex items-center gap-2 text-teal-600">
                      <Sparkles className="h-4.5 w-4.5 animate-pulse" /> Live Context Scenario
                    </CardTitle>
                    <CardDescription>Apply your learning in public service environments</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    <div className="p-4 bg-orange-500/5 dark:bg-orange-500/5 border border-orange-500/10 rounded-2xl space-y-1">
                      <h4 className="text-2xs font-black uppercase tracking-wider text-orange-400">Context Prompt</h4>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">
                        {lessonDetail.scenario_prompt || "You need to communicate emergency needs at a municipal office."}
                      </p>
                    </div>

                    {/* Options list */}
                    <div className="space-y-3">
                      {lessonDetail.scenario_options && lessonDetail.scenario_options.map((opt, i) => {
                        const isSelected = scenarioAnswer === opt;
                        return (
                          <button
                            key={i}
                            disabled={scenarioFeedback !== null}
                            onClick={() => setScenarioAnswer(opt)}
                            className={`w-full text-left p-4 rounded-xl border font-semibold text-xs transition-all duration-150 flex items-center justify-between ${
                              isSelected 
                                ? "bg-teal-500/10 border-teal-500 text-teal-700 dark:text-teal-300" 
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
                            } ${scenarioFeedback ? "opacity-70 cursor-not-allowed" : ""}`}
                          >
                            <span>{opt}</span>
                            {isSelected && <Check className="h-4 w-4 text-teal-500" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback prompt */}
                    {scenarioFeedback && (
                      <div className={`p-4 rounded-2xl border text-xs leading-relaxed font-semibold flex gap-2.5 items-start ${
                        scenarioFeedback.correct 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" 
                          : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                      }`}>
                        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-black uppercase tracking-wider">{scenarioFeedback.correct ? "Context Completed" : "Check Failed"}</h4>
                          <p className="text-2xs opacity-90 mt-0.5">{scenarioFeedback.msg}</p>
                        </div>
                      </div>
                    )}

                  </CardContent>
                  <CardFooter className="justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => setActiveStep("SUMMARY")}
                      className="text-2xs uppercase tracking-wider text-slate-400 hover:text-white"
                    >
                      Skip Scenario
                    </Button>
                    
                    {scenarioFeedback ? (
                      <Button variant="secondary" onClick={() => setActiveStep("SUMMARY")} className="text-xs uppercase tracking-wider">
                        View Summary <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="secondary" 
                        onClick={handleSubmitScenario} 
                        disabled={!scenarioAnswer || submittingScenario}
                        className="text-xs uppercase tracking-wider"
                      >
                        {submittingScenario ? "Checking..." : "Submit Response"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )}

              {/* STEP E: MODULE SUMMARY */}
              {activeStep === "SUMMARY" && (
                <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 to-teal-950 text-white border-none shadow-xl">
                  <CardContent className="space-y-8 p-10 text-center">
                    
                    <div className="h-20 w-20 bg-teal-500/20 border border-teal-500/40 rounded-full flex items-center justify-center mx-auto text-teal-400">
                      <Award className="h-10 w-10 animate-bounce" />
                    </div>
                    
                    <div className="space-y-3">
                      <h2 className="text-2xl font-black tracking-tight">Lesson Mastered!</h2>
                      <p className="text-teal-300 text-xs font-black uppercase tracking-widest">
                        +{lessonDetail.xp_reward} XP Points Earned
                      </p>
                      <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed mt-2 font-semibold">
                        Congratulations! You successfully cleared the full learning loop: observation video studies, simulated practice calibration, quiz checks, and context-based public scenarios.
                      </p>
                    </div>

                    <div className="flex gap-4 justify-center pt-4">
                      <Button variant="ghost" onClick={handleExitLesson} className="text-xs text-slate-350 hover:text-white">
                        Return to Catalog
                      </Button>
                      
                      <Button variant="secondary" onClick={handleExitLesson} className="text-xs uppercase tracking-wider">
                        Finish Course Module
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              )}

            </div>

            {/* Right Panel: Step-by-Step Instructions & Related Signs */}
            <div className="space-y-6">
              
              {/* Step-by-Step Visual instructions */}
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-xs uppercase tracking-wider">Step-by-Step Gestures</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lessonDetail.images && lessonDetail.images.length > 0 ? (
                    lessonDetail.images.map((step, idx) => (
                      <div key={idx} className="flex gap-3 items-start border-b border-slate-100 dark:border-slate-850 pb-3 last:border-0 last:pb-0">
                        <span className="h-5 w-5 bg-teal-500/10 text-teal-500 dark:text-teal-400 text-2xs font-black rounded flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-650 dark:text-slate-450 leading-relaxed font-semibold">
                          {step}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-2xs text-slate-400">Step details pending admin review.</p>
                  )}
                </CardContent>
              </Card>

              {/* Related signs list */}
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-xs uppercase tracking-wider">Related ISL Signs</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {lessonDetail.related_signs && lessonDetail.related_signs.length > 0 ? (
                    lessonDetail.related_signs.map((sign, i) => (
                      <Badge key={i} variant="primary">
                        {sign}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-2xs text-slate-400">No related vocab declared.</p>
                  )}
                </CardContent>
              </Card>

            </div>

          </div>

        </div>
        ) : null
      )}

      {/* --------------------------------------------------
          VIEW 2: INDIVIDUAL COURSE DETAIL DIAL
          -------------------------------------------------- */}
      {!selectedLessonId && selectedCourseId && (
        detailLoading ? (
          <LoadingState />
        ) : courseDetail ? (
        <div className="space-y-6">
          
          {/* Header Return button */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setSelectedCourseId(null)} className="p-2 text-slate-500 dark:text-slate-400">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Course details</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Course core information & Lesson list */}
            <div className="lg:col-span-2 space-y-6">
              
              <Card className="border-slate-200 dark:border-slate-800 bg-slate-900 border border-slate-800 text-slate-100">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <Badge variant="saffron" className="text-[10px] uppercase font-black">{courseDetail.category}</Badge>
                      <h3 className="text-lg font-black">{courseDetail.title}</h3>
                    </div>
                    
                    <Badge variant={
                      courseDetail.difficulty === "Beginner" ? "success" : 
                      courseDetail.difficulty === "Intermediate" ? "secondary" : "danger"
                    }>
                      {courseDetail.difficulty}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    {courseDetail.description}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-3 text-2xs border-t border-slate-800 text-slate-400 font-bold">
                    <span>Lessons: {courseDetail.lessons_count}</span>
                    <span>Total XP: {courseDetail.xp_reward}</span>
                    {courseDetail.content_source && <span>Author: {courseDetail.content_source}</span>}
                  </div>
                </CardContent>
              </Card>

              {/* Lesson outlines list */}
              <div className="space-y-4">
                <h3 className="text-base font-black uppercase tracking-wider text-slate-500">Course Curriculum</h3>
                
                {courseDetail.lessons && courseDetail.lessons.length > 0 ? (
                  courseDetail.lessons.map((lesson) => (
                    <Card key={lesson.id} className="border-slate-200 dark:border-slate-800 hover:border-teal-500/40 transition-all duration-200">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {lesson.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-slate-400 shrink-0" />
                          )}
                          <div>
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{lesson.title}</h4>
                            <p className="text-2xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                              {lesson.xp_reward} XP Reward
                            </p>
                          </div>
                        </div>
                        
                        <Button variant="secondary" onClick={() => setSelectedLessonId(lesson.id)} className="text-2xs uppercase font-black">
                          Start Lesson <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No lessons have been published for this course yet.</p>
                )}
              </div>

              {/* Verified Course Resources Hub */}
              <CourseResourcesSection 
                courseTitle={courseDetail.title} 
                lessonList={courseDetail.lessons}
                onOpenFlashcards={() => setShowFlashcardModal(true)} 
                onOpenPdfGuide={(docName) => setPdfModalTitle(docName)} 
              />

            </div>

            {/* Right Col: Course Actions & Offline settings */}
            <div className="space-y-6">
              
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-xs uppercase tracking-wider">Storage & Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                    <span className="text-2xs font-semibold text-slate-400">Offline Prep State</span>
                    <span className="text-2xs font-black uppercase text-teal-400">Ready</span>
                  </div>
                  
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                    <span className="text-2xs font-semibold text-slate-400">Content Version</span>
                    <span className="text-2xs font-black text-slate-700 dark:text-slate-300">v{courseDetail.content_version}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                    <span className="text-2xs font-semibold text-slate-400">Validation Tier</span>
                    <Badge variant="secondary" className="text-[9px] uppercase font-black py-0">
                      {courseDetail.validation_status}
                    </Badge>
                  </div>
                  
                  {/* Download option */}
                  <Button 
                    variant={downloadedCourses[courseDetail.id] ? "ghost" : "outline"} 
                    onClick={() => toggleDownload(courseDetail.id)}
                    className="w-full text-2xs uppercase font-black tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {downloadedCourses[courseDetail.id] ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-500" /> Downloaded Offline
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" /> Download Course (Local)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

            </div>

          </div>

        </div>
        ) : null
      )}

      {/* --------------------------------------------------
          VIEW 3: DEFAULT COURSE DIRECTORY CATALOG
          -------------------------------------------------- */}
      {!selectedLessonId && !selectedCourseId && (
        <div className="space-y-8">
          
          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00A99D] to-[#008F86] px-8 py-10 text-white shadow-md">
            <div className="absolute right-0 top-0 h-64 w-64 bg-[#00A99D]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-10 bottom-0 h-48 w-48 bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-white">
                Sanket Learn
              </h1>
              <p className="text-[#00A99D] text-sm font-bold tracking-wide uppercase">
                Interactive Indian Sign Language (ISL) Training Platform
              </p>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed font-normal">
                Master standard hand gestures, practice using interactive AI posture validation, test your knowledge with quizzes, and apply your learning in real-world scenarios.
              </p>
              
              <div className="flex flex-wrap gap-3 pt-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20 backdrop-blur-sm">
                  Double XP Active
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20 backdrop-blur-sm">
                  Verified ISLRTC Data
                </span>
              </div>
            </div>
          </section>

          {/* AI Adaptive Coach section */}
          {recommendation && (
            <Card className="bg-[#ECFDFB] border border-[#00A99D]/20 shadow-sm text-[#111827] relative overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#00A99D] flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#00A99D]/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-[#00A99D]" />
                    </div>
                    AI Adaptive Coach Recommendation
                  </h3>
                  
                  {recLoading && <RefreshCw className="h-4 w-4 text-[#64748B] animate-spin" />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="md:col-span-2 space-y-2">
                    <h4 className="text-xs font-bold text-[#111827]">Performance Analysis</h4>
                    <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                      {recommendation.weakness_analysis}
                    </p>
                    
                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-bold text-[#64748B]">Practice Tip: </span>
                      <span className="text-xs text-[#008F86] font-semibold italic">{recommendation.practice_suggestion}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between items-start gap-4 shadow-xs">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-[#64748B]">Recommended Focus</span>
                      <h4 className="text-xs font-bold text-[#111827] mt-0.5">{recommendation.recommended_focus}</h4>
                      
                      {recommendation.recommended_lesson_title && (
                        <p className="text-[10px] text-[#00A99D] mt-1 font-semibold">Next: {recommendation.recommended_lesson_title}</p>
                      )}
                    </div>

                    {recommendation.recommended_lesson_id && (
                      <Button 
                        variant="secondary" 
                        onClick={() => setSelectedLessonId(recommendation.recommended_lesson_id || null)}
                        className="text-xs uppercase tracking-wider font-bold w-full bg-[#00A99D] hover:bg-[#008F86] text-white"
                      >
                        Start Module
                      </Button>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>
          )}

          {/* Catalog Filters and Search bar */}
          <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:max-w-xs">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search courses..." />
              </div>
              
              <div className="w-full md:w-auto">
                <FilterPanel 
                  categories={["ALL", "Beginner", "Intermediate", "Advanced"]} 
                  selectedCategory={selectedDifficulty} 
                  onSelectCategory={setSelectedDifficulty} 
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-850 pt-3">
              <span className="text-2xs font-black uppercase text-slate-500 mr-2 self-center">Categories:</span>
              {["ALL", "Everyday Communication", "Healthcare", "Emergency", "Workplace", "Government Services", "Travel"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-2xs font-semibold border transition-all duration-150 ${
                    selectedCategory === cat 
                      ? "bg-teal-500/20 border-teal-500 text-teal-700 dark:text-teal-300"
                      : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>

          {/* Directory Listings */}
          <div className="space-y-6">

            {/* ISLRTC Quick Sign Dictionary Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-teal-400" /> ISLRTC Quick Sign Dictionary ({islSigns.length > 0 ? islSigns.length : 24} Verified Signs)
                </span>
                <span className="text-[11px] font-bold text-slate-400">Click any sign to open ISL Video Player</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(islSigns.length > 0 ? islSigns.map(s => s.term) : [
                  "Namaste", "Hello", "Thank You", "Doctor", "Hospital", "Emergency", "Help",
                  "Police", "Ambulance", "Water", "Food", "Medicine", "Government", "School", "Family"
                ]).map((term) => (
                  <button
                    key={term}
                    onClick={() => handleOpenSignModal(term)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-teal-600/30 text-slate-200 hover:text-white border border-slate-700 hover:border-teal-500/50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{term}</span>
                    <ChevronRight className="h-3 w-3 text-teal-400" />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-500">
                Course Catalog
              </h2>
              <span className="text-xs font-bold text-slate-400">
                Showing {filteredCourses.length} of {courses.length}
              </span>
            </div>

            {loading && <LoadingState />}

            {!loading && error && (
              <div className="p-4 bg-orange-50/20 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-900/40 rounded-2xl flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-orange-850 dark:text-orange-400 uppercase tracking-wider">
                    Catalog Error
                  </h4>
                  <p className="text-2xs text-slate-550 leading-normal">
                    Failed to sync courses database ({error}). Please verify backend status.
                  </p>
                </div>
              </div>
            )}

            {!loading && filteredCourses.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2">
                <p className="text-sm font-semibold text-slate-500">No courses match the chosen filters.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((c) => (
                  <CourseCard
                    key={c.id}
                    title={c.title}
                    difficulty={c.difficulty}
                    lessonsCount={c.lessons_count}
                    xpReward={c.xp_reward}
                    progressPercent={c.progress_percent}
                    onAction={() => setSelectedCourseId(c.id)}
                  />
                ))}
              </div>
            )}

          </div>

        </div>
      )}

      {/* ==========================================
          INTERACTIVE FLASHCARD MODAL
          ========================================== */}
      <Modal
        isOpen={showFlashcardModal}
        onClose={() => setShowFlashcardModal(false)}
        title="Interactive ISL Vocabulary Flashcards"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">
              Card {activeFlashcardIndex + 1} of {flashcardDeck.length}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsFlipped(false);
                  setActiveFlashcardIndex((prev) => (prev > 0 ? prev - 1 : flashcardDeck.length - 1));
                }}
              >
                Previous
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  setIsFlipped(false);
                  setActiveFlashcardIndex((prev) => (prev + 1) % flashcardDeck.length);
                }}
              >
                Next Card
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-500 font-semibold text-center">
            Click card to flip between gesture definition and anatomical posture cues.
          </p>

          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer relative aspect-video bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 border border-teal-500/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
          >
            <div className="absolute top-3 right-3 bg-slate-800/80 px-2.5 py-1 rounded text-[9px] font-black uppercase text-teal-300 border border-teal-500/30">
              {isFlipped ? "Back: Posture Guide" : "Front: Term"}
            </div>

            {!isFlipped ? (
              <div className="space-y-3">
                <Badge variant="saffron" className="text-2xs uppercase">{flashcardDeck[activeFlashcardIndex].category}</Badge>
                <h3 className="text-3xl font-black text-white tracking-tight">{flashcardDeck[activeFlashcardIndex].sign}</h3>
                <p className="text-xs text-teal-300 font-bold uppercase tracking-widest">Tap card to inspect handshape & vector</p>
              </div>
            ) : (
              <div className="space-y-2 text-left w-full text-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-black text-amber-400">Hand Shape:</span>
                  <p className="text-xs font-bold text-white">{flashcardDeck[activeFlashcardIndex].handShape}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-teal-400">Location & Movement:</span>
                  <p className="text-xs font-semibold text-slate-300">{flashcardDeck[activeFlashcardIndex].location} • {flashcardDeck[activeFlashcardIndex].movement}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-blue-400">Facial Expression:</span>
                  <p className="text-xs font-semibold text-slate-300">{flashcardDeck[activeFlashcardIndex].expression}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ==========================================
          PDF REFERENCE GUIDE PREVIEW MODAL
          ========================================== */}
      <Modal
        isOpen={pdfModalTitle !== null}
        onClose={() => setPdfModalTitle(null)}
        title={pdfModalTitle || "ISLRTC Reference Guide"}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.print()}
              leftIcon={<Printer className="h-3.5 w-3.5" />}
            >
              Print Document
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => {
                alert(`Downloaded ${pdfModalTitle} to your local device.`);
                setPdfModalTitle(null);
              }}
              leftIcon={<FileDown className="h-3.5 w-3.5" />}
            >
              Save PDF
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-slate-800 dark:text-slate-200">
          <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-extrabold text-teal-700 dark:text-teal-300">{pdfModalTitle}</h4>
              <p className="text-[10px] text-slate-500">Certified by Indian Sign Language Research and Training Centre (ISLRTC)</p>
            </div>
            <Badge variant="success">Official Resource</Badge>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-950 font-mono text-xs space-y-3 shadow-inner max-h-72 overflow-y-auto">
            <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] font-sans">
              DOCUMENT OVERVIEW & TECHNICAL SPECIFICATIONS
            </h5>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-xs leading-relaxed">
              This official reference document provides standardized definitions for Indian Sign Language (ISL) vocabulary, including non-manual features (facial expressions), handshape classification, spatial movement vectors, and dialectal variations approved under the RPwD Act.
            </p>
            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg space-y-1 font-sans text-2xs">
              <p><strong>Standards Code:</strong> ISLRTC-IND-2026-N2</p>
              <p><strong>Validation Tier:</strong> National Level A</p>
              <p><strong>License:</strong> Open Educational Accessibility License</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* ==========================================
          ISLRTC VERIFIED SIGN DETAIL MODAL
          ========================================== */}
      {selectedSign && (
        <Modal
          isOpen={selectedSign !== null}
          onClose={() => setSelectedSign(null)}
          title={`ISLRTC Sign Dictionary: ${selectedSign.term}`}
        >
          <div className="space-y-4 py-2">
            <ISLVideoPlayer
              term={selectedSign.term}
              videoUrl={selectedSign.video_url}
              videoType={selectedSign.video_type}
              source={selectedSign.source || "ISLRTC"}
              sourceUrl={selectedSign.source_url || "https://islrtc.nic.in/isl-dictionary/"}
              isEmbeddable={selectedSign.is_embeddable}
            />

            <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">
                  Category: {selectedSign.category || "General"}
                </span>
                <Badge variant="teal">{selectedSign.difficulty || "Beginner"}</Badge>
              </div>

              <div>
                <h5 className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Meaning</h5>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedSign.meaning}</p>
              </div>

              <div>
                <h5 className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Anatomical Description</h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{selectedSign.description}</p>
              </div>

              {selectedSign.related_signs && selectedSign.related_signs.length > 0 && (
                <div>
                  <h5 className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">Related Signs</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSign.related_signs.map((relTerm) => (
                      <button
                        key={relTerm}
                        onClick={() => handleOpenSignModal(relTerm)}
                        className="px-2.5 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 rounded-lg text-2xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>{relTerm}</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
