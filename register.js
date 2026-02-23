import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

document.getElementById("registerForm")
  .addEventListener("submit", async function(e) {

    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const user = userCredential.user;

      alert("تم إنشاء الحساب بنجاح");

      // تحويل للـ setup
    window.location.href = "setup-lawyer.html";
    } catch (error) {

      alert(error.message);

    }

});
