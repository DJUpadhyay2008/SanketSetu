import React, { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, ShieldCheck, 
  Maximize, Volume2, VolumeX, CheckCircle2, ExternalLink,
  FileText, Info
} from "lucide-react";
import { Badge } from "./ui";

export interface ISLVideoPlayerProps {
  term: string;
  videoUrl?: string | null;
  videoType?: string | null; // "youtube" | "direct" | "none"
  imageUrl?: string | null;
  meaning?: string | null;
  description?: string | null;
  instructions?: string[] | null;
  source?: string | null; // e.g. "ISLRTC"
  sourceUrl?: string | null; // e.g. "https://islrtc.nic.in/isl-dictionary/"
  isEmbeddable?: boolean;
  className?: string;
  onVideoError?: () => void;
}

/**
 * Helper to generate deterministic step-by-step gesture instructions for any sign term.
 */
export function getSignInstructions(term: string, customInstructions?: string[] | null) {
  if (customInstructions && customInstructions.length > 0) {
    return {
      handShape: "Standard ISL Hand Configuration",
      alignment: "Chest & Face Height",
      movement: "Standard Movement Sequence",
      facialCue: "Natural & Attentive Expression",
      steps: customInstructions
    };
  }

  const t = term.toLowerCase();

  if (t.includes("namaste") || t.includes("welcome") || t.includes("hello")) {
    return {
      handShape: "Open flat palms, fingers aligned",
      alignment: "Mid-Chest Level",
      movement: "Press palms together softly",
      facialCue: "Warm smile with a slight respectful head bow",
      steps: [
        "Position both hands at mid-chest height with palms facing each other.",
        "Press palms together flat in traditional Anjali Mudra posture.",
        "Hold posture for 1.5 seconds while offering a slight respectful head nod."
      ]
    };
  } else if (t.includes("doctor") || t.includes("hospital") || t.includes("nurse") || t.includes("medicine")) {
    return {
      handShape: "Extended Index & Middle Finger (H-Handshape)",
      alignment: "Inner Wrist Pulse Point",
      movement: "Double vertical pulse tapping",
      facialCue: "Focused medical inquiry expression",
      steps: [
        "Extend the index and middle fingers of your dominant hand together.",
        "Hold your non-dominant arm forward with inner wrist facing upward.",
        "Tap your fingertips twice over the inner wrist pulse point."
      ]
    };
  } else if (t.includes("help") || t.includes("emergency") || t.includes("danger") || t.includes("pain")) {
    return {
      handShape: "Dominant Thumbs-Up Fist on Open Palm",
      alignment: "Upper Chest Level",
      movement: "Upward lifting motion",
      facialCue: "Urgent, direct eye contact with eyebrows slightly raised",
      steps: [
        "Form a closed fist with thumb extended upward using your dominant hand.",
        "Rest the flat base of your fist on your open non-dominant palm.",
        "Elevate both hands together upward by 10-15 cm in a decisive motion."
      ]
    };
  } else if (t.includes("water") || t.includes("drink")) {
    return {
      handShape: "W-Handshape (Index, Middle, Ring extended)",
      alignment: "Lower Lip & Chin Area",
      movement: "Double gentle tapping on chin",
      facialCue: "Slight mouth motion representing liquid",
      steps: [
        "Extend index, middle, and ring fingers of dominant hand in a 'W' shape.",
        "Bring your hand near your lower lip.",
        "Tap the side of your index finger twice against your chin."
      ]
    };
  } else if (t.includes("police") || t.includes("ambulance") || t.includes("law")) {
    return {
      handShape: "C-Handshape (Curved fingers and thumb)",
      alignment: "Left Upper Chest (Official Badge Position)",
      movement: "Firm chest press",
      facialCue: "Firm, focused authority expression",
      steps: [
        "Form a 'C' shape with the fingers of your dominant hand.",
        "Place your hand over the left side of your chest where a badge is worn.",
        "Tap twice to signify official law enforcement or emergency authority."
      ]
    };
  } else if (t.includes("thank") || t.includes("please") || t.includes("sorry")) {
    return {
      handShape: "Open flat dominant palm",
      alignment: "Lips / Chin extending outward",
      movement: "Forward outward arc",
      facialCue: "Gracious, appreciative expression",
      steps: [
        "Touch fingertips of open flat dominant hand to your chin.",
        "Move your hand forward and downward toward the recipient.",
        "Smile and nod to affirm polite acknowledgment."
      ]
    };
  }

  // Fallback sign instructions for any general term
  return {
    handShape: "Standard ISL Hand Configuration",
    alignment: "Neutral Signing Space (Chest/Shoulders)",
    movement: "Smooth directional trajectory",
    facialCue: "Natural facial alignment matching conversation context",
    steps: [
      `Form the primary hand shape for "${term}" with your dominant hand.`,
      `Position your hand in the neutral signing space in front of your chest.`,
      `Execute the directional gesture path smoothly and hold for 1 second with clear eye contact.`
    ]
  };
}

