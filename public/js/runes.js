const PURE_ESSENCE_ID = 7936;
const WIKI_ICON = "https://oldschool.runescape.wiki/images";

const ITEM_IDS = {
  airRune: 556,
  waterRune: 555,
  earthRune: 557,
  fireRune: 554,
  soulRune: 566,
  astralRune: 9075,
  airTalisman: 1438,
  waterTalisman: 1444,
  earthTalisman: 1440,
  fireTalisman: 1442,
  bindingNecklace: 5521,
  aetherCatalyst: 30771,
};

const MAGIC_IMBUE_COSTS = [
  { itemId: ITEM_IDS.astralRune, qty: 2, name: "Astral rune" },
  { itemId: ITEM_IDS.fireRune, qty: 7, name: "Fire rune" },
  { itemId: ITEM_IDS.waterRune, qty: 7, name: "Water rune" },
];

const POUCH_SETUPS = [
  { id: "inventory", name: "Inventory only" },
  { id: "standard", name: "Best standard pouches" },
  { id: "colossal", name: "Colossal pouch" },
  { id: "manual", name: "Manual essences / trip" },
];

const STANDARD_POUCHES = [
  { name: "Small pouch", reqLevel: 1, capacity: 3 },
  { name: "Medium pouch", reqLevel: 25, capacity: 6 },
  { name: "Large pouch", reqLevel: 50, capacity: 9 },
  { name: "Giant pouch", reqLevel: 75, capacity: 12 },
];

const COLOSSAL_POUCH_TIERS = [
  { reqLevel: 85, capacity: 40 },
  { reqLevel: 75, capacity: 27 },
  { reqLevel: 50, capacity: 16 },
  { reqLevel: 25, capacity: 8 },
];

function rune(id, name, itemId, reqLevel, multipliers, xp, bestMethod, extra = {}) {
  return {
    id,
    name,
    itemId,
    reqLevel,
    members: extra.members ?? true,
    multipliers,
    xp,
    essenceItemId: extra.freeInput ? null : (extra.essence ?? PURE_ESSENCE_ID),
    bestMethod,
    ...(extra.extraCosts && { extraCosts: extra.extraCosts }),
    ...(extra.freeInput && { freeInput: true }),
    ...(extra.note && { note: extra.note }),
  };
}

function comboRoute(altar, inputName, inputItemId, xp, talisman, extra = {}) {
  const route = { altar, inputName, inputItemId, xp, ...extra };
  if (talisman) {
    route.talismanName = talisman.name;
    route.talismanItemId = talisman.itemId;
  }
  return route;
}

function combo(id, name, itemId, reqLevel, routes) {
  return { id, name, itemId, reqLevel, members: true, routes };
}

const RUNES = [
  rune("air", "Air rune", 556, 1, [1, 11, 22, 33, 44, 55, 66, 77, 88, 99], 5, "Surface altar", { members: false }),
  rune("mind", "Mind rune", 558, 2, [2, 14, 28, 42, 56, 70, 84, 98], 5.5, "Surface altar", { members: false }),
  rune("water", "Water rune", 555, 5, [5, 19, 38, 57, 76, 95], 6, "Surface altar", { members: false }),
  rune("earth", "Earth rune", 557, 9, [9, 26, 52, 78], 6.5, "Surface altar", { members: false }),
  rune("fire", "Fire rune", 554, 14, [14, 35, 70], 7, "Surface altar", { members: false }),
  rune("body", "Body rune", 559, 20, [20, 46, 92], 7.5, "Surface altar", { members: false }),
  rune("cosmic", "Cosmic rune", 564, 27, [27, 59], 8, "Abyss"),
  rune("sunfire", "Sunfire rune", 28929, 33, [33, 49, 98], 9, "Sunfire altar", {
    extraCosts: [
      { itemId: 554, qty: 1, name: "Fire rune" },
      { itemId: 28924, qty: 1, name: "Sunfire splinters" },
    ],
  }),
  rune("chaos", "Chaos rune", 562, 35, [35, 74], 8.5, "Abyss"),
  rune("astral", "Astral rune", 9075, 40, [40, 82], 8.7, "Lunar Isles"),
  rune("nature", "Nature rune", 561, 44, [44, 91], 9, "Abyss"),
  rune("law", "Law rune", 563, 54, [54, 95], 9.5, "Abyss"),
  rune("death", "Death rune", 560, 65, [65, 99], 10, "Abyss"),
  rune("blood", "Blood rune", 565, 77, [77], 10.5, "True Blood Altar", {
    note: "True Blood Altar uses pure essence",
  }),
  rune("soul", "Soul rune", 566, 90, [90], 29.7, "Dark altar", {
    freeInput: true,
    note: "Uses dark essence fragments",
  }),
  rune("wrath", "Wrath rune", 21880, 95, [95], 8, "Myths' Guild"),
];

