// ==== CONFIGURATION ====
// Déclaration des URLs de l'API dans un objet centralisé
const API = {
  WORKS: "http://localhost:5678/api/works",
  CATEGORIES: "http://localhost:5678/api/categories",
};

// Récupération du token (null si non connecté)
const TOKEN = localStorage.getItem("token");

// ==== RÉFÉRENCES DOM ====
// Éléments principaux de la page
const navLogin = document.querySelector(".login"); // Bouton login/logout
const containerFilters = document.querySelector(".filter-form"); // Conteneur des filtres
const gallery = document.querySelector(".gallery"); // Galerie des projets

// Modale principale d'édition
const modal = document.getElementById("modal"); // Modale d'édition
const modalBody = document.getElementById("modal-body"); // Contenu modale d'édition
const editBtn = document.getElementById("edit-btn"); // Bouton "modifier"
const closeModalBtn = document.querySelector(".close-btn"); // Bouton fermeture modale

// Modale d'ajout de projet
const addModal = document.getElementById("add-modal"); // Fenêtre modale d'ajout
const addForm = document.getElementById("add-form"); // Formulaire d'ajout
const fileInput = document.getElementById("image"); // Champ fichier image
const titleInput = document.getElementById("title"); // Champ titre du projet
const imagePreview = document.getElementById("image-preview"); // Aperçu de l'image
const categorySelect = document.getElementById("category"); // Menu déroulant catégories
const addPhotoBtn = document.getElementById("ajouter-photo-btn"); // Bouton ajouter photo
const closeAddModalBtn = document.querySelector(".add-close-btn"); // Bouton fermeture modale ajout
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
  gallery.innerHTML = projectsList
    .map(
      (p) => `
    <div class="project" data-id="${p.id}">
      <img src="${p.imageUrl}" alt="${p.title}">
      <h3>${p.title}</h3>
      ${p.description ? `<p>${p.description}</p>` : ""}
    </div>
  `,
    )
    .join("");
}

// Génère les boutons de filtre selon les catégories
function renderFilters(categories) {
  containerFilters.innerHTML = `
    <button class="filter-btn active" data-filter="all" type="button">Tous</button>
    ${categories
      .map(
        (c) =>
          `<button class="filter-btn" data-filter="${c.id}" type="button">${c.name}</button>`,
      )
      .join("")}
  `;
}

// ==== FILTERS ====
// Affiche les filtres uniquement si l'utilisateur N'EST PAS connecté
function toggleFiltersVisibility() {
  if (containerFilters) {
    // Debug: vérifier l'état du token
    console.log("TOKEN:", TOKEN ? "existe (connecté)" : "null (non connecté)");
    containerFilters.style.display = TOKEN ? "none" : "block";
  }
}

// Gère le comportement de filtrage lorsqu'un bouton est cliqué
function setupFilters() {
  // Vérifier que setupFilters n'est appelé qu'une seule fois
  if (containerFilters._hasListener) {
    console.log("setupFilters déjà initialisé, on évite les doublons");
    return;
  }
  containerFilters._hasListener = true;

  containerFilters.addEventListener("click", (e) => {
    // Vérifier que l'élément cliqué est bien un bouton de filtre
    if (!e.target.classList.contains("filter-btn")) {
      return;
    }

    const filter = e.target.dataset.filter;
    if (!filter) {
      return;
    }

    // Filtrage selon l'ID de catégorie ou affichage de tout
    let filtered;
    if (filter === "all") {
      filtered = projects;
    } else {
      filtered = projects.filter((p) => {
        // Essayer différentes structures possibles de l'API
        let categoryId = null;

        if (p.category && p.category.id) {
          categoryId = p.category.id;
        } else if (p.categoryId) {
          categoryId = p.categoryId;
        } else if (p.category) {
          categoryId = p.category;
        }
        // Comparer en tant que strings ET en tant que nombres
        return (
          categoryId?.toString() === filter || categoryId === parseInt(filter)
        );
      });
    }

    renderProjects(filtered);
  });
}

// ==== MODAL ====
// Ouvre la modale avec les miniatures des projets et boutons de suppression
function openModal() {
  // Génère les miniatures depuis la galerie existante
  const thumbnails = Array.from(document.querySelectorAll(".gallery .project"))
    .map((project) => {
      const img = project.querySelector("img");
      const id = project.dataset.id;
      return `
      <div class="image-container" data-id="${id}">
        <img src="${img.src}" alt="${img.alt}">
        <span class="trash-icon" data-id="${id}"><i class="fa-solid fa-trash"></i></span>
      </div>`;
    })
    .join("");

  // Injection HTML dans la modale
  modalBody.innerHTML = thumbnails;
  modal.style.display = "flex";

  // Gestion du clic sur les icônes de suppression
  modalBody.querySelectorAll(".trash-icon").forEach((icon) => {
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
  if (!editBtn || !closeModalBtn) return; // Protection si les éléments n'existent pas

  editBtn.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", () => (modal.style.display = "none"));

  // Fermeture en cliquant à l'extérieur
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
    if (e.target === addModal) closeAddModal();
  });
}

// ==== DELETE PROJECT ====
// Supprime un projet depuis l'API + DOM
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
    renderProjects(projects); // Réaffiche la galerie
  } catch (err) {
    console.error("Erreur suppression:", err);
  }
}

