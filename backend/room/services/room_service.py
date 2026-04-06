from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from fastapi import HTTPException

from app.database import get_database
from ..models import Room, RoomInvitation, RoomJoinRequest, RoomMember, RoomMessage, RoomStudyStat

# Collections
ROOM_COLLECTION = "study_rooms"
MEMBER_COLLECTION = "study_room_members"
MESSAGE_COLLECTION = "study_room_messages"
INVITATION_COLLECTION = "study_room_invitations"
JOIN_REQUEST_COLLECTION = "study_room_join_requests"
STUDY_STATS_COLLECTION = "study_room_study_stats"
USER_COLLECTION = "users"

# Status values
STATUS_PENDING = "pending"
STATUS_ACCEPTED = "accepted"
STATUS_REJECTED = "rejected"
STATUS_APPROVED = "approved"

# Study timer values
VALID_STUDY_MODES = {"focus", "short", "long"}
DEFAULT_STUDY_MODE = "focus"
MIN_STUDY_DURATION_SECONDS = 60
MAX_STUDY_DURATION_SECONDS = 14400
DEFAULT_STUDY_DURATION_SECONDS = 1500


def _utcnow() -> datetime:
	return datetime.now(timezone.utc)


async def _get_db():
	return get_database()


def _to_object_id(value: str, label: str = "id") -> ObjectId:
	if not ObjectId.is_valid(value):
		raise HTTPException(status_code=400, detail=f"Invalid {label}")
	return ObjectId(value)


def _safe_elapsed_seconds(started_at: datetime, now: datetime) -> int:
	if not started_at:
		return 0
	if started_at.tzinfo is None:
		started_at = started_at.replace(tzinfo=timezone.utc)
	return max(0, int((now - started_at).total_seconds()))


def _today_key(now: Optional[datetime] = None) -> str:
	current = now or _utcnow()
	return current.date().isoformat()


def _normalize_mode_key(mode_key: Optional[str]) -> str:
	value = (mode_key or DEFAULT_STUDY_MODE).strip().lower()
	if value not in VALID_STUDY_MODES:
		raise HTTPException(status_code=400, detail="Invalid study mode")
	return value


def _normalize_duration_seconds(duration_seconds: Optional[int]) -> int:
	if duration_seconds is None:
		return DEFAULT_STUDY_DURATION_SECONDS
	value = int(duration_seconds)
	if value < MIN_STUDY_DURATION_SECONDS or value > MAX_STUDY_DURATION_SECONDS:
		raise HTTPException(status_code=400, detail="Invalid study duration")
	return value


def _stats_doc_date_key(stats_doc: dict, now: datetime) -> str:
	return str(stats_doc.get("date_key") or _today_key(now))


def _effective_elapsed_seconds(stats_doc: dict, now: datetime) -> int:
	started_at = stats_doc.get("started_at")
	if not isinstance(started_at, datetime):
		return 0
	elapsed = _safe_elapsed_seconds(started_at, now)
	target = stats_doc.get("active_target_seconds")
	if isinstance(target, int) and target > 0:
		return min(elapsed, target)
	return elapsed


async def _finalize_live_study_doc(study_stats_coll, stats_doc: dict, now: datetime) -> dict:
	elapsed = _effective_elapsed_seconds(stats_doc, now)
	new_total = int(stats_doc.get("total_seconds", 0)) + elapsed
	date_key = _stats_doc_date_key(stats_doc, now)

	await study_stats_coll.update_one(
		{"_id": stats_doc["_id"]},
		{
			"$set": {
				"total_seconds": new_total,
				"is_live": False,
				"started_at": None,
				"active_mode_key": None,
				"active_target_seconds": None,
				"updated_at": now,
				"date_key": date_key,
			}
		},
	)

	stats_doc["total_seconds"] = new_total
	stats_doc["is_live"] = False
	stats_doc["started_at"] = None
	stats_doc["active_mode_key"] = None
	stats_doc["active_target_seconds"] = None
	stats_doc["updated_at"] = now
	stats_doc["date_key"] = date_key
	return stats_doc


async def _discard_other_live_sessions(study_stats_coll, username: str, now: datetime):
	live_docs = await study_stats_coll.find({"username": username, "is_live": True}).to_list(length=50)
	for live_doc in live_docs:
		await _finalize_live_study_doc(study_stats_coll, live_doc, now)


