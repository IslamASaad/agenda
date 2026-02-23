import { db, auth } from "./firebase.js";
import { collection, getDocs, doc, deleteDoc, getDoc }
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";


// =========================
// IMAGE COMPRESSION
// =========================
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
   WAIT FOR AUTH FIRST
========================= */

onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  loadClients(user.uid);

});

/* =========================
   LOAD CLIENTS
========================= */

async function loadClients(uid) {

  if (!uid) return;

  const table = document.getElementById("clientsTable");
  table.innerHTML = "";

  const querySnapshot = await getDocs(
    collection(db, "users", uid, "clients")
  );

  if (querySnapshot.empty) {
    table.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:40px;">
          <div style="font-size:18px;margin-bottom:10px;">
            ابدأ بإضافة أول موكل وابدأ إدارة قضاياك باحتراف
          </div>
          <a href="add-client.html">
            <button class="add-main-btn">➕ إضافة موكل</button>
          </a>
        </td>
      </tr>
    `;
    return;
  }

  querySnapshot.forEach(docSnap => {

    const c = docSnap.data();
    const id = docSnap.id;

    table.innerHTML += `
      <tr>
        <td>${c.name}</td>
        <td>${c.nationalId || "-"}</td>
        <td>${c.powerOfAttorney || "-"}</td>
        <td>${c.phone}</td>
        <td>${c.altPhone || "-"}</td>
        <td>${c.address || "-"}</td>
        <td>
          <button class="action-btn" onclick="viewAttachments('${id}')">📎</button>
          <button class="action-btn edit" onclick="editClient('${id}')">✏️</button>
          <button class="action-btn delete" onclick="deleteClient('${id}')">🗑️</button>
        </td>
      </tr>
    `;
  });
}

/* =========================
   DELETE CLIENT
========================= */

window.deleteClient = async function(id) {

  const user = auth.currentUser;
  if (!user) return;

  if (!confirm("هل تريد حذف الموكل؟")) return;

  await deleteDoc(doc(db, "users", user.uid, "clients", id));

  loadClients(user.uid);
};

/* =========================
   EDIT CLIENT
========================= */

window.editClient = function(id) {
  localStorage.setItem("editClientId", id);
  window.location.href = "add-client.html";
};

/* =========================
   VIEW ATTACHMENTS
========================= */

window.viewAttachments = async function(id) {

  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid, "clients", id));
  if (!snap.exists()) return;

  const data = snap.data();
  const attachments = data.attachments || {};

  const modal = document.getElementById("attachmentModal");
  const body = document.getElementById("attachmentBody");

  body.innerHTML = "<h2>مرفقات الموكل</h2>";

  if (attachments.nationalIdImage) {
    body.innerHTML += `
      <h3>صورة البطاقة</h3>
    <img src="${attachments.nationalIdImage.url || attachments.nationalIdImage}">
    <button onclick="deleteAttachment('${id}','nationalIdImage')">🗑 حذف</button>      
    <a href="${attachments.nationalIdImage}" target="_blank">⬇ تحميل الصورة</a>
    `;
  }

  if (attachments.powerOfAttorneyFile) {
    body.innerHTML += `
      <h3>ملف التوكيل</h3>
      <a href="${attachments.powerOfAttorneyFile.url || attachments.powerOfAttorneyFile}" target="_blank">📄 فتح الملف</a>
      <button onclick="deleteAttachment('${id}','powerOfAttorneyFile')">🗑 حذف</button>    `;
  }

  if (attachments.files && attachments.files.length) {
    body.innerHTML += `<h3>مرفقات إضافية</h3>`;
      attachments.files.forEach((f,index) => {
        body.innerHTML += `
          <a href="${f.url}" target="_blank">📎 ${f.name}</a>
          <button onclick="deleteAttachment('${id}','extra',${index})">🗑 حذف</button>
        `;
      });  
    }

  if (!attachments.nationalIdImage &&
      !attachments.powerOfAttorneyFile &&
      (!attachments.files || !attachments.files.length)) {
    body.innerHTML += "<p>لا يوجد مرفقات</p>";
  }

  modal.style.display = "flex";
};

window.closeAttachmentModal = function() {
  document.getElementById("attachmentModal").style.display = "none";
};
import { ref, deleteObject }
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

window.deleteAttachment = async function(clientId, type, index = null) {

  if (!confirm("هل تريد حذف المرفق؟")) return;

  const user = auth.currentUser;
  if (!user) return;

  const clientRef = doc(db, "users", user.uid, "clients", clientId);
  const snap = await getDoc(clientRef);

  if (!snap.exists()) return;

  const data = snap.data();
  let attachments = data.attachments || {};

  try {

    if (type === "nationalIdImage") {

      if (attachments.nationalIdImage?.path) {
        await deleteObject(ref(storage, attachments.nationalIdImage.path));
      }

      delete attachments.nationalIdImage;
    }

    if (type === "powerOfAttorneyFile") {

      if (attachments.powerOfAttorneyFile?.path) {
        await deleteObject(ref(storage, attachments.powerOfAttorneyFile.path));
      }

      delete attachments.powerOfAttorneyFile;
    }

    if (type === "extra") {

      const file = attachments.files[index];

      if (file?.path) {
        await deleteObject(ref(storage, file.path));
      }

      attachments.files.splice(index,1);
    }

    await updateDoc(clientRef, { attachments });

    alert("تم حذف المرفق");

    viewAttachments(clientId);

  } catch (err) {

    console.error(err);
    alert("حدث خطأ أثناء الحذف");

  }
};