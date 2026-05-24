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

function interpolateGotrXp(rcLevel) {
  const tiers = GOTR_XP_TIERS;
  if (rcLevel <= tiers[0].level) return tiers[0].xpPerHour;
  if (rcLevel >= tiers[tiers.length - 1].level) return tiers[tiers.length - 1].xpPerHour;

  for (let i = 0; i < tiers.length - 1; i += 1) {
    const low = tiers[i];
    const high = tiers[i + 1];
    if (rcLevel >= low.level && rcLevel <= high.level) {
      const t = (rcLevel - low.level) / (high.level - low.level);
      return low.xpPerHour + t * (high.xpPerHour - low.xpPerHour);
    }
  }

  return tiers[tiers.length - 1].xpPerHour;
}

function gotrXpPerHour(options) {
  let xp = interpolateGotrXp(options.rcLevel);
  if (options.lantern) xp *= 1.05;
  if (options.boostedRates) xp *= 1.02;
  return Math.round(xp);
}

function gotrRewardSearchesPerHour(options) {
  const searchesPerGame = Math.min(
    Math.max(0, options.elementalPoints),
    Math.max(0, options.catalyticPoints),
  );
  return searchesPerGame * Math.max(0, options.gamesPerHour);
}

function gotrRuneQuantity(entry, rcLevel) {
  const avg = (entry.qtyMin + entry.qtyMax) / 2;
  if (rcLevel >= entry.reqLevel) return avg;
  return avg * (rcLevel / entry.reqLevel);
}

function gotrExpectedPerSearch(entry, tableWeight, rcLevel, prices) {
  const chance = entry.weight / tableWeight;
  let qty = (entry.qtyMin + entry.qtyMax) / 2;
  if (entry.reqLevel != null) qty = gotrRuneQuantity(entry, rcLevel);

  const price = getItemPrice(prices, entry.itemId);
  const gp = price != null ? qty * price * chance : null;

  return {
    name: gotrRewardName(entry),
    itemId: entry.itemId,
    chance,
    qtyPerSearch: qty * chance,
    gpPerSearch: gp,
  };
}

function gotrTalismanExpected(tableWeight, rcLevel, prices) {
  const tableChance = GOTR_TALISMAN_TABLE.weight / tableWeight;
  const innerWeight = tableWeight === GOTR_TABLE_WEIGHT.boosted ? 4375 : 4900;
  const rows = [];

  for (const item of GOTR_TALISMAN_TABLE.items) {
    if (item.reqLevel != null && rcLevel < item.reqLevel) continue;

    const chance = tableChance * (item.weight / innerWeight);
    const price = getItemPrice(prices, item.itemId);
    const gpPerSearch = price != null ? price * chance : null;

    rows.push({
      name: gotrRewardName({ itemId: item.itemId }),
      itemId: item.itemId,
      chance,
      qtyPerSearch: chance,
      gpPerSearch,
    });
  }

  return rows;
}

function gotrRareExpected(prices) {
  return GOTR_RARE_REWARDS.map((entry) => {
    const price = getItemPrice(prices, entry.itemId);
    return {
      name: entry.name,
      itemId: entry.itemId,
      chance: entry.rate,
      qtyPerSearch: entry.rate,
      gpPerSearch: price != null ? price * entry.rate : null,
    };
  });
}

function gotrComboCostsPerHour(prices) {
  let total = 0;

  for (const item of GOTR_NPC_CONTACT_COSTS) {
    const price = getItemPrice(prices, item.itemId);
    if (price == null) return null;
    total += price * item.qty * GOTR_NPC_CONTACT_CASTS;
  }

  for (const item of MAGIC_IMBUE_COSTS) {
    const price = getItemPrice(prices, item.itemId);
    if (price == null) return null;
    total += price * item.qty * GOTR_MAGIC_IMBUE_CASTS;
  }

  const necklacePrice = getItemPrice(prices, ITEM_IDS.bindingNecklace);
  if (necklacePrice == null) return null;
  total += necklacePrice * GOTR_BINDING_NECKLACES;

  return total;
}

function gotrRewardBreakdown(options, prices) {
  const tableWeight = options.boostedRates
    ? GOTR_TABLE_WEIGHT.boosted
    : GOTR_TABLE_WEIGHT.standard;

  const rows = GOTR_MAIN_REWARDS.map((entry) =>
    gotrExpectedPerSearch(entry, tableWeight, options.rcLevel, prices),
  );

  rows.push(...gotrTalismanExpected(tableWeight, options.rcLevel, prices));
  rows.push(...gotrRareExpected(prices));

  const merged = new Map();
  for (const row of rows) {
    const key = row.itemId ?? row.name;
    const existing = merged.get(key);
    if (existing) {
      existing.chance += row.chance;
      existing.qtyPerSearch += row.qtyPerSearch;
      if (existing.gpPerSearch != null && row.gpPerSearch != null) {
        existing.gpPerSearch += row.gpPerSearch;
      } else {
        existing.gpPerSearch = null;
      }
    } else {
      merged.set(key, { ...row });
    }
  }

  return [...merged.values()].sort((a, b) => (b.gpPerSearch ?? 0) - (a.gpPerSearch ?? 0));
}

function gotrSummary(options, prices) {
  const searchesPerHour = gotrRewardSearchesPerHour(options);
  const rows = gotrRewardBreakdown(options, prices);
  const gpPerSearch = rows.reduce((sum, row) => sum + (row.gpPerSearch ?? 0), 0);
  const grossGpHour = Math.round(gpPerSearch * searchesPerHour);
  const comboCosts = options.comboRunes ? gotrComboCostsPerHour(prices) : 0;
  const netGpHour = comboCosts != null ? grossGpHour - comboCosts : null;
  const rcXpPerHour = gotrXpPerHour(options);

  return {
    searchesPerHour,
    rcXpPerHour,
    grossGpHour,
    comboCosts,
    netGpHour,
    gpPerSearch,
    rows,
  };
}
