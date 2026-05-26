/** Craftable runes with GE ids and multi-rune level breakpoints (OSRS Wiki). */
const RUNES = [
  {
    id: "air",
    name: "Air rune",
    itemId: 556,
    reqLevel: 1,
    members: false,
    multipliers: [1, 11, 22, 33, 44, 55, 66, 77, 88, 99],
    xp: 5,
    essenceItemId: 7936,
  },
  {
    id: "mind",
    name: "Mind rune",
    itemId: 558,
    reqLevel: 2,
    members: false,
    multipliers: [2, 14, 28, 42, 56, 70, 84, 98],
    xp: 5.5,
    essenceItemId: 7936,
  },
  {
    id: "water",
    name: "Water rune",
    itemId: 555,
    reqLevel: 5,
    members: false,
    multipliers: [5, 19, 38, 57, 76, 95],
    xp: 6,
    essenceItemId: 7936,
  },
  {
    id: "earth",
    name: "Earth rune",
    itemId: 557,
    reqLevel: 9,
    members: false,
    multipliers: [9, 26, 52, 78],
    xp: 6.5,
    essenceItemId: 7936,
  },
  {
    id: "fire",
    name: "Fire rune",
    itemId: 554,
    reqLevel: 14,
    members: false,
    multipliers: [14, 35, 70],
    xp: 7,
    essenceItemId: 7936,
  },
  {
    id: "body",
    name: "Body rune",
    itemId: 559,
    reqLevel: 20,
    members: false,
    multipliers: [20, 46, 92],
    xp: 7.5,
    essenceItemId: 7936,
  },
  {
    id: "cosmic",
    name: "Cosmic rune",
    itemId: 564,
    reqLevel: 27,
    members: true,
    multipliers: [27, 59],
    xp: 8,
    essenceItemId: 7936,
  },
  {
    id: "sunfire",
    name: "Sunfire rune",
    itemId: 28929,
    reqLevel: 33,
    members: true,
    multipliers: [33, 49, 98],
    xp: 9,
    essenceItemId: 7936,
    extraCosts: [
      { itemId: 554, qty: 1, name: "Fire rune" },
      { itemId: 28924, qty: 1, name: "Sunfire splinters" },
    ],
  },
  {
    id: "chaos",
    name: "Chaos rune",
    itemId: 562,
    reqLevel: 35,
    members: true,
    multipliers: [35, 74],
    xp: 8.5,
    essenceItemId: 7936,
  },
  {
    id: "astral",
    name: "Astral rune",
    itemId: 9075,
    reqLevel: 40,
    members: true,
    multipliers: [40, 82],
    xp: 8.7,
    essenceItemId: 7936,
  },
  {
    id: "nature",
    name: "Nature rune",
    itemId: 561,
    reqLevel: 44,
    members: true,
    multipliers: [44, 91],
    xp: 9,
    essenceItemId: 7936,
  },
  {
    id: "law",
    name: "Law rune",
    itemId: 563,
    reqLevel: 54,
    members: true,
    multipliers: [54, 95],
    xp: 9.5,
    essenceItemId: 7936,
  },
  {
    id: "death",
    name: "Death rune",
    itemId: 560,
    reqLevel: 65,
    members: true,
    multipliers: [65, 99],
    xp: 10,
    essenceItemId: 7936,
  },
  {
    id: "blood",
    name: "Blood rune",
    itemId: 565,
    reqLevel: 77,
    members: true,
    multipliers: [77],
    xp: 10.5,
    essenceItemId: 7936,
    note: "True Blood Altar uses pure essence",
  },
  {
    id: "soul",
    name: "Soul rune",
    itemId: 566,
    reqLevel: 90,
    members: true,
    multipliers: [90],
    xp: 11,
    essenceItemId: null,
    freeInput: true,
    note: "Uses dark essence fragments",
  },
  {
    id: "wrath",
    name: "Wrath rune",
    itemId: 21880,
    reqLevel: 95,
    members: true,
    multipliers: [95],
    xp: 11,
    essenceItemId: 7936,
  },
];

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

