import { db } from "./firebase.js";
import { initAuthGuard, getUid } from "./authGuard.js";
import {
  collection,
  getDocs,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/* =========================
   START AFTER AUTH
========================= */

initAuthGuard(async () => {
  await loadSessions();
});

/* =========================
   LOAD SESSIONS FROM FIRESTORE
========================= */

async function loadSessions() {

  const uid = getUid();
  if (!uid) return;

  const table = document.getElementById("sessionsTable");
  table.innerHTML = "";

  const snapshot = await getDocs(collection(db, "users", uid, "sessions"));

  // ترتيب حسب التاريخ
  const sessions = [];

  snapshot.forEach(docSnap => {
    sessions.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!sessions.length) {
    table.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:40px;">
          <div style="font-size:18px;margin-bottom:10px;">
            أضف أول جلسة وتابع مواعيدك بدون نسيان
          </div>
          <a href="add-session.html">
            <button class="add-main-btn">➕ إضافة جلسة</button>
          </a>
        </td>
      </tr>
    `;
    return;
  }
  
sessions.forEach(s => {

  table.innerHTML += `
    <tr>
      <td>${s.date || "-"}</td>
      <td>${s.time || "-"}</td>
      <td>${s.caseNumber || "-"}</td>
      <td>${s.court || "-"}</td>
      <td>${s.circle || "-"}</td>
      <td>${s.hall || "-"}</td>
      <td>${s.roll || "-"}</td>
      <td>
        <button class="action-btn edit" onclick="editSession('${s.id}')">✏️</button>
        <button class="action-btn delete" onclick="deleteSession('${s.id}')">🗑️</button>
      </td>
    </tr>
  `;

});
}

/* =========================
   SEARCH
========================= */

document.getElementById("searchInput")
  .addEventListener("input", function() {

    const value = this.value.toLowerCase();
    const rows = document.querySelectorAll("#sessionsTable tr");

    rows.forEach(row => {
      row.style.display =
        row.innerText.toLowerCase().includes(value) ? "" : "none";
    });

});

/* =========================
   EDIT
========================= */

window.editSession = function(id) {
  localStorage.setItem("editSessionId", id);
  window.location.href = "add-session.html";
};

/* =========================
   DELETE
========================= */

window.deleteSession = async function(id) {

  if (!confirm("هل تريد حذف الجلسة؟")) return;

  const uid = getUid();
  if (!uid) return;

  await deleteDoc(doc(db, "users", uid, "sessions", id));

  loadSessions();
};
