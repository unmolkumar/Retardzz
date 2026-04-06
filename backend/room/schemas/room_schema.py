"""Pydantic schemas for Room request and response validation."""
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List

class RoomCreateRequest(BaseModel):
	name: str = Field(..., min_length=1, max_length=100)
	description: str = Field(default="", max_length=500)

class RoomJoinRequest(BaseModel):
	invite_code: str = Field(..., min_length=4)

class RoomJoinRequestResponse(BaseModel):
	message: str
	room_id: str
	room_name: str
	status: str

class RoomInviteRequest(BaseModel):
	target_username: str = Field(..., min_length=1)

class RoomRemoveMemberRequest(BaseModel):
	target_username: str = Field(..., min_length=1)

class RoomResponse(BaseModel):
	id: str
	name: str
	description: str
	admin_username: str
	invite_code: str
	created_at: datetime

	model_config = ConfigDict(from_attributes=True)

class RoomListResponse(BaseModel):
	rooms: List[RoomResponse]

class RoomActionResponse(BaseModel):
	message: str

class RoomInvitationResponse(BaseModel):
	id: str
	room_id: str
	room_name: str
	inviter_username: str
	status: str
	created_at: datetime

	model_config = ConfigDict(from_attributes=True)

class RoomInvitationListResponse(BaseModel):
	invitations: List[RoomInvitationResponse]


class RoomSentInvitationResponse(BaseModel):
	id: str
	room_id: str
	room_name: str
	target_username: str
	status: str
	created_at: datetime
	responded_at: Optional[datetime] = None

	model_config = ConfigDict(from_attributes=True)


class RoomSentInvitationListResponse(BaseModel):
	invitations: List[RoomSentInvitationResponse]

class RoomJoinApprovalResponse(BaseModel):
	id: str
	room_id: str
	room_name: str
	requester_username: str
	status: str
	created_at: datetime

	model_config = ConfigDict(from_attributes=True)

class RoomJoinApprovalListResponse(BaseModel):
	requests: List[RoomJoinApprovalResponse]

class RoomJoinRequestStatusResponse(BaseModel):
	id: str
	room_id: str
	room_name: str
	status: str
	created_at: datetime
	reviewed_at: Optional[datetime] = None
	reviewed_by: Optional[str] = None

	model_config = ConfigDict(from_attributes=True)

class RoomJoinRequestStatusListResponse(BaseModel):
	requests: List[RoomJoinRequestStatusResponse]


class RoomStudyStartRequest(BaseModel):
	mode_key: str = Field(default="focus60", min_length=1, max_length=30)
	duration_seconds: int = Field(default=3600, ge=60, le=14400)


class RoomStudyMemberResponse(BaseModel):
	username: str
	total_seconds: int
	is_live: bool
	is_online: bool = False
	date_key: str
	started_at: Optional[datetime] = None
	active_mode_key: Optional[str] = None
	active_target_seconds: Optional[int] = None
	last_seen_at: Optional[datetime] = None
	updated_at: Optional[datetime] = None

	model_config = ConfigDict(from_attributes=True)


class RoomStudyStatsResponse(BaseModel):
	members: List[RoomStudyMemberResponse]
	live_count: int
	date_key: str


class RoomStudyActionResponse(BaseModel):
	message: str
	total_seconds: int
	is_live: bool
	date_key: str


class RoomHubQuoteResponse(BaseModel):
	quote: str
	source: str
	generated_at: datetime

class LeaveRoomResponse(BaseModel):
	message: str
	room_deleted: bool = False
	new_admin_username: Optional[str] = None
