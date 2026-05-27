const TREND_FLAT_THRESHOLD_PCT = 1;
const EYE_SET_BONUS_MULTIPLIER = 6;
const EYE_SET_BONUS_DIVISOR = 10;
const INVENTORY_SLOTS = 28;
const COMBO_OUTPUT_WITH_NECKLACE = 1;
const COMBO_OUTPUT_WITHOUT_NECKLACE = 0.5;
const BINDING_NECKLACE_CHARGES = 16;
const GOTR_LANTERN_XP_MULTIPLIER = 1.05;
const GOTR_BOOSTED_XP_MULTIPLIER = 1.02;
const GOTR_TALISMAN_INNER_WEIGHT = { boosted: 4375, standard: 4900 };
const CHANCE_PERCENT_THRESHOLD = 0.01;
const CHANCE_FRACTION_THRESHOLD = 0.001;
const QTY_WHOLE_NUMBER_THRESHOLD = 100;
const QTY_ONE_DECIMAL_THRESHOLD = 1;

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

function formatChance(rate) {
  if (rate >= CHANCE_PERCENT_THRESHOLD) return `${(rate * 100).toFixed(1)}%`;
  if (rate >= CHANCE_FRACTION_THRESHOLD) return `${(rate * 100).toFixed(2)}%`;
  return `1/${Math.round(1 / rate)}`;
}

function formatQty(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= QTY_WHOLE_NUMBER_THRESHOLD) return Math.round(n).toLocaleString();
  if (n >= QTY_ONE_DECIMAL_THRESHOLD) return n.toFixed(1);
  return n.toFixed(2);
}

function trend(latestEntry, dayEntry) {
  const current = midPrice(latestEntry);
  const avg = dayEntry?.avgHighPrice ?? dayEntry?.avgLowPrice ?? null;
  if (current == null || avg == null) return { dir: "flat", label: "—", pct: 0 };
  const pct = ((current - avg) / avg) * 100;
  if (pct > TREND_FLAT_THRESHOLD_PCT) return { dir: "up", label: "▲", pct };
  if (pct < -TREND_FLAT_THRESHOLD_PCT) return { dir: "down", label: "▼", pct };
  return { dir: "flat", label: "—", pct };
}

function baseRunesPerEssence(rune, rcLevel) {
  if (rcLevel < rune.reqLevel) return 0;
  let count = 0;
  for (const lvl of rune.multipliers) if (rcLevel >= lvl) count += 1;
  return Math.max(count, 1);
}

function runesWithEye(baseRunes, eyeEnabled) {
  if (!eyeEnabled || baseRunes <= 0) return baseRunes;
  return baseRunes + Math.floor((baseRunes * EYE_SET_BONUS_MULTIPLIER) / EYE_SET_BONUS_DIVISOR);
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

  return {
    base,
    total,
    profit: costKnown && revenue != null ? revenue - cost : null,
    revenue,
    cost: costKnown ? cost : null,
  };
}

function profitPerHour(profitPerEss, essencesHour) {
  if (profitPerEss == null) return null;
  return Math.round(profitPerEss * essencesHour);
}

function xpPerHour(xpPerEssence, essencesHour) {
  if (xpPerEssence == null || essencesHour == null) return null;
  return Math.round(xpPerEssence * essencesHour);
}

function formatXp(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return Math.round(n).toLocaleString() + " xp";
}

function findBestRow(rows, metric) {
  let best = null;
  for (const row of rows) {
    const value = row[metric];
    if (!row.canCraft || value == null) continue;
    if (!best || value > best[metric]) best = row;
  }
  return best;
}

const findBestProfitRow = (rows) => findBestRow(rows, "gpHour");
const findBestXpRow = (rows) => findBestRow(rows, "xpHour");

function standardPouchSummary(rcLevel, rcCape) {
  const pouches = STANDARD_POUCHES.filter((p) => rcLevel >= p.reqLevel);
  const capeLabel = rcCape ? " · RC cape" : "";
  return {
    name: pouches.length ? pouches.map((p) => p.name).join(", ") + capeLabel : "No pouches",
    essencesPerTrip: INVENTORY_SLOTS - pouches.length + pouches.reduce((s, p) => s + p.capacity, 0),
  };
}

