const normalize = (value) =>
  value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const searchForm = document.querySelector(".search-box");
const searchInput = document.querySelector("#site-search");
const faqItems = [...document.querySelectorAll(".faq-item")];
const feedback = document.querySelector(".search-feedback");
const searchSection = document.querySelector("#resultado-busca");
const resultsContainer = document.querySelector("#product-results");
const resultsCount = document.querySelector("#product-results-count");
const searchEmpty = document.querySelector("#product-search-empty");
const generalContact = document.querySelector("#search-general-contact");
const emptyContact = document.querySelector("#empty-search-contact");
const routeBox = document.querySelector(".search-route");
const routeTitle = document.querySelector("#search-route-title");
const routeCopy = document.querySelector("#search-route-copy");
const loadMoreButton = document.querySelector(".load-more-products");
const clearSearchButton = document.querySelector(".clear-search");

const STORE_BASE_URL = "https://www.campagnaro.com.br";
const SALES_PHONE = "5554993992000";
const FINANCIAL_PHONE = "5554991345150";
const PRODUCTS_PER_PAGE = 12;
const products = Array.isArray(window.CAMPAGNARO_PRODUCTS)
  ? window.CAMPAGNARO_PRODUCTS
  : [];

const stopWords = new Set([
  "a",
  "ao",
  "aos",
  "as",
  "com",
  "como",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "eu",
  "garantia",
  "gostaria",
  "me",
  "meu",
  "minha",
  "o",
  "os",
  "para",
  "peca",
  "pecas",
  "preciso",
  "problema",
  "produto",
  "produtos",
  "qual",
  "quero",
  "saber",
  "sobre",
  "tenho",
  "troca",
  "uma",
]);

const financialTerms = [
  "boleto",
  "cartao",
  "cobranca",
  "comprovante",
  "estorno",
  "financeiro",
  "nota fiscal",
  "pagamento",
  "parcelamento",
  "pix",
];

const afterSalesTerms = [
  "assistencia",
  "devolucao",
  "garantia",
  "pos-venda",
  "problema",
  "troca",
];

let productIndex;
let currentMatches = [];
let currentQuery = "";
let visibleProductCount = PRODUCTS_PER_PAGE;

function getProductIndex() {
  if (productIndex) return productIndex;

  productIndex = products.map((product) => {
    const normalizedName = normalize(product.name ?? "");
    const normalizedCategories = normalize((product.categories ?? []).join(" "));
    const normalizedDetails = normalize(product.search ?? "");

    return {
      product,
      normalizedName,
      normalizedCategories,
      normalizedDetails,
      searchText: `${normalizedName} ${normalizedCategories} ${normalizedDetails}`,
    };
  });

  return productIndex;
}

function getSearchTerms(rawTerm) {
  const allTerms = normalize(rawTerm)
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 1);
  const usefulTerms = allTerms.filter((term) => !stopWords.has(term));
  return usefulTerms.length ? usefulTerms : allTerms;
}

function findProducts(rawTerm) {
  const normalizedQuery = normalize(rawTerm);
  const terms = getSearchTerms(rawTerm);

  if (!terms.length) return [];

  return getProductIndex()
    .map((entry) => {
      if (!terms.every((term) => entry.searchText.includes(term))) return null;

      let score = 0;
      if (entry.normalizedName === normalizedQuery) score += 160;
      if (entry.normalizedName.startsWith(normalizedQuery)) score += 100;
      if (entry.normalizedName.includes(normalizedQuery)) score += 70;

      terms.forEach((term) => {
        if (entry.normalizedName.includes(term)) score += 35;
        if (entry.normalizedCategories.includes(term)) score += 18;
        if (entry.normalizedDetails.includes(term)) score += 6;
      });

      return { ...entry.product, score };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const scoreDifference = b.score - a.score;
      if (scoreDifference) return scoreDifference;

      return a.name.localeCompare(b.name, "pt-BR");
    });
}

function getRoute(rawTerm) {
  const term = normalize(rawTerm);

  if (financialTerms.some((item) => term.includes(item))) {
    return {
      type: "financial",
      title: "Financeiro e pagamentos — Leonardo",
      copy: "Sua dúvida será enviada diretamente ao responsável pelo setor financeiro.",
      phone: FINANCIAL_PHONE,
      message: `Olá, Leonardo! Preciso de ajuda com esta questão financeira: ${rawTerm.trim()}`,
    };
  }

  if (afterSalesTerms.some((item) => term.includes(item))) {
    return {
      type: "after-sales",
      title: "Dúvida sobre troca, garantia ou pós-venda",
      copy: "Envie os detalhes e, se possível, tenha a nota fiscal e fotos do produto em mãos.",
      phone: SALES_PHONE,
      message: `Olá! Preciso de ajuda com esta solicitação de pós-venda: ${rawTerm.trim()}`,
    };
  }

  return {
    type: "products",
    title: "Dúvida sobre produtos",
    copy: "Escolha um produto abaixo ou envie sua pergunta para a equipe de vendedores.",
    phone: SALES_PHONE,
    message: `Olá! Tenho uma dúvida sobre produtos: ${rawTerm.trim()}`,
  };
}

