"""
ml/train_isl_classifier.py
--------------------------
Train a Multi-Layer Perceptron (MLP) Classifier on 63D normalized ISL landmark vectors.

Usage:
    python train_isl_classifier.py --dataset isl_landmarks.json --output_model model.json
"""

import json
import argparse
import numpy as np

try:
    from sklearn.neural_network import MLPClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, confusion_matrix
except ImportError:
    print("Dependencies required: pip install scikit-learn numpy")

VOCABULARY = [
    "Namaste", "Hello", "Thank You", "Help", 
    "Yes", "No", "Doctor", "Emergency"
]

def generate_synthetic_samples():
    """Generates deterministic synthetic landmark vectors for training baseline weights."""
    X = []
    y = []
    np.random.seed(42)

    for idx, label in enumerate(VOCABULARY):
        base_features = np.zeros(63)
        # Create distinct class feature signatures
        base_features[0:3] = [0.0, 0.0, 0.0]
        base_features[3:6] = [0.1 * (idx + 1), -0.2 * (idx + 1), 0.05]
        base_features[24:27] = [0.2, -0.5 * (idx % 3 + 1), 0.1]

        for _ in range(100):
            noise = np.random.normal(0, 0.02, 63)
            X.append(base_features + noise)
            y.append(label)

    return np.array(X), np.array(y)

def main():
    parser = argparse.ArgumentParser(description="Train ISL Landmark Classifier.")
    parser.add_argument("--dataset", type=str, default="isl_landmarks.json", help="Input JSON dataset path")
    parser.add_argument("--output_model", type=str, default="trained_isl_mlp.json", help="Export path")
    args = parser.parse_args()

    print("[INFO] Loading dataset...")
    try:
        with open(args.dataset, "r") as f:
            data = json.load(f)
        X = np.array([item["features"] for item in data])
        y = np.array([item["label"] for item in data])
    except Exception:
        print("[INFO] Dataset file not found. Training baseline model using synthetic feature vectors...")
        X, y = generate_synthetic_samples()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"[INFO] Training set: {X_train.shape[0]} samples | Test set: {X_test.shape[0]} samples")
    
    model = MLPClassifier(
        hidden_layer_sizes=(128, 64),
        max_iter=500,
        activation="relu",
        solver="adam",
        random_state=42
    )

    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"\n[RESULTS] Validation Accuracy: {accuracy * 100:.2f}%\n")

    y_pred = model.predict(X_test)
    print("Classification Report:")
    print(classification_report(y_test, y_pred))

    # Export weights for browser JS consumption
    export_dict = {
        "classes": model.classes_.tolist(),
        "coefs": [c.tolist() for c in model.coefs_],
        "intercepts": [i.tolist() for i in model.intercepts_],
        "accuracy": accuracy
    }

    with open(args.output_model, "w") as f:
        json.dump(export_dict, f, indent=2)

    print(f"[SUCCESS] Exported trained browser model -> {args.output_model}")

if __name__ == "__main__":
    main()
