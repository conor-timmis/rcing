let gotrCachedPrices = null;
let gotrControlsBound = false;

function formatChance(rate) {
  if (rate >= 0.01) return `${(rate * 100).toFixed(1)}%`;
  if (rate >= 0.001) return `${(rate * 100).toFixed(2)}%`;
  return `1/${Math.round(1 / rate)}`;
}

function formatQty(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 100) return Math.round(n).toLocaleString();
  if (n >= 1) return n.toFixed(1);
  return n.toFixed(2);
}

function gotrOptionsFromForm() {
  return {
    rcLevel: readClampedInput("gotr-rc-level", 27, LEVEL_MAX, 27),
    gamesPerHour: readClampedInput("gotr-games-hour", 1, INPUT_MAX, 1),
    elementalPoints: readClampedInput("gotr-elemental-points", 0, INPUT_MAX, 1),
    catalyticPoints: readClampedInput("gotr-catalytic-points", 0, INPUT_MAX, 1),
    boostedRates: document.getElementById("gotr-boosted-rates").checked,
    lantern: document.getElementById("gotr-lantern-toggle").checked,
    comboRunes: document.getElementById("gotr-combo-toggle").checked,
  };
}

function renderGotr(prices) {
  const tbody = document.querySelector("#gotr-table tbody");
  const status = document.getElementById("gotr-status");
  tbody.innerHTML = "";

  const options = gotrOptionsFromForm();
  const summary = gotrSummary(options, prices);

  for (const row of summary.rows) {
    if (row.gpPerSearch == null || row.gpPerSearch <= 0) continue;

    const tr = document.createElement("tr");
    const gpHour = row.gpPerSearch * summary.searchesPerHour;

    tr.innerHTML = `
      <td>
        <span class="rune-name">
          <img src="${runeIconUrl(row.name)}" alt="" width="18" height="18" onerror="this.style.display='none'">
          ${row.name}
        </span>
      </td>
      <td>${formatChance(row.chance)}</td>
      <td>${formatQty(row.qtyPerSearch)}</td>
      <td>${formatGp(row.gpPerSearch)}</td>
      <td class="gp-positive">${formatGp(gpHour)}</td>
    `;
    tbody.appendChild(tr);
  }

  const comboNote = options.comboRunes
    ? summary.comboCosts != null
      ? ` · Combo costs ${formatGp(summary.comboCosts)}/hr`
      : " · Combo costs unknown"
    : "";

  const netNote =
    options.comboRunes && summary.netGpHour != null
      ? ` · Net ${formatGp(summary.netGpHour)}/hr`
      : "";

  status.textContent =
    `Level ${options.rcLevel} · ${summary.searchesPerHour} reward searches/hr` +
    ` · ~${summary.rcXpPerHour.toLocaleString()} RC xp/hr` +
    ` · ~${summary.grossGpHour.toLocaleString()} gp/hr rewards` +
    netNote +
    comboNote +
    ` · ${options.elementalPoints} elem + ${options.catalyticPoints} cat pts/game` +
    (options.lantern ? " · Lantern ON" : "") +
    (options.boostedRates ? " · Boosted rates" : "");
}

function bindGotrControls() {
  if (gotrControlsBound) return;
  gotrControlsBound = true;

  const onUpdate = () => {
    if (gotrCachedPrices) renderGotr(gotrCachedPrices);
  };

  bindClampedInput("gotr-rc-level", { min: 27, max: LEVEL_MAX, fallback: 27, onUpdate });
  bindClampedInput("gotr-games-hour", { min: 1, max: INPUT_MAX, fallback: 1, onUpdate });
  bindClampedInput("gotr-elemental-points", { min: 0, max: INPUT_MAX, fallback: 1, onUpdate });
  bindClampedInput("gotr-catalytic-points", { min: 0, max: INPUT_MAX, fallback: 1, onUpdate });

  for (const id of ["gotr-boosted-rates", "gotr-lantern-toggle", "gotr-combo-toggle"]) {
    bindControl(id, onUpdate);
  }
}

async function loadGotr(initialPrices = null) {
  bindGotrControls();

  const status = document.getElementById("gotr-status");
  if (initialPrices) {
    gotrCachedPrices = initialPrices;
    renderGotr(gotrCachedPrices);
    return;
  }

  try {
    const res = await fetch("/api/prices");
    if (!res.ok) throw new Error("API error");
    gotrCachedPrices = await res.json();
    renderGotr(gotrCachedPrices);
  } catch {
    status.textContent = "Could not load prices. Is the server running?";
  }
}
