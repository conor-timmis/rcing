function renderGlossary(prices) {
  const tbody = document.querySelector("#glossary-table tbody");
  const status = document.getElementById("glossary-status");
  tbody.innerHTML = "";

  let loaded = 0;
  for (const rune of RUNES) {
    const latest = prices.latest[rune.itemId];
    const day = prices.day[rune.itemId];
    const price = midPrice(latest);
    const t = trend(latest, day);

    if (price != null) loaded++;

    const tr = document.createElement("tr");
    if (price == null) tr.classList.add("unavailable");

    const trendClass = `trend-${t.dir}`;
    const trendText =
      t.pct !== 0 && t.dir !== "flat"
        ? `${t.label} ${Math.abs(t.pct).toFixed(1)}%`
        : t.label;

    tr.innerHTML = `
      <td>
        <span class="rune-name">
          <img src="${runeIconUrl(rune.name)}" alt="" width="18" height="18">
          ${rune.name}${rune.members ? "" : " <small>(F2P)</small>"}
        </span>
      </td>
      <td>${formatGp(price)}</td>
      <td class="${trendClass}">${trendText}</td>
    `;
    tbody.appendChild(tr);
  }

  const when = prices.cachedAt
    ? new Date(prices.cachedAt).toLocaleTimeString()
    : "now";
  status.textContent = `${loaded}/${RUNES.length} prices loaded · updated ${when}`;
}

async function loadGlossary() {
  const status = document.getElementById("glossary-status");
  try {
    const res = await fetch("/api/prices");
    if (!res.ok) throw new Error("API error");
    const prices = await res.json();
    renderGlossary(prices);
    return prices;
  } catch {
    status.textContent = "Could not load prices. Is the server running?";
    return null;
  }
}
