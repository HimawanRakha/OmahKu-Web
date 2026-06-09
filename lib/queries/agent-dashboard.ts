import type { RowDataPacket } from "mysql2";
import { query, queryOne } from "@/lib/db";
import type { AgentRevenueSummary, MonthlyRevenue, PropertyRatingRank } from "@/types";

export async function getAgentListings(agentId: number) {
  return query<RowDataPacket[]>(
    `SELECT p.*, pc.name AS category_name,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      (SELECT pi.image_url FROM property_image pi WHERE pi.property_id = p.id AND pi.is_primary = TRUE LIMIT 1) AS thumbnail
     FROM property p
     JOIN property_category pc ON p.category_id = pc.id
     LEFT JOIN review r ON r.property_id = p.id
     WHERE (p.agent_id = ? OR p.owner_id = ?) AND p.deleted_at IS NULL
     GROUP BY p.id ORDER BY p.created_at DESC`,
    [agentId, agentId],
  );
}

export async function getAgentBookings(agentId: number) {
  return query<RowDataPacket[]>(
    `SELECT b.*, p.title AS property_title, u.full_name AS customer_name
     FROM booking b
     JOIN property p ON b.property_id = p.id
     JOIN user u ON b.user_id = u.id
     WHERE p.agent_id = ? ORDER BY b.created_at DESC`,
    [agentId],
  );
}

export async function getAgentRevenue(
  agentId: number,
  startDate?: string,
  endDate?: string,
): Promise<AgentRevenueSummary> {
  let dateClause = "";
  const params: (number | string)[] = [agentId];
  if (startDate && endDate) {
    dateClause = "AND t.created_at BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  const row = await queryOne<RowDataPacket>(
    `SELECT
      COALESCE(SUM(t.agreed_amount), 0) AS total_revenue,
      COUNT(*) AS total_transactions,
      COALESCE(AVG(t.agreed_amount), 0) AS avg_transaction_value
     FROM transaction t
     WHERE t.agent_id = ? AND t.status = 'success' ${dateClause}`,
    params,
  );

  return {
    total_revenue: Number(row?.total_revenue ?? 0),
    total_transactions: Number(row?.total_transactions ?? 0),
    avg_transaction_value: Number(row?.avg_transaction_value ?? 0),
  };
}

export async function getMonthlyRevenue(
  agentId: number,
  startDate?: string,
  endDate?: string,
): Promise<MonthlyRevenue[]> {
  let dateClause = "";
  const params: (number | string)[] = [agentId];
  if (startDate && endDate) {
    dateClause = "AND t.created_at BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  const rows = await query<RowDataPacket[]>(
    `SELECT YEAR(t.created_at) AS revenue_year, MONTH(t.created_at) AS revenue_month,
      SUM(t.agreed_amount) AS total_revenue
     FROM transaction t
     WHERE t.agent_id = ? AND t.status = 'success' ${dateClause}
     GROUP BY revenue_year, revenue_month
     ORDER BY revenue_year, revenue_month`,
    params,
  );

  return rows as unknown as MonthlyRevenue[];
}

export async function getTransactionTypeDistribution(agentId: number) {
  return query<RowDataPacket[]>(
    `SELECT transaction_type, COUNT(*) AS count
     FROM transaction WHERE agent_id = ? AND status = 'success'
     GROUP BY transaction_type`,
    [agentId],
  );
}

export async function getTopRatedProperties(
  agentId: number,
): Promise<PropertyRatingRank[]> {
  const rows = await query<RowDataPacket[]>(
    `SELECT p.id AS property_id, p.title AS property_title,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(r.id) AS review_count
     FROM property p
     LEFT JOIN review r ON r.property_id = p.id
     WHERE p.agent_id = ? AND p.deleted_at IS NULL
     GROUP BY p.id
     HAVING review_count > 0
     ORDER BY avg_rating DESC, review_count DESC
     LIMIT 10`,
    [agentId],
  );
  return rows as unknown as PropertyRatingRank[];
}

export async function getAgentPriceHistory(agentId: number) {
  return query<RowDataPacket[]>(
    `SELECT ph.*, p.title AS property_title
     FROM price_history ph
     JOIN property p ON ph.property_id = p.id
     WHERE p.agent_id = ? ORDER BY ph.created_at DESC LIMIT 50`,
    [agentId],
  );
}

export async function getFacilities() {
  return query<RowDataPacket[]>(`SELECT * FROM facility ORDER BY name`);
}
