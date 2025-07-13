// ==== CONFIGURATION ====
// Déclaration des URLs de l'API dans un objet centralisé
const API = {
  WORKS: "http://localhost:5678/api/works",
  CATEGORIES: "http://localhost:5678/api/categories"
};

// Récupération du token (null si non connecté)
const TOKEN = localStorage.getItem("token");

// ==== RÉFÉRENCES DOM ====
// Éléments principaux de la page
const navLogin = document.querySelector(".login");                    // Bouton login/logout
const containerFilters = document.querySelector(".filter-form");     // Conteneur des filtres
const gallery = document.querySelector(".gallery");                  // Galerie des projets

// Modale principale d'édition
const modal = document.getElementById("modal");                      // Modale d’édition
const modalBody = document.getElementById("modal-body");             // Contenu modale d’édition
const editBtn = document.getElementById("edit-btn");                 // Bouton "modifier"
const closeModalBtn = document.querySelector(".close-btn");         // Bouton fermeture modale

// Modale d'ajout de projet
const addModal = document.getElementById("add-modal");               // Fenêtre modale d'ajout
const addForm = document.getElementById("add-form");                 // Formulaire d'ajout
const fileInput = document.getElementById("image");                  // Champ fichier image
const titleInput = document.getElementById("title");                 // Champ titre du projet
const imagePreview = document.getElementById("image-preview");       // Aperçu de l’image
const categorySelect = document.getElementById("category");          // Menu déroulant catégories
const addPhotoBtn = document.getElementById("ajouter-photo-btn");    // Bouton ajouter photo
const closeAddModalBtn = document.querySelector(".add-close-btn");  // Bouton fermeture modale ajout
const backToMainModal = document.getElementById("back-to-main-modal"); // Flèche retour modale

// ==== GLOBAL STATE ====
// Variable globale pour stocker tous les projets (mise à jour dynamique)
let projects = [];

// Affiche ou masque le mode édition si connecté
function toggleEditVisibility() {
  const editSpan = document.querySelector(".galerie-editeur");
  if (editSpan) editSpan.classList.toggle("none", !TOKEN);
}

// ==== API CALLS ====
// Fonction utilitaire pour faire des requêtes GET
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    return await res.json(); // Retourne le JSON si succès
  } catch (err) {
    console.error(`Erreur de requête vers ${url} :`, err);
    return [];
  }
}

// Appels spécifiques aux ressources
async function getProjects() {
  return await fetchJSON(API.WORKS);
}

async function getCategories() {
  return await fetchJSON(API.CATEGORIES);
}

// ==== RENDERING ====
// Affiche les projets dans la galerie
function renderProjects(projectsList) {
  gallery.innerHTML = projectsList.map(p => `
    <div class="project" data-id="${p.id}">
      <img src="${p.imageUrl}" alt="${p.title}">
      <h3>${p.title}</h3>
      ${p.description ? `<p>${p.description}</p>` : ""}
    </div>
  `).join("");
}

// Génère les boutons de filtre selon les catégories
function renderFilters(categories) {
  containerFilters.innerHTML = `
    <button type="button" data-filter="all">Tous</button>
    ${categories.map(c => `<button type="button" data-filter="${c.id}">${c.name}</button>`).join("")}
  `;
}

// ==== FILTERS ====
// Affiche les filtres uniquement si l'utilisateur n'est pas connecté
function toggleFiltersVisibility() {
  if (containerFilters) {
    containerFilters.style.display = TOKEN ? "none" : "block";
  }
}

// Gère le comportement de filtrage lorsqu’un bouton est cliqué
function setupFilters() {
  containerFilters.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const filter = btn.dataset.filter;
    if (!filter) return;

    // Filtrage
    if (filter === "all") {
      renderProjects(projects); // Affiche tous les projets
    } else {
      const filtered = projects.filter(p => p.categoryId == filter);
      renderProjects(filtered);
    }
  });
}

// ==== MODAL ====
// Ouvre la modale avec les miniatures des projets et boutons de suppression
function openModal() {
  // Génère les miniatures depuis la galerie existante
  const thumbnails = Array.from(document.querySelectorAll(".gallery .project")).map(project => {
    const img = project.querySelector("img");
    const id = project.dataset.id;
    return `
      <div class="image-container" data-id="${id}">
        <img src="${img.src}" alt="${img.alt}">
        <span class="trash-icon" data-id="${id}"><i class="fa-solid fa-trash"></i></span>
      </div>`;
  }).join("");

  // Injection HTML dans la modale
  modalBody.innerHTML = thumbnails;
  modal.style.display = "flex";

  // Gestion du clic sur les icônes de suppression
  modalBody.querySelectorAll(".trash-icon").forEach(icon => {
    icon.onclick = async () => {
      const id = icon.dataset.id;
      const elem = document.querySelector(`.project[data-id="${id}"]`);
      await deleteWork(id, elem);
      icon.parentElement.remove(); // Supprime aussi la miniature de la modale
    };
  });
}

// Initialise les événements de la modale d'édition
function setupModal() {
  editBtn.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", () => modal.style.display = "none");

  // Fermeture en cliquant à l'extérieur
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
    if (e.target === addModal) closeAddModal();
  });
}

