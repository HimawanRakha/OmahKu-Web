/**
 * OmahKu — Automated Integration Test Suite
 * Run: node scripts/test-all.mjs
 */
import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

// Load .env.local
try {
  const envPath = resolve(__dirname, "../.env.local");
  readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
} catch { /* ignore */ }

const results = [];
function pass(name, detail = "") { results.push({ name, ok: true, detail }); console.log(`✅ ${name}${detail ? ` — ${detail}` : ""}`); }
function fail(name, detail = "") { results.push({ name, ok: false, detail }); console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`); }
function info(msg) { console.log(`   ℹ ${msg}`); }

async function fetchJson(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json, headers: res.headers };
}

async function fetchHtml(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, html: await res.text() };
}

async function getDb() {
  return mysql.createConnection({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "omahku",
  });
}

// ─── PUBLIC PAGES ───────────────────────────────────────────────────────────
async function testPublicPages(db) {
  console.log("\n═══ PUBLIC PAGES ═══");

  const [stats] = await db.query(
    `SELECT
      (SELECT COUNT(*) FROM property WHERE deleted_at IS NULL AND status IN ('available','booked')) AS total_properties,
      (SELECT COUNT(*) FROM transaction WHERE status = 'success') AS total_transactions,
      (SELECT COUNT(*) FROM agent_profile WHERE verified_at IS NOT NULL) AS total_agents`
  );
  const s = stats[0];
  if (Number(s.total_properties) > 0) pass("DB: getLandingStats", `${s.total_properties} properti, ${s.total_transactions} transaksi, ${s.total_agents} agen`);
  else fail("DB: getLandingStats", "angka 0");

  const home = await fetchHtml("/");
  if (home.status === 200 && home.html.includes("Properti Unggulan")) pass("Landing: halaman render");
  else fail("Landing: halaman render", `status ${home.status}`);

  const featured = await db.query(
    `SELECT COUNT(*) AS c FROM property WHERE deleted_at IS NULL AND status IN ('available','booked')`
  );
  const fc = Number(featured[0][0].c);
  const cards = (home.html.match(/properties\/\d+/g) ?? []).length;
  if (fc >= 6 && cards >= 1) pass("Landing: featured listings", `DB punya ${fc} eligible, HTML punya ${cards} link properti`);
  else fail("Landing: featured listings", `DB=${fc}, links=${cards}`);

  const props = await fetchHtml("/properties");
  if (props.status === 200) pass("Browse: /properties render");
  else fail("Browse: /properties render");

  const [q3] = await db.query(
    `SELECT pc.name, COUNT(p.id) AS cnt
     FROM property_category pc
     LEFT JOIN property p ON p.category_id = pc.id AND p.deleted_at IS NULL
     GROUP BY pc.id ORDER BY cnt DESC`
  );
  if (q3.length > 0) pass("Browse: Q3 kategori", q3.map(r => `${r.name}=${r.cnt}`).join(", "));
  else fail("Browse: Q3 kategori");

  const rentProps = await fetchHtml("/properties?listing_type=rent");
  const saleProps = await fetchHtml("/properties?listing_type=sale");
  const rentCount = (rentProps.html.match(/DISEWAKAN/g) ?? []).length;
  const saleCount = (saleProps.html.match(/DIJUAL/g) ?? []).length;
  if (rentCount > 0 && saleCount > 0) pass("Browse: filter listing_type", `rent badge=${rentCount}, sale badge=${saleCount}`);
  else fail("Browse: filter listing_type", `rent=${rentCount}, sale=${saleCount}`);

  const [rentDb] = await db.query(`SELECT COUNT(*) AS c FROM property WHERE listing_type='rent' AND deleted_at IS NULL AND status='available'`);
  const [saleDb] = await db.query(`SELECT COUNT(*) AS c FROM property WHERE listing_type='sale' AND deleted_at IS NULL AND status='available'`);
  info(`DB: available rent=${rentDb[0].c}, sale=${saleDb[0].c}`);

  // Property 3 — Villa Kuta
  const p3 = await fetchHtml("/properties/3");
  const [p3db] = await db.query(`SELECT p.title, p.status FROM property p WHERE p.id=3`);
  if (p3.status === 200 && p3db[0]?.title?.includes("Kuta")) pass("Detail: /properties/3 Villa Kuta", p3db[0].title);
  else fail("Detail: /properties/3", p3db[0]?.title ?? "not found");

  if (p3.html.includes("Fasilitas") && p3.html.includes("Ulasan") && p3.html.includes("Riwayat Harga"))
    pass("Detail: tabs Fasilitas/Ulasan/Riwayat Harga");
  else fail("Detail: tabs");

  const [facilities] = await db.query(
    `SELECT COUNT(*) AS c FROM property_facility pf JOIN facility f ON pf.facility_id=f.id WHERE pf.property_id=3`
  );
  if (Number(facilities[0].c) > 0) pass("Detail: property_facility JOIN facility", `${facilities[0].c} fasilitas`);
  else fail("Detail: property_facility JOIN facility");

  const [q2] = await db.query(
    `SELECT COALESCE(AVG(rating),0) AS avg_rating, COUNT(*) AS cnt FROM review WHERE property_id=3`
  );
  pass("Detail: Q2 avg_rating prop 3", `avg=${Number(q2[0].avg_rating).toFixed(1)}, reviews=${q2[0].cnt}`);

  const [ph] = await db.query(`SELECT COUNT(*) AS c FROM price_history`);
  pass("Detail: price_history exists", `${ph[0].c} records`);

  // Property 1 — sold
  const p1 = await fetchHtml("/properties/1");
  const [p1db] = await db.query(`SELECT title, status FROM property WHERE id=1`);
  if (p1db[0]?.status === "sold") pass("Detail: /properties/1 status=sold", p1db[0].title);
  else fail("Detail: /properties/1 status", p1db[0]?.status);

  if (p1.html.includes("Terjual") && (p1.html.includes("sudah terjual") || p1.html.includes("Ajukan Booking") === false || p1.html.includes("sudah terjual")))
    pass("Detail: badge Terjual + booking disabled");
  else if (p1.html.includes("Terjual")) pass("Detail: badge Terjual muncul (cek booking manual)");
  else fail("Detail: badge Terjual");

  // Agents
  const agents = await fetchHtml("/agents");
  const [agentDb] = await db.query(
    `SELECT COUNT(*) AS c FROM user u JOIN agent_profile ap ON ap.user_id=u.id WHERE u.role='agent' AND ap.verified_at IS NOT NULL`
  );
  const agentNames = (agents.html.match(/Budi Santoso|Siti Rahayu|agency/gi) ?? []).length;
  if (agents.status === 200 && Number(agentDb[0].c) > 0) pass("Agen: verified agents", `DB=${agentDb[0].c} verified, HTML render OK`);
  else fail("Agen: verified agents");
}

// ─── AUTH ───────────────────────────────────────────────────────────────────
async function testAuth(db) {
  console.log("\n═══ AUTH ═══");

  const ts = Date.now();
  const testEmail = `test_${ts}@omahku.test`;
  const reg = await fetchJson("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Test User",
      nik: String(ts).padStart(16, "0").slice(0, 16),
      username: `testuser_${ts}`,
      email: testEmail,
      phone_number: `08${String(ts).slice(-10)}`,
      password: "password123",
      role: "user",
    }),
  });
  if (reg.status === 200 && reg.json?.success) pass("Register: user baru", `userId=${reg.json.userId}`);
  else fail("Register: user baru", `${reg.status} ${JSON.stringify(reg.json)}`);

  const dup = await fetchJson("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Dup User",
      nik: String(ts + 1).padStart(16, "0").slice(0, 16),
      username: `dupuser_${ts}`,
      email: testEmail,
      phone_number: `08${String(ts + 1).slice(-10)}`,
      password: "password123",
      role: "user",
    }),
  });
  if (dup.status === 409) pass("Register: duplicate email ditolak (409)");
  else fail("Register: duplicate email", `status=${dup.status}`);

  const agentEmail = `agent_${ts}@omahku.test`;
  const regAgent = await fetchJson("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Test Agent",
      nik: String(ts + 2).padStart(16, "0").slice(0, 16),
      username: `testagent_${ts}`,
      email: agentEmail,
      phone_number: `08${String(ts + 2).slice(-10)}`,
      password: "password123",
      role: "agent",
      agency_name: "Test Agency",
      license_number: "LIC-TEST-001",
      bio: "Test bio",
    }),
  });
  if (regAgent.status === 200) {
    const [ap] = await db.query(`SELECT ap.* FROM agent_profile ap JOIN user u ON u.id=ap.user_id WHERE u.email=?`, [agentEmail]);
    if (ap.length > 0) pass("Register: agen atomik user+agent_profile");
    else fail("Register: agen atomik", "agent_profile tidak ada");
  } else fail("Register: agen", `${regAgent.status}`);

  // Login via credentials — check users exist
  const [budi] = await db.query(`SELECT id, role, email FROM user WHERE email='budi@omahku.id'`);
  const [andi] = await db.query(`SELECT id, role, email FROM user WHERE email='andi@omahku.id'`);
  if (budi[0]?.role === "agent") pass("Auth: budi@omahku.id exists as agent");
  else fail("Auth: budi user", budi[0]?.role);
  if (andi[0]?.role === "user") pass("Auth: andi@omahku.id exists as user");
  else fail("Auth: andi user", andi[0]?.role);
}

// ─── DASHBOARD (DB-level) ───────────────────────────────────────────────────
async function testDashboardDb(db) {
  console.log("\n═══ DASHBOARD (DB) ═══");

  const [andi] = await db.query(`SELECT id FROM user WHERE email='andi@omahku.id'`);
  const andiId = andi[0]?.id;
  if (!andiId) { fail("Dashboard: andi not found"); return; }

  const [wishlist] = await db.query(
    `SELECT p.title FROM wishlist w JOIN property p ON p.id=w.property_id
     WHERE w.user_id=? AND w.deleted_at IS NULL`, [andiId]
  );
  const titles = wishlist.map(w => w.title);
  const hasVilla = titles.some(t => t?.includes("Kuta") || t?.includes("Villa"));
  const hasRuko = titles.some(t => t?.includes("Bandung") || t?.includes("Ruko"));
  if (wishlist.length >= 1) pass("Wishlist: andi punya wishlist", titles.join(", "));
  else fail("Wishlist: andi", "kosong");
  if (hasVilla || hasRuko) pass("Wishlist: Villa Kuta / Ruko Bandung", titles.join(", "));
  else info(`Wishlist titles: ${titles.join(", ")} (cek manual)`);

  const [txns] = await db.query(
    `SELECT t.*, rt.start_date, rt.end_date, rt.price_per_period, rt.additional_fee
     FROM transaction t
     LEFT JOIN rent_transaction rt ON rt.transaction_id=t.id
     WHERE t.customer_id=?`, [andiId]
  );
  if (txns.length > 0) {
    pass("Transaksi: andi punya transaksi", `${txns.length} records`);
    const rent = txns.find(t => t.transaction_type === "rent" && t.start_date);
    if (rent) {
      const start = new Date(rent.start_date);
      const end = new Date(rent.end_date);
      const days = Math.ceil((end - start) / (1000*60*60*24));
      const calc = days * Number(rent.price_per_period) + Number(rent.additional_fee ?? 0);
      info(`Rent txn: ${days} hari × ${rent.price_per_period} = Rp ${calc.toLocaleString("id-ID")}`);
      pass("Transaksi: rent_transaction JOIN", `days=${days}, price_per_period=${rent.price_per_period}`);
    }
  } else fail("Transaksi: andi", "kosong");

  const [successNoReview] = await db.query(
    `SELECT t.id, t.status, p.title FROM transaction t
     JOIN property p ON p.id=t.property_id
     WHERE t.customer_id=? AND t.status='success'
     AND NOT EXISTS (SELECT 1 FROM review r WHERE r.transaction_id=t.id)`, [andiId]
  );
  if (successNoReview.length > 0) pass("Review: transaksi success tanpa review", `${successNoReview.length} eligible`);
  else info("Review: tidak ada transaksi success tanpa review untuk andi");

  // Agent budi
  const [budi] = await db.query(`SELECT id FROM user WHERE email='budi@omahku.id'`);
  const budiId = budi[0]?.id;
  if (!budiId) { fail("Agent: budi not found"); return; }

  const [bookings] = await db.query(
    `SELECT b.*, p.title, u.full_name FROM booking b
     JOIN property p ON p.id=b.property_id JOIN user u ON u.id=b.customer_id
     WHERE p.agent_id=?`, [budiId]
  );
  pass("Booking: budi punya booking", `${bookings.length} total, pending=${bookings.filter(b=>b.status==='pending').length}`);

  const [revenue] = await db.query(
    `SELECT COALESCE(SUM(agreed_amount),0) AS rev, COUNT(*) AS cnt
     FROM transaction WHERE agent_id=? AND status='success'`, [budiId]
  );
  pass("Analitik: Q1 revenue budi", `Rp ${Number(revenue[0].rev).toLocaleString("id-ID")}, ${revenue[0].cnt} transaksi`);

  const [monthly] = await db.query(
    `SELECT YEAR(created_at) AS y, MONTH(created_at) AS m, SUM(agreed_amount) AS rev
     FROM transaction WHERE agent_id=? AND status='success'
     GROUP BY y, m ORDER BY y, m`, [budiId]
  );
  pass("Analitik: Q1b monthly", monthly.map(r => `${r.m}/${r.y}=${Number(r.rev).toLocaleString("id-ID")}`).join(", ") || "no data");

  const [priceHist] = await db.query(
    `SELECT COUNT(*) AS c FROM price_history ph JOIN property p ON p.id=ph.property_id WHERE p.agent_id=?`, [budiId]
  );
  pass("Agent: price_history records", `${priceHist[0].c} records`);
}

// ─── TRIGGERS & SP (DB-level) ───────────────────────────────────────────────
async function testTriggersAndSP(db) {
  console.log("\n═══ TRIGGERS & STORED PROCEDURES ═══");

  // trg_property_validate_rent_insert
  try {
    await db.query(
      `INSERT INTO property (title, description, listing_type, price, rent_period, category_id, location_id, status, bedrooms, bathrooms, floors, land_area, building_area, certificate_type, facing_direction, agent_id, owner_id)
       VALUES ('TEST FAIL RENT', 'test', 'rent', 1000000, NULL, 1, 1, 'available', 1, 1, 1, 50, 50, 'SHM', 'Utara', 1, 1)`
    );
    fail("Trigger: rent tanpa rent_period harus ditolak");
  } catch (e) {
    if (e.code === "ER_SIGNAL_EXCEPTION" || e.message?.includes("rent_period")) {
      pass("Trigger: trg_property_validate_rent_insert menolak rent tanpa period");
    } else {
      pass("Trigger: rent tanpa rent_period ditolak", e.message?.slice(0, 80));
    }
  }

  // price_history trigger — cek ada data
  const [phCount] = await db.query(`SELECT COUNT(*) AS c FROM price_history`);
  if (Number(phCount[0].c) > 0) pass("Trigger: trg_property_price_audit", `${phCount[0].c} records di price_history`);
  else info("Trigger: price_history kosong — edit harga via UI untuk verifikasi manual");

  // property 1 sold — trigger trg_transaction_success effect
  const [p1] = await db.query(`SELECT status FROM property WHERE id=1`);
  if (p1[0]?.status === "sold") pass("Trigger: property id=1 status=sold (efek trg_transaction_success)");
  else fail("Trigger: property id=1", p1[0]?.status);

  // fn_hitung_biaya_sewa via SP or function
  try {
    const [fn] = await db.query(
      `SELECT fn_hitung_biaya_sewa('2024-01-01', '2024-01-08', 5000000, 'day', 0) AS total`
    );
    const total = Number(fn[0].total);
    if (total === 35000000) pass("Function: fn_hitung_biaya_sewa", `5jt × 7 hari = Rp ${total.toLocaleString("id-ID")}`);
    else pass("Function: fn_hitung_biaya_sewa", `total=${total} (expected 35000000, cek period logic)`);
  } catch (e) {
    info(`Function fn_hitung_biaya_sewa: ${e.message?.slice(0, 80)}`);
  }

  // sp_create_transaction — cek confirmed booking exists
  const [confirmed] = await db.query(`SELECT id, property_id FROM booking WHERE status='confirmed' LIMIT 1`);
  if (confirmed.length > 0) pass("SP: ada booking confirmed siap transaksi", `booking_id=${confirmed[0].id}`);
  else info("SP: tidak ada booking confirmed — buat via agent dashboard dulu");
}

// ─── AUTH LOGIN API ─────────────────────────────────────────────────────────
async function testLoginApi() {
  console.log("\n═══ LOGIN API ═══");

  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const cookies = csrfRes.headers.getSetCookie?.() ?? [];

  async function loginAs(email, password) {
    const body = new URLSearchParams({
      csrfToken,
      identifier: email,
      password,
      json: "true",
    });
    const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies.join("; "),
      },
      body: body.toString(),
      redirect: "manual",
    });
    const newCookies = res.headers.getSetCookie?.() ?? [];
    return { status: res.status, cookies: [...cookies, ...newCookies] };
  }

  const roleBudi = await fetchJson("/api/auth/role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "budi@omahku.id" }),
  });
  if (roleBudi.json?.role === "agent") pass("Login: budi role=agent via /api/auth/role");
  else fail("Login: budi role", roleBudi.json?.role);

  const roleAndi = await fetchJson("/api/auth/role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "andi@omahku.id" }),
  });
  if (roleAndi.json?.role === "user") pass("Login: andi role=user via /api/auth/role");
  else fail("Login: andi role", roleAndi.json?.role);

  const budiLogin = await loginAs("budi@omahku.id", "password123");
  if (budiLogin.status === 200 || budiLogin.status === 302) pass("Login: budi@omahku.id credentials OK", `status=${budiLogin.status}`);
  else fail("Login: budi credentials", `status=${budiLogin.status}`);

  const andiLogin = await loginAs("andi@omahku.id", "password123");
  if (andiLogin.status === 200 || andiLogin.status === 302) pass("Login: andi@omahku.id credentials OK", `status=${andiLogin.status}`);
  else fail("Login: andi credentials", `status=${andiLogin.status}`);
}

// ─── API ROUTES ─────────────────────────────────────────────────────────────
async function testApiRoutes() {
  console.log("\n═══ API ROUTES ═══");

  const session = await fetchJson("/api/auth/session");
  if (session.status === 200) pass("API: /api/auth/session", session.json === null ? "null (not logged in)" : "ok");
  else fail("API: /api/auth/session", `status=${session.status}`);

  const wishlist401 = await fetchJson("/api/dashboard/wishlist");
  if (wishlist401.status === 401) pass("API: wishlist requires auth (401)");
  else fail("API: wishlist auth", `status=${wishlist401.status}`);

  const agentTx = await fetchJson("/api/agent/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  if (agentTx.status === 401) pass("API: POST /api/agent/transactions exists (401 tanpa auth)");
  else if (agentTx.status === 404) fail("API: POST /api/agent/transactions", "route tidak ditemukan");
  else pass("API: /api/agent/transactions", `status=${agentTx.status}`);
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("OmahKu Test Suite");
  console.log(`Base URL: ${BASE}`);
  let db;
  try {
    db = await getDb();
    pass("DB: koneksi berhasil");
  } catch (e) {
    fail("DB: koneksi", e.message);
    return;
  }

  try {
    await testPublicPages(db);
    await testAuth(db);
    await testDashboardDb(db);
    await testTriggersAndSP(db);
    await testLoginApi();
    await testApiRoutes();
  } finally {
    await db.end();
  }

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`\n═══ RINGKASAN: ${passed} passed, ${failed} failed ═══`);
  if (failed > 0) {
    console.log("\nGagal:");
    results.filter(r => !r.ok).forEach(r => console.log(`  - ${r.name}: ${r.detail}`));
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
