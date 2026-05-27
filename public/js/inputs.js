const LEVEL_MAX = 99;
const INPUT_MAX = 200;

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function readClampedInput(id, min, max, fallback) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  return clampInt(el.value, min, max, fallback);
}

/** True if the typed digits could still become a value in [min, max]. */
function isPartialIntInRange(raw, min, max) {
  const digits = String(raw).trim();
  if (digits === "") return true;
  if (!/^\d+$/.test(digits)) return false;

  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n) || n > max) return false;

  for (let v = min; v <= max; v++) {
    if (String(v).startsWith(digits)) return true;
  }
  return false;
}

function bindClampedInput(id, { min, max, fallback, onUpdate }) {
  const el = document.getElementById(id);
  if (!el) return;

  function applyClamp(force) {
    const raw = el.value.trim();
    if (raw === "" && !force) return;

    const clamped = clampInt(raw === "" ? fallback : raw, min, max, fallback);
    if (el.value !== String(clamped)) el.value = clamped;
    if (onUpdate) onUpdate();
  }

  el.addEventListener("input", () => {
    const raw = el.value.trim();
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) {
      if (onUpdate) onUpdate();
      return;
    }
    if (n > max) {
      el.value = max;
    } else if (n < min && !isPartialIntInRange(raw, min, max)) {
      el.value = min;
    }
    if (onUpdate) onUpdate();
  });

  el.addEventListener("change", () => applyClamp(true));
  applyClamp(true);
}

function bindControl(id, onUpdate) {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener("input", () => {
    if (onUpdate) onUpdate();
  });
  el.addEventListener("change", () => {
    if (onUpdate) onUpdate();
  });
}

const PRICES_API = "/api/prices";
const PRICES_LOAD_ERROR = "Could not load prices. Is the server running?";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tabHighlightCard({
  kind = "gp",
  label,
  titleHtml = "",
  valueHtml = "",
  meta = "",
  empty = false,
  valueClass = "",
}) {
  const kindClass = kind === "xp" ? "tab-highlight-xp" : "tab-highlight-gp";
  const emptyClass = empty ? " tab-highlight-empty" : "";

  if (empty) {
    return `<article class="tab-highlight ${kindClass}${emptyClass}">
      <span class="tab-highlight-label">${escapeHtml(label)}</span>
      <span class="tab-highlight-meta">${escapeHtml(meta)}</span>
    </article>`;
  }

  const valueClasses = [
    "tab-highlight-value",
    kind === "xp" ? "tab-highlight-value-xp" : "tab-highlight-value-gp",
    valueClass,
  ]
    .filter(Boolean)
    .join(" ");

  return `<article class="tab-highlight ${kindClass}">
    <span class="tab-highlight-label">${escapeHtml(label)}</span>
    <div class="tab-highlight-title">${titleHtml}</div>
    <span class="${valueClasses}">${valueHtml}</span>
    <span class="tab-highlight-meta">${escapeHtml(meta)}</span>
  </article>`;
}

function setTabPriceStatus(statusId, { message = "", isError = false } = {}) {
  const status = document.getElementById(statusId);
  if (!status) return;

  status.textContent = message;
  status.classList.toggle("status-error", isError);
  status.hidden = !message;
}

async function loadPricesForTab({ initialPrices, statusId, render }) {
  if (initialPrices) {
    setTabPriceStatus(statusId);
    render(initialPrices);
    return initialPrices;
  }

  setTabPriceStatus(statusId, { message: "Loading prices…" });
  try {
    const res = await fetch(PRICES_API);
    if (!res.ok) throw new Error("API error");
    const prices = await res.json();
    setTabPriceStatus(statusId);
    render(prices);
    return prices;
  } catch {
    setTabPriceStatus(statusId, { message: PRICES_LOAD_ERROR, isError: true });
    return null;
  }
}

const PRESET_STORAGE_KEY = "rcing.presets.v1";

function loadPresets() {
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function savePresetTab(tab, values) {
  const presets = loadPresets();
  presets[tab] = values;
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
}

function readControlValue(id, type) {
  const el = document.getElementById(id);
  if (!el) return undefined;

  if (type === "bool") return el.checked;
  if (type === "select") return el.value;
  return el.value;
}

function writeControlValue(id, type, value) {
  const el = document.getElementById(id);
  if (!el || value === undefined) return;

  if (type === "bool") {
    el.checked = Boolean(value);
    return;
  }
  el.value = String(value);
}

function applyTabPreset(tab, fields) {
  const stored = loadPresets()[tab];
  if (!stored) return;

  for (const field of fields) {
    writeControlValue(field.id, field.type, stored[field.id]);
  }
}

function bindPresetFields(tab, fields, onSave) {
  function persist() {
    const values = {};
    for (const field of fields) {
      const value = readControlValue(field.id, field.type);
      if (value !== undefined) values[field.id] = value;
    }
    savePresetTab(tab, values);
    if (onSave) onSave();
  }

  for (const field of fields) {
    const el = document.getElementById(field.id);
    if (!el) continue;
    el.addEventListener("change", persist);
    if (field.type !== "bool") el.addEventListener("input", persist);
  }

  return persist;
}

function joinBadges(badges) {
  return badges.length ? ` · ${badges.join(", ")}` : "";
}

function initPriceTab({ statusId, bindControls, render }) {
  let cachedPrices = null;
  let bound = false;
  const onUpdate = () => {
    if (cachedPrices) render(cachedPrices);
  };
  return async (initialPrices = null) => {
    if (!bound) {
      bound = true;
      bindControls(onUpdate);
    }
    return loadPricesForTab({
      initialPrices,
      statusId,
      render: (prices) => {
        cachedPrices = prices;
        render(prices);
      },
    });
  };
}
