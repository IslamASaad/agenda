import { db } from "./firebase.js";
import { initAuthGuard, getUid } from "./authGuard.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } 
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

/* ELEMENTS */

const imageInput = document.getElementById("imageInput");
const profileImage = document.getElementById("profileImage");
const changeImageBtn = document.getElementById("changeImageBtn");

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const officeNameInput = document.getElementById("officeName");
const officeAddressInput = document.getElementById("officeAddress");
const barNumberInput = document.getElementById("barNumber");
const specializationInput = document.getElementById("specialization");
const saveBtn = document.getElementById("saveBtn");

const storage = getStorage();

/* IMAGE CHANGE */

if (changeImageBtn && imageInput) {
  changeImageBtn.addEventListener("click", () => {
    imageInput.click();
  });
}

/* IMAGE UPLOAD */

if (imageInput) {
  imageInput.addEventListener("change", async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const uid = getUid();
    if (!uid) return;

    const imageRef = ref(storage, `users/${uid}/profile.jpg`);

    await uploadBytes(imageRef, file);

    const downloadURL = await getDownloadURL(imageRef);

    if (profileImage) {
      profileImage.src = downloadURL;
    }

    const profileRef = doc(db, "users", uid, "profile", "main");

    await setDoc(profileRef, {
      photoURL: downloadURL
    }, { merge: true });

  });
}

/* LOAD PROFILE */

initAuthGuard(async () => {
  await loadProfile();
});

async function loadProfile() {

  const uid = getUid();
  if (!uid) return;

  const profileRef = doc(db, "users", uid, "profile", "main");
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) return;

  const data = snapshot.data();

  if (nameInput) nameInput.value = data.name || "";
  if (phoneInput) phoneInput.value = data.phone || "";
  if (emailInput) emailInput.value = data.email || "";
  if (officeNameInput) officeNameInput.value = data.officeName || "";
  if (officeAddressInput) officeAddressInput.value = data.officeAddress || "";
  if (barNumberInput) barNumberInput.value = data.barNumber || "";
  if (specializationInput) specializationInput.value = data.specialization || "";

  if (profileImage && data.photoURL) {
    profileImage.src = data.photoURL;
  }
}

/* SAVE PROFILE */

if (saveBtn) {
  saveBtn.addEventListener("click", async () => {

    const uid = getUid();
    if (!uid) return;

    const profileRef = doc(db, "users", uid, "profile", "main");

    await setDoc(profileRef, {
      name: nameInput?.value || "",
      phone: phoneInput?.value || "",
      email: emailInput?.value || "",
      officeName: officeNameInput?.value || "",
      officeAddress: officeAddressInput?.value || "",
      barNumber: barNumberInput?.value || "",
      specialization: specializationInput?.value || ""
    }, { merge: true });

    alert("تم حفظ البيانات بنجاح ✅");
  });
}