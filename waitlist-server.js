/**
 * adoraads.ai — Waitlist Backend
 * ──────────────────────────────────────────────────────────────────
 * Captures waitlist signups from the landing page and blog post.
 * Features:
 *   • POST /waitlist       — capture email + metadata
 *   • GET  /waitlist/admin — view all signups (password protected)
 *   • Mailchimp integration (optional)
 *   • Slack webhook notification (optional)
 *   • Welcome email via Resend / SendGrid (optional)
 *   • SQLite persistence (zero-config, swap for Postgres in prod)
 *
 * Setup:
 *   npm install express cors better-sqlite3 nodemailer dotenv
 *   node waitlist-server.js
 *
 * Deploy: Railway, Render, or Fly.io — one-click from GitHub
 */

require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const crypto   = require("crypto");
const path     = require("path");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ── Serve landing page + blog from public/ folder ─────────────
// Place index.html and blog.html inside a public/ subfolder
app.use(express.static(path.join(__dirname, "public")));

// ── Database setup (SQLite — zero config for launch) ─────────────
let db;
try {
  const Database = require("better-sqlite3");
  db = new Database(path.join(__dirname, "waitlist.db"));

  db.exec(`
    CREATE TABLE IF NOT EXISTS signups (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      email       TEXT UNIQUE NOT NULL,
      name        TEXT,
      brand_name  TEXT,
      brand_tier  TEXT,  -- indie / prestige / luxury
      source      TEXT,  -- landing_page / blog / referral
      ref_code    TEXT,  -- referral tracking
      ip          TEXT,
      user_agent  TEXT,
      confirmed   BOOLEAN DEFAULT 0,
      notes       TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT,
      event      TEXT,  -- signup / confirmed / unsubscribed
      metadata   TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log("✅  SQLite database ready → waitlist.db");
} catch (e) {
  console.warn("⚠️  better-sqlite3 not installed — using in-memory store");
  console.warn("    Run: npm install better-sqlite3");
  // Fallback: in-memory array (resets on restart)
  const signups = [];
  db = {
    prepare: (sql) => ({
      run: (...args) => {
        if (sql.includes("INSERT")) {
          signups.push({ email: args[0], name: args[1], brand_name: args[2], brand_tier: args[3], source: args[4], created_at: new Date().toISOString() });
        } return { changes: 1 }; 
      },
      get: (...args) => signups.find(s => s.email === args[0]),
      all: () => signups,
    }),
    exec: () => {},
  };
}

// ── Rate limiting (simple in-memory) ─────────────────────────────
const rateLimitMap = new Map();
function rateLimit(ip, max = 5, windowMs = 60000) {
  const now = Date.now();
  const hits = (rateLimitMap.get(ip) || []).filter(t => now - t < windowMs);
  hits.push(now);
  rateLimitMap.set(ip, hits);
  return hits.length <= max;
}

// ── Email validation ──────────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 255;
}

// ── Slack notification (optional) ────────────────────────────────
async function notifySlack(signup) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🌸 *New adoraads.ai waitlist signup*\n*Email:* ${signup.email}\n*Brand:* ${signup.brand_name || "—"}\n*Source:* ${signup.source || "—"}\n*Tier:* ${signup.brand_tier || "—"}`,
      }),
    });
  } catch (e) {
    console.warn("Slack notification failed:", e.message);
  }
}

// ── Mailchimp sync (optional) ─────────────────────────────────────
async function syncToMailchimp(email, name) {
  const apiKey   = process.env.MAILCHIMP_API_KEY;
  const listId   = process.env.MAILCHIMP_LIST_ID;
  const dc       = apiKey ? apiKey.split("-").pop() : null;
  if (!apiKey || !listId) {
    return;
  }
  try {
    const emailHash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
    await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`, {
      method: "PUT",
      headers: {
        "Authorization": `apikey ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: "subscribed",
        merge_fields:  { FNAME: name || "" },
        tags:          ["adoraads-waitlist"],
      }),
    });
    console.log(`📧  Mailchimp synced: ${email}`);
  } catch (e) {
    console.warn("Mailchimp sync failed:", e.message);
  }
}

