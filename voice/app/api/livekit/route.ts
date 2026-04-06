import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // 1. Get the room and username from the URL parameters
  const room = req.nextUrl.searchParams.get('room');
  const username = req.nextUrl.searchParams.get('username');

  // 2. Validate the input
  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  }
  if (!username) {
    return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 });
  }

  // 3. Verify environment variables exist
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // 4. Create the token
  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
    // You can set a custom TTL (Time To Live) here, e.g., '10m' or '1h'
    ttl: '1h',
  });

  // 5. Grant permission to join the specific room and explicit publish permissions
  at.addGrant({ 
    roomJoin: true, 
    room: room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true
  });

  // 6. Return the token to the frontend
  return NextResponse.json({ token: await at.toJwt() });
}