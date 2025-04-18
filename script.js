const url = "http://localhost:5678/api-docs/";
const loged = window.localStorage.getItem("token");
const navLogin = document.querySelector(".login");

// Fonction pour récupérer les projets
async function fetchProjects() {
  try {
    const response = await fetch(url); // Effectuer la requête GET
    if (!response.ok) {
      throw new Error(`Erreur HTTP ! Statut : ${response.status}`); // Gérer les erreurs HTTP
    }
    const projects = await response.json(); // Convertir la réponse en JSON
    console.log("Projets récupérés:", projects); // Afficher les projets dans la console

    // Vous pouvez maintenant traiter les données comme vous le souhaitez
    displayProjects(projects); // Appel d'une fonction pour afficher les projets sur la page
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error); // Gérer les erreurs
  }
}

// Fonction pour afficher les projets sur la page (exemple)
function displayProjects(projects) {
  const projectsContainer = document.getElementById("projects-container"); // Assurez-vous d'avoir cet élément dans votre HTML
  projects.forEach((project) => {
    const projectElement = document.createElement("div");
    projectElement.className = "project";
    projectElement.innerHTML = `<h3>${project.title}</h3><p>${project.description}</p>`;
    projectsContainer.appendChild(projectElement);
  });
}

// Fonction pour se déconnecter
function deconnection() {
  if (loged) {
    navLogin.addEventListener("click", () => {
      // Supprimer le token du localStorage
      window.localStorage.removeItem("token");

      // Rediriger vers la page de connexion
      window.location.href = "login.html";

      // Modifier le texte du bouton navLogin
      navLogin.textContent = "login";
    });
  }
}

// Fonction pour changer le texte du bouton selon l'état
function logoutMod() {
  if (loged) {
    navLogin.textContent = "logout";
  } else {
    navLogin.textContent = "login";
  }
}

// Appeler les fonctions au bon moment
logoutMod();
deconnection();

//! Déclaration des éléments DOM
const containerFilters = document.querySelector(".filter-form");
const gallery = document.querySelector(".gallery");

// 1. Récupération des projets
async function getProjects() {
  const response = await fetch("http://localhost:5678/api/works");
  return await response.json();
}

// 2. Récupération des catégories
async function getCategory() {
  const response = await fetch("http://localhost:5678/api/categories");
  return await response.json();
}

// 3. Création des boutons de filtre
async function createButton() {
  const categoryTable = await getCategory();

  // Ajout du bouton "Tous"
  const allButton = document.createElement("button");
  allButton.textContent = "Tous";
  allButton.id = "0"; // ID spécial pour "Tous"
  containerFilters.appendChild(allButton);

  // Ajout des autres boutons
  categoryTable.forEach((category) => {
    const button = document.createElement("button");
    button.textContent = category.name;
    button.id = category.id;
    containerFilters.appendChild(button);
  });
}

// 4. Affichage des projets
function createProjects(project) {
  const projectElement = document.createElement("div");
  projectElement.className = "project";
  projectElement.innerHTML = `
    <h3>${project.title}</h3>
    <p>${project.description || ""}</p>
    <img src="${project.imageUrl}" alt="${project.title}">
  `;
  gallery.appendChild(projectElement);
}

// 5. Filtrage des projets
async function filteredButton() {
  const projects = await getProjects();
  // Correction du sélecteur pour cibler les boutons dans .filter-form
  const buttons = document.querySelectorAll(".filter-form button");

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      gallery.innerHTML = "";
      const buttonId = event.target.id;

      if (buttonId !== "0") {
        const filteredProjects = projects.filter((project) => {
          return project.category.id == buttonId;
        });
        filteredProjects.forEach(createProjects);
      } else {
        projects.forEach(createProjects);
      }
    });
  });
}

// 6. Initialisation
async function init() {
  await createButton();
  await filteredButton();
  // Afficher tous les projets au chargement
  const projects = await getProjects();
  projects.forEach(createProjects);
}

// Exécution
document.addEventListener("DOMContentLoaded", init);
