import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { auth } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const propertyId = Number(id);
  const agentId = Number(session.user.id);
  const body = await request.json();

  if (!body.title || !body.listing_type || !body.location_id) {
    return NextResponse.json(
      { error: "Judul, tipe penawaran, dan lokasi wajib diisi." },
      { status: 400 },
    );
  }
  if (!body.address_detail) {
    return NextResponse.json({ error: "Alamat lengkap wajib diisi." }, { status: 400 });
  }
  if (body.listing_type === "rent" && !body.rent_period) {
    return NextResponse.json({ error: "Periode sewa wajib untuk properti sewa." }, { status: 400 });
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    // Pastikan properti ini dikelola/dimiliki agen yang sedang login.
    const [owned] = await conn.execute<RowDataPacket[]>(
      `SELECT id FROM property
       WHERE id = ? AND (agent_id = ? OR owner_id = ?) AND deleted_at IS NULL
       LIMIT 1`,
      [propertyId, agentId, agentId],
    );
    if (owned.length === 0) {
      conn.release();
      return NextResponse.json({ error: "Properti tidak ditemukan atau bukan milik Anda." }, { status: 404 });
    }

    await conn.beginTransaction();

    // trg_property_price_audit membaca @app_user_id untuk mencatat siapa pengubah harga.
    await conn.query("SET @app_user_id = ?", [agentId]);

    await conn.execute(
      `UPDATE property SET
        title = ?, description = ?, address_detail = ?, listing_type = ?, price = ?,
        rent_period = ?, category_id = ?, location_id = ?, bedrooms = ?, bathrooms = ?,
        floors = ?, land_area = ?, building_area = ?, year_built = ?,
        certificate_type = ?, facing_direction = ?
       WHERE id = ?`,
      [
        body.title,
        body.description ?? null,
        body.address_detail,
        body.listing_type,
        body.price,
        body.listing_type === "rent" ? body.rent_period : null,
        body.category_id ?? 1,
        body.location_id,
        body.bedrooms,
        body.bathrooms,
        body.floors,
        body.land_area,
        body.building_area,
        body.year_built,
        body.certificate_type,
        body.facing_direction,
        propertyId,
      ],
    );

    // Sinkronkan fasilitas: hapus lama, masukkan pilihan terbaru.
    await conn.execute(`DELETE FROM property_facility WHERE property_id = ?`, [propertyId]);
    for (const facilityId of body.selectedFacilities ?? []) {
      await conn.execute(
        `INSERT INTO property_facility (property_id, facility_id, quantity) VALUES (?, ?, 1)`,
        [propertyId, facilityId],
      );
    }

    // Sinkronkan foto: hapus lama, masukkan daftar terbaru.
    await conn.execute(`DELETE FROM property_image WHERE property_id = ?`, [propertyId]);
    const urls = (body.image_urls ?? []).filter((u: string) => u);
    for (let i = 0; i < urls.length; i++) {
      await conn.execute(
        `INSERT INTO property_image (property_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)`,
        [propertyId, urls[i], i, i === body.primary_image_index],
      );
    }

    await conn.commit();
    return NextResponse.json({ success: true, id: propertyId });
  } catch (err) {
    await conn.rollback();
    const message = err instanceof Error ? err.message : "Gagal memperbarui properti.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    conn.release();
  }
}
