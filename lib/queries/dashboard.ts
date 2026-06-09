// ============================================================
// lib/queries/dashboard.ts — FIXED
// Perbaikan: customer_id (bukan user_id), reviewer_id (bukan user_id)
// ============================================================
import type { RowDataPacket } from "mysql2";
import { query, queryOne } from "@/lib/db";
import type { PropertyCardData, TransactionWithDetails } from "@/types";

export async function getUserDashboardSummary(userId: number) {
  const row = await queryOne<RowDataPacket>(
    `SELECT
      (SELECT COUNT(*) FROM wishlist WHERE user_id = ? AND deleted_at IS NULL) AS wishlist_count,
      -- FIX: transaction.customer_id bukan user_id
      (SELECT COUNT(*) FROM \`transaction\` WHERE customer_id = ? AND status = 'pending') AS active_transactions,
      -- FIX: review.reviewer_id bukan user_id
      (SELECT COUNT(*) FROM review WHERE reviewer_id = ?) AS review_count`,
    [userId, userId, userId],
  );
  return {
    wishlist_count: Number(row?.wishlist_count ?? 0),
    active_transactions: Number(row?.active_transactions ?? 0),
    review_count: Number(row?.review_count ?? 0),
  };
}

export async function getUserTransactions(userId: number, status?: string): Promise<TransactionWithDetails[]> {
  let statusClause = "";
  const params: (number | string)[] = [userId];
  if (status) {
    statusClause = "AND t.status = ?";
    params.push(status);
  }

  const rows = await query<RowDataPacket[]>(
    `SELECT t.*, p.title AS property_title,
      (SELECT pi.image_url FROM property_image pi WHERE pi.property_id = p.id AND pi.is_primary = TRUE LIMIT 1) AS property_image_url,
      EXISTS(SELECT 1 FROM review rv WHERE rv.transaction_id = t.id) AS has_review,
      rt.start_date AS rent_start_date, rt.end_date AS rent_end_date,
      rt.price_per_period AS rent_price_per_period, rt.additional_fee AS rent_additional_fee,
      st.transfer_date AS sale_transfer_date, st.certificate_number AS sale_certificate_number
     FROM \`transaction\` t
     JOIN property p ON t.property_id = p.id
     LEFT JOIN rent_transaction rt ON rt.transaction_id = t.id
     LEFT JOIN sale_transaction st ON st.transaction_id = t.id
     -- FIX: t.customer_id bukan t.user_id
     WHERE t.customer_id = ? ${statusClause}
     ORDER BY t.created_at DESC`,
    params,
  );

  return rows as unknown as TransactionWithDetails[];
}

function castPropertyCard(row: RowDataPacket) {
  return {
    ...row,
    price: Number(row.price),
    avg_rating: row.avg_rating != null ? Number(row.avg_rating) : null,
    review_count: Number(row.review_count),
    building_area: row.building_area != null ? Number(row.building_area) : null,
    agent_verified: Boolean(row.agent_verified),
    is_wishlisted: true,
  };
}

export async function getUserWishlist(userId: number): Promise<PropertyCardData[]> {
  const rows = await query<RowDataPacket[]>(
    `SELECT p.id, p.title, p.price, p.listing_type, p.rent_period, p.status,
      p.bedrooms, p.bathrooms, p.building_area,
      l.district, l.city,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(DISTINCT r.id) AS review_count,
      (SELECT pi.image_url FROM property_image pi WHERE pi.property_id = p.id AND pi.is_primary = TRUE LIMIT 1) AS primary_image_url,
      u.full_name AS agent_name,
      NULL AS agent_photo_url,
      (ap.verified_at IS NOT NULL) AS agent_verified,
      TRUE AS is_wishlisted
     FROM wishlist w
     JOIN property p ON w.property_id = p.id
     JOIN location l ON p.location_id = l.id
     JOIN \`user\` u ON p.agent_id = u.id
     LEFT JOIN agent_profile ap ON ap.user_id = u.id
     LEFT JOIN review r ON r.property_id = p.id
     WHERE w.user_id = ? AND w.deleted_at IS NULL AND p.deleted_at IS NULL
     GROUP BY p.id
     ORDER BY w.created_at DESC`,
    [userId],
  );
  return rows.map(castPropertyCard) as unknown as PropertyCardData[];
}

export async function getUserReviews(userId: number) {
  return query<RowDataPacket[]>(
    // FIX: r.reviewer_id bukan r.user_id
    `SELECT r.*, p.title AS property_title
     FROM review r JOIN property p ON r.property_id = p.id
     WHERE r.reviewer_id = ? ORDER BY r.created_at DESC`,
    [userId],
  );
}
