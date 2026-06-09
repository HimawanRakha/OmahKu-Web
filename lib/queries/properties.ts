// ============================================================
// lib/queries/properties.ts — FIXED
// Perbaikan: hapus profile_photo_url (tidak ada di schema),
//            fix review JOIN (reviewer_id), fix price_history (changed_at, LEFT JOIN)
// ============================================================
import type { RowDataPacket } from "mysql2";
import { query, queryOne } from "@/lib/db";
import type { PropertyCardData, PropertyFilters, PropertySortOption, PropertyWithDetails } from "@/types";

function castPropertyCard(row: RowDataPacket): PropertyCardData {
  return {
    ...row,
    price: Number(row.price),
    avg_rating: row.avg_rating != null ? Number(row.avg_rating) : null,
    review_count: Number(row.review_count),
    building_area: row.building_area != null ? Number(row.building_area) : null,
    land_area: row.land_area != null ? Number(row.land_area) : null,
    agent_verified: Boolean(row.agent_verified),
    is_wishlisted: Boolean(row.is_wishlisted),
  } as unknown as PropertyCardData; // ← tambah 'unknown' di tengah
}

// FIX: hapus u.profile_photo_url — kolom ini tidak ada di schema user
const PROPERTY_CARD_SELECT = `
  p.id, p.title, p.price, p.listing_type, p.rent_period, p.status,
  p.bedrooms, p.bathrooms, p.building_area,
  l.district, l.city,
  COALESCE(AVG(r.rating), 0) AS avg_rating,
  COUNT(DISTINCT r.id) AS review_count,
  (SELECT pi.image_url FROM property_image pi
   WHERE pi.property_id = p.id AND pi.is_primary = TRUE LIMIT 1) AS primary_image_url,
  u.full_name AS agent_name,
  NULL AS agent_photo_url,
  (ap.verified_at IS NOT NULL) AS agent_verified
`;

const PROPERTY_CARD_JOINS = `
  FROM property p
  JOIN location l ON p.location_id = l.id
  JOIN \`user\` u ON p.agent_id = u.id
  LEFT JOIN agent_profile ap ON ap.user_id = u.id
  LEFT JOIN review r ON r.property_id = p.id AND r.deleted_at IS NULL
`;

