import { db } from "./firebase.js";
import { initAuthGuard, getUid } from "./authGuard.js";
import { checkPlanLimit } from "./plan-utils.js";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { storage } from "./firebase.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";
import { isProUser } from "./plan-utils.js";
/* =========================
   IMAGE COMPRESSION
========================= */

async function compressImage(file, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve, reject) => {

    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = e => img.src = e.target.result;
    reader.onerror = reject;

    img.onload = () => {

      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = height * (maxWidth / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => resolve(new File([blob], file.name, { type: "image/jpeg" })),
        "image/jpeg",
        quality
      );
    };

    reader.readAsDataURL(file);
  });
}

/* =========================
   EDIT MODE
========================= */

const editId = localStorage.getItem("editCaseId");

/* =========================
   START AFTER AUTH
========================= */

initAuthGuard(() => {

  loadClients();

  if (editId) {
    loadCaseForEdit(editId);
  }

});

/* =========================
   LOAD CLIENTS FOR DROPDOWN
========================= */

async function loadClients() {

  const uid = getUid();
  if (!uid) return;

  const select = document.getElementById("clientSelect");
  select.innerHTML = "";

  const snapshot = await getDocs(collection(db, "users", uid, "clients"));

  snapshot.forEach(docSnap => {
    const c = docSnap.data();

    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = c.name;
    option.dataset.name = c.name;

    select.appendChild(option);
  });
}

/* =========================
   LOAD CASE FOR EDIT
========================= */

async function loadCaseForEdit(id) {

  const uid = getUid();
  if (!uid) return;

  const caseRef = doc(db, "users", uid, "cases", id);
  const snap = await getDoc(caseRef);

  if (!snap.exists()) return;

  const caseItem = snap.data();

  document.getElementById("clientSelect").value = caseItem.clientId;
  document.getElementById("caseNumber").value = caseItem.caseNumber;
  document.getElementById("court").value = caseItem.court;
  document.getElementById("caseType").value = caseItem.caseType;
  document.getElementById("status").value = caseItem.status;
  document.getElementById("stage").value = caseItem.stage;
  document.getElementById("notes").value = caseItem.notes;
  if (caseItem.caseYear) {
    document.getElementById("caseYear").value = caseItem.caseYear;
  } else if (caseItem.createdAt) {
    const year = new Date(caseItem.createdAt).getFullYear();
    document.getElementById("caseYear").value = year;
  
  document.getElementById("opponentName").value =
  caseItem.opponentName || "";

  document.getElementById("opponentAddress").value =
    caseItem.opponentAddress || "";

  document.getElementById("opponentPhone").value =
    caseItem.opponentPhone || "";

  document.getElementById("agreedFees").value =
    caseItem.agreedFees || "";
}}
/* =========================
   SAVE CASE
========================= */

document.getElementById("caseForm")
  .addEventListener("submit", async function(e) {

    e.preventDefault();

    const uid = getUid();
    if (!uid) return;

    if (!editId) {
      const allowed = await checkPlanLimit("cases");
      if (!allowed) return;
    }

    const clientSelect = document.getElementById("clientSelect");
    const selectedOption =
      clientSelect.options[clientSelect.selectedIndex];

    const clientId = clientSelect.value;
    const clientName = selectedOption.dataset.name || "";

    const caseYear = document.getElementById("caseYear").value;

    // ======================
    // CASE ATTACHMENTS
    // ======================

    const caseFilesInput = document.getElementById("caseFiles");

    let attachments = {
      files: []
    };

    const tempCaseId = editId || crypto.randomUUID();

    if (caseFilesInput && caseFilesInput.files.length > 0) {

      for (let file of caseFilesInput.files) {

        file = await compressImage(file);

        const path = `cases/${uid}/${tempCaseId}/${file.name}`;
        const fileRef = ref(storage, path);

        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);

        attachments.files.push({
          name: file.name,
          url: url,
          path: path
        });
      }
    }

    const pro = await isProUser();
    if (!pro && caseFilesInput && caseFilesInput.files.length > 0) {
      alert("المرفقات متاحة في النسخة الاحترافية فقط");
      return;
    }

    // ======================

  const caseData = {
    clientId,
    clientName,
    caseNumber: document.getElementById("caseNumber").value,
    court: document.getElementById("court").value,
    caseType: document.getElementById("caseType").value,
    status: document.getElementById("status").value,
    stage: document.getElementById("stage").value,
    notes: document.getElementById("notes").value,

    opponentName: document.getElementById("opponentName").value,
    opponentAddress: document.getElementById("opponentAddress").value,
    opponentPhone: document.getElementById("opponentPhone").value,

    agreedFees: Number(document.getElementById("agreedFees").value) || 0,

    caseYear: Number(caseYear),
    createdAt: new Date().toISOString(),
    attachments: attachments
  };    // 🔎 منع تكرار رقم الدعوى
    const snapshot = await getDocs(
      collection(db, "users", uid, "cases")
    );

    const caseNumberNormalized =
      caseData.caseNumber.trim().toLowerCase();

    let duplicate = false;

    snapshot.forEach(docSnap => {
      if (editId && docSnap.id === editId) return;

      const existingCaseNumber =
        docSnap.data().caseNumber?.trim().toLowerCase();

      if (existingCaseNumber === caseNumberNormalized) {
        duplicate = true;
      }
    });

    if (duplicate) {
      alert("رقم الدعوى مسجل مسبقًا");
      return;
    }

    try {

      if (editId) {

        const caseRef = doc(db, "users", uid, "cases", editId);
        await updateDoc(caseRef, caseData);

        localStorage.removeItem("editCaseId");
        alert("تم تعديل القضية");

      } else {

        await setDoc(
          doc(db, "users", uid, "cases", tempCaseId),
          caseData
        );

        alert("تم إضافة القضية");
      }

      window.location.href = "cases.html";

    } catch (error) {

      console.error(error);
      alert("حدث خطأ أثناء حفظ القضية");
    }

});