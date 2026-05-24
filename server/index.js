const fs = require("fs");
const express = require("express");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key in process.env) continue;
    process.env[key] = trimmed.slice(eq + 1).trim();
  }
}
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const { router: authRouter, seedAdminUser } = require("./auth");
const { router: issuesRouter } = require("./issues");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "..", "data");
const SESSIONS_DIR = path.join(DATA_DIR, "sessions");
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

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

app.use(express.json());

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

app.use(
  session({
    store: new FileStore({
      path: SESSIONS_DIR,
      ttl: SESSION_MAX_AGE_MS / 1000,
      retries: 0,
    }),
    secret: process.env.SESSION_SECRET || "rcing-dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" ? "auto" : false,
      maxAge: SESSION_MAX_AGE_MS,
    },
  }),
);

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

app.use("/api/auth", authRouter);
app.use("/api/issues", issuesRouter);

app.get("/.well-known/discord", (_req, res) => {
  res.type("text/plain").send("dh=bc6d779eb639f1d2323c7d718dcc43260cf7ea7b");
});

const publicDir = path.join(__dirname, "..", "public");

const pages = {
  "/": "index.html",
  "/issues": "issues.html",
  "/login": "login.html",
  "/admin": "admin.html",
};

for (const [route, file] of Object.entries(pages)) {
  app.get(route, (_req, res) => {
    res.sendFile(path.join(publicDir, file));
  });
}

app.get("/issues.html", (_req, res) => res.redirect(301, "/issues"));
app.get("/login.html", (_req, res) => res.redirect(301, "/login"));
app.get("/admin.html", (_req, res) => res.redirect(301, "/admin"));
app.get("/index.html", (_req, res) => res.redirect(301, "/"));

app.use(express.static(publicDir));

seedAdminUser();

app.listen(PORT, () => {
  console.log(`rcing.net listening on http://localhost:${PORT}`);
  refreshPrices().catch((err) => console.error("Initial price refresh failed", err));
  setInterval(() => {
    refreshPrices().catch((err) => console.error("Scheduled price refresh failed", err));
  }, CACHE_TTL_MS);
});
