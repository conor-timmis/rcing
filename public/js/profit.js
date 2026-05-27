let cachedPrices = null;
let profitControlsBound = false;

const PROFIT_PRESET_FIELDS = [
  { id: "rc-level", type: "int" },
  { id: "eye-toggle", type: "bool" },
  { id: "daeyalt-toggle", type: "bool" },
  { id: "rc-cape-toggle", type: "bool" },
  { id: "pouch-setup", type: "select" },
  { id: "trip-seconds", type: "int" },
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
  const daeyalt = document.getElementById("daeyalt-toggle").checked;
  const rcCape = document.getElementById("rc-cape-toggle").checked;
  const pouchSetup = document.getElementById("pouch-setup").value;
  const tripSeconds = readClampedInput("trip-seconds", 1, INPUT_MAX, PROFIT_DEFAULT_TRIP_SECONDS);
  const manualEssencesPerTrip = readClampedInput("essences-trip", 1, INPUT_MAX, 1);
  const bindingNecklace = document.getElementById("combo-binding-toggle").checked;
  const magicImbue = document.getElementById("combo-imbue-toggle").checked;
  const pouch = pouchSummary(pouchSetup, rcLevel, manualEssencesPerTrip, rcCape);
  const tripsHour = profitTripsPerHour(tripSeconds, rcLevel, pouchSetup, rcCape);
  const essencesPerHour = Math.round(pouch.essencesPerTrip * tripsHour);

  document.getElementById("essences-trip").disabled = pouchSetup !== "manual";

  return {
    rcLevel,
    eyeEnabled,
    daeyalt,
    rcCape,
    bindingNecklace,
    magicImbue,
    tripSeconds,
    tripsHour,
    pouch,
    essencesPerHour,
    calcOptions: {
      rcLevel,
      eyeEnabled,
      daeyalt,
      rcCape,
      bindingNecklace,
      magicImbue,
      essencesPerAction: pouch.essencesPerTrip,
      essencesPerHour,
    },
  };
}

function profitSetupSummary(form) {
  const badges = [];
  if (form.eyeEnabled) badges.push("Eye");
  if (form.daeyalt) badges.push("Daeyalt");
  if (form.rcCape) badges.push("RC cape");
  if (form.bindingNecklace) badges.push("Binding necklace");
  else badges.push("50% combos");
  if (form.magicImbue) badges.push("Magic Imbue");
  const badgeText = badges.length ? ` · ${badges.join(", ")}` : "";

  return (
    `Setup · Lvl ${form.rcLevel} · ${form.pouch.essencesPerTrip.toLocaleString()} ess/trip` +
    ` · ${form.tripSeconds}s · ${form.essencesPerHour.toLocaleString()} ess/hr${badgeText}`
  );
}

function profitThroughputText(form) {
  return (
    `${form.pouch.name} · ${form.tripsHour.toFixed(1)} trips/hr` +
    ` · ${form.essencesPerHour.toLocaleString()} ess/hr`
  );
}

function renderProfitHighlights(bestGpRow, bestXpRow) {
  const container = document.getElementById("profit-highlights");
  if (!container) return;

  const gpCard = bestGpRow
    ? `<article class="tab-highlight tab-highlight-gp">
        <span class="tab-highlight-label">Best GP/hr</span>
        <strong class="tab-highlight-title">${bestGpRow.rune.name}</strong>
        <span class="tab-highlight-value">${formatGp(bestGpRow.gpHour)}/hr</span>
        <span class="tab-highlight-meta">${bestGpRow.method}</span>
      </article>`
    : `<article class="tab-highlight tab-highlight-gp tab-highlight-empty">
        <span class="tab-highlight-label">Best GP/hr</span>
        <span class="tab-highlight-meta">No profitable method at this level</span>
      </article>`;

  const xpCard = bestXpRow
    ? `<article class="tab-highlight tab-highlight-xp">
        <span class="tab-highlight-label">Best XP/hr</span>
        <strong class="tab-highlight-title">${bestXpRow.rune.name}</strong>
        <span class="tab-highlight-value">${formatXp(bestXpRow.xpHour)}/hr</span>
        <span class="tab-highlight-meta">${bestXpRow.method}</span>
      </article>`
    : `<article class="tab-highlight tab-highlight-xp tab-highlight-empty">
        <span class="tab-highlight-label">Best XP/hr</span>
        <span class="tab-highlight-meta">No craftable method at this level</span>
      </article>`;

  container.innerHTML = gpCard + xpCard;
}

function appendProfitRow(tbody, row, { isBestGp, isBestXp }) {
  const { rune, canCraft, profit, gpHour, xpHour } = row;
  const tr = document.createElement("tr");
  if (!canCraft) tr.classList.add("unavailable");
  if (isBestGp) tr.classList.add("profit-best");
  if (isBestXp) tr.classList.add("profit-best-xp");

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
  const throughput = document.getElementById("profit-throughput");
  const setupSummary = document.getElementById("profit-setup-summary");
  const craftableOnly = document.getElementById("profit-craftable-only")?.checked ?? true;
  tbody.innerHTML = "";

  const form = profitOptionsFromForm();
  const rows = [
    ...RUNES.map((rune) => normalProfitRow(rune, form.calcOptions, prices)),
    ...COMBINATION_RUNES.map((combo) => combinationProfitRow(combo, form.calcOptions, prices)),
  ].sort((a, b) => a.rune.reqLevel - b.rune.reqLevel || a.rune.name.localeCompare(b.rune.name));

  const bestGpRow = findBestProfitRow(rows);
  const bestXpRow = findBestXpRow(rows);
  const visibleRows = craftableOnly ? rows.filter((row) => row.canCraft) : rows;

  for (const row of visibleRows) {
    appendProfitRow(tbody, row, {
      isBestGp: bestGpRow && row === bestGpRow,
      isBestXp: bestXpRow && row === bestXpRow,
    });
  }

  renderProfitHighlights(bestGpRow, bestXpRow);
  if (throughput) throughput.textContent = profitThroughputText(form);
  if (setupSummary) setupSummary.textContent = profitSetupSummary(form);
}

function bindProfitControls() {
  if (profitControlsBound) return;
  profitControlsBound = true;

  applyTabPreset("profit", PROFIT_PRESET_FIELDS);

  const onUpdate = () => {
    if (cachedPrices) renderProfit(cachedPrices);
  };

  bindClampedInput("rc-level", { min: 1, max: LEVEL_MAX, fallback: 1, onUpdate });
  bindClampedInput("trip-seconds", {
    min: 1,
    max: INPUT_MAX,
    fallback: PROFIT_DEFAULT_TRIP_SECONDS,
    onUpdate,
  });
  bindClampedInput("essences-trip", { min: 1, max: INPUT_MAX, fallback: 1, onUpdate });

  for (const id of [
    "eye-toggle",
    "daeyalt-toggle",
    "rc-cape-toggle",
    "pouch-setup",
    "combo-binding-toggle",
    "combo-imbue-toggle",
    "profit-craftable-only",
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
