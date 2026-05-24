let cachedCombinationPrices = null;

function renderCombinationRunes(prices) {
  const tbody = document.querySelector("#combination-table tbody");
  const status = document.getElementById("combination-status");
  tbody.innerHTML = "";

  const rcLevel = parseInt(document.getElementById("combo-rc-level").value, 10) || 1;
  const essencesPerAction =
    parseInt(document.getElementById("combo-essences-action").value, 10) || 26;
  const bindingNecklace = document.getElementById("combo-binding-toggle").checked;
  const magicImbue = document.getElementById("combo-imbue-toggle").checked;

  const options = { essencesPerAction, bindingNecklace, magicImbue };

  for (const combo of COMBINATION_RUNES) {
    const estimate = bestCombinationRoute(combo, options, prices);
    const canCraft = rcLevel >= combo.reqLevel;
    const route = estimate.route;
    const gpClass =
      estimate.profit != null
        ? estimate.profit >= 0
          ? "gp-positive"
          : "gp-negative"
        : "";
    const actionClass =
      estimate.actionProfit != null
        ? estimate.actionProfit >= 0
          ? "gp-positive"
          : "gp-negative"
        : "";

    const tr = document.createElement("tr");
    if (!canCraft) tr.classList.add("unavailable");

    const routeNote = magicImbue
      ? `${route.altar} with ${route.inputName}`
      : `${route.altar} with ${route.inputName} + ${route.talismanName}`;

    tr.innerHTML = `
      <td>
        <span class="rune-name">
          <img src="${runeIconUrl(combo.name)}" alt="" width="18" height="18">
          ${combo.name}
        </span>
      </td>
      <td>${combo.reqLevel}</td>
      <td>${formatGp(estimate.runePrice)}</td>
      <td>${routeNote}</td>
      <td>${formatGp(estimate.cost)}</td>
      <td>${estimate.outputPerEssence != null ? estimate.outputPerEssence.toFixed(1) : "—"}</td>
      <td class="${gpClass}">${canCraft ? formatGp(estimate.profit) : "—"}</td>
      <td class="${actionClass}">${canCraft ? formatGp(estimate.actionProfit) : "—"}</td>
    `;
    tbody.appendChild(tr);
  }

  const necklaceLabel = bindingNecklace ? "Binding necklace ON" : "50% success";
  const imbueLabel = magicImbue ? "Magic Imbue ON" : "Talisman cost ON";
  status.textContent = `Level ${rcLevel} · ${essencesPerAction.toLocaleString()} ess/action · ${necklaceLabel} · ${imbueLabel}`;
}

function bindCombinationControls() {
  const inputs = [
    "combo-rc-level",
    "combo-essences-action",
    "combo-binding-toggle",
    "combo-imbue-toggle",
  ];

  for (const id of inputs) {
    document.getElementById(id).addEventListener("input", () => {
      if (cachedCombinationPrices) renderCombinationRunes(cachedCombinationPrices);
    });
    document.getElementById(id).addEventListener("change", () => {
      if (cachedCombinationPrices) renderCombinationRunes(cachedCombinationPrices);
    });
  }
}

async function loadCombinationRunes(initialPrices = null) {
  bindCombinationControls();

  const status = document.getElementById("combination-status");
  if (initialPrices) {
    cachedCombinationPrices = initialPrices;
    renderCombinationRunes(cachedCombinationPrices);
    return;
  }

  try {
    const res = await fetch("/api/prices");
    if (!res.ok) throw new Error("API error");
    cachedCombinationPrices = await res.json();
    renderCombinationRunes(cachedCombinationPrices);
  } catch {
    status.textContent = "Could not load prices. Is the server running?";
  }
}

function refreshCombinationRunes(prices) {
  cachedCombinationPrices = prices;
  renderCombinationRunes(prices);
}