// ==== DELETE PROJECT ====
// Supprime un projet depuis l’API + DOM
async function deleteWork(id, element) {
  if (!confirm("Supprimer ce projet ?")) return;
  if (!TOKEN) return alert("Non connecté");

  try {
    const res = await fetch(`${API.WORKS}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    if (!res.ok) throw new Error(`Erreur serveur: ${res.status}`);

    element.remove(); // Supprime du DOM
    projects = await getProjects(); // Recharge la liste complète
    renderProjects(projects);       // Réaffiche la galerie
  } catch (err) {
    console.error("Erreur suppression:", err);
  }
}

// ==== ADD PROJECT ====
// Initialise les interactions liées à la modale d’ajout de projet
function setupAddModal() {
  // Si l'utilisateur n'est pas connecté, on n'autorise pas l'accès à la modale
  if (!TOKEN) return;

  // Lorsque l'utilisateur clique sur le bouton "Ajouter une photo"
  addPhotoBtn.addEventListener("click", () => {
    // On masque la modale principale (celle de la galerie)
    modal.style.display = "none";

    // On affiche la modale d'ajout de projet
    addModal.classList.remove("none"); // Retire la classe qui masque l'élément
    addModal.style.display = "flex";    // Affiche la modale en flex
  });

  // Gestion du clic sur le bouton de fermeture de la modale d'ajout
 closeAddModalBtn.addEventListener("click", closeAddModal);
}

// Ferme proprement la modale d’ajout de projet
function closeAddModal() {
  addModal.style.display = "none";       // Cache l'élément via CSS
  addModal.classList.add("none");      // Rajoute la classe pour garder la cohérence
}

  // Gestion du clic sur la flèche "retour"

  if (backToMainModal) { // Si l'élément n'existe
    backToMainModal.addEventListener("click", () => {
      addModal.style.display = "none";      // Cache la modale d'ajout
      addModal.classList.add("none");     // Restaure l’état masqué
      modal.style.display = "flex";         // Réaffiche la modale principale
    });
  }

  // Initialise le formulaire d'ajout (prévisualisation, catégories, soumission)
function setupAddForm() {

  // === PRÉVISUALISATION DE L'IMAGE ===
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0]; // Récupère le fichier sélectionné
    if (file) {
      const reader = new FileReader(); // Crée un objet pour lire le fichier
      reader.onload = (ev) => {
        // Affiche un aperçu de l’image (base64)
        imagePreview.innerHTML = `<img src="${ev.target.result}" style="max-height:150px;">`;
      };
      reader.readAsDataURL(file); // Lit le fichier comme une URL base64
    }
  });

  // === CHARGEMENT DES CATÉGORIES DANS LE FORMULAIRE ===
  getCategories().then(cats => {
    // Génère dynamiquement les options du menu déroulant avec les catégories
    categorySelect.innerHTML = cats.map(c => 
      `<option value="${c.id}">${c.name}</option>`
    ).join("");
  });

  // === ENVOI DU FORMULAIRE D'AJOUT ===
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page

    // Récupère les valeurs du formulaire
    const title = titleInput.value.trim();          // Titre
    const categoryId = categorySelect.value;        // ID de la catégorie
    const imageFile = fileInput.files[0];           // Image sélectionnée

    // Vérifie que tous les champs sont remplis
    if (!title || !categoryId || !imageFile) {
      return alert("Tous les champs sont requis");
    }

    // Création d'un objet FormData pour l'envoi multipart/form-data
    const formData = new FormData();
    formData.append("image", imageFile);     // Image
    formData.append("title", title);         // Titre
    formData.append("category", categoryId); // Catégorie (ID)

    try {
      // Envoie la requête POST à l'API avec le token d'authentification
      const res = await fetch(API.WORKS, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}` },
        body: formData, // FormData automatiquement géré par fetch
      });

      // Vérifie si la requête a échoué
      if (!res.ok) throw new Error("Échec ajout projet");

      // Récupère le projet fraîchement ajouté depuis la réponse
      const newProject = await res.json();

     // Recharge la liste complète depuis l’API après ajout
      projects = await getProjects();

      // Rafraîchit l’affichage de la galerie
      renderProjects(projects);

      // Réinitialise le formulaire et l'aperçu d'image
      addForm.reset();
      imagePreview.innerHTML = "";

      // Ferme la modale d'ajout après succès
      closeAddModal();
    } catch (err) {
      console.error("Erreur ajout projet:", err);
    }
  });
}

// ==== INITIALISATION ====
// Fonction principale d'initialisation de l'application
async function init() {
  if (!gallery || !containerFilters) return;

  toggleEditVisibility();
  toggleFiltersVisibility();
  setupModal();
  setupAddModal();
  setupAddForm();

  // 1. Récupère tous les projets d'abord
  projects = await getProjects();
  console.log("Projets récupérés :", projects);

     // 2. Récupère les catégories et génère les filtres
  const categories = await getCategories();
  renderFilters(categories);

  // 3. Affiche tous les projets
  renderProjects(projects);

  // 4. Attache l'écouteur de filtre
  setupFilters();
}

// Exécute la fonction `init` une fois que tout le contenu HTML est chargé
document.addEventListener("DOMContentLoaded", init);