const COMBINATION_RUNES = [
  {
    id: "mist",
    name: "Mist rune",
    itemId: 4695,
    reqLevel: 6,
    members: true,
    routes: [
      {
        altar: "Air altar",
        inputName: "Water rune",
        inputItemId: ITEM_IDS.waterRune,
        talismanName: "Water talisman",
        talismanItemId: ITEM_IDS.waterTalisman,
        xp: 8,
      },
      {
        altar: "Water altar",
        inputName: "Air rune",
        inputItemId: ITEM_IDS.airRune,
        talismanName: "Air talisman",
        talismanItemId: ITEM_IDS.airTalisman,
        xp: 8.5,
      },
    ],
  },
  {
    id: "dust",
    name: "Dust rune",
    itemId: 4696,
    reqLevel: 10,
    members: true,
    routes: [
      {
        altar: "Air altar",
        inputName: "Earth rune",
        inputItemId: ITEM_IDS.earthRune,
        talismanName: "Earth talisman",
        talismanItemId: ITEM_IDS.earthTalisman,
        xp: 8.3,
      },
      {
        altar: "Earth altar",
        inputName: "Air rune",
        inputItemId: ITEM_IDS.airRune,
        talismanName: "Air talisman",
        talismanItemId: ITEM_IDS.airTalisman,
        xp: 9,
      },
    ],
  },
  {
    id: "mud",
    name: "Mud rune",
    itemId: 4698,
    reqLevel: 13,
    members: true,
    routes: [
      {
        altar: "Water altar",
        inputName: "Earth rune",
        inputItemId: ITEM_IDS.earthRune,
        talismanName: "Earth talisman",
        talismanItemId: ITEM_IDS.earthTalisman,
        xp: 9.3,
      },
      {
        altar: "Earth altar",
        inputName: "Water rune",
        inputItemId: ITEM_IDS.waterRune,
        talismanName: "Water talisman",
        talismanItemId: ITEM_IDS.waterTalisman,
        xp: 9.5,
      },
    ],
  },
  {
    id: "smoke",
    name: "Smoke rune",
    itemId: 4697,
    reqLevel: 15,
    members: true,
    routes: [
      {
        altar: "Air altar",
        inputName: "Fire rune",
        inputItemId: ITEM_IDS.fireRune,
        talismanName: "Fire talisman",
        talismanItemId: ITEM_IDS.fireTalisman,
        xp: 8.5,
      },
      {
        altar: "Fire altar",
        inputName: "Air rune",
        inputItemId: ITEM_IDS.airRune,
        talismanName: "Air talisman",
        talismanItemId: ITEM_IDS.airTalisman,
        xp: 9.5,
      },
    ],
  },
  {
    id: "steam",
    name: "Steam rune",
    itemId: 4694,
    reqLevel: 19,
    members: true,
    routes: [
      {
        altar: "Water altar",
        inputName: "Fire rune",
        inputItemId: ITEM_IDS.fireRune,
        talismanName: "Fire talisman",
        talismanItemId: ITEM_IDS.fireTalisman,
        xp: 9.3,
      },
      {
        altar: "Fire altar",
        inputName: "Water rune",
        inputItemId: ITEM_IDS.waterRune,
        talismanName: "Water talisman",
        talismanItemId: ITEM_IDS.waterTalisman,
        xp: 10,
      },
    ],
  },
  {
    id: "lava",
    name: "Lava rune",
    itemId: 4699,
    reqLevel: 23,
    members: true,
    routes: [
      {
        altar: "Earth altar",
        inputName: "Fire rune",
        inputItemId: ITEM_IDS.fireRune,
        talismanName: "Fire talisman",
        talismanItemId: ITEM_IDS.fireTalisman,
        xp: 10,
      },
      {
        altar: "Fire altar",
        inputName: "Earth rune",
        inputItemId: ITEM_IDS.earthRune,
        talismanName: "Earth talisman",
        talismanItemId: ITEM_IDS.earthTalisman,
        xp: 10.5,
      },
    ],
  },
  {
    id: "aether",
    name: "Aether rune",
    itemId: 30843,
    reqLevel: 90,
    members: true,
    routes: [
      {
        altar: "Cosmic altar",
        inputName: "Soul rune",
        inputItemId: ITEM_IDS.soulRune,
        requiresMagicImbue: true,
        successCosts: [
          { itemId: ITEM_IDS.aetherCatalyst, qty: 1, name: "Aether catalyst" },
        ],
        xp: 20,
      },
    ],
  },
];

function runeIconUrl(name) {
  const file = name.replace(/ /g, "_") + ".png";
  return `${WIKI_ICON}/${file}`;
}

function runeNameCell(name, { hideIconOnError = false, suffix = "" } = {}) {
  const onError = hideIconOnError ? ' onerror="this.style.display=\'none\'"' : "";
  return `<span class="rune-name"><img src="${runeIconUrl(name)}" alt="" width="18" height="18"${onError}>${name}${suffix}</span>`;
}
