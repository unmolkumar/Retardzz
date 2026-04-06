import CollaborativeCanvas from "@/components/Whiteboard/CollaborativeCanvas";

export default function RoomPage({
  params,
  searchParams,
}: {
  params: { roomId: string };
  searchParams?: {
    username?: string | string[];
    roomName?: string | string[];
  };
}) {
  const username = typeof searchParams?.username === "string" ? searchParams.username : "";
  const roomName = typeof searchParams?.roomName === "string" ? searchParams.roomName : "";

  return (
    <main className="h-full w-full">
      <CollaborativeCanvas roomId={params.roomId} username={username} roomName={roomName} />
    </main>
  );
}
