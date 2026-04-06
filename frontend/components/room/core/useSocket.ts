import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export const useSocket = (url: string = "http://localhost:3001") => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(url, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    setSocket(socketInstance);

    return () => {
      // Typically we don't disconnect the socket on unmount if it's a shared global resource,
      // but you can implement reference counting if needed.
    };
  }, [url]);

  return socket;
};

