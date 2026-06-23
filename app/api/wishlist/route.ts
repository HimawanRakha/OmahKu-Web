import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { property_id } = await request.json();
  const userId = Number(session.user.id);

  const pool = getPool();
  // Upsert: revive a previously soft-deleted row instead of violating the
  // UNIQUE (user_id, property_id) constraint when re-adding.
  await pool.execute(
    `INSERT INTO wishlist (user_id, property_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE deleted_at = NULL, created_at = NOW()`,
    [userId, property_id],
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { property_id } = await request.json();
  const userId = Number(session.user.id);

  const pool = getPool();
  await pool.execute(
    `UPDATE wishlist SET deleted_at = NOW() WHERE user_id = ? AND property_id = ? AND deleted_at IS NULL`,
    [userId, property_id],
  );

  return NextResponse.json({ success: true });
}
