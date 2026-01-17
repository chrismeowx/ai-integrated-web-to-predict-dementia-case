from pydantic import BaseModel
from typing import List, Literal

class ExplainRequest(BaseModel):
    model: Literal["gemini", "mistral", "both"]
    predicted_class: str
    img_np: List[List[List[int]]]
    heatmap: List[List[float]]

class QuizExplainRequest(BaseModel):
    image_path: str
    true_label: str
    model: str
