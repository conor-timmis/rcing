/** Price helpers and runecrafting calculations. */

function midPrice(entry) {
  if (!entry) return null;
  const { high, low } = entry;
  if (high != null && low != null) return Math.round((high + low) / 2);
  return high ?? low ?? null;
}

function formatGp(n) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n < 0 ? "−" : "";
  return sign + Math.abs(n).toLocaleString() + " gp";
}

function trend(latestEntry, dayEntry) {
  const current = midPrice(latestEntry);
  const avg = dayEntry?.avgHighPrice ?? dayEntry?.avgLowPrice ?? null;
  if (current == null || avg == null) return { dir: "flat", label: "—", pct: 0 };

  const pct = ((current - avg) / avg) * 100;
  if (pct > 1) return { dir: "up", label: "▲", pct };
  if (pct < -1) return { dir: "down", label: "▼", pct };
  return { dir: "flat", label: "—", pct };
}

/** Base runes per essence from level breakpoints (OSRS Wiki table). */
function baseRunesPerEssence(rune, rcLevel) {
  if (rcLevel < rune.reqLevel) return 0;

  let count = 0;
  for (const lvl of rune.multipliers) {
    if (rcLevel >= lvl) count += 1;
  }
  return Math.max(count, 1);
}

/**
 * Raiments of the Eye bonus (full set = 60%).
 * Wiki: bonus = floor(base * multiplier / 10), multiplier 6 for full set.
 */
function runesWithEye(baseRunes, eyeEnabled) {
  if (!eyeEnabled || baseRunes <= 0) return baseRunes;
  const bonus = Math.floor((baseRunes * 6) / 10);
  return baseRunes + bonus;
}

function getItemPrice(prices, itemId) {
  if (itemId == null) return null;
  return midPrice(prices.latest[itemId]);
}

function profitPerEssence(rune, rcLevel, eyeEnabled, prices) {
  const base = baseRunesPerEssence(rune, rcLevel);
  if (base === 0) return { base, total: 0, profit: null, revenue: null, cost: null };

  const total = runesWithEye(base, eyeEnabled);
  const runePrice = getItemPrice(prices, rune.itemId);
  const revenue = runePrice != null ? total * runePrice : null;

  let cost = 0;
  let costKnown = true;

  if (rune.essenceItemId) {
    const essPrice = getItemPrice(prices, rune.essenceItemId);
    if (essPrice == null) costKnown = false;
    else cost += essPrice;
  } else if (!rune.extraCosts) {
    costKnown = false;
  }

  if (rune.extraCosts) {
    for (const extra of rune.extraCosts) {
      const p = getItemPrice(prices, extra.itemId);
      if (p == null) costKnown = false;
      else cost += p * extra.qty;
    }
  }

  const profit = costKnown && revenue != null ? revenue - cost : null;

  return { base, total, profit, revenue, cost: costKnown ? cost : null };
}

function profitPerHour(profitPerEss, essencesHour) {
  if (profitPerEss == null) return null;
  return Math.round(profitPerEss * essencesHour);
}
