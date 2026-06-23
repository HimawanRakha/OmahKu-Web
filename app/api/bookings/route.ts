import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { auth } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { property_id, notes, requested_start_date, requested_end_date } = await request.json();
  const customerId = Number(session.user.id);

  if (!property_id) {
    return NextResponse.json({ error: "Properti tidak valid." }, { status: 400 });
  }

  try {
    const pool = getPool();

    const [properties] = await pool.execute<RowDataPacket[]>(
      `SELECT owner_id, status, listing_type FROM property WHERE id = ? AND deleted_at IS NULL`,
      [property_id],
    );
    const prop = properties[0];
    if (!prop) {
      return NextResponse.json({ error: "Properti tidak ditemukan." }, { status: 404 });
    }
    if (prop.status !== "available") {
      return NextResponse.json({ error: "Properti tidak tersedia untuk booking." }, { status: 400 });
    }
    // Aturan bisnis: pemilik tidak boleh mem-booking propertinya sendiri.
    if (Number(prop.owner_id) === customerId) {
      return NextResponse.json({ error: "Anda tidak bisa mem-booking properti milik sendiri." }, { status: 400 });
    }

    // Aturan bisnis: properti sewa membutuhkan periode (tanggal mulai & selesai).
    // Tanggal ini menjadi dasar rent_transaction (start_date/end_date) saat transaksi dibuat.
    if (prop.listing_type === "rent") {
      if (!requested_start_date || !requested_end_date) {
        return NextResponse.json({ error: "Tanggal mulai dan selesai sewa wajib diisi." }, { status: 400 });
      }
      if (new Date(requested_end_date) <= new Date(requested_start_date)) {
        return NextResponse.json({ error: "Tanggal selesai harus setelah tanggal mulai." }, { status: 400 });
      }
    }

    // Cegah booking ganda yang masih aktif (pending/confirmed) untuk properti yang sama.
    const [existing] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM booking
       WHERE property_id = ? AND customer_id = ?
         AND status IN ('pending','confirmed') AND deleted_at IS NULL
       LIMIT 1`,
      [property_id, customerId],
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: "Anda sudah memiliki booking aktif untuk properti ini." }, { status: 409 });
    }

    // FIX: pakai customer_id (bukan user_id) sesuai schema booking
    // FIX: simpan requested_start_date / requested_end_date untuk properti sewa
    await pool.execute(
      `INSERT INTO booking (property_id, customer_id, requested_start_date, requested_end_date, status, notes)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [
        property_id,
        customerId,
        prop.listing_type === "rent" ? requested_start_date : null,
        prop.listing_type === "rent" ? requested_end_date : null,
        notes ?? null,
      ],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengajukan booking.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
