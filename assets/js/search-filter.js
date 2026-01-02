const normalizeText = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const updateStatus = (statusEl, query, matches, total) => {
  if (!statusEl) {
    return;
  }

  if (!query) {
    statusEl.textContent = "";
    return;
  }

  if (matches === 0) {
    statusEl.textContent = `Sin resultados para “${query}”.`;
    return;
  }

  statusEl.textContent = `${matches} de ${total} noticias coinciden con “${query}”.`;
};

const filterStream = () => {
  const input = document.querySelector("#site-search");
  if (!input) {
    return;
  }

  const statusEl = document.querySelector("#search-status");
  const posts = Array.from(document.querySelectorAll(".post"));
  const searchableText = posts.map((post) =>
    normalizeText(post.textContent || "")
  );
  const totalPosts = posts.length;

  const handleInput = () => {
    const query = normalizeText(input.value);
    let matches = 0;

    posts.forEach((post, index) => {
      const isMatch = !query || searchableText[index].includes(query);
      post.hidden = !isMatch;
      if (isMatch) {
        matches += 1;
      }
    });

    updateStatus(statusEl, query, matches, totalPosts);
  };

  input.addEventListener("input", handleInput);
  handleInput();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", filterStream);
} else {
  filterStream();
}
