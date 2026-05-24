let cachedPrices = null;

function populateRuneFilter() {
  const select = document.getElementById("rune-filter");
  for (const rune of RUNES) {
    const opt = document.createElement("option");
    opt.value = rune.id;
    opt.textContent = rune.name;
    select.appendChild(opt);
  }
}

function renderProfit(prices) {
  const tbody = document.querySelector("#profit-table tbody");
  const status = document.getElementById("profit-status");
  tbody.innerHTML = "";

  const rcLevel = parseInt(document.getElementById("rc-level").value, 10) || 1;
  const eyeEnabled = document.getElementById("eye-toggle").checked;
  const filter = document.getElementById("rune-filter").value;
  const essHour = parseInt(document.getElementById("essences-hour").value, 10) || 2000;

  const runes = filter === "all" ? RUNES : RUNES.filter((r) => r.id === filter);

  for (const rune of runes) {
    const { base, total, profit } = profitPerEssence(rune, rcLevel, eyeEnabled, prices);
    const gph = profitPerHour(profit, essHour);
    const canCraft = rcLevel >= rune.reqLevel;

    const tr = document.createElement("tr");
    if (!canCraft) tr.classList.add("unavailable");

    const gpClass =
      profit != null ? (profit >= 0 ? "gp-positive" : "gp-negative") : "";
    const gphClass =
      gph != null ? (gph >= 0 ? "gp-positive" : "gp-negative") : "";

    const eyeNote = eyeEnabled && base > 0 ? ` (${base}→${total})` : "";

    const profitCell =
      canCraft && profit != null
        ? formatGp(profit)
        : canCraft && rune.note
          ? `<span title="${rune.note}">—</span>`
          : "—";

    tr.innerHTML = `
      <td>
        <span class="rune-name">
          <img src="${runeIconUrl(rune.name)}" alt="" width="18" height="18">
          ${rune.name}
        </span>
      </td>
      <td>${rune.reqLevel}</td>
      <td>${canCraft ? total + eyeNote : "—"}</td>
      <td class="${gpClass}">${profitCell}</td>
      <td class="${gphClass}">${canCraft && gph != null ? formatGp(gph) : "—"}</td>
    `;
    tbody.appendChild(tr);
  }

  const eyeLabel = eyeEnabled ? " · Eye set ON" : "";
  status.textContent = `Level ${rcLevel}${eyeLabel} · ${essHour.toLocaleString()} ess/hr`;
}

function bindProfitControls() {
  const inputs = ["rc-level", "rune-filter", "eye-toggle", "essences-hour"];
  for (const id of inputs) {
    document.getElementById(id).addEventListener("input", () => {
      if (cachedPrices) renderProfit(cachedPrices);
    });
    document.getElementById(id).addEventListener("change", () => {
      if (cachedPrices) renderProfit(cachedPrices);
    });
  }
}

async function loadProfit(initialPrices = null) {
  populateRuneFilter();
  bindProfitControls();

  const status = document.getElementById("profit-status");
  if (initialPrices) {
    cachedPrices = initialPrices;
    renderProfit(cachedPrices);
    return;
  }

  try {
    const res = await fetch("/api/prices");
    if (!res.ok) throw new Error("API error");
    cachedPrices = await res.json();
    renderProfit(cachedPrices);
  } catch {
    status.textContent = "Could not load prices. Is the server running?";
  }
}

function refreshProfit(prices) {
  cachedPrices = prices;
  renderProfit(prices);
}
