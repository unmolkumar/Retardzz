import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

// TODO: Replace "pk_placeholder_key_here" with your actual Liveblocks public API key
const client = createClient({
  publicApiKey: "pk_placeholder_key_here",
});

export const {
  RoomProvider,
  useRoom,
  useSelf,
  useOthers,
} = createRoomContext(client);
