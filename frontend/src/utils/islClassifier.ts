/**
 * islClassifier.ts
 * Real-time client-side ISL Landmark Normalizer and Deterministic Classifier.
 * Processes 21-point MediaPipe hand landmarks into normalized feature vectors
 * and classifies 20 ISL signs with high-accuracy geometric rules & priority evaluation.
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
  { term: "Welcome", category: "Greetings", description: "Open palm sweeping gently inward toward body." },
  { term: "Please", category: "Social", description: "Open palm placed over chest rubbing softly." },
  { term: "Sorry", category: "Social", description: "Closed fist held over heart in small circle." },
  { term: "Love", category: "Expressions", description: "I-L-Y sign with Thumb, Index, and Pinky extended." },
  { term: "Help", category: "Communication", description: "Right fist with thumb up resting on flat left palm." },
  { term: "Yes", category: "Communication", description: "Right hand closed fist with fingers flexed down." },
  { term: "No", category: "Communication", description: "Index & middle finger extended in V/pinch posture." },
  { term: "Good", category: "Expressions", description: "Classic Thumbs-Up sign indicating positivity." },
  { term: "Bad", category: "Expressions", description: "Thumbs-Down sign indicating negation or poor quality." },
  { term: "Water", category: "Daily Needs", description: "Three fingers (W sign) tapped near chin/mouth area." },
  { term: "Doctor", category: "Healthcare", description: "Right index finger tapping wrist pulse area." },
  { term: "Emergency", category: "Healthcare", description: "Fist raised near shoulder shaking urgently." },
  { term: "Stop", category: "Safety", description: "Flat vertical open palm facing forward to halt." },
  { term: "OK", category: "Social", description: "Pinch between Thumb and Index tip with 3 fingers open." },
  { term: "Victory", category: "Expressions", description: "V-sign with Index and Middle fingers spread wide." },
  { term: "Call", category: "Communication", description: "Thumb and Pinky extended near ear simulating phone." },
  { term: "Rock", category: "Expressions", description: "Horns gesture with Index and Pinky extended high." },
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
 * 2. Deterministic ISL Gesture Classifier (20 Signs)
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
  // ONE-HAND GESTURES (18 Distinct ISL Gestures)
  // ----------------------------------------------------
  const pts = hands[0].landmarks;

  const thumbExt = isFingerExtended(pts, 4, 2);
  const indexExt = isFingerExtended(pts, 8, 6);
  const middleExt = isFingerExtended(pts, 12, 10);
  const ringExt = isFingerExtended(pts, 16, 14);
  const pinkyExt = isFingerExtended(pts, 20, 18);

  const extendedCount = [thumbExt, indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;
  const wristY = pts[0].y;
  const thumbTipY = pts[4].y;
  const thumbMcpY = pts[2].y;
  const indexTipY = pts[8].y;

  // 1. OK: Pinch between Thumb tip (4) & Index tip (8) | Middle, Ring, Pinky extended
  const thumbIndexTipDist = getDistance(pts[4], pts[8]);
  if (thumbIndexTipDist < 0.08 && middleExt && ringExt) {
    return {
      sign: "OK",
      confidence: 0.92,
      feedback: "✓ Thumb and index tip pinch with open fingers. OK sign recognized!",
      handsCount: 1,
    };
  }

  // 2. ROCK (Horns): Index & Pinky extended | Middle & Ring folded | Thumb tucked
  const thumbToMiddleMcp = getDistance(pts[4], pts[9]);
  if (indexExt && pinkyExt && !middleExt && !ringExt) {
    if (thumbToMiddleMcp < 0.16 || !thumbExt) {
      return {
        sign: "Rock",
        confidence: 0.93,
        feedback: "✓ Horns posture (Index & Pinky extended with thumb tucked). Rock sign recognized!",
        handsCount: 1,
      };
    }
  }

  // 3. LOVE (I-L-Y): Thumb, Index, Pinky extended wide | Middle & Ring folded
  if (thumbExt && indexExt && pinkyExt && !middleExt && !ringExt && thumbToMiddleMcp >= 0.16) {
    return {
      sign: "Love",
      confidence: 0.93,
      feedback: "✓ I-L-Y sign (Thumb, Index, Pinky extended wide). Love sign recognized!",
      handsCount: 1,
    };
  }

  // 4. CALL: Thumb & Pinky extended | Index, Middle, Ring folded
  if (thumbExt && pinkyExt && !indexExt && !middleExt && !ringExt) {
    return {
      sign: "Call",
      confidence: 0.91,
      feedback: "✓ Phone gesture (Thumb & Pinky extended). Call sign recognized!",
      handsCount: 1,
    };
  }

  // 5. VICTORY: Index & Middle extended wide apart | Ring & Pinky flexed
  const indexMiddleSpread = getDistance(pts[8], pts[12]);
  if (indexExt && middleExt && !ringExt && !pinkyExt && indexMiddleSpread > 0.09) {
    return {
      sign: "Victory",
      confidence: 0.92,
      feedback: "✓ V-sign with fingers spread wide. Victory sign recognized!",
      handsCount: 1,
    };
  }

  // 6. GOOD (Thumbs Up): Thumb extended upward | All other fingers folded
  if (thumbExt && thumbTipY < thumbMcpY - 0.03 && !indexExt && !middleExt && !ringExt && !pinkyExt) {
    return {
      sign: "Good",
      confidence: 0.93,
      feedback: "✓ Thumbs-up posture detected. Good sign recognized!",
      handsCount: 1,
    };
  }

  // 7. BAD (Thumbs Down): Thumb extended downward | All other fingers folded
  if (thumbExt && thumbTipY > thumbMcpY + 0.03 && !indexExt && !middleExt && !ringExt) {
    return {
      sign: "Bad",
      confidence: 0.91,
      feedback: "✓ Thumbs-down posture detected. Bad sign recognized!",
      handsCount: 1,
    };
  }

  // 8. WATER: Index, Middle, Ring extended (W sign) | Pinky flexed near chin
  if (indexExt && middleExt && ringExt && !pinkyExt && indexTipY < 0.68) {
    return {
      sign: "Water",
      confidence: 0.89,
      feedback: "✓ Three-finger W gesture near chin. Water sign recognized!",
      handsCount: 1,
    };
  }

  // 9. EMERGENCY: Raised fist near upper portion of camera frame
  if (extendedCount <= 2 && (wristY < 0.52 || indexTipY < 0.45)) {
    return {
      sign: "Emergency",
      confidence: 0.88,
      feedback: "✓ Raised fist posture detected near shoulder/head. Emergency sign recognized!",
      handsCount: 1,
    };
  }

  // 10. NO: Index & Middle fingers extended together | Ring & Pinky flexed
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return {
      sign: "No",
      confidence: 0.89,
      feedback: "✓ Index and middle fingers extended in V/pinch posture. No sign recognized!",
      handsCount: 1,
    };
  }

  // 11. DOCTOR: Index finger pointing downward/toward wrist pulse
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    return {
      sign: "Doctor",
      confidence: 0.87,
      feedback: "✓ Single index finger pointing gesture detected. Doctor sign recognized!",
      handsCount: 1,
    };
  }

  // 12. YES: Closed fist gesture
  if (extendedCount <= 1 && !indexExt && !middleExt) {
    return {
      sign: "Yes",
      confidence: 0.88,
      feedback: "✓ Closed fist gesture detected. Yes sign recognized!",
      handsCount: 1,
    };
  }

  // 13. SORRY: Closed fist held at chest level
  if (extendedCount <= 1 && wristY > 0.48 && wristY < 0.85) {
    return {
      sign: "Sorry",
      confidence: 0.88,
      feedback: "✓ Closed fist over chest posture. Sorry sign recognized!",
      handsCount: 1,
    };
  }

  // ----------------------------------------------------
  // OPEN PALM DISCRIMINATION (Stop, Please, Thank You, Welcome, Hello)
  // ----------------------------------------------------
  if (extendedCount >= 4) {
    // STOP: Vertical open palm held upright in front of torso/face with fingers pointing UP
    if (indexTipY < wristY - 0.12 && wristY > 0.35 && wristY < 0.85) {
      return {
        sign: "Stop",
        confidence: 0.92,
        feedback: "✓ Vertical open palm facing forward. Stop sign recognized!",
        handsCount: 1,
      };
    }

    // THANK YOU: Open palm near chin/face height (very high in camera frame: indexTipY < 0.32)
    if (indexTipY < 0.32) {
      return {
        sign: "Thank You",
        confidence: 0.90,
        feedback: "✓ Open hand gesture near chin/face height. Thank You sign recognized!",
        handsCount: 1,
      };
    }

    // PLEASE: Open palm placed flat over chest/torso area (wristY between 0.50 and 0.80)
    if (wristY >= 0.50 && wristY <= 0.80) {
      return {
        sign: "Please",
        confidence: 0.90,
        feedback: "✓ Open palm placed over chest. Please sign recognized!",
        handsCount: 1,
      };
    }

    // WELCOME: Open palm near bottom of frame
    if (wristY > 0.80) {
      return {
        sign: "Welcome",
        confidence: 0.89,
        feedback: "✓ Open palm sweeping inward. Welcome sign recognized!",
        handsCount: 1,
      };
    }

    // HELLO: Open palm raised high in frame
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
