const crypto = require("crypto");
const express = require("express");
const {
  mutateStore,
  findUserByUsername,
  findUserById,
  publicUser,
} = require("./store");

const router = express.Router();

const PASSWORD_KEYLEN = 64;

function hashPassword(password, salt = crypto.randomBytes(16)) {
  const hash = crypto.scryptSync(password, salt, PASSWORD_KEYLEN);
  return {
    salt: salt.toString("hex"),
    hash: hash.toString("hex"),
  };
}

function verifyPassword(password, saltHex, hashHex) {
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, salt, PASSWORD_KEYLEN);
  return crypto.timingSafeEqual(expected, actual);
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Login required." });
  }
  if (req.session.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

function seedAdminUser() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;

  mutateStore((store) => {
    if (store.users.length > 0) return null;

    const { salt, hash } = hashPassword(password);
    const user = {
      id: store.nextUserId++,
      username: username.trim(),
      usernameLower: username.trim().toLowerCase(),
      salt,
      passwordHash: hash,
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    return user;
  });
}

router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }

  const user = findUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.json({ user: null });
  }

  res.json({ user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const username = String(req.body.username ?? "");
  const password = String(req.body.password ?? "");

  const user = findUserByUsername(username);
  if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only." });
  }

  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.username = user.username;

  res.json({ user: publicUser(user) });
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Could not log out." });
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

module.exports = {
  router,
  requireAdmin,
  seedAdminUser,
};
