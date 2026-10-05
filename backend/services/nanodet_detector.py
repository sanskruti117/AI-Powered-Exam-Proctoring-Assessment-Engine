import os
import cv2
import numpy as np
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("nanodet_detector")

# COCO 80 Class Names
COCO_CLASSES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat", "traffic light",
    "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow",
    "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
    "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove", "skateboard", "surfboard",
    "tennis racket", "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch",
    "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote", "keyboard",
    "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase",
    "scissors", "teddy bear", "hair drier", "toothbrush"
]

# Prohibited item class names for exam proctoring
PROHIBITED_CLASSES = {"cell phone", "laptop", "book", "remote", "tv", "tablet", "keyboard", "mouse"}


class NanoDetDetector:
    def __init__(self, model_path: str, prob_threshold: float = 0.30, iou_threshold: float = 0.5):
        self.strides = (8, 16, 32, 64)
        self.image_shape = (416, 416)
        self.reg_max = 7
        self.prob_threshold = prob_threshold
        self.iou_threshold = iou_threshold
        self.project = np.arange(self.reg_max + 1)
        self.mean = np.array([103.53, 116.28, 123.675], dtype=np.float32).reshape(1, 1, 3)
        self.std = np.array([57.375, 57.12, 58.395], dtype=np.float32).reshape(1, 1, 3)

        self.net = cv2.dnn.readNet(model_path)
        self.anchors_mlvl = []
        for i in range(len(self.strides)):
            featmap_size = (int(self.image_shape[0] / self.strides[i]), int(self.image_shape[1] / self.strides[i]))
            stride = self.strides[i]
            feat_h, feat_w = featmap_size
            shift_x = np.arange(0, feat_w) * stride
            shift_y = np.arange(0, feat_h) * stride
            xv, yv = np.meshgrid(shift_x, shift_y)
            xv = xv.flatten()
            yv = yv.flatten()
            cx = xv + 0.5 * (stride - 1)
            cy = yv + 0.5 * (stride - 1)
            anchors = np.column_stack((cx, cy))
            self.anchors_mlvl.append(anchors)

    def pre_process(self, img: np.ndarray) -> np.ndarray:
        # Resize to (416, 416)
        resized = cv2.resize(img, self.image_shape)
        resized = resized.astype(np.float32)
        resized = (resized - self.mean) / self.std
        blob = cv2.dnn.blobFromImage(resized)
        return blob

    def detect(self, img: np.ndarray) -> List[Dict[str, Any]]:
        orig_h, orig_w = img.shape[:2]
        blob = self.pre_process(img)
        self.net.setInput(blob)
        outs = self.net.forward(self.net.getUnconnectedOutLayersNames())

        cls_scores, bbox_preds = outs[::2], outs[1::2]
        bboxes_mlvl = []
        scores_mlvl = []

        for stride, cls_score, bbox_pred, anchors in zip(self.strides, cls_scores, bbox_preds, self.anchors_mlvl):
            if cls_score.ndim == 3:
                cls_score = cls_score.squeeze(axis=0)
            if bbox_pred.ndim == 3:
                bbox_pred = bbox_pred.squeeze(axis=0)

            x_exp = np.exp(bbox_pred.reshape(-1, self.reg_max + 1))
            x_sum = np.sum(x_exp, axis=1, keepdims=True)
            bbox_pred = x_exp / x_sum
            bbox_pred = np.dot(bbox_pred, self.project).reshape(-1, 4)
            bbox_pred *= stride

            points = anchors
            distance = bbox_pred
            x1 = points[:, 0] - distance[:, 0]
            y1 = points[:, 1] - distance[:, 1]
            x2 = points[:, 0] + distance[:, 2]
            y2 = points[:, 1] + distance[:, 3]

            x1 = np.clip(x1, 0, self.image_shape[1])
            y1 = np.clip(y1, 0, self.image_shape[0])
            x2 = np.clip(x2, 0, self.image_shape[1])
            y2 = np.clip(y2, 0, self.image_shape[0])

            bboxes = np.column_stack([x1, y1, x2, y2])
            bboxes_mlvl.append(bboxes)
            scores_mlvl.append(cls_score)

        bboxes_mlvl = np.concatenate(bboxes_mlvl, axis=0)
        scores_mlvl = np.concatenate(scores_mlvl, axis=0)

        # Scale back to original image dimensions
        scale_x = orig_w / float(self.image_shape[1])
        scale_y = orig_h / float(self.image_shape[0])

        bboxes_scaled = bboxes_mlvl.copy()
        bboxes_scaled[:, 0] *= scale_x
        bboxes_scaled[:, 1] *= scale_y
        bboxes_scaled[:, 2] *= scale_x
        bboxes_scaled[:, 3] *= scale_y

        bboxes_wh = bboxes_scaled.copy()
        bboxes_wh[:, 2:4] = bboxes_wh[:, 2:4] - bboxes_wh[:, 0:2]
        class_ids = np.argmax(scores_mlvl, axis=1)
        confidences = np.max(scores_mlvl, axis=1)

        indices = cv2.dnn.NMSBoxes(
            bboxes_wh.tolist(),
            confidences.tolist(),
            self.prob_threshold,
            self.iou_threshold,
        )

        detections = []
        if len(indices) > 0:
            for idx in indices:
                i = int(idx) if isinstance(idx, (int, np.integer)) else int(idx[0])
                cls_id = int(class_ids[i])
                conf = float(confidences[i])
                box = bboxes_scaled[i]
                cls_name = COCO_CLASSES[cls_id] if 0 <= cls_id < len(COCO_CLASSES) else f"class_{cls_id}"

                detections.append({
                    "class": cls_name,
                    "confidence": round(conf, 2),
                    "box_pixel": [int(box[0]), int(box[1]), int(box[2]), int(box[3])],
                    "box_norm": [
                        round(max(0, box[0]) / orig_w, 4),
                        round(max(0, box[1]) / orig_h, 4),
                        round(min(orig_w, box[2]) / orig_w, 4),
                        round(min(orig_h, box[3]) / orig_h, 4),
                    ],
                })

        return detections
