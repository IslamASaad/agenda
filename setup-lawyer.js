import { db, auth } from "./firebase.js";
import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/* =========================
   SAVE LAWYER PROFILE
========================= */

document.getElementById("lawyerForm")
  .addEventListener("submit", async function(e) {

    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const uid = user.uid;

    // جمع التخصصات
    const specialties = [];
    document.querySelectorAll("#specialties input:checked")
      .forEach(cb => specialties.push(cb.value));

    const profileData = {

      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,

      officeName: document.getElementById("officeName").value,
      officeAddress: document.getElementById("officeAddress").value,
      city: document.getElementById("city").value,

      specialties,

      licenseNumber: document.getElementById("licenseNumber").value,
      barAssociation: document.getElementById("barAssociation").value,

      whatsapp: document.getElementById("whatsapp").value,
      website: document.getElementById("website").value,

      plan: "free",

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {

    await setDoc(doc(db, "users", uid, "profile", "info"), profileData);

      window.location.href = "index.html";

    } catch (err) {

      console.error(err);
      alert("حدث خطأ أثناء حفظ البيانات");

    }

});
