const email = document.querySelector("form #email");
const password = document.querySelector("form #password");

const loginForm = document.querySelector("form");

const emailUser = email.value;
const passwordUser = password.value;

// Fonction pour gérer la connexion
async function connection(event) {
  event.preventDefault(); // Empêcher le rechargement de la page

  // Récupérer les valeurs des champs email et password

  // Préparer les données à envoyer au backend
  const data = {
    email: emailUser,
    password: passwordUser,
  };

  // Envoyer une requête POST au backend pour se connecter
  const response = await fetch("http://localhost:5678/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  window.localStorage.setItem("token", result.token);

  console.log(result, "resultat");

  // Traiter la réponse du backend
  if (response.ok) {
    console.log("Connexion réussie !", result);
    // Rediriger l'utilisateur vers une autre page ou effectuer d'autres actions
    window.location.href = "index.html";
  } else {
    console.error("Erreur de connexion:", result);
    // Afficher un message d'erreur à l'utilisateur
    alert("Informations d'identification incorrectes.");
  }
}

// Ajouter un écouteur d'événement au formulaire pour appeler la fonction connection
loginForm.addEventListener("submit", connection);

// Fonction pour vérifier si l'utilisateur est connecté
function isConnected() {
  return localStorage.getItem("token") !== null;
}

// Fonction pour mettre à jour le texte du bouton de connexion/déconnexion
function updateLoginLogoutText() {
  const loginLogoutLi = document.getElementById("loginLogout");

  if (isConnected()) {
    loginLogoutLi.textContent = "logout";
    loginLogoutLi.addEventListener("click", deconnection);
  } else {
    loginLogoutLi.textContent = "login";
    loginLogoutLi.addEventListener("click", function () {
      window.location.href = "login.html"; // Rediriger vers la page de connexion
    });
  }
}

// Appeler la fonction pour mettre à jour l'affichage au chargement de la page
updateLoginLogoutText();
