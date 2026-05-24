document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === target);
      t.setAttribute("aria-selected", t.dataset.tab === target);
    });

    document.querySelectorAll(".panel").forEach((panel) => {
      const isActive = panel.id === `panel-${target}`;
      panel.classList.toggle("active", isActive);
      panel.hidden = !isActive;
    });
  });
});

(async () => {
  const prices = await loadGlossary();
  await loadProfit(prices);
  await loadGotr(prices);
})();
