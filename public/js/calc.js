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
  return sign + Math.round(Math.abs(n)).toLocaleString() + " gp";
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
  } else if (!rune.extraCosts && !rune.freeInput) {
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

function standardPouchSummary(rcLevel) {
  const pouches = STANDARD_POUCHES.filter((pouch) => rcLevel >= pouch.reqLevel);
  const capacity = pouches.reduce((sum, pouch) => sum + pouch.capacity, 0);
  const slots = pouches.length;

  return {
    name: pouches.length ? pouches.map((pouch) => pouch.name).join(", ") : "No pouches",
    essencesPerTrip: 28 - slots + capacity,
  };
}

function colossalPouchSummary(rcLevel) {
  const tier = COLOSSAL_POUCH_TIERS.find((t) => rcLevel >= t.reqLevel);
  if (!tier) {
    return { name: "Colossal pouch unavailable", essencesPerTrip: 28 };
  }

  return {
    name: `Colossal pouch (${tier.capacity})`,
    essencesPerTrip: 28 - 1 + tier.capacity,
  };
}

function pouchSummary(setupId, rcLevel, manualEssencesPerTrip) {
  if (setupId === "standard") return standardPouchSummary(rcLevel);
  if (setupId === "colossal") return colossalPouchSummary(rcLevel);
  if (setupId === "manual") {
    return {
      name: "Manual",
      essencesPerTrip: Math.max(1, manualEssencesPerTrip || 1),
    };
  }
  return { name: "Inventory only", essencesPerTrip: 28 };
}

function recommendedAbyssSetup(rcLevel) {
  return rcLevel >= 85 ? "colossal" : "standard";
}

function totalItemCost(prices, items) {
  let cost = 0;
  for (const item of items) {
    const price = getItemPrice(prices, item.itemId);
    if (price == null) return null;
    cost += price * item.qty;
  }
  return cost;
}

function combinationRouteProfit(combo, route, options, prices) {
  const essenceCount = Math.max(1, options.essencesPerAction || 1);
  const essencePrice = getItemPrice(prices, PURE_ESSENCE_ID);
  const inputPrice = getItemPrice(prices, route.inputItemId);
  const runePrice = getItemPrice(prices, combo.itemId);

  if (essencePrice == null || inputPrice == null || runePrice == null) {
    return {
      route,
      runePrice,
      cost: null,
      revenue: null,
      profit: null,
      actionProfit: null,
      outputPerEssence: null,
    };
  }

  const usesMagicImbue = options.magicImbue || route.requiresMagicImbue;
  const outputPerEssence = options.bindingNecklace ? 1 : 0.5;

  let actionCost = 0;
  if (usesMagicImbue) {
    const spellCost = totalItemCost(prices, MAGIC_IMBUE_COSTS);
    if (spellCost == null) actionCost = null;
    else actionCost += spellCost;
  } else if (route.talismanItemId) {
    const talismanPrice = getItemPrice(prices, route.talismanItemId);
    if (talismanPrice == null) actionCost = null;
    else actionCost += talismanPrice;
  }

  if (options.bindingNecklace && actionCost != null) {
    const necklacePrice = getItemPrice(prices, ITEM_IDS.bindingNecklace);
    if (necklacePrice == null) actionCost = null;
    else actionCost += necklacePrice / 16;
  }

  if (actionCost == null) {
    return {
      route,
      runePrice,
      cost: null,
      revenue: null,
      profit: null,
      actionProfit: null,
      outputPerEssence: null,
    };
  }

  let successCost = 0;
  if (route.successCosts) {
    const routeSuccessCost = totalItemCost(prices, route.successCosts);
    if (routeSuccessCost == null) {
      return {
        route,
        runePrice,
        cost: null,
        revenue: null,
        profit: null,
        actionProfit: null,
        outputPerEssence: null,
      };
    }
    successCost = routeSuccessCost * outputPerEssence;
  }

  const cost = essencePrice + inputPrice + successCost + actionCost / essenceCount;
  const revenue = runePrice * outputPerEssence;
  const profit = revenue - cost;

  return {
    route,
    runePrice,
    cost,
    revenue,
    profit,
    actionProfit: profit * essenceCount,
    outputPerEssence,
  };
}

function bestCombinationRoute(combo, options, prices) {
  return combo.routes
    .map((route) => combinationRouteProfit(combo, route, options, prices))
    .sort((a, b) => (b.profit ?? -Infinity) - (a.profit ?? -Infinity))[0];
}

function normalProfitRow(rune, options, prices) {
  const { base, total, profit, cost } = profitPerEssence(
    rune,
    options.rcLevel,
    options.eyeEnabled,
    prices,
  );
  const runePrice = getItemPrice(prices, rune.itemId);
  const canCraft = options.rcLevel >= rune.reqLevel;
  const eyeNote = options.eyeEnabled && base > 0 ? ` (${base}→${total})` : "";

  return {
    rune,
    canCraft,
    method: rune.note ?? "Standard altar",
    price: runePrice,
    outputPerEssence: canCraft ? `${total}${eyeNote}` : null,
    cost,
    profit,
    gpHour: profitPerHour(profit, options.essencesPerHour),
  };
}

function combinationProfitRow(combo, options, prices) {
  const estimate = bestCombinationRoute(combo, options, prices);
  const route = estimate.route;
  const canCraft = options.rcLevel >= combo.reqLevel;
  const extraInputs = route.successCosts?.map((item) => item.name) ?? [];
  const routeInputs = [route.inputName, ...extraInputs].join(" + ");
  const method =
    options.magicImbue || route.requiresMagicImbue
      ? `${route.altar} with ${routeInputs}`
      : `${route.altar} with ${routeInputs} + ${route.talismanName}`;

  return {
    rune: combo,
    canCraft,
    method,
    price: estimate.runePrice,
    outputPerEssence:
      estimate.outputPerEssence != null ? estimate.outputPerEssence.toFixed(1) : null,
    cost: estimate.cost,
    profit: estimate.profit,
    gpHour: profitPerHour(estimate.profit, options.essencesPerHour),
  };
}