// ── Loops.so sync (optional) ─────────────────────────────────────
async function syncToLoops(email, name, brandName, brandTier) {
  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    return;
  }
  try {
    await fetch("https://app.loops.so/api/v1/contacts/create", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        firstName: name || "",
        customFields: {
          brand_name: brandName || "",
          brand_tier: brandTier || "indie",
          waitlist_signup: true,
        },
      }),
    });
    console.log(`📧  Loops synced: ${email}`);
  } catch (e) {
    console.warn("Loops sync failed:", e.message);
  }
}

// ── Welcome email via Resend (optional) ──────────────────────────
async function sendWelcomeEmail(email, name) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from:    "hello@adoraads.ai",
        to:      email,
        subject: "You're on the adoraads.ai waitlist ✦",
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1a1714;">
            <p style="font-size:28px;font-weight:400;line-height:1.2;margin-bottom:16px;">
              Welcome to adoraads${name ? `, ${name}` : ""}.
            </p>
            <p style="font-size:15px;line-height:1.75;color:#7a6e66;margin-bottom:20px;">
              You're on the waitlist for <strong style="color:#1a1714;">adoraads.ai</strong> — the first ad network built for LLM-powered beauty shopping.
            </p>
            <p style="font-size:15px;line-height:1.75;color:#7a6e66;margin-bottom:20px;">
              We're onboarding <strong style="color:#1a1714;">50 founding brands</strong> with 3 months free on any plan.
              We'll be in touch with your access details soon.
            </p>
            <p style="font-size:15px;line-height:1.75;color:#7a6e66;">
              In the meantime, read our launch post:
              <a href="https://adoraads.ai/blog/the-end-of-the-banner-ad" style="color:#c9956a;">
                The End of the Banner Ad
              </a>
            </p>
            <hr style="border:none;border-top:1px solid #e8e2da;margin:32px 0;" />
            <p style="font-size:12px;color:#b0a09a;font-family:monospace;">
              adoraads.ai · hello@adoraads.ai · Unsubscribe
            </p>
          </div>
        `,
      }),
    });
    console.log(`📨  Welcome email sent to: ${email}`);
  } catch (e) {
    console.warn("Welcome email failed:", e.message);
  }
}

// ── Admin auth middleware ─────────────────────────────────────────
function adminAuth(req, res, next) {
  const adminKey = process.env.ADMIN_KEY || "adoraads-admin-2025";
  const key = req.headers["x-admin-key"] || req.query.key;
  if (key !== adminKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ═══════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════

/**
 * POST /waitlist
 * Body: { email, name?, brand_name?, brand_tier?, source?, ref_code? }
 */
app.post("/waitlist", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  // Rate limit: 5 signups per IP per minute
  if (!rateLimit(ip, 5, 60000)) {
    return res.status(429).json({ success: false, error: "Too many requests. Please slow down." });
  }

  const { email, name, brand_name, brand_tier, source, ref_code } = req.body;

  // Validate email
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ success: false, error: "Please enter a valid email address." });
  }

  // Check for duplicate
  const existing = db.prepare("SELECT email FROM signups WHERE email = ?").get(email.toLowerCase().trim());
  if (existing) {
    return res.json({ success: true, message: "You're already on the waitlist! We'll be in touch soon." });
  }

  // Insert into DB
  try {
    db.prepare(`
      INSERT INTO signups (email, name, brand_name, brand_tier, source, ref_code, ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      email.toLowerCase().trim(),
      name || null,
      brand_name || null,
      brand_tier || null,
      source || "landing_page",
      ref_code || null,
      ip,
      req.headers["user-agent"] || null,
    );

    // Log event
    db.prepare("INSERT INTO events (email, event, metadata) VALUES (?, ?, ?)")
      .run(email.toLowerCase().trim(), "signup", JSON.stringify({ source, brand_name }));

    console.log(`✅  Waitlist signup: ${email} | brand: ${brand_name || "—"} | source: ${source || "—"}`);
  } catch (e) {
    console.error("DB insert failed:", e.message);
    return res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }

  // Fire side-effects async (don't block response)
  const signup = { email: email.toLowerCase().trim(), name, brand_name, brand_tier, source };
  Promise.all([
    notifySlack(signup),
    syncToMailchimp(signup.email, name),
    syncToLoops(signup.email, name, brand_name, brand_tier),
    sendWelcomeEmail(signup.email, name),
  ]).catch(e => console.error("Side-effect error:", e));

  return res.json({
    success: true,
    message: "🌸 You're on the waitlist! Check your email for a confirmation.",
    position: db.prepare("SELECT COUNT(*) as cnt FROM signups").get()?.cnt || 1,
  });
});

