const express = require("express");
const { mutateStore, loadStore } = require("./store");
const { requireAdmin } = require("./auth");

const router = express.Router();

const NAME_MAX = 64;
const BODY_MIN = 10;
const BODY_MAX = 5000;

function publicIssue(issue) {
  return {
    id: issue.id,
    name: issue.name,
    body: issue.body,
    createdAt: issue.createdAt,
  };
}

function normalizeName(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "anonymous";
  return trimmed.slice(0, NAME_MAX);
}

router.get("/", requireAdmin, (_req, res) => {
  const store = loadStore();
  const issues = [...store.issues].sort((a, b) => b.id - a.id).map(publicIssue);
  res.json({ issues });
});

router.post("/", (req, res) => {
  const name = normalizeName(req.body.name);
  const body = String(req.body.body ?? "").trim();

  if (body.length < BODY_MIN || body.length > BODY_MAX) {
    return res.status(400).json({
      error: `Issue must be ${BODY_MIN}-${BODY_MAX} characters.`,
    });
  }

  const issue = mutateStore((store) => {
    const entry = {
      id: store.nextIssueId++,
      name,
      body,
      createdAt: new Date().toISOString(),
    };
    store.issues.push(entry);
    return entry;
  });

  res.status(201).json({ issue: publicIssue(issue) });
});

router.post("/:id/:action", requireAdmin, (req, res) => {
  const action = req.params.action;
  if (action !== "complete" && action !== "delete") {
    return res.status(404).json({ error: "Not found." });
  }

  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid issue id." });
  }

  const removed = mutateStore((store) => {
    const index = store.issues.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const [entry] = store.issues.splice(index, 1);
    return entry;
  });

  if (!removed) {
    return res.status(404).json({ error: "Issue not found." });
  }

  res.json({ ok: true, action, issue: publicIssue(removed) });
});

module.exports = { router };
