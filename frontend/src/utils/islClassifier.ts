/**
 * islClassifier.ts
 * Real-time client-side ISL Landmark Normalizer and Deterministic Classifier.
 * Processes 21-point MediaPipe hand landmarks into normalized feature vectors
 * and classifies ISL signs with high-accuracy geometric rules & priority evaluation.
 */

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: NormalizedLandmark[];
  handedness: "Left" | "Right";
}

export interface PredictionResult {
  sign: string;
  confidence: number;
  feedback: string;
  handsCount: number;
}

export const SUPPORTED_VOCABULARY = [
  { term: "Namaste", category: "Greetings", description: "Two palms pressed together flat at chest level." },
  { term: "Hello", category: "Greetings", description: "Open right palm raised with all fingers extended." },
  { term: "Thank You", category: "Greetings", description: "Open palm fingertips near chin extending forward." },
  { term: "Help", category: "Communication", description: "Right fist with thumb up resting on flat left palm." },
  { term: "Yes", category: "Communication", description: "Right hand closed fist with fingers flexed down." },
  { term: "No", category: "Communication", description: "Index & middle finger extended and touching thumb." },
  { term: "Doctor", category: "Healthcare", description: "Right index finger tapping wrist pulse area." },
  { term: "Emergency", category: "Healthcare", description: "Fist raised near shoulder shaking urgently." },
];

/**
 * 1. Landmark Normalization
 * Translates landmarks relative to Wrist (Landmark 0) and scales by hand size.
 */
export function normalizeLandmarks(landmarks: NormalizedLandmark[]): number[] {
  if (!landmarks || landmarks.length < 21) return new Array(63).fill(0);

  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  const dz = middleMcp.z - wrist.z;
  const scale = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1.0;

  const features: number[] = [];
  for (let i = 0; i < 21; i++) {
    features.push((landmarks[i].x - wrist.x) / scale);
    features.push((landmarks[i].y - wrist.y) / scale);
    features.push((landmarks[i].z - wrist.z) / scale);
  }

  return features;
}

/**
 * Calculate 3D Euclidean distance between two landmark points
 */
function getDistance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if a finger is extended (tip further from wrist than PIP joint)
 */
function isFingerExtended(pts: NormalizedLandmark[], tipIdx: number, pipIdx: number): boolean {
  const wristDistTip = getDistance(pts[tipIdx], pts[0]);
  const wristDistPip = getDistance(pts[pipIdx], pts[0]);
  return wristDistTip > wristDistPip * 1.05;
}

/**
 * 2. Deterministic ISL Gesture Classifier
 */
