"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const mockUserId = "temp-user-123";
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName, hostId: mockUserId }),
      });

      if (res.ok) {
        const { roomId } = await res.json();
        router.push(`/room/${roomId}`);
      } else {
        console.error("Failed to create room");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinRoomId.trim()) {
      router.push(`/room/${joinRoomId.trim()}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-4">
      <div className="max-w-2xl text-center space-y-4 mb-10">
        <h1 className="text-5xl font-extrabold text-indigo-600 tracking-tight">Smart Student Study Manager</h1>
        <p className="text-lg text-gray-600">
          The all-in-one collaborative study platform built for students. 
          Group study, personal AI tutor, live polls, and shared whiteboards—all in one place.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center items-stretch">
        
        {/* Create Room Card */}
        <div className="bg-white p-8 rounded-2xl shadow-lg flex-1 border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Create a Study Room</h2>
            <p className="text-gray-500 mb-6 text-sm">Host a new focused study session and invite your friends to collaborate and learn.</p>
          </div>
          
          <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="e.g., JEE Physics Revision" 
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="border-2 border-gray-200 rounded-lg p-3 outline-none focus:border-indigo-500 transition-colors"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md disabled:bg-indigo-300"
            >
              {loading ? "Creating..." : "Start Hosting"}
            </button>
          </form>
        </div>

        {/* Join Room Card */}
        <div className="bg-white p-8 rounded-2xl shadow-lg flex-1 border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Join an Existing Room</h2>
            <p className="text-gray-500 mb-6 text-sm">Have an invite code? Paste the Room ID below to drop straight into the session.</p>
          </div>

          <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Enter Room ID" 
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              className="border-2 border-gray-200 rounded-lg p-3 outline-none focus:border-green-500 transition-colors"
              required
            />
            <button 
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
            >
              Join Room
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
