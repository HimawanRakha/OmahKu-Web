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
  const [existing] = await pool.execute(
    `SELECT id FROM wishlist WHERE user_id = ? AND property_id = ? AND deleted_at IS NULL`,
    [userId, property_id],
  );

  if ((existing as unknown[]).length > 0) {
    return NextResponse.json({ success: true });
  }

  await pool.execute(
    `INSERT INTO wishlist (user_id, property_id) VALUES (?, ?)`,
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