const COMBINATION_RUNES = [
  combo("mist", "Mist rune", 4695, 6, [
    comboRoute("Air altar", "Water rune", ITEM_IDS.waterRune, 8, { name: "Water talisman", itemId: ITEM_IDS.waterTalisman }),
    comboRoute("Water altar", "Air rune", ITEM_IDS.airRune, 8.5, { name: "Air talisman", itemId: ITEM_IDS.airTalisman }),
  ]),
  combo("dust", "Dust rune", 4696, 10, [
    comboRoute("Air altar", "Earth rune", ITEM_IDS.earthRune, 8.3, { name: "Earth talisman", itemId: ITEM_IDS.earthTalisman }),
    comboRoute("Earth altar", "Air rune", ITEM_IDS.airRune, 9, { name: "Air talisman", itemId: ITEM_IDS.airTalisman }),
  ]),
  combo("mud", "Mud rune", 4698, 13, [
    comboRoute("Water altar", "Earth rune", ITEM_IDS.earthRune, 9.3, { name: "Earth talisman", itemId: ITEM_IDS.earthTalisman }),
    comboRoute("Earth altar", "Water rune", ITEM_IDS.waterRune, 9.5, { name: "Water talisman", itemId: ITEM_IDS.waterTalisman }),
  ]),
  combo("smoke", "Smoke rune", 4697, 15, [
    comboRoute("Air altar", "Fire rune", ITEM_IDS.fireRune, 8.5, { name: "Fire talisman", itemId: ITEM_IDS.fireTalisman }),
    comboRoute("Fire altar", "Air rune", ITEM_IDS.airRune, 9.5, { name: "Air talisman", itemId: ITEM_IDS.airTalisman }),
  ]),
  combo("steam", "Steam rune", 4694, 19, [
    comboRoute("Water altar", "Fire rune", ITEM_IDS.fireRune, 9.3, { name: "Fire talisman", itemId: ITEM_IDS.fireTalisman }),
    comboRoute("Fire altar", "Water rune", ITEM_IDS.waterRune, 10, { name: "Water talisman", itemId: ITEM_IDS.waterTalisman }),
  ]),
  combo("lava", "Lava rune", 4699, 23, [
    comboRoute("Earth altar", "Fire rune", ITEM_IDS.fireRune, 10, { name: "Fire talisman", itemId: ITEM_IDS.fireTalisman }),
    comboRoute("Fire altar", "Earth rune", ITEM_IDS.earthRune, 10.5, { name: "Earth talisman", itemId: ITEM_IDS.earthTalisman }),
  ]),
  combo("aether", "Aether rune", 30843, 90, [
    comboRoute("Cosmic altar", "Soul rune", ITEM_IDS.soulRune, 20, null, {
      access: "Abyss",
      requiresMagicImbue: true,
      successCosts: [{ itemId: ITEM_IDS.aetherCatalyst, qty: 1, name: "Aether catalyst" }],
    }),
  ]),
];

function runeIconUrl(name) {
  return `${WIKI_ICON}/${name.replace(/ /g, "_")}.png`;
}

function runeNameCell(name, { hideIconOnError = false, suffix = "" } = {}) {
  const onError = hideIconOnError ? ' onerror="this.style.display=\'none\'"' : "";
  return `<span class="rune-name"><img src="${runeIconUrl(name)}" alt="" width="18" height="18"${onError}>${name}${suffix}</span>`;
}