export function classifyISLGesture(hands: HandData[]): PredictionResult {
  if (!hands || hands.length === 0) {
    return {
      sign: "None",
      confidence: 0,
      feedback: "No hands detected. Please place your hands clearly in front of the camera.",
      handsCount: 0,
    };
  }

  // ----------------------------------------------------
  // TWO-HAND GESTURES (Namaste, Help)
  // ----------------------------------------------------
  if (hands.length >= 2) {
    const h1 = hands[0].landmarks;
    const h2 = hands[1].landmarks;

    const wristDist = getDistance(h1[0], h2[0]);
    const indexTipDist = getDistance(h1[8], h2[8]);
    const middleMcpDist = getDistance(h1[9], h2[9]);

    // HELP: One hand flat/open, one hand closed fist or thumb up
    const h1ExtCount = [4, 8, 12, 16, 20].filter((t, i) => isFingerExtended(h1, t, [2, 6, 10, 14, 18][i])).length;
    const h2ExtCount = [4, 8, 12, 16, 20].filter((t, i) => isFingerExtended(h2, t, [2, 6, 10, 14, 18][i])).length;

    const oneFlatOneFist = (h1ExtCount >= 3 && h2ExtCount <= 2) || (h2ExtCount >= 3 && h1ExtCount <= 2);

    if (oneFlatOneFist && wristDist < 0.55) {
      return {
        sign: "Help",
        confidence: 0.91,
        feedback: "✓ Supported fist on open palm detected. Help sign recognized!",
        handsCount: hands.length,
      };
    }

    // NAMASTE: Joined palms or close proximity of index tips/wrists at chest level
    if (wristDist < 0.48 || indexTipDist < 0.42 || middleMcpDist < 0.40) {
      return {
        sign: "Namaste",
        confidence: 0.94,
        feedback: "✓ Both palms joined in Anjali Mudra posture. Namaste sign recognized!",
        handsCount: hands.length,
      };
    }

    return {
      sign: "Namaste",
      confidence: 0.82,
      feedback: "Two hands in frame. Bring palms together for Namaste.",
      handsCount: hands.length,
    };
  }

  // ----------------------------------------------------
  // ONE-HAND GESTURES (Thank You, Emergency, Doctor, No, Yes, Hello)
  // ----------------------------------------------------
  const pts = hands[0].landmarks;

  const thumbExt = isFingerExtended(pts, 4, 2);
  const indexExt = isFingerExtended(pts, 8, 6);
  const middleExt = isFingerExtended(pts, 12, 10);
  const ringExt = isFingerExtended(pts, 16, 14);
  const pinkyExt = isFingerExtended(pts, 20, 18);

  const extendedCount = [thumbExt, indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;
  const wristY = pts[0].y;
  const indexTipY = pts[8].y;

  // EMERGENCY: Raised fist near upper portion of camera frame
  if (extendedCount <= 2 && (wristY < 0.52 || indexTipY < 0.45)) {
    return {
      sign: "Emergency",
      confidence: 0.88,
      feedback: "✓ Raised fist posture detected near shoulder/head. Emergency sign recognized!",
      handsCount: 1,
    };
  }

  // THANK YOU: Open palm near upper frame/chin height
  if (extendedCount >= 3 && indexTipY < 0.55 && (indexExt && middleExt && ringExt)) {
    return {
      sign: "Thank You",
      confidence: 0.90,
      feedback: "✓ Open hand gesture near chin/face height. Thank You sign recognized!",
      handsCount: 1,
    };
  }

  // NO: Index & Middle fingers extended together, Ring & Pinky flexed
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return {
      sign: "No",
      confidence: 0.89,
      feedback: "✓ Index and middle fingers extended in V/pinch posture. No sign recognized!",
      handsCount: 1,
    };
  }

  // DOCTOR: Index finger pointing downward/toward wrist pulse
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    return {
      sign: "Doctor",
      confidence: 0.87,
      feedback: "✓ Single index finger pointing gesture detected. Doctor sign recognized!",
      handsCount: 1,
    };
  }

  // YES: Closed fist gesture
  if (extendedCount <= 1 && !indexExt && !middleExt) {
    return {
      sign: "Yes",
      confidence: 0.88,
      feedback: "✓ Closed fist gesture detected. Yes sign recognized!",
      handsCount: 1,
    };
  }

  // HELLO: Open palm with 4+ fingers extended raised in view
  if (extendedCount >= 4) {
    return {
      sign: "Hello",
      confidence: 0.92,
      feedback: "✓ Open palm raised with fingers extended. Hello sign recognized!",
      handsCount: 1,
    };
  }

  return {
    sign: "Searching...",
    confidence: 0.50,
    feedback: "Hand detected. Hold your sign posture steadily for recognition.",
    handsCount: 1,
  };
}

/**
 * 3. Sliding-Window Stability Filter
 */
export class PredictionStabilityFilter {
  private buffer: string[] = [];
  private windowSize: number;
  private minConsecutive: number;

  constructor(windowSize = 5, minConsecutive = 3) {
    this.windowSize = windowSize;
    this.minConsecutive = minConsecutive;
  }

  public add(prediction: string): string | null {
    if (!prediction || prediction === "None" || prediction === "Searching...") {
      this.buffer = [];
      return null;
    }

    this.buffer.push(prediction);
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }

    // Count occurrences
    const counts: Record<string, number> = {};
    for (const p of this.buffer) {
      counts[p] = (counts[p] || 0) + 1;
    }

    for (const [sign, count] of Object.entries(counts)) {
      if (count >= this.minConsecutive) {
        return sign;
      }
    }

    return null;
  }

  public reset(): void {
    this.buffer = [];
  }
}
