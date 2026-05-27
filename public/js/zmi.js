let zmiCachedPrices = null;
let zmiControlsBound = false;

const ZMI_MIN_TRIP_SECONDS = 30;
const ZMI_MAX_TRIP_SECONDS = 300;

const ZMI_PRESET_FIELDS = [
  { id: "zmi-rc-level", type: "int" },
  { id: "zmi-eye-toggle", type: "bool" },
  { id: "zmi-pouch-setup", type: "select" },
  { id: "zmi-trip-seconds", type: "int" },
  { id: "zmi-essences-trip", type: "int" },
  { id: "zmi-daeyalt-toggle", type: "bool" },
  { id: "zmi-diary-toggle", type: "bool" },
  { id: "zmi-supply-costs-toggle", type: "bool" },
];

function zmiOptionsFromForm() {
  const rcLevel = readClampedInput("zmi-rc-level", 1, LEVEL_MAX, 1);
  const pouchSetup = document.getElementById("zmi-pouch-setup").value;
  const manualEssencesPerTrip = readClampedInput("zmi-essences-trip", 1, INPUT_MAX, 1);

  document.getElementById("zmi-essences-trip").disabled = pouchSetup !== "manual";

  return {
    rcLevel,
    pouchSetup,
    manualEssencesPerTrip,
    tripSeconds: readClampedInput(
      "zmi-trip-seconds",
      ZMI_MIN_TRIP_SECONDS,
      ZMI_MAX_TRIP_SECONDS,
      ZMI_DEFAULT_TRIP_SECONDS,
    ),
    eyeEnabled: document.getElementById("zmi-eye-toggle").checked,
    daeyalt: document.getElementById("zmi-daeyalt-toggle").checked,
    ardougneDiary: document.getElementById("zmi-diary-toggle").checked,
    includeSupplyCosts: document.getElementById("zmi-supply-costs-toggle").checked,
  };
}

function zmiSetupSummary(options, summary) {
  const badges = [];
  if (options.eyeEnabled) badges.push("Eye");
  if (options.daeyalt) badges.push("Daeyalt");
  if (options.ardougneDiary) badges.push("Ardougne diary");
  if (options.includeSupplyCosts) badges.push("Supply costs");
  const badgeText = badges.length ? ` · ${badges.join(", ")}` : "";

  return (
    `Setup · Lvl ${options.rcLevel} · ${summary.pouch.essencesPerTrip.toLocaleString()} ess/trip` +
    ` · ${options.tripSeconds}s · ${summary.essencesPerHour.toLocaleString()} ess/hr${badgeText}`
  );
}

function zmiThroughputText(summary) {
  return (
    `${summary.pouch.name} · ${summary.tripsPerHour.toFixed(1)} trips/hr` +
    ` · ${summary.essencesPerHour.toLocaleString()} ess/hr`
  );
}

