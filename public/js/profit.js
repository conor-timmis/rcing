let cachedPrices = null;

function renderProfit(prices) {
  const tbody = document.querySelector("#profit-table tbody");
  const status = document.getElementById("profit-status");
  tbody.innerHTML = "";

  const rcLevel = parseInt(document.getElementById("rc-level").value, 10) || 1;
  const eyeEnabled = document.getElementById("eye-toggle").checked;
  const pouchSetup = document.getElementById("pouch-setup").value;
  const tripsHour = parseInt(document.getElementById("trips-hour").value, 10) || 50;
  const manualEssencesPerTrip =
    parseInt(document.getElementById("essences-trip").value, 10) || 1;
  const bindingNecklace = document.getElementById("combo-binding-toggle").checked;
  const magicImbue = document.getElementById("combo-imbue-toggle").checked;
  const pouch = pouchSummary(pouchSetup, rcLevel, manualEssencesPerTrip);
  const essencesPerHour = pouch.essencesPerTrip * tripsHour;

  document.getElementById("essences-trip").disabled = pouchSetup !== "manual";

  const options = {
    rcLevel,
    eyeEnabled,
    bindingNecklace,
    magicImbue,
    essencesPerAction: pouch.essencesPerTrip,
    essencesPerHour,
  };

  const rows = [
    ...RUNES.map((rune) => normalProfitRow(rune, options, prices)),
    ...COMBINATION_RUNES.map((combo) => combinationProfitRow(combo, options, prices)),
  ].sort((a, b) => a.rune.reqLevel - b.rune.reqLevel || a.rune.name.localeCompare(b.rune.name));

  for (const row of rows) {
    const { rune, canCraft, profit, gpHour } = row;

    const tr = document.createElement("tr");
    if (!canCraft) tr.classList.add("unavailable");

    const gpClass =
      profit != null ? (profit >= 0 ? "gp-positive" : "gp-negative") : "";
    const gphClass =
      gpHour != null ? (gpHour >= 0 ? "gp-positive" : "gp-negative") : "";

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
      <td>${row.method}</td>
      <td>${formatGp(row.price)}</td>
      <td>${canCraft ? row.outputPerEssence ?? "—" : "—"}</td>
      <td class="${gpClass}">${profitCell}</td>
      <td class="${gphClass}">${canCraft && gpHour != null ? formatGp(gpHour) : "—"}</td>
    `;
    tbody.appendChild(tr);
  }

  const eyeLabel = eyeEnabled ? " · Eye set ON" : "";
  const comboLabel = bindingNecklace ? " · Binding necklace ON" : " · 50% combo success";
  const imbueLabel = magicImbue ? " · Magic Imbue ON" : "";
  status.textContent = `Level ${rcLevel}${eyeLabel}${comboLabel}${imbueLabel} · ${pouch.name} · ${pouch.essencesPerTrip.toLocaleString()} ess/trip × ${tripsHour.toLocaleString()} trips/hr = ${essencesPerHour.toLocaleString()} ess/hr`;
}

function bindProfitControls() {
  const inputs = [
    "rc-level",
    "eye-toggle",
    "abyss-recommended-toggle",
    "pouch-setup",
    "trips-hour",
    "essences-trip",
    "combo-binding-toggle",
    "combo-imbue-toggle",
  ];
  for (const id of inputs) {
    document.getElementById(id).addEventListener("input", () => {
      applyAbyssRecommendation(id);
      if (cachedPrices) renderProfit(cachedPrices);
    });
    document.getElementById(id).addEventListener("change", () => {
      applyAbyssRecommendation(id);
      if (cachedPrices) renderProfit(cachedPrices);
    });
  }
}

function applyAbyssRecommendation(changedId) {
  const toggle = document.getElementById("abyss-recommended-toggle");
  if (!toggle.checked) return;

  if (
    !["abyss-recommended-toggle", "rc-level"].includes(changedId) &&
    changedId !== "eye-toggle"
  ) {
    toggle.checked = false;
    return;
  }

  const rcLevel = parseInt(document.getElementById("rc-level").value, 10) || 1;
  document.getElementById("pouch-setup").value = recommendedAbyssSetup(rcLevel);
  document.getElementById("trips-hour").value = 50;
  document.getElementById("eye-toggle").checked = true;
}

async function loadProfit(initialPrices = null) {
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
