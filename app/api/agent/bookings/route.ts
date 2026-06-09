import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAgentBookings } from "@/lib/queries/agent-dashboard";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookings = await getAgentBookings(Number(session.user.id));
    return NextResponse.json({ bookings });
  } catch {
    return NextResponse.json({ bookings: [] });
  }
}
