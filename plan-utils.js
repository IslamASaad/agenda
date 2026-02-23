import { db } from "./firebase.js";
import { getUid } from "./authGuard.js";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

export async function isProUser() {
  const plan = await getUserPlan();
  return plan === "pro";
}

/* =========================
   FREE PLAN LIMITS
========================= */

const FREE_LIMITS = {
  clients: 15,
  cases: 15,
  sessions: 15
};

/* =========================
   GET USER PLAN
========================= */

export async function getUserPlan() {

  const uid = getUid();
  if (!uid) return "free";

  const profileRef = doc(db, "users", uid, "profile", "info");
  const snap = await getDoc(profileRef);

  if (!snap.exists()) return "free";

  const data = snap.data();
  return data.plan || "free";
}

/* =========================
   COUNT COLLECTION ITEMS
========================= */

async function countCollection(type) {

  const uid = getUid();
  if (!uid) return 0;

  const snapshot = await getDocs(collection(db, "users", uid, type));
  return snapshot.size;
}

/* =========================
   CHECK PLAN LIMIT
========================= */

export async function checkPlanLimit(type) {

  const plan = await getUserPlan();

  // لو PRO → مفيش limits
  if (plan === "pro") return true;

  const currentCount = await countCollection(type);
  const limit = FREE_LIMITS[type];

  if (currentCount >= limit) {
    window.location.href = "upgrade.html";
    return false;
  }

  return true;
}
