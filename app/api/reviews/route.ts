import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { property_id, transaction_id, rating, comment } = await request.json();
  const reviewerId = Number(session.user.id);

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating harus 1-5." }, { status: 400 });
  }

  const pool = getPool();

  // FIX: validasi transaksi harus status='success' dan milik user yang review
  const [trxRows] = await pool.execute<RowDataPacket[]>(
    `SELECT id FROM \`transaction\`
     WHERE id = ? AND customer_id = ? AND status = 'success' AND deleted_at IS NULL
     LIMIT 1`,
    [transaction_id, reviewerId],
  );
  if ((trxRows as RowDataPacket[]).length === 0) {
    return NextResponse.json({ error: "Ulasan hanya bisa diberikan untuk transaksi yang sudah selesai." }, { status: 403 });
  }

  // Cek apakah sudah pernah review transaksi ini (UNIQUE constraint)
  const [existingReview] = await pool.execute<RowDataPacket[]>(`SELECT id FROM review WHERE transaction_id = ? LIMIT 1`, [transaction_id]);
  if ((existingReview as RowDataPacket[]).length > 0) {
    return NextResponse.json({ error: "Transaksi ini sudah memiliki ulasan." }, { status: 409 });
  }

  // FIX: pakai reviewer_id (bukan user_id) sesuai schema review
  await pool.execute(
    `INSERT INTO review (transaction_id, property_id, reviewer_id, rating, comment)
     VALUES (?, ?, ?, ?, ?)`,
    [transaction_id, property_id, reviewerId, rating, comment ?? null],
  );

  return NextResponse.json({ success: true });
}
