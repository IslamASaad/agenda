import { db } from "./firebase.js";
import {
  collection,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { checkPlanLimit } from "./plan-utils.js";
import { initAuthGuard, getUid } from "./authGuard.js";
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
   START AFTER AUTH
========================= */

initAuthGuard(() => {

  const editId = localStorage.getItem("editClientId");

  if (editId) {
    loadClientForEdit(editId);
  }

  async function loadClientForEdit(id) {

    const uid = getUid();
    if (!uid) return;

    const clientRef = doc(db, "users", uid, "clients", id);
    const snap = await getDoc(clientRef);

    if (!snap.exists()) return;

    const client = snap.data();

    document.getElementById("name").value = client.name;
    document.getElementById("phone").value = client.phone;
    document.getElementById("altPhone").value = client.altPhone;
    document.getElementById("address").value = client.address;
    document.getElementById("notes").value = client.notes;
    document.getElementById("nationalId").value = client.nationalId || "";
    document.getElementById("powerOfAttorney").value = client.powerOfAttorney || "";
  }

  document.getElementById("clientForm")
    .addEventListener("submit", async function(e) {

      e.preventDefault();

      const uid = getUid();
      if (!uid) return;

      if (!editId) {
        const allowed = await checkPlanLimit("clients");
        if (!allowed) return;
      }

      const nationalIdFileInput = document.getElementById("nationalIdFile");
      const powerFileInput = document.getElementById("powerFile");
      const extraFilesInput = document.getElementById("extraFiles");

      let attachments = {
        nationalIdImage: "",
        powerOfAttorneyFile: "",
        files: []
      };

      const pro = await isProUser();

      if (!pro &&
        (nationalIdFileInput.files.length > 0 ||
          powerFileInput.files.length > 0 ||
          extraFilesInput.files.length > 0)) {

        alert("رفع المرفقات متاح في النسخة الاحترافية فقط");
        return;
      }

      const clientData = {
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        altPhone: document.getElementById("altPhone").value,
        address: document.getElementById("address").value,
        nationalId: document.getElementById("nationalId").value,
        powerOfAttorney: document.getElementById("powerOfAttorney").value,
        notes: document.getElementById("notes").value,
        attachments: attachments,
        createdAt: new Date().toISOString()
      };

      // منع تكرار الاسم
      const existingSnapshot = await getDocs(
        collection(db, "users", uid, "clients")
      );

      const normalizedName = clientData.name.trim().toLowerCase();
      let duplicate = false;

      existingSnapshot.forEach(docSnap => {
        if (editId && docSnap.id === editId) return;
        const existingName = docSnap.data().name?.trim().toLowerCase();
        if (existingName === normalizedName) duplicate = true;
      });

      if (duplicate) {
        alert("هذا الموكل موجود بالفعل");
        return;
      }

      const nationalId = clientData.nationalId.trim();
      const powerOfAttorney = clientData.powerOfAttorney.trim();

      if (nationalId && !/^\d{14}$/.test(nationalId)) {
        alert("الرقم القومي يجب أن يكون 14 رقم");
        return;
      }

      const snapshot = await getDocs(
        collection(db, "users", uid, "clients")
      );

      let duplicateNationalId = false;
      let duplicatePower = false;

      snapshot.forEach(docSnap => {
        if (editId && docSnap.id === editId) return;
        const data = docSnap.data();
        if (nationalId && data.nationalId === nationalId) duplicateNationalId = true;
        if (powerOfAttorney && data.powerOfAttorney === powerOfAttorney) duplicatePower = true;
      });

      if (duplicateNationalId) {
        alert("الرقم القومي مسجل لموكل آخر");
        return;
      }

      if (duplicatePower) {
        alert("رقم التوكيل مسجل بالفعل");
        return;
      }

      try {

        const tempClientId = editId || crypto.randomUUID();

        if (nationalIdFileInput.files[0]) {
          let file = nationalIdFileInput.files[0];
          file = await compressImage(file);
          const fileRef = ref(storage, `clients/${uid}/${tempClientId}/national-id`);
          await uploadBytes(fileRef, file);
          attachments.nationalIdImage = {
            url: await getDownloadURL(fileRef),
            path: `clients/${uid}/${tempClientId}/national-id`
          };        
        }

        if (powerFileInput.files[0]) {
          const file = powerFileInput.files[0];
          const fileRef = ref(storage, `clients/${uid}/${tempClientId}/power-of-attorney`);
          await uploadBytes(fileRef, file);
          attachments.powerOfAttorneyFile = {
            url: await getDownloadURL(fileRef),
            path: `clients/${uid}/${tempClientId}/power-of-attorney`
          };        
        }

        if (extraFilesInput.files.length > 0) {
          for (let file of extraFilesInput.files) {
            file = await compressImage(file);
            const fileRef = ref(
              storage,
              `clients/${uid}/${tempClientId}/attachments/${file.name}`
            );
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            attachments.files.push({
              name: file.name,
              url: url,
              path: `clients/${uid}/${tempClientId}/attachments/${file.name}`
            });          
          }
        }

        if (editId) {
          const clientRef = doc(db, "users", uid, "clients", editId);
          await updateDoc(clientRef, clientData);
          localStorage.removeItem("editClientId");
          alert("تم تعديل الموكل");
        } else {
          await setDoc(
            doc(db, "users", uid, "clients", tempClientId),
            clientData
          );
          alert("تم إضافة الموكل");
        }

        window.location.href = "clients.html";

      } catch (error) {
        console.error(error);
        alert("حدث خطأ أثناء الحفظ");
      }

  });

});