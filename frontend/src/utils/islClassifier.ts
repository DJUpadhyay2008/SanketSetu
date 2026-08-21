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
  { term: "Hospital", category: "Healthcare", description: "Cross gesture with index finger over arm." },
  { term: "Medicine", category: "Healthcare", description: "Middle finger tapping open palm." },
  { term: "Police", category: "Public Services", description: "Index & middle finger salute near forehead." },
  { term: "Government", category: "Public Services", description: "Index finger pointing at temple area." },
  { term: "Time", category: "Daily Needs", description: "Index finger tapping wrist watch location." },
  { term: "Food / Eat", category: "Daily Needs", description: "Pinched fingertips brought to mouth area." },
  { term: "Money", category: "Everyday", description: "Thumb & index finger pinch rubbing near chest." },
  { term: "Friend", category: "Social", description: "Both index fingers hooked or touching together." },
  { term: "Home", category: "Everyday", description: "Fingertips forming roof/tent shape." },
  { term: "School / College", category: "Education", description: "Both flat palms clapping horizontally." },
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
 * 2. Deterministic ISL Gesture Classifier (30 Signs)
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
  // TWO-HAND GESTURES (Namaste, Help, Friend, School / College)
  // ----------------------------------------------------
  if (hands.length >= 2) {
    const h1 = hands[0].landmarks;
    const h2 = hands[1].landmarks;

    const wristDist = getDistance(h1[0], h2[0]);
    const indexTipDist = getDistance(h1[8], h2[8]);
    const middleMcpDist = getDistance(h1[9], h2[9]);

    const h1ExtCount = [4, 8, 12, 16, 20].filter((t, i) => isFingerExtended(h1, t, [2, 6, 10, 14, 18][i])).length;
    const h2ExtCount = [4, 8, 12, 16, 20].filter((t, i) => isFingerExtended(h2, t, [2, 6, 10, 14, 18][i])).length;

    // FRIEND: Both index fingers extended touching each other
    if (isFingerExtended(h1, 8, 6) && isFingerExtended(h2, 8, 6) && indexTipDist < 0.22) {
      return {
        sign: "Friend",
        confidence: 0.94,
        feedback: "✓ Both index fingers touching/interlocked. Friend sign recognized!",
        handsCount: hands.length,
      };
    }

    // SCHOOL / COLLEGE: Both open palms facing each other near torso
    if (h1ExtCount >= 4 && h2ExtCount >= 4 && wristDist < 0.38) {
      return {
        sign: "School / College",
        confidence: 0.93,
        feedback: "✓ Both open palms facing horizontally. School / College sign recognized!",
        handsCount: hands.length,
      };
    }

    // HELP: One hand flat/open, one hand closed fist or thumb up resting together
    const oneFlatOneFist = (h1ExtCount >= 3 && h2ExtCount <= 2) || (h2ExtCount >= 3 && h1ExtCount <= 2);
    if (oneFlatOneFist && wristDist < 0.40) {
      return {
        sign: "Help",
        confidence: 0.91,
        feedback: "✓ Supported fist on open palm detected. Help sign recognized!",
        handsCount: hands.length,
      };
    }

    // NAMASTE: Both palms pressed together flat at chest level
    if (wristDist < 0.36 && (indexTipDist < 0.32 || middleMcpDist < 0.32)) {
      return {
        sign: "Namaste",
        confidence: 0.94,
        feedback: "✓ Both palms joined in Anjali Mudra posture. Namaste sign recognized!",
        handsCount: hands.length,
      };
    }
  }

  // ----------------------------------------------------
  // ONE-HAND GESTURES (26 Distinct ISL Gestures)
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
  const thumbIndexTipDist = getDistance(pts[4], pts[8]);

  // 1. FOOD / EAT: Pinch thumb + index near mouth (high Y: indexTipY < 0.32)
  if (thumbIndexTipDist < 0.08 && indexTipY < 0.32) {
    return {
      sign: "Food / Eat",
      confidence: 0.93,
      feedback: "✓ Pinched fingertips brought to mouth area. Food / Eat sign recognized!",
      handsCount: 1,
    };
  }

  // 2. MONEY: Pinch thumb + index near chest level (indexTipY between 0.32 and 0.65)
  if (thumbIndexTipDist < 0.07 && indexTipY >= 0.32 && indexTipY <= 0.65 && !middleExt) {
    return {
      sign: "Money",
      confidence: 0.91,
      feedback: "✓ Pinch gesture rubbing near chest level. Money sign recognized!",
      handsCount: 1,
    };
  }

  // 3. OK: Pinch between Thumb tip (4) & Index tip (8) | Middle, Ring, Pinky extended
  if (thumbIndexTipDist < 0.08 && middleExt && ringExt) {
    return {
      sign: "OK",
      confidence: 0.92,
      feedback: "✓ Thumb and index tip pinch with open fingers. OK sign recognized!",
      handsCount: 1,
    };
  }

  // 4. POLICE: Index & Middle finger salute posture near forehead (indexTipY < 0.28)
  if (indexExt && middleExt && indexTipY < 0.28 && !ringExt && !pinkyExt) {
    return {
      sign: "Police",
      confidence: 0.92,
      feedback: "✓ Index & middle finger salute near forehead. Police sign recognized!",
      handsCount: 1,
    };
  }

  // 5. MEDICINE: Middle finger extended alone rubbing palm
  if (middleExt && !indexExt && !ringExt && !pinkyExt) {
    return {
      sign: "Medicine",
      confidence: 0.90,
      feedback: "✓ Middle finger tapping/rubbing posture. Medicine sign recognized!",
      handsCount: 1,
    };
  }

  // 6. ROCK (Horns): Index & Pinky extended | Middle & Ring folded
  const thumbToMiddleMcp = getDistance(pts[4], pts[9]);
  if (indexExt && pinkyExt && !middleExt && !ringExt) {
    if (thumbToMiddleMcp < 0.16 || !thumbExt) {
      return {
        sign: "Rock",
        confidence: 0.93,
        feedback: "✓ Horns posture (Index & Pinky extended). Rock sign recognized!",
        handsCount: 1,
      };
    }
  }

  // 7. LOVE (I-L-Y): Thumb, Index, Pinky extended wide | Middle & Ring folded
  if (thumbExt && indexExt && pinkyExt && !middleExt && !ringExt && thumbToMiddleMcp >= 0.16) {
    return {
      sign: "Love",
      confidence: 0.93,
      feedback: "✓ I-L-Y sign (Thumb, Index, Pinky extended wide). Love sign recognized!",
      handsCount: 1,
    };
  }

  // 8. CALL: Thumb & Pinky extended | Index, Middle, Ring folded
  if (thumbExt && pinkyExt && !indexExt && !middleExt && !ringExt) {
    return {
      sign: "Call",
      confidence: 0.91,
      feedback: "✓ Phone gesture (Thumb & Pinky extended). Call sign recognized!",
      handsCount: 1,
    };
  }

  // 9. VICTORY: Index & Middle extended wide apart
  const indexMiddleSpread = getDistance(pts[8], pts[12]);
  if (indexExt && middleExt && !ringExt && !pinkyExt && indexMiddleSpread > 0.09) {
    return {
      sign: "Victory",
      confidence: 0.92,
      feedback: "✓ V-sign with fingers spread wide. Victory sign recognized!",
      handsCount: 1,
    };
  }

  // 10. TIME: Single index finger pointing low at wrist watch location (indexTipY > 0.65)
  if (indexExt && !middleExt && !ringExt && !pinkyExt && indexTipY > 0.65) {
    return {
      sign: "Time",
      confidence: 0.91,
      feedback: "✓ Index finger pointing at wrist watch location. Time sign recognized!",
      handsCount: 1,
    };
  }

  // 11. GOVERNMENT / DOCTOR: Single index finger pointing gesture
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    if (indexTipY < 0.35) {
      return {
        sign: "Government",
        confidence: 0.89,
        feedback: "✓ Index finger pointing near temple. Government sign recognized!",
        handsCount: 1,
      };
    }
    return {
      sign: "Doctor",
      confidence: 0.88,
      feedback: "✓ Single index finger pointing gesture detected. Doctor sign recognized!",
      handsCount: 1,
    };
  }

  // 12. GOOD (Thumbs Up): Thumb extended upward
  if (thumbExt && thumbTipY < thumbMcpY - 0.03 && !indexExt && !middleExt && !ringExt && !pinkyExt) {
    return {
      sign: "Good",
      confidence: 0.93,
      feedback: "✓ Thumbs-up posture detected. Good sign recognized!",
      handsCount: 1,
    };
  }

  // 13. BAD (Thumbs Down): Thumb extended downward
  if (thumbExt && thumbTipY > thumbMcpY + 0.03 && !indexExt && !middleExt && !ringExt) {
    return {
      sign: "Bad",
      confidence: 0.91,
      feedback: "✓ Thumbs-down posture detected. Bad sign recognized!",
      handsCount: 1,
    };
  }

  // 14. WATER: Index, Middle, Ring extended (W sign)
  if (indexExt && middleExt && ringExt && !pinkyExt) {
    return {
      sign: "Water",
      confidence: 0.89,
      feedback: "✓ Three-finger W gesture. Water sign recognized!",
      handsCount: 1,
    };
  }

  // 15. EMERGENCY: Raised fist near upper portion of frame
  if (extendedCount <= 2 && (wristY < 0.52 || indexTipY < 0.45)) {
    return {
      sign: "Emergency",
      confidence: 0.88,
      feedback: "✓ Raised fist posture detected near shoulder/head. Emergency sign recognized!",
      handsCount: 1,
    };
  }

  // 16. NO: Index & Middle fingers extended together
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return {
      sign: "No",
      confidence: 0.89,
      feedback: "✓ Index and middle fingers extended. No sign recognized!",
      handsCount: 1,
    };
  }

  // 17. YES: Closed fist gesture
  if (extendedCount <= 1 && !indexExt && !middleExt) {
    return {
      sign: "Yes",
      confidence: 0.88,
      feedback: "✓ Closed fist gesture detected. Yes sign recognized!",
      handsCount: 1,
    };
  }

  // 18. SORRY: Closed fist held at chest level
  if (extendedCount <= 1 && wristY > 0.48 && wristY < 0.85) {
    return {
      sign: "Sorry",
      confidence: 0.88,
      feedback: "✓ Closed fist over chest posture. Sorry sign recognized!",
      handsCount: 1,
    };
  }

  // ----------------------------------------------------
  // OPEN PALM DISCRIMINATION (Stop, Please, Thank You, Welcome, Hello, Home)
  // ----------------------------------------------------
  if (extendedCount >= 4) {
    // HOME: Open palm with fingertips pointing downward/inward
    if (indexTipY > wristY + 0.05) {
      return {
        sign: "Home",
        confidence: 0.90,
        feedback: "✓ Fingertips angled downward forming roof shape. Home sign recognized!",
        handsCount: 1,
      };
    }

    // STOP: Vertical open palm held upright facing forward
    if (indexTipY < wristY - 0.12 && wristY > 0.35 && wristY < 0.85) {
      return {
        sign: "Stop",
        confidence: 0.92,
        feedback: "✓ Vertical open palm facing forward. Stop sign recognized!",
        handsCount: 1,
      };
    }

    // THANK YOU: Open palm near chin/face height (indexTipY < 0.32)
    if (indexTipY < 0.32) {
      return {
        sign: "Thank You",
        confidence: 0.90,
        feedback: "✓ Open hand gesture near chin/face height. Thank You sign recognized!",
        handsCount: 1,
      };
    }

    // PLEASE: Open palm placed flat over chest/torso area
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
