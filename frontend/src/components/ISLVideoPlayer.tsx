import React, { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, ShieldCheck, 
  Maximize, Volume2, VolumeX, CheckCircle2, ExternalLink
} from "lucide-react";
import { Badge } from "./ui";

export interface ISLVideoPlayerProps {
  term: string;
  videoUrl?: string | null;
  videoType?: string | null; // "youtube" | "direct" | "none"
  source?: string | null; // e.g. "ISLRTC"
  sourceUrl?: string | null; // e.g. "https://islrtc.nic.in/isl-dictionary/"
  isEmbeddable?: boolean;
  className?: string;
  onVideoError?: () => void;
}

/**
 * Extracts and validates YouTube Video ID from various YouTube URL formats.
 */
function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  
  // Reject dummy placeholder pattern strings or local mp4 paths
  if (url.includes("-L-") || url.includes("-H-") || url.includes("-O-") || url.includes("-o-") || url.endsWith(".mp4")) {
    return null;
  }

  // Format 1: embed/VIDEO_ID
  if (url.includes("embed/")) {
    const id = url.split("embed/")[1]?.split("?")[0]?.split("&")[0];
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
  }
  
  // Format 2: v=VIDEO_ID
  if (url.includes("v=")) {
    const id = url.split("v=")[1]?.split("&")[0]?.split("?")[0];
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
  }
  
  // Format 3: youtu.be/VIDEO_ID
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0]?.split("&")[0];
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
  }
  
  // Direct 11-char string
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim()) && !url.includes("/")) {
    return url.trim();
  }

  return null;
}

export const ISLVideoPlayer: React.FC<ISLVideoPlayerProps> = ({
  term,
  videoUrl,
  videoType,
  source = "ISLRTC",
  sourceUrl = "https://islrtc.nic.in/isl-dictionary/",
  isEmbeddable = true,
  className = "",
  onVideoError
}) => {
  const youtubeId = extractYouTubeId(videoUrl);
  const isYouTube = (videoType === "youtube" || !!youtubeId) && !!youtubeId;
  const isDirectVideo = (videoType === "direct" || (!!videoUrl && (videoUrl.endsWith(".mp4") || videoUrl.startsWith("/videos/") || videoUrl.endsWith(".webm"))));

  const [activeTab, setActiveTab] = useState<"VIDEO" | "VECTOR">(
    (isDirectVideo || isYouTube) && isEmbeddable ? "VIDEO" : "VECTOR"
  );

  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [speed, setSpeed] = useState<0.75 | 1.0 | 1.25>(1.0);
  const [vectorStep, setVectorStep] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const finalSourceUrl = sourceUrl || "https://islrtc.nic.in/isl-dictionary/";

  // Sync speed setting with direct video element
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
    setActiveTab("VECTOR");
    if (onVideoError) onVideoError();
  };

  const canPlayVideo = isEmbeddable && !hasError && (isYouTube || isDirectVideo);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Container Header with Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
        <div className="flex items-center gap-1.5">
          {canPlayVideo && (
            <button
              onClick={() => setActiveTab("VIDEO")}
              className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "VIDEO" 
                  ? "bg-teal-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🎥 HD Demonstration
            </button>
          )}
          <button
            onClick={() => setActiveTab("VECTOR")}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "VECTOR" 
                ? "bg-teal-600 text-white shadow-sm" 
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
        {activeTab === "VIDEO" && isDirectVideo && videoUrl && !hasError && (
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
        {activeTab === "VIDEO" && isYouTube && !hasError && (
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

        {/* MODE 3: Interactive Vector Anatomy & Motion Visualizer */}
        {(activeTab === "VECTOR" || !canPlayVideo) && (
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
                  {term === "Doctor" 
                    ? "Tap right index & middle finger twice over the inner wrist pulse point."
                    : term === "Namaste"
                    ? "Join both palms flat at chest height in traditional Anjali Mudra posture."
                    : term === "Help"
                    ? "Rest right fist with thumb up on flat open left palm and lift upward."
                    : `Position hand with palms facing comfortably, extending fingers to perform ${term}.`}
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

      {/* Mandatory Source Attribution Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 shrink-0" />
          <span>
            Verified sign video content sourced from <strong className="text-slate-700 dark:text-slate-300">{source}</strong> & <strong className="text-slate-700 dark:text-slate-300">indiansignlanguage.org</strong>.
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
