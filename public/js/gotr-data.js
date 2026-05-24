/** Guardians of the Rift — loot tables and XP benchmarks (OSRS Wiki). */

const GOTR_ITEM_IDS = {
  abyssalPearls: 26879,
  intricatePouch: 26886,
  abyssalAshes: 25775,
  needle: 1733,
  catalyticTalisman: 26849,
  elementalTalisman: 28922,
  airTalisman: 1438,
  waterTalisman: 1444,
  earthTalisman: 1440,
  fireTalisman: 1442,
  mindTalisman: 1448,
  bodyTalisman: 1450,
  chaosTalisman: 1452,
  cosmicTalisman: 1454,
  natureTalisman: 1462,
  lawTalisman: 1458,
  deathTalisman: 1456,
};

/** Approximate RC XP/hr on mass worlds (OSRS Wiki / community benchmarks). */
const GOTR_XP_TIERS = [
  { level: 27, xpPerHour: 22_000 },
  { level: 40, xpPerHour: 28_000 },
  { level: 50, xpPerHour: 35_000 },
  { level: 65, xpPerHour: 45_000 },
  { level: 75, xpPerHour: 55_000 },
  { level: 85, xpPerHour: 62_000 },
  { level: 99, xpPerHour: 65_000 },
];

const GOTR_TABLE_WEIGHT = {
  standard: 140,
  boosted: 125,
};

/** Main Rewards Guardian table (weights from OSRS Wiki). */
const GOTR_MAIN_REWARDS = [
  { kind: "rune", itemId: 556, weight: 4, qtyMin: 400, qtyMax: 500, reqLevel: 1 },
  { kind: "rune", itemId: 555, weight: 4, qtyMin: 400, qtyMax: 500, reqLevel: 5 },
  { kind: "rune", itemId: 557, weight: 4, qtyMin: 400, qtyMax: 500, reqLevel: 9 },
  { kind: "rune", itemId: 554, weight: 4, qtyMin: 400, qtyMax: 500, reqLevel: 14 },
  { kind: "rune", itemId: 558, weight: 4, qtyMin: 250, qtyMax: 400, reqLevel: 2 },
  { kind: "rune", itemId: 559, weight: 4, qtyMin: 80, qtyMax: 150, reqLevel: 20 },
  { kind: "rune", itemId: 562, weight: 10, qtyMin: 61, qtyMax: 150, reqLevel: 35 },
  { kind: "rune", itemId: 564, weight: 10, qtyMin: 20, qtyMax: 30, reqLevel: 27 },
  { kind: "rune", itemId: 561, weight: 10, qtyMin: 28, qtyMax: 150, reqLevel: 44 },
  { kind: "rune", itemId: 563, weight: 10, qtyMin: 5, qtyMax: 120, reqLevel: 54 },
  { kind: "rune", itemId: 560, weight: 10, qtyMin: 5, qtyMax: 120, reqLevel: 65 },
  { kind: "rune", itemId: 565, weight: 10, qtyMin: 5, qtyMax: 120, reqLevel: 77 },
  {
    kind: "stack",
    name: "Abyssal pearls",
    itemId: GOTR_ITEM_IDS.abyssalPearls,
    weight: 18,
    qtyMin: 14,
    qtyMax: 16,
  },
  {
    kind: "stack",
    name: "Intricate pouch",
    itemId: GOTR_ITEM_IDS.intricatePouch,
    weight: 5,
    qtyMin: 1,
    qtyMax: 1,
  },
  {
    kind: "stack",
    name: "Abyssal ashes",
    itemId: GOTR_ITEM_IDS.abyssalAshes,
    weight: 1,
    qtyMin: 1,
    qtyMax: 1,
  },
  {
    kind: "stack",
    name: "Needle",
    itemId: GOTR_ITEM_IDS.needle,
    weight: 1,
    qtyMin: 1,
    qtyMax: 1,
  },
];

