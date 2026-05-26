let gotrCachedPrices = null;
let gotrControlsBound = false;

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

function gotrStatusText(options, summary) {
  const comboNote = options.comboRunes
    ? summary.comboCosts != null
      ? ` · Combo costs ${formatGp(summary.comboCosts)}/hr`
      : " · Combo costs unknown"
    : "";

  const netNote =
    options.comboRunes && summary.netGpHour != null
      ? ` · Net ${formatGp(summary.netGpHour)}/hr`
      : "";

  return (
    `Level ${options.rcLevel} · ${summary.searchesPerHour} reward searches/hr` +
    ` · ~${summary.rcXpPerHour.toLocaleString()} RC xp/hr` +
    ` · ~${summary.grossGpHour.toLocaleString()} gp/hr rewards` +
    netNote +
    comboNote +
    ` · ${options.elementalPoints} elem + ${options.catalyticPoints} cat pts/game` +
    (options.lantern ? " · Lantern ON" : "") +
    (options.boostedRates ? " · Boosted rates" : "")
  );
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
  const status = document.getElementById("gotr-status");
  tbody.innerHTML = "";

  const options = gotrOptionsFromForm();
  const summary = gotrSummary(options, prices);

  for (const row of summary.rows) {
    if (row.gpPerSearch == null || row.gpPerSearch <= 0) continue;
    appendGotrRow(tbody, row, summary.searchesPerHour);
  }

  status.textContent = gotrStatusText(options, summary);
}

function bindGotrControls() {
  if (gotrControlsBound) return;
  gotrControlsBound = true;

  applyTabPreset("gotr", GOTR_PRESET_FIELDS);

  const onUpdate = () => {
    if (gotrCachedPrices) renderGotr(gotrCachedPrices);
  };

  bindClampedInput("gotr-rc-level", {
    min: GOTR_MIN_LEVEL,
    max: LEVEL_MAX,
    fallback: GOTR_MIN_LEVEL,
    onUpdate,
  });
  bindClampedInput("gotr-games-hour", { min: 1, max: INPUT_MAX, fallback: 1, onUpdate });
  bindClampedInput("gotr-elemental-points", { min: 0, max: INPUT_MAX, fallback: 1, onUpdate });
  bindClampedInput("gotr-catalytic-points", { min: 0, max: INPUT_MAX, fallback: 1, onUpdate });

  for (const id of ["gotr-boosted-rates", "gotr-lantern-toggle", "gotr-combo-toggle"]) {
    bindControl(id, onUpdate);
  }

  bindPresetFields("gotr", GOTR_PRESET_FIELDS);
}

async function loadGotr(initialPrices = null) {
  bindGotrControls();
  return loadPricesForTab({
    initialPrices,
    statusId: "gotr-status",
    render: (prices) => {
      gotrCachedPrices = prices;
      renderGotr(prices);
    },
  });
}
