from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from PIL import Image
import numpy as np
import io

from schemas.request import ExplainRequest, QuizExplainRequest
from services.gemini import explanation_result
from services.mistral import explanation_result_mistral
from model.gradcam import predict_image_with_gradcam, generate_gradcam_base64

BASE_DIR = Path(__file__).resolve().parent
MRI_DIR = BASE_DIR / "data" / "mri"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/guess")
async def guess(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image file")

    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    predicted_class, heatmap, img_np = predict_image_with_gradcam(image)
    gradcam_b64 = generate_gradcam_base64(img_np, heatmap)

    return {
        "predicted_class": predicted_class,
        "gradcam": gradcam_b64,
        "img_np": img_np.tolist(),
        "heatmap": heatmap.tolist()
    }

@app.post("/explain")
def explain(req: ExplainRequest):
    img_np = np.array(req.img_np, dtype=np.uint8)
    heatmap = np.array(req.heatmap, dtype=np.float32)

    result = {}

    if req.model in ["gemini", "both"]:
        result["gemini"] = explanation_result(
            img_np=img_np,
            heatmap=heatmap,
            predicted_class=req.predicted_class
        )

    if req.model in ["mistral", "both"]:
        result["mistral"] = explanation_result_mistral(
            img_np=img_np,
            heatmap=heatmap,
            predicted_class=req.predicted_class
        )

    return result


@app.post("/quiz-explain")
def quiz_explain(req: QuizExplainRequest):
    image_path = MRI_DIR / req.image_path

    if not image_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Image not found: {image_path}"
        )

    image = Image.open(image_path).convert("RGB")

    _, heatmap, img_np = predict_image_with_gradcam(image)
    gradcam_b64 = generate_gradcam_base64(img_np, heatmap)

    predicted_class = req.true_label

    explanation = explanation_result(
        img_np=img_np,
        heatmap=heatmap,
        predicted_class=predicted_class
    )

    return {
        "gradcam": gradcam_b64,
        "explanation": explanation
    }
