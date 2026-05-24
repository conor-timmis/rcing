const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const DEFAULT_STORE = {
  users: [],
  issues: [],
  nextUserId: 1,
  nextIssueId: 1,
};

let cache = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadStore() {
  if (cache) return cache;

  ensureDataDir();
  if (!fs.existsSync(STORE_PATH)) {
    cache = structuredClone(DEFAULT_STORE);
    saveStore();
    return cache;
  }

  try {
    cache = normalizeStore(JSON.parse(fs.readFileSync(STORE_PATH, "utf8")));
    saveStore();
  } catch {
    cache = structuredClone(DEFAULT_STORE);
    saveStore();
  }

  return cache;
}

function normalizeStore(store) {
  store.users = (store.users ?? []).filter((user) => user.role === "admin");
  store.issues = (store.issues ?? [])
    .map((issue) => ({
      id: issue.id,
      name: issue.name ?? issue.username ?? "anonymous",
      body: issue.body ?? issue.title ?? "",
      createdAt: issue.createdAt ?? new Date().toISOString(),
    }))
    .filter((issue) => issue.body);
  store.nextUserId = store.nextUserId ?? 1;
  store.nextIssueId = store.nextIssueId ?? 1;
  return store;
}

function saveStore() {
  ensureDataDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(cache, null, 2));
}

function mutateStore(mutator) {
  const store = loadStore();
  const result = mutator(store);
  saveStore();
  return result;
}

function findUserByUsername(username) {
  const store = loadStore();
  const normalized = username.trim().toLowerCase();
  return store.users.find((user) => user.usernameLower === normalized) ?? null;
}

function findUserById(id) {
  const store = loadStore();
  return store.users.find((user) => user.id === id) ?? null;
}

function publicUser(user) {
  return {
    username: user.username,
    role: user.role,
  };
}

module.exports = {
  loadStore,
  mutateStore,
  findUserByUsername,
  findUserById,
  publicUser,
};
