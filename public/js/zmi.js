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

function zmiStatusText(options, summary) {
  const daeyaltNote = options.daeyalt ? " · Daeyalt (XP only, untradeable ess)" : "";
  const diaryNote = options.ardougneDiary ? " · Ardougne diary ON" : "";
  const eyeNote = options.eyeEnabled ? " · Eye set ON" : "";
  const supplyNote = options.includeSupplyCosts
    ? summary.supplyCostPerHour != null
      ? ` · Supplies ${formatGp(summary.supplyCostPerHour)}/hr`
      : " · Supply costs unknown"
    : "";

  const netNote =
    summary.netGpHour != null ? ` · Net ${formatGp(summary.netGpHour)}/hr` : "";

  return (
    `Level ${options.rcLevel}${daeyaltNote}${diaryNote}${eyeNote}` +
    ` · ${summary.pouch.name} · ${summary.essencesPerHour.toLocaleString()} ess/hr` +
    ` · ~${summary.rcXpPerHour.toLocaleString()} RC xp/hr` +
    ` · ~${summary.grossGpHour?.toLocaleString() ?? "—"} gp/hr gross` +
    netNote +
    supplyNote +
    ` · ${options.tripSeconds}s/trip`
  );
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
  const status = document.getElementById("zmi-status");
  tbody.innerHTML = "";

  const options = zmiOptionsFromForm();
  const summary = zmiSummary(options, prices);

  for (const row of summary.rows) {
    if (row.gpPerEssence == null || row.gpPerEssence <= 0) continue;
    appendZmiRow(tbody, row, summary.essencesPerHour);
  }

  status.textContent = zmiStatusText(options, summary);
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
