import io, time, os
from PIL import Image
import numpy as np

MODEL_PATH = os.getenv("MODEL_PATH", "models/best.pt")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.25"))
MIN_BOX_AREA_RATIO = float(os.getenv("MIN_BOX_AREA_RATIO", "0.025"))
model = None

def load_model():
    global model
    try:
        import torch
        # Fix PyTorch weights-only FutureWarning / error (torch >= 2.0)
        _orig_load = torch.load
        def _patched_load(*args, **kwargs):
            kwargs.setdefault('weights_only', False)
            return _orig_load(*args, **kwargs)
        torch.load = _patched_load

        from ultralytics import YOLO
        model = YOLO(MODEL_PATH)
        print(f"Model loaded: {MODEL_PATH}")
    except Exception as e:
        print(f"Model load failed, using mock: {e}")
        model = None

load_model()

def run_inference(image_bytes: bytes) -> dict:
    start = time.time()
    if model is None:
        return {"detectedObjects":[
            {"label":"person","confidence":0.94,"bbox":{"x":50,"y":30,"width":120,"height":280}},
            {"label":"car","confidence":0.87,"bbox":{"x":200,"y":180,"width":200,"height":130}}
        ],"objectCount":2,"processingTime":round((time.time()-start)*1000,2),"modelVersion":"yolov11-mock"}

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_area = max(1, image.width * image.height)
    results = model(np.array(image))
    objs = []
    for r in results:
        for box in r.boxes:
            x1,y1,x2,y2 = box.xyxy[0].tolist()
            confidence = float(box.conf[0])
            width = x2 - x1
            height = y2 - y1
            area_ratio = (width * height) / image_area
            if confidence < CONFIDENCE_THRESHOLD or area_ratio < MIN_BOX_AREA_RATIO:
                continue
            objs.append({"label":r.names[int(box.cls[0])],"confidence":round(confidence,4),
                "bbox":{"x":round(x1,2),"y":round(y1,2),"width":round(width,2),"height":round(height,2)}})
    return {"detectedObjects":objs,"objectCount":len(objs),"processingTime":round((time.time()-start)*1000,2),"modelVersion":"yolov11"}