// ==== ADD PROJECT ====
// Initialise les interactions liées à la modale d'ajout de projet
function setupAddModal() {
  // Si l'utilisateur n'est pas connecté, on n'autorise pas l'accès à la modale
  if (!TOKEN) return;

  // Protection si les éléments n'existent pas
  if (!addPhotoBtn || !closeAddModalBtn || !backToMainModal) return;

  // Lorsque l'utilisateur clique sur le bouton "Ajouter une photo"
  addPhotoBtn.addEventListener("click", () => {
    // On masque la modale principale (celle de la galerie)
    modal.style.display = "none";

    // On affiche la modale d'ajout de projet
    addModal.classList.remove("none"); // Retire la classe qui masque l'élément
    addModal.style.display = "flex"; // Affiche la modale en flex
  });

  // Gestion du clic sur le bouton de fermeture de la modale d'ajout
  closeAddModalBtn.addEventListener("click", closeAddModal);

  // Gestion du clic sur la flèche "retour"
  backToMainModal.addEventListener("click", () => {
    addModal.style.display = "none"; // Cache la modale d'ajout
    addModal.classList.add("none"); // Restaure l'état masqué
    modal.style.display = "flex"; // Réaffiche la modale principale
  });
}

// Ferme proprement la modale d'ajout de projet
function closeAddModal() {
  addModal.style.display = "none"; // Cache l'élément via CSS
  addModal.classList.add("none"); // Rajoute la classe pour garder la cohérence
}

// Initialise le formulaire d'ajout (prévisualisation, catégories, soumission)
function setupAddForm() {
  // Protection si les éléments n'existent pas
  if (!fileInput || !titleInput || !categorySelect || !addForm || !imagePreview)
    return;

  // === PRÉVISUALISATION DE L'IMAGE ===
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0]; // Récupère le fichier sélectionné
    if (file) {
      const reader = new FileReader(); // Crée un objet pour lire le fichier
      reader.onload = (ev) => {
        // Affiche un aperçu de l'image (base64)
        imagePreview.innerHTML = `<img src="${ev.target.result}" style="max-height:150px;">`;
      };
      reader.readAsDataURL(file); // Lit le fichier comme une URL base64
    }
  });

  // === CHARGEMENT DES CATÉGORIES DANS LE FORMULAIRE ===
  getCategories().then((cats) => {
    // Génère dynamiquement les options du menu déroulant avec les catégories
    categorySelect.innerHTML = cats
      .map((c) => `<option value="${c.id}">${c.name}</option>`)
      .join("");
  });

  // === ENVOI DU FORMULAIRE D'AJOUT ===
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page

    // Récupère les valeurs du formulaire
    const title = titleInput.value.trim(); // Titre
    const categoryId = categorySelect.value; // ID de la catégorie
    const imageFile = fileInput.files[0]; // Image sélectionnée

    // Vérifie que tous les champs sont remplis
    if (!title || !categoryId || !imageFile) {
      return alert("Tous les champs sont requis");
    }

    // Création d'un objet FormData pour l'envoi multipart/form-data
    const formData = new FormData();
    formData.append("image", imageFile); // Image
    formData.append("title", title); // Titre
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

      // Ajoute le nouveau projet à la liste globale
      projects.push(newProject);

      // Rafraîchit l'affichage de la galerie
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

// ==== DEBUG HELPERS ====
// Fonction pour vider le localStorage et voir les filtres (pour tests)
function clearLogin() {
  localStorage.removeItem("token");
  location.reload();
}

// Affiche les informations de debug dans la console
function debugInfo() {
  console.log("=== DEBUG INFO ===");
  console.log("TOKEN:", TOKEN);
  console.log("containerFilters:", containerFilters);
  console.log(
    "Filtres visibles:",
    containerFilters ? containerFilters.style.display : "element not found",
  );

  if (projects[0] && projects[0].category) {
  }
}

// Fonction pour forcer une connexion (pour les tests)
function forceLogin() {
  localStorage.setItem("token", "test-token");
  location.reload();
}

// Expose les fonctions de debug dans la console du navigateur
window.clearLogin = clearLogin;
window.debugInfo = debugInfo;
window.forceLogin = forceLogin;

// ==== INITIALISATION ====
// Fonction principale d'initialisation de l'application
async function init() {
  // Vérifie que les éléments DOM essentiels existent (la galerie et les filtres)
  if (!gallery || !containerFilters)
    return; // Ne rien faire si les éléments ne sont pas présents

  console.log("🚀 Initialisation du site...");

  // 1. Affiche ou masque l'élément "Modifier" si l'utilisateur est connecté
  toggleEditVisibility();

  // 2. Affiche ou masque la barre de filtres selon si l'utilisateur est connecté ou non
  toggleFiltersVisibility();

  // 3. Récupère les catégories depuis l'API et les affiche dans les filtres
  const categories = await getCategories();
  renderFilters(categories);

  // 4. Récupère tous les projets depuis l'API et les affiche dans la galerie
  projects = await getProjects();
  renderProjects(projects);

  // 5. Active les filtres APRÈS avoir chargé et affiché les projets
  setupFilters();

  // 6. Initialise les interactions avec la modale de gestion des projets
  setupModal();

  // 7. Prépare les interactions avec la modale d'ajout de projet
  setupAddModal();

  // 8. Prépare le formulaire d'ajout de projet (preview, soumission, etc.)
  setupAddForm();
}

// Exécute la fonction `init` une fois que tout le contenu HTML est chargé
document.addEventListener("DOMContentLoaded", init);
