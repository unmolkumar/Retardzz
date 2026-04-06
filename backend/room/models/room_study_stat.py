"""Domain model representing per-user study stats in a room."""
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional


@dataclass(slots=True)
class RoomStudyStat:
	"""Tracks cumulative study time and live studying state for one room member."""
	room_id: str
	username: str
	date_key: str
	total_seconds: int
	is_live: bool
	started_at: Optional[datetime]
	active_mode_key: Optional[str]
	active_target_seconds: Optional[int]
	updated_at: datetime
	_id: Optional[str] = None

	@classmethod
	def create(
		cls,
		*,
		room_id: str,
		username: str,
		date_key: str,
		mode_key: Optional[str] = None,
		target_seconds: Optional[int] = None,
	) -> "RoomStudyStat":
		"""Factory helper for a new live study session entry."""
		now = datetime.now(timezone.utc)
		return cls(
			room_id=room_id,
			username=username,
			date_key=date_key,
			total_seconds=0,
			is_live=True,
			started_at=now,
			active_mode_key=mode_key,
			active_target_seconds=target_seconds,
			updated_at=now,
		)

	def to_document(self) -> dict[str, object]:
		"""Serialize for MongoDB persistence."""
		return {
			"room_id": self.room_id,
			"username": self.username,
			"date_key": self.date_key,
			"total_seconds": self.total_seconds,
			"is_live": self.is_live,
			"started_at": self.started_at,
			"active_mode_key": self.active_mode_key,
			"active_target_seconds": self.active_target_seconds,
			"updated_at": self.updated_at,
		}
