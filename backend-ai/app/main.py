from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ChatRequest(BaseModel):
    userId: str
    message: str
    context: str

@app.post("/api/ai/chat")
async def chat(req: ChatRequest):
    # Member 1: AI Logic implementation goes here
    return {"reply": f"AI Tutor received: {req.message}"}

