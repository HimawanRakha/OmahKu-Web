import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

/**
 * POST /api/agent/transactions
 * Memanggil Stored Procedure sp_create_transaction secara atomik.
 * SP ini akan: validasi booking confirmed → INSERT transaction → INSERT sale/rent subtype
 * Trigger trg_transaction_success akan otomatis mengubah property.status saat di-update ke 'success'.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    booking_id,
    agreed_amount,
    // untuk sale:
    transfer_date,
    cert_number,
    // untuk rent:
    start_date,
    end_date,
    price_per_period,
    additional_fee,
  } = body;

  if (!booking_id || !agreed_amount) {
    return NextResponse.json({ error: "booking_id dan agreed_amount wajib diisi." }, { status: 400 });
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    // Panggil Stored Procedure sp_create_transaction
    // SP sudah handle atomik (START TRANSACTION / ROLLBACK / COMMIT) di dalam database
    await conn.query("SET @transaction_id = 0");
    await conn.query(`CALL sp_create_transaction(?, ?, ?, ?, ?, ?, ?, ?, @transaction_id)`, [
      booking_id,
      agreed_amount,
      transfer_date ?? null,
      cert_number ?? null,
      start_date ?? null,
      end_date ?? null,
      price_per_period ?? null,
      additional_fee ?? null,
    ]);

    const [rows] = await conn.query<RowDataPacket[]>("SELECT @transaction_id AS id");
    const newTransactionId = rows[0]?.id;

    return NextResponse.json({ success: true, transaction_id: newTransactionId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat transaksi.";
    return NextResponse.json({ error: message }, { status: 400 });
  } finally {
    conn.release();
  }
}

/**
 * PATCH /api/agent/transactions
 * Update status transaksi ke 'success' / 'failed' / 'cancelled'
 * Saat status diubah ke 'success', trigger trg_transaction_success
 * otomatis mengubah property.status menjadi 'sold' atau 'rented'
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transaction_id, status } = await request.json();
  const validStatuses = ["success", "failed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  const pool = getPool();
  const agentId = Number(session.user.id);

  // Pastikan transaksi ini milik agen
  const [rows] = await pool.execute<RowDataPacket[]>(`SELECT id FROM \`transaction\` WHERE id = ? AND agent_id = ? LIMIT 1`, [transaction_id, agentId]);
  if ((rows as RowDataPacket[]).length === 0) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
  }

  // UPDATE ini yang akan memicu trigger trg_transaction_success jika status = 'success'
  const completedAt = status === "success" ? new Date() : null;
  await pool.execute(`UPDATE \`transaction\` SET status = ?, completed_at = ? WHERE id = ?`, [status, completedAt, transaction_id]);

  return NextResponse.json({ success: true });
}
