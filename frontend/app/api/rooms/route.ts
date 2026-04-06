import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, hostId } = await req.json();

    if (!name || !hostId) {
      return NextResponse.json({ error: "Missing name or hostId" }, { status: 400 });
    }

    // Upsert a dummy user if it's the mock ID, so foreign keys don't fail.
    // In production, this relies on the NextAuth session user ID.
    await prisma.user.upsert({
      where: { id: hostId },
      update: {},
      create: {
        id: hostId,
        email: `${hostId}@temp.com`,
        name: "Temporary Host",
      },
    });

    // Create the room and automatically add the host as a member
    const room = await prisma.room.create({
      data: {
        name,
        hostId,
        members: {
          create: {
            userId: hostId,
            role: "HOST",
          },
        },
      },
    });

    return NextResponse.json({ roomId: room.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create room:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
