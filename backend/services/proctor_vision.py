import os
import io
import re
import base64
import logging
from typing import Dict, Any, List, Optional

try:
    import numpy as np
except ImportError:
    np = None

try:
    from PIL import Image
except ImportError:
    Image = None

logger = logging.getLogger("proctor_vision")

# Global cached models
_yolo_model = None
_face_cascade = None
_yunet_detector = None


def get_face_cascades():
    """Initializes OpenCV Haar cascade face detectors (frontal and profile)."""
    global _face_cascade
    if _face_cascade is None:
        try:
            import cv2
            cascades = []
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            local_cascade_dir = os.path.join(base_dir, "models", "cascades")

            paths_to_check = [
                os.path.join(local_cascade_dir, "frontal.xml"),
                os.path.join(local_cascade_dir, "profile.xml"),
            ]
            if hasattr(cv2, "data") and hasattr(cv2.data, "haarcascades"):
                paths_to_check.append(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
                paths_to_check.append(cv2.data.haarcascades + "haarcascade_profileface.xml")

            for path in paths_to_check:
                if os.path.exists(path):
                    cas = cv2.CascadeClassifier(path)
                    if not cas.empty():
                        cascades.append(cas)
            _face_cascade = cascades
            logger.info(f"Loaded {len(cascades)} OpenCV face cascades.")
        except Exception as e:
            logger.warning(f"Failed to load OpenCV face cascade: {e}")
            _face_cascade = []
    return _face_cascade


def get_yunet_detector(width: int, height: int):
    """Initializes OpenCV YuNet Deep Learning Face Detector for instant, accurate face tracking."""
    global _yunet_detector
    try:
        import cv2
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(base_dir, "models", "yunet.onnx")
        if os.path.exists(model_path) and _yunet_detector is None:
            _yunet_detector = cv2.FaceDetectorYN.create(model_path, "", (width, height), 0.75, 0.3, 5000)
        if _yunet_detector is not None:
            _yunet_detector.setInputSize((width, height))
            return _yunet_detector
    except Exception as e:
        logger.warning(f"YuNet init warning: {e}")
    return None


def get_yolo_model():
    """Initializes Ultralytics YOLOv8 nano model for ultra-fast object & mobile device detection."""
    global _yolo_model
    if _yolo_model is None:
        try:
            from ultralytics import YOLO
            # Use yolov8n (nano ~6MB) for sub-15ms inference
            _yolo_model = YOLO("yolov8n.pt")
            logger.info("Ultralytics YOLOv8n initialized successfully.")
        except Exception as e:
            logger.warning(f"Ultralytics YOLOv8 loading note: {e}")
            _yolo_model = None
    return _yolo_model


def decode_image_to_numpy(data_uri_or_base64: str) -> Optional[Any]:
    """Decodes a base64 encoded image string or data URL into an RGB numpy array."""
    try:
        if "," in data_uri_or_base64:
            base64_str = data_uri_or_base64.split(",", 1)[1]
        else:
            base64_str = data_uri_or_base64

        image_bytes = base64.b64decode(base64_str)
        try:
            import cv2
            nparr = np.frombuffer(image_bytes, np.uint8)
            img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img_bgr is not None:
                # OpenCV YuNet, Haar and Ultralytics all expect OpenCV's BGR
                # channel order. Returning RGB silently degrades their results.
                return img_bgr
        except Exception:
            pass

        if Image is not None:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            return np.array(image)
        return None
    except Exception as e:
        logger.error(f"Error decoding base64 frame: {e}")
        return None


def analyze_proctor_frame(frame_base64: str) -> Dict[str, Any]:
    """
    Analyzes a student camera frame for proctoring anomalies:
    - Candidate Presence / Absence (Deep Neural Face Detection)
    - Prohibited Secondary Devices (Cell phone, tablet, laptop, book)
    - Multiple Persons in Camera Frame
    """
    img_np = decode_image_to_numpy(frame_base64)
    if img_np is None:
        return {
            "success": False,
            "error": "Failed to decode camera frame",
            "candidate_present": False,
            "face_count": 0,
            "person_count": 0,
            "prohibited_items": [],
            "hud_tags": ["⚠️ Frame Decode Error"],
            "bounding_boxes": [],
        }

    height, width = img_np.shape[:2]

    face_count = 0
    person_count = 0
    prohibited_items: List[Dict[str, Any]] = []
    bounding_boxes: List[Dict[str, Any]] = []

    face_detector_available = False
    gaze_deviated = False
    gaze_direction = "CENTERED"
    primary_yaw_ratio = 0.0
    primary_pitch_ratio = 0.0

    # 1. OpenCV YuNet deep neural network face detection & Gaze/Head-Pose Estimation
    try:
        import cv2
        yunet = get_yunet_detector(width, height)
        if yunet is not None:
            face_detector_available = True
            yunet.setInputSize((width, height))
            retval, faces = yunet.detect(img_np)
            if faces is not None:
                valid_faces = []
                for f in faces:
                    x, y, w, h = int(f[0]), int(f[1]), int(f[2]), int(f[3])
                    conf = float(f[14]) if len(f) > 14 else 0.95
                    aspect_ratio = w / max(h, 1)

                    # Basic sanity check (face must be reasonably sized and shaped)
                    if (
                        conf >= 0.45
                        and w >= (width * 0.04)
                        and h >= (height * 0.04)
                        and 0.35 <= aspect_ratio <= 2.2
                    ):
                        valid_faces.append(f)

                        # Extract Gaze & Head-Pose from 5 Facial Landmarks (Right eye, Left eye, Nose tip, Mouth right, Mouth left)
                        if len(f) >= 14:
                            landmarks = f[4:14].reshape(5, 2)
                            re, le, nose, mr, ml = landmarks
                            eye_mid_x = float((re[0] + le[0]) / 2.0)
                            eye_mid_y = float((re[1] + le[1]) / 2.0)
                            mouth_mid_y = float((mr[1] + ml[1]) / 2.0)

                            # Horizontal Yaw Ratio: Offset of nose from eye midpoint
                            yaw = (float(nose[0]) - eye_mid_x) / max(w * 0.4, 1.0)
                            # Vertical Pitch Ratio: Relative position of nose between eyes and mouth
                            vertical_span = max(mouth_mid_y - eye_mid_y, 1.0)
                            pitch = (float(nose[1]) - eye_mid_y) / vertical_span - 0.55

                            primary_yaw_ratio = round(yaw, 3)
                            primary_pitch_ratio = round(pitch, 3)

                            # Check gaze direction
                            if yaw < -0.25:
                                gaze_direction = "LEFT"
                                gaze_deviated = True
                            elif yaw > 0.25:
                                gaze_direction = "RIGHT"
                                gaze_deviated = True
                            elif pitch > 0.35:
                                gaze_direction = "DOWN"
                                gaze_deviated = True
                            elif pitch < -0.35:
                                gaze_direction = "UP"
                                gaze_deviated = True
                            else:
                                gaze_direction = "CENTERED"
                                gaze_deviated = False

                        gaze_label = f"Face ({gaze_direction})" if gaze_direction != "CENTERED" else "Candidate Face"
                        bounding_boxes.append({
                            "label": gaze_label,
                            "type": "FACE",
                            "confidence": round(conf, 2),
                            "box": [
                                round(max(0, x) / width, 4),
                                round(max(0, y) / height, 4),
                                round(min(width, x + w) / width, 4),
                                round(min(height, y + h) / height, 4),
                            ],
                        })
                face_count = len(valid_faces)
        else:
            cascades = get_face_cascades()
            if cascades:
                face_detector_available = True
                gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
                cascade_face_count = 0
                for cascade in cascades:
                    faces = cascade.detectMultiScale(
                        gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
                    )
                    cascade_face_count = max(cascade_face_count, len(faces))
                    for x, y, w, h in faces:
                        bounding_boxes.append({
                            "label": "Candidate Face",
                            "type": "FACE",
                            "confidence": 0.65,
                            "box": [
                                round(max(0, x) / width, 4),
                                round(max(0, y) / height, 4),
                                round(min(width, x + w) / width, 4),
                                round(min(height, y + h) / height, 4),
                            ],
                        })
                face_count = cascade_face_count
    except Exception as e:
        logger.warning(f"YuNet face detection warning: {e}")

    # 2. Ultralytics YOLOv8 Object & Device Detection
    yolo = get_yolo_model()
    object_detector_available = yolo is not None
    if yolo is not None:
        try:
            results = yolo.predict(source=img_np, conf=0.18, verbose=False)
            if results and len(results) > 0:
                boxes = results[0].boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    cls_name = results[0].names.get(cls_id, "").lower()
                    conf = float(box.conf[0])
                    coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2]

                    norm_box = [
                        round(coords[0] / width, 4),
                        round(coords[1] / height, 4),
                        round(coords[2] / width, 4),
                        round(coords[3] / height, 4),
                    ]

                    # Person detection
                    if cls_name == "person":
                        if conf >= 0.40:
                            person_count += 1
                            bounding_boxes.append({
                                "label": "Person",
                                "type": "PERSON",
                                "confidence": round(conf, 2),
                                "box": norm_box,
                            })
                    # Prohibited devices & materials
                    elif cls_name in ("cell phone", "phone", "remote", "laptop", "tv", "book", "tablet"):
                        if conf >= 0.20:
                            prohibited_items.append({
                                "class": cls_name,
                                "confidence": round(conf, 2),
                                "box": norm_box,
                            })
                            bounding_boxes.append({
                                "label": f"🚨 {cls_name.upper()} ({int(conf * 100)}%)",
                                "type": "PROHIBITED",
                                "confidence": round(conf, 2),
                                "box": norm_box,
                            })
        except Exception as yolo_err:
            logger.warning(f"YOLO inference warning: {yolo_err}")

    # Biological Ground Truth Candidate Presence Logic:
    candidate_present = (face_count >= 1) or (person_count >= 1)
    multiple_persons = (face_count > 1) or (person_count > 1)

    hud_tags: List[str] = []

    # Prohibited items alert
    for item in prohibited_items:
        hud_tags.append(f"🚨 {item['class'].upper()} ({int(item['confidence'] * 100)}%)")

    # Candidate presence & gaze tags
    if not candidate_present:
        hud_tags.append("⚠️ No Candidate Detected")
    elif multiple_persons:
        count = max(face_count, person_count)
        hud_tags.append(f"🚨 {count} Persons Detected")
    else:
        hud_tags.append("🟢 Candidate In Frame")
        if gaze_deviated:
            hud_tags.append(f"👀 Gaze Away ({gaze_direction})")
        else:
            hud_tags.append("🟢 Gaze Centered")

    return {
        "success": face_detector_available or object_detector_available,
        "face_detector_available": face_detector_available,
        "object_detector_available": object_detector_available,
        "candidate_present": candidate_present,
        "face_count": face_count,
        "person_count": person_count,
        "multiple_persons": multiple_persons,
        "gaze_deviated": gaze_deviated,
        "gaze_direction": gaze_direction,
        "yaw_ratio": primary_yaw_ratio,
        "pitch_ratio": primary_pitch_ratio,
        "prohibited_items": prohibited_items,
        "hud_tags": hud_tags,
        "bounding_boxes": bounding_boxes,
    }

