import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { property_id, notes } = await request.json();
  const userId = Number(session.user.id);
  const pool = getPool();

  const [properties] = await pool.execute(
    `SELECT status FROM property WHERE id = ? AND deleted_at IS NULL`,
    [property_id],
  );
  const prop = (properties as { status: string }[])[0];
  if (!prop || prop.status !== "available") {
    return NextResponse.json(
      { error: "Properti tidak tersedia untuk booking." },
      { status: 400 },
    );
  }

  await pool.execute(
    `INSERT INTO booking (property_id, user_id, status, notes) VALUES (?, ?, 'pending', ?)`,
    [property_id, userId, notes ?? null],
  );

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { booking_id, status } = await request.json();
  const pool = getPool();

  await pool.execute(`UPDATE booking SET status = ? WHERE id = ?`, [
    status,
    booking_id,
  ]);

  return NextResponse.json({ success: true });
}