const GOTR_TALISMAN_TABLE = {
  weight: 16,
  items: [
    { itemId: GOTR_ITEM_IDS.airTalisman, weight: 48 },
    { itemId: GOTR_ITEM_IDS.waterTalisman, weight: 48 },
    { itemId: GOTR_ITEM_IDS.earthTalisman, weight: 48 },
    { itemId: GOTR_ITEM_IDS.fireTalisman, weight: 48 },
    { itemId: GOTR_ITEM_IDS.mindTalisman, weight: 64 },
    { itemId: GOTR_ITEM_IDS.bodyTalisman, weight: 64 },
    { itemId: GOTR_ITEM_IDS.chaosTalisman, weight: 64 },
    { itemId: GOTR_ITEM_IDS.cosmicTalisman, weight: 64 },
    { itemId: GOTR_ITEM_IDS.natureTalisman, weight: 64 },
    { itemId: GOTR_ITEM_IDS.elementalTalisman, weight: 16 },
    { itemId: GOTR_ITEM_IDS.lawTalisman, weight: 16, reqLevel: 54 },
    { itemId: GOTR_ITEM_IDS.deathTalisman, weight: 16, reqLevel: 65 },
  ],
};

/** Rare table — rolled separately each search (OSRS Wiki). */
const GOTR_RARE_REWARDS = [
  { name: "Catalytic talisman", itemId: GOTR_ITEM_IDS.catalyticTalisman, rate: 1 / 200 },
];

/** Optional combo-rune inputs per hour (wiki money-making guide reference setup). */
const GOTR_NPC_CONTACT_CASTS = 3;
const GOTR_NPC_CONTACT_COSTS = [
  { itemId: 9075, qty: 2, name: "Astral rune" },
  { itemId: 564, qty: 2, name: "Cosmic rune" },
  { itemId: 556, qty: 3, name: "Air rune" },
  { itemId: 555, qty: 3, name: "Water rune" },
  { itemId: 557, qty: 3, name: "Earth rune" },
  { itemId: 554, qty: 3, name: "Fire rune" },
];
const GOTR_MAGIC_IMBUE_CASTS = 12;
const GOTR_BINDING_NECKLACES = 0.75;

const GOTR_ITEM_NAMES = {
  [GOTR_ITEM_IDS.abyssalPearls]: "Abyssal pearls",
  [GOTR_ITEM_IDS.intricatePouch]: "Intricate pouch",
  [GOTR_ITEM_IDS.abyssalAshes]: "Abyssal ashes",
  [GOTR_ITEM_IDS.needle]: "Needle",
  [GOTR_ITEM_IDS.catalyticTalisman]: "Catalytic talisman",
  [GOTR_ITEM_IDS.elementalTalisman]: "Elemental talisman",
  [GOTR_ITEM_IDS.airTalisman]: "Air talisman",
  [GOTR_ITEM_IDS.waterTalisman]: "Water talisman",
  [GOTR_ITEM_IDS.earthTalisman]: "Earth talisman",
  [GOTR_ITEM_IDS.fireTalisman]: "Fire talisman",
  [GOTR_ITEM_IDS.mindTalisman]: "Mind talisman",
  [GOTR_ITEM_IDS.bodyTalisman]: "Body talisman",
  [GOTR_ITEM_IDS.chaosTalisman]: "Chaos talisman",
  [GOTR_ITEM_IDS.cosmicTalisman]: "Cosmic talisman",
  [GOTR_ITEM_IDS.natureTalisman]: "Nature talisman",
  [GOTR_ITEM_IDS.lawTalisman]: "Law talisman",
  [GOTR_ITEM_IDS.deathTalisman]: "Death talisman",
};

const GOTR_RUNE_BY_ITEM_ID = Object.fromEntries(
  [...RUNES, ...COMBINATION_RUNES].map((rune) => [rune.itemId, rune]),
);

function gotrRewardName(entry) {
  if (entry.name) return entry.name;
  if (GOTR_ITEM_NAMES[entry.itemId]) return GOTR_ITEM_NAMES[entry.itemId];
  const rune = GOTR_RUNE_BY_ITEM_ID[entry.itemId];
  if (rune) return rune.name;
  return `Item ${entry.itemId}`;
}
