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

function profitHighlightMeta(row) {
  const parts = [row.method];
  if (row.profit != null) parts.push(`${formatGp(row.profit)}/ess`);
  parts.push(`Lvl ${row.rune.reqLevel}`);
  return parts.join(" · ");
}

function profitHighlightCard(kind, bestRow) {
  if (bestRow) {
    return tabHighlightCard({
      kind,
      label: kind === "gp" ? "Net GP/hr" : "Net XP/hr",
      titleHtml: runeNameCell(bestRow.rune.name),
      valueHtml: kind === "gp"
        ? `${formatGp(bestRow.gpHour)}/hr`
        : `${formatXp(bestRow.xpHour)}/hr`,
      valueClass: kind === "gp" ? gpSignClass(bestRow.gpHour) : "",
      meta: profitHighlightMeta(bestRow),
    });
  }
  return tabHighlightCard({
    kind,
    label: kind === "gp" ? "Net GP/hr" : "Net XP/hr",
    empty: true,
    meta: "No craftable method at this level",
  });
}

function renderProfitHighlights(bestGpRow, bestXpRow) {
  const container = document.getElementById("profit-highlights");
  if (!container) return;
  container.innerHTML = profitHighlightCard("gp", bestGpRow) + profitHighlightCard("xp", bestXpRow);
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
    <td class="${gpSignClass(gpHour)}${isBestGp ? " profit-best-cell" : ""}">${canCraft && gpHour != null ? formatGp(gpHour) : "—"}</td>
    <td class="${isBestXp ? "profit-best-xp-cell" : ""}">${canCraft && xpHour != null ? formatXp(xpHour) + "/hr" : "—"}</td>
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
  if (throughput) {
    throughput.textContent = `${form.pouch.name} · ${form.tripsHour.toFixed(1)} trips/hr · ${form.essencesPerHour.toLocaleString()} ess/hr`;
  }
  if (setupSummary) {
    const badges = [];
    if (form.eyeEnabled) badges.push("Eye");
    if (form.daeyalt) badges.push("Daeyalt");
    if (form.rcCape) badges.push("RC cape");
    badges.push(form.bindingNecklace ? "Binding necklace" : "50% combos");
    if (form.magicImbue) badges.push("Magic Imbue");
    setupSummary.textContent =
      `Setup · Lvl ${form.rcLevel} · ${form.pouch.essencesPerTrip.toLocaleString()} ess/trip` +
      ` · ${form.tripSeconds}s · ${form.essencesPerHour.toLocaleString()} ess/hr${joinBadges(badges)}`;
  }
}

function bindProfitControls(onUpdate) {
  applyTabPreset("profit", PROFIT_PRESET_FIELDS);
  bindClampedInput("rc-level", { min: 1, max: LEVEL_MAX, fallback: 1, onUpdate });
  bindClampedInput("trip-seconds", { min: 1, max: INPUT_MAX, fallback: PROFIT_DEFAULT_TRIP_SECONDS, onUpdate });
  bindClampedInput("essences-trip", { min: 1, max: INPUT_MAX, fallback: 1, onUpdate });
  for (const id of [
    "eye-toggle", "daeyalt-toggle", "rc-cape-toggle", "pouch-setup",
    "combo-binding-toggle", "combo-imbue-toggle", "profit-craftable-only",
  ]) {
    bindControl(id, onUpdate);
  }
  bindPresetFields("profit", PROFIT_PRESET_FIELDS);
}

const loadProfit = initPriceTab({
  statusId: "profit-status",
  bindControls: bindProfitControls,
  render: renderProfit,
});
