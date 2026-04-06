import CollaborativeCanvas from "@/components/Whiteboard/CollaborativeCanvas";

export default function RoomPage({
  params,
  searchParams,
}: {
  params: { roomId: string };
  searchParams?: {
    username?: string | string[];
    roomName?: string | string[];
    boardId?: string | string[];
  };
}) {
  const username = typeof searchParams?.username === "string" ? searchParams.username : "";
  const roomName = typeof searchParams?.roomName === "string" ? searchParams.roomName : "";
  const boardId = typeof searchParams?.boardId === "string" ? searchParams.boardId : "";

  return (
    <main className="h-full w-full">
      <CollaborativeCanvas roomId={params.roomId} username={username} roomName={roomName} boardId={boardId} />
    </main>
  );
}
