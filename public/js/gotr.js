let gotrCachedPrices = null;
let gotrControlsBound = false;

const CHANCE_PERCENT_THRESHOLD = 0.01;
const CHANCE_FRACTION_THRESHOLD = 0.001;
const QTY_WHOLE_NUMBER_THRESHOLD = 100;
const QTY_ONE_DECIMAL_THRESHOLD = 1;
const GOTR_MIN_LEVEL = 27;

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