def generate_invite_code(length: int = 8) -> str:
	import secrets
	import string

	return "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))


async def _get_room_doc_or_404(rooms_coll, room_id: str) -> dict:
	room_doc = await rooms_coll.find_one({"_id": _to_object_id(room_id, "room id")})
	if not room_doc:
		raise HTTPException(status_code=404, detail="Room not found")
	return room_doc


async def _get_member_doc(members_coll, room_id: str, username: str) -> dict:
	member_doc = await members_coll.find_one({"room_id": room_id, "username": username})
	if not member_doc:
		raise HTTPException(status_code=403, detail="You are not a member of this room")
	return member_doc


async def _require_admin(room_doc: dict, member_doc: dict, username: str):
	if room_doc.get("admin_username") != username or member_doc.get("role") != "admin":
		raise HTTPException(status_code=403, detail="Only room admin can perform this action")


async def create_room(name: str, description: str, admin_username: str) -> dict:
	db = await _get_db()
	rooms_coll = db[ROOM_COLLECTION]
	members_coll = db[MEMBER_COLLECTION]

	invite_code = generate_invite_code()

	new_room = Room.create(
		name=name,
		description=description,
		admin_username=admin_username,
		invite_code=invite_code,
	)

	room_doc = new_room.to_document()
	result = await rooms_coll.insert_one(room_doc)
	room_id = str(result.inserted_id)

	new_member = RoomMember.create(room_id=room_id, username=admin_username, role="admin")
	await members_coll.insert_one(new_member.to_document())

	return await get_room_by_id(room_id)


async def join_room_by_code(invite_code: str, username: str) -> dict:
	db = await _get_db()
	rooms_coll = db[ROOM_COLLECTION]
	members_coll = db[MEMBER_COLLECTION]
	join_requests_coll = db[JOIN_REQUEST_COLLECTION]

	room_doc = await rooms_coll.find_one({"invite_code": invite_code})
	if not room_doc:
		raise HTTPException(status_code=404, detail="Room not found by invite code")

	room_id = str(room_doc["_id"])
	room_name = room_doc.get("name", "Room")

	existing_member = await members_coll.find_one({"room_id": room_id, "username": username})
	if existing_member:
		return {
			"message": "You are already a member of this room.",
			"room_id": room_id,
			"room_name": room_name,
			"status": "already-member",
		}

	existing_request = await join_requests_coll.find_one(
		{"room_id": room_id, "requester_username": username, "status": STATUS_PENDING}
	)
	if existing_request:
		return {
			"message": "Join request already pending admin approval.",
			"room_id": room_id,
			"room_name": room_name,
			"status": STATUS_PENDING,
		}

	join_request = RoomJoinRequest.create(room_id=room_id, requester_username=username)
	await join_requests_coll.insert_one(join_request.to_document())

	return {
		"message": "Join request sent. Wait for admin approval.",
		"room_id": room_id,
		"room_name": room_name,
		"status": STATUS_PENDING,
	}


async def invite_user_by_username(room_id: str, inviter_username: str, target_username: str) -> dict:
	db = await _get_db()
	members_coll = db[MEMBER_COLLECTION]
	rooms_coll = db[ROOM_COLLECTION]
	invitations_coll = db[INVITATION_COLLECTION]

	room_doc = await _get_room_doc_or_404(rooms_coll, room_id)
	inviter_member = await _get_member_doc(members_coll, room_id, inviter_username)
	await _require_admin(room_doc, inviter_member, inviter_username)

	if inviter_username == target_username:
		raise HTTPException(status_code=400, detail="Admin cannot invite themselves")

	existing_member = await members_coll.find_one({"room_id": room_id, "username": target_username})
	if existing_member:
		raise HTTPException(status_code=400, detail="User is already in this room")

	pending_invite = await invitations_coll.find_one(
		{"room_id": room_id, "target_username": target_username, "status": STATUS_PENDING}
	)
	if pending_invite:
		raise HTTPException(status_code=400, detail="Invitation already pending for this user")

	invitation = RoomInvitation.create(
		room_id=room_id,
		inviter_username=inviter_username,
		target_username=target_username,
	)
	await invitations_coll.insert_one(invitation.to_document())

	return {"message": f"Invitation sent to {target_username}."}


