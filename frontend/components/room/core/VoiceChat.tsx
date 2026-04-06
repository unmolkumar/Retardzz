import { useEffect, useRef, useState } from "react";
import { useSocket } from "./useSocket";

export default function VoiceChat({ roomId, userId }: { roomId: string; userId: string }) {
  const socket = useSocket();
  const [isMuted, setIsMuted] = useState(true); // Default mutated for push-to-talk safety
  const [pushToTalkActive, setPushToTalkActive] = useState(false);
  const localStream = useRef<MediaStream | null>(null);
  const peers = useRef<{ [socketId: string]: RTCPeerConnection }>({});

  useEffect(() => {
    if (!socket) return;

    // 1. Get Local Audio Stream
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      localStream.current = stream;
      // Start muted
      stream.getAudioTracks().forEach((track) => (track.enabled = false));

      // 2. Listen for network signaling (Simplified Mesh Network)
      socket.on("user-joined", async ({ socketId }) => {
        const peer = createPeer(socketId);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("voice-offer", { offer, to: socketId });
      });

      socket.on("voice-offer", async ({ offer, from }) => {
        const peer = createPeer(from);
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("voice-answer", { answer, to: from });
      });

      socket.on("voice-answer", async ({ answer, from }) => {
        const peer = peers.current[from];
        if (peer) await peer.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("voice-ice-candidate", async ({ candidate, from }) => {
        const peer = peers.current[from];
        if (peer) await peer.addIceCandidate(new RTCIceCandidate(candidate));
      });

      socket.on("user-left", ({ socketId }) => {
        if (peers.current[socketId]) {
          peers.current[socketId].close();
          delete peers.current[socketId];
        }
      });
    }).catch((err) => console.error("Failed to get local audio", err));

    return () => {
      // Cleanup connections
      Object.values(peers.current).forEach((peer) => peer.close());
      peers.current = {};
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
      }
      socket.off("user-joined");
      socket.off("voice-offer");
      socket.off("voice-answer");
      socket.off("voice-ice-candidate");
      socket.off("user-left");
    };
  }, [socket]);

  // Helper to create a WebRTC Peer Connection
  const createPeer = (socketId: string) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("voice-ice-candidate", { candidate: event.candidate, to: socketId });
      }
    };

    peer.ontrack = (event) => {
      // Play incoming audio
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play();
    };

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        if (localStream.current) peer.addTrack(track, localStream.current);
      });
    }

    peers.current[socketId] = peer;
    return peer;
  };

  // Toggle Mute State
  const toggleMute = () => {
    if (!localStream.current) return;
    const audioTrack = localStream.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  // Push to Talk Handlers
  const handlePTTDown = () => {
    if (!localStream.current) return;
    const audioTrack = localStream.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = true;
      setPushToTalkActive(true);
    }
  };

  const handlePTTUp = () => {
    if (!localStream.current) return;
    const audioTrack = localStream.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = false;
      setPushToTalkActive(false);
      setIsMuted(true); // Reset toggle state if they were toggled
    }
  };

  return (
    <div className="p-4 bg-white border-2 border-orange-400 rounded my-4 text-center">
      <h3 className="font-bold text-lg mb-2">Voice Chat</h3>
      <div className="flex gap-2 justify-center items-center">
        <button
          onClick={toggleMute}
          className={`px-4 py-2 rounded font-bold text-white transition-colors ${
            isMuted ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>

        <button
          onMouseDown={handlePTTDown}
          onMouseUp={handlePTTUp}
          onMouseLeave={handlePTTUp}
          onTouchStart={handlePTTDown}
          onTouchEnd={handlePTTUp}
          className={`px-4 py-2 rounded font-bold border-2 select-none ${
            pushToTalkActive
              ? "bg-blue-500 text-white border-blue-600"
              : "bg-gray-200 text-gray-700 border-gray-300"
          }`}
        >
          Push to Talk
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {pushToTalkActive ? "Transmitting..." : "Silent"}
      </p>
    </div>
  );
}
