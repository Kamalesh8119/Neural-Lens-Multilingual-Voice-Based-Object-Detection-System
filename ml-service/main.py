from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from inference import run_inference

app = FastAPI(title="Neural Lens ML Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health(): return {"status":"ok","model":"yolov11"}

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg","image/png","image/webp","image/jpg"]:
        raise HTTPException(400, detail="Unsupported image type")
    return run_inference(await file.read())

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