async def get_pending_invitations(username: str) -> List[dict]:
	db = await _get_db()
	invitations_coll = db[INVITATION_COLLECTION]
	rooms_coll = db[ROOM_COLLECTION]

	invitations = await invitations_coll.find(
		{"target_username": username, "status": STATUS_PENDING}
	).sort("created_at", -1).to_list(length=200)

	if not invitations:
		return []

	room_ids = [
		_to_object_id(doc["room_id"], "room id")
		for doc in invitations
		if ObjectId.is_valid(doc.get("room_id", ""))
	]
	room_docs = await rooms_coll.find({"_id": {"$in": room_ids}}).to_list(length=200)
	room_map = {str(doc["_id"]): doc.get("name", "Room") for doc in room_docs}

	result = []
	for invitation in invitations:
		formatted = _format_invitation_doc(invitation)
		formatted["room_name"] = room_map.get(formatted["room_id"], "Room")
		result.append(formatted)

	return result


async def accept_invitation(invitation_id: str, username: str) -> dict:
	db = await _get_db()
	invitations_coll = db[INVITATION_COLLECTION]
	members_coll = db[MEMBER_COLLECTION]
	rooms_coll = db[ROOM_COLLECTION]
	join_requests_coll = db[JOIN_REQUEST_COLLECTION]

	invitation_doc = await invitations_coll.find_one(
		{"_id": _to_object_id(invitation_id, "invitation id"), "target_username": username}
	)
	if not invitation_doc:
		raise HTTPException(status_code=404, detail="Invitation not found")

	if invitation_doc.get("status") != STATUS_PENDING:
		raise HTTPException(status_code=400, detail="Invitation is no longer pending")

	room_id = invitation_doc["room_id"]
	room_doc = await _get_room_doc_or_404(rooms_coll, room_id)

	existing_member = await members_coll.find_one({"room_id": room_id, "username": username})
	if not existing_member:
		member = RoomMember.create(room_id=room_id, username=username, role="member")
		await members_coll.insert_one(member.to_document())

	await invitations_coll.update_one(
		{"_id": invitation_doc["_id"]},
		{"$set": {"status": STATUS_ACCEPTED, "responded_at": _utcnow()}},
	)

	await join_requests_coll.update_many(
		{"room_id": room_id, "requester_username": username, "status": STATUS_PENDING},
		{"$set": {"status": STATUS_REJECTED, "reviewed_at": _utcnow(), "reviewed_by": "invitation-accepted"}},
	)

	return {"message": f"Invitation accepted. You joined {room_doc.get('name', 'room')}."}


async def reject_invitation(invitation_id: str, username: str) -> dict:
	db = await _get_db()
	invitations_coll = db[INVITATION_COLLECTION]

	invitation_doc = await invitations_coll.find_one(
		{"_id": _to_object_id(invitation_id, "invitation id"), "target_username": username}
	)
	if not invitation_doc:
		raise HTTPException(status_code=404, detail="Invitation not found")

	if invitation_doc.get("status") != STATUS_PENDING:
		raise HTTPException(status_code=400, detail="Invitation is no longer pending")

	await invitations_coll.update_one(
		{"_id": invitation_doc["_id"]},
		{"$set": {"status": STATUS_REJECTED, "responded_at": _utcnow()}},
	)

	return {"message": "Invitation rejected."}


async def get_join_requests(room_id: str, admin_username: str) -> List[dict]:
	db = await _get_db()
	rooms_coll = db[ROOM_COLLECTION]
	members_coll = db[MEMBER_COLLECTION]
	join_requests_coll = db[JOIN_REQUEST_COLLECTION]

	room_doc = await _get_room_doc_or_404(rooms_coll, room_id)
	admin_member_doc = await _get_member_doc(members_coll, room_id, admin_username)
	await _require_admin(room_doc, admin_member_doc, admin_username)

	join_requests = await join_requests_coll.find(
		{"room_id": room_id, "status": STATUS_PENDING}
	).sort("created_at", -1).to_list(length=200)

	result = []
	for request_doc in join_requests:
		formatted = _format_join_request_doc(request_doc)
		formatted["room_name"] = room_doc.get("name", "Room")
		result.append(formatted)

	return result


