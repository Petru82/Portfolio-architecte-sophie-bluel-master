const loginForm = document.querySelector("form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");

// Fonction pour gérer la connexion
async function connection(event) {
  event.preventDefault();

  // Vérifier l'existence des éléments et des valeurs
  if (!emailInput || !passwordInput) {
    alert("Champs email ou mot de passe introuvables !");
    return;
  }

  const emailUser = emailInput.value.trim();
  const passwordUser = passwordInput.value.trim();

  if (!emailUser || !passwordUser) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  const data = {
    email: emailUser,
    password: passwordUser,
  };

  try {
    const response = await fetch("http://localhost:5678/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok && result.token) {
      window.localStorage.setItem("token", result.token);
      window.location.href = "index.html";
    } else {
      alert("Informations d'identification incorrectes.");
    }
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    alert("Erreur de connexion au serveur.");
  }
}

// Ajouter un écouteur d'événement au formulaire
if (loginForm) {
  loginForm.addEventListener("submit", connection);
}

// Fonction pour vérifier si l'utilisateur est connecté
function isConnected() {
  return localStorage.getItem("token") !== null;
}

// Fonction pour mettre à jour le texte du bouton de connexion/déconnexion
function updateLoginLogoutText() {
  const loginLogoutLi = document.getElementById("loginLogout");
  if (!loginLogoutLi) return;

  // On retire tous les anciens écouteurs pour éviter les doublons
  const newLi = loginLogoutLi.cloneNode(true);
  loginLogoutLi.parentNode.replaceChild(newLi, loginLogoutLi);

  if (isConnected()) {
    newLi.textContent = "logout";
    newLi.addEventListener("click", function () {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  } else {
    newLi.textContent = "login";
    newLi.addEventListener("click", function () {
      window.location.href = "login.html";
    });
  }
}

// Appeler la fonction pour mettre à jour l'affichage au chargement de la page
document.addEventListener("DOMContentLoaded", updateLoginLogoutText);
