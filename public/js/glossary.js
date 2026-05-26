function glossarySuffix(rune) {
  return rune.members === false ? " <small>(F2P)</small>" : "";
}

function trendDisplay(t) {
  if (t.pct !== 0 && t.dir !== "flat") {
    return `${t.label} ${Math.abs(t.pct).toFixed(1)}%`;
  }
  return t.label;
}

function appendGlossaryRow(tbody, rune, prices) {
  const latest = prices.latest[rune.itemId];
  const day = prices.day[rune.itemId];
  const price = midPrice(latest);
  const t = trend(latest, day);

  const tr = document.createElement("tr");
  if (price == null) tr.classList.add("unavailable");

  tr.innerHTML = `
    <td>${runeNameCell(rune.name, { suffix: glossarySuffix(rune) })}</td>
    <td>${formatGp(price)}</td>
    <td class="trend-${t.dir}">${trendDisplay(t)}</td>
  `;
  tbody.appendChild(tr);
}

function renderGlossary(prices) {
  const tbody = document.querySelector("#glossary-table tbody");
  const status = document.getElementById("glossary-status");
  tbody.innerHTML = "";

  for (const rune of [...RUNES, ...COMBINATION_RUNES]) {
    appendGlossaryRow(tbody, rune, prices);
  }

  const when = prices.cachedAt
    ? new Date(prices.cachedAt).toLocaleTimeString()
    : "now";
  status.textContent = `Updated ${when}`;
}

async function loadGlossary(initialPrices = null) {
  return loadPricesForTab({
    initialPrices,
    statusId: "glossary-status",
    render: renderGlossary,
  });
}
