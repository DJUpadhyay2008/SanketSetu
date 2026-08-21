# Sanket Live — ISL Machine Learning Pipeline

This directory contains the reproducible computer vision & machine learning pipeline for **Sanket Live**.

## Architecture & Data Flow

```
Camera Stream (Browser)
   ↓
MediaPipe Hand Landmarker WASM (21 x 3D Hand Joints)
   ↓
Landmark Normalization (Origin @ Wrist, Scale Invariant)
   ↓
63-Dimensional Feature Vector
   ↓
ISL Deterministic & MLP Classifier Layer
   ↓
Sliding Window Stability Filter (5/7 Frame Consensus)
   ↓
Sanket Live UI (Learning Practice Mode / Communication Mode)
```

## Pipeline Scripts

1. **`extract_landmarks.py`**:
   - Takes input dataset images/videos of ISL signs.
   - Extracts 21 MediaPipe hand landmarks.
   - Translates landmarks relative to Wrist (Landmark 0) and scales by wrist-to-middle-MCP distance.
   - Exports 63D normalized vectors to `isl_landmarks.json`.

2. **`train_isl_classifier.py`**:
   - Trains an MLP Neural Network (128 -> 64 architecture with ReLU activation).
   - Computes validation accuracy and confusion matrix.
   - Exports model coefficients to JSON format.

## Supported Vocabulary (MVP)
- `Namaste` (Greeting / Respect)
- `Hello` (Greeting)
- `Thank You` (Expression)
- `Help` (Request)
- `Yes` (Affirmation)
- `No` (Negation)
- `Doctor` (Healthcare)
- `Emergency` (Urgent)

## Privacy Guarantee
All model evaluation and inference happen **100% locally inside the client's browser**. No camera video streams or raw frames are stored or transmitted over any network.
