const getQuery = () => {
  const params = new URLSearchParams(window.location.search);
  return (params.get("q") || "").trim();
};

const updateSearchPage = () => {
  const query = getQuery();
  const term = query || "todo";
  const termEl = document.querySelector("[data-search-term]");
  const countEl = document.querySelector("[data-results-count]");
  const inputs = document.querySelectorAll('input[name="q"]');
  const results = document.querySelectorAll(".result-card");

  inputs.forEach((input) => {
    input.value = query;
  });

  if (termEl) {
    termEl.textContent = term;
  }

  if (countEl) {
    const count = results.length;
    countEl.textContent = `Se encontraron ${count} artículos.`;
  }

  document.title = query
    ? `ANXiNA · Resultados para “${query}”`
    : "ANXiNA · Resultados de búsqueda";
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updateSearchPage);
} else {
  updateSearchPage();
}