async def get_my_join_request_statuses(username: str) -> List[dict]:
	db = await _get_db()
	join_requests_coll = db[JOIN_REQUEST_COLLECTION]
	rooms_coll = db[ROOM_COLLECTION]

	request_docs = await join_requests_coll.find(
		{"requester_username": username}
	).sort("created_at", -1).to_list(length=200)

	if not request_docs:
		return []

	room_ids = [
		_to_object_id(doc["room_id"], "room id")
		for doc in request_docs
		if ObjectId.is_valid(doc.get("room_id", ""))
	]
	room_docs = await rooms_coll.find({"_id": {"$in": room_ids}}).to_list(length=200)
	room_map = {str(doc["_id"]): doc.get("name", "Room") for doc in room_docs}

	result = []
	for request_doc in request_docs:
		formatted = _format_join_request_doc(request_doc)
		formatted["room_name"] = room_map.get(formatted["room_id"], "Room")
		result.append(formatted)

	return result


async def approve_join_request(room_id: str, request_id: str, admin_username: str) -> dict:
	db = await _get_db()
	rooms_coll = db[ROOM_COLLECTION]
	members_coll = db[MEMBER_COLLECTION]
	join_requests_coll = db[JOIN_REQUEST_COLLECTION]
	invitations_coll = db[INVITATION_COLLECTION]

	room_doc = await _get_room_doc_or_404(rooms_coll, room_id)
	admin_member_doc = await _get_member_doc(members_coll, room_id, admin_username)
	await _require_admin(room_doc, admin_member_doc, admin_username)

	request_doc = await join_requests_coll.find_one(
		{"_id": _to_object_id(request_id, "join request id"), "room_id": room_id}
	)
	if not request_doc:
		raise HTTPException(status_code=404, detail="Join request not found")

	if request_doc.get("status") != STATUS_PENDING:
		raise HTTPException(status_code=400, detail="Join request is no longer pending")

	requester_username = request_doc["requester_username"]
	existing_member = await members_coll.find_one({"room_id": room_id, "username": requester_username})
	if not existing_member:
		new_member = RoomMember.create(room_id=room_id, username=requester_username, role="member")
		await members_coll.insert_one(new_member.to_document())

	await join_requests_coll.update_one(
		{"_id": request_doc["_id"]},
		{"$set": {"status": STATUS_APPROVED, "reviewed_at": _utcnow(), "reviewed_by": admin_username}},
	)

	await invitations_coll.update_many(
		{"room_id": room_id, "target_username": requester_username, "status": STATUS_PENDING},
		{"$set": {"status": STATUS_REJECTED, "responded_at": _utcnow()}},
	)

	return {"message": f"Approved join request for {requester_username}."}


async def reject_join_request(room_id: str, request_id: str, admin_username: str) -> dict:
	db = await _get_db()
	rooms_coll = db[ROOM_COLLECTION]
	members_coll = db[MEMBER_COLLECTION]
	join_requests_coll = db[JOIN_REQUEST_COLLECTION]

	room_doc = await _get_room_doc_or_404(rooms_coll, room_id)
	admin_member_doc = await _get_member_doc(members_coll, room_id, admin_username)
	await _require_admin(room_doc, admin_member_doc, admin_username)

	request_doc = await join_requests_coll.find_one(
		{"_id": _to_object_id(request_id, "join request id"), "room_id": room_id}
	)
	if not request_doc:
		raise HTTPException(status_code=404, detail="Join request not found")

	if request_doc.get("status") != STATUS_PENDING:
		raise HTTPException(status_code=400, detail="Join request is no longer pending")

	await join_requests_coll.update_one(
		{"_id": request_doc["_id"]},
		{"$set": {"status": STATUS_REJECTED, "reviewed_at": _utcnow(), "reviewed_by": admin_username}},
	)

	return {"message": f"Rejected join request for {request_doc['requester_username']}."}


async def get_room_members(room_id: str, username: str) -> List[dict]:
	db = await _get_db()
	members_coll = db[MEMBER_COLLECTION]
	rooms_coll = db[ROOM_COLLECTION]

	await _get_room_doc_or_404(rooms_coll, room_id)
	await _get_member_doc(members_coll, room_id, username)

	member_docs = await members_coll.find({"room_id": room_id}).to_list(length=200)
	member_docs.sort(key=lambda item: (item.get("role") != "admin", item.get("joined_at")))
	return [_format_member_doc(doc) for doc in member_docs]


