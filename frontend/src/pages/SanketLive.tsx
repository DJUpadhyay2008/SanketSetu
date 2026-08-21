import { useEffect, useRef, useState, useCallback } from "react";
import { 
  Camera, CameraOff, CheckCircle2, AlertTriangle,
  Gauge, Zap, BookOpen, MessageSquare, Info, Loader2,
  Volume2, ChevronLeft, ChevronRight, Shield, Sparkles, Trash2
} from "lucide-react";
import { Button, Card, CardContent, Badge } from "../components/ui";
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { 
  classifyISLGesture, 
  PredictionStabilityFilter, 
  SUPPORTED_VOCABULARY, 
  type PredictionResult, 
  type HandData 
} from "../utils/islClassifier";

type RecognitionMode = "learning" | "communication";

// 21-landmark skeleton connections
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [9, 13], [13, 14], [14, 15], [15, 16],// Ring
  [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [0, 17]                               // Palm base
];

export default function SanketLive() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // MediaPipe state
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  // Camera & Mode state
  const [mode, setMode] = useState<RecognitionMode>("learning");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);

  // Recognition state
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [stabilizedSign, setStabilizedSign] = useState<string | null>(null);
  const [handsDetected, setHandsDetected] = useState(0);
  const filterRef = useRef(new PredictionStabilityFilter(7, 4));

  // Practice & Score state
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, attempts: 0, xp: 0 });
  const [completedSigns, setCompletedSigns] = useState<Set<string>>(new Set());

  // Communication mode buffer
  const [sentenceBuffer, setSentenceBuffer] = useState<string[]>([]);

  const currentSign = SUPPORTED_VOCABULARY[currentSignIndex];

  // ----------------------------------------------------
  // 1. Initialize MediaPipe HandLandmarker
  // ----------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    async function initMediaPipe() {
      try {
        setModelLoading(true);
        setModelError(null);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        if (!isMounted) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
        });

        if (isMounted) {
          handLandmarkerRef.current = handLandmarker;
          setModelLoading(false);
        }
      } catch (err: any) {
        console.error("MediaPipe load error:", err);
        if (isMounted) {
          setModelError("Failed to initialize MediaPipe WASM model. Check network connection.");
          setModelLoading(false);
        }
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  // ----------------------------------------------------
  // 2. Camera Start & Stop
  // ----------------------------------------------------
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
      console.error("Camera error:", err);
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in browser settings."
          : "Camera unavailable. Ensure no other application is using your webcam."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setPrediction(null);
    setStabilizedSign(null);
    setHandsDetected(0);
    filterRef.current.reset();
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ----------------------------------------------------
  // 3. Continuous Hand Landmark Tracking & Inference Loop
  // ----------------------------------------------------
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;

    let lastTime = performance.now();
    let frameCount = 0;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      // Sync canvas dimensions
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Perform MediaPipe Landmarking if loaded
      if (handLandmarkerRef.current) {
        try {
          const results: HandLandmarkerResult = handLandmarkerRef.current.detectForVideo(
            video,
            now
          );

          if (results && results.landmarks && results.landmarks.length > 0) {
            setHandsDetected(results.landmarks.length);

            const handDataList: HandData[] = results.landmarks.map((lm, idx) => ({
              landmarks: lm,
              handedness: (results.handedness?.[idx]?.[0]?.categoryName as "Left" | "Right") || "Right",
            }));

            // Run ISL Feature Extraction & Classification
            const res = classifyISLGesture(handDataList);
            setPrediction(res);

            // Apply Stability Filter
            const stable = filterRef.current.add(res.sign);
            if (stable) {
              setStabilizedSign(stable);
            }

            // Draw Hand Skeleton & Dynamic Sign Text on Canvas
            if (ctx) {
              const displayLabel = stable || res.sign;

              handDataList.forEach((hand) => {
                const landmarks = hand.landmarks;

                // Draw bones/connections
                ctx.strokeStyle = "#00F0FF";
                ctx.lineWidth = 3;
                HAND_CONNECTIONS.forEach(([i, j]) => {
                  ctx.beginPath();
                  ctx.moveTo(landmarks[i].x * canvas.width, landmarks[i].y * canvas.height);
                  ctx.lineTo(landmarks[j].x * canvas.width, landmarks[j].y * canvas.height);
                  ctx.stroke();
                });

                // Draw joint points
                landmarks.forEach((pt, pIdx) => {
                  ctx.beginPath();
                  ctx.arc(pt.x * canvas.width, pt.y * canvas.height, pIdx === 0 ? 6 : 4, 0, 2 * Math.PI);
                  ctx.fillStyle = pIdx === 0 ? "#FF0055" : "#00FF88";
                  ctx.fill();
                  ctx.lineWidth = 1.5;
                  ctx.strokeStyle = "#FFFFFF";
                  ctx.stroke();
                });

                // Render dynamic text tag above wrist (landmark 0)
                if (displayLabel && displayLabel !== "None" && displayLabel !== "Searching...") {
                  const wristX = landmarks[0].x * canvas.width;
                  const wristY = landmarks[0].y * canvas.height;

                  ctx.save();
                  // Reset mirror transform for text so it reads left-to-right legibly
                  ctx.font = "bold 16px sans-serif";
                  const textWidth = ctx.measureText(displayLabel).width;
                  
                  // Background tag badge
                  ctx.fillStyle = stable ? "rgba(15, 118, 110, 0.9)" : "rgba(15, 23, 42, 0.9)";
                  ctx.strokeStyle = stable ? "#2dd4bf" : "#f97316";
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.roundRect(wristX - textWidth / 2 - 8, wristY - 42, textWidth + 16, 26, 6);
                  ctx.fill();
                  ctx.stroke();

                  // Text label
                  ctx.fillStyle = "#FFFFFF";
                  ctx.textAlign = "center";
                  ctx.fillText(displayLabel, wristX, wristY - 24);
                  ctx.restore();
                }
              });
            }
          } else {
            setHandsDetected(0);
            setPrediction(null);
            setStabilizedSign(null);
            filterRef.current.reset();
          }
        } catch (err) {
          console.error("Frame processing error:", err);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraActive]);

  // ----------------------------------------------------
  // 4. Handle Learning Target Sign Completion
  // ----------------------------------------------------
  useEffect(() => {
    if (mode !== "learning" || !stabilizedSign || !currentSign) return;

    if (stabilizedSign.toLowerCase() === currentSign.term.toLowerCase()) {
      if (!completedSigns.has(currentSign.term)) {
        setCompletedSigns((prev) => new Set(prev).add(currentSign.term));
        setScore((prev) => ({
          correct: prev.correct + 1,
          attempts: prev.attempts + 1,
          xp: prev.xp + 10,
        }));
      }
    }
  }, [stabilizedSign, currentSign, mode, completedSigns]);

  // ----------------------------------------------------
  // 5. Handle Communication Sentence Buffer
  // ----------------------------------------------------
  useEffect(() => {
    if (mode !== "communication" || !stabilizedSign) return;

    if (stabilizedSign && stabilizedSign !== "None" && stabilizedSign !== "Searching...") {
      setSentenceBuffer((prev) => {
        if (prev[prev.length - 1] !== stabilizedSign) {
          return [...prev, stabilizedSign];
        }
        return prev;
      });
    }
  }, [stabilizedSign, mode]);

  const speakSentence = () => {
    if (sentenceBuffer.length === 0) return;
    const text = sentenceBuffer.join(" ");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const nextSign = () => {
    setCurrentSignIndex((i) => (i + 1) % SUPPORTED_VOCABULARY.length);
    setStabilizedSign(null);
    filterRef.current.reset();
  };

  const prevSign = () => {
    setCurrentSignIndex((i) => (i - 1 + SUPPORTED_VOCABULARY.length) % SUPPORTED_VOCABULARY.length);
    setStabilizedSign(null);
    filterRef.current.reset();
  };

  const accuracy = score.attempts > 0 ? Math.round((score.correct / score.attempts) * 100) : 100;

  return (
    <div className="space-y-8 py-2">
      {/* Top Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 h-48 w-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 h-40 w-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-teal-400" />
              <h1 className="text-3xl font-black tracking-tight">Sanket Live</h1>
              <Badge variant="teal" className="text-[10px] font-black uppercase px-2 py-0.5 ml-2">
                Real-Time CV Prototype
              </Badge>
            </div>
            <p className="text-teal-300 text-xs font-extrabold uppercase tracking-widest">
              On-Device ISL Practice & Limited Gesture Recognition
            </p>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Uses local MediaPipe Hand Landmarker (21 joints) and landmark normalization to recognize ISL signs directly inside your browser. No camera video is uploaded or recorded.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs font-bold">
            <Shield className="h-5 w-5 text-teal-400 shrink-0" />
            <div className="text-left">
              <div className="text-slate-200 font-extrabold text-[11px]">100% Privacy Protected</div>
              <div className="text-[10px] text-slate-400 font-medium">Camera frames processed locally</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mode Selector Tabs */}
      <div className="flex gap-3">
        <button
          onClick={() => { setMode("learning"); setStabilizedSign(null); }}
          className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
            mode === "learning"
              ? "bg-teal-950/40 border-teal-500/40 text-teal-300 shadow-md shadow-teal-950/20"
              : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Mode 1: Guided Learning Practice
        </button>
        <button
          onClick={() => { setMode("communication"); setStabilizedSign(null); }}
          className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
            mode === "communication"
              ? "bg-orange-950/30 border-orange-500/30 text-orange-300 shadow-md shadow-orange-950/20"
              : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Mode 2: Sentence Builder (Communication)
        </button>
      </div>

      {/* Main Interface Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT PANEL: Live Camera Stream & Visual Hand Skeleton (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center shadow-2xl group">
            
            {/* Live WebCam Video Element */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
              autoPlay
              playsInline
              muted
            />

            {/* Hand Skeleton Overlay Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
            />

            {/* Inactive Camera Overlay */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/95 z-20 p-6 text-center">
                <div className="p-4 bg-slate-900 rounded-full border border-slate-800 text-slate-500">
                  <CameraOff className="h-10 w-10" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Webcam Access Required</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click below to allow camera access. Sanket Live analyzes 21 hand landmarks locally for real-time ISL practice.
                  </p>
                </div>
                {(cameraError || modelError) && (
                  <div className="px-4 py-2.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-semibold max-w-md">
                    {cameraError || modelError}
                  </div>
                )}
                <Button
                  variant="primary"
                  onClick={startCamera}
                  disabled={modelLoading}
                  className="flex items-center gap-2 font-extrabold px-6 py-3 text-xs cursor-pointer"
                >
                  {modelLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Loading WASM Model...</>
                  ) : (
                    <><Camera className="h-4 w-4" /> Start Camera</>
                  )}
                </Button>
              </div>
            )}

            {/* Top Live Status Bar */}
            {cameraActive && (
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
                <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-teal-400 uppercase tracking-wider text-[10px]">LIVE ({fps} FPS)</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md text-[10px] font-black uppercase tracking-wider ${
                    handsDetected > 0 ? "bg-teal-950/80 border-teal-500/40 text-teal-300" : "bg-slate-900/80 border-slate-800 text-slate-400"
                  }`}>
                    <span>Hands: {handsDetected} Detected</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-black text-slate-300 uppercase tracking-wider">
                    <span>Model: MediaPipe WASM</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom HUD Banner: Dynamic Recognized Sign Overlay directly on top of Video */}
            {cameraActive && (
              <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex flex-col items-center">
                {prediction && (prediction.sign !== "None" && prediction.sign !== "Searching...") ? (
                  <div className={`w-full max-w-lg p-3.5 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center justify-between gap-3 transition-all transform animate-in fade-in slide-in-from-bottom-2 ${
                    stabilizedSign
                      ? "bg-teal-950/90 border-teal-400/50 shadow-teal-950/50 ring-2 ring-teal-500/30"
                      : "bg-slate-950/90 border-orange-500/40 shadow-orange-950/30"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${
                        stabilizedSign ? "bg-teal-500/20 border-teal-400/40 text-teal-300" : "bg-orange-500/20 border-orange-400/40 text-orange-300"
                      }`}>
                        <Sparkles className="h-6 w-6 animate-pulse" />
                      </div>
                      <div className="space-y-0.5 text-left">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                          {stabilizedSign ? "✓ Confirmed Gesture" : "Detecting Gesture..."}
                        </div>
                        <div className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                          <span>{stabilizedSign ? stabilizedSign : prediction.sign}</span>
                          {stabilizedSign && mode === "learning" && stabilizedSign.toLowerCase() === currentSign.term.toLowerCase() && (
                            <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              MATCHED!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="inline-flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] font-black text-teal-400">
                        <span>{Math.round(prediction.confidence * 100)}%</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                        Confidence
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-slate-950/80 backdrop-blur-md rounded-xl border border-slate-800 text-xs font-bold text-slate-400 shadow-lg">
                    🖐️ Place hand clearly in camera view to recognize sign
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Camera Action Buttons */}
          <div className="flex gap-3">
            {!cameraActive ? (
              <Button
                variant="primary"
                onClick={startCamera}
                disabled={modelLoading}
                className="flex-1 flex items-center justify-center gap-2 font-extrabold text-xs py-3 cursor-pointer"
              >
                <Camera className="h-4 w-4" /> Start Camera Stream
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={stopCamera}
                className="w-full flex items-center justify-center gap-2 text-rose-400 border-rose-500/30 hover:bg-rose-950/30 font-extrabold text-xs py-2.5 cursor-pointer"
              >
                <CameraOff className="h-4 w-4" /> Stop Camera Stream
              </Button>
            )}
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2.5 p-3.5 bg-slate-900/60 border border-slate-850 rounded-2xl text-xs text-slate-400">
            <Info className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Local On-Device Execution:</strong> All hand landmark tracking and gesture matching are calculated inside your browser memory. No video images leave your computer.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: Target Sign Practice & Feedback (2/5) */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Mode 1: Target Sign Guidance */}
          {mode === "learning" && (
            <Card className="border border-teal-500/30 bg-teal-950/20 shadow-lg">
              <CardContent className="space-y-4 pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Target Sign Challenge
                  </span>
                  <span className="text-xs font-extrabold text-slate-400">
                    {currentSignIndex + 1} / {SUPPORTED_VOCABULARY.length}
                  </span>
                </div>

                <div className="text-center py-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <h2 className="text-3xl font-black text-white tracking-tight">{currentSign.term}</h2>
                  <Badge variant="teal" className="mt-2 text-[10px] font-bold">
                    Category: {currentSign.category}
                  </Badge>
                  <p className="text-xs text-slate-300 font-semibold mt-3 px-4 leading-relaxed">
                    "{currentSign.description}"
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={prevSign} className="flex-1 flex items-center justify-center gap-1 font-bold text-xs cursor-pointer">
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="secondary" size="sm" onClick={nextSign} className="flex-1 flex items-center justify-center gap-1 font-bold text-xs cursor-pointer">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mode 2: Communication Mode Buffer */}
          {mode === "communication" && (
            <Card className="border border-orange-500/30 bg-orange-950/20 shadow-lg">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
                    Recognized Sentence Buffer
                  </span>
                  <button
                    onClick={() => setSentenceBuffer([])}
                    className="text-xs text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                  </button>
                </div>

                <div className="min-h-24 p-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-2">
                  {sentenceBuffer.length === 0 ? (
                    <span className="text-xs text-slate-500 font-medium italic">
                      Perform signs in front of the camera to build a sentence...
                    </span>
                  ) : (
                    sentenceBuffer.map((word, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/40 text-orange-300 font-black rounded-xl text-xs"
                      >
                        {word}
                      </span>
                    ))
                  )}
                </div>

                {sentenceBuffer.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={speakSentence}
                    className="w-full flex items-center justify-center gap-2 font-bold text-xs cursor-pointer"
                  >
                    <Volume2 className="h-4 w-4" /> Speak Sentence
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Live Recognition Feedback Display */}
          <Card className={`border transition-all ${
            stabilizedSign
              ? "border-teal-500/40 bg-teal-950/20 shadow-lg"
              : prediction
                ? "border-orange-500/30 bg-slate-900"
                : "border-slate-800 bg-slate-900"
          }`}>
            <CardContent className="pt-5 space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Real-Time Classifier Output
              </span>

              {!prediction && (
                <div className="text-center py-6 space-y-2">
                  <Camera className="h-8 w-8 text-slate-700 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-500 font-semibold">Waiting for hand gesture in camera view...</p>
                </div>
              )}

              {prediction && (
                <div className="space-y-4">
                  <div className="text-center">
                    {stabilizedSign ? (
                      <CheckCircle2 className="h-8 w-8 text-teal-400 mx-auto mb-2 animate-bounce" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                    )}

                    <h3 className="text-2xl font-black text-white tracking-tight">
                      {stabilizedSign ? stabilizedSign : prediction.sign}
                    </h3>

                    {stabilizedSign && mode === "learning" && (
                      <Badge variant="teal" className="mt-2 text-xs font-black uppercase">
                        ✓ Recognized! +10 XP
                      </Badge>
                    )}
                  </div>

                  {/* Confidence Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Gauge className="h-3.5 w-3.5 text-teal-400" /> Confidence
                      </span>
                      <span className="text-teal-300">{Math.round(prediction.confidence * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${prediction.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Feedback Message */}
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 text-xs">
                    <div className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">
                      Position Analysis:
                    </div>
                    <p className="text-slate-200 font-medium leading-relaxed">
                      {prediction.feedback}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Performance Stats */}
          {mode === "learning" && (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <span className="text-xl font-black text-white">{completedSigns.size}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Completed</span>
              </div>
              <div className="text-center p-3 bg-slate-900/60 border border-teal-500/30 rounded-2xl">
                <span className="text-xl font-black text-teal-400">+{score.xp}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">XP Earned</span>
              </div>
              <div className="text-center p-3 bg-slate-900/60 border border-orange-500/30 rounded-2xl">
                <span className="text-xl font-black text-orange-400">{accuracy}%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">Accuracy</span>
              </div>
            </div>
          )}

          {/* Supported Vocabulary List */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <div className="font-extrabold text-slate-300 text-[11px] uppercase tracking-wider">
              Supported Vocabulary ({SUPPORTED_VOCABULARY.length} Signs)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_VOCABULARY.map((v) => (
                <span
                  key={v.term}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                    completedSigns.has(v.term)
                      ? "bg-teal-950/80 border-teal-500/40 text-teal-300"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  {v.term} {completedSigns.has(v.term) && "✓"}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