function colossalPouchSummary(rcLevel, rcCape) {
  const tier = COLOSSAL_POUCH_TIERS.find((t) => rcLevel >= t.reqLevel);
  if (!tier) return { name: "Colossal pouch unavailable", essencesPerTrip: INVENTORY_SLOTS };
  let essencesPerTrip = INVENTORY_SLOTS - 1 + tier.capacity;
  if (rcCape) essencesPerTrip -= PROFIT_COLOSSAL_CAPE_ESSENCE_PENALTY;
  return {
    name: `Colossal pouch (${tier.capacity})${rcCape ? " + RC cape" : ""}`,
    essencesPerTrip,
  };
}

function pouchSummary(setupId, rcLevel, manualEssencesPerTrip, rcCape = false) {
  if (setupId === "standard") return standardPouchSummary(rcLevel, rcCape);
  if (setupId === "colossal") return colossalPouchSummary(rcLevel, rcCape);
  if (setupId === "manual") return { name: "Manual", essencesPerTrip: Math.max(1, manualEssencesPerTrip || 1) };
  return { name: "Inventory only", essencesPerTrip: INVENTORY_SLOTS };
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

function comboOutputRate(bindingNecklace) {
  return bindingNecklace ? COMBO_OUTPUT_WITH_NECKLACE : COMBO_OUTPUT_WITHOUT_NECKLACE;
}

function combinationRouteUnavailable(route, runePrice) {
  return { route, runePrice, cost: null, revenue: null, profit: null, actionProfit: null, outputPerEssence: null };
}

function combinationActionCost(route, options, prices) {
  const usesMagicImbue = options.magicImbue || route.requiresMagicImbue;
  let actionCost = 0;

  if (usesMagicImbue) {
    const spellCost = totalItemCost(prices, MAGIC_IMBUE_COSTS);
    if (spellCost == null) return null;
    actionCost += spellCost;
  } else if (route.talismanItemId) {
    const talismanPrice = getItemPrice(prices, route.talismanItemId);
    if (talismanPrice == null) return null;
    actionCost += talismanPrice;
  }

  if (!options.bindingNecklace) return actionCost;
  const necklacePrice = getItemPrice(prices, ITEM_IDS.bindingNecklace);
  if (necklacePrice == null) return null;
  return actionCost + necklacePrice / BINDING_NECKLACE_CHARGES;
}

function combinationRouteProfit(combo, route, options, prices) {
  const essenceCount = Math.max(1, options.essencesPerAction || 1);
  const essencePrice = getItemPrice(prices, PURE_ESSENCE_ID);
  const inputPrice = getItemPrice(prices, route.inputItemId);
  const runePrice = getItemPrice(prices, combo.itemId);
  if (essencePrice == null || inputPrice == null || runePrice == null) {
    return combinationRouteUnavailable(route, runePrice);
  }

  const outputPerEssence = comboOutputRate(options.bindingNecklace);
  const actionCost = combinationActionCost(route, options, prices);
  if (actionCost == null) return combinationRouteUnavailable(route, runePrice);

  let successCost = 0;
  if (route.successCosts) {
    const routeSuccessCost = totalItemCost(prices, route.successCosts);
    if (routeSuccessCost == null) return combinationRouteUnavailable(route, runePrice);
    successCost = routeSuccessCost * outputPerEssence;
  }

  const cost = essencePrice + inputPrice + successCost + actionCost / essenceCount;
  const revenue = runePrice * outputPerEssence;
  const profit = revenue - cost;
  return { route, runePrice, cost, revenue, profit, actionProfit: profit * essenceCount, outputPerEssence };
}

function bestCombinationRoute(combo, options, prices) {
  return combo.routes
    .map((route) => combinationRouteProfit(combo, route, options, prices))
    .sort((a, b) => (b.profit ?? -Infinity) - (a.profit ?? -Infinity))[0];
}

function tripsPerHourWithPouchPenalty(tripSeconds, rcLevel, secondsPerHour, secondsPerPouch) {
  if (tripSeconds <= 0) return 0;
  const baseTrips = secondsPerHour / tripSeconds;
  const lostSeconds = secondsPerPouch * zmiStandardPouchTiers(rcLevel);
  return baseTrips * ((secondsPerHour - lostSeconds) / secondsPerHour);
}

function profitTripsPerHour(tripSeconds, rcLevel, pouchSetup, rcCape) {
  if (tripSeconds <= 0) return 0;
  const baseTrips = PROFIT_SECONDS_PER_HOUR / tripSeconds;
  if (rcCape || pouchSetup !== "standard") return baseTrips;
  return tripsPerHourWithPouchPenalty(tripSeconds, rcLevel, PROFIT_SECONDS_PER_HOUR, PROFIT_NPC_CONTACT_SECONDS_PER_POUCH);
}

function runeXpPerEssence(rune, daeyalt) {
  if (rune.freeInput || (rune.essenceItemId == null && !rune.extraCosts)) return rune.xp;
  if (daeyalt) return rune.xp * PROFIT_DAEYALT_XP_MULTIPLIER;
  return rune.xp;
}

function combinationXpPerEssence(route, options) {
  let xp = route.xp * comboOutputRate(options.bindingNecklace);
  if (options.daeyalt) xp *= PROFIT_DAEYALT_XP_MULTIPLIER;
  return xp;
}

function normalProfitRow(rune, options, prices) {
  const { total, profit, cost } = profitPerEssence(rune, options.rcLevel, options.eyeEnabled, prices);
  const canCraft = options.rcLevel >= rune.reqLevel;
  return {
    rune,
    canCraft,
    method: rune.bestMethod ?? "Surface altar",
    price: getItemPrice(prices, rune.itemId),
    outputPerEssence: canCraft ? String(total) : null,
    cost,
    profit,
    gpHour: profitPerHour(profit, options.essencesPerHour),
    xpHour: canCraft ? xpPerHour(runeXpPerEssence(rune, options.daeyalt), options.essencesPerHour) : null,
  };
}

function combinationMethodLabel(route, options) {
  const extraInputs = route.successCosts?.map((item) => item.name) ?? [];
  const routeInputs = [route.inputName, ...extraInputs].join(" + ");
  const usesImbue = options.magicImbue || route.requiresMagicImbue;
  const craftDetail = usesImbue
    ? `${route.altar} · ${routeInputs}`
    : `${route.altar} · ${routeInputs} + ${route.talismanName}`;
  return route.access ? `${route.access} · ${craftDetail}` : craftDetail;
}

function combinationProfitRow(combo, options, prices) {
  const estimate = bestCombinationRoute(combo, options, prices);
  const route = estimate.route;
  const canCraft = options.rcLevel >= combo.reqLevel;
  return {
    rune: combo,
    canCraft,
    method: combinationMethodLabel(route, options),
    price: estimate.runePrice,
    outputPerEssence: estimate.outputPerEssence != null ? estimate.outputPerEssence.toFixed(1) : null,
    cost: estimate.cost,
    profit: estimate.profit,
    gpHour: profitPerHour(estimate.profit, options.essencesPerHour),
    xpHour: canCraft ? xpPerHour(combinationXpPerEssence(route, options), options.essencesPerHour) : null,
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
  if (options.lantern) xp *= GOTR_LANTERN_XP_MULTIPLIER;
  if (options.boostedRates) xp *= GOTR_BOOSTED_XP_MULTIPLIER;
  return Math.round(xp);
}

function gotrRewardSearchesPerHour(options) {
  const searchesPerGame = Math.min(Math.max(0, options.elementalPoints), Math.max(0, options.catalyticPoints));
  return searchesPerGame * Math.max(0, options.gamesPerHour);
}

function gotrRuneQuantity(entry, rcLevel) {
  const avg = (entry.qtyMin + entry.qtyMax) / 2;
  return rcLevel >= entry.reqLevel ? avg : avg * (rcLevel / entry.reqLevel);
}

function gotrExpectedPerSearch(entry, tableWeight, rcLevel, prices) {
  const chance = entry.weight / tableWeight;
  const qty = entry.reqLevel != null ? gotrRuneQuantity(entry, rcLevel) : (entry.qtyMin + entry.qtyMax) / 2;
  const price = getItemPrice(prices, entry.itemId);
  return {
    name: gotrRewardName(entry),
    itemId: entry.itemId,
    chance,
    qtyPerSearch: qty * chance,
    gpPerSearch: price != null ? qty * price * chance : null,
  };
}

function gotrTalismanExpected(tableWeight, rcLevel, prices) {
  const tableChance = GOTR_TALISMAN_TABLE.weight / tableWeight;
  const innerWeight = tableWeight === GOTR_TABLE_WEIGHT.boosted
    ? GOTR_TALISMAN_INNER_WEIGHT.boosted
    : GOTR_TALISMAN_INNER_WEIGHT.standard;
  const rows = [];
  for (const item of GOTR_TALISMAN_TABLE.items) {
    if (item.reqLevel != null && rcLevel < item.reqLevel) continue;
    const chance = tableChance * (item.weight / innerWeight);
    const price = getItemPrice(prices, item.itemId);
    rows.push({
      name: gotrRewardName({ itemId: item.itemId }),
      itemId: item.itemId,
      chance,
      qtyPerSearch: chance,
      gpPerSearch: price != null ? price * chance : null,
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
  return total + necklacePrice * GOTR_BINDING_NECKLACES;
}

function mergeGotrRewardRows(rows) {
  const merged = new Map();
  for (const row of rows) {
    const key = row.itemId ?? row.name;
    const existing = merged.get(key);
    if (existing) {
      existing.chance += row.chance;
      existing.qtyPerSearch += row.qtyPerSearch;
      existing.gpPerSearch = existing.gpPerSearch != null && row.gpPerSearch != null
        ? existing.gpPerSearch + row.gpPerSearch
        : null;
      continue;
    }
    merged.set(key, { ...row });
  }
  return [...merged.values()].sort((a, b) => (b.gpPerSearch ?? 0) - (a.gpPerSearch ?? 0));
}

function gotrRewardBreakdown(options, prices) {
  const tableWeight = options.boostedRates ? GOTR_TABLE_WEIGHT.boosted : GOTR_TABLE_WEIGHT.standard;
  const rows = GOTR_MAIN_REWARDS.map((entry) => gotrExpectedPerSearch(entry, tableWeight, options.rcLevel, prices));
  rows.push(...gotrTalismanExpected(tableWeight, options.rcLevel, prices), ...gotrRareExpected(prices));
  return mergeGotrRewardRows(rows);
}

function gotrSummary(options, prices) {
  const searchesPerHour = gotrRewardSearchesPerHour(options);
  const rows = gotrRewardBreakdown(options, prices);
  const gpPerSearch = rows.reduce((sum, row) => sum + (row.gpPerSearch ?? 0), 0);
  const grossGpHour = Math.round(gpPerSearch * searchesPerHour);
  const comboCosts = options.comboRunes ? gotrComboCostsPerHour(prices) : 0;
  return {
    searchesPerHour,
    rcXpPerHour: gotrXpPerHour(options),
    grossGpHour,
    comboCosts,
    netGpHour: comboCosts != null ? grossGpHour - comboCosts : null,
    gpPerSearch,
    rows,
  };
}

function zmiLevelBand(rcLevel) {
  const level = Math.max(1, Math.min(99, rcLevel));
  return ZMI_LEVEL_BANDS.find((band) => level >= band.minLevel && level <= band.maxLevel)
    ?? ZMI_LEVEL_BANDS[ZMI_LEVEL_BANDS.length - 1];
}

function zmiStandardPouchTiers(rcLevel) {
  return STANDARD_POUCHES.filter((p) => rcLevel >= p.reqLevel).length;
}

function zmiTripsPerHour(tripSeconds, rcLevel) {
  return tripsPerHourWithPouchPenalty(tripSeconds, rcLevel, ZMI_SECONDS_PER_HOUR, ZMI_NPC_CONTACT_SECONDS_PER_POUCH);
}

function zmiRunesPerCraft(eyeEnabled, ardougneDiary) {
  let runes = runesWithEye(1, eyeEnabled);
  if (ardougneDiary) runes *= ZMI_DIARY_AVG_OUTPUT_MULTIPLIER;
  return runes;
}

function zmiExpectedRuneRow(key, chancePct, options, prices) {
  const rune = ZMI_RUNE_BY_KEY[key];
  if (!rune) return null;
  const chance = chancePct / 100;
  const qtyPerEssence = chance * zmiRunesPerCraft(options.eyeEnabled, options.ardougneDiary);
  const price = getItemPrice(prices, rune.itemId);
  return {
    name: rune.name,
    itemId: rune.itemId,
    chance,
    qtyPerEssence,
    gpPerEssence: price != null ? qtyPerEssence * price : null,
  };
}

function zmiRewardBreakdown(options, prices) {
  const band = zmiLevelBand(options.rcLevel);
  const rows = [];
  for (const key of ZMI_RUNE_KEYS) {
    const pct = band.distribution[key];
    if (pct == null) continue;
    const row = zmiExpectedRuneRow(key, pct, options, prices);
    if (row) rows.push(row);
  }
  return rows.sort((a, b) => (b.gpPerEssence ?? 0) - (a.gpPerEssence ?? 0));
}

function zmiXpPerEssence(options) {
  const band = zmiLevelBand(options.rcLevel);
  return options.daeyalt ? band.xpPerEssenceDaeyalt : band.xpPerEssencePure;
}

function zmiEssenceCostPerEssence(options, prices) {
  return options.daeyalt ? 0 : getItemPrice(prices, PURE_ESSENCE_ID);
}

function zmiSupplyCostPerTrip(options, prices) {
  if (!options.includeSupplyCosts) return 0;
  const teleportCost = totalItemCost(prices, ZMI_OURANIA_TELEPORT_COSTS);
  if (teleportCost == null) return null;
  const bankRunePrice = getItemPrice(prices, ZMI_BANK_PAYMENT_ITEM_ID);
  if (bankRunePrice == null) return null;
  return teleportCost + bankRunePrice * ZMI_ENIOLA_RUNES_PER_BANK;
}

function zmiSummary(options, prices) {
  const pouch = pouchSummary(options.pouchSetup, options.rcLevel, options.manualEssencesPerTrip);
  const tripsPerHour = zmiTripsPerHour(options.tripSeconds, options.rcLevel);
  const essencesPerHour = Math.round(pouch.essencesPerTrip * tripsPerHour);
  const rows = zmiRewardBreakdown(options, prices);
  const grossGpPerEssence = rows.reduce((sum, row) => sum + (row.gpPerEssence ?? 0), 0);
  const essenceCost = zmiEssenceCostPerEssence(options, prices);
  const supplyPerTrip = zmiSupplyCostPerTrip(options, prices);

  let netGpPerEssence = essenceCost != null ? grossGpPerEssence - essenceCost : null;
  if (essenceCost == null) netGpPerEssence = null;

  let grossGpHour = grossGpPerEssence != null ? Math.round(grossGpPerEssence * essencesPerHour) : null;
  let netGpHour = netGpPerEssence != null ? Math.round(netGpPerEssence * essencesPerHour) : null;

  if (supplyPerTrip != null && netGpHour != null) {
    netGpHour -= Math.round(supplyPerTrip * tripsPerHour);
  } else if (options.includeSupplyCosts && supplyPerTrip == null) {
    netGpHour = null;
  }

  const xpPerEss = zmiXpPerEssence(options);
  return {
    pouch,
    tripsPerHour,
    essencesPerHour,
    grossGpPerEssence,
    netGpPerEssence,
    grossGpHour,
    netGpHour,
    supplyCostPerHour: supplyPerTrip != null && options.includeSupplyCosts
      ? Math.round(supplyPerTrip * tripsPerHour)
      : null,
    rcXpPerHour: Math.round(xpPerEss * essencesPerHour),
    xpPerEssence: xpPerEss,
    rows,
  };
}