async def get_room_study_stats(room_id: str, username: str) -> dict:
	db = await _get_db()
	rooms_coll = db[ROOM_COLLECTION]
	members_coll = db[MEMBER_COLLECTION]
	study_stats_coll = db[STUDY_STATS_COLLECTION]

	await _get_room_doc_or_404(rooms_coll, room_id)
	await _get_member_doc(members_coll, room_id, username)

	now = _utcnow()
	today_key = _today_key(now)

	member_docs = await members_coll.find({"room_id": room_id}).to_list(length=300)
	member_usernames = [member_doc["username"] for member_doc in member_docs]

	stats_docs = await study_stats_coll.find(
		{"room_id": room_id, "date_key": today_key, "username": {"$in": member_usernames}}
	).to_list(length=300)
	stats_map = {stats_doc["username"]: stats_doc for stats_doc in stats_docs}

	result = []
	for member_doc in member_docs:
		member_username = member_doc["username"]
		stats_doc = stats_map.get(member_username)

		if not stats_doc:
			result.append(
				{
					"username": member_username,
					"total_seconds": 0,
					"is_live": False,
					"date_key": today_key,
					"started_at": None,
					"active_mode_key": None,
					"active_target_seconds": None,
					"updated_at": None,
				}
			)
			continue

		date_key = _stats_doc_date_key(stats_doc, now)
		is_live = bool(stats_doc.get("is_live", False))
		total_seconds = int(stats_doc.get("total_seconds", 0))
		started_at = stats_doc.get("started_at")

		if is_live:
			elapsed = _effective_elapsed_seconds(stats_doc, now)
			target = stats_doc.get("active_target_seconds")
			if isinstance(target, int) and target > 0 and elapsed >= target:
				stats_doc = await _finalize_live_study_doc(study_stats_coll, stats_doc, now)
				is_live = False
				total_seconds = int(stats_doc.get("total_seconds", 0))
				started_at = None
			else:
				total_seconds += elapsed

		result.append(
			{
				"username": member_username,
				"total_seconds": total_seconds,
				"is_live": is_live,
				"date_key": date_key,
				"started_at": started_at,
				"active_mode_key": stats_doc.get("active_mode_key"),
				"active_target_seconds": stats_doc.get("active_target_seconds"),
				"updated_at": stats_doc.get("updated_at"),
			}
		)

	result.sort(key=lambda item: (not item["is_live"], -item["total_seconds"], item["username"]))
	live_count = sum(1 for entry in result if entry["is_live"])

	return {"members": result, "live_count": live_count, "date_key": today_key}


async def start_study_session(
	room_id: str,
	username: str,
	mode_key: str = DEFAULT_STUDY_MODE,
	duration_seconds: int = DEFAULT_STUDY_DURATION_SECONDS,
) -> dict:
	db = await _get_db()
	rooms_coll = db[ROOM_COLLECTION]
	members_coll = db[MEMBER_COLLECTION]
	study_stats_coll = db[STUDY_STATS_COLLECTION]

	await _get_room_doc_or_404(rooms_coll, room_id)
	await _get_member_doc(members_coll, room_id, username)

	mode_value = _normalize_mode_key(mode_key)
	duration_value = _normalize_duration_seconds(duration_seconds)

	now = _utcnow()
	today_key = _today_key(now)

	await _discard_other_live_sessions(study_stats_coll, username, now)

	stats_doc = await study_stats_coll.find_one({"room_id": room_id, "username": username, "date_key": today_key})
	if not stats_doc:
		new_stats = RoomStudyStat.create(
			room_id=room_id,
			username=username,
			date_key=today_key,
			mode_key=mode_value,
			target_seconds=duration_value,
		)
		await study_stats_coll.insert_one(new_stats.to_document())
		return {
			"message": "Study session started.",
			"total_seconds": 0,
			"is_live": True,
			"date_key": today_key,
		}

	total_seconds = int(stats_doc.get("total_seconds", 0))
	if stats_doc.get("is_live"):
		stats_doc = await _finalize_live_study_doc(study_stats_coll, stats_doc, now)
		total_seconds = int(stats_doc.get("total_seconds", 0))

	await study_stats_coll.update_one(
		{"_id": stats_doc["_id"]},
		{
			"$set": {
				"is_live": True,
				"started_at": now,
				"active_mode_key": mode_value,
				"active_target_seconds": duration_value,
				"updated_at": now,
				"date_key": today_key,
			}
		},
	)

	return {
		"message": "Study session started.",
		"total_seconds": total_seconds,
		"is_live": True,
		"date_key": today_key,
	}