function buildWhereClause(filters: PropertyFilters, showAllStatus = false): { clause: string; params: (string | number)[] } {
  const conditions: string[] = ["p.deleted_at IS NULL"];
  const params: (string | number)[] = [];

  if (!showAllStatus && !filters.status?.length) {
    conditions.push("p.status = 'available'");
  } else if (filters.status?.length) {
    conditions.push(`p.status IN (${filters.status.map(() => "?").join(",")})`);
    params.push(...filters.status);
  }

  if (filters.listing_type) {
    conditions.push("p.listing_type = ?");
    params.push(filters.listing_type);
  }
  if (filters.category_id) {
    conditions.push("p.category_id = ?");
    params.push(filters.category_id);
  }
  if (filters.price_min != null) {
    conditions.push("p.price >= ?");
    params.push(filters.price_min);
  }
  if (filters.price_max != null) {
    conditions.push("p.price <= ?");
    params.push(filters.price_max);
  }
  if (filters.rent_period) {
    conditions.push("p.rent_period = ?");
    params.push(filters.rent_period);
  }
  if (filters.province) {
    conditions.push("l.province = ?");
    params.push(filters.province);
  }
  if (filters.city) {
    conditions.push("l.city = ?");
    params.push(filters.city);
  }
  if (filters.district) {
    conditions.push("l.district = ?");
    params.push(filters.district);
  }
  if (filters.bedrooms_min) {
    conditions.push("p.bedrooms >= ?");
    params.push(filters.bedrooms_min);
  }
  if (filters.bathrooms_min) {
    conditions.push("p.bathrooms >= ?");
    params.push(filters.bathrooms_min);
  }
  if (filters.building_area_min) {
    conditions.push("p.building_area >= ?");
    params.push(filters.building_area_min);
  }
  if (filters.land_area_min) {
    conditions.push("p.land_area >= ?");
    params.push(filters.land_area_min);
  }
  if (filters.certificate_type) {
    conditions.push("p.certificate_type = ?");
    params.push(filters.certificate_type);
  }
  if (filters.facing_direction) {
    conditions.push("p.facing_direction = ?");
    params.push(filters.facing_direction);
  }
  if (filters.floors) {
    conditions.push("p.floors = ?");
    params.push(filters.floors);
  }
  if (filters.year_built_min) {
    conditions.push("p.year_built >= ?");
    params.push(filters.year_built_min);
  }
  if (filters.year_built_max) {
    conditions.push("p.year_built <= ?");
    params.push(filters.year_built_max);
  }
  if (filters.search) {
    conditions.push("(p.title LIKE ? OR l.city LIKE ? OR l.district LIKE ?)");
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  return { clause: conditions.join(" AND "), params };
}

function sortClause(sort: PropertySortOption): string {
  switch (sort) {
    case "price_asc":
      return "p.price ASC";
    case "price_desc":
      return "p.price DESC";
    case "rating_desc":
      return "avg_rating DESC";
    case "most_reviewed":
      return "review_count DESC";
    default:
      return "p.created_at DESC";
  }
}

export async function getFeaturedProperties(userId?: number): Promise<PropertyCardData[]> {
  let wishlistSelect = "";
  const wishlistParams: number[] = [];

  if (userId) {
    wishlistSelect = `, EXISTS(
      SELECT 1 FROM wishlist w 
      WHERE w.property_id = p.id 
      AND w.user_id = ? 
      AND w.deleted_at IS NULL
    ) AS is_wishlisted`;
    wishlistParams.push(userId);
  }

  const rows = await query<RowDataPacket[]>(
    `SELECT ${PROPERTY_CARD_SELECT}${wishlistSelect}
     ${PROPERTY_CARD_JOINS}
     WHERE p.deleted_at IS NULL AND p.status IN ('available', 'booked')
     GROUP BY p.id
     ORDER BY p.created_at DESC
     LIMIT 6`,
    wishlistParams, // FIX: hanya wishlistParams, tidak ada params lain
  );

  return rows.map(castPropertyCard);
}

export async function getProperties(filters: PropertyFilters = {}, sort: PropertySortOption = "newest", showAllStatus = false, userId?: number, minRating?: number): Promise<PropertyCardData[]> {
  const { clause, params } = buildWhereClause(filters, showAllStatus);

  // FIX: pisahkan wishlist select dan params dengan jelas
  let wishlistSelect = "";
  const wishlistParams: number[] = [];

  if (userId) {
    wishlistSelect = `, EXISTS(
      SELECT 1 FROM wishlist w 
      WHERE w.property_id = p.id 
      AND w.user_id = ? 
      AND w.deleted_at IS NULL
    ) AS is_wishlisted`;
    wishlistParams.push(userId);
  }

  let having = "";
  const havingParams: number[] = [];
  if (minRating) {
    having = "HAVING avg_rating >= ?";
    havingParams.push(minRating);
  }

  // FIX: urutan params harus sama persis dengan urutan ? di query
  // SELECT params (wishlist) → WHERE params (filter) → HAVING params
  const allParams = [...wishlistParams, ...params, ...havingParams];

  const rows = await query<RowDataPacket[]>(
    `SELECT ${PROPERTY_CARD_SELECT}${wishlistSelect}
     ${PROPERTY_CARD_JOINS}
     WHERE ${clause}
     GROUP BY p.id
     ${having}
     ORDER BY ${sortClause(sort)}`,
    allParams,
  );

  return rows.map(castPropertyCard);
}

export async function getPropertyById(id: number): Promise<PropertyWithDetails | null> {
  const row = await queryOne<RowDataPacket>(
    `SELECT p.*, pc.name AS category_name,
      l.province, l.city, l.district, l.postal_code,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(DISTINCT r.id) AS review_count,
      (SELECT pi.image_url FROM property_image pi
       WHERE pi.property_id = p.id AND pi.is_primary = TRUE LIMIT 1) AS primary_image_url,
      u.full_name AS agent_name,
      NULL AS agent_photo_url,
      (ap.verified_at IS NOT NULL) AS agent_verified,
      ap.agency_name, ap.license_number
     FROM property p
     JOIN property_category pc ON p.category_id = pc.id
     JOIN location l ON p.location_id = l.id
     JOIN \`user\` u ON p.agent_id = u.id
     LEFT JOIN agent_profile ap ON ap.user_id = u.id
     LEFT JOIN review r ON r.property_id = p.id AND r.deleted_at IS NULL
     WHERE p.id = ? AND p.deleted_at IS NULL
     GROUP BY p.id`,
    [id],
  );
  return row as unknown as PropertyWithDetails | null;
}

export async function getLandingStats() {
  const row = await queryOne<RowDataPacket>(
    `SELECT
      (SELECT COUNT(*) FROM property WHERE deleted_at IS NULL AND status IN ('available','booked')) AS total_properties,
      (SELECT COUNT(*) FROM \`transaction\` WHERE status = 'success') AS total_transactions,
      (SELECT COUNT(*) FROM agent_profile WHERE verified_at IS NOT NULL) AS total_agents`,
  );
  return {
    total_properties: Number(row?.total_properties ?? 0),
    total_transactions: Number(row?.total_transactions ?? 0),
    total_agents: Number(row?.total_agents ?? 0),
  };
}

export async function getCategories() {
  return query<RowDataPacket[]>(`SELECT id, name FROM property_category ORDER BY name`);
}

export async function getLocations() {
  return query<RowDataPacket[]>(`SELECT id, province, city, district, postal_code FROM location ORDER BY province, city, district`);
}

export async function getPropertyImages(propertyId: number) {
  return query<RowDataPacket[]>(`SELECT * FROM property_image WHERE property_id = ? AND deleted_at IS NULL ORDER BY sort_order`, [propertyId]);
}

export async function getPropertyFacilities(propertyId: number) {
  return query<RowDataPacket[]>(
    `SELECT pf.*, f.name AS facility_name, f.icon AS facility_icon, f.is_countable
     FROM property_facility pf
     JOIN facility f ON pf.facility_id = f.id
     WHERE pf.property_id = ?`,
    [propertyId],
  );
}

export async function getPropertyReviews(propertyId: number) {
  return query<RowDataPacket[]>(
    // FIX: JOIN pakai reviewer_id bukan user_id
    `SELECT r.*, u.full_name AS reviewer_name
     FROM review r JOIN \`user\` u ON r.reviewer_id = u.id
     WHERE r.property_id = ? AND r.deleted_at IS NULL ORDER BY r.created_at DESC`,
    [propertyId],
  );
}

export async function getPriceHistory(propertyId: number) {
  return query<RowDataPacket[]>(
    // FIX 1: LEFT JOIN karena changed_by bisa NULL (perubahan oleh sistem/trigger)
    // FIX 2: ORDER BY changed_at (bukan created_at — schema pakai changed_at)
    `SELECT ph.*, u.full_name AS changed_by_name
     FROM price_history ph
     LEFT JOIN \`user\` u ON ph.changed_by = u.id
     WHERE ph.property_id = ? ORDER BY ph.changed_at DESC`,
    [propertyId],
  );
}
