import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { property_id, notes, requested_start_date, requested_end_date } = await request.json();
  const customerId = Number(session.user.id);
  const pool = getPool();

  const [properties] = await pool.execute(`SELECT status, listing_type FROM property WHERE id = ? AND deleted_at IS NULL`, [property_id]);
  const prop = (properties as { status: string; listing_type: string }[])[0];
  if (!prop || prop.status !== "available") {
    return NextResponse.json({ error: "Properti tidak tersedia untuk booking." }, { status: 400 });
  }

  // FIX: pakai customer_id (bukan user_id) sesuai schema booking
  // FIX: tambah requested_start_date dan requested_end_date untuk properti sewa
  await pool.execute(
    `INSERT INTO booking (property_id, customer_id, requested_start_date, requested_end_date, status, notes)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    [property_id, customerId, requested_start_date ?? null, requested_end_date ?? null, notes ?? null],
  );

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { booking_id, status } = await request.json();
  const validStatuses = ["pending", "confirmed", "cancelled", "expired"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  const pool = getPool();
  await pool.execute(`UPDATE booking SET status = ? WHERE id = ?`, [status, booking_id]);

  return NextResponse.json({ success: true });
}
