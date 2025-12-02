# app/api/chat.py
from fastapi import APIRouter
from pydantic import BaseModel

from app.services.llm_service import generate_chat_reply, ChatResult

router = APIRouter()


class ChatRequest(BaseModel):
    user_id: str
    message: str


class ChatResponse(BaseModel):
    reply: str
    related_event_ids: list[int]


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    result: ChatResult = await generate_chat_reply(
        user_id=payload.user_id,
        message=payload.message,
    )
    return ChatResponse(
        reply=result.reply,
        related_event_ids=result.related_event_ids,
    )