function getWhatsAppUrl(phone, message) {
  return `https://api.whatsapp.com/send?l=pt_br&phone=${phone}&text=${encodeURIComponent(message)}`;
}

function getProductUrl(product) {
  const path = String(product.url ?? "");
  if (/^https?:\/\//i.test(path)) return path;
  return `${STORE_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function createProductCard(product) {
  const productUrl = getProductUrl(product);
  const card = document.createElement("article");
  const category = document.createElement("span");
  const title = document.createElement("h3");
  const description = document.createElement("p");
  const actions = document.createElement("div");
  const productLink = document.createElement("a");
  const whatsappLink = document.createElement("a");

  card.className = "product-card";
  category.className = "product-category";
  title.textContent = product.name;
  description.className = "product-description";
  description.textContent =
    "Consulte aplicação, compatibilidade e outras informações com nossa equipe.";

  const categoryText = (product.categories ?? []).join(" › ");
  category.textContent = categoryText || product.brand || "Peças e acessórios";
  category.title = category.textContent;

  actions.className = "product-actions";
  productLink.className = "product-link";
  productLink.href = productUrl;
  productLink.target = "_blank";
  productLink.rel = "noopener";
  productLink.textContent = "Ver produto";

  const message = `Olá! Gostaria de tirar uma dúvida sobre o produto: ${product.name}\nLink: ${productUrl}`;

  whatsappLink.className = "product-whatsapp";
  whatsappLink.href = getWhatsAppUrl(SALES_PHONE, message);
  whatsappLink.target = "_blank";
  whatsappLink.rel = "noopener";
  whatsappLink.textContent = "Perguntar ao vendedor";

  actions.append(productLink, whatsappLink);
  card.append(category, title, description, actions);

  return card;
}

function renderProducts() {
  resultsContainer.replaceChildren();
  const productsToShow = currentMatches.slice(0, visibleProductCount);
  const total = currentMatches.length;

  productsToShow.forEach((product) => {
    resultsContainer.append(createProductCard(product));
  });

  if (total) {
    const displayed = Math.min(visibleProductCount, total);
    resultsCount.textContent = `Exibindo ${displayed} de ${total} ${
      total === 1 ? "produto encontrado" : "produtos encontrados"
    } para “${currentQuery}”.`;
  }

  loadMoreButton.hidden = visibleProductCount >= total;
}

function performSearch(rawTerm) {
  const query = rawTerm.trim();

  if (!query) {
    feedback.textContent = "Digite o nome de um produto ou descreva sua dúvida.";
    searchInput.focus();
    return;
  }

  const route = getRoute(query);
  currentQuery = query;
  visibleProductCount = PRODUCTS_PER_PAGE;
  currentMatches = route.type === "financial" ? [] : findProducts(query);

  routeBox.classList.toggle("is-financial", route.type === "financial");
  routeTitle.textContent = route.title;
  routeCopy.textContent = route.copy;
  generalContact.href = getWhatsAppUrl(route.phone, route.message);
  generalContact.textContent =
    route.type === "financial" ? "Falar com o Leonardo" : "Enviar minha dúvida";
  emptyContact.href = getWhatsAppUrl(route.phone, route.message);

  searchSection.hidden = false;
  searchEmpty.hidden = route.type === "financial" || currentMatches.length > 0;

  if (route.type === "financial") {
    resultsContainer.replaceChildren();
    resultsCount.textContent = "Atendimento financeiro identificado.";
    loadMoreButton.hidden = true;
    feedback.textContent = "Encontramos o canal certo para sua solicitação.";
  } else if (currentMatches.length) {
    renderProducts();
    feedback.textContent = `${currentMatches.length} ${
      currentMatches.length === 1 ? "produto encontrado" : "produtos encontrados"
    } para “${query}”.`;
  } else {
    resultsContainer.replaceChildren();
    resultsCount.textContent = `Nenhum produto encontrado para “${query}”.`;
    loadMoreButton.hidden = true;
    feedback.textContent = "Não encontramos um produto exato, mas você pode enviar sua dúvida.";
  }

  searchSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  performSearch(searchInput.value);
});

searchInput.addEventListener("input", () => {
  if (!searchInput.value.trim()) feedback.textContent = "";
});

loadMoreButton.addEventListener("click", () => {
  visibleProductCount += PRODUCTS_PER_PAGE;
  renderProducts();
});

clearSearchButton.addEventListener("click", () => {
  searchInput.value = "";
  feedback.textContent = "";
  searchSection.hidden = true;
  resultsContainer.replaceChildren();
  currentMatches = [];
  searchInput.focus();
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
