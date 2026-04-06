"""Pydantic schemas for chat message endpoints."""
from datetime import datetime

from typing import Optional

from pydantic import BaseModel, Field


class CreateMessageRequest(BaseModel):
	"""Request body for creating a chat message."""

	chat_id: str = Field(..., min_length=1)
	user_id: str = Field(..., min_length=1)
	role: str = Field(..., pattern="^(user|assistant)$")
	content: str = Field(..., min_length=1)


class MessageResponse(BaseModel):
	"""Response model returned when listing or creating messages."""

	id: str
	chat_id: str
	user_id: str
	role: str
	content: str
	created_at: datetime


class SendMessageRequest(BaseModel):
	"""Request body for sending a chat message and receiving a reply."""

	chat_id: str = Field(..., min_length=1)
	user_id: str = Field(..., min_length=1)
	content: str = Field(..., min_length=1)
	
	# Optional fields for stop handling (Phase 2)
	# stopped: indicates if user stopped rendering mid-way
	# stop_index: character index where rendering was stopped
	stopped: Optional[bool] = Field(default=False)
	stop_index: Optional[int] = Field(default=None)
