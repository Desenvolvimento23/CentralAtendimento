const normalize = (value) =>
  value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const searchForm = document.querySelector(".search-box");
const searchInput = document.querySelector("#site-search");
const supportCards = [...document.querySelectorAll(".support-card")];
const faqItems = [...document.querySelectorAll(".faq-item")];
const noResults = document.querySelector(".no-results");
const feedback = document.querySelector(".search-feedback");

function filterContent(rawTerm) {
  const term = normalize(rawTerm);
  let matches = 0;

  [...supportCards, ...faqItems].forEach((item) => {
    const content = normalize(`${item.dataset.search ?? ""} ${item.textContent}`);
    const isMatch = !term || content.includes(term);
    item.hidden = !isMatch;
    if (isMatch) matches += 1;
  });

  const visibleCards = supportCards.filter((card) => !card.hidden).length;
  noResults.hidden = visibleCards > 0 || !term;
  feedback.textContent = term
    ? `${matches} ${matches === 1 ? "resultado encontrado" : "resultados encontrados"} para “${rawTerm.trim()}”.`
    : "";
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  filterContent(searchInput.value);
  document.querySelector("#atendimento").scrollIntoView({ behavior: "smooth" });
});

searchInput.addEventListener("input", () => {
  if (!searchInput.value.trim()) filterContent("");
});

faqItems.forEach((item) => {
  const button = item.querySelector("button");
  button.addEventListener("click", () => {
    const isOpen = item.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
  });
});

const menuButton = document.querySelector(".menu-button");
const mainNav = document.querySelector(".main-nav");

menuButton.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

mainNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    mainNav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();
