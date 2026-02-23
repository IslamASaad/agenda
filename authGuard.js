import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { doc, getDoc } from
"https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

let CURRENT_USER = null;

/* =========================
   GLOBAL AUTH GUARD
========================= */

export function initAuthGuard(callback) {

  onAuthStateChanged(auth, async (user) => {

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    CURRENT_USER = user;
    const uid = user.uid;

    // قراءة profile من المسار الجديد
    const profileRef = doc(db, "users", uid, "profile", "info");
    const profileSnap = await getDoc(profileRef);

    const currentPage = window.location.href;

    // هل profile موجود فعلًا؟
    const hasProfile =
      profileSnap.exists() &&
      profileSnap.data() &&
      profileSnap.data().name;

    // لو مفيش profile ولسه مش في صفحة setup
    if (!hasProfile && !currentPage.includes("setup-lawyer.html")) {
      console.log("Redirecting to setup...");
      window.location.href = "setup-lawyer.html";
      return;
    }

    // لو عنده profile وفتح setup بالغلط
    if (hasProfile && currentPage.includes("setup-lawyer.html")) {
      window.location.href = "index.html";
      return;
    }

    // نفذ كود الصفحة
    if (callback) callback(user);

  });

}

/* =========================
   GET CURRENT USER
========================= */

export function getCurrentUser() {
  return CURRENT_USER;
}

export function getUid() {
  return CURRENT_USER?.uid || null;
}
