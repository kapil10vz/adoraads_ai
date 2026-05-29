/*
 Beauty MCP Ad Network — browser port of the Python POC.
 Pure ES2017, no dependencies, no build step. Loads from file:// or any static host.

 Includes:
   - Inline catalog (3 brands, 30 SKUs) and campaigns (4 active)
   - Relevance scoring + generalized second-price auction
   - Ledger that accumulates impressions/clicks/purchases
   - Reporting that matches the Python reference numbers

 Renders into the DOM in poc.html.
*/
(function () {
  "use strict";

  // ===================================================================
  // 1. CATALOG + CAMPAIGNS (inline so the page works from file://).
  // ===================================================================
  const CATALOG = {
    brands: {
      luma_glow:       { id: "luma_glow",       name: "Luma Glow",       positioning: "Dermatologist-developed skincare with clinical actives", price_tier: "prestige",  category_focus: ["skincare"] },
      velvet_noir:     { id: "velvet_noir",     name: "Velvet Noir",     positioning: "High-pigment color cosmetics with editorial finish",     price_tier: "premium",   category_focus: ["color_cosmetics"] },
      aurora_botanica: { id: "aurora_botanica", name: "Aurora Botanica", positioning: "Clean, plant-derived beauty with traceable sourcing",     price_tier: "masstige",  category_focus: ["skincare","fragrance","haircare"] },
    },
    products: [
      {sku:"LG-001",brand_id:"luma_glow",name:"Niacinamide 10% Brightening Serum",category:"skincare",subcategory:"serum",price:38.00,rating:4.7,review_count:2840,tags:["brightening","oily-skin","fragrance-free"],ingredients_highlight:["niacinamide","zinc"],in_stock:true},
      {sku:"LG-002",brand_id:"luma_glow",name:"Retinol 0.3% Renewal Night Cream",category:"skincare",subcategory:"moisturizer",price:62.00,rating:4.6,review_count:1530,tags:["anti-aging","night","retinol"],ingredients_highlight:["retinol","squalane"],in_stock:true},
      {sku:"LG-003",brand_id:"luma_glow",name:"Vitamin C 15% Antioxidant Serum",category:"skincare",subcategory:"serum",price:54.00,rating:4.8,review_count:3210,tags:["brightening","antioxidant","vegan"],ingredients_highlight:["l-ascorbic acid","ferulic acid"],in_stock:true},
      {sku:"LG-004",brand_id:"luma_glow",name:"Hyaluronic Acid Hydration Booster",category:"skincare",subcategory:"serum",price:32.00,rating:4.5,review_count:1820,tags:["hydration","sensitive-skin"],ingredients_highlight:["hyaluronic acid","panthenol"],in_stock:true},
      {sku:"LG-005",brand_id:"luma_glow",name:"Mineral SPF 50 Daily Sunscreen",category:"skincare",subcategory:"sunscreen",price:36.00,rating:4.4,review_count:940,tags:["spf","mineral","reef-safe"],ingredients_highlight:["zinc oxide"],in_stock:true},
      {sku:"LG-006",brand_id:"luma_glow",name:"Gentle Foaming Cleanser",category:"skincare",subcategory:"cleanser",price:28.00,rating:4.6,review_count:2110,tags:["sensitive-skin","fragrance-free"],ingredients_highlight:["ceramides"],in_stock:true},
      {sku:"LG-007",brand_id:"luma_glow",name:"Peptide Eye Repair Cream",category:"skincare",subcategory:"eye-care",price:48.00,rating:4.3,review_count:680,tags:["anti-aging","eye"],ingredients_highlight:["peptides","caffeine"],in_stock:true},
      {sku:"LG-008",brand_id:"luma_glow",name:"Glycolic 8% Resurfacing Toner",category:"skincare",subcategory:"toner",price:30.00,rating:4.5,review_count:1240,tags:["exfoliating","texture"],ingredients_highlight:["glycolic acid"],in_stock:true},
      {sku:"LG-009",brand_id:"luma_glow",name:"Ceramide Barrier Repair Moisturizer",category:"skincare",subcategory:"moisturizer",price:44.00,rating:4.7,review_count:1560,tags:["barrier","sensitive-skin"],ingredients_highlight:["ceramides","cholesterol"],in_stock:true},
      {sku:"LG-010",brand_id:"luma_glow",name:"Azelaic Acid 10% Calming Treatment",category:"skincare",subcategory:"treatment",price:42.00,rating:4.6,review_count:870,tags:["redness","blemish","sensitive-skin"],ingredients_highlight:["azelaic acid"],in_stock:true},

      {sku:"VN-001",brand_id:"velvet_noir",name:"Velvet Matte Lipstick – Rouge Atelier",category:"color_cosmetics",subcategory:"lipstick",price:32.00,rating:4.6,review_count:1990,tags:["matte","long-wear","red"],ingredients_highlight:["jojoba oil"],in_stock:true},
      {sku:"VN-002",brand_id:"velvet_noir",name:"Liquid Eyeliner – Onyx Precision",category:"color_cosmetics",subcategory:"eyeliner",price:26.00,rating:4.5,review_count:1320,tags:["liquid","waterproof"],ingredients_highlight:[],in_stock:true},
      {sku:"VN-003",brand_id:"velvet_noir",name:"Volumizing Mascara – Black Noir",category:"color_cosmetics",subcategory:"mascara",price:28.00,rating:4.4,review_count:2470,tags:["volume","smudge-proof"],ingredients_highlight:[],in_stock:true},
      {sku:"VN-004",brand_id:"velvet_noir",name:"Editorial Eyeshadow Palette – Nocturne",category:"color_cosmetics",subcategory:"eyeshadow",price:58.00,rating:4.7,review_count:980,tags:["palette","smoky"],ingredients_highlight:[],in_stock:true},
      {sku:"VN-005",brand_id:"velvet_noir",name:"Sculpting Contour Stick – Bronze",category:"color_cosmetics",subcategory:"contour",price:34.00,rating:4.3,review_count:540,tags:["contour","creamy"],ingredients_highlight:[],in_stock:true},
      {sku:"VN-006",brand_id:"velvet_noir",name:"Silk Foundation – Shade 12W",category:"color_cosmetics",subcategory:"foundation",price:48.00,rating:4.5,review_count:1850,tags:["foundation","medium-coverage"],ingredients_highlight:["squalane"],in_stock:true},
      {sku:"VN-007",brand_id:"velvet_noir",name:"Cheek Tint – Petal Flush",category:"color_cosmetics",subcategory:"blush",price:30.00,rating:4.6,review_count:760,tags:["liquid-blush","buildable"],ingredients_highlight:[],in_stock:true},
      {sku:"VN-008",brand_id:"velvet_noir",name:"Glass Lip Gloss – Champagne",category:"color_cosmetics",subcategory:"lipgloss",price:24.00,rating:4.4,review_count:1110,tags:["gloss","shimmer"],ingredients_highlight:["vitamin E"],in_stock:true},
      {sku:"VN-009",brand_id:"velvet_noir",name:"Brow Definer Pencil – Espresso",category:"color_cosmetics",subcategory:"brow",price:22.00,rating:4.5,review_count:880,tags:["brow","ultra-fine"],ingredients_highlight:[],in_stock:true},
      {sku:"VN-010",brand_id:"velvet_noir",name:"Setting Powder – Translucent",category:"color_cosmetics",subcategory:"powder",price:36.00,rating:4.6,review_count:1420,tags:["setting","soft-focus"],ingredients_highlight:[],in_stock:true},

      {sku:"AB-001",brand_id:"aurora_botanica",name:"Rosehip + Bakuchiol Glow Oil",category:"skincare",subcategory:"face-oil",price:46.00,rating:4.6,review_count:1220,tags:["clean-beauty","vegan","anti-aging"],ingredients_highlight:["bakuchiol","rosehip oil"],in_stock:true},
      {sku:"AB-002",brand_id:"aurora_botanica",name:"Botanical Lip Balm – Honeycomb",category:"skincare",subcategory:"lip-care",price:16.00,rating:4.7,review_count:2630,tags:["clean-beauty","balm"],ingredients_highlight:["beeswax","shea"],in_stock:true},
      {sku:"AB-003",brand_id:"aurora_botanica",name:"Rose Hydration Face Mist",category:"skincare",subcategory:"mist",price:28.00,rating:4.4,review_count:940,tags:["mist","hydration","clean-beauty"],ingredients_highlight:["rose water","aloe"],in_stock:true},
      {sku:"AB-004",brand_id:"aurora_botanica",name:"Adaptogen Calm Body Lotion",category:"skincare",subcategory:"body",price:34.00,rating:4.5,review_count:410,tags:["body","clean-beauty"],ingredients_highlight:["ashwagandha","shea"],in_stock:true},
      {sku:"AB-005",brand_id:"aurora_botanica",name:"Sea Salt Texturizing Hair Spray",category:"haircare",subcategory:"styling",price:26.00,rating:4.3,review_count:510,tags:["texture","beachy"],ingredients_highlight:["sea salt","aloe"],in_stock:true},
      {sku:"AB-006",brand_id:"aurora_botanica",name:"Argan Repair Hair Mask",category:"haircare",subcategory:"treatment",price:38.00,rating:4.6,review_count:720,tags:["repair","deep-condition"],ingredients_highlight:["argan oil"],in_stock:true},
      {sku:"AB-007",brand_id:"aurora_botanica",name:"Cedarwood + Citrus Eau de Parfum",category:"fragrance",subcategory:"perfume",price:78.00,rating:4.5,review_count:320,tags:["unisex","woody","citrus"],ingredients_highlight:["cedarwood","bergamot"],in_stock:true},
      {sku:"AB-008",brand_id:"aurora_botanica",name:"Jasmine Night Bloom Eau de Toilette",category:"fragrance",subcategory:"perfume",price:64.00,rating:4.4,review_count:290,tags:["floral","evening"],ingredients_highlight:["jasmine absolute"],in_stock:true},
      {sku:"AB-009",brand_id:"aurora_botanica",name:"Charcoal + Clay Detox Mask",category:"skincare",subcategory:"mask",price:32.00,rating:4.5,review_count:860,tags:["mask","detox","oily-skin"],ingredients_highlight:["charcoal","kaolin"],in_stock:true},
      {sku:"AB-010",brand_id:"aurora_botanica",name:"Probiotic Gentle Cleanser",category:"skincare",subcategory:"cleanser",price:30.00,rating:4.6,review_count:1080,tags:["clean-beauty","gentle"],ingredients_highlight:["lactobacillus ferment"],in_stock:true},
    ],
  };

  const SEED_CAMPAIGNS = [
    { campaign_id:"cmp_lg_brightening", brand_id:"luma_glow",       name:"Brightening Hero Launch",     skus:["LG-001","LG-003"],
      target_keywords:["brightening","vitamin c","dark spots","glow","uneven skin"], target_categories:["skincare"],
      bid_cpc_usd:1.85, daily_budget_usd:250.00, spend_today_usd:0.0, status:"active",
      creative_hook:"Clinically proven brightening from dermatologist-developed Luma Glow." },
    { campaign_id:"cmp_vn_lip", brand_id:"velvet_noir",  name:"Velvet Matte Lip Season", skus:["VN-001","VN-008"],
      target_keywords:["lipstick","matte","red lip","lip gloss","long-wear"], target_categories:["color_cosmetics"],
      bid_cpc_usd:2.10, daily_budget_usd:180.00, spend_today_usd:0.0, status:"active",
      creative_hook:"Editorial-grade pigment. 12-hour wear. Velvet Noir." },
    { campaign_id:"cmp_ab_clean", brand_id:"aurora_botanica", name:"Clean Beauty Discovery", skus:["AB-001","AB-002","AB-010"],
      target_keywords:["clean beauty","natural","vegan","bakuchiol","gentle"], target_categories:["skincare"],
      bid_cpc_usd:1.40, daily_budget_usd:150.00, spend_today_usd:0.0, status:"active",
      creative_hook:"Traceably sourced, plant-derived beauty from Aurora Botanica." },
    { campaign_id:"cmp_vn_winter", brand_id:"velvet_noir", name:"Winter Color Drop", skus:["VN-004","VN-001"],
      target_keywords:["eyeshadow","smoky","matte","lipstick"], target_categories:["color_cosmetics"],
      bid_cpc_usd:1.75, daily_budget_usd:120.00, spend_today_usd:0.0, status:"active",
      creative_hook:"Editorial Nocturne palette + Rouge Atelier. Velvet Noir." },
  ];

  // ===================================================================
  // 2. STATE
  // ===================================================================
  const state = {
    campaigns: JSON.parse(JSON.stringify(SEED_CAMPAIGNS)),
    ledger:    { events: [] },
    cart:      [],
    shopperId: "shopper_demo",
    lastAuctionExplain: null,
  };

  function resetAll() {
    state.campaigns = JSON.parse(JSON.stringify(SEED_CAMPAIGNS));
    state.ledger    = { events: [] };
    state.cart      = [];
    state.lastAuctionExplain = null;
  }

  // ===================================================================
  // 3. CORE (relevance, auction, ledger)
  // ===================================================================
  function tokenize(s) {
    return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  }

  function relevance(p, qt) {
    const name = new Set(tokenize(p.name));
    const tags = new Set((p.tags || []).map(t => t.toLowerCase()));
    const ings = new Set((p.ingredients_highlight || []).map(t => t.toLowerCase()));
    const cats = new Set([p.category || "", p.subcategory || ""].map(c => c.toLowerCase()));
    let hits = 0;
    for (const q of qt) {
      if (name.has(q)) hits += 3.0;
      if (tags.has(q)) hits += 2.0;
      if (ings.has(q)) hits += 2.0;
      if (cats.has(q)) hits += 1.5;
    }
    if (hits === 0) return 0;
    const quality = Math.log10(Math.max(p.review_count || 1, 1) + 1) * (p.rating || 4.0) / 5.0;
    return hits + quality;
  }

  function searchProducts(query, category, limit) {
    limit = limit || 5;
    const qt = tokenize(query);
    let pool = CATALOG.products;
    if (category) pool = pool.filter(p => p.category === category);
    const scored = [];
    for (const p of pool) {
      let score;
      if (qt.length) {
        score = relevance(p, qt);
        if (score <= 0) continue;
      } else {
        score = Math.log10((p.review_count || 1) + 1) * (p.rating || 4.0);
      }
      scored.push({ score, p });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(x => enrich(x.p));
  }

  function enrich(p) {
    const brand = CATALOG.brands[p.brand_id] || {};
    return Object.assign({}, p, { brand_name: brand.name || p.brand_id, brand_positioning: brand.positioning || "" });
  }

  function getProduct(sku) {
    const p = CATALOG.products.find(x => x.sku === sku);
    return p ? enrich(p) : null;
  }

  function eligible(c, qt, category) {
    if (c.status !== "active") return false;
    if (c.spend_today_usd >= c.daily_budget_usd) return false;
    if (category && !(c.target_categories || []).includes(category)) return false;
    if (qt.length) {
      const kws = new Set(tokenize((c.target_keywords || []).join(" ")));
      let hit = false;
      for (const q of qt) if (kws.has(q)) { hit = true; break; }
      if (!hit) return false;
    }
    return true;
  }

  function runAuction(query, category, slots) {
    slots = slots || 2;
    const qt = tokenize(query);
    const pool = [];
    for (const c of state.campaigns) {
      if (!eligible(c, qt, category)) continue;
      for (const sku of c.skus) {
        const product = CATALOG.products.find(p => p.sku === sku);
        if (!product || !product.in_stock) continue;
        let r = qt.length ? relevance(product, qt) : 1.0;
        if (r <= 0) r = 0.5;
        pool.push({
          sku, brand_id: c.brand_id, campaign_id: c.campaign_id, creative_hook: c.creative_hook,
          bid: c.bid_cpc_usd, relevance: r, rank_score: c.bid_cpc_usd * r,
        });
      }
    }
    pool.sort((a, b) => b.rank_score - a.rank_score);

    const winners = [];
    for (let i = 0; i < Math.min(slots, pool.length); i++) {
      const w = pool[i];
      const ru = pool[i + 1];
      let cleared;
      if (ru) cleared = Math.min((ru.rank_score / Math.max(w.relevance, 0.01)) + 0.01, w.bid);
      else    cleared = Math.max(w.bid * 0.5, 0.20);
      winners.push({
        sku: w.sku, brand_id: w.brand_id, campaign_id: w.campaign_id, creative_hook: w.creative_hook,
        winning_bid_cpc: round2(w.bid), cleared_cpc: round2(cleared),
        relevance: round3(w.relevance), rank_score: round3(w.rank_score),
      });
    }
    // Explain trace for the UI
    state.lastAuctionExplain = {
      query, category, qt,
      ranked: pool.map(x => ({ ...x, rank_score: round3(x.rank_score), relevance: round3(x.relevance) })),
      winners,
    };
    return winners;
  }

  function getSponsoredPlacements(query, category, slots) {
    const auction = runAuction(query, category, slots);
    const placements = auction.map((res, i) => {
      logEvent("impression", { campaign_id: res.campaign_id, brand_id: res.brand_id, sku: res.sku, shopper_id: state.shopperId, query, slot: i + 1 });
      return {
        slot: i + 1, sponsored: true, disclosure: "Sponsored — paid placement",
        sku: res.sku, brand_id: res.brand_id, campaign_id: res.campaign_id,
        product: getProduct(res.sku), creative_hook: res.creative_hook,
        auction_info: { bid_cpc_usd: res.winning_bid_cpc, cleared_cpc_usd: res.cleared_cpc, relevance: res.relevance, rank_score: res.rank_score },
      };
    });
    return { query, category, placements };
  }

  function logEvent(kind, fields) {
    const evt = Object.assign({ event_id: "evt_" + Math.random().toString(36).slice(2, 12), kind, ts: new Date().toISOString() }, fields);
    state.ledger.events.push(evt);
    if (kind === "click" && fields.campaign_id && fields.cleared_cpc != null) {
      const c = state.campaigns.find(x => x.campaign_id === fields.campaign_id);
      if (c) {
        c.spend_today_usd = round2(c.spend_today_usd + Number(fields.cleared_cpc));
        if (c.spend_today_usd >= c.daily_budget_usd) c.status_note = "paused_for_budget";
      }
    }
    return evt;
  }

  function logClick(campaign_id, sku) {
    const c = state.campaigns.find(x => x.campaign_id === campaign_id);
    if (!c) return { error: "campaign not found" };
    const last = state.lastAuctionExplain && state.lastAuctionExplain.winners.find(w => w.campaign_id === campaign_id && w.sku === sku);
    const cleared = last ? last.cleared_cpc : round2(c.bid_cpc_usd * 0.85);
    const evt = logEvent("click", { campaign_id, sku, brand_id: c.brand_id, shopper_id: state.shopperId, cleared_cpc: cleared });
    return { logged: true, event: evt, cleared_cpc_usd: cleared };
  }

  function addToCart(sku, qty, campaign_id) {
    qty = qty || 1;
    const p = getProduct(sku);
    if (!p) return { error: "sku not found" };
    state.cart.push({ sku, qty, price: p.price, brand_id: p.brand_id, campaign_id: campaign_id || null, name: p.name, brand_name: p.brand_name });
    logEvent("add_to_cart", { shopper_id: state.shopperId, sku, brand_id: p.brand_id, campaign_id: campaign_id || null, qty });
    return state.cart;
  }

  function checkout() {
    if (!state.cart.length) return { error: "cart is empty" };
    const total = round2(state.cart.reduce((a, it) => a + it.qty * it.price, 0));
    const order_id = "ord_" + Math.random().toString(36).slice(2, 8);
    for (const it of state.cart) {
      logEvent("purchase", { shopper_id: state.shopperId, sku: it.sku, brand_id: it.brand_id, campaign_id: it.campaign_id, qty: it.qty, order_value: round2(it.qty * it.price), order_id });
    }
    const cart = state.cart;
    state.cart = [];
    return { order_id, total_usd: total, items: cart };
  }

  // ----- Brand-side -----
  function campaignPerformance(campaign_id) {
    const c = state.campaigns.find(x => x.campaign_id === campaign_id);
    if (!c) return { error: "campaign not found" };
    const evs = state.ledger.events.filter(e => e.campaign_id === campaign_id);
    const imps = evs.filter(e => e.kind === "impression");
    const clks = evs.filter(e => e.kind === "click");
    const purs = evs.filter(e => e.kind === "purchase");
    const spend = round2(clks.reduce((a, e) => a + Number(e.cleared_cpc || 0), 0));
    const revenue = round2(purs.reduce((a, e) => a + Number(e.order_value || 0), 0));
    return {
      campaign_id, name: c.name, status: c.status,
      impressions: imps.length, clicks: clks.length, purchases: purs.length,
      ctr: imps.length ? round4(clks.length / imps.length) : 0,
      cvr: clks.length ? round4(purs.length / clks.length) : 0,
      spend_usd: spend, revenue_usd: revenue,
      roas: spend ? round2(revenue / spend) : 0,
      spend_today_usd: c.spend_today_usd, daily_budget_usd: c.daily_budget_usd,
      bid_cpc_usd: c.bid_cpc_usd, brand_id: c.brand_id, brand_name: CATALOG.brands[c.brand_id].name,
    };
  }

  function setBid(campaign_id, bid) {
    const c = state.campaigns.find(x => x.campaign_id === campaign_id);
    if (!c) return { error: "campaign not found" };
    c.bid_cpc_usd = round2(Number(bid));
    return c;
  }

  function forecastBid(campaign_id, hypBid, queries) {
    const c = state.campaigns.find(x => x.campaign_id === campaign_id);
    if (!c) return { error: "campaign not found" };
    const orig = c.bid_cpc_usd;
    c.bid_cpc_usd = round2(Number(hypBid));
    const results = []; let wins = 0; let total = 0;
    for (const q of queries) {
      const auction = runAuction(q, null, 1);
      const win = auction.length && auction[0].campaign_id === campaign_id;
      if (win) { wins++; total += auction[0].cleared_cpc; }
      results.push({
        query: q, won_top_slot: !!win,
        winning_campaign_id: auction.length ? auction[0].campaign_id : null,
        winning_brand: auction.length ? CATALOG.brands[auction[0].brand_id].name : null,
        cleared_cpc_usd: win ? auction[0].cleared_cpc : null,
      });
    }
    c.bid_cpc_usd = orig; // restore — forecast is non-destructive
    return { campaign_id, hypothetical_bid_cpc_usd: round2(Number(hypBid)),
             queries_tested: queries.length, wins, win_rate: queries.length ? round2(wins / queries.length) : 0,
             avg_cleared_cpc_usd: wins ? round2(total / wins) : null, per_query: results };
  }

  // ----- numerics -----
  function round2(x) { return Math.round(x * 100) / 100; }
  function round3(x) { return Math.round(x * 1000) / 1000; }
  function round4(x) { return Math.round(x * 10000) / 10000; }

  // ===================================================================
  // 4. UI
  // ===================================================================
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.startsWith("on") && typeof attrs[k] === "function") e.addEventListener(k.slice(2), attrs[k]);
      else if (k === "dataset") for (const dk in attrs[k]) e.dataset[dk] = attrs[k][dk];
      else e.setAttribute(k, attrs[k]);
    }
    if (children) for (const c of [].concat(children)) {
      if (c == null) continue;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return e;
  }
  function money(n) { return "$" + Number(n).toFixed(2); }

  // ---------- Shopper view ----------
  function renderShopperResults(query, category) {
    const organicWrap = $("#organic-results");
    const sponsoredWrap = $("#sponsored-results");
    organicWrap.innerHTML = "";
    sponsoredWrap.innerHTML = "";

    const sponsored = getSponsoredPlacements(query, category || null, 2);
    if (!sponsored.placements.length) {
      sponsoredWrap.appendChild(el("div", { class: "muted small" }, "No eligible sponsored placements for this query."));
    } else {
      for (const pl of sponsored.placements) {
        sponsoredWrap.appendChild(renderSponsoredCard(pl));
      }
    }

    const organic = searchProducts(query, category || null, 6);
    if (!organic.length) {
      organicWrap.appendChild(el("div", { class: "muted small" }, "No organic matches. Try a broader query."));
    } else {
      for (const p of organic) organicWrap.appendChild(renderOrganicCard(p));
    }

    renderAuctionExplain();
    renderCart();
  }

  function renderSponsoredCard(pl) {
    const p = pl.product;
    const card = el("div", { class: "card sponsored" }, [
      el("div", { class: "disclosure" }, [
        el("span", { class: "dot" }),
        "Sponsored · paid placement"
      ]),
      el("div", { class: "card-head" }, [
        el("div", { class: "brand" }, p.brand_name),
        el("div", { class: "price" }, money(p.price)),
      ]),
      el("div", { class: "name" }, p.name),
      el("div", { class: "meta" }, "★ " + p.rating + "  ·  " + p.review_count.toLocaleString() + " reviews  ·  slot " + pl.slot),
      el("div", { class: "hook" }, pl.creative_hook),
      el("div", { class: "auction-row" }, [
        chip("bid " + money(pl.auction_info.bid_cpc_usd)),
        chip("cleared " + money(pl.auction_info.cleared_cpc_usd)),
        chip("relevance " + pl.auction_info.relevance),
      ]),
      el("div", { class: "actions" }, [
        el("button", { class: "btn ghost", onclick: () => { logClick(pl.campaign_id, pl.sku); flash("Click logged. Campaign charged " + money(pl.auction_info.cleared_cpc_usd) + "."); refreshAll(); } }, "Log click"),
        el("button", { class: "btn primary", onclick: () => { logClick(pl.campaign_id, pl.sku); addToCart(pl.sku, 1, pl.campaign_id); flash("Added " + p.name + " to cart (attributed to " + pl.campaign_id + ")."); refreshAll(); } }, "Add to cart"),
      ]),
    ]);
    return card;
  }

  function renderOrganicCard(p) {
    return el("div", { class: "card organic" }, [
      el("div", { class: "card-head" }, [ el("div", { class: "brand" }, p.brand_name), el("div", { class: "price" }, money(p.price)) ]),
      el("div", { class: "name" }, p.name),
      el("div", { class: "meta" }, "★ " + p.rating + "  ·  " + p.review_count.toLocaleString() + " reviews  ·  " + p.category),
      el("div", { class: "actions" }, [
        el("button", { class: "btn ghost", onclick: () => { addToCart(p.sku, 1, null); flash("Added " + p.name + " to cart (organic, unattributed)."); refreshAll(); } }, "Add to cart"),
      ]),
    ]);
  }

  function chip(text) { return el("span", { class: "chip" }, text); }

  function renderAuctionExplain() {
    const box = $("#auction-explain");
    box.innerHTML = "";
    const ae = state.lastAuctionExplain;
    if (!ae || !ae.ranked.length) {
      box.appendChild(el("div", { class: "muted small" }, "Run a search above to see the auction in action."));
      return;
    }
    box.appendChild(el("div", { class: "explain-head" }, "Auction trace — query: \"" + ae.query + "\""));
    const table = el("table", { class: "trace" }, []);
    table.appendChild(el("thead", null, el("tr", null, [
      th("rank"), th("campaign"), th("brand"), th("sku"), th("bid"), th("relevance"), th("rank score"), th("won"),
    ])));
    const tbody = el("tbody");
    ae.ranked.forEach((r, i) => {
      const won = ae.winners.some(w => w.campaign_id === r.campaign_id && w.sku === r.sku);
      tbody.appendChild(el("tr", { class: won ? "won" : "" }, [
        td(String(i + 1)),
        td(r.campaign_id),
        td(CATALOG.brands[r.brand_id].name),
        td(r.sku),
        td(money(r.bid)),
        td(String(r.relevance)),
        td(String(r.rank_score)),
        td(won ? "★" : ""),
      ]));
    });
    table.appendChild(tbody);
    box.appendChild(table);
    box.appendChild(el("div", { class: "muted small explain-foot" }, "Cleared CPC for the winner = (runner-up.rank_score / winner.relevance) + $0.01, capped at the winner's bid."));
  }

  function th(t) { return el("th", null, t); }
  function td(t) { return el("td", null, t); }

  function renderCart() {
    const box = $("#cart");
    box.innerHTML = "";
    if (!state.cart.length) {
      box.appendChild(el("div", { class: "muted small" }, "Cart is empty."));
      return;
    }
    let total = 0;
    state.cart.forEach((it) => {
      total += it.qty * it.price;
      box.appendChild(el("div", { class: "cart-row" }, [
        el("div", null, [ el("div", { class: "name" }, it.name), el("div", { class: "muted small" }, it.brand_name + (it.campaign_id ? " · attributed to " + it.campaign_id : " · organic")) ]),
        el("div", null, money(it.qty * it.price)),
      ]));
    });
    box.appendChild(el("div", { class: "cart-total" }, "Subtotal " + money(total)));
    box.appendChild(el("button", { class: "btn primary full", onclick: () => {
      const r = checkout();
      flash("Order " + r.order_id + " placed — " + money(r.total_usd) + ". Purchase events recorded for ROAS.");
      refreshAll();
    } }, "Checkout"));
  }

  // ---------- Brand view ----------
  function renderBrand() {
    const wrap = $("#brand-campaigns");
    wrap.innerHTML = "";
    for (const c of state.campaigns) {
      const perf = campaignPerformance(c.campaign_id);
      wrap.appendChild(renderCampaignCard(c, perf));
    }
    renderLedgerSummary();
  }

  function renderCampaignCard(c, perf) {
    const card = el("div", { class: "card brand-card" }, []);
    card.appendChild(el("div", { class: "brand-tag brand-tag-" + c.brand_id }, perf.brand_name));
    card.appendChild(el("div", { class: "name" }, c.name));
    card.appendChild(el("div", { class: "muted small" }, c.creative_hook));

    const stats = el("div", { class: "stat-grid" }, [
      stat("Impressions", String(perf.impressions)),
      stat("Clicks", String(perf.clicks)),
      stat("Purchases", String(perf.purchases)),
      stat("Spend", money(perf.spend_usd)),
      stat("Revenue", money(perf.revenue_usd)),
      stat("ROAS", perf.roas ? (perf.roas + "x") : "—"),
    ]);
    card.appendChild(stats);

    const bidLabel = el("label", { class: "bid-control" }, [
      el("span", { class: "muted small" }, "Bid CPC"),
      (function () {
        const inp = el("input", { type: "number", step: "0.05", min: "0.20", value: c.bid_cpc_usd.toFixed(2) });
        inp.addEventListener("change", () => {
          setBid(c.campaign_id, Number(inp.value));
          flash("Bid for " + c.name + " set to " + money(Number(inp.value)) + ".");
          renderBrand();
          renderAuctionExplain();
        });
        return inp;
      })(),
    ]);
    card.appendChild(bidLabel);

    card.appendChild(el("div", { class: "actions" }, [
      el("button", { class: "btn ghost", onclick: () => runForecast(c.campaign_id) }, "Forecast at +25%"),
      el("button", { class: "btn ghost", onclick: () => { c.status = c.status === "active" ? "paused" : "active"; flash(c.name + " is now " + c.status + "."); renderBrand(); } },
        c.status === "active" ? "Pause" : "Resume"),
    ]));

    return card;
  }

  function stat(label, value) {
    return el("div", { class: "stat" }, [ el("div", { class: "stat-val" }, value), el("div", { class: "stat-label" }, label) ]);
  }

  function runForecast(campaign_id) {
    const c = state.campaigns.find(x => x.campaign_id === campaign_id);
    if (!c) return;
    const queries = (c.target_keywords || []).slice(0, 3);
    const f = forecastBid(campaign_id, round2(c.bid_cpc_usd * 1.25), queries);
    const lines = [
      "Forecast for " + c.name + " at bid " + money(f.hypothetical_bid_cpc_usd) + " (non-destructive):",
      "  win rate: " + (f.win_rate * 100).toFixed(0) + "% across " + f.queries_tested + " queries",
      f.avg_cleared_cpc_usd != null ? "  avg cleared CPC: " + money(f.avg_cleared_cpc_usd) : "  no wins at this bid",
    ];
    for (const r of f.per_query) {
      lines.push("  · \"" + r.query + "\" → " + (r.won_top_slot ? "WIN" : "loss to " + (r.winning_brand || "no eligible")));
    }
    $("#brand-forecast").textContent = lines.join("\n");
  }

  function renderLedgerSummary() {
    const box = $("#brand-ledger");
    box.innerHTML = "";
    if (!state.ledger.events.length) {
      box.appendChild(el("div", { class: "muted small" }, "No events yet. Run a shopper search to populate the ledger."));
      return;
    }
    const list = state.ledger.events.slice(-12).reverse();
    for (const e of list) {
      const dot = el("span", { class: "evt-dot evt-" + e.kind });
      const text = `${e.kind} · ${e.sku || ""} ${e.campaign_id ? "· " + e.campaign_id : ""} ${e.cleared_cpc != null ? "· " + money(e.cleared_cpc) : ""} ${e.order_value != null ? "· " + money(e.order_value) : ""}`;
      box.appendChild(el("div", { class: "evt-row" }, [dot, el("span", null, text)]));
    }
  }

  // ---------- Plumbing ----------
  function refreshAll() {
    if (state.lastAuctionExplain) {
      renderAuctionExplain();
    }
    renderCart();
    renderBrand();
  }

  let flashTimer = null;
  function flash(msg) {
    const box = $("#toast");
    box.textContent = msg;
    box.classList.add("show");
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => box.classList.remove("show"), 3200);
  }

  function bindUI() {
    $("#search-btn").addEventListener("click", () => {
      const q = $("#search-input").value.trim();
      const cat = $("#category-select").value;
      if (!q) { flash("Type a query first — try 'brightening vitamin c'."); return; }
      renderShopperResults(q, cat);
    });
    $("#search-input").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#search-btn").click(); });
    $$(".preset").forEach(b => b.addEventListener("click", () => {
      $("#search-input").value = b.dataset.q;
      $("#category-select").value = b.dataset.cat || "";
      $("#search-btn").click();
    }));
    $("#reset-btn").addEventListener("click", () => {
      resetAll();
      $("#organic-results").innerHTML = "";
      $("#sponsored-results").innerHTML = "";
      $("#auction-explain").innerHTML = "";
      $("#brand-forecast").textContent = "";
      renderCart();
      renderBrand();
      flash("State reset.");
    });
    $$(".tab").forEach(t => t.addEventListener("click", () => {
      const target = t.dataset.tab;
      $$(".tab").forEach(x => x.classList.toggle("active", x === t));
      $$(".tab-panel").forEach(p => p.classList.toggle("active", p.id === "panel-" + target));
    }));
  }

  function init() {
    bindUI();
    renderBrand();
    renderAuctionExplain();
    renderCart();
  }

  // Expose for the headless QA harness.
  window.__BMCP__ = { runAuction, searchProducts, getSponsoredPlacements, logClick, addToCart, checkout, campaignPerformance, forecastBid, state };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
