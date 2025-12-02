# app/services/llm_service.py

from __future__ import annotations

import math
from typing import List

from pydantic import BaseModel
from sqlalchemy.orm import Session

from openai import OpenAI

from app.core.config import settings
from app.db.database import SessionLocal

from app.entity.seoul_event_entity import SeoulEvent


# ---------- 외부 API 클라이언트 설정 ----------

# Upstage는 OpenAI 호환 클라이언트로 호출
client = OpenAI(
    api_key=settings.UPSTAGE_API_KEY,
    base_url="https://api.upstage.ai/v1",
)


# ---------- 응답 모델 ----------

class ChatResult(BaseModel):
    reply: str
    related_event_ids: List[int]


# ---------- 유틸 함수들 ----------

def _cosine_sim(a: List[float], b: List[float]) -> float:
    """코사인 유사도 계산."""
    dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b):
        dot += x * y
        na += x * x
        nb += y * y
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (math.sqrt(na) * math.sqrt(nb))


def _get_query_embedding(text: str) -> List[float]:
    """유저 질문을 solar-embedding-1-large-query 로 임베딩."""
    resp = client.embeddings.create(
        model="solar-embedding-1-large-query",
        input=text,
    )
    return resp.data[0].embedding


def _search_similar_events(
    db: Session, query_embedding: List[float], top_k: int = 3
) -> List[SeoulEvent]:
    """
    SeoulEvent 테이블 전체에서 embedding 이 있는 행만 가져와
    파이썬에서 코사인 유사도 계산 후 상위 top_k 리턴.
    """
    query = db.query(SeoulEvent)
    if hasattr(SeoulEvent, "embedding"):
        query = query.filter(SeoulEvent.embedding.isnot(None))

    events: List[SeoulEvent] = query.all()

    scored: List[tuple[float, SeoulEvent]] = []
    for ev in events:
        emb = getattr(ev, "embedding", None)
        if emb is None:
            continue
        # pgvector가 numpy array나 다른 시퀀스로 올 수 있어 리스트로 강제 변환
        emb_list = list(emb)
        sim = _cosine_sim(query_embedding, emb)
        scored.append((sim, ev))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [ev for _, ev in scored[:top_k]]


SYSTEM_PROMPT = """
당신은 서울시 축제·문화행사를 추천해주는 챗봇이다.
사용자의 질문과 주어진 행사 정보만을 근거로,
사용자에게 어울릴 만한 행사 1~3개를 한국어로 추천한다.

항상 다음을 지켜라.
- 행사 이름, 장소, 기간(또는 날짜)을 구체적으로 말한다.
- 왜 이 사용자의 질문과 잘 맞는지 한두 문장으로 이유를 설명한다.
- 제공되지 않은 정보는 지어내지 않는다.
- 서울시 축제/행사와 관련 없는 내용은 답변하지 않는다.
"""


def _build_context_from_events(events: List[SeoulEvent]) -> str:
    """LLM에 넘길 '행사 목록 컨텍스트' 문자열 생성."""
    lines: List[str] = []
    for ev in events:
        title = getattr(ev, "title", "") or getattr(ev, "event_title", "")
        place = getattr(ev, "place", "") or getattr(ev, "place_name", "")
        start = getattr(ev, "start_date", "") or getattr(ev, "event_start", "") or getattr(ev, "pro_start", "")
        end = getattr(ev, "end_date", "") or getattr(ev, "event_end", "") or getattr(ev, "pro_end", "")
        codename = getattr(ev, "codename", "") or getattr(ev, "category", "")

        lines.append(
            f"- id={ev.id}, 제목: {title}, 장소: {place}, 기간: {start} ~ {end}, 분류: {codename}"
        )

    if not lines:
        return "현재 추천 가능한 행사가 없습니다."

    return "\n".join(lines)


def _call_solar_chat(user_message: str, context: str) -> str:
    """Solar-Pro로 실제 답변 생성."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                "다음은 사용자의 질문과, 추천 후보로 사용할 서울시 축제/행사 목록이다.\n\n"
                f"[사용자 질문]\n{user_message}\n\n"
                f"[행사 목록]\n{context}\n\n"
                "위 행사 정보만을 이용해서, 사용자에게 어울리는 행사 1~3개를 추천하는 답변을 만들어라."
            ),
        },
    ]

    resp = client.chat.completions.create(
        model="solar-pro",
        messages=messages,
        temperature=0.3,
    )
    return resp.choices[0].message.content


# ---------- 메인 진입 함수 ----------

async def generate_chat_reply(user_id: str, message: str) -> ChatResult:
    """
    /api/chat 에서 호출하는 메인 함수.
    """
    db: Session = SessionLocal()
    try:
        # 1. 유저 질문 임베딩
        query_emb = _get_query_embedding(message)

        # 2. 임베딩 기반 유사 축제 검색
        events = _search_similar_events(db, query_emb, top_k=3)

        if not events:
            return ChatResult(
                reply="지금 질문에 딱 맞는 축제를 찾지 못했어요. 날짜나 지역, 축제 종류를 조금 더 구체적으로 알려주실 수 있을까요?",
                related_event_ids=[],
            )

        # 3. LLM 컨텍스트 구성
        context = _build_context_from_events(events)

        # 4. Solar-Pro 호출
        try:
            reply_text = _call_solar_chat(message, context)
        except Exception:
            fallback_lines = []
            for ev in events:
                title = getattr(ev, "title", "") or getattr(ev, "event_title", "")
                place = getattr(ev, "place", "") or getattr(ev, "place_name", "")
                start = getattr(ev, "start_date", "") or getattr(ev, "event_start", "") or getattr(ev, "pro_start", "")
                end = getattr(ev, "end_date", "") or getattr(ev, "event_end", "") or getattr(ev, "pro_end", "")
                fallback_lines.append(f"- {title} ({start} ~ {end}, 장소: {place})")

            reply_text = (
                "추천 엔진에서 약간의 오류가 있어 LLM 생성 대신 기본 추천만 안내드려요.\n"
                "지금 질문과 가장 비슷한 축제들은 다음과 같습니다:\n" +
                "\n".join(fallback_lines)
            )

        return ChatResult(
            reply=reply_text,
            related_event_ids=[int(ev.id) for ev in events],
        )

    finally:
        db.close()
