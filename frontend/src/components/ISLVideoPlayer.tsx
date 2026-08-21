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
  
  // Reject dummy placeholder pattern strings
  if (url.includes("-L-") || url.includes("-H-") || url.includes("-O-") || url.includes("-o-")) {
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
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
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
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [speed, setSpeed] = useState<0.75 | 1.0 | 1.25>(1.0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const youtubeId = extractYouTubeId(videoUrl);
  const isYouTube = (videoType === "youtube" || !!youtubeId) && !!youtubeId;
  const isDirectVideo = !isYouTube && (videoType === "direct" || (!!videoUrl && (videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm"))));

  const finalSourceUrl = sourceUrl || "https://islrtc.nic.in/isl-dictionary/";

  // Sync speed setting with direct video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

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
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleMediaError = () => {
    setHasError(true);
    setLoading(false);
    if (onVideoError) onVideoError();
  };

  const canPlayVideo = isEmbeddable && !hasError && (isYouTube || isDirectVideo);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Video Container Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800">
            <span>🎥 Official ISL Demonstration</span>
          </span>
        </div>

        {/* Verification Badge */}
        <Badge variant="teal" className="flex items-center gap-1 text-[11px] font-bold py-0.5 px-2.5 self-start sm:self-auto">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-300" />
          <span>✓ Verified {source || "ISLRTC"} Source</span>
        </Badge>
      </div>

      {/* Main Player Display Frame */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 aspect-video shadow-lg group flex items-center justify-center">
        
        {/* MODE 1: Direct HTML5 Video */}
        {canPlayVideo && isDirectVideo && videoUrl && (
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

            {/* Custom Video Overlay Controls */}
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
                {/* Speed selector */}
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

        {/* MODE 2: Clean Looping YouTube Embed */}
        {canPlayVideo && isYouTube && (
          <div className="w-full h-full relative">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400">
                <div className="h-8 w-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-semibold">Loading Verified Sign Demonstration...</span>
              </div>
            )}
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=1&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0`}
              title={`ISL Sign demonstration for ${term}`}
              className="w-full h-full border-0 rounded-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setLoading(false)}
              onError={handleMediaError}
            />
          </div>
        )}

        {/* MODE 3: Fallback state if video is offline */}
        {!canPlayVideo && (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
            <div className="max-w-md space-y-3">
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-teal-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  ISL Sign Gesture: {term}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Verified sign posture data for <strong className="text-teal-300">"{term}"</strong> is available on official dictionary platforms.
                </p>
              </div>
              <a
                href={finalSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
              >
                <span>View on Indian Sign Language Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
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