async def stop_study_session(room_id: str, username: str) -> dict:
	db = await _get_db()
	rooms_coll = db[ROOM_COLLECTION]
	members_coll = db[MEMBER_COLLECTION]
	study_stats_coll = db[STUDY_STATS_COLLECTION]

	await _get_room_doc_or_404(rooms_coll, room_id)
	await _get_member_doc(members_coll, room_id, username)

	now = _utcnow()
	today_key = _today_key(now)

	stats_doc = await study_stats_coll.find_one(
		{"room_id": room_id, "username": username, "is_live": True},
		sort=[("updated_at", -1)],
	)
	if not stats_doc:
		latest_doc = await study_stats_coll.find_one(
			{"room_id": room_id, "username": username, "date_key": today_key},
			sort=[("updated_at", -1)],
		)
		total_seconds = int((latest_doc or {}).get("total_seconds", 0))
		return {
			"message": "Study session already stopped.",
			"total_seconds": total_seconds,
			"is_live": False,
			"date_key": today_key,
		}

	final_doc = await _finalize_live_study_doc(study_stats_coll, stats_doc, now)
	return {
		"message": "Study session stopped.",
		"total_seconds": int(final_doc.get("total_seconds", 0)),
		"is_live": False,
		"date_key": _stats_doc_date_key(final_doc, now),
	}


async def remove_member_from_room(room_id: str, admin_username: str, target_username: str) -> dict:
	db = await _get_db()
	members_coll = db[MEMBER_COLLECTION]
	rooms_coll = db[ROOM_COLLECTION]
	invitations_coll = db[INVITATION_COLLECTION]
	join_requests_coll = db[JOIN_REQUEST_COLLECTION]
	study_stats_coll = db[STUDY_STATS_COLLECTION]

	room_doc = await _get_room_doc_or_404(rooms_coll, room_id)
	admin_member_doc = await _get_member_doc(members_coll, room_id, admin_username)
	await _require_admin(room_doc, admin_member_doc, admin_username)

	if target_username == admin_username:
		raise HTTPException(status_code=400, detail="Admin cannot remove themselves")

	target_member = await members_coll.find_one({"room_id": room_id, "username": target_username})
	if not target_member:
		raise HTTPException(status_code=404, detail="Target member not found in this room")

	if target_member.get("role") == "admin":
		raise HTTPException(status_code=400, detail="Cannot remove the current admin")

	await members_coll.delete_one({"room_id": room_id, "username": target_username})
	await invitations_coll.update_many(
		{"room_id": room_id, "target_username": target_username, "status": STATUS_PENDING},
		{"$set": {"status": STATUS_REJECTED, "responded_at": _utcnow()}},
	)
	await join_requests_coll.update_many(
		{"room_id": room_id, "requester_username": target_username, "status": STATUS_PENDING},
		{"$set": {"status": STATUS_REJECTED, "reviewed_at": _utcnow(), "reviewed_by": admin_username}},
	)
	await study_stats_coll.delete_many({"room_id": room_id, "username": target_username})

	return {"message": f"Removed {target_username} from room."}


async def leave_room(room_id: str, username: str) -> dict:
	db = await _get_db()
	members_coll = db[MEMBER_COLLECTION]
	rooms_coll = db[ROOM_COLLECTION]
	invitations_coll = db[INVITATION_COLLECTION]
	join_requests_coll = db[JOIN_REQUEST_COLLECTION]
	study_stats_coll = db[STUDY_STATS_COLLECTION]

	room_doc = await _get_room_doc_or_404(rooms_coll, room_id)
	member_doc = await _get_member_doc(members_coll, room_id, username)

	is_admin = room_doc.get("admin_username") == username and member_doc.get("role") == "admin"
	if is_admin:
		raise HTTPException(status_code=400, detail="Admin cannot leave room. Delete room instead.")

	await members_coll.delete_one({"room_id": room_id, "username": username})
	await invitations_coll.update_many(
		{"room_id": room_id, "target_username": username, "status": STATUS_PENDING},
		{"$set": {"status": STATUS_REJECTED, "responded_at": _utcnow()}},
	)
	await join_requests_coll.update_many(
		{"room_id": room_id, "requester_username": username, "status": STATUS_PENDING},
		{"$set": {"status": STATUS_REJECTED, "reviewed_at": _utcnow(), "reviewed_by": "self-left"}},
	)
	await study_stats_coll.delete_many({"room_id": room_id, "username": username})

	return {"message": "You left the room.", "room_deleted": False, "new_admin_username": None}


