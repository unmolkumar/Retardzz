"""
Database connection management using Motor (async MongoDB driver).
Handles MongoDB Atlas connection lifecycle.
"""
from typing import Iterable

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from app.config import settings

# Global database client instance
client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


def _normalize_index_keys(keys: Iterable[tuple[str, int]]) -> tuple[tuple[str, int], ...]:
    """Convert an index key sequence into a canonical tuple for comparisons."""
    return tuple((field, int(direction)) for field, direction in keys)


async def _ensure_collection_index(
    collection: AsyncIOMotorCollection,
    keys: list[tuple[str, int]],
) -> None:
    """Create an index only when no equivalent key pattern already exists."""
    target_keys = _normalize_index_keys(keys)
    existing_indexes = await collection.index_information()

    for index_spec in existing_indexes.values():
        existing_keys = _normalize_index_keys(index_spec.get("key", []))
        if existing_keys == target_keys:
            return

    await collection.create_index(keys)


async def _ensure_indexes(database: AsyncIOMotorDatabase) -> None:
    """Create critical indexes used by reload-time APIs."""
    await _ensure_collection_index(
        database["chats"],
        [("user_id", ASCENDING), ("deleted_at", ASCENDING), ("created_at", DESCENDING)],
    )
    await _ensure_collection_index(
        database["messages"],
        [("chat_id", ASCENDING), ("created_at", ASCENDING)],
    )
    await _ensure_collection_index(
        database["messages"],
        [("chat_id", ASCENDING), ("message_index", ASCENDING)],
    )
    await _ensure_collection_index(
        database["messages"],
        [("chat_id", ASCENDING), ("role", ASCENDING)],
    )
    await _ensure_collection_index(
        database["quizzes"],
        [("chat_id", ASCENDING), ("message_index", ASCENDING), ("created_at", ASCENDING)],
    )
    await _ensure_collection_index(
        database["flashcards"],
        [("chat_id", ASCENDING), ("message_index", ASCENDING), ("created_at", ASCENDING)],
    )
    await _ensure_collection_index(
        database["mindmaps"],
        [("chat_id", ASCENDING), ("message_index", ASCENDING), ("created_at", ASCENDING)],
    )
    await _ensure_collection_index(
        database["quiz_attempts"],
        [("quiz_id", ASCENDING), ("created_at", ASCENDING)],
    )


async def connect_to_mongo():
    """
    Establish connection to MongoDB Atlas on application startup.
    Creates a Motor async client and initializes the database reference.
    """
    global client, db
    
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]

    # Ensure query indexes for reload-heavy endpoints.
    await _ensure_indexes(db)
    
    # Verify connection by executing a ping command
    await db.command("ping")
    print(f"✓ Connected to MongoDB Atlas: {settings.database_name}")


async def close_mongo_connection():
    """
    Close MongoDB connection on application shutdown.
    Cleans up the Motor client resources.
    """
    global client, db
    
    if client is not None:
        client.close()
        db = None
        print("✓ MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """
    Dependency to access the database in route handlers.
    
    Returns:
        AsyncIOMotorDatabase: The Motor database instance.
        
    Raises:
        RuntimeError: If database is not initialized.
    """
    if db is None:
        raise RuntimeError("Database not initialized. Ensure startup event completed.")
    return db
