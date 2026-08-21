"""
ml/extract_landmarks.py
-------------------------
Extract 21 3D hand landmarks using MediaPipe Hands and export normalized 63D feature vectors for model training.

Usage:
    python extract_landmarks.py --data_dir ./dataset --output_csv landmarks.csv
"""

import os
import argparse
import json
import numpy as np

try:
    import cv2
    import mediapipe as mp
except ImportError:
    print("Dependencies required: pip install opencv-python mediapipe numpy")

def normalize_landmarks(landmarks):
    """
    Normalizes 21 3D hand landmarks:
    1. Origin at wrist (landmark 0).
    2. Scaled by Euclidean distance between wrist and middle MCP (landmark 9).
    """
    landmarks = np.array(landmarks, dtype=np.float32)
    if landmarks.shape[0] < 21:
        return np.zeros((63,), dtype=np.float32)
    
    wrist = landmarks[0]
    middle_mcp = landmarks[9]
    scale = np.linalg.norm(middle_mcp - wrist)
    if scale == 0:
        scale = 1.0
        
    normalized = (landmarks - wrist) / scale
    return normalized.flatten()

def main():
    parser = argparse.ArgumentParser(description="Extract MediaPipe hand landmarks from ISL image dataset.")
    parser.add_argument("--data_dir", type=str, default="./dataset", help="Path to image dataset directory")
    parser.add_argument("--output_json", type=str, default="isl_landmarks.json", help="Output JSON dataset path")
    args = parser.parse_args()

    print(f"[INFO] Initializing MediaPipe Hands Extractor on dataset: {args.data_dir}")
    
    # MediaPipe setup
    mp_hands = mp.solutions.hands.Hands(
        static_image_mode=True,
        max_num_hands=2,
        min_detection_confidence=0.5
    )

    dataset = []

    if not os.path.exists(args.data_dir):
        print(f"[WARN] Dataset directory '{args.data_dir}' not found. Creating sample structure...")
        os.makedirs(args.data_dir, exist_ok=True)

    labels = [d for d in os.listdir(args.data_dir) if os.path.isdir(os.path.join(args.data_dir, d))]
    print(f"[INFO] Found {len(labels)} classes: {labels}")

    total_extracted = 0
    for label in labels:
        class_dir = os.path.join(args.data_dir, label)
        for img_name in os.listdir(class_dir):
            img_path = os.path.join(class_dir, img_name)
            img = cv2.imread(img_path)
            if img is None:
                continue
            
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = mp_hands.process(img_rgb)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    raw_pts = [[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark]
                    norm_features = normalize_landmarks(raw_pts)
                    dataset.append({
                        "label": label,
                        "features": norm_features.tolist()
                    })
                    total_extracted += 1

    with open(args.output_json, "w") as f:
        json.dump(dataset, f, indent=2)

    print(f"[SUCCESS] Extracted {total_extracted} landmark samples -> {args.output_json}")

if __name__ == "__main__":
    main()
