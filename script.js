// Config
const API_URL = "http://localhost:5678/api/works";
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
      <div class="project" data-id="${project.id}">
        <img src="${project.imageUrl}" alt="${project.title}">
        <h3>${project.title}</h3>
        ${project.description ? `<p>${project.description}</p>` : ""}
      </div>
    `
    )
    .join("");
}

// Suppression de travaux existants

async function deleteWork(workId, figureElement) {
  const isConfirmed = confirm("Voulez-vous vraiment supprimer ce travail ?");
  if (!isConfirmed) return;

  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token non trouvé. Vous n'êtes pas connecté.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${workId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        text || `Échec de la suppression (statut ${response.status})`
      );
    }

    figureElement.remove(); // Supprime l'élément du DOM
    console.log(`Projet ${workId} supprimé.`);

    // Actualise la galerie après suppression
    const projects = await getProjects();
    renderProjects(projects);
  } catch (error) {
    console.error("Erreur:", error.message);
    alert("Erreur lors de la suppression.");
  }
}

//Modale
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

function openModalWithGalleryImages() {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");

  // Récupère toutes les images de la galerie
  const projects = document.querySelectorAll(".gallery .project");

  // Construit le HTML avec toutes les images en miniature
  modalBody.innerHTML = Array.from(projects)
    .map((project) => {
      const img = project.querySelector("img");
      const projectId = project.dataset.id; // Assure-toi que chaque projet a un data-id
      return `
        <div class="image-container" data-id="${projectId}">
          <img src="${img.src}" alt="${img.alt}">
          <span class="trash-icon" data-id="${projectId}"><i class="fa-solid fa-trash"></i></span>
        </div>
      `;
    })
    .join("");

  modal.style.display = "flex";

  // Gestion de la suppression dans la modale
  modalBody.querySelectorAll(".trash-icon").forEach((icon) => {
    icon.onclick = async (event) => {
      event.stopPropagation();
      const projectId = icon.dataset.id;
      const projectElement = document.querySelector(
        `.project[data-id="${projectId}"]`
      );
      await deleteWork(projectId, projectElement); // Supprime côté serveur et DOM
      icon.parentElement.remove(); // Supprime la miniature de la modale
    };
  });
}

// Filtres
// Visibilité des filtres
function toggleFiltersVisibility() {
  if (!containerFilters) return;
  containerFilters.style.display = loged ? "none" : "block";
}

async function createFilters() {
  const categories = await fetch(CATEGORIES_URL).then((r) => r.json());

  containerFilters.innerHTML = `
    <button data-filter="all">Tous</button>
    ${categories
      .map((cat) => `<button data-filter="${cat.id}">${cat.name}</button>`)
      .join("")}
  `;
}

let projects = []; // Déclare projects en variable globale
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

  projects = await getProjects(); // Utilise la variable globale
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

// DOM pour la modale d'ajout
const addModal = document.getElementById("add-modal");
const addForm = document.getElementById("add-form");
const fileInput = document.getElementById("image");
const title = document.getElementById("title");
const imagePreview = document.getElementById("image-preview");
const categorySelect = document.getElementById("category");
const addPhoto = document.getElementById("ajouter-photo-btn");
const closeAddModal = document.querySelector(".add-close-btn");

function displayModal() {
  if (loged) {
    addPhoto.addEventListener("click", (e) => {
      e.stopPropagation();
      modal.style.display = "none"; // Masquer le modal principal
      addModal.classList.remove("hidden");
      addModal.style.display = "flex";
    });

    //  Fermer la modale d'ajout
    closeAddModal.addEventListener("click", () => {
      addModal.style.display = "none";
      addModal.classList.add("hidden");
    });

    //  Fermer modale d'ajout si on clique en dehors
    window.addEventListener("click", (event) => {
      if (event.target === addModal) {
        addModal.style.display = "none";
        addModal.classList.add("hidden");
      }
    });
  }
}

displayModal();
addProject();

function addProject() {
  // Preview de l'image
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        imagePreview.innerHTML = `<img src="${ev.target.result}" alt="Preview" style="max-height:150px;">`;
      };
      reader.readAsDataURL(file);
    }
  });

  // Charger dynamiquement les catégories
  async function populateCategories() {
    try {
      console.log("Token utilisé :", loged);
      const resp = await fetch(CATEGORIES_URL);
      const cats = await resp.json();
      categorySelect.innerHTML = cats
        .map((c) => `<option value="${c.id}">${c.name}</option>`)
        .join("");
      console.log("Catégories chargées:", cats);
    } catch (err) {
      console.error("Erreur catégories:", err);
    }
  }
  populateCategories();

  // Soumission du formulaire
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const categoryId = categorySelect.value;
    const imageFile = fileInput.files[0];

    if (!imageFile || !title || !categoryId) {
      console.warn("Tous les champs sont requis.");
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("title", title);
    formData.append("category", categoryId);

    console.log("Envoi des données :", { title, categoryId, imageFile });

    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${loged}` },
        body: formData,
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.message || `Erreur ${resp.status}`);
      }

      const newProject = await resp.json();
      console.log("Succès ajout projet :", newProject);

      projects.push(newProject);
      renderProjects(projects);
      addForm.reset();
      imagePreview.innerHTML = "";
      addModal.style.display = "none";
      addModal.classList.add("hidden");
    } catch (err) {
      console.error("Échec de l’ajout :", err);
    }
  });
}
