const loginForm = document.querySelector("form");

if (loginForm) {
  loginForm.addEventListener("submit", async function connection(event) {
    event.preventDefault();

    // Récupère les champs à l'intérieur du formulaire au moment de la soumission
    const emailInput = loginForm.querySelector("#email");
    const passwordInput = loginForm.querySelector("#password");

    if (!emailInput || !passwordInput) {
      // Ici, on ne fait rien ou on affiche une erreur dans la console pour debug
      // console.error("Champs email ou mot de passe introuvables !");
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
  });
}
