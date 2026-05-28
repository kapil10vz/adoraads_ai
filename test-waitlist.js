/**
 * adoraads.ai — Waitlist Server Test
 * Run: node test-waitlist.js
 * Tests all endpoints before deploying to Railway
 */

const BASE = process.env.TEST_URL || "http://localhost:3010";
const ADMIN_KEY = process.env.ADMIN_KEY || "adoraads-admin-2025";

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌  ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

async function run() {
  console.log(`\n🌸  adoraads.ai waitlist server tests → ${BASE}\n`);

  // Health check
  await test("GET /health returns ok", async () => {
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(data.status === "ok", `Expected status ok, got ${data.status}`);
  });

  // Valid signup
  await test("POST /waitlist — valid email signup", async () => {
    const res = await fetch(`${BASE}/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `test-${Date.now()}@adoraads.ai`,
        name: "Test Brand",
        brand_name: "Test Beauty Co",
        brand_tier: "indie",
        source: "test",
      }),
    });
    const data = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(data.success === true, `Expected success true, got ${JSON.stringify(data)}`);
    assert(data.position >= 1, "Expected position >= 1");
  });

  // Duplicate email
  await test("POST /waitlist — duplicate email returns friendly message", async () => {
    const email = `dupe-${Date.now()}@adoraads.ai`;
    await fetch(`${BASE}/waitlist`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const res = await fetch(`${BASE}/waitlist`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    assert(data.success === true, "Should succeed with friendly message");
    assert(data.message.includes("already"), `Expected 'already' in message: ${data.message}`);
  });

  // Invalid email
  await test("POST /waitlist — invalid email rejected", async () => {
    const res = await fetch(`${BASE}/waitlist`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const data = await res.json();
    assert(data.success === false, "Expected success false for invalid email");
  });

  // Missing email
  await test("POST /waitlist — missing email rejected", async () => {
    const res = await fetch(`${BASE}/waitlist`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "No Email" }),
    });
    const data = await res.json();
    assert(data.success === false, "Expected success false for missing email");
  });

  // Public count
  await test("GET /waitlist/count — returns count", async () => {
    const res = await fetch(`${BASE}/waitlist/count`);
    const data = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof data.count === "number", `Expected number count, got ${typeof data.count}`);
  });

  // Admin — no key
  await test("GET /waitlist/admin — blocked without key", async () => {
    const res = await fetch(`${BASE}/waitlist/admin`);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // Admin — with key
  await test("GET /waitlist/admin — accessible with correct key", async () => {
    const res = await fetch(`${BASE}/waitlist/admin`, {
      headers: { "X-Admin-Key": ADMIN_KEY },
    });
    const data = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof data.total === "number", "Expected total field");
    assert(Array.isArray(data.signups), "Expected signups array");
  });

  // Admin CSV
  await test("GET /waitlist/admin/csv — returns CSV", async () => {
    const res = await fetch(`${BASE}/waitlist/admin/csv`, {
      headers: { "X-Admin-Key": ADMIN_KEY },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    assert(ct.includes("text/csv"), `Expected text/csv content-type, got ${ct}`);
  });

  // Summary
  console.log(`\n${"─".repeat(40)}`);
  console.log(`  ${passed} passed  ${failed > 0 ? `· ${failed} failed` : ""}`);
  if (failed === 0) {
    console.log("\n  ✅  All tests passed — ready to deploy!\n");
    console.log("  Deploy to Railway:\n");
    console.log("    npm install -g @railway/cli");
    console.log("    railway login");
    console.log("    railway init");
    console.log("    railway up\n");
  } else {
    console.log(`\n  ⚠️   ${failed} test(s) failed — check server logs\n`);
    process.exit(1);
  }
}

run().catch(e => {
  console.error("\n❌  Test runner failed:", e.message);
  console.error("    Is the server running? npm start\n");
  process.exit(1);
});
