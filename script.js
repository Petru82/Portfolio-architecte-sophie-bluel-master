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
