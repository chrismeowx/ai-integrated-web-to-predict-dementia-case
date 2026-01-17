from fastapi import APIRouter
from alzheimer.backend.schemas.request import ChatRequest
from services.gemini import ask_gemini
from services.mistral import ask_mistral

router = APIRouter()

@router.post("/chat")
def chat(req: ChatRequest):

    if req.model == "gemini":
        return {"model": "gemini", "response": ask_gemini(req.prompt)}

    if req.model == "mistral":
        return {"model": "mistral", "response": ask_mistral(req.prompt)}

    return {"error": "model not supported"}
