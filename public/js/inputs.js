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
    const n = Number.parseInt(el.value, 10);
    if (Number.isFinite(n)) {
      if (n > max) el.value = max;
      else if (n < min) el.value = min;
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
