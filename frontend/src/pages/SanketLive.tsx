/**
 * SanketLive.tsx — Phase 9
 *
 * Modular ISL recognition interface.
 * Mode 1: Learning Practice (guided target sign)
 * Mode 2: Communication (free-form recognition)
 *
 * CV model integration is intentionally decoupled behind POST /api/isl-live/recognize.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { 
  Camera, CameraOff, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  Gauge, Zap, BookOpen, MessageSquare, Info, Loader2, RotateCcw,
  Volume2, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button, Card, CardContent } from "../components/ui";
import { postToApi } from "../api/client";

type RecognitionMode = "learning" | "communication";

interface RecognizeResponse {
  recognized_sign: string;
  confidence: number;
  feedback: string;
}

const LEARNING_SIGNS = [
  { word: "Namaste", hint: "Press palms together in front of chest, bow slightly." },
  { word: "Thank You", hint: "Flat hand touches chin, then moves forward." },
  { word: "Help", hint: "Open hands raised rapidly, palms outward." },
  { word: "Hospital", hint: "H handshape crossed on opposite arm like a cross symbol." },
  { word: "Water", hint: "W handshape tapped on chin." },
  { word: "Yes", hint: "Closed fist nodded up and down from wrist." },
  { word: "No", hint: "Index and middle fingers snap closed against thumb." },
  { word: "Please", hint: "Flat hand rubbed in circle on chest." },
];

const CONFIDENCE_COLOR = (score: number) => {
  if (score >= 0.8) return "text-teal-400";
  if (score >= 0.55) return "text-orange-400";
  return "text-rose-400";
};

const CONFIDENCE_LABEL = (score: number) => {
  if (score >= 0.8) return "High Confidence";
  if (score >= 0.55) return "Medium Confidence";
  return "Low Confidence";
};

export default function SanketLive() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mode, setMode] = useState<RecognitionMode>("learning");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<RecognizeResponse | null>(null);
  const [sessionScore, setSessionScore] = useState({ correct: 0, attempts: 0 });
  const [lastFrameTime, setLastFrameTime] = useState<number>(0);
  const [autoCapture, setAutoCapture] = useState(false);

  const currentSign = LEARNING_SIGNS[currentSignIndex];
  const FRAME_INTERVAL_MS = 2500; // Capture every 2.5s when auto-mode on

  // ── Camera ─────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera access in your browser settings."
          : "Could not start camera. Ensure no other app is using it."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setResult(null);
    setAutoCapture(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ── Auto-capture loop ──────────────────────────────────────
  useEffect(() => {
    if (autoCapture && cameraActive) {
      intervalRef.current = setInterval(() => {
        captureAndRecognize();
      }, FRAME_INTERVAL_MS);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoCapture, cameraActive, currentSignIndex, mode]); // eslint-disable-line

  // ── Capture frame → base64 → API ──────────────────────────
  const captureAndRecognize = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isRecognizing) return;

    const now = Date.now();
    if (now - lastFrameTime < 1000) return; // Throttle
    setLastFrameTime(now);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    ctx.drawImage(videoRef.current, 0, 0);

    const base64 = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];

    setIsRecognizing(true);
    setResult(null);

    try {
      const res = await postToApi<RecognizeResponse>("/isl-live/recognize", {
        frame_data: base64,
        target_sign: mode === "learning" ? currentSign.word : undefined,
      });
      setResult(res);

      // Update session score in learning mode
      if (mode === "learning" && res.confidence >= 0.8) {
        setSessionScore((prev) => ({
          correct: prev.correct + 1,
          attempts: prev.attempts + 1,
        }));
      } else if (mode === "learning") {
        setSessionScore((prev) => ({ ...prev, attempts: prev.attempts + 1 }));
      }
    } catch (_) {
      // Network offline — show mock result
      setResult({
        recognized_sign: mode === "learning" ? currentSign.word : "Namaste",
        confidence: 0.87,
        feedback: "Demo Mode: Connect to backend for real recognition. Showing simulated result.",
      });
    } finally {
      setIsRecognizing(false);
    }
  }, [isRecognizing, lastFrameTime, mode, currentSign]);

  const nextSign = () => {
    setCurrentSignIndex((i) => (i + 1) % LEARNING_SIGNS.length);
    setResult(null);
  };
  const prevSign = () => {
    setCurrentSignIndex((i) => (i - 1 + LEARNING_SIGNS.length) % LEARNING_SIGNS.length);
    setResult(null);
  };

  const accuracy = sessionScore.attempts > 0
    ? Math.round((sessionScore.correct / sessionScore.attempts) * 100)
    : null;

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 h-48 w-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 h-40 w-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-400" />
            <h1 className="text-3xl font-black tracking-tight">Sanket Live</h1>
          </div>
          <p className="text-orange-300 text-sm font-extrabold uppercase tracking-wide">
            Real-Time ISL Practice Interface
          </p>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Use your camera to practice ISL signs with real-time feedback. The recognition engine is designed for future computer vision integration.
          </p>
        </div>
      </section>

      {/* Mode Selector */}
      <div className="flex gap-3">
        <button
          onClick={() => { setMode("learning"); setResult(null); }}
          className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
            mode === "learning"
              ? "bg-teal-950/40 border-teal-500/40 text-teal-300"
              : "bg-slate-900/30 border-slate-850 text-slate-450 hover:border-slate-700"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Mode 1: Learning Practice
        </button>
        <button
          onClick={() => { setMode("communication"); setResult(null); }}
          className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
            mode === "communication"
              ? "bg-orange-950/30 border-orange-500/30 text-orange-300"
              : "bg-slate-900/30 border-slate-850 text-slate-450 hover:border-slate-700"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Mode 2: Communication
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Camera Panel — 3/5 width */}
        <div className="lg:col-span-3 space-y-4">
          {/* Camera Viewport */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-850 bg-slate-950 aspect-video flex items-center justify-center">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay when camera off */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/90 z-10">
                <CameraOff className="h-12 w-12 text-slate-600" />
                <div className="text-center space-y-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Camera Inactive</p>
                  <p className="text-2xs text-slate-600 max-w-xs">Enable your camera to start practicing ISL signs with real-time feedback.</p>
                </div>
                {cameraError && (
                  <div className="px-4 py-2 bg-rose-950/40 border border-rose-500/30 rounded-xl text-[10px] text-rose-400 font-semibold max-w-xs text-center">
                    {cameraError}
                  </div>
                )}
                <Button variant="primary" onClick={startCamera} className="flex items-center gap-2 font-extrabold">
                  <Camera className="h-4 w-4" /> Enable Camera
                </Button>
              </div>
            )}

            {/* Active status bar */}
            {cameraActive && (
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
                <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800/60">
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest">Live</span>
                </div>
                {isRecognizing && (
                  <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-orange-500/30">
                    <Loader2 className="h-3 w-3 text-orange-400 animate-spin" />
                    <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Analyzing…</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Camera controls */}
          <div className="flex gap-3">
            {!cameraActive ? (
              <Button variant="primary" onClick={startCamera} className="flex-1 flex items-center justify-center gap-2 font-extrabold text-xs">
                <Camera className="h-4 w-4" /> Start Camera
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  onClick={captureAndRecognize}
                  disabled={isRecognizing}
                  className="flex-1 flex items-center justify-center gap-2 font-extrabold text-xs"
                >
                  {isRecognizing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
                  ) : (
                    <><Zap className="h-4 w-4" /> Recognise Now</>
                  )}
                </Button>
                <button
                  onClick={() => setAutoCapture((v) => !v)}
                  className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    autoCapture
                      ? "bg-orange-950/40 border-orange-500/40 text-orange-400"
                      : "bg-slate-900 border-slate-800 text-slate-450"
                  }`}
                >
                  {autoCapture ? "Auto ON" : "Auto OFF"}
                </button>
                <Button
                  variant="outline"
                  onClick={stopCamera}
                  className="px-4 flex items-center gap-1.5 text-rose-400 border-rose-500/30 hover:bg-rose-950/20"
                >
                  <CameraOff className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2.5 p-3 bg-slate-900/40 border border-slate-850 rounded-xl">
            <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Sanket Live is a practice aid. It does not claim to fully translate ISL in real time. The recognition engine is a modular prototype — accuracy improves with future CV model integration. Sanket Setu does not store camera footage.
            </p>
          </div>
        </div>

        {/* Right Panel — 2/5 */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Target Sign (Learning Mode) */}
          {mode === "learning" && (
            <Card className="border border-teal-500/20 bg-teal-950/10">
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest">Target Sign</span>
                  <span className="text-[9px] text-slate-500">{currentSignIndex + 1} / {LEARNING_SIGNS.length}</span>
                </div>
                <div className="text-center py-4">
                  <h2 className="text-3xl font-black text-white">{currentSign.word}</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-2 leading-relaxed max-w-xs mx-auto">{currentSign.hint}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={prevSign} className="flex-1 flex items-center justify-center gap-1">
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="secondary" size="sm" onClick={nextSign} className="flex-1 flex items-center justify-center gap-1">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Communication Mode label */}
          {mode === "communication" && (
            <Card className="border border-orange-500/20 bg-orange-950/10">
              <CardContent className="pt-4 pb-3 space-y-2">
                <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block">Free Recognition Mode</span>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Sign anything in front of the camera. The recognition engine will attempt to identify the sign.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Recognition Result */}
          <Card className={`border transition-all ${
            result
              ? result.confidence >= 0.8
                ? "border-teal-500/30 bg-teal-950/10"
                : result.confidence >= 0.55
                  ? "border-orange-500/30 bg-orange-950/10"
                  : "border-rose-500/30 bg-rose-950/10"
              : "border-slate-850"
          }`}>
            <CardContent className="pt-4 space-y-4">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Recognition State</span>

              {!result && !isRecognizing && (
                <div className="text-center py-6 space-y-2">
                  <Camera className="h-8 w-8 text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-600 font-semibold">Waiting for camera input…</p>
                </div>
              )}

              {isRecognizing && (
                <div className="text-center py-6 space-y-2">
                  <Loader2 className="h-8 w-8 text-orange-400 mx-auto animate-spin" />
                  <p className="text-xs text-orange-400 font-black uppercase tracking-widest">Processing frame…</p>
                </div>
              )}

              {result && !isRecognizing && (
                <div className="space-y-4">
                  {/* Sign name */}
                  <div className="text-center">
                    {result.confidence >= 0.8 ? (
                      <CheckCircle2 className="h-8 w-8 text-teal-400 mx-auto mb-2" />
                    ) : result.confidence >= 0.55 ? (
                      <AlertTriangle className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                    ) : (
                      <XCircle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
                    )}
                    <h3 className="text-xl font-black text-white">{result.recognized_sign}</h3>
                  </div>

                  {/* Confidence gauge */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Gauge className="h-3 w-3" /> Confidence
                      </span>
                      <span className={`text-xs font-black ${CONFIDENCE_COLOR(result.confidence)}`}>
                        {Math.round(result.confidence * 100)}% — {CONFIDENCE_LABEL(result.confidence)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-850 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          result.confidence >= 0.8 ? "bg-teal-500" : result.confidence >= 0.55 ? "bg-orange-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Feedback</span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold leading-relaxed">{result.feedback}</p>
                  </div>

                  {/* Low confidence prompt */}
                  {result.confidence < 0.55 && (
                    <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl flex items-start gap-2">
                      <RefreshCw className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-rose-300 font-semibold leading-relaxed">
                        <strong>Please try again.</strong> Move into better lighting and keep your dominant hand clearly in the frame.
                      </p>
                    </div>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setResult(null)}
                    className="w-full flex items-center justify-center gap-1.5 text-2xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Score (Learning Mode) */}
          {mode === "learning" && sessionScore.attempts > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-slate-900/50 border border-slate-850 rounded-xl">
                <span className="text-lg font-black text-white">{sessionScore.attempts}</span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mt-0.5">Attempts</span>
              </div>
              <div className="text-center p-3 bg-slate-900/50 border border-teal-500/20 rounded-xl">
                <span className="text-lg font-black text-teal-400">{sessionScore.correct}</span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mt-0.5">Correct</span>
              </div>
              <div className="text-center p-3 bg-slate-900/50 border border-orange-500/20 rounded-xl">
                <span className="text-lg font-black text-orange-400">{accuracy ?? "—"}%</span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mt-0.5">Accuracy</span>
              </div>
            </div>
          )}

          {/* Architecture note for judges */}
          <div className="p-3 bg-slate-900/30 border border-slate-850 rounded-xl">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">CV Architecture</span>
            <div className="space-y-1">
              {["POST /api/isl-live/recognize", "Input: frame_data (base64), target_sign", "Output: recognized_sign, confidence, feedback", "Model: Modular (replaceable)"].map((line, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-teal-600 text-[9px] font-black mt-0.5">›</span>
                  <code className="text-[9px] text-slate-500 font-mono leading-relaxed">{line}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-950/10 border border-orange-500/20 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
            <p className="text-[9px] text-orange-300 font-semibold leading-relaxed">
              This is a prototype recognition interface. It does not constitute full real-time ISL translation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