async def delete_room(room_id: str, admin_username: str) -> dict:
	db = await _get_db()
	members_coll = db[MEMBER_COLLECTION]
	rooms_coll = db[ROOM_COLLECTION]
	messages_coll = db[MESSAGE_COLLECTION]
	invitations_coll = db[INVITATION_COLLECTION]
	join_requests_coll = db[JOIN_REQUEST_COLLECTION]
	study_stats_coll = db[STUDY_STATS_COLLECTION]

	room_doc = await _get_room_doc_or_404(rooms_coll, room_id)
	admin_member_doc = await _get_member_doc(members_coll, room_id, admin_username)
	await _require_admin(room_doc, admin_member_doc, admin_username)

	await rooms_coll.delete_one({"_id": _to_object_id(room_id, "room id")})
	await members_coll.delete_many({"room_id": room_id})
	await messages_coll.delete_many({"room_id": room_id})
	await invitations_coll.delete_many({"room_id": room_id})
	await join_requests_coll.delete_many({"room_id": room_id})
	await study_stats_coll.delete_many({"room_id": room_id})

	return {"message": "Room deleted successfully."}


async def get_room_by_id(room_id: str) -> dict:
	db = await _get_db()
	rooms_coll = db[ROOM_COLLECTION]

	doc = await rooms_coll.find_one({"_id": _to_object_id(room_id, "room id")})
	if doc:
		return _format_room_doc(doc)
	raise HTTPException(status_code=404, detail="Room not found")


async def get_rooms_for_user(username: str) -> List[dict]:
	db = await _get_db()
	rooms_coll = db[ROOM_COLLECTION]
	members_coll = db[MEMBER_COLLECTION]

	member_docs = await members_coll.find({"username": username}).to_list(length=100)
	room_ids = [
		ObjectId(doc["room_id"])
		for doc in member_docs
		if ObjectId.is_valid(doc.get("room_id", ""))
	]

	if not room_ids:
		return []

	rooms = await rooms_coll.find({"_id": {"$in": room_ids}}).to_list(length=100)
	return [_format_room_doc(room_doc) for room_doc in rooms]


async def send_message(room_id: str, sender_username: str, content: str) -> dict:
	db = await _get_db()
	members_coll = db[MEMBER_COLLECTION]
	messages_coll = db[MESSAGE_COLLECTION]
	rooms_coll = db[ROOM_COLLECTION]

	await _get_room_doc_or_404(rooms_coll, room_id)
	await _get_member_doc(members_coll, room_id, sender_username)

	new_message = RoomMessage.create(room_id=room_id, sender_username=sender_username, content=content)
	doc = new_message.to_document()
	result = await messages_coll.insert_one(doc)
	doc["_id"] = result.inserted_id

	return _format_message_doc(doc)


async def get_messages(room_id: str, username: str) -> List[dict]:
	db = await _get_db()
	members_coll = db[MEMBER_COLLECTION]
	messages_coll = db[MESSAGE_COLLECTION]

	await _get_member_doc(members_coll, room_id, username)

	messages = await messages_coll.find({"room_id": room_id}).sort("sent_at", 1).to_list(length=500)
	return [_format_message_doc(message_doc) for message_doc in messages]


def _format_room_doc(doc: dict) -> dict:
	doc["id"] = str(doc.pop("_id"))
	return doc


def _format_message_doc(doc: dict) -> dict:
	doc["id"] = str(doc.pop("_id"))
	return doc


def _format_member_doc(doc: dict) -> dict:
	doc["id"] = str(doc.pop("_id"))
	return doc


def _format_invitation_doc(doc: dict) -> dict:
	doc["id"] = str(doc.pop("_id"))
	return doc


def _format_join_request_doc(doc: dict) -> dict:
	doc["id"] = str(doc.pop("_id"))
	return doc
