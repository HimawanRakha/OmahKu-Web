import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { property_id, transaction_id, rating, comment } = await request.json();
  const userId = Number(session.user.id);

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating harus 1-5." }, { status: 400 });
  }

  const pool = getPool();
  await pool.execute(
    `INSERT INTO review (property_id, user_id, transaction_id, rating, comment)
     VALUES (?, ?, ?, ?, ?)`,
    [property_id, userId, transaction_id, rating, comment ?? null],
  );

  return NextResponse.json({ success: true });
}
