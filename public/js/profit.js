let cachedPrices = null;
let profitControlsBound = false;

const PROFIT_PRESET_FIELDS = [
  { id: "rc-level", type: "int" },
  { id: "eye-toggle", type: "bool" },
  { id: "pouch-setup", type: "select" },
  { id: "trips-hour", type: "int" },
  { id: "essences-trip", type: "int" },
  { id: "combo-binding-toggle", type: "bool" },
  { id: "combo-imbue-toggle", type: "bool" },
];

function gpSignClass(value) {
  if (value == null) return "";
  return value >= 0 ? "gp-positive" : "gp-negative";
}

function profitCellContent(row) {
  const { rune, canCraft, profit } = row;
  if (!canCraft) return "—";
  if (profit != null) return formatGp(profit);
  if (rune.note) return `<span title="${rune.note}">—</span>`;
  return "—";
}

function profitOptionsFromForm() {
  const rcLevel = readClampedInput("rc-level", 1, LEVEL_MAX, 1);
  const eyeEnabled = document.getElementById("eye-toggle").checked;
  const pouchSetup = document.getElementById("pouch-setup").value;
  const tripsHour = readClampedInput("trips-hour", 1, INPUT_MAX, 1);
  const manualEssencesPerTrip = readClampedInput("essences-trip", 1, INPUT_MAX, 1);
  const bindingNecklace = document.getElementById("combo-binding-toggle").checked;
  const magicImbue = document.getElementById("combo-imbue-toggle").checked;
  const pouch = pouchSummary(pouchSetup, rcLevel, manualEssencesPerTrip);

  document.getElementById("essences-trip").disabled = pouchSetup !== "manual";

  return {
    rcLevel,
    eyeEnabled,
    bindingNecklace,
    magicImbue,
    tripsHour,
    pouch,
    essencesPerHour: pouch.essencesPerTrip * tripsHour,
    calcOptions: {
      rcLevel,
      eyeEnabled,
      bindingNecklace,
      magicImbue,
      essencesPerAction: pouch.essencesPerTrip,
      essencesPerHour: pouch.essencesPerTrip * tripsHour,
    },
  };
}

function bestProfitLabel(bestRow) {
  if (!bestRow) return "No profitable methods at this level with current prices.";
  return `Best GP/hr: ${bestRow.rune.name} · ${formatGp(bestRow.gpHour)}/hr`;
}

function profitStatusText(form, bestRow) {
  const eyeLabel = form.eyeEnabled ? " · Eye set ON" : "";
  const comboLabel = form.bindingNecklace
    ? " · Binding necklace ON"
    : " · 50% combo success";
  const imbueLabel = form.magicImbue ? " · Magic Imbue ON" : "";

  return (
    `${bestProfitLabel(bestRow)} · ` +
    `Level ${form.rcLevel}${eyeLabel}${comboLabel}${imbueLabel}` +
    ` · ${form.pouch.name} · ${form.pouch.essencesPerTrip.toLocaleString()} ess/trip` +
    ` × ${form.tripsHour.toLocaleString()} trips/hr = ${form.essencesPerHour.toLocaleString()} ess/hr`
  );
}

function appendProfitRow(tbody, row, isBest) {
  const { rune, canCraft, profit, gpHour, xpHour } = row;
  const tr = document.createElement("tr");
  if (!canCraft) tr.classList.add("unavailable");
  if (isBest) tr.classList.add("profit-best");

  tr.innerHTML = `
    <td>${runeNameCell(rune.name)}</td>
    <td>${rune.reqLevel}</td>
    <td>${row.method}</td>
    <td>${formatGp(row.price)}</td>
    <td>${canCraft ? row.outputPerEssence ?? "—" : "—"}</td>
    <td class="${gpSignClass(profit)}">${profitCellContent(row)}</td>
    <td class="${gpSignClass(gpHour)}">${canCraft && gpHour != null ? formatGp(gpHour) : "—"}</td>
    <td>${canCraft && xpHour != null ? formatXp(xpHour) + "/hr" : "—"}</td>
  `;
  tbody.appendChild(tr);
}

function renderProfit(prices) {
  const tbody = document.querySelector("#profit-table tbody");
  const status = document.getElementById("profit-status");
  tbody.innerHTML = "";

  const form = profitOptionsFromForm();
  const rows = [
    ...RUNES.map((rune) => normalProfitRow(rune, form.calcOptions, prices)),
    ...COMBINATION_RUNES.map((combo) => combinationProfitRow(combo, form.calcOptions, prices)),
  ].sort((a, b) => a.rune.reqLevel - b.rune.reqLevel || a.rune.name.localeCompare(b.rune.name));

  const bestRow = findBestProfitRow(rows);
  for (const row of rows) appendProfitRow(tbody, row, bestRow && row === bestRow);
  status.textContent = profitStatusText(form, bestRow);
}

function bindProfitControls() {
  if (profitControlsBound) return;
  profitControlsBound = true;

  applyTabPreset("profit", PROFIT_PRESET_FIELDS);

  const onUpdate = () => {
    if (cachedPrices) renderProfit(cachedPrices);
  };

  bindClampedInput("rc-level", { min: 1, max: LEVEL_MAX, fallback: 1, onUpdate });
  bindClampedInput("trips-hour", { min: 1, max: INPUT_MAX, fallback: 1, onUpdate });
  bindClampedInput("essences-trip", { min: 1, max: INPUT_MAX, fallback: 1, onUpdate });

  for (const id of [
    "eye-toggle",
    "pouch-setup",
    "combo-binding-toggle",
    "combo-imbue-toggle",
  ]) {
    bindControl(id, onUpdate);
  }

  bindPresetFields("profit", PROFIT_PRESET_FIELDS);
}

async function loadProfit(initialPrices = null) {
  bindProfitControls();
  return loadPricesForTab({
    initialPrices,
    statusId: "profit-status",
    render: (prices) => {
      cachedPrices = prices;
      renderProfit(prices);
    },
  });
}
