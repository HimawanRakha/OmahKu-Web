import type { RowDataPacket } from "mysql2";
import { query, queryOne } from "@/lib/db";
import type { AgentCardData, AgentProfileWithStats } from "@/types";

export async function getAgents(
  city?: string,
  minRating?: number,
): Promise<AgentCardData[]> {
  let having = "";
  const params: string[] = [];
  const conditions = ["u.role = 'agent'", "u.deleted_at IS NULL", "ap.id IS NOT NULL"];

  if (city) {
    conditions.push("EXISTS (SELECT 1 FROM property p JOIN location l ON p.location_id = l.id WHERE p.agent_id = u.id AND l.city = ? AND p.deleted_at IS NULL)");
    params.push(city);
  }

  if (minRating) {
    having = "HAVING avg_rating >= ?";
    params.push(String(minRating));
  }

  const rows = await query<RowDataPacket[]>(
    `SELECT u.id, u.full_name, u.profile_photo_url,
      ap.agency_name, ap.license_number, ap.verified_at,
      COUNT(DISTINCT CASE WHEN p.status IN ('available','booked') AND p.deleted_at IS NULL THEN p.id END) AS active_property_count,
      COALESCE(AVG(r.rating), 0) AS avg_rating
     FROM user u
     JOIN agent_profile ap ON ap.user_id = u.id
     LEFT JOIN property p ON p.agent_id = u.id
     LEFT JOIN review r ON r.property_id = p.id
     WHERE ${conditions.join(" AND ")}
     GROUP BY u.id
     ${having}
     ORDER BY avg_rating DESC`,
    params,
  );

  return rows as unknown as AgentCardData[];
}

export async function getAgentProfile(
  id: number,
  viewerId?: number,
  viewerRole?: string,
): Promise<AgentProfileWithStats | null> {
  const row = await queryOne<RowDataPacket>(
    `SELECT u.id, u.full_name, u.profile_photo_url, u.created_at,
      ap.agency_name, ap.license_number, ap.bio, ap.verified_at,
      COUNT(DISTINCT CASE WHEN t.status = 'success' THEN t.id END) AS total_transactions,
      COUNT(DISTINCT CASE WHEN p.status IN ('available','booked') AND p.deleted_at IS NULL THEN p.id END) AS active_property_count,
      COALESCE(AVG(r.rating), 0) AS avg_rating
     FROM user u
     JOIN agent_profile ap ON ap.user_id = u.id
     LEFT JOIN property p ON p.agent_id = u.id
     LEFT JOIN transaction t ON t.agent_id = u.id
     LEFT JOIN review r ON r.property_id = p.id
     WHERE u.id = ? AND u.role = 'agent' AND u.deleted_at IS NULL
     GROUP BY u.id`,
    [id],
  );

  if (!row) return null;

  const canSeeRevenue =
    viewerRole === "admin" || viewerId === id;

  let total_revenue: number | null = null;
  if (canSeeRevenue) {
    const rev = await queryOne<RowDataPacket>(
      `SELECT COALESCE(SUM(agreed_amount), 0) AS total_revenue
       FROM transaction WHERE agent_id = ? AND status = 'success'`,
      [id],
    );
    total_revenue = Number(rev?.total_revenue ?? 0);
  }

  return {
    ...(row as unknown as AgentProfileWithStats),
    total_revenue,
    total_transactions: Number(row.total_transactions),
    active_property_count: Number(row.active_property_count),
    avg_rating: Number(row.avg_rating),
  };
}

export async function getAgentProperties(agentId: number) {
  const rows = await query<RowDataPacket[]>(
    `SELECT p.id, p.title, p.price, p.listing_type, p.rent_period, p.status,
      p.bedrooms, p.bathrooms, p.building_area,
      l.district, l.city,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(DISTINCT r.id) AS review_count,
      (SELECT pi.image_url FROM property_image pi WHERE pi.property_id = p.id AND pi.is_primary = TRUE LIMIT 1) AS primary_image_url,
      u.full_name AS agent_name, u.profile_photo_url AS agent_photo_url,
      (ap.verified_at IS NOT NULL) AS agent_verified
     FROM property p
     JOIN location l ON p.location_id = l.id
     JOIN user u ON p.agent_id = u.id
     LEFT JOIN agent_profile ap ON ap.user_id = u.id
     LEFT JOIN review r ON r.property_id = p.id
     WHERE p.agent_id = ? AND p.deleted_at IS NULL
     GROUP BY p.id ORDER BY p.created_at DESC`,
    [agentId],
  );
  return rows;
}
