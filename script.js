// Config
const API_URL = "http://localhost:5678/api/works";
//const API_URL_ID = `http://localhost:5678/api/works/${id}`;
const CATEGORIES_URL = "http://localhost:5678/api/categories";
const loged = window.localStorage.getItem("token");

// Éléments DOM
let navLogin, containerFilters, gallery;

function toggleEditVisibility() {
  const editSpan = document.querySelector(".galerie-editeur");
  if (!editSpan) return;
  editSpan.classList.toggle("none", !loged);
}

// Auth
function setupAuth() {
  navLogin = document.querySelector(".login");
  if (!navLogin) return;

  navLogin.textContent = loged ? "logout" : "login";

  navLogin.addEventListener("click", (e) => {
    if (loged) {
      e.preventDefault();
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  });
}

// Visibilité des filtres
function toggleFiltersVisibility() {
  if (!containerFilters) return;
  containerFilters.style.display = loged ? "none" : "block";
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
       <span class="trash-icon" id="${project.id}" onclick="deleteImage('${
        project.imageUrl
      }', '${project.id}')">🗑️</span>
      </div>
    `
    )
    .join("");

  // Ajouter la fonctionnalité de l'icône de suppression après le rendu
  const trashIcons = document.querySelectorAll(".trash-icon");
  trashIcons.forEach((icon) => {
    icon.onclick = function (event) {
      event.stopPropagation(); // Empêche la propagation de l'événement si vous avez d'autres écouteurs
      const imgSrc = icon.previousElementSibling.src; // Récupère la source de l'image liée
      const projectId = icon.id; // l'id est déjà mis comme attribut sur le span
      deleteImage(imgSrc, projectId);
    };
  });
}

async function deleteImage(src, id) {
  console.log(`Suppression de l'image : ${src}`);
  const init = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loged}`,
    },
  };

  // Faire la requête pour supprimer la photo
  const response = await fetch(`${API_URL}/${id}`, init);

  if (!response.ok) {
    console.error(
      "Erreur lors de la suppression du projet :",
      response.statusText
    );
    return;
  }

  // Trouver l'élément correspondant au projet que vous souhaitez supprimer
  const projectElement = [...gallery.children].find(
    (project) => project.querySelector("img").src === src
  );

  if (projectElement) {
    projectElement.remove(); // Supprime l'élément du DOM
  }
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

//Modale

function openModalWithGalleryImages() {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");

  // Récupère toutes les images de la galerie
  const galleryImages = document.querySelectorAll(".gallery img");

  // Construit le HTML avec toutes les images en miniature
  modalBody.innerHTML = Array.from(galleryImages)
    .map(
      (img) => `
      <div class="image-container">
        <img src="${img.src}" alt="${img.alt}">
        <span class="trash-icon">🗑️</span>
      </div>
    `
    )
    .join("");

  modal.style.display = "flex";

  // Après avoir inséré le HTML dans la modale
  const trashIcons = modalBody.querySelectorAll(".trash-icon");
  trashIcons.forEach((icon) => {
    icon.onclick = function (event) {
      event.stopPropagation();
      // Supprime uniquement la miniature de la modale
      icon.parentElement.remove();
    };
  });
}

// Ouvre la modale au clic sur "modifier"
document
  .getElementById("edit-btn")
  .addEventListener("click", openModalWithGalleryImages);

// Ferme la modale au clic sur la croix
document.querySelector(".close-btn").addEventListener("click", function () {
  document.getElementById("modal").style.display = "none";
});

// Ferme la modale au clic en dehors du contenu
window.addEventListener("click", function (event) {
  const modal = document.getElementById("modal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

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
  setupModal(); // <-- Initialisation de la modale
});
