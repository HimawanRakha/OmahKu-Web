import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { auth } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { getAgentListings } from "@/lib/queries/agent-dashboard";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const listings = await getAgentListings(Number(session.user.id));
    return NextResponse.json({ listings });
  } catch {
    return NextResponse.json({ listings: [] });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const agentId = Number(session.user.id);
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO property (
        title, description, listing_type, price, rent_period,
        category_id, location_id, status, bedrooms, bathrooms, floors,
        land_area, building_area, year_built, certificate_type, facing_direction,
        agent_id, owner_id
      ) VALUES (?, ?, ?, ?, ?, 1, ?, 'available', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.title,
        body.description,
        body.listing_type,
        body.price,
        body.listing_type === "rent" ? body.rent_period : null,
        body.location_id,
        body.bedrooms,
        body.bathrooms,
        body.floors,
        body.land_area,
        body.building_area,
        body.year_built,
        body.certificate_type,
        body.facing_direction,
        agentId,
        agentId,
      ],
    );

    const propertyId = result.insertId;

    for (const facilityId of body.selectedFacilities ?? []) {
      await conn.execute(
        `INSERT INTO property_facility (property_id, facility_id, quantity) VALUES (?, ?, 1)`,
        [propertyId, facilityId],
      );
    }

    const urls = (body.image_urls ?? []).filter((u: string) => u);
    for (let i = 0; i < urls.length; i++) {
      await conn.execute(
        `INSERT INTO property_image (property_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)`,
        [propertyId, urls[i], i, i === body.primary_image_index],
      );
    }

    await conn.commit();
    return NextResponse.json({ success: true, id: propertyId });
  } catch {
    await conn.rollback();
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  } finally {
    conn.release();
  }
}