/**
 * POST /concepts
 * Captures contact info from users interested in the POC demo
 * Redirects to /poc.html on success
 */
app.post("/concepts", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  // Rate limit: 10 requests per IP per minute
  if (!rateLimit(ip, 10, 60000)) {
    return res.status(429).json({ success: false, error: "Too many requests. Please slow down." });
  }

  const { email, brand_name } = req.body;

  // Validate email
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ success: false, error: "Please enter a valid email address." });
  }

  // Insert into DB (allow duplicate emails for concepts, they're interested in the demo)
  try {
    db.prepare(`
      INSERT INTO signups (email, brand_name, source, ip, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      email.toLowerCase().trim(),
      brand_name || null,
      "poc_gate",
      ip,
      req.headers["user-agent"] || null,
    );

    // Log event
    db.prepare("INSERT INTO events (email, event, metadata) VALUES (?, ?, ?)")
      .run(email.toLowerCase().trim(), "poc_interest", JSON.stringify({ brand_name }));

    console.log(`🎮 POC demo interest: ${email} | brand: ${brand_name || "—"}`);
  } catch (e) {
    // If duplicate, that's ok for poc_gate - they just want to see the demo again
    if (!e.message.includes("UNIQUE")) {
      console.error("DB insert failed:", e.message);
      return res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
    }
  }

  // Fire side-effects async (non-blocking)
  const signup = { email: email.toLowerCase().trim(), brand_name };
  Promise.all([
    notifySlack({ ...signup, event: "POC demo interest" }),
    syncToLoops(signup.email, null, brand_name, null),
  ]).catch(e => console.error("Side-effect error:", e));

  return res.json({
    success: true,
    message: "Great! Loading the demo...",
    redirect: "/poc.html",
  });
});

/**
 * GET /waitlist/count
 * Public: returns total signup count (for social proof on landing page)
 */
app.get("/waitlist/count", (req, res) => {
  const row = db.prepare("SELECT COUNT(*) as cnt FROM signups").get();
  res.json({ count: row?.cnt || 0 });
});

/**
 * GET /waitlist/admin
 * Admin: full signup list (requires X-Admin-Key header or ?key= param)
 */
app.get("/waitlist/admin", adminAuth, (req, res) => {
  const signups = db.prepare("SELECT id, email, name, brand_name, brand_tier, source, created_at FROM signups ORDER BY created_at DESC").all();
  const count   = signups.length;
  const bySource = signups.reduce((acc, s) => {
    acc[s.source || "unknown"] = (acc[s.source || "unknown"] || 0) + 1;
    return acc;
  }, {});
  const byTier = signups.reduce((acc, s) => {
    if (s.brand_tier) {
      acc[s.brand_tier] = (acc[s.brand_tier] || 0) + 1;
    }
    return acc;
  }, {});

  res.json({ total: count, by_source: bySource, by_tier: byTier, signups });
});

/**
 * GET /waitlist/admin/csv
 * Export signups as CSV
 */
app.get("/waitlist/admin/csv", adminAuth, (req, res) => {
  const signups = db.prepare("SELECT * FROM signups ORDER BY created_at DESC").all();
  const headers = ["id", "email", "name", "brand_name", "brand_tier", "source", "created_at"];
  const csv = [
    headers.join(","),
    ...signups.map(s => headers.map(h => JSON.stringify(s[h] || "")).join(",")),
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=adoraads-waitlist.csv");
  res.send(csv);
});

/**
 * GET /health
 */
app.get("/health", (_, res) => {
  const count = db.prepare("SELECT COUNT(*) as cnt FROM signups").get()?.cnt || 0;
  res.json({ status: "ok", signups: count, server: "adoraads-waitlist", version: "1.0.0" });
});

// ═══════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`\n🌸 adoraads.ai waitlist server → http://localhost:${PORT}`);
  console.log("   POST /waitlist          — capture signups");
  console.log("   GET  /waitlist/count    — public count");
  console.log("   GET  /waitlist/admin    — admin view (X-Admin-Key header)");
  console.log("   GET  /waitlist/admin/csv — export CSV");
  console.log(`\n   Admin key: ${process.env.ADMIN_KEY || "adoraads-admin-2025"}`);
  console.log("   Set SLACK_WEBHOOK_URL, MAILCHIMP_API_KEY, RESEND_API_KEY in .env\n");
});