function renderZmiHighlights(options, summary) {
  const container = document.getElementById("zmi-highlights");
  if (!container) return;

  const gpLabel = summary.netGpHour != null ? "Net GP/hr" : "Gross GP/hr";
  const gpValue = summary.netGpHour ?? summary.grossGpHour;
  const gpMetaParts = [];
  if (summary.netGpHour != null && summary.grossGpHour != null) {
    gpMetaParts.push(`Gross ${formatGp(summary.grossGpHour)}/hr`);
  }
  if (options.includeSupplyCosts && summary.supplyCostPerHour != null) {
    gpMetaParts.push(`Supplies ${formatGp(summary.supplyCostPerHour)}/hr`);
  } else if (options.includeSupplyCosts) {
    gpMetaParts.push("Supply costs unknown");
  }
  if (summary.netGpPerEssence != null) {
    gpMetaParts.push(`${formatGp(summary.netGpPerEssence)}/ess net`);
  }

  const gpCard =
    gpValue != null
      ? tabHighlightCard({
          kind: "gp",
          label: gpLabel,
          titleHtml: "Ourania altar",
          valueHtml: `${formatGp(gpValue)}/hr`,
          valueClass: gpValue >= 0 ? "gp-positive" : "gp-negative",
          meta: gpMetaParts.join(" · ") || "Mixed rune rewards",
        })
      : tabHighlightCard({
          kind: "gp",
          label: gpLabel,
          empty: true,
          meta: "GP/hr unavailable (missing prices or costs)",
        });

  const xpMeta =
    summary.xpPerEssence != null
      ? `${formatXp(summary.xpPerEssence)}/ess · ${summary.essencesPerHour.toLocaleString()} ess/hr`
      : `${summary.essencesPerHour.toLocaleString()} ess/hr`;

  const xpCard = tabHighlightCard({
    kind: "xp",
    label: "Net XP/hr",
    titleHtml: "Ourania altar",
    valueHtml: `~${formatXp(summary.rcXpPerHour)}/hr`,
    meta: xpMeta,
  });

  container.innerHTML = gpCard + xpCard;
}

function appendZmiRow(tbody, row, essencesPerHour) {
  const tr = document.createElement("tr");
  const gpHour = row.gpPerEssence != null ? row.gpPerEssence * essencesPerHour : null;

  tr.innerHTML = `
    <td>${runeNameCell(row.name, { hideIconOnError: true })}</td>
    <td>${formatChance(row.chance)}</td>
    <td>${formatQty(row.qtyPerEssence)}</td>
    <td>${formatGp(row.gpPerEssence)}</td>
    <td class="gp-positive">${gpHour != null ? formatGp(gpHour) : "—"}</td>
  `;
  tbody.appendChild(tr);
}

function renderZmi(prices) {
  const tbody = document.querySelector("#zmi-table tbody");
  const throughput = document.getElementById("zmi-throughput");
  const setupSummary = document.getElementById("zmi-setup-summary");
  tbody.innerHTML = "";

  const options = zmiOptionsFromForm();
  const summary = zmiSummary(options, prices);

  for (const row of summary.rows) {
    if (row.gpPerEssence == null || row.gpPerEssence <= 0) continue;
    appendZmiRow(tbody, row, summary.essencesPerHour);
  }

  renderZmiHighlights(options, summary);
  if (throughput) throughput.textContent = zmiThroughputText(summary);
  if (setupSummary) setupSummary.textContent = zmiSetupSummary(options, summary);
}

function bindZmiControls() {
  if (zmiControlsBound) return;
  zmiControlsBound = true;

  applyTabPreset("zmi", ZMI_PRESET_FIELDS);

  const onUpdate = () => {
    if (zmiCachedPrices) renderZmi(zmiCachedPrices);
  };

  bindClampedInput("zmi-rc-level", { min: 1, max: LEVEL_MAX, fallback: 1, onUpdate });
  bindClampedInput("zmi-trip-seconds", {
    min: ZMI_MIN_TRIP_SECONDS,
    max: ZMI_MAX_TRIP_SECONDS,
    fallback: ZMI_DEFAULT_TRIP_SECONDS,
    onUpdate,
  });
  bindClampedInput("zmi-essences-trip", { min: 1, max: INPUT_MAX, fallback: 1, onUpdate });

  for (const id of [
    "zmi-eye-toggle",
    "zmi-pouch-setup",
    "zmi-daeyalt-toggle",
    "zmi-diary-toggle",
    "zmi-supply-costs-toggle",
  ]) {
    bindControl(id, onUpdate);
  }

  bindPresetFields("zmi", ZMI_PRESET_FIELDS);
}

async function loadZmi(initialPrices = null) {
  bindZmiControls();
  return loadPricesForTab({
    initialPrices,
    statusId: "zmi-status",
    render: (prices) => {
      zmiCachedPrices = prices;
      renderZmi(prices);
    },
  });
}
