import { db } from "./firebase.js";
import { initAuthGuard, getUid } from "./authGuard.js";
import { checkPlanLimit } from "./plan-utils.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/* =========================
   EDIT MODE
========================= */

const editId = localStorage.getItem ("editSessionId");

/* =========================
   START AFTER AUTH
========================= */

initAuthGuard(() => {

  loadCases();

  if (editId) {
    loadSessionForEdit(editId);
  }

});

/* =========================
   LOAD CASES FOR DROPDOWN
========================= */

async function loadCases() {

  const uid = getUid();
  if (!uid) return;

  const select = document.getElementById("caseSelect");
  select.innerHTML = "";

  const snapshot = await getDocs(collection(db, "users", uid, "cases"));

  snapshot.forEach(docSnap => {

    const c = docSnap.data();

    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = c.caseNumber + " - " + c.court;

    option.dataset.caseNumber = c.caseNumber;

    select.appendChild(option);
  });
}

/* =========================
   LOAD SESSION FOR EDIT
========================= */

async function loadSessionForEdit(id) {

  const uid = getUid();
  if (!uid) return;

  const snap = await getDoc(doc(db, "users", uid, "sessions", id));
  if (!snap.exists()) return;

  const s = snap.data();

  document.getElementById("caseSelect").value = s.caseId;
  document.getElementById("date").value = s.date;
  document.getElementById("time").value = s.time;
  document.getElementById("court").value = s.court;
  document.getElementById("circle").value = s.circle;
  document.getElementById("hall").value = s.hall;
  document.getElementById("roll").value = s.roll;
  document.getElementById("notes").value = s.notes;
}

/* =========================
   SAVE SESSION
========================= */

document.getElementById("sessionForm")
  .addEventListener("submit", async function(e) {

    e.preventDefault();

    const uid = getUid();
    if (!uid) return;

    // 🔴 check FREE plan limit قبل الإضافة
    if (!editId) {
      const allowed = await checkPlanLimit("sessions");
      if (!allowed) return;
    }

    const caseSelect = document.getElementById("caseSelect");
    const selectedOption =
      caseSelect.options[caseSelect.selectedIndex];

    const sessionData = {
      caseId: caseSelect.value,
      caseNumber: selectedOption.dataset.caseNumber,
      date: document.getElementById("date").value,
      time: document.getElementById("time").value,
      court: document.getElementById("court").value,
      circle: document.getElementById("circle").value,
      hall: document.getElementById("hall").value,
      roll: document.getElementById("roll").value,
      notes: document.getElementById("notes").value,
      createdAt: new Date().toISOString()
    };

    
    // 🔎 منع تكرار الجلسة (caseId + date + time)
    const snapshot = await getDocs(
      collection(db, "users", uid, "sessions")
    );

    const sessionKey =
      caseSelect.value + "_" +
      document.getElementById("date").value + "_" +
      document.getElementById("time").value;

    let duplicate = false;

    snapshot.forEach(docSnap => {
      if (editId && docSnap.id === editId) return;

      const s = docSnap.data();
      const existingKey =
        s.caseId + "_" + s.date + "_" + s.time;

      if (existingKey === sessionKey) {
        duplicate = true;
      }
    });

    if (duplicate) {
      alert("هذه الجلسة مسجلة مسبقًا لنفس القضية في نفس الوقت");
      return;
    }

      try {

      if (editId) {

        await updateDoc(
          doc(db, "users", uid, "sessions", editId),
          sessionData
        );

        localStorage.removeItem("editSessionId");
        alert("تم تعديل الجلسة");

      } else {

        await addDoc(
          collection(db, "users", uid, "sessions"),
          sessionData
        );

        alert("تم إضافة الجلسة");

      }

      window.location.href = "sessions.html";

    } catch (err) {

      console.error(err);
      alert("حدث خطأ أثناء حفظ الجلسة");

    }

});
