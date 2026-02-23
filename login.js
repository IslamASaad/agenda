import { auth, db } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup }
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import { doc, getDoc, setDoc }
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const provider = new GoogleAuthProvider();

document.getElementById("googleLogin")
  .addEventListener("click", async () => {

    try {

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("USER:", user);

      /* =========================
         CREATE USER PROFILE
      ========================== */

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    console.log("Checking user document...");

    if (!userSnap.exists()) {

    console.log("Creating user profile...");

    await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        createdAt: new Date().toISOString()
    });
        console.log("User profile created!");

        } else {
    console.log("User already exists");
    }

      /* =========================
         REDIRECT
      ========================== */

      window.location.href = "index.html";

    } catch (error) {

    console.error("FIRESTORE ERROR:", error);
    alert(error.message);

    }

});
