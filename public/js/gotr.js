const GOTR_MIN_LEVEL = 27;

const GOTR_PRESET_FIELDS = [
  { id: "gotr-rc-level", type: "int" },
  { id: "gotr-games-hour", type: "int" },
  { id: "gotr-elemental-points", type: "int" },
  { id: "gotr-catalytic-points", type: "int" },
  { id: "gotr-boosted-rates", type: "bool" },
  { id: "gotr-lantern-toggle", type: "bool" },
  { id: "gotr-combo-toggle", type: "bool" },
];

function gotrOptionsFromForm() {
  return {
    rcLevel: readClampedInput("gotr-rc-level", GOTR_MIN_LEVEL, LEVEL_MAX, GOTR_MIN_LEVEL),
    gamesPerHour: readClampedInput("gotr-games-hour", 1, INPUT_MAX, 1),
    elementalPoints: readClampedInput("gotr-elemental-points", 0, INPUT_MAX, 1),
    catalyticPoints: readClampedInput("gotr-catalytic-points", 0, INPUT_MAX, 1),
    boostedRates: document.getElementById("gotr-boosted-rates").checked,
    lantern: document.getElementById("gotr-lantern-toggle").checked,
    comboRunes: document.getElementById("gotr-combo-toggle").checked,
  };
}

function renderGotrHighlights(options, summary) {
  const container = document.getElementById("gotr-highlights");
  if (!container) return;

  const showNet = options.comboRunes && summary.netGpHour != null;
  const gpLabel = showNet ? "Net GP/hr" : "Reward GP/hr";
  const gpValue = showNet ? summary.netGpHour : summary.grossGpHour;
  const gpMetaParts = [`${formatGp(summary.gpPerSearch)}/search`];
  if (showNet && summary.comboCosts != null) gpMetaParts.push(`Combo costs ${formatGp(summary.comboCosts)}/hr`);
  else if (options.comboRunes) gpMetaParts.push("Combo costs unknown");
  else gpMetaParts.push(`Gross ${formatGp(summary.grossGpHour)}/hr`);

  container.innerHTML =
    tabHighlightCard({
      kind: "gp",
      label: gpLabel,
      titleHtml: "Guardians of the Rift",
      valueHtml: `${formatGp(gpValue)}/hr`,
      valueClass: gpValue >= 0 ? "gp-positive" : "gp-negative",
      meta: gpMetaParts.join(" · "),
    }) +
    tabHighlightCard({
      kind: "xp",
      label: "Net XP/hr",
      titleHtml: "Guardians of the Rift",
      valueHtml: `~${formatXp(summary.rcXpPerHour)}/hr`,
      meta: `${summary.searchesPerHour} reward searches/hr`,
    });
}

function appendGotrRow(tbody, row, searchesPerHour) {
  const tr = document.createElement("tr");
  const gpHour = row.gpPerSearch * searchesPerHour;
  tr.innerHTML = `
    <td>${runeNameCell(row.name, { hideIconOnError: true })}</td>
    <td>${formatChance(row.chance)}</td>
    <td>${formatQty(row.qtyPerSearch)}</td>
    <td>${formatGp(row.gpPerSearch)}</td>
    <td class="gp-positive">${formatGp(gpHour)}</td>
  `;
  tbody.appendChild(tr);
}

function renderGotr(prices) {
  const tbody = document.querySelector("#gotr-table tbody");
  const throughput = document.getElementById("gotr-throughput");
  const setupSummary = document.getElementById("gotr-setup-summary");
  tbody.innerHTML = "";

  const options = gotrOptionsFromForm();
  const summary = gotrSummary(options, prices);

  for (const row of summary.rows) {
    if (row.gpPerSearch == null || row.gpPerSearch <= 0) continue;
    appendGotrRow(tbody, row, summary.searchesPerHour);
  }

  renderGotrHighlights(options, summary);
  if (throughput) throughput.textContent = `${summary.searchesPerHour} reward searches/hr · ${options.gamesPerHour} games/hr`;
  if (setupSummary) {
    const badges = [];
    if (options.boostedRates) badges.push("Boosted rates");
    if (options.lantern) badges.push("Lantern");
    if (options.comboRunes) badges.push("Combo costs");
    setupSummary.textContent =
      `Setup · Lvl ${options.rcLevel} · ${options.gamesPerHour} games/hr` +
      ` · ${options.elementalPoints} elem + ${options.catalyticPoints} cat pts/game${joinBadges(badges)}`;
  }
}

function bindGotrControls(onUpdate) {
  applyTabPreset("gotr", GOTR_PRESET_FIELDS);
  bindClampedInput("gotr-rc-level", { min: GOTR_MIN_LEVEL, max: LEVEL_MAX, fallback: GOTR_MIN_LEVEL, onUpdate });
  bindClampedInput("gotr-games-hour", { min: 1, max: INPUT_MAX, fallback: 1, onUpdate });
  bindClampedInput("gotr-elemental-points", { min: 0, max: INPUT_MAX, fallback: 1, onUpdate });
  bindClampedInput("gotr-catalytic-points", { min: 0, max: INPUT_MAX, fallback: 1, onUpdate });
  for (const id of ["gotr-boosted-rates", "gotr-lantern-toggle", "gotr-combo-toggle"]) {
    bindControl(id, onUpdate);
  }
  bindPresetFields("gotr", GOTR_PRESET_FIELDS);
}

const loadGotr = initPriceTab({
  statusId: "gotr-status",
  bindControls: bindGotrControls,
  render: renderGotr,
});
