import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAgentBookings } from "@/lib/queries/agent-dashboard";
import { getPool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

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

// FIX: tambah PATCH agar agen bisa confirm atau cancel booking
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { booking_id, status } = await request.json();
  if (!["confirmed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Status hanya bisa 'confirmed' atau 'cancelled'." }, { status: 400 });
  }

  const pool = getPool();
  const agentId = Number(session.user.id);

  // Pastikan booking ini milik properti yang dikelola agen ini
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT b.id FROM booking b
     JOIN property p ON b.property_id = p.id
     WHERE b.id = ? AND p.agent_id = ? AND b.deleted_at IS NULL
     LIMIT 1`,
    [booking_id, agentId],
  );
  if ((rows as RowDataPacket[]).length === 0) {
    return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
  }

  await pool.execute(`UPDATE booking SET status = ? WHERE id = ?`, [status, booking_id]);
  return NextResponse.json({ success: true });
}
