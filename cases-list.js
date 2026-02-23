import { db } from "./firebase.js";
import { initAuthGuard, getUid } from "./authGuard.js";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import {
  ref,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

import { storage } from "./firebase.js";

let ALL_CASES = [];

/* =========================
   START AFTER AUTH
========================= */

initAuthGuard(async () => {
  await loadCases();
});

/* =========================
   LOAD CASES FROM FIRESTORE
========================= */

async function loadCases() {

  const uid = getUid();
  if (!uid) return;

  const snapshot = await getDocs(collection(db, "users", uid, "cases"));

  ALL_CASES = [];

  snapshot.forEach(docSnap => {
    ALL_CASES.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  renderCases(ALL_CASES);
}

/* =========================
   RENDER TABLE
========================= */

function renderCases(data) {

  const table = document.getElementById("casesTable");
  table.innerHTML = "";

  if (!data.length) {
    table.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:40px;">
          <div style="font-size:18px;margin-bottom:10px;">
            ابدأ بإضافة أول قضية وابدأ تنظيم شغلك القانوني
          </div>
          <a href="add-case.html">
            <button class="add-main-btn">➕ إضافة قضية</button>
          </a>
        </td>
      </tr>
    `;
    return;
  }

  data.forEach(c => {

    // استخراج سنة الدعوى بشكل آمن
    let year = "-";

    if (c.caseYear) {
      year = c.caseYear;
    } 
    else if (c.createdAt) {

      // لو Timestamp من فايربيز
      if (typeof c.createdAt === "object" && c.createdAt.seconds) {
        year = new Date(c.createdAt.seconds * 1000).getFullYear();
      }
      // لو ISO string
      else if (typeof c.createdAt === "string") {
        year = new Date(c.createdAt).getFullYear();
      }
    }

    table.innerHTML += `
      <tr class="case-row" onclick="openCase('${c.id}')">
        <td>${c.caseNumber || "-"}</td>
        <td>${year}</td>
        <td>${c.clientName || "-"}</td>
        <td>${c.court || "-"}</td>
        <td>${c.caseType || "-"}</td>
        <td>${c.status || "-"}</td>
        <td>
          <button class="action-btn edit" onclick="event.stopPropagation(); editCase('${c.id}')">✏️</button>
          <button class="action-btn delete" onclick="event.stopPropagation(); deleteCase('${c.id}')">🗑️</button>
        </td>
      </tr>
    `;
  });

}
/* =========================
   STATUS FILTER
========================= */

document.querySelectorAll(".filter-btn").forEach(btn => {

  btn.addEventListener("click", () => {

    // تفعيل الزر المختار بصريًا
    document.querySelectorAll(".filter-btn")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    const value = btn.dataset.filter;

    if (value === "all") {
      renderCases(ALL_CASES);
      return;
    }

    const filtered = ALL_CASES.filter(c =>
      c.status === value || c.stage === value
    );

    renderCases(filtered);
  });

});
/* =========================
   SEARCH
========================= */

let CURRENT_FILTER = "all";

/* STATUS FILTER */
document.querySelectorAll(".filter-btn").forEach(btn => {

  btn.addEventListener("click", () => {

    document.querySelectorAll(".filter-btn")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    CURRENT_FILTER = btn.dataset.filter;

    applyFilters();
  });

});

/* SEARCH */
document.getElementById("searchInput")
  .addEventListener("input", applyFilters);


/* APPLY BOTH FILTERS */
function applyFilters(){

  const searchValue =
    document.getElementById("searchInput").value.toLowerCase();

  let data = ALL_CASES;

  // فلتر الحالة
  if (CURRENT_FILTER !== "all") {
    data = data.filter(c =>
      c.status === CURRENT_FILTER || c.stage === CURRENT_FILTER
    );
  }

  // فلتر البحث
  if (searchValue) {
    data = data.filter(c =>
      c.caseNumber?.toLowerCase().includes(searchValue) ||
      c.clientName?.toLowerCase().includes(searchValue) ||
      c.court?.toLowerCase().includes(searchValue)
    );
  }

  renderCases(data);
}
/* =========================
   EDIT
========================= */

window.editCase = function(id) {
  localStorage.setItem("editCaseId", id);
  window.location.href = "add-case.html";
};
window.viewCase = function(id) {
  window.location.href = `case-details.html?id=${id}`;
};
/* =========================
   DELETE CASE
========================= */

window.deleteCase = async function(id) {

  if (!confirm("هل تريد حذف القضية؟")) return;

  const uid = getUid();
  if (!uid) return;

  await deleteDoc(doc(db, "users", uid, "cases", id));

  loadCases();
};

/* =========================
   VIEW ATTACHMENTS
========================= */

window.viewCaseAttachments = async function(id) {

  const uid = getUid();
  if (!uid) return;

  const snap = await getDoc(doc(db, "users", uid, "cases", id));
  if (!snap.exists()) return;

  const data = snap.data();
  const attachments = data.attachments || {};

  let html = `
    <div id="caseModal" style="
      position:fixed;
      top:0;
      left:0;
      width:100%;
      height:100%;
      background:rgba(0,0,0,0.8);
      display:flex;
      justify-content:center;
      align-items:center;
      z-index:9999;
    ">
      <div style="
        background:#1e1e1e;
        padding:25px;
        border-radius:12px;
        width:90%;
        max-width:700px;
        max-height:90%;
        overflow:auto;
        color:white;
        position:relative;
      ">
        <span onclick="document.getElementById('caseModal').remove()"
          style="position:absolute;right:15px;top:10px;font-size:24px;cursor:pointer;">×</span>
        <h2>مرفقات القضية</h2>
  `;

  if (attachments.files && attachments.files.length) {

    attachments.files.forEach((f,index) => {

      html += `
        <div style="margin:15px 0;">
          <a href="${f.url}" target="_blank">📎 ${f.name}</a>
          <button onclick="deleteCaseAttachment('${id}',${index})"
            style="margin-right:10px;">🗑 حذف</button>
        </div>
      `;
    });

  } else {

    html += `<p>لا يوجد مرفقات</p>`;

  }

  html += `</div></div>`;

  document.body.insertAdjacentHTML("beforeend", html);
};

/* =========================
   DELETE ATTACHMENT
========================= */

window.deleteCaseAttachment = async function(caseId,index) {

  if (!confirm("هل تريد حذف المرفق؟")) return;

  const uid = getUid();
  if (!uid) return;

  const caseRef = doc(db, "users", uid, "cases", caseId);
  const snap = await getDoc(caseRef);
  if (!snap.exists()) return;

  const data = snap.data();
  let attachments = data.attachments || {};

  const file = attachments.files[index];

  try {

    if (file?.path) {
      await deleteObject(ref(storage, file.path));
    }

    attachments.files.splice(index,1);

    await updateDoc(caseRef, { attachments });

    document.getElementById("caseModal").remove();
    viewCaseAttachments(caseId);

  } catch(err) {

    console.error(err);
    alert("حدث خطأ أثناء حذف المرفق");

  }
};
window.openCase = function(id) {
  window.location.href = `case-details.html?id=${id}`;
};
