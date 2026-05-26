const CORE_SCRIPTS = ["/js/runes.js", "/js/inputs.js", "/js/calc.js"];

const TAB_SCRIPTS = {
  glossary: ["/js/glossary.js"],
  profit: ["/js/profit.js"],
  zmi: ["/js/zmi-data.js", "/js/zmi.js"],
  gotr: ["/js/gotr-data.js", "/js/gotr.js"],
};

const scriptPromises = new Map();
let coreLoad = null;

function loadScript(src) {
  if (scriptPromises.has(src)) return scriptPromises.get(src);

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromises.delete(src);
      reject(new Error(`Failed to load ${src}`));
    };
    document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
}

async function loadScriptChain(sources) {
  for (const src of sources) {
    await loadScript(src);
  }
}

function loadCore() {
  if (!coreLoad) coreLoad = loadScriptChain(CORE_SCRIPTS);
  return coreLoad;
}

async function loadTabScripts(tab) {
  await loadCore();
  await loadScriptChain(TAB_SCRIPTS[tab] ?? []);
}

let sharedPrices = null;
let pricesFetch = null;
const readyTabs = new Set();
const tabReadyPromises = new Map();

async function getPrices() {
  if (sharedPrices) return sharedPrices;

  if (!pricesFetch) {
    pricesFetch = fetch("/api/prices")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((prices) => {
        sharedPrices = prices;
        return prices;
      })
      .catch((err) => {
        pricesFetch = null;
        throw err;
      });
  }

  return pricesFetch;
}

const TAB_STATUS_IDS = {
  glossary: "glossary-status",
  profit: "profit-status",
  zmi: "zmi-status",
  gotr: "gotr-status",
};

function tabStatusId(tab) {
  return TAB_STATUS_IDS[tab];
}

function showTabError(tab, message) {
  const status = document.getElementById(tabStatusId(tab));
  if (status) {
    status.textContent = message;
    status.classList.add("status-error");
  }
}

async function ensureTabReady(tab) {
  if (readyTabs.has(tab)) return;
  if (tabReadyPromises.has(tab)) return tabReadyPromises.get(tab);

  const promise = (async () => {
    try {
      await loadTabScripts(tab);
      const prices = await getPrices();
      if (tab === "glossary") await loadGlossary(prices);
      else if (tab === "profit") await loadProfit(prices);
      else if (tab === "zmi") await loadZmi(prices);
      else if (tab === "gotr") await loadGotr(prices);
      readyTabs.add(tab);
    } catch {
      showTabError(tab, "Could not load this tab. Try refreshing the page.");
    } finally {
      tabReadyPromises.delete(tab);
    }
  })();

  tabReadyPromises.set(tab, promise);
  return promise;
}

function switchTab(target) {
  document.querySelectorAll(".tab").forEach((tab) => {
    const isActive = tab.dataset.tab === target;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive);
  });

  document.querySelectorAll(".panel").forEach((panel) => {
    const isActive = panel.id === `panel-${target}`;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });

  ensureTabReady(target);
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  tab.addEventListener("mouseenter", () => ensureTabReady(tab.dataset.tab), { once: true });
});

switchTab("glossary");
