import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { queryOne } from "@/lib/db";

export async function POST(request: Request) {
  const { identifier } = await request.json();
  if (!identifier) {
    return NextResponse.json({ role: null }, { status: 400 });
  }

  const user = await queryOne<RowDataPacket>(
    `SELECT role FROM user WHERE (email = ? OR username = ?) AND deleted_at IS NULL LIMIT 1`,
    [identifier, identifier],
  );

  return NextResponse.json({ role: user?.role ?? null });
}
