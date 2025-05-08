// Config
const API_URL = "http://localhost:5678/api/works";
const CATEGORIES_URL = "http://localhost:5678/api/categories";

// Éléments DOM
let navLogin, containerFilters, gallery;

function toggleEditVisibility() {
  const editSpan = document.querySelector(".galerie-editeur");
  if (!editSpan) return;
  editSpan.classList.toggle("none", !localStorage.getItem("token"));
}

// Auth
function setupAuth() {
  navLogin = document.querySelector(".login");
  if (!navLogin) return;

  navLogin.textContent = localStorage.getItem("token") ? "logout" : "login";

  navLogin.addEventListener("click", (e) => {
    if (localStorage.getItem("token")) {
      e.preventDefault();
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  });
}

// Visibilité des filtres
function toggleFiltersVisibility() {
  if (!containerFilters) return;
  containerFilters.style.display = localStorage.getItem("token")
    ? "none"
    : "block";
}

// Projets
async function getProjects() {
  try {
    const response = await fetch(API_URL);
    return await response.json();
  } catch (error) {
    console.error("Erreur getProjects:", error);
    return [];
  }
}

function renderProjects(projects) {
  gallery.innerHTML = projects
    .map(
      (project) => `
    <div class="project">
      <img src="${project.imageUrl}" alt="${project.title}">
      <h3>${project.title}</h3>
      ${project.description ? `<p>${project.description}</p>` : ""}
    </div>
  `
    )
    .join("");
}

// Filtres
async function createFilters() {
  const categories = await fetch(CATEGORIES_URL).then((r) => r.json());

  containerFilters.innerHTML = `
    <button data-filter="all">Tous</button>
    ${categories
      .map((cat) => `<button data-filter="${cat.id}">${cat.name}</button>`)
      .join("")}
  `;
}

// Initialisation
async function init() {
  // Éléments DOM
  navLogin = document.querySelector(".login");
  containerFilters = document.querySelector(".filter-form");
  gallery = document.querySelector(".gallery");

  if (!containerFilters || !gallery) {
    console.error("Éléments DOM manquants");
    return;
  }

  await createFilters();
  toggleFiltersVisibility(); // Contrôle initial de visibilité
  toggleEditVisibility();

  const projects = await getProjects();
  renderProjects(projects);

  // Gestion filtres
  containerFilters.addEventListener("click", (e) => {
    const filter = e.target.dataset.filter;
    if (!filter) return;

    const filtered =
      filter === "all"
        ? projects
        : projects.filter((p) => p.category.id.toString() === filter);

    renderProjects(filtered);
  });
}

// Chargement
document.addEventListener("DOMContentLoaded", () => {
  setupAuth();
  init();
});