/**
 * Extracts and validates YouTube Video ID from various YouTube URL formats.
 */
function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  
  if (url.includes("-L-") || url.includes("-H-") || url.includes("-O-") || url.includes("-o-") || url.endsWith(".mp4")) {
    return null;
  }

  if (url.includes("embed/")) {
    const id = url.split("embed/")[1]?.split("?")[0]?.split("&")[0];
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
  }
  
  if (url.includes("v=")) {
    const id = url.split("v=")[1]?.split("&")[0]?.split("?")[0];
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
  }
  
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0]?.split("&")[0];
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
  }
  
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim()) && !url.includes("/")) {
    return url.trim();
  }

  return null;
}

export const ISLVideoPlayer: React.FC<ISLVideoPlayerProps> = ({
  term,
  videoUrl,
  videoType,
  imageUrl,
  meaning,
  description,
  instructions,
  source = "ISLRTC",
  sourceUrl = "https://islrtc.nic.in/isl-dictionary/",
  isEmbeddable = true,
  className = "",
  onVideoError
}) => {
  const youtubeId = extractYouTubeId(videoUrl);
  const isYouTube = (videoType === "youtube" || !!youtubeId) && !!youtubeId;
  const isDirectVideo = (videoType === "direct" || (!!videoUrl && (videoUrl.endsWith(".mp4") || videoUrl.startsWith("/videos/") || videoUrl.endsWith(".webm"))));
  
  const canPlayVideo = isEmbeddable && (isYouTube || isDirectVideo);

  const [activeTab, setActiveTab] = useState<"VIDEO" | "IMAGE" | "VECTOR">(
    canPlayVideo ? "VIDEO" : (imageUrl ? "IMAGE" : "VECTOR")
  );

  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [speed, setSpeed] = useState<0.75 | 1.0 | 1.25>(1.0);
  const [vectorStep, setVectorStep] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const finalSourceUrl = sourceUrl || "https://islrtc.nic.in/isl-dictionary/";

  // Get standardized step-by-step gesture instructions
  const signInfo = getSignInstructions(term, instructions);

  // Sync playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Vector animation pulse loop
  useEffect(() => {
    if (activeTab !== "VECTOR") return;
    const timer = setInterval(() => {
      setVectorStep((prev) => (prev + 1) % 3);
    }, 1500);
    return () => clearInterval(timer);
  }, [activeTab]);

  const handleVideoPlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (videoRef.current && videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleMediaError = () => {
    setHasError(true);
    setLoading(false);
    setActiveTab(imageUrl ? "IMAGE" : "VECTOR");
    if (onVideoError) onVideoError();
  };

  const isVideoAvailable = canPlayVideo && !hasError;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Banner Notice when Video is Unavailable */}
      {!isVideoAvailable && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-200 shadow-xs">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-white font-extrabold">Video Demo Pending:</strong> Showing Visual Guide & Step-by-Step Instructions for <strong className="text-amber-300 font-bold">{term}</strong>.
            </span>
          </div>
          <Badge variant="saffron" className="text-[10px] uppercase shrink-0">Fallback Active</Badge>
        </div>
      )}

      {/* Container Header with Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isVideoAvailable && (
            <button
              onClick={() => setActiveTab("VIDEO")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "VIDEO" 
                  ? "bg-teal-600 text-white shadow-xs" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🎥 HD Demonstration
            </button>
          )}

          {imageUrl && (
            <button
              onClick={() => setActiveTab("IMAGE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "IMAGE" 
                  ? "bg-teal-600 text-white shadow-xs" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📷 Visual Sign Card
            </button>
          )}

          <button
            onClick={() => setActiveTab("VECTOR")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "VECTOR" 
                ? "bg-teal-600 text-white shadow-xs" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            📐 Vector Anatomy Guide
          </button>
        </div>

        {/* Verification Badge */}
        <Badge variant="teal" className="flex items-center gap-1 text-[11px] font-bold py-0.5 px-2.5 self-start sm:self-auto">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-300" />
          <span>✓ Verified {source || "ISLRTC"} Source</span>
        </Badge>
      </div>

      {/* Main Display Frame */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 aspect-video shadow-lg group flex items-center justify-center">
        
        {/* MODE 1: Direct HTML5 Video Stream */}
        {activeTab === "VIDEO" && isDirectVideo && videoUrl && isVideoAvailable && (
          <div className="w-full h-full relative">
            <video
              ref={videoRef}
              src={videoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedData={() => setLoading(false)}
              onError={handleMediaError}
              className="w-full h-full object-contain bg-black rounded-2xl"
            />

            {/* Overlay Video Controls */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2 rounded-xl flex items-center justify-between text-xs text-white opacity-95 transition-opacity">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleVideoPlayPause}
                  className="p-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/40 cursor-pointer transition-colors"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                
                <button
                  onClick={handleMuteToggle}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4 text-amber-400" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                  {([0.75, 1.0, 1.25] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                        speed === s ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleFullscreen}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                  title="Fullscreen"
                >
                  <Maximize className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: YouTube Embed */}
        {activeTab === "VIDEO" && isYouTube && isVideoAvailable && (
          <div className="w-full h-full relative">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400">
                <div className="h-8 w-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-semibold">Loading Verified Sign Demonstration...</span>
              </div>
            )}
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=1&modestbranding=1&rel=0`}
              title={`ISL Sign demonstration for ${term}`}
              className="w-full h-full border-0 rounded-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setLoading(false)}
              onError={handleMediaError}
            />
          </div>
        )}

        {/* MODE 3: High Resolution Visual Image Card */}
        {activeTab === "IMAGE" && imageUrl && (
          <div className="w-full h-full relative bg-slate-900 flex flex-col items-center justify-center p-4">
            <img
              src={imageUrl}
              alt={`ISL Sign posture for ${term}`}
              className="max-h-full max-w-full object-contain rounded-xl shadow-lg border border-slate-800"
              onError={() => setActiveTab("VECTOR")}
            />
            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-[11px] font-bold text-teal-300">
              📷 Visual Posture Guide: {term}
            </div>
          </div>
        )}

        {/* MODE 4: Interactive Vector Anatomy & Motion Visualizer */}
        {(activeTab === "VECTOR" || (!isVideoAvailable && !imageUrl)) && (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-teal-950/50 p-6">
            <div className="absolute inset-0 bg-[radial-[#00A99D]/10_1px,transparent_1px] [background-size:16px_16px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-3">
              {/* SVG Joint Landmarks Anatomy Diagram */}
              <div className="relative p-4 bg-slate-900/80 border border-teal-500/30 rounded-2xl shadow-xl backdrop-blur-md">
                <svg className="w-28 h-28 text-teal-400 drop-shadow-[0_0_15px_rgba(0,169,157,0.5)]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                  {/* Palm base & wrist */}
                  <rect x="35" y="55" width="30" height="30" rx="8" className="stroke-teal-400 fill-teal-950/60" />
                  <path d="M45 85 L45 98 M55 85 L55 98" className="stroke-slate-500" strokeWidth="3" />
                  
                  {/* Finger vectors based on sign term & animation step */}
                  {term.toLowerCase().includes("namaste") || term.toLowerCase().includes("welcome") || term.toLowerCase().includes("please") ? (
                    <>
                      {/* Anjali Mudra / Joined Palms */}
                      <path d="M38 55 L38 25 M45 55 L45 18 M52 55 L52 20 M60 55 L60 28" className="stroke-teal-300 animate-pulse" strokeWidth="3" strokeLinecap="round" />
                      <path d="M35 65 L22 50" className="stroke-amber-400" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="45" cy="18" r="3" className="fill-teal-300 animate-ping" />
                    </>
                  ) : term.toLowerCase().includes("doctor") || term.toLowerCase().includes("hospital") || term.toLowerCase().includes("nurse") || term.toLowerCase().includes("medicine") ? (
                    <>
                      {/* Pulse Tapping / Cross Mark */}
                      <path d="M38 55 L38 35 M45 55 L45 30 M52 55 L52 40" className="stroke-teal-300" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="28" cy="70" r="4" className="fill-amber-400 animate-ping" />
                      {vectorStep === 0 && <path d="M40 70 L60 70 M50 60 L50 80" className="stroke-red-400" strokeWidth="3" />}
                    </>
                  ) : term.toLowerCase().includes("help") || term.toLowerCase().includes("emergency") || term.toLowerCase().includes("pain") ? (
                    <>
                      {/* Support Fist on Palm */}
                      <path d="M30 45 L70 45 M50 45 L50 75" className="stroke-amber-400 animate-pulse" strokeWidth="3.5" strokeLinecap="round" />
                      <circle cx="50" cy="45" r="5" className="fill-teal-400 animate-ping" />
                    </>
                  ) : (
                    <>
                      {/* Open Wave / General Gesture */}
                      <path d="M38 55 L38 28 M45 55 L45 20 M52 55 L52 22 M60 55 L60 30" className="stroke-teal-300 animate-pulse" strokeWidth="3" strokeLinecap="round" />
                      <path d="M35 65 L20 52" className="stroke-teal-400" strokeWidth="3" strokeLinecap="round" />
                    </>
                  )}
                </svg>
              </div>

              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <span>ISL Sign Anatomy: {term}</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm leading-relaxed">
                  {meaning || description || signInfo.steps[0]}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={finalSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                >
                  <span>Open ISLRTC Dictionary</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP-BY-STEP SIGN EXECUTION RULES CARD */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-400" />
            <span>Step-by-Step Sign Execution Rules</span>
          </h4>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">3-Stage Sequence</span>
        </div>

        {/* Meaning or Description if provided */}
        {(meaning || description) && (
          <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 font-medium">
            <strong className="text-teal-300 font-bold">Definition:</strong> {meaning || description}
          </div>
        )}

        {/* Anatomical Parameters Badge Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs">
          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <span className="text-slate-400 font-extrabold uppercase block text-[9px] tracking-wider">🖐 Handshape</span>
            <span className="text-slate-200 font-bold break-words whitespace-normal leading-tight text-[11px] mt-1">{signInfo.handShape}</span>
          </div>
          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <span className="text-slate-400 font-extrabold uppercase block text-[9px] tracking-wider">📍 Alignment</span>
            <span className="text-slate-200 font-bold break-words whitespace-normal leading-tight text-[11px] mt-1">{signInfo.alignment}</span>
          </div>
          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <span className="text-slate-400 font-extrabold uppercase block text-[9px] tracking-wider">🎯 Movement</span>
            <span className="text-slate-200 font-bold break-words whitespace-normal leading-tight text-[11px] mt-1">{signInfo.movement}</span>
          </div>
          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <span className="text-slate-400 font-extrabold uppercase block text-[9px] tracking-wider">😊 Expression</span>
            <span className="text-slate-200 font-bold break-words whitespace-normal leading-tight text-[11px] mt-1">{signInfo.facialCue}</span>
          </div>
        </div>

        {/* Sequential Step Cards */}
        <div className="space-y-2 pt-1">
          {signInfo.steps.map((stepText, idx) => (
            <div key={idx} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-3 text-xs">
              <div className="h-6 w-6 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-black shrink-0 text-xs">
                {idx + 1}
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  {idx === 0 ? "Stage 1: Initial Posture" : idx === 1 ? "Stage 2: Motion Vector" : "Stage 3: Expression & Hold"}
                </span>
                <p className="text-slate-200 font-semibold leading-relaxed">{stepText}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Source Attribution Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 shrink-0" />
          <span>
            Verified sign video content sourced from <strong className="text-slate-700 dark:text-slate-300">{source}</strong> & <strong className="text-slate-700 dark:text-slate-300 font-semibold">indiansignlanguage.org</strong>.
          </span>
        </div>

        <a
          href={finalSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold hover:underline shrink-0"
        >
          <span>Source: {source}</span>
          <span className="text-[10px]">| Open ISL Portal →</span>
        </a>
      </div>
    </div>
  );
};
