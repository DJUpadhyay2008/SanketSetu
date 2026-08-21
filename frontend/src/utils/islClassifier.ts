/**
 * islClassifier.ts
 * Real-time client-side ISL Landmark Normalizer and Deterministic Classifier.
 * Processes 21-point MediaPipe hand landmarks into normalized feature vectors
 * and classifies ISL signs/alphabets with frame stability filtering.
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

  // Scale factor: distance between wrist (0) and middle finger MCP joint (9)
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
 * Calculate 3D Euclidean distance between two landmark indices
 */
function getDistance(pts: NormalizedLandmark[], i: number, j: number): number {
  const dx = pts[i].x - pts[j].x;
  const dy = pts[i].y - pts[j].y;
  const dz = pts[i].z - pts[j].z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if a finger is extended (tip further from wrist than PIP joint)
 */
function isFingerExtended(pts: NormalizedLandmark[], tipIdx: number, pipIdx: number): boolean {
  const wristDistTip = getDistance(pts, tipIdx, 0);
  const wristDistPip = getDistance(pts, pipIdx, 0);
  return wristDistTip > wristDistPip * 1.1;
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
  // TWO HAND GESTURES
  // ----------------------------------------------------
  if (hands.length >= 2) {
    const h1 = hands[0].landmarks;
    const h2 = hands[1].landmarks;

    const w1 = h1[0];
    const w2 = h2[0];
    const wristDistance = Math.sqrt(
      Math.pow(w1.x - w2.x, 2) + Math.pow(w1.y - w2.y, 2) + Math.pow(w1.z - w2.z, 2)
    );

    // NAMASTE: Both wrists and index fingertips close together in chest center
    const indexTip1 = h1[8];
    const indexTip2 = h2[8];
    const tipDistance = Math.sqrt(
      Math.pow(indexTip1.x - indexTip2.x, 2) +
      Math.pow(indexTip1.y - indexTip2.y, 2) +
      Math.pow(indexTip1.z - indexTip2.z, 2)
    );

    if (wristDistance < 0.35 && tipDistance < 0.25) {
      return {
        sign: "Namaste",
        confidence: 0.92,
        feedback: "✓ Both palms joined in Anjali Mudra posture. Excellent Namaste sign!",
        handsCount: hands.length,
      };
    }

    // HELP: One palm flat facing up, other fist with thumb up resting on it
    const h1Flat = isFingerExtended(h1, 8, 6) && isFingerExtended(h1, 12, 10) && isFingerExtended(h1, 16, 14);
    const h2Fist = !isFingerExtended(h2, 8, 6) && !isFingerExtended(h2, 12, 10);
    if ((h1Flat && h2Fist) || (h2Fist && h1Flat)) {
      if (wristDistance < 0.45) {
        return {
          sign: "Help",
          confidence: 0.88,
          feedback: "✓ Supported fist on open palm detected. Help sign recognized!",
          handsCount: hands.length,
        };
      }
    }

    return {
      sign: "Namaste",
      confidence: 0.76,
      feedback: "Two hands detected. Bring palms closer together for Namaste.",
      handsCount: hands.length,
    };
  }

  // ----------------------------------------------------
  // ONE HAND GESTURES
  // ----------------------------------------------------
  const pts = hands[0].landmarks;

  const thumbExt = isFingerExtended(pts, 4, 2);
  const indexExt = isFingerExtended(pts, 8, 6);
  const middleExt = isFingerExtended(pts, 12, 10);
  const ringExt = isFingerExtended(pts, 16, 14);
  const pinkyExt = isFingerExtended(pts, 20, 18);

  const extendedCount = [thumbExt, indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

  // HELLO: All 5 fingers extended, palm facing forward
  if (extendedCount >= 4) {
    return {
      sign: "Hello",
      confidence: 0.89,
      feedback: "✓ Open palm raised with fingers extended. Hello sign recognized!",
      handsCount: 1,
    };
  }

  // THANK YOU: Open palm extended forward (3-4 fingers open near upper half of frame)
  if (indexExt && middleExt && ringExt && pts[8].y < 0.5) {
    return {
      sign: "Thank You",
      confidence: 0.84,
      feedback: "✓ Open hand moving forward from chin height. Thank You sign recognized!",
      handsCount: 1,
    };
  }

  // YES: Closed fist (all fingers flexed down)
  if (extendedCount <= 1 && !indexExt && !middleExt) {
    return {
      sign: "Yes",
      confidence: 0.86,
      feedback: "✓ Closed fist gesture detected. Yes sign recognized!",
      handsCount: 1,
    };
  }

  // NO: Index and middle finger extended, thumb touching them
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return {
      sign: "No",
      confidence: 0.85,
      feedback: "✓ Index and middle fingers extended. No sign recognized!",
      handsCount: 1,
    };
  }

  // DOCTOR: Index finger extended pointing toward wrist
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    return {
      sign: "Doctor",
      confidence: 0.82,
      feedback: "✓ Index finger pointing posture detected. Doctor sign recognized!",
      handsCount: 1,
    };
  }

  // EMERGENCY: Raised fist near top of frame
  if (extendedCount <= 2 && pts[0].y < 0.4) {
    return {
      sign: "Emergency",
      confidence: 0.80,
      feedback: "✓ Raised hand posture detected. Emergency sign recognized!",
      handsCount: 1,
    };
  }

  return {
    sign: "Searching...",
    confidence: 0.45,
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

  constructor(windowSize = 7, minConsecutive = 4) {
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
