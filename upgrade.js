import { db } from "./firebase.js";
import { getUid } from "./authGuard.js";
import { doc, getDoc } from
"https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/* =========================
   CHECK USER PLAN
========================= */

async function checkPlan() {

  const uid = getUid();
  if (!uid) return;

  const profileRef = doc(db, "users", uid, "profile", "info");
  const snap = await getDoc(profileRef);

  if (!snap.exists()) return;

  const data = snap.data();
  const plan = data.plan || "free";

  const upgradeBtn = document.getElementById("upgradeBtn");

  // لو المستخدم بالفعل PRO
  if (plan === "pro") {

    upgradeBtn.textContent = "أنت مشترك بالفعل";
    upgradeBtn.disabled = true;
    upgradeBtn.style.background = "gray";

  }

}

checkPlan();

/* =========================
   UPGRADE CLICK
========================= */

document.getElementById("upgradeBtn")
  .addEventListener("click", () => {

    alert("سيتم تفعيل الدفع قريبًا");

  });
