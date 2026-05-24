const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const WIKI_BASE = "https://prices.runescape.wiki/api/v1/osrs";
const USER_AGENT = "rcing.net - runecrafting resource site";

const CACHE_TTL_MS = 15 * 60_000;
let priceCache = { data: null, fetchedAt: 0 };
let refreshPromise = null;

async function fetchWiki(endpoint) {
  const res = await fetch(`${WIKI_BASE}/${endpoint}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Wiki API ${endpoint} returned ${res.status}`);
  }
  return res.json();
}

async function getPrices() {
  const now = Date.now();
  if (priceCache.data && now - priceCache.fetchedAt < CACHE_TTL_MS) {
    return priceCache.data;
  }

  return refreshPrices();
}

async function refreshPrices() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const now = Date.now();
    const [latest, day] = await Promise.all([
      fetchWiki("latest"),
      fetchWiki("24h"),
    ]);

    priceCache = {
      data: { latest: latest.data, day: day.data },
      fetchedAt: now,
    };
    return priceCache.data;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function midPrice(entry) {
  if (!entry) return null;
  const { high, low } = entry;
  if (high != null && low != null) return Math.round((high + low) / 2);
  return high ?? low ?? null;
}

app.get("/api/prices", async (_req, res) => {
  try {
    const { latest, day } = await getPrices();
    res.json({ latest, day, cachedAt: priceCache.fetchedAt });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to fetch prices from OSRS Wiki" });
  }
});

app.get("/api/prices/:id", async (req, res) => {
  try {
    const { latest, day } = await getPrices();
    const id = req.params.id;
    res.json({
      id,
      latest: latest[id] ?? null,
      day: day[id] ?? null,
      price: midPrice(latest[id]),
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to fetch price" });
  }
});

app.use(express.static(path.join(__dirname, "..", "public")));

app.listen(PORT, () => {
  console.log(`rcing.net listening on http://localhost:${PORT}`);
  refreshPrices().catch((err) => console.error("Initial price refresh failed", err));
  setInterval(() => {
    refreshPrices().catch((err) => console.error("Scheduled price refresh failed", err));
  }, CACHE_TTL_MS);
});
