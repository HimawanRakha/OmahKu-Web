import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { isValidNIK, parseNIK } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      full_name,
      nik,
      username,
      email,
      phone_number,
      password,
      role = "user",
      agency_name,
      license_number,
      bio,
    } = body;

    const cleanNik = parseNIK(nik ?? "");
    if (!full_name || !isValidNIK(cleanNik) || !username || !email || !password) {
      return NextResponse.json(
        { error: "Data wajib belum lengkap atau NIK tidak valid." },
        { status: 400 },
      );
    }

    if (role === "agent" && (!agency_name || !license_number)) {
      return NextResponse.json(
        { error: "Agen wajib mengisi nama agensi dan nomor lisensi." },
        { status: 400 },
      );
    }

    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [existing] = await conn.execute<RowDataPacket[]>(
        `SELECT id FROM user WHERE email = ? OR username = ? OR nik = ? LIMIT 1`,
        [email, username, cleanNik],
      );

      if (existing.length > 0) {
        await conn.rollback();
        return NextResponse.json(
          { error: "Email, username, atau NIK sudah terdaftar." },
          { status: 409 },
        );
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const [userResult] = await conn.execute<ResultSetHeader>(
        `INSERT INTO user (full_name, nik, username, email, phone_number, password_hash, role)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          full_name,
          cleanNik,
          username,
          email,
          phone_number ?? "",
          passwordHash,
          role,
        ],
      );

      if (role === "agent") {
        await conn.execute(
          `INSERT INTO agent_profile (user_id, agency_name, license_number, bio)
           VALUES (?, ?, ?, ?)`,
          [userResult.insertId, agency_name, license_number, bio ?? null],
        );
      }

      await conn.commit();
      return NextResponse.json({ success: true, userId: userResult.insertId });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch {
    return NextResponse.json(
      { error: "Gagal mendaftar. Periksa koneksi database." },
      { status: 500 },
    );
  }
}